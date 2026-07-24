import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ForwardSentinelEventDto } from './dto/forward-sentinel-event.dto';

import {
  SPLUNK_DEFAULT_MAX_RETRIES,
  SPLUNK_DEFAULT_RETRY_DELAY,
  SPLUNK_DEFAULT_SOURCE,
  SPLUNK_DEFAULT_SOURCETYPE,
} from './splunk.constants';

import { SplunkEvent } from './interfaces/splunk-event.interface';
import { SentinelEvent } from './interfaces/sentinel-event.interface';

@Injectable()
export class SplunkService {
  private readonly logger = new Logger(SplunkService.name);

  private readonly splunkUrl: string;
  private readonly splunkToken: string;
  private readonly maxRetries: number;
  private readonly retryDelay: number;

  constructor(private readonly configService: ConfigService) {
    this.splunkUrl = this.configService.get<string>('SPLUNK_HEC_URL') || '';

    this.splunkToken = this.configService.get<string>('SPLUNK_HEC_TOKEN') || '';

    this.maxRetries =
      this.configService.get<number>('SPLUNK_MAX_RETRIES') || SPLUNK_DEFAULT_MAX_RETRIES;

    this.retryDelay =
      this.configService.get<number>('SPLUNK_RETRY_DELAY') || SPLUNK_DEFAULT_RETRY_DELAY;
  }

  /**
   * Forward a Sentinel event to Splunk.
   */
  async forwardEvent(event: ForwardSentinelEventDto): Promise<void> {
    if (!this.splunkUrl) {
      throw new InternalServerErrorException('Splunk HEC URL is not configured');
    }

    if (!this.splunkToken) {
      throw new InternalServerErrorException('Splunk HEC token is not configured');
    }

    const mappedEvent = this.mapEvent(event);

    await this.sendWithRetry(mappedEvent);
  }

  /**
   * Map Sentinel event into Splunk HEC event format.
   */
  private mapEvent(event: SentinelEvent): SplunkEvent {
    const timestamp = event.timestamp
      ? new Date(event.timestamp).getTime() / 1000
      : Date.now() / 1000;

    return {
      time: timestamp,

      host: 'grantfox',

      source: event.source || SPLUNK_DEFAULT_SOURCE,

      sourcetype: SPLUNK_DEFAULT_SOURCETYPE,

      event: {
        eventId: event.id,

        eventType: event.eventType,

        severity: event.severity,

        title: event.title,

        description: event.description,

        source: event.source,

        transactionHash: event.transactionHash,

        walletAddress: event.walletAddress,

        network: event.network,

        timestamp: event.timestamp,

        metadata: event.metadata,
      },
    };
  }

  /**
   * Send event to Splunk with retry support.
   */
  private async sendWithRetry(event: SplunkEvent): Promise<void> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        await this.sendToSplunk(event);

        this.logger.log(`Sentinel event successfully delivered to Splunk on attempt ${attempt}`);

        return;
      } catch (error) {
        lastError = error;

        this.logger.warn(`Splunk delivery failed on attempt ${attempt}/${this.maxRetries}`);

        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);

          await this.sleep(delay);
        }
      }
    }

    this.logger.error(
      'Failed to deliver Sentinel event to Splunk after all retry attempts',
      lastError,
    );

    throw new ServiceUnavailableException('Unable to deliver event to Splunk');
  }

  /**
   * Send event to Splunk HTTP Event Collector.
   */
  private async sendToSplunk(event: SplunkEvent): Promise<void> {
    const response = await fetch(this.splunkUrl, {
      method: 'POST',

      headers: {
        Authorization: `Splunk ${this.splunkToken}`,

        'Content-Type': 'application/json',
      },

      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const responseBody = await response.text();

      throw new Error(`Splunk returned HTTP ${response.status}: ${responseBody}`);
    }
  }

  /**
   * Delay execution before retry.
   */
  private async sleep(milliseconds: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, milliseconds));
  }
}
