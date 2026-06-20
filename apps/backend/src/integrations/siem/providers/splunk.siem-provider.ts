import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ISiemProvider } from '../interfaces/siem-provider.interface';
import { SiemEvent } from '../interfaces/siem-event.interface';
import { SplunkSiemConfig } from '../dto/siem-config.dto';

/**
 * Forwards Sentinel security events to Splunk via the HTTP Event Collector (HEC).
 *
 * Environment variables:
 *   SPLUNK_HEC_URL    — HEC endpoint (e.g. https://splunk.corp:8088/services/collector)
 *   SPLUNK_HEC_TOKEN  — HEC authentication token
 *   SPLUNK_SOURCE_TYPE — optional source type tag (default: "sentinel:security")
 */
@Injectable()
export class SplunkSiemProvider implements ISiemProvider {
  readonly providerName = 'splunk';
  private readonly logger = new Logger(SplunkSiemProvider.name);
  private readonly sourceType: string;

  constructor(private readonly config: SplunkSiemConfig) {
    this.sourceType = config.sourceType ?? 'sentinel:security';
  }

  async forwardEvent(event: SiemEvent): Promise<void> {
    const body = {
      time: Math.floor(new Date(event.timestamp).getTime() / 1000),
      sourcetype: this.sourceType,
      event: {
        event_type: event.eventType,
        title: event.title,
        message: event.message,
        severity: event.severity,
        source: event.source,
        ...event.metadata,
      },
    };

    try {
      await axios.post(this.config.hecUrl, body, {
        headers: {
          Authorization: `Splunk ${this.config.hecToken}`,
          'Content-Type': 'application/json',
        },
      });
      this.logger.log(`Splunk: forwarded event "${event.eventType}"`);
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.text ?? error.message)
        : String(error);
      this.logger.error(`Splunk: forwardEvent failed: ${message}`);
      throw new Error(`SplunkSiemProvider.forwardEvent failed: ${message}`);
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      await axios.get(this.config.hecUrl, {
        headers: { Authorization: `Splunk ${this.config.hecToken}` },
        validateStatus: status => status < 500,
      });
      return true;
    } catch (error) {
      this.logger.warn(`Splunk health check failed: ${String(error)}`);
      return false;
    }
  }
}
