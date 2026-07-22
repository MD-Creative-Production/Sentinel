/**
 * src/modules/reputation/reputation.service.ts
 *
 * Orchestrates: pull wallet activity + incident data -> detect risk
 * indicators -> compute weighted composite score -> persist snapshot.
 *
 * NOTE: `ChainDataProvider` and `IncidentDataProvider` are thin
 * integration ports. Wire them to the real ChainsService /
 * IncidentsService (or the `integrations` module) in reputation.module.ts.
 * They're kept as injectable interfaces here so this module has no hard
 * compile-time dependency on the internals of sibling modules.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ReputationRepository } from './repository/reputation.repository';
import { RiskIndicatorService } from './services/risk-indicator.service';
import { ReputationCalculatorService } from './services/reputation-calculator.service';
import {
  ReputationScoreResult,
  WalletActivitySnapshot,
  WalletIncidentSummary,
} from './interfaces/reputation.interfaces';
import { REPUTATION_SCORE_TTL_MS, ReputationTier } from './constants/reputation.constants';

export interface ChainDataProvider {
  getActivitySnapshot(walletAddress: string, chainId: string): Promise<WalletActivitySnapshot>;
}

export interface IncidentDataProvider {
  getIncidentSummary(walletAddress: string): Promise<WalletIncidentSummary>;
}

export const CHAIN_DATA_PROVIDER = 'CHAIN_DATA_PROVIDER';
export const INCIDENT_DATA_PROVIDER = 'INCIDENT_DATA_PROVIDER';

@Injectable()
export class ReputationService {
  private readonly logger = new Logger(ReputationService.name);

  constructor(
    private readonly repository: ReputationRepository,
    private readonly riskIndicatorService: RiskIndicatorService,
    private readonly calculator: ReputationCalculatorService,
    @Inject(CHAIN_DATA_PROVIDER)
    private readonly chainDataProvider: ChainDataProvider,
    @Inject(INCIDENT_DATA_PROVIDER)
    private readonly incidentDataProvider: IncidentDataProvider,
  ) {}

  /**
   * Returns the most recent score for a wallet, computing a fresh one if
   * none exists yet or the cached one has expired the TTL window.
   */
  async getScore(walletAddress: string, chainId: string): Promise<ReputationScoreResult> {
    const cached = await this.repository.findLatest(walletAddress, chainId);

    if (cached && this.isFresh(cached.calculatedAt)) {
      return this.toResult(cached);
    }

    return this.recalculate(walletAddress, chainId);
  }

  /**
   * Forces a fresh calculation, persists a new snapshot, and returns it.
   * Used by the manual recalculation endpoint and by scheduled jobs.
   */
  async recalculate(walletAddress: string, chainId: string): Promise<ReputationScoreResult> {
    this.logger.log(`Calculating reputation score for ${walletAddress} on ${chainId}`);

    const [activity, incidents] = await Promise.all([
      this.chainDataProvider.getActivitySnapshot(walletAddress, chainId),
      this.incidentDataProvider.getIncidentSummary(walletAddress),
    ]);

    const indicators = await this.riskIndicatorService.detect(activity, incidents);

    // Network association currently defaults to neutral (see
    // ReputationCalculatorService.scoreNetworkAssociation). Wiring in a
    // real counterparty-graph lookup is tracked as a follow-up — see PR
    // description "Out of scope / follow-ups".
    const networkRiskAverage: number | null = null;

    const breakdown = this.calculator.composeBreakdown(
      activity,
      incidents,
      indicators,
      networkRiskAverage,
    );
    const score = this.calculator.composeFinalScore(breakdown);
    const tier = this.calculator.tierForScore(score);

    const result: ReputationScoreResult = {
      walletAddress,
      chainId,
      score,
      tier,
      breakdown,
      indicators,
      calculatedAt: new Date(),
    };

    await this.repository.saveSnapshot(result);

    return result;
  }

  async getHistory(walletAddress: string, chainId: string | undefined, limit: number, offset: number) {
    return this.repository.findHistory(walletAddress, chainId, limit, offset);
  }

  async listByTier(tier: ReputationTier, chainId?: string, limit?: number) {
    return this.repository.findByTier(tier, chainId, limit);
  }

  private isFresh(calculatedAt: Date): boolean {
    return Date.now() - new Date(calculatedAt).getTime() < REPUTATION_SCORE_TTL_MS;
  }

  private toResult(record: any): ReputationScoreResult {
    return {
      walletAddress: record.walletAddress,
      chainId: record.chainId,
      score: record.score,
      tier: record.tier,
      breakdown: record.breakdown,
      indicators: record.indicators,
      calculatedAt: record.calculatedAt,
    };
  }
}
