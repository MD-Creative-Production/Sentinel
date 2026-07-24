/**
 * src/modules/reputation/interfaces/reputation.interfaces.ts
 */
import { ReputationTier, RiskIndicatorSeverity } from '../constants/reputation.constants';

export interface RiskIndicator {
  code: string; // e.g. 'SANCTIONED_LIST_MATCH', 'MIXER_INTERACTION'
  description: string;
  severity: RiskIndicatorSeverity;
  detectedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface FactorScore {
  /** Raw score for this factor, normalized 0-100. */
  score: number;
  /** Weight applied when composing the final score. */
  weight: number;
  /** Human-readable notes explaining how the score was derived. */
  details: string[];
}

export interface ReputationBreakdown {
  walletAge: FactorScore;
  activityConsistency: FactorScore;
  riskIndicators: FactorScore;
  incidentHistory: FactorScore;
  networkAssociation: FactorScore;
}

export interface ReputationScoreResult {
  walletAddress: string;
  chainId: string;
  score: number;
  tier: ReputationTier;
  breakdown: ReputationBreakdown;
  indicators: RiskIndicator[];
  calculatedAt: Date;
}

/**
 * Minimal shape expected from the wallet's on-chain activity history.
 * Populated by ChainsService / integrations module — see reputation.repository.ts.
 */
export interface WalletActivitySnapshot {
  walletAddress: string;
  chainId: string;
  firstSeenAt: Date | null;
  lastSeenAt: Date | null;
  totalTransactions: number;
  activeDaysLast90: number;
  counterpartyAddresses: string[];
}

/**
 * Minimal shape expected from the cases/incidents modules for a wallet.
 */
export interface WalletIncidentSummary {
  walletAddress: string;
  openIncidents: number;
  resolvedIncidents: number;
  confirmedFraudCases: number;
  lastIncidentAt: Date | null;
}
