import { Inject, Injectable, Logger } from '@nestjs/common';
import { ISiemProvider } from './interfaces/siem-provider.interface';
import { SiemEvent } from './interfaces/siem-event.interface';

/**
 * Orchestrates security event forwarding across all registered SIEM providers.
 * Callers never reference a concrete provider — swap or add adapters in
 * SiemModule without touching this service.
 */
@Injectable()
export class SiemService {
  private readonly logger = new Logger(SiemService.name);

  constructor(
    @Inject('SIEM_PROVIDERS')
    private readonly providers: ISiemProvider[],
  ) {}

  /**
   * Forward a security event to every registered SIEM provider.
   * Individual failures are logged but do not abort delivery to remaining providers.
   */
  async forwardEvent(event: SiemEvent): Promise<void> {
    if (this.providers.length === 0) {
      this.logger.warn('No SIEM providers configured — event not forwarded');
      return;
    }

    const results = await Promise.allSettled(
      this.providers.map(provider => provider.forwardEvent(event)),
    );

    results.forEach((result, index) => {
      const name = this.providers[index].providerName;
      if (result.status === 'rejected') {
        this.logger.error(`SIEM provider "${name}" failed: ${String(result.reason)}`);
      }
    });
  }

  /** Returns the health status of every registered SIEM provider. */
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
