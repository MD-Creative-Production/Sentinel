import { Severity } from '../../ai/interfaces/threat-summary.interface';

export interface BalanceSnapshot {
  address: string;
  balance: number;
  timestamp: string;
}

export interface DrainingEvent {
  id: string;
  address: string;
  /** Balance at the start of the observation window. */
  openingBalance: number;
  /** Balance at the time draining was detected. */
  closingBalance: number;
  /** Absolute amount drained. */
  amountDrained: number;
  /** Fraction drained: amountDrained / openingBalance */
  drainRatio: number;
  /** Milliseconds the drain took. */
  durationMs: number;
  detectedAt: string;
  severity: Severity;
  alert: DrainingAlert;
}

export interface DrainingAlert {
  title: string;
  description: string;
  severity: Severity;
  indicators: string[];
  recommendedActions: string[];
}

export interface DrainingDetectorOptions {
  /**
   * Fraction of balance that must be drained within the window to trigger detection.
   * Default 0.5 (50 %).
   */
  drainThreshold?: number;
  /**
   * Maximum window (ms) within which a drain is evaluated.
   * Default 300_000 (5 minutes).
   */
  windowMs?: number;
  /** Injectable clock for deterministic tests. Defaults to Date.now. */
  now?: () => number;
}
