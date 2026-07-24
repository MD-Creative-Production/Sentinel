/**
 * src/modules/reputation/providers/stub-sanctions-list.provider.ts
 *
 * TEMPORARY. Replace with a real adapter over the platform's
 * sanctioned/flagged address source (behavioral-analysis module, an
 * OFAC feed, Chainalysis, etc). All checks default to "clean" so the
 * module is safe to boot in dev/test without a live feed.
 */
import { Injectable, Logger } from '@nestjs/common';
import { SanctionsListProvider } from '../services/risk-indicator.service';

@Injectable()
export class StubSanctionsListProvider implements SanctionsListProvider {
  private readonly logger = new Logger(StubSanctionsListProvider.name);
  private warned = false;

  async isSanctioned(_walletAddress: string): Promise<boolean> {
    this.warnOnce();
    return false;
  }

  async isKnownMixer(_walletAddress: string): Promise<boolean> {
    this.warnOnce();
    return false;
  }

  async isFlaggedContract(_walletAddress: string, _chainId: string): Promise<boolean> {
    this.warnOnce();
    return false;
  }

  private warnOnce() {
    if (!this.warned) {
      this.logger.warn(
        'StubSanctionsListProvider in use — no sanctions/mixer/flagged-contract data source is wired up yet.',
      );
      this.warned = true;
    }
  }
}
