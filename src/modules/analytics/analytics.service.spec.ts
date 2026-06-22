import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';

const mockPrismaClient = {
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  alert: {
    groupBy: jest.fn(),
  },
  watchlist: {
    groupBy: jest.fn(),
  },
};

jest.mock('@prisma/client', () => {
  return { PrismaClient: jest.fn(() => mockPrismaClient) };
});

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnalyticsService],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAlertMetrics', () => {
    it('should correctly map alert groupings', async () => {
      mockPrismaClient.alert.groupBy.mockImplementation(async (args: any) => {
        if (args.by[0] === 'severity') {
          return [
            { severity: 'high', _count: { _all: 5 } },
            { severity: 'low', _count: { _all: 10 } },
          ];
        }
        if (args.by[0] === 'status') {
          return [
            { status: 'open', _count: { _all: 8 } },
            { status: 'resolved', _count: { _all: 7 } },
          ];
        }
        return [];
      });

      const result = await service.getAlertMetrics();

      expect(mockPrismaClient.alert.groupBy).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        bySeverity: [
          { severity: 'high', count: 5 },
          { severity: 'low', count: 10 },
        ],
        byStatus: [
          { status: 'open', count: 8 },
          { status: 'resolved', count: 7 },
        ],
      });
    });
  });

  describe('getWatchlistMetrics', () => {
    it('should correctly map watchlist groupings', async () => {
      mockPrismaClient.watchlist.groupBy.mockImplementation(async (args: any) => {
        if (args.by[0] === 'isWallet') {
          return [
            { isWallet: true, _count: { _all: 42 } },
            { isWallet: false, _count: { _all: 8 } },
          ];
        }
        if (args.by[0] === 'isContract') {
          return [
            { isContract: true, _count: { _all: 15 } },
            { isContract: false, _count: { _all: 35 } },
          ];
        }
        if (args.by[0] === 'assetCode') {
          return [
            { assetCode: 'XLM', _count: { _all: 20 } },
            { assetCode: 'USDC', _count: { _all: 10 } },
          ];
        }
        return [];
      });

      const result = await service.getWatchlistMetrics();

      expect(mockPrismaClient.watchlist.groupBy).toHaveBeenCalledTimes(3);
      expect(result).toEqual({
        wallets: 42,
        contracts: 15,
        byAssetCode: [
          { assetCode: 'XLM', count: 20 },
          { assetCode: 'USDC', count: 10 },
        ],
      });
    });
  });

  describe('getRiskMetrics', () => {
    it('should return mock risk metrics', async () => {
      const result = await service.getRiskMetrics();
      expect(result.totalEvaluated).toBeDefined();
      expect(result.highRisk).toBeDefined();
    });
  });

  describe('getSummary', () => {
    it('should combine all metrics', async () => {
      jest.spyOn(service, 'getAlertMetrics').mockResolvedValue({ bySeverity: [], byStatus: [] });
      jest
        .spyOn(service, 'getWatchlistMetrics')
        .mockResolvedValue({ wallets: 0, contracts: 0, byAssetCode: [] });
      jest.spyOn(service, 'getRiskMetrics').mockResolvedValue({
        totalEvaluated: 0,
        highRisk: 0,
        mediumRisk: 0,
        lowRisk: 0,
        averageRiskScore: 0,
      });

      const result = await service.getSummary();

      expect(result.alerts).toBeDefined();
      expect(result.watchlists).toBeDefined();
      expect(result.risk).toBeDefined();
    });
  });
});
