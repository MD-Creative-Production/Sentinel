import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ISiemProvider } from '../interfaces/siem-provider.interface';
import { SiemEvent } from '../interfaces/siem-event.interface';
import { ElasticSiemConfig } from '../dto/siem-config.dto';

/**
 * Forwards Sentinel security events to Elasticsearch using the ECS-aligned
 * Bulk API. Events land in a configurable index for Elastic SIEM rules to consume.
 *
 * Environment variables:
 *   ELASTIC_URL      — Elasticsearch cluster URL (e.g. https://elastic.corp:9200)
 *   ELASTIC_API_KEY  — API key for authentication
 *   ELASTIC_INDEX    — target index (default: "sentinel-events")
 */
@Injectable()
export class ElasticSiemProvider implements ISiemProvider {
  readonly providerName = 'elastic';
  private readonly logger = new Logger(ElasticSiemProvider.name);
  private readonly index: string;

  constructor(private readonly config: ElasticSiemConfig) {
    this.index = config.index ?? 'sentinel-events';
  }

  async forwardEvent(event: SiemEvent): Promise<void> {
    const doc = {
      '@timestamp': event.timestamp,
      'event.kind': 'alert',
      'event.category': 'intrusion_detection',
      'event.type': event.eventType,
      'event.severity': this.severityToNumeric(event.severity),
      message: event.message,
      labels: {
        title: event.title,
        source: event.source,
        severity: event.severity,
      },
      ...event.metadata,
    };

    const body =
      [JSON.stringify({ index: { _index: this.index } }), JSON.stringify(doc)].join('\n') + '\n';

    try {
      await axios.post(`${this.config.elasticUrl}/_bulk`, body, {
        headers: {
          Authorization: `ApiKey ${this.config.apiKey}`,
          'Content-Type': 'application/x-ndjson',
        },
      });
      this.logger.log(`Elastic: forwarded event "${event.eventType}"`);
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.error?.reason ?? error.message)
        : String(error);
      this.logger.error(`Elastic: forwardEvent failed: ${message}`);
      throw new Error(`ElasticSiemProvider.forwardEvent failed: ${message}`);
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.config.elasticUrl}/_cluster/health`, {
        headers: { Authorization: `ApiKey ${this.config.apiKey}` },
      });
      const status: string = response.data?.status ?? 'red';
      return status !== 'red';
    } catch (error) {
      this.logger.warn(`Elastic health check failed: ${String(error)}`);
      return false;
    }
  }

  private severityToNumeric(severity: SiemEvent['severity']): number {
    const map: Record<SiemEvent['severity'], number> = {
      low: 25,
      medium: 50,
      high: 75,
      critical: 100,
    };
    return map[severity];
  }
}
