import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ISiemProvider } from '../interfaces/siem-provider.interface';
import { SiemEvent } from '../interfaces/siem-event.interface';
import { SplunkSiemConfig } from '../dto/siem-config.dto';

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Returns true if an error is worth retrying: transient network failures,
 * server-side errors (5xx), and rate limiting (429). Returns false for
 * other 4xx errors, since retrying malformed requests or bad auth will
 * never succeed.
 */
function isRetryable(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false;
  }
  if (!error.response) {
    // Request never reached the server (DNS failure, connection refused, timeout).
    return true;
  }
  const status = error.response.status;
  return status === 429 || (status >= 500 && status <= 599);
}

/**
 * Forwards Sentinel security events to Splunk via the HTTP Event Collector (HEC).
 *
 * Environment variables:
 *   SPLUNK_HEC_URL    — HEC endpoint (e.g. https://splunk.corp:8088/services/collector)
 *   SPLUNK_HEC_TOKEN  — HEC authentication token
 *   SPLUNK_SOURCE_TYPE — optional source type tag (default: "sentinel:security")
 *   SPLUNK_MAX_RETRIES — optional retry attempts on transient failure (default: 3)
 *   SPLUNK_RETRY_BASE_DELAY_MS — optional base backoff delay in ms (default: 500)
 */
@Injectable()
export class SplunkSiemProvider implements ISiemProvider {
  readonly providerName = 'splunk';
  private readonly logger = new Logger(SplunkSiemProvider.name);
  private readonly sourceType: string;
  private readonly maxRetries: number;
  private readonly retryBaseDelayMs: number;

  constructor(private readonly config: SplunkSiemConfig) {
    this.sourceType = config.sourceType ?? 'sentinel:security';
    this.maxRetries = config.maxRetries ?? 3;
    this.retryBaseDelayMs = config.retryBaseDelayMs ?? 500;
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

    let lastError: unknown;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        await axios.post(this.config.hecUrl, body, {
          headers: {
            Authorization: `Splunk ${this.config.hecToken}`,
            'Content-Type': 'application/json',
          },
        });
        this.logger.log(`Splunk: forwarded event "${event.eventType}"`);
        return;
      } catch (error) {
        lastError = error;

        const isLastAttempt = attempt === this.maxRetries;
        if (isLastAttempt || !isRetryable(error)) {
          break;
        }

        const delay = this.retryBaseDelayMs * Math.pow(2, attempt);
        this.logger.warn(
          `Splunk: forwardEvent attempt ${attempt + 1} failed, retrying in ${delay}ms`,
        );
        await sleep(delay);
      }
    }

    const message = axios.isAxiosError(lastError)
      ? (lastError.response?.data?.text ?? lastError.message)
      : String(lastError);
    this.logger.error(`Splunk: forwardEvent failed: ${message}`);
    throw new Error(`SplunkSiemProvider.forwardEvent failed: ${message}`);
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
