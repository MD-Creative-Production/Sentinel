/** Individual scoring factor with a name, weight (0–1), and raw value (0–100). */
export interface ScoringFactor {
  name: string;
  weight: number;
  value: number;
  /** Weighted contribution: value * weight */
  weightedScore: number;
}

/** A single point-in-time security posture snapshot. */
export interface PostureSnapshot {
  /** ISO 8601 timestamp when the snapshot was recorded. */
  recordedAt: string;
  /** Overall weighted score, 0–100. */
  score: number;
}

/** Full security posture response including score, factors, and history. */
export interface SecurityPostureResult {
  /** ISO 8601 timestamp of this calculation. */
  calculatedAt: string;
  /** Overall weighted security score, 0–100. Higher is better. */
  score: number;
  /** Qualitative label derived from the score. */
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  /** Individual weighted factors that make up the score. */
  factors: ScoringFactor[];
  /** Historical snapshots ordered oldest → newest. */
  history: PostureSnapshot[];
  /** Simple trend relative to the previous snapshot. */
  trend: 'improving' | 'stable' | 'degrading';
}
