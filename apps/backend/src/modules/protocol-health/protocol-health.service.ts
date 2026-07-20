import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ChainRegistryService } from '../../modules/chains/chain-registry.service';
import { NormalizedChainEvent } from '../../modules/chains/interfaces/normalized-chain-event.interface';
import { NotificationsService } from '../../modules/notifications/notifications.service';
import { IncidentsService } from '../incidents/services/incidents.service';
import { ProtocolHealthRepository } from './repositories/protocol-health.repository';
import {
  ProtocolHealthMetric,
  MetricsWindow,
  DEFAULT_ANOMALY_THRESHOLDS,
  AnomalyDetectionThresholds,
  HealthSnapshotResponse,
} from './interfaces/protocol-health-metric.interface';

@Injectable()
export class ProtocolHealthService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ProtocolHealthService.name);
  private readonly collectionIntervalMs = 60_000;
  private readonly baselineWindowMs = 60 * 60 * 1000;
  private collectionTimer: NodeJS.Timeout | null = null;
  private readonly windows = new Map<string, MetricsWindow>();
  private readonly baselines = new Map<string, ProtocolHealthMetric[]>();
  private readonly lastEventTimes = new Map<string, number>();
  private readonly thresholds: AnomalyDetectionThresholds;

  constructor(
    private readonly chainRegistry: ChainRegistryService,
    private readonly notifications: NotificationsService,
    private readonly incidents: IncidentsService,
    private readonly repository: ProtocolHealthRepository,
    thresholds?: Partial<AnomalyDetectionThresholds>,
  ) {
    this.thresholds = { ...DEFAULT_ANOMALY_THRESHOLDS, ...thresholds };
  }

  async onModuleInit(): Promise<void> {
    await this.subscribeToChainEvents();
    this.startCollectionLoop();
    this.logger.log('ProtocolHealthService: initialized and collecting metrics');
  }

  onModuleDestroy(): void {
    if (this.collectionTimer) {
      clearInterval(this.collectionTimer);
      this.collectionTimer = null;
    }
  }

  async getHealthSnapshot(chainId: string): Promise<HealthSnapshotResponse> {
    const latest = await this.repository.findLatestMetric(chainId);
    if (!latest) {
      return {
        chainId,
        status: 'degraded',
        timestamp: new Date().toISOString(),
        metrics: {
          transactionCount: 0,
          failedTransactionCount: 0,
          successRate: 0,
          contractCallCount: 0,
          contractDeployCount: 0,
          uniqueSenders: 0,
          monitorHealthy: true,
        },
        anomalies: ['No metrics collected yet'],
      };
    }

    const anomalies = await this.detectAnomalies(chainId);
    const total = latest.transactionCount;
    const successRate = total > 0 ? ((total - latest.failedTransactionCount) / total) * 100 : 100;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (!latest.monitorHealthy || anomalies.length > 0) {
      status = anomalies.some(a => a.includes('critical') || a.includes('network'))
        ? 'unhealthy'
        : 'degraded';
    }

    return {
      chainId,
      status,
      timestamp: latest.timestamp.toISOString(),
      metrics: {
        transactionCount: latest.transactionCount,
        failedTransactionCount: latest.failedTransactionCount,
        successRate: Number(successRate.toFixed(2)),
        contractCallCount: latest.contractCallCount,
        contractDeployCount: latest.contractDeployCount,
        uniqueSenders: latest.uniqueSenders,
        monitorHealthy: latest.monitorHealthy,
      },
      anomalies,
    };
  }

  async getAllChainsHealth(): Promise<HealthSnapshotResponse[]> {
    const chainIds = this.chainRegistry.getChainIds();
    return Promise.all(chainIds.map(id => this.getHealthSnapshot(id)));
  }

  async getAlerts(chainId?: string) {
    const alerts = await this.repository.findOpenAlerts(chainId);
    return alerts.map(alert => ({
      ...alert,
      createdAt: alert.createdAt.toISOString(),
      metadata: alert.metadata ?? undefined,
    }));
  }

  private async subscribeToChainEvents(): Promise<void> {
    await this.chainRegistry.subscribeAll((event: NormalizedChainEvent) => {
      this.handleChainEvent(event);
    });
  }

  private handleChainEvent(event: NormalizedChainEvent): void {
    const { chainId, eventType } = event;
    this.lastEventTimes.set(chainId, Date.now());

    let window = this.windows.get(chainId);
    if (!window) {
      window = {
        chainId,
        transactionCount: 0,
        failedTransactionCount: 0,
        contractCallCount: 0,
        contractDeployCount: 0,
        uniqueSenders: new Set(),
        eventCount: 0,
      };
      this.windows.set(chainId, window);
    }

    window.transactionCount += 1;
    window.eventCount += 1;

    if (event.from) {
      window.uniqueSenders.add(event.from);
    }

    if (eventType === 'contract_call') {
      window.contractCallCount += 1;
    } else if (eventType === 'contract_deploy') {
      window.contractDeployCount += 1;
    }

    if (eventType === 'failed' || eventType === 'error') {
      window.failedTransactionCount += 1;
    }
  }

  private startCollectionLoop(): void {
    this.collectionTimer = setInterval(() => {
      this.collectAndAnalyze().catch(err => {
        this.logger.error(`Protocol health collection error: ${String(err)}`);
      });
    }, this.collectionIntervalMs);
  }

  private async collectAndAnalyze(): Promise<void> {
    const chainIds = this.chainRegistry.getChainIds();

    for (const chainId of chainIds) {
      const window = this.windows.get(chainId);
      const monitor = this.chainRegistry.getMonitor(chainId);
      const monitorHealthy = monitor ? await monitor.isHealthy().catch(() => false) : true;

      if (!window) continue;

      const metric: ProtocolHealthMetric = {
        chainId,
        timestamp: new Date(),
        transactionCount: window.transactionCount,
        failedTransactionCount: window.failedTransactionCount,
        contractCallCount: window.contractCallCount,
        contractDeployCount: window.contractDeployCount,
        uniqueSenders: window.uniqueSenders.size,
        monitorHealthy,
      };

      await this.repository.createMetric(metric);

      let baselines = this.baselines.get(chainId);
      if (!baselines) {
        baselines = [];
        this.baselines.set(chainId, baselines);
      }
      baselines.push(metric);
      if (baselines.length > 60) baselines.shift();

      const anomalies = await this.detectAnomalies(chainId);
      if (anomalies.length > 0) {
        await this.handleAnomalies(chainId, anomalies);
      }

      window.transactionCount = 0;
      window.failedTransactionCount = 0;
      window.contractCallCount = 0;
      window.contractDeployCount = 0;
      window.uniqueSenders = new Set();
      window.eventCount = 0;
    }
  }

  private async detectAnomalies(chainId: string): Promise<string[]> {
    const anomalies: string[] = [];
    const baselines = this.baselines.get(chainId) ?? [];
    if (baselines.length < 2) return anomalies;

    const current = baselines[baselines.length - 1];
    const historical = baselines.slice(0, -1);
    const avgThroughput =
      historical.reduce((s, m) => s + m.transactionCount, 0) / historical.length;
    const avgContractCalls =
      historical.reduce((s, m) => s + m.contractCallCount, 0) / historical.length;
    const avgContractDeploys =
      historical.reduce((s, m) => s + m.contractDeployCount, 0) / historical.length;

    if (
      avgThroughput > 0 &&
      current.transactionCount < avgThroughput * (1 - this.thresholds.throughputDropPercent / 100)
    ) {
      const drop = ((1 - current.transactionCount / avgThroughput) * 100).toFixed(0);
      anomalies.push(
        `Transaction throughput dropped ${drop}% below baseline (current: ${current.transactionCount}, baseline: ${avgThroughput.toFixed(1)})`,
      );
    }

    if (
      current.transactionCount > 0 &&
      current.failedTransactionCount / current.transactionCount >
        this.thresholds.failedTxRatePercent / 100
    ) {
      const rate = ((current.failedTransactionCount / current.transactionCount) * 100).toFixed(1);
      anomalies.push(`Failed transaction rate elevated at ${rate}%`);
    }

    if (
      avgContractCalls > 0 &&
      current.contractCallCount > avgContractCalls * this.thresholds.contractCallSpikeMultiplier
    ) {
      const spike = ((current.contractCallCount / avgContractCalls) * 100).toFixed(0);
      anomalies.push(`Contract call activity spiked ${spike}% above baseline`);
    }

    if (
      avgContractDeploys > 0 &&
      current.contractDeployCount >
        avgContractDeploys * this.thresholds.contractDeploySpikeMultiplier
    ) {
      const spike = ((current.contractDeployCount / avgContractDeploys) * 100).toFixed(0);
      anomalies.push(`Contract deployment activity spiked ${spike}% above baseline`);
    } else if (avgContractDeploys === 0 && current.contractDeployCount > 2) {
      anomalies.push(
        `Unexpected contract deployments detected: ${current.contractDeployCount} new contracts`,
      );
    }

    if (!current.monitorHealthy) {
      anomalies.push('Chain monitor connectivity lost — network instability suspected');
    }

    const lastEvent = this.lastEventTimes.get(chainId);
    if (
      lastEvent &&
      Date.now() - lastEvent > this.thresholds.eventGapMinutes * 60_000 &&
      avgThroughput > 0
    ) {
      anomalies.push(
        `No events received for ${this.thresholds.eventGapMinutes} minutes — possible network stall`,
      );
    }

    return anomalies;
  }

  private async handleAnomalies(chainId: string, anomalies: string[]): Promise<void> {
    const severity = anomalies.some(a => a.includes('connectivity') || a.includes('stall'))
      ? 'high'
      : 'medium';

    for (const anomaly of anomalies) {
      const alert = await this.repository.createAlert({
        chainId,
        alertType: 'protocol_anomaly',
        severity,
        message: anomaly,
        metadata: {
          chainId,
          anomalies,
          detectedAt: new Date().toISOString(),
        },
      });

      this.logger.warn(`ProtocolHealthAlert [${chainId}] ${severity}: ${anomaly}`);

      this.notifications
        .sendAlert({
          title: `Protocol Anomaly Detected: ${chainId}`,
          message: anomaly,
          severity: severity as 'low' | 'medium' | 'high' | 'critical',
          metadata: { alertId: alert.id, chainId },
        })
        .catch(err => {
          this.logger.error(`Failed to send protocol health notification: ${String(err)}`);
        });
    }
  }
}
