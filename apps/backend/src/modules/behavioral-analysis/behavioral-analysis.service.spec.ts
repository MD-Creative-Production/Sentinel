import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { BehavioralAnalysisService } from './behavioral-analysis.service';
import { WalletTransaction } from './interfaces/behavioral-analysis.interface';

const TX = (overrides: Partial<WalletTransaction> = {}): WalletTransaction => ({
  txHash: 'tx1',
  walletAddress: 'WALLET_A',
  counterparty: 'WALLET_B',
  asset: 'XLM',
  amount: 100,
  timestamp: '2026-01-01T00:00:00Z',
  chain: 'Stellar',
  ...overrides,
});

const HISTORY: WalletTransaction[] = [
  TX({ txHash: 'h1', timestamp: '2026-01-01T00:00:00Z', amount: 100 }),
  TX({ txHash: 'h2', timestamp: '2026-01-02T00:00:00Z', amount: 120, counterparty: 'WALLET_C' }),
  TX({ txHash: 'h3', timestamp: '2026-01-03T00:00:00Z', amount: 80 }),
];

describe('BehavioralAnalysisService', () => {
  let service: BehavioralAnalysisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BehavioralAnalysisService],
    }).compile();
    service = module.get<BehavioralAnalysisService>(BehavioralAnalysisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('buildProfile', () => {
    it('builds correct profile from transactions', () => {
      const profile = service.buildProfile(HISTORY);
      expect(profile.walletAddress).toBe('WALLET_A');
      expect(profile.totalTransactions).toBe(3);
      expect(profile.totalVolume).toBe(300);
      expect(profile.uniqueCounterparties).toBe(2);
    });

    it('sets firstSeen and lastSeen correctly', () => {
      const profile = service.buildProfile(HISTORY);
      expect(profile.firstSeen).toBe('2026-01-01T00:00:00Z');
      expect(profile.lastSeen).toBe('2026-01-03T00:00:00Z');
    });

    it('throws when no transactions provided', () => {
      expect(() => service.buildProfile([])).toThrow();
    });
  });

  describe('buildBaseline', () => {
    it('computes avgTransactionAmount correctly', () => {
      const baseline = service.buildBaseline(HISTORY);
      expect(baseline.avgTransactionAmount).toBeCloseTo(100, 1);
    });

    it('includes all unique assets and counterparties', () => {
      const baseline = service.buildBaseline(HISTORY);
      expect(baseline.typicalAssets).toContain('XLM');
      expect(baseline.typicalCounterparties).toContain('WALLET_B');
      expect(baseline.typicalCounterparties).toContain('WALLET_C');
    });
  });

  describe('detectAnomalies', () => {
    it('detects volume spike when amount exceeds 3x baseline average', () => {
      const baseline = service.buildBaseline(HISTORY);
      const recent = [TX({ txHash: 'r1', amount: 1000 })];
      const anomalies = service.detectAnomalies(recent, baseline);
      expect(anomalies.some(a => a.type === 'volume_spike')).toBe(true);
    });

    it('detects new counterparty not in baseline', () => {
      const baseline = service.buildBaseline(HISTORY);
      const recent = [TX({ txHash: 'r2', counterparty: 'WALLET_UNKNOWN' })];
      const anomalies = service.detectAnomalies(recent, baseline);
      expect(anomalies.some(a => a.type === 'new_counterparty')).toBe(true);
    });

    it('detects unusual asset not in baseline', () => {
      const baseline = service.buildBaseline(HISTORY);
      const recent = [TX({ txHash: 'r3', asset: 'USDC' })];
      const anomalies = service.detectAnomalies(recent, baseline);
      expect(anomalies.some(a => a.type === 'unusual_asset')).toBe(true);
    });

    it('returns no anomalies for normal behaviour', () => {
      const baseline = service.buildBaseline(HISTORY);
      const recent = [TX({ txHash: 'r4', amount: 110 })];
      const anomalies = service.detectAnomalies(recent, baseline);
      expect(anomalies.every(a => a.type !== 'volume_spike')).toBe(true);
    });
  });

  describe('analyze', () => {
    it('returns profile, baseline and anomalies together', () => {
      const result = service.analyze(HISTORY, [TX({ txHash: 'r5', amount: 5000 })]);
      expect(result.profile).toBeDefined();
      expect(result.baseline).toBeDefined();
      expect(result.anomalies.length).toBeGreaterThan(0);
      expect(new Date(result.generatedAt).toISOString()).toBe(result.generatedAt);
    });
  });
});
