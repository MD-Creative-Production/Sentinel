import { HighFrequencyContractCallsService } from './high-frequency-calls.service';
import { FrequencyAlert } from './interfaces/high-frequency-calls.interface';

/** Fixed base epoch so test timestamps are deterministic and offset-based. */
const BASE = new Date('2026-01-01T00:00:00.000Z').getTime();
const ts = (offsetMs: number): string => new Date(BASE + offsetMs).toISOString();

describe('HighFrequencyContractCallsService', () => {
  let service: HighFrequencyContractCallsService;

  beforeEach(() => {
    service = new HighFrequencyContractCallsService();
  });

  describe('Configurable Thresholds', () => {
    it('should use a sensible built-in default when no override is set', () => {
      expect(service.getThreshold('0xany')).toEqual({
        windowMs: 60_000,
        maxCallsPerWindow: 50,
        baselineWindowCount: 5,
        baselineSpikeMultiplier: 3,
      });
    });

    it('should accept a custom default threshold via the constructor', () => {
      const custom = new HighFrequencyContractCallsService({
        windowMs: 5_000,
        maxCallsPerWindow: 10,
        baselineWindowCount: 4,
        baselineSpikeMultiplier: 2,
      });

      expect(custom.getThreshold('0xany')).toEqual({
        windowMs: 5_000,
        maxCallsPerWindow: 10,
        baselineWindowCount: 4,
        baselineSpikeMultiplier: 2,
      });
    });

    it('should allow overriding the threshold for a single contract without affecting others', () => {
      service.setThreshold('0xA', { maxCallsPerWindow: 3 });

      expect(service.getThreshold('0xA').maxCallsPerWindow).toBe(3);
      expect(service.getThreshold('0xB').maxCallsPerWindow).toBe(50);
    });

    it('should merge partial overrides on top of the previous configuration for that contract', () => {
      service.setThreshold('0xA', { maxCallsPerWindow: 3 });
      service.setThreshold('0xA', { windowMs: 1_000 });

      expect(service.getThreshold('0xA')).toMatchObject({
        maxCallsPerWindow: 3,
        windowMs: 1_000,
      });
    });
  });

  describe('Frequency Monitoring', () => {
    it('should track call counts per contract independently', () => {
      service.recordCall({ contractAddress: '0xA', timestamp: ts(0) });
      service.recordCall({ contractAddress: '0xA', timestamp: ts(10) });
      service.recordCall({ contractAddress: '0xB', timestamp: ts(10) });

      expect(service.getCallCount('0xA')).toBe(2);
      expect(service.getCallCount('0xB')).toBe(1);
    });

    it('should not alert for normal, low-volume activity', () => {
      const first = service.recordCall({ contractAddress: '0xA', timestamp: ts(0) });
      const second = service.recordCall({ contractAddress: '0xA', timestamp: ts(10) });

      expect(first).toBeNull();
      expect(second).toBeNull();
    });

    it('should roll the window and reset the open count once windowMs elapses', () => {
      service.setThreshold('0xA', { windowMs: 1_000, maxCallsPerWindow: 100 });

      service.recordCall({ contractAddress: '0xA', timestamp: ts(0) });
      service.recordCall({ contractAddress: '0xA', timestamp: ts(100) });
      expect(service.getCallCount('0xA')).toBe(2);

      // This call lands 1000ms after the window opened -> rolls to a new window
      service.recordCall({ contractAddress: '0xA', timestamp: ts(1_000) });

      expect(service.getCallCount('0xA')).toBe(1);
      expect(service.getWindowHistory('0xA')).toEqual([2]);
    });

    it('should cap the retained window history at baselineWindowCount', () => {
      service.setThreshold('0xA', {
        windowMs: 1_000,
        maxCallsPerWindow: 100,
        baselineWindowCount: 2,
      });

      // Four windows' worth of calls -> only the last 2 closed windows are retained
      service.recordCall({ contractAddress: '0xA', timestamp: ts(0) });
      service.recordCall({ contractAddress: '0xA', timestamp: ts(1_000) }); // closes window 1 (count 1)
      service.recordCall({ contractAddress: '0xA', timestamp: ts(2_000) }); // closes window 2 (count 1)
      service.recordCall({ contractAddress: '0xA', timestamp: ts(3_000) }); // closes window 3 (count 1)

      expect(service.getWindowHistory('0xA')).toEqual([1, 1]);
    });
  });

  describe('Threshold Detection', () => {
    it('should generate a threshold_exceeded alert once calls exceed the absolute cap', () => {
      service.setThreshold('0xA', {
        windowMs: 10_000,
        maxCallsPerWindow: 3,
        baselineSpikeMultiplier: 999, // effectively disable baseline detection for this test
      });

      let lastAlert: FrequencyAlert | null = null;
      for (let i = 0; i < 4; i++) {
        lastAlert = service.recordCall({ contractAddress: '0xA', timestamp: ts(i * 10) });
      }

      expect(lastAlert).not.toBeNull();
      expect(lastAlert?.metadata.reason).toBe('threshold_exceeded');
      expect(lastAlert?.metadata.callCount).toBe(4);
      expect(lastAlert?.metadata.threshold).toBe(3);
      expect(lastAlert?.severity).toBe('critical');
    });

    it('should not alert while calls stay at or below the threshold', () => {
      service.setThreshold('0xA', { windowMs: 10_000, maxCallsPerWindow: 3 });

      const results = [0, 10, 20].map(offset =>
        service.recordCall({ contractAddress: '0xA', timestamp: ts(offset) }),
      );

      expect(results.every(r => r === null)).toBe(true);
    });
  });

  describe('Baseline Comparison', () => {
    it('should generate a baseline_spike alert when a window far exceeds the rolling average', () => {
      service.setThreshold('0xA', {
        windowMs: 1_000,
        maxCallsPerWindow: 100, // high enough that only the baseline rule can fire
        baselineWindowCount: 3,
        baselineSpikeMultiplier: 3,
      });

      // Two closed windows of 2 calls each, plus a currently-open third window
      // with matching volume -> a consistent "normal" rate of 2 calls/window
      service.recordCall({ contractAddress: '0xA', timestamp: ts(0) });
      service.recordCall({ contractAddress: '0xA', timestamp: ts(100) });
      service.recordCall({ contractAddress: '0xA', timestamp: ts(1_000) });
      service.recordCall({ contractAddress: '0xA', timestamp: ts(1_100) });
      service.recordCall({ contractAddress: '0xA', timestamp: ts(2_000) });
      service.recordCall({ contractAddress: '0xA', timestamp: ts(2_100) });

      expect(service.getBaselineAverage('0xA')).toBe(2);

      // Window 4 opens; baseline average is 2, so anything over 2*3=6 should spike
      let lastAlert: FrequencyAlert | null = null;
      for (const offset of [3_000, 3_050, 3_100, 3_150, 3_200, 3_250, 3_300]) {
        lastAlert = service.recordCall({ contractAddress: '0xA', timestamp: ts(offset) });
      }

      expect(lastAlert).not.toBeNull();
      expect(lastAlert?.metadata.reason).toBe('baseline_spike');
      expect(lastAlert?.metadata.callCount).toBe(7);
      expect(lastAlert?.metadata.baselineAverage).toBe(2);
      expect(lastAlert?.severity).toBe('high');
    });

    it('should report no baseline until at least one window has closed', () => {
      service.recordCall({ contractAddress: '0xA', timestamp: ts(0) });

      expect(service.getBaselineAverage('0xA')).toBeNull();
    });
  });

  describe('Alert Generation', () => {
    it('should notify subscribers when an alert is raised', () => {
      service.setThreshold('0xA', { windowMs: 10_000, maxCallsPerWindow: 1 });

      const alerts: FrequencyAlert[] = [];
      service.onAlert(alert => alerts.push(alert));

      service.recordCall({ contractAddress: '0xA', timestamp: ts(0) });
      service.recordCall({ contractAddress: '0xA', timestamp: ts(10) });

      expect(alerts).toHaveLength(1);
      expect(alerts[0].metadata.contractAddress).toBe('0xA');
    });

    it('should stop notifying a subscriber after it unsubscribes', () => {
      service.setThreshold('0xA', { windowMs: 10_000, maxCallsPerWindow: 1 });

      const alerts: FrequencyAlert[] = [];
      const unsubscribe = service.onAlert(alert => alerts.push(alert));
      unsubscribe();

      service.recordCall({ contractAddress: '0xA', timestamp: ts(0) });
      service.recordCall({ contractAddress: '0xA', timestamp: ts(10) });

      expect(alerts).toHaveLength(0);
    });
  });

  describe('clearContract', () => {
    it('should reset threshold overrides, counts, and history for a contract', () => {
      service.setThreshold('0xA', { maxCallsPerWindow: 3 });
      service.recordCall({ contractAddress: '0xA', timestamp: ts(0) });

      service.clearContract('0xA');

      expect(service.getThreshold('0xA').maxCallsPerWindow).toBe(50);
      expect(service.getCallCount('0xA')).toBe(0);
      expect(service.getWindowHistory('0xA')).toEqual([]);
    });
  });
});
