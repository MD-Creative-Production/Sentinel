import { Severity } from '../../ai/interfaces/threat-summary.interface';
import {
  BalanceSnapshot,
  DrainingAlert,
  DrainingDetectorOptions,
  DrainingEvent,
} from './interfaces/draining.interface';

/**
 * Detects rapid asset draining events by monitoring wallet balance velocity.
 *
 * A drain is triggered when the balance drops by at least `drainThreshold`
 * fraction within a rolling `windowMs` window. Severity is escalated
 * automatically based on drain ratio and speed.
 */
export class DrainingService {
  private readonly drainThreshold: number;
  private readonly windowMs: number;
  private readonly now: () => number;

  /** Circular balance history per address (most recent last). */
  private readonly history = new Map<string, BalanceSnapshot[]>();
  private readonly detectedEvents: DrainingEvent[] = [];

  constructor(options: DrainingDetectorOptions = {}) {
    this.drainThreshold = options.drainThreshold ?? 0.5;
    this.windowMs = options.windowMs ?? 300_000;
    this.now = options.now ?? (() => Date.now());
  }

  // ─── Balance Recording ───────────────────────────────────────────────────

  /**
   * Record a new balance snapshot for a wallet address.
   * Automatically prunes snapshots outside the observation window and checks
   * for a draining event.
   *
   * @returns The detected `DrainingEvent` if one was triggered, otherwise `null`.
   */
  recordBalance(address: string, balance: number): DrainingEvent | null {
    const snapshot: BalanceSnapshot = {
      address,
      balance,
      timestamp: new Date(this.now()).toISOString(),
    };

    if (!this.history.has(address)) {
      this.history.set(address, []);
    }
    const snapshots = this.history.get(address)!;
    snapshots.push(snapshot);

    this.pruneHistory(address);
    return this.evaluate(address);
  }

  // ─── Detection ───────────────────────────────────────────────────────────

  /**
   * Evaluate the balance history for a given address and return a draining
   * event if the threshold is breached.
   */
  evaluate(address: string): DrainingEvent | null {
    const snapshots = this.history.get(address);
    if (!snapshots || snapshots.length < 2) return null;

    const oldest = snapshots[0];
    const newest = snapshots[snapshots.length - 1];

    if (oldest.balance <= 0) return null;

    const amountDrained = oldest.balance - newest.balance;
    if (amountDrained <= 0) return null;

    const drainRatio = amountDrained / oldest.balance;
    if (drainRatio < this.drainThreshold) return null;

    const durationMs = new Date(newest.timestamp).getTime() - new Date(oldest.timestamp).getTime();

    const severity = this.classifySeverity(drainRatio, durationMs);
    const alert = this.buildAlert(address, amountDrained, drainRatio, durationMs, severity);

    const event: DrainingEvent = {
      id: `drain-${address}-${this.now()}`,
      address,
      openingBalance: oldest.balance,
      closingBalance: newest.balance,
      amountDrained,
      drainRatio,
      durationMs,
      detectedAt: newest.timestamp,
      severity,
      alert,
    };

    this.detectedEvents.push(event);
    return event;
  }

  // ─── Inspection ──────────────────────────────────────────────────────────

  /** All draining events detected so far (most recent last). */
  getDetectedEvents(): DrainingEvent[] {
    return [...this.detectedEvents];
  }

  /** Current balance snapshots for an address (within the observation window). */
  getHistory(address: string): BalanceSnapshot[] {
    return [...(this.history.get(address) ?? [])];
  }

  /** Clear history and events for a single address. */
  resetAddress(address: string): void {
    this.history.delete(address);
  }

  /** Clear all state. */
  resetAll(): void {
    this.history.clear();
    this.detectedEvents.length = 0;
  }

  // ─── Private ─────────────────────────────────────────────────────────────

  private pruneHistory(address: string): void {
    const cutoff = this.now() - this.windowMs;
    const snapshots = this.history.get(address)!;
    const keep = snapshots.filter(s => new Date(s.timestamp).getTime() >= cutoff);
    this.history.set(address, keep);
  }

  /**
   * Escalate severity based on both the drain ratio and speed.
   *
   * | ratio     | duration ≤ 60s | duration ≤ 180s | otherwise |
   * |-----------|---------------|-----------------|-----------|
   * | ≥ 0.90    | critical       | critical        | high      |
   * | ≥ 0.70    | critical       | high            | high      |
   * | ≥ 0.50    | high           | medium          | medium    |
   */
  private classifySeverity(drainRatio: number, durationMs: number): Severity {
    const fast = durationMs <= 60_000;
    const moderate = durationMs <= 180_000;

    if (drainRatio >= 0.9) return fast || moderate ? 'critical' : 'high';
    if (drainRatio >= 0.7) return fast ? 'critical' : 'high';
    return fast ? 'high' : 'medium';
  }

  private buildAlert(
    address: string,
    amountDrained: number,
    drainRatio: number,
    durationMs: number,
    severity: Severity,
  ): DrainingAlert {
    const pct = (drainRatio * 100).toFixed(1);
    const secs = (durationMs / 1000).toFixed(0);

    return {
      title: `Rapid Asset Draining Detected — ${pct}% drained`,
      description:
        `Wallet ${address} lost ${amountDrained.toFixed(4)} units ` +
        `(${pct}% of opening balance) in ${secs}s.`,
      severity,
      indicators: [
        `Address: ${address}`,
        `Drain ratio: ${pct}%`,
        `Amount drained: ${amountDrained.toFixed(4)}`,
        `Duration: ${secs}s`,
      ],
      recommendedActions: this.recommendActions(severity),
    };
  }

  private recommendActions(severity: Severity): string[] {
    const base = [
      'Investigate transaction history for the affected wallet',
      'Check for unauthorized key exposure',
    ];
    if (severity === 'critical') {
      return [
        'Immediately freeze the affected wallet if possible',
        'Initiate emergency incident response',
        'Notify security team and asset owners',
        ...base,
      ];
    }
    if (severity === 'high') {
      return [
        'Suspend outbound transactions pending review',
        'Alert wallet owner immediately',
        ...base,
      ];
    }
    return [...base, 'Monitor for continued drain activity'];
  }
}

