/**
 * src/modules/reputation/services/risk-indicator.service.ts
 *
 * Responsible ONLY for detecting risk indicators from raw wallet data.
 * It does not know anything about scoring/weights — that belongs to
 * ReputationCalculatorService. Keeping detection and scoring separate
 * makes it easy to add new indicators without touching the math.
 */
import { Inject, Injectable } from '@nestjs/common';
import { RiskIndicatorSeverity } from '../constants/reputation.constants';
import {
  RiskIndicator,
  WalletActivitySnapshot,
  WalletIncidentSummary,
} from '../interfaces/reputation.interfaces';

/**
 * Injected in reputation.module.ts. Wraps whatever sanctioned/flagged
 * address list the platform already maintains (e.g. under
 * src/modules/behavioral-analysis or an external OFAC/Chainalysis feed).
 * Implement this against the real service when wiring the module up.
 */
export interface SanctionsListProvider {
  isSanctioned(walletAddress: string): Promise<boolean>;
  isKnownMixer(walletAddress: string): Promise<boolean>;
  isFlaggedContract(walletAddress: string, chainId: string): Promise<boolean>;
}

export const SANCTIONS_LIST_PROVIDER = 'SANCTIONS_LIST_PROVIDER';

@Injectable()
export class RiskIndicatorService {
  constructor(
    // Consumers must provide a SanctionsListProvider under this token;
    // see reputation.module.ts for the wiring.
    @Inject(SANCTIONS_LIST_PROVIDER)
    private readonly sanctionsProvider: SanctionsListProvider,
  ) {}

  async detect(
    activity: WalletActivitySnapshot,
    incidents: WalletIncidentSummary,
  ): Promise<RiskIndicator[]> {
    const indicators: RiskIndicator[] = [];
    const now = new Date();

    if (await this.sanctionsProvider.isSanctioned(activity.walletAddress)) {
      indicators.push({
        code: 'SANCTIONED_LIST_MATCH',
        description: 'Wallet address matches an entry on a sanctions/watch list.',
        severity: RiskIndicatorSeverity.CRITICAL,
        detectedAt: now,
      });
    }

    if (await this.sanctionsProvider.isKnownMixer(activity.walletAddress)) {
      indicators.push({
        code: 'MIXER_INTERACTION',
        description: 'Wallet has interacted with a known mixing/tumbling service.',
        severity: RiskIndicatorSeverity.HIGH,
        detectedAt: now,
      });
    }

    for (const counterparty of activity.counterpartyAddresses) {
      if (await this.sanctionsProvider.isFlaggedContract(counterparty, activity.chainId)) {
        indicators.push({
          code: 'FLAGGED_CONTRACT_INTERACTION',
          description: `Wallet interacted with flagged contract ${counterparty}.`,
          severity: RiskIndicatorSeverity.MEDIUM,
          detectedAt: now,
          metadata: { counterparty },
        });
        break; // one flag is enough signal; avoid indicator spam per counterparty
      }
    }

    if (incidents.confirmedFraudCases > 0) {
      indicators.push({
        code: 'CONFIRMED_FRAUD_HISTORY',
        description: `Wallet is linked to ${incidents.confirmedFraudCases} confirmed fraud case(s).`,
        severity: RiskIndicatorSeverity.CRITICAL,
        detectedAt: now,
      });
    }

    if (incidents.openIncidents > 0) {
      indicators.push({
        code: 'OPEN_INCIDENT',
        description: `Wallet has ${incidents.openIncidents} open incident(s) under investigation.`,
        severity: RiskIndicatorSeverity.MEDIUM,
        detectedAt: now,
      });
    }

    if (activity.totalTransactions === 0) {
      indicators.push({
        code: 'DORMANT_WALLET',
        description: 'Wallet has no recorded on-chain transactions.',
        severity: RiskIndicatorSeverity.LOW,
        detectedAt: now,
      });
    } else if (activity.activeDaysLast90 === 0) {
      indicators.push({
        code: 'INACTIVE_90D',
        description: 'Wallet has had no activity in the last 90 days.',
        severity: RiskIndicatorSeverity.INFO,
        detectedAt: now,
      });
    }

    return indicators;
  }
}
