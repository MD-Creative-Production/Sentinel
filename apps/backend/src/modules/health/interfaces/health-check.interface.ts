/** Status of a single dependency check. */
export type HealthStatus = 'up' | 'down';

/** Result for one named dependency. */
export interface DependencyHealthResult {
  status: HealthStatus;
  responseTimeMs?: number;
  error?: string;
}

/** Full response returned by the health endpoint. */
export interface HealthCheckResult {
  status: HealthStatus;
  timestamp: string;
  uptime: number;
  version: string;
  dependencies: Record<string, DependencyHealthResult>;
}
