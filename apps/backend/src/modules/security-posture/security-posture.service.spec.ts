import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { SecurityPostureService } from './security-posture.service';

describe('SecurityPostureService', () => {
  let service: SecurityPostureService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SecurityPostureService],
    }).compile();

    service = module.get<SecurityPostureService>(SecurityPostureService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPosture', () => {
    it('returns a score between 0 and 100', () => {
      const result = service.getPosture();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('returns a valid grade', () => {
      const result = service.getPosture();
      expect(['A', 'B', 'C', 'D', 'F']).toContain(result.grade);
    });

    it('returns a valid ISO timestamp in calculatedAt', () => {
      const result = service.getPosture();
      expect(new Date(result.calculatedAt).toISOString()).toBe(result.calculatedAt);
    });

    it('returns factors with weights that sum to 1.0', () => {
      const result = service.getPosture();
      const totalWeight = result.factors.reduce((sum, f) => sum + f.weight, 0);
      expect(totalWeight).toBeCloseTo(1.0, 5);
    });

    it('each factor has a valid weighted score equal to value * weight', () => {
      const result = service.getPosture();
      result.factors.forEach(f => {
        expect(f.weightedScore).toBeCloseTo(f.value * f.weight, 1);
      });
    });

    it('returns a non-empty history array', () => {
      const result = service.getPosture();
      expect(Array.isArray(result.history)).toBe(true);
      expect(result.history.length).toBeGreaterThan(0);
    });

    it('returns a valid trend value', () => {
      const result = service.getPosture();
      expect(['improving', 'stable', 'degrading']).toContain(result.trend);
    });

    it('grade A corresponds to score >= 90', () => {
      const result = service.getPosture();
      if (result.grade === 'A') {
        expect(result.score).toBeGreaterThanOrEqual(90);
      }
    });

    it('history length does not exceed 30 snapshots', () => {
      // Call getPosture many times to fill history
      for (let i = 0; i < 30; i++) {
        service.getPosture();
      }
      const result = service.getPosture();
      expect(result.history.length).toBeLessThanOrEqual(30);
    });
  });

  describe('getHistory', () => {
    it('returns an array of snapshots', () => {
      const history = service.getHistory();
      expect(Array.isArray(history)).toBe(true);
    });

    it('each snapshot has a numeric score and ISO timestamp', () => {
      const history = service.getHistory();
      history.forEach(snap => {
        expect(typeof snap.score).toBe('number');
        expect(new Date(snap.recordedAt).toISOString()).toBe(snap.recordedAt);
      });
    });

    it('returns a copy — mutations do not affect internal state', () => {
      const h1 = service.getHistory();
      h1.push({ recordedAt: new Date().toISOString(), score: 0 });
      const h2 = service.getHistory();
      expect(h2.length).toBe(h1.length - 1);
    });
  });
});
