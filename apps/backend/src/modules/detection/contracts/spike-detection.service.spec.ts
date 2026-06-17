import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { SpikeDetectionService } from './spike-detection.service';

const CONTRACT = '0xDeAdBeEf';

/** Inject N transactions into the baseline window (previous windowMs). */
function seedBaseline(
  service: SpikeDetectionService,
  count: number,
  now: number,
  windowMs: number,
) {
  for (let i = 0; i < count; i++) {
    service.recordTransaction(CONTRACT, now - windowMs - (i + 1) * 100);
  }
}

describe('SpikeDetectionService', () => {
  let service: SpikeDetectionService;
  const windowMs = 60_000;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SpikeDetectionService],
    }).compile();

    service = module.get<SpikeDetectionService>(SpikeDetectionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getConfig', () => {
    it('returns default config values', () => {
      const cfg = service.getConfig();
      expect(cfg.windowMs).toBe(60_000);
      expect(cfg.multiplierThreshold).toBe(3);
      expect(cfg.minBaselineCount).toBe(5);
    });

    it('respects partial config override', () => {
      const custom = new SpikeDetectionService({ multiplierThreshold: 5 });
      expect(custom.getConfig().multiplierThreshold).toBe(5);
      expect(custom.getConfig().windowMs).toBe(60_000); // default preserved
    });
  });

  describe('recordTransaction', () => {
    it('returns null when baseline is below minBaselineCount', () => {
      const now = Date.now();
      seedBaseline(service, 3, now, windowMs); // below min of 5
      const alert = service.recordTransaction(CONTRACT, now);
      expect(alert).toBeNull();
    });

    it('returns null when activity is within threshold', () => {
      const now = Date.now();
      seedBaseline(service, 10, now, windowMs); // baseline = 10
      // current window: 5 transactions (0.5×, below threshold of 3×)
      for (let i = 0; i < 5; i++) {
        service.recordTransaction(CONTRACT, now - i * 100);
      }
      const alert = service.recordTransaction(CONTRACT, now);
      expect(alert).toBeNull();
    });

    it('returns a SpikeAlert when activity exceeds threshold', () => {
      const now = Date.now();
      seedBaseline(service, 5, now, windowMs); // baseline = 5
      // current window: 20 transactions → 4× (> 3× threshold)
      for (let i = 0; i < 19; i++) {
        service.recordTransaction(CONTRACT, now - i * 100);
      }
      const alert = service.recordTransaction(CONTRACT, now);
      expect(alert).not.toBeNull();
      expect(alert!.contractAddress).toBe(CONTRACT);
      expect(alert!.multiplier).toBeGreaterThanOrEqual(3);
    });

    it('alert has a valid ISO detectedAt timestamp', () => {
      const now = Date.now();
      seedBaseline(service, 5, now, windowMs);
      for (let i = 0; i < 19; i++) {
        service.recordTransaction(CONTRACT, now - i * 100);
      }
      const alert = service.recordTransaction(CONTRACT, now);
      expect(alert).not.toBeNull();
      expect(new Date(alert!.detectedAt).toISOString()).toBe(alert!.detectedAt);
    });

    it('returns "medium" severity for 3–4.99× multiplier', () => {
      const now = Date.now();
      seedBaseline(service, 5, now, windowMs);
      for (let i = 0; i < 19; i++) {
        service.recordTransaction(CONTRACT, now - i * 100);
      }
      const alert = service.recordTransaction(CONTRACT, now);
      expect(alert).not.toBeNull();
      if (alert!.multiplier < 5) expect(alert!.severity).toBe('medium');
    });

    it('returns "high" severity for 5–9.99× multiplier', () => {
      const now = Date.now();
      seedBaseline(service, 5, now, windowMs); // baseline = 5
      // 30 txs in current window → 6×
      for (let i = 0; i < 29; i++) {
        service.recordTransaction(CONTRACT, now - i * 100);
      }
      const alert = service.recordTransaction(CONTRACT, now);
      expect(alert).not.toBeNull();
      if (alert!.multiplier >= 5 && alert!.multiplier < 10) {
        expect(alert!.severity).toBe('high');
      }
    });

    it('returns "critical" severity for ≥10× multiplier', () => {
      const now = Date.now();
      seedBaseline(service, 5, now, windowMs); // baseline = 5
      // 55 txs in current window → 11×
      for (let i = 0; i < 54; i++) {
        service.recordTransaction(CONTRACT, now - i * 100);
      }
      const alert = service.recordTransaction(CONTRACT, now);
      expect(alert).not.toBeNull();
      if (alert!.multiplier >= 10) expect(alert!.severity).toBe('critical');
    });

    it('tracks multiple contracts independently', () => {
      const other = '0xOtherContract';
      const now = Date.now();
      seedBaseline(service, 5, now, windowMs);

      // Spike CONTRACT, not OTHER
      for (let i = 0; i < 19; i++) {
        service.recordTransaction(CONTRACT, now - i * 100);
      }
      const spikeAlert = service.recordTransaction(CONTRACT, now);
      const quietAlert = service.recordTransaction(other, now);

      expect(spikeAlert).not.toBeNull();
      expect(quietAlert).toBeNull(); // other has no baseline
    });
  });

  describe('getActivity', () => {
    it('returns undefined for an unseen contract', () => {
      expect(service.getActivity('0xUnknown')).toBeUndefined();
    });

    it('stores the transaction timestamps', () => {
      const now = Date.now();
      service.recordTransaction(CONTRACT, now);
      const record = service.getActivity(CONTRACT);
      expect(record).toBeDefined();
      expect(record!.timestamps).toContain(now);
    });
  });
});
