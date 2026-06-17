import { Injectable, Logger } from '@nestjs/common';
import {
  ContractActivityRecord,
  SpikeAlert,
  SpikeDetectionConfig,
} from './interfaces/spike-detection.interface';

const DEFAULT_CONFIG: SpikeDetectionConfig = {
  windowMs: 60_000,      // 1-minute rolling window
  multiplierThreshold: 3, // alert when count > 3× baseline
  minBaselineCount: 5,    // ignore noise below this floor
};

@Injectable()
export class SpikeDetectionService {
  private readonly logger = new Logger(SpikeDetectionService.name);
  private readonly activity = new Map<string, ContractActivityRecord>();
  private readonly config: SpikeDetectionConfig;

  constructor(config: Partial<SpikeDetectionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Record a transaction for a contract.
   * Returns a SpikeAlert when a spike is detected, otherwise null.
   */
  recordTransaction(contractAddress: string, timestampMs = Date.now()): SpikeAlert | null {
    const record = this.activity.get(contractAddress) ?? {
      contractAddress,
      timestamps: [],
    };

    record.timestamps.push(timestampMs);
    this.activity.set(contractAddress, record);

    return this.evaluate(record, timestampMs);
  }

  /**
   * Returns all current activity records (for inspection / testing).
   */
  getActivity(contractAddress: string): ContractActivityRecord | undefined {
    return this.activity.get(contractAddress);
  }

  /** Expose resolved config so callers can verify thresholds. */
  getConfig(): SpikeDetectionConfig {
    return { ...this.config };
  }

  // ─── private ──────────────────────────────────────────────────────────────

  private evaluate(record: ContractActivityRecord, now: number): SpikeAlert | null {
    const { windowMs, multiplierThreshold, minBaselineCount } = this.config;

    // Purge stale timestamps older than 2× the window (keeps memory bounded)
    record.timestamps = record.timestamps.filter(t => t > now - windowMs * 2);

    const currentCount = record.timestamps.filter(t => t > now - windowMs).length;
    const baselineCount = record.timestamps.filter(
      t => t > now - windowMs * 2 && t <= now - windowMs,
    ).length;

    if (baselineCount < minBaselineCount) return null;

    const multiplier = currentCount / baselineCount;
    if (multiplier < multiplierThreshold) return null;

    const alert: SpikeAlert = {
      contractAddress: record.contractAddress,
      detectedAt: new Date(now).toISOString(),
      currentCount,
      baselineCount,
      multiplier: Math.round(multiplier * 100) / 100,
      severity: multiplier >= 10 ? 'critical' : multiplier >= 5 ? 'high' : 'medium',
    };

    this.logger.warn(
      `Spike detected on ${record.contractAddress}: ${currentCount} txs vs baseline ${baselineCount} (${alert.multiplier}×) — ${alert.severity}`,
    );

    return alert;
  }
}
