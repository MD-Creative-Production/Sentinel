/** A single observed call/interaction against a monitored contract. */
export interface ContractCallEvent {
  /** The contract address that was called. */
  contractAddress: string;
  /** ISO-8601 timestamp of the call. Defaults to now if omitted. */
  timestamp?: string;
  /** Transaction hash associated with this call, if known. */
  txHash?: string;
  /** Network the call occurred on. */
  network?: string;
}

/**
 * Frequency-monitoring configuration for a contract (or the global default).
 */
export interface FrequencyThresholdConfig {
  /** Size of the sliding window used to count calls, in milliseconds. */
  windowMs: number;
  /** Absolute cap on calls within one window before an alert fires. */
  maxCallsPerWindow: number;
  /** How many past closed windows to retain for the rolling baseline. */
  baselineWindowCount: number;
  /**
   * How many times above the rolling baseline average the current window's
   * count must be to be considered a spike.
   */
  baselineSpikeMultiplier: number;
}

/** Which detection rule triggered a given alert. */
export type FrequencyAlertReason = 'threshold_exceeded' | 'baseline_spike';

/** An alert generated when a contract's call frequency looks abnormal. */
export interface FrequencyAlert {
  /** Unique alert identifier. */
  id: string;
  /** Brief title for the alert. */
  title: string;
  /** Detailed description of the detected activity. */
  description: string;
  /** Alert severity. */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** ISO-8601 timestamp of when the alert was generated. */
  timestamp: string;
  /** Structured context/metadata about the detection. */
  metadata: {
    contractAddress: string;
    reason: FrequencyAlertReason;
    /** Number of calls observed in the current (still-open) window. */
    callCount: number;
    windowMs: number;
    /** Absolute threshold in effect at detection time. */
    threshold: number;
    /** Rolling baseline average, present only for `baseline_spike` alerts. */
    baselineAverage?: number;
  };
}
