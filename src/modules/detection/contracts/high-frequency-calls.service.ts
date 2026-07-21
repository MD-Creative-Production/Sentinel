import {
  ContractCallEvent,
  FrequencyAlert,
  FrequencyAlertReason,
  FrequencyThresholdConfig,
} from './interfaces/high-frequency-calls.interface';

const DEFAULT_THRESHOLD: FrequencyThresholdConfig = {
  windowMs: 60_000,
  maxCallsPerWindow: 50,
  baselineWindowCount: 5,
  baselineSpikeMultiplier: 3,
};

/**
 * Detects abnormal spikes in per-contract call activity.
 *
 * Two independent detection rules run on every recorded call:
 *  - Threshold: the current window's call count exceeds a configurable
 *    absolute cap.
 *  - Baseline: the current window's call count exceeds a configurable
 *    multiple of the rolling average of recent closed windows.
 */
export class HighFrequencyContractCallsService {
  private thresholds = new Map<string, FrequencyThresholdConfig>();
  /** Timestamps (ms epoch) of calls within the current, still-open window. */
  private callTimestamps = new Map<string, number[]>();
  /** Call counts of recently closed windows, oldest first. */
  private windowHistory = new Map<string, number[]>();
  /** Start time (ms epoch) of the current window. */
  private windowStart = new Map<string, number>();
  private alertCallbacks: Array<(alert: FrequencyAlert) => void> = [];

  constructor(private readonly defaultThreshold: FrequencyThresholdConfig = DEFAULT_THRESHOLD) {}

  /** Set a per-contract threshold configuration, overriding the default. */
  public setThreshold(contractAddress: string, config: Partial<FrequencyThresholdConfig>): void {
    const current = this.getThreshold(contractAddress);
    this.thresholds.set(contractAddress, { ...current, ...config });
  }

  /** The effective threshold configuration for a contract (or the default). */
  public getThreshold(contractAddress: string): FrequencyThresholdConfig {
    return this.thresholds.get(contractAddress) ?? this.defaultThreshold;
  }

  /**
   * Record an observed contract call, rolling the sliding window forward if
   * needed, and running both detection rules against the updated count.
   * Returns the generated alert, or `null` if activity looks normal.
   */
  public recordCall(event: ContractCallEvent): FrequencyAlert | null {
    const { contractAddress } = event;
    const now = event.timestamp ? new Date(event.timestamp).getTime() : Date.now();
    const config = this.getThreshold(contractAddress);

    this.rollWindowIfNeeded(contractAddress, now, config);

    const timestamps = this.callTimestamps.get(contractAddress) ?? [];
    timestamps.push(now);
    this.callTimestamps.set(contractAddress, timestamps);

    const callCount = timestamps.length;

    if (callCount > config.maxCallsPerWindow) {
      return this.raiseAlert(contractAddress, 'threshold_exceeded', callCount, config);
    }

    const baselineAverage = this.getBaselineAverage(contractAddress, config);
    if (baselineAverage !== null && callCount > baselineAverage * config.baselineSpikeMultiplier) {
      return this.raiseAlert(contractAddress, 'baseline_spike', callCount, config, baselineAverage);
    }

    return null;
  }

  /** Number of calls observed for a contract in the current, open window. */
  public getCallCount(contractAddress: string): number {
    return this.callTimestamps.get(contractAddress)?.length ?? 0;
  }

  /** Call counts of recently closed windows for a contract, oldest first. */
  public getWindowHistory(contractAddress: string): number[] {
    return [...(this.windowHistory.get(contractAddress) ?? [])];
  }

  /** Rolling baseline average across recently closed windows, or `null` if none yet. */
  public getBaselineAverage(
    contractAddress: string,
    config: FrequencyThresholdConfig = this.getThreshold(contractAddress),
  ): number | null {
    const history = this.windowHistory.get(contractAddress);
    if (!history || history.length === 0) {
      return null;
    }
    const recent = history.slice(-config.baselineWindowCount);
    return recent.reduce((sum, count) => sum + count, 0) / recent.length;
  }

  /** Clear all tracked state (threshold, counts, history) for a contract. */
  public clearContract(contractAddress: string): void {
    this.thresholds.delete(contractAddress);
    this.callTimestamps.delete(contractAddress);
    this.windowHistory.delete(contractAddress);
    this.windowStart.delete(contractAddress);
  }

  /** Subscribe to generated alerts. Returns an unsubscribe function. */
  public onAlert(callback: (alert: FrequencyAlert) => void): () => void {
    this.alertCallbacks.push(callback);
    return () => {
      this.alertCallbacks = this.alertCallbacks.filter(cb => cb !== callback);
    };
  }

  private rollWindowIfNeeded(
    contractAddress: string,
    now: number,
    config: FrequencyThresholdConfig,
  ): void {
    const start = this.windowStart.get(contractAddress);

    if (start === undefined) {
      this.windowStart.set(contractAddress, now);
      return;
    }

    if (now - start >= config.windowMs) {
      const closedCount = this.callTimestamps.get(contractAddress)?.length ?? 0;
      const history = this.windowHistory.get(contractAddress) ?? [];
      history.push(closedCount);
      while (history.length > config.baselineWindowCount) {
        history.shift();
      }
      this.windowHistory.set(contractAddress, history);

      this.callTimestamps.set(contractAddress, []);
      this.windowStart.set(contractAddress, now);
    }
  }

  private raiseAlert(
    contractAddress: string,
    reason: FrequencyAlertReason,
    callCount: number,
    config: FrequencyThresholdConfig,
    baselineAverage?: number,
  ): FrequencyAlert {
    const description =
      reason === 'threshold_exceeded'
        ? `Contract ${contractAddress} received ${callCount} calls in the last ${config.windowMs}ms window, exceeding the configured cap of ${config.maxCallsPerWindow}.`
        : `Contract ${contractAddress} received ${callCount} calls in the last ${config.windowMs}ms window, ${(callCount / (baselineAverage ?? 1)).toFixed(1)}x its rolling baseline of ${(baselineAverage ?? 0).toFixed(1)}.`;

    const alert: FrequencyAlert = {
      id: `alert-hfc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: 'High-Frequency Contract Call Activity Detected',
      description,
      severity: reason === 'threshold_exceeded' ? 'critical' : 'high',
      timestamp: new Date().toISOString(),
      metadata: {
        contractAddress,
        reason,
        callCount,
        windowMs: config.windowMs,
        threshold: config.maxCallsPerWindow,
        ...(baselineAverage !== undefined && { baselineAverage }),
      },
    };

    this.emitAlert(alert);
    return alert;
  }

  private emitAlert(alert: FrequencyAlert): void {
    for (const callback of this.alertCallbacks) {
      try {
        callback(alert);
      } catch (error) {
        // Prevent one faulty callback from aborting others
        console.error('Error in high-frequency contract call alert callback:', error);
      }
    }
  }
}
