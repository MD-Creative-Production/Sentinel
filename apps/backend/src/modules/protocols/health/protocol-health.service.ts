import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  AlertSeverity,
  MetricThreshold,
  MetricType,
  ProtocolAlert,
  ProtocolHealthSnapshot,
  ProtocolMetricSnapshot,
  ProtocolStatus,
  RecordMetricDto,
  RegisterProtocolDto,
  ThresholdOperator,
} from './interfaces/protocol-health.interface';

interface StoredProtocol {
  protocolId: string;
  name: string;
  chain: string;
  thresholds: MetricThreshold[];
  latestMetrics: Map<MetricType, ProtocolMetricSnapshot>;
  lastCheckedAt: string | null;
}

@Injectable()
export class ProtocolHealthService {
  private readonly logger = new Logger(ProtocolHealthService.name);
  private readonly protocols = new Map<string, StoredProtocol>();
  private readonly alerts = new Map<string, ProtocolAlert>();

  registerProtocol(dto: RegisterProtocolDto): ProtocolHealthSnapshot {
    if (this.protocols.has(dto.protocolId)) {
      throw new ConflictException(`Protocol '${dto.protocolId}' is already registered`);
    }

    const protocol: StoredProtocol = {
      protocolId: dto.protocolId,
      name: dto.name,
      chain: dto.chain,
      thresholds: dto.thresholds,
      latestMetrics: new Map(),
      lastCheckedAt: null,
    };

    this.protocols.set(dto.protocolId, protocol);
    this.logger.log(`Registered protocol: ${dto.protocolId} (${dto.name})`);

    return this.buildSnapshot(protocol);
  }

  recordMetrics(dto: RecordMetricDto): ProtocolHealthSnapshot {
    const protocol = this.protocols.get(dto.protocolId);
    if (!protocol) {
      throw new NotFoundException(`Protocol '${dto.protocolId}' not found`);
    }

    const now = new Date().toISOString();

    for (const { type, value } of dto.metrics) {
      protocol.latestMetrics.set(type, { type, value, recordedAt: now });
    }

    protocol.lastCheckedAt = now;
    this.evaluateThresholds(protocol, now);

    return this.buildSnapshot(protocol);
  }

  getProtocolHealth(protocolId: string): ProtocolHealthSnapshot {
    const protocol = this.protocols.get(protocolId);
    if (!protocol) {
      throw new NotFoundException(`Protocol '${protocolId}' not found`);
    }
    return this.buildSnapshot(protocol);
  }

  getAllProtocols(): ProtocolHealthSnapshot[] {
    return Array.from(this.protocols.values()).map(p => this.buildSnapshot(p));
  }

  getActiveAlerts(): ProtocolAlert[] {
    return Array.from(this.alerts.values()).filter(a => !a.resolved);
  }

  private evaluateThresholds(protocol: StoredProtocol, now: string): void {
    for (const threshold of protocol.thresholds) {
      const metric = protocol.latestMetrics.get(threshold.metricType);
      if (!metric) continue;

      const breachedSeverity = this.checkSeverity(metric.value, threshold);
      const existingAlert = this.findActiveAlert(protocol.protocolId, threshold.metricType);

      if (breachedSeverity === null) {
        if (existingAlert) {
          existingAlert.resolved = true;
          existingAlert.resolvedAt = now;
          this.logger.log(`Alert resolved for ${protocol.protocolId} [${threshold.metricType}]`);
        }
      } else if (!existingAlert || existingAlert.severity !== breachedSeverity) {
        if (existingAlert) {
          existingAlert.resolved = true;
          existingAlert.resolvedAt = now;
        }

        const thresholdValue =
          breachedSeverity === 'critical' ? threshold.criticalAt : threshold.warnAt;

        const alert: ProtocolAlert = {
          id: randomUUID(),
          protocolId: protocol.protocolId,
          protocolName: protocol.name,
          metricType: threshold.metricType,
          currentValue: metric.value,
          threshold: thresholdValue,
          severity: breachedSeverity,
          message: this.buildMessage(
            protocol.name,
            threshold.metricType,
            metric.value,
            thresholdValue,
            threshold.operator,
            breachedSeverity,
          ),
          triggeredAt: now,
          resolved: false,
        };

        this.alerts.set(alert.id, alert);
        this.logger.warn(`Alert triggered: ${alert.message}`);
      }
    }
  }

  private checkSeverity(value: number, threshold: MetricThreshold): AlertSeverity | null {
    const { operator, warnAt, criticalAt } = threshold;

    if (operator === 'gt') {
      if (value >= criticalAt) return 'critical';
      if (value >= warnAt) return 'warning';
    } else {
      if (value <= criticalAt) return 'critical';
      if (value <= warnAt) return 'warning';
    }

    return null;
  }

  private findActiveAlert(protocolId: string, metricType: MetricType): ProtocolAlert | undefined {
    return Array.from(this.alerts.values()).find(
      a => !a.resolved && a.protocolId === protocolId && a.metricType === metricType,
    );
  }

  private buildSnapshot(protocol: StoredProtocol): ProtocolHealthSnapshot {
    const activeAlerts = Array.from(this.alerts.values()).filter(
      a => !a.resolved && a.protocolId === protocol.protocolId,
    );

    return {
      protocolId: protocol.protocolId,
      name: protocol.name,
      chain: protocol.chain,
      status: this.deriveStatus(activeAlerts),
      lastCheckedAt: protocol.lastCheckedAt ?? new Date().toISOString(),
      metrics: Array.from(protocol.latestMetrics.values()),
      activeAlerts,
    };
  }

  private deriveStatus(activeAlerts: ProtocolAlert[]): ProtocolStatus {
    if (activeAlerts.length === 0) return 'healthy';
    if (activeAlerts.some(a => a.severity === 'critical')) return 'critical';
    return 'degraded';
  }

  private buildMessage(
    name: string,
    metricType: MetricType,
    value: number,
    threshold: number,
    operator: ThresholdOperator,
    severity: AlertSeverity,
  ): string {
    const direction = operator === 'gt' ? 'exceeded' : 'dropped below';
    return `[${severity.toUpperCase()}] Protocol '${name}': ${metricType} ${direction} threshold (current: ${value}, threshold: ${threshold})`;
  }
}
