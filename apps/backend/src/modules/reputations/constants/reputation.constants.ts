/**
 * src/modules/reputation/constants/reputation.constants.ts
 *
 * Central place for every magic number used by the reputation engine.
 * Keeping these here (instead of scattered through the services) makes
 * the scoring model auditable and easy to tune without touching logic.
 */

/** Composite score is always normalized to this range. */
export const REPUTATION_SCORE_MIN = 0;
export const REPUTATION_SCORE_MAX = 100;

/**
 * Relative weight of each factor in the final composite score.
 * Must sum to 1 — enforced by a unit test in reputation.service.spec.ts.
 */
export const REPUTATION_WEIGHTS = {
  walletAge: 0.15,
  activityConsistency: 0.2,
  riskIndicators: 0.35,
  incidentHistory: 0.2,
  networkAssociation: 0.1,
} as const;

/** How long a computed score is considered fresh before a recalculation is due. */
export const REPUTATION_SCORE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

/** Trust tiers derived from the final composite score. */
export enum ReputationTier {
  TRUSTED = 'TRUSTED',
  NEUTRAL = 'NEUTRAL',
  SUSPICIOUS = 'SUSPICIOUS',
  HIGH_RISK = 'HIGH_RISK',
}

export const REPUTATION_TIER_THRESHOLDS: { tier: ReputationTier; min: number }[] = [
  { tier: ReputationTier.TRUSTED, min: 75 },
  { tier: ReputationTier.NEUTRAL, min: 50 },
  { tier: ReputationTier.SUSPICIOUS, min: 25 },
  { tier: ReputationTier.HIGH_RISK, min: 0 },
];

/** Severity levels used by individual risk indicators. */
export enum RiskIndicatorSeverity {
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

/** Point deduction applied to the risk-indicator sub-score per severity hit. */
export const RISK_SEVERITY_PENALTY: Record<RiskIndicatorSeverity, number> = {
  [RiskIndicatorSeverity.INFO]: 0,
  [RiskIndicatorSeverity.LOW]: 5,
  [RiskIndicatorSeverity.MEDIUM]: 15,
  [RiskIndicatorSeverity.HIGH]: 30,
  [RiskIndicatorSeverity.CRITICAL]: 50,
};

/** Max number of hops used when walking the wallet's association graph. */
export const NETWORK_ANALYSIS_MAX_HOPS = 2;

/** Max number of historical snapshots returned by default in the history endpoint. */
export const DEFAULT_HISTORY_PAGE_SIZE = 20;
export const MAX_HISTORY_PAGE_SIZE = 100;
