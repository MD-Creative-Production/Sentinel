/**
 * src/modules/reputation/providers/stub-chain-data.provider.ts
 *
 * TEMPORARY. Replace with a real adapter that calls the existing
 * `chains` (and/or `integrations`) module to fetch actual wallet
 * activity from indexed on-chain data. Kept here only so the reputation
 * module is self-contained and testable until that integration lands.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ChainDataProvider } from '../reputation.service';
import { WalletActivitySnapshot } from '../interfaces/reputation.interfaces';

@Injectable()
export class StubChainDataProvider implements ChainDataProvider {
  private readonly logger = new Logger(StubChainDataProvider.name);

  async getActivitySnapshot(
    walletAddress: string,
    chainId: string,
  ): Promise<WalletActivitySnapshot> {
    this.logger.warn(
      `StubChainDataProvider in use for ${walletAddress} — wire up the real ChainsService before deploying.`,
    );

    return {
      walletAddress,
      chainId,
      firstSeenAt: null,
      lastSeenAt: null,
      totalTransactions: 0,
      activeDaysLast90: 0,
      counterpartyAddresses: [],
    };
  }
}
