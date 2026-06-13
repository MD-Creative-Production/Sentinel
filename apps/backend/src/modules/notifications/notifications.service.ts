import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  INotificationProvider,
  NotificationPayload,
} from './interfaces/notification-provider.interface';

/**
 * Orchestrates alert dispatching across all registered notification providers.
 * Consumers depend only on this service — they never reference a concrete
 * provider directly, making new channels transparent to callers.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @Inject('NOTIFICATION_PROVIDERS')
    private readonly providers: INotificationProvider[],
  ) {}

  /**
   * Send the payload to every registered provider.
   * Individual provider failures are logged but do not abort delivery
   * to the remaining providers.
   */
  async sendAlert(payload: NotificationPayload): Promise<void> {
    if (this.providers.length === 0) {
      this.logger.warn('No notification providers configured — alert not sent');
      return;
    }

    const results = await Promise.allSettled(
      this.providers.map(provider => provider.sendAlert(payload)),
    );

    results.forEach((result, index) => {
      const name = this.providers[index].providerName;
      if (result.status === 'rejected') {
        this.logger.error(`Provider "${name}" failed: ${String(result.reason)}`);
      }
    });
  }

  /**
   * Returns the health status of every registered provider.
   */
  async getProvidersHealth(): Promise<Record<string, boolean>> {
    const entries = await Promise.all(
      this.providers.map(async provider => [
        provider.providerName,
        await provider.isHealthy().catch(() => false),
      ]),
    );
    return Object.fromEntries(entries);
  }

  /** Returns the names of all registered providers. */
  getProviderNames(): string[] {
    return this.providers.map(p => p.providerName);
  }
}
