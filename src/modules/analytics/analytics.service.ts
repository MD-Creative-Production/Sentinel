import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class AnalyticsService implements OnModuleInit, OnModuleDestroy {
  public prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async onModuleInit() {
    await this.prisma.$connect();
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }

  async getAlertMetrics() {
    const severityGroups = await this.prisma.alert.groupBy({
      by: ['severity'],
      _count: {
        _all: true,
      },
    });

    const statusGroups = await this.prisma.alert.groupBy({
      by: ['status'],
      _count: {
        _all: true,
      },
    });

    return {
      bySeverity: severityGroups.map(g => ({ severity: g.severity, count: g._count._all })),
      byStatus: statusGroups.map(g => ({ status: g.status, count: g._count._all })),
    };
  }

  async getWatchlistMetrics() {
    const isWalletGroups = await this.prisma.watchlist.groupBy({
      by: ['isWallet'],
      _count: {
        _all: true,
      },
    });

    const isContractGroups = await this.prisma.watchlist.groupBy({
      by: ['isContract'],
      _count: {
        _all: true,
      },
    });

    const assetCodeGroups = await this.prisma.watchlist.groupBy({
      by: ['assetCode'],
      _count: {
        _all: true,
      },
      where: {
        assetCode: { not: null },
      },
    });

    return {
      wallets: isWalletGroups.find(g => g.isWallet === true)?._count._all || 0,
      contracts: isContractGroups.find(g => g.isContract === true)?._count._all || 0,
      byAssetCode: assetCodeGroups.map(g => ({ assetCode: g.assetCode, count: g._count._all })),
    };
  }

  async getRiskMetrics() {
    // Mocked risk metrics as there's no Risk persistence layer currently.
    return {
      totalEvaluated: 154,
      highRisk: 12,
      mediumRisk: 34,
      lowRisk: 108,
      averageRiskScore: 32.5,
    };
  }

  async getSummary() {
    const [alerts, watchlists, risk] = await Promise.all([
      this.getAlertMetrics(),
      this.getWatchlistMetrics(),
      this.getRiskMetrics(),
    ]);

    return { alerts, watchlists, risk };
  }
}
