/**
 * Configuration for the Splunk HTTP Event Collector (HEC) provider.
 */
export interface SplunkSiemConfig {
  /** Full URL to the Splunk HEC endpoint (e.g. https://splunk.corp:8088/services/collector). */
  hecUrl: string;
  /** HEC token used for authentication. */
  hecToken: string;
  /** Splunk source type tag applied to every event (default: "sentinel:security"). */
  sourceType?: string;
  /** Max retry attempts on transient delivery failure (default: 3). */
  maxRetries?: number;
  /** Base backoff delay in ms between retries, doubled each attempt (default: 500). */
  retryBaseDelayMs?: number;
}

/**
 * Configuration for the Elastic SIEM (ECS) provider.
 */
export interface ElasticSiemConfig {
  /** Full URL to the Elasticsearch cluster (e.g. https://elastic.corp:9200). */
  elasticUrl: string;
  /** Elasticsearch API key for authentication. */
  apiKey: string;
  /** Target index for Sentinel events (default: "sentinel-events"). */
  index?: string;
}
