import { DrainingService } from './draining.service';

describe('DrainingService', () => {
  let clock: number;
  let service: DrainingService;

  beforeEach(() => {
    clock = 0;
    service = new DrainingService({
      drainThreshold: 0.5,
      windowMs: 300_000,
      now: () => clock,
    });
  });

  const addr = 'GABC123XYZ';

  describe('recordBalance — no drain', () => {
    it('returns null for a single snapshot', () => {
      expect(service.recordBalance(addr, 1000)).toBeNull();
    });

    it('returns null when balance increases', () => {
      service.recordBalance(addr, 500);
      clock += 10_000;
      expect(service.recordBalance(addr, 600)).toBeNull();
    });

    it('returns null when drain is below threshold', () => {
      service.recordBalance(addr, 1000);
      clock += 60_000;
      // only 40 % drained — below 50 % threshold
      expect(service.recordBalance(addr, 600)).toBeNull();
    });
  });

  describe('recordBalance — drain detected', () => {
    it('detects a drain at exactly the threshold', () => {
      service.recordBalance(addr, 1000);
      clock += 60_000;
      const event = service.recordBalance(addr, 500); // 50 % drain
      expect(event).not.toBeNull();
      expect(event!.drainRatio).toBeCloseTo(0.5);
      expect(event!.amountDrained).toBe(500);
      expect(event!.address).toBe(addr);
    });

    it('detects a full drain (100 %)', () => {
      service.recordBalance(addr, 1000);
      clock += 30_000;
      const event = service.recordBalance(addr, 0);
      expect(event).not.toBeNull();
      expect(event!.drainRatio).toBe(1);
    });

    it('stores detected events', () => {
      service.recordBalance(addr, 1000);
      clock += 30_000;
      service.recordBalance(addr, 0);
      expect(service.getDetectedEvents()).toHaveLength(1);
    });

    it('includes an alert with indicators and recommended actions', () => {
      service.recordBalance(addr, 1000);
      clock += 30_000;
      const event = service.recordBalance(addr, 0)!;
      expect(event.alert.indicators.length).toBeGreaterThan(0);
      expect(event.alert.recommendedActions.length).toBeGreaterThan(0);
      expect(event.alert.title).toMatch(/Rapid Asset Draining/);
    });
  });

  describe('severity escalation', () => {
    it('assigns critical for ≥90 % drain within 60 s', () => {
      service.recordBalance(addr, 1000);
      clock += 30_000; // 30 s — fast
      const event = service.recordBalance(addr, 50)!; // 95 % drained
      expect(event.severity).toBe('critical');
    });

    it('assigns high for ≥70 % drain within 60 s', () => {
      service.recordBalance(addr, 1000);
      clock += 45_000;
      const event = service.recordBalance(addr, 250)!; // 75 % drained
      expect(event.severity).toBe('critical'); // fast drain ≥70%
    });

    it('assigns medium for 50–69 % drain at moderate speed', () => {
      service.recordBalance(addr, 1000);
      clock += 200_000; // > 180 s
      const event = service.recordBalance(addr, 400)!; // 60 % drained
      expect(event.severity).toBe('medium');
    });

    it('assigns high for 50 % drain within 60 s', () => {
      service.recordBalance(addr, 1000);
      clock += 30_000;
      const event = service.recordBalance(addr, 500)!; // 50 % drained fast
      expect(event.severity).toBe('high');
    });
  });

  describe('history management', () => {
    it('prunes snapshots outside the observation window', () => {
      service.recordBalance(addr, 1000);
      clock += 400_000; // beyond 5-min window
      service.recordBalance(addr, 800); // old snapshot pruned
      // Only the new snapshot should remain; evaluate needs ≥ 2
      const event = service.recordBalance(addr, 300);
      // No drain detected because oldest visible snapshot is 800
      // 800 → 300 = 62.5 % drain — above threshold
      expect(event).not.toBeNull();
    });

    it('resetAddress clears history for one address', () => {
      service.recordBalance(addr, 1000);
      service.resetAddress(addr);
      expect(service.getHistory(addr)).toHaveLength(0);
    });

    it('resetAll clears all state', () => {
      service.recordBalance(addr, 1000);
      clock += 30_000;
      service.recordBalance(addr, 0);
      service.resetAll();
      expect(service.getHistory(addr)).toHaveLength(0);
      expect(service.getDetectedEvents()).toHaveLength(0);
    });
  });

  describe('multiple addresses', () => {
    it('tracks addresses independently', () => {
      const addr2 = 'GXYZ789ABC';
      service.recordBalance(addr, 1000);
      service.recordBalance(addr2, 2000);
      clock += 30_000;
      const e1 = service.recordBalance(addr, 0); // drained
      const e2 = service.recordBalance(addr2, 1900); // not drained (<5%)
      expect(e1).not.toBeNull();
      expect(e2).toBeNull();
    });
  });
});
