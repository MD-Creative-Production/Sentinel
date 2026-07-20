export interface ProtocolHealthMetric {
  chainId: string;
  timestamp: Date;
  transactionCount: number;
  failedTransactionCount: number;
  contractCallCount: number;
  contractDeployCount: number;
  uniqueSenders: number;
  monitorHealthy: boolean;
}

export interface MetricsWindow {
  chainId: string;
  transactionCount: number;
  failedTransactionCount: number;
  contractCallCount: number;
  contractDeployCount: number;
  uniqueSenders: Set<string>;
  eventCount: number;
}

export interface AnomalyDetectionThresholds {
  throughputDropPercent: number;
  failedTxRatePercent: number;
  contractCallSpikeMultiplier: number;
  contractDeploySpikeMultiplier: number;
  eventGapMinutes: number;
  networkErrorCount: number;
}

export const DEFAULT_ANOMALY_THRESHOLDS: AnomalyDetectionThresholds = {
  throughputDropPercent: 50,
  failedTxRatePercent: 15,
  contractCallSpikeMultiplier: 3,
  contractDeploySpikeMultiplier: 5,
  eventGapMinutes: 5,
  networkErrorCount: 10,
};

export interface HealthSnapshotResponse {
  chainId: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  metrics: {
    transactionCount: number;
    failedTransactionCount: number;
    successRate: number;
    contractCallCount: number;
    contractDeployCount: number;
    uniqueSenders: number;
    monitorHealthy: boolean;
  };
  anomalies: string[];
}

export interface ProtocolHealthAlertResponse {
  id: string;
  chainId: string;
  alertType: string;
  severity: string;
  status: string;
  message: string;
  metadata?: unknown;
  createdAt: string;
}
