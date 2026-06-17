export interface SpikeDetectionConfig {
  /** Rolling window length in milliseconds used to count transactions. */
  windowMs: number;
  /** How many multiples of the baseline triggers a spike alert (e.g. 3 = 3×). */
  multiplierThreshold: number;
  /** Absolute minimum transaction count before spike logic activates. */
  minBaselineCount: number;
}

export interface ContractActivityRecord {
  contractAddress: string;
  timestamps: number[]; // epoch ms of each observed transaction
}

export interface SpikeAlert {
  contractAddress: string;
  detectedAt: string; // ISO-8601
  currentCount: number;
  baselineCount: number;
  multiplier: number;
  severity: 'medium' | 'high' | 'critical';
}
