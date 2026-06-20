import { Inject, Injectable, Logger } from '@nestjs/common';
import { IChainMonitor } from './interfaces/chain-monitor.interface';
import { NormalizedChainEvent } from './interfaces/normalized-chain-event.interface';

/**
 * Central registry for all chain monitors.
 *
 * Routes events to the correct monitor by chainId and provides a unified
 * subscription point so consumers receive normalized events from every chain
 * through a single callback.
 */
@Injectable()
export class ChainRegistryService {
  private readonly logger = new Logger(ChainRegistryService.name);
  private readonly registry = new Map<string, IChainMonitor>();

  constructor(
    @Inject('CHAIN_MONITORS')
    monitors: IChainMonitor[],
  ) {
    for (const monitor of monitors) {
      this.registry.set(monitor.chainId, monitor);
      this.logger.log(`Registered chain monitor: ${monitor.chainId}`);
    }
  }

  /** Return the monitor registered for the given chainId, or undefined. */
  getMonitor(chainId: string): IChainMonitor | undefined {
    return this.registry.get(chainId);
  }

  /** Return all registered chain IDs. */
  getChainIds(): string[] {
    return Array.from(this.registry.keys());
  }

  /**
   * Subscribe to normalized events from every registered chain.
   * The same callback receives events from all chains; use event.chainId to filter.
   */
  async subscribeAll(onEvent: (event: NormalizedChainEvent) => void): Promise<void> {
    if (this.registry.size === 0) {
      this.logger.warn('ChainRegistry: no monitors registered');
      return;
    }

    await Promise.all(
      Array.from(this.registry.values()).map(monitor =>
        monitor.subscribe(onEvent).catch((err: unknown) => {
          this.logger.error(
            `ChainRegistry: monitor "${monitor.chainId}" subscribe error: ${String(err)}`,
          );
        }),
      ),
    );
  }

  /** Returns a health map for all registered chain monitors. */
  async getHealth(): Promise<Record<string, boolean>> {
    const entries = await Promise.all(
      Array.from(this.registry.entries()).map(async ([chainId, monitor]) => [
        chainId,
        await monitor.isHealthy().catch(() => false),
      ]),
    );
    return Object.fromEntries(entries);
  }
}
