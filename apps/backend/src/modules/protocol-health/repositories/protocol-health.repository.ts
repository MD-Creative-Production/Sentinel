import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { ProtocolHealthMetric } from '../interfaces/protocol-health-metric.interface';

@Injectable()
export class ProtocolHealthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createMetric(metric: ProtocolHealthMetric) {
    return this.prisma.protocolHealthMetric.create({
      data: {
        chainId: metric.chainId,
        timestamp: metric.timestamp,
        transactionCount: metric.transactionCount,
        failedTransactionCount: metric.failedTransactionCount,
        contractCallCount: metric.contractCallCount,
        contractDeployCount: metric.contractDeployCount,
        uniqueSenders: metric.uniqueSenders,
        monitorHealthy: metric.monitorHealthy,
      },
    });
  }

  async findRecentMetrics(chainId: string, since: Date) {
    return this.prisma.protocolHealthMetric.findMany({
      where: {
        chainId,
        timestamp: { gte: since },
      },
      orderBy: { timestamp: 'asc' },
    });
  }

  async findLatestMetric(chainId: string) {
    return this.prisma.protocolHealthMetric.findFirst({
      where: { chainId },
      orderBy: { timestamp: 'desc' },
    });
  }

  async createAlert(data: {
    chainId: string;
    alertType: string;
    severity: string;
    message: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    return this.prisma.protocolHealthAlert.create({
      data,
    });
  }

  async findOpenAlerts(chainId?: string) {
    return this.prisma.protocolHealthAlert.findMany({
      where: {
        status: 'open',
        ...(chainId ? { chainId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateAlertStatus(id: string, status: string, acknowledgedBy?: string) {
    return this.prisma.protocolHealthAlert.update({
      where: { id },
      data: {
        status,
        ...(status === 'acknowledged'
          ? { acknowledgedAt: new Date(), acknowledgedBy: acknowledgedBy ?? 'system' }
          : {}),
      },
    });
  }
}
