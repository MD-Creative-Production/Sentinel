export interface ScoringFactorConfig {
  factorId: string;
  name: string;
  weight: number; // Relative importance multiplier
  maxContribution: number; // Caps the total deduction value for this metric
  enabled: boolean;
}

export interface FactorInputMetrics {
  factorId: string;
  rawCount: number; // Total alerts or failures tracked
  severityMultiplier: number;
}

export interface FactorResult {
  factorId: string;
  name: string;
  rawDeduction: number;
  weightedDeduction: number;
}

export interface PostureScoreBreakdown {
  organizationId: string;
  timestamp: Date;
  overallScore: number;
  factors: FactorResult[];
  calculationVersion: string;
}
