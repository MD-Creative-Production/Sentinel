export type ProtocolStatus = 'healthy' | 'degraded' | 'critical' | 'unknown';
export type MetricType = 'transaction_count' | 'error_rate' | 'response_time_ms' | 'active_users';
export type AlertSeverity = 'warning' | 'critical';
export type ThresholdOperator = 'gt' | 'lt';

export interface MetricThreshold {
  metricType: MetricType;
  /** 'gt' = alert when value exceeds threshold; 'lt' = alert when value drops below */
  operator: ThresholdOperator;
  warnAt: number;
  criticalAt: number;
}

export interface RegisterProtocolDto {
  protocolId: string;
  name: string;
  chain: string;
  thresholds: MetricThreshold[];
}

export interface MetricEntry {
  type: MetricType;
  value: number;
}

export interface RecordMetricDto {
  protocolId: string;
  metrics: MetricEntry[];
}

export interface ProtocolMetricSnapshot {
  type: MetricType;
  value: number;
  recordedAt: string;
}

export interface ProtocolAlert {
  id: string;
  protocolId: string;
  protocolName: string;
  metricType: MetricType;
  currentValue: number;
  threshold: number;
  severity: AlertSeverity;
  message: string;
  triggeredAt: string;
  resolved: boolean;
  resolvedAt?: string;
}

export interface ProtocolHealthSnapshot {
  protocolId: string;
  name: string;
  chain: string;
  status: ProtocolStatus;
  lastCheckedAt: string;
  metrics: ProtocolMetricSnapshot[];
  activeAlerts: ProtocolAlert[];
}
