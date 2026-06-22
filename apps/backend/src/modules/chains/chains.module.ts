import { Module } from '@nestjs/common';
import { ChainRegistryService } from './chain-registry.service';
import { StellarChainMonitor } from './monitors/stellar.chain-monitor';
import { EthereumChainMonitor } from './monitors/ethereum.chain-monitor';
import { IChainMonitor } from './interfaces/chain-monitor.interface';

/**
 * Multi-Chain Monitoring Module.
 *
 * Extension points are documented in IChainMonitor.
 * To add a new chain:
 * 1. Implement IChainMonitor in monitors/
 * 2. Instantiate and add it to the CHAIN_MONITORS array below
 * 3. ChainRegistryService picks it up automatically
 */
@Module({
  providers: [
    ChainRegistryService,
    {
      provide: 'CHAIN_MONITORS',
      useFactory: (): IChainMonitor[] => {
        const monitors: IChainMonitor[] = [new StellarChainMonitor()];

        if (process.env.ETHEREUM_RPC_URL) {
          monitors.push(new EthereumChainMonitor(process.env.ETHEREUM_RPC_URL));
        }

        return monitors;
      },
    },
  ],
  exports: [ChainRegistryService],
})
export class ChainsModule {}
