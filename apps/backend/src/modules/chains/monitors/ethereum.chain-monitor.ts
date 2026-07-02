import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import { IChainMonitor } from '../interfaces/chain-monitor.interface';
import { NormalizedChainEvent } from '../interfaces/normalized-chain-event.interface';

/**
 * Ethereum chain monitor — implements IChainMonitor for EVM-compatible chains.
 *
 * Polls the Ethereum JSON-RPC endpoint for new blocks, extracts transactions,
 * and normalizes each to NormalizedChainEvent.
 *
 * Environment variables:
 *   ETHEREUM_RPC_URL — Ethereum JSON-RPC endpoint (default: http://localhost:8545)
 *   ETHEREUM_POLL_INTERVAL_MS — polling interval in milliseconds (default: 15000)
 */
@Injectable()
export class EthereumChainMonitor implements IChainMonitor {
  readonly chainId = 'ethereum';
  private readonly logger = new Logger(EthereumChainMonitor.name);
  private readonly provider: ethers.JsonRpcProvider;
  private readonly pollIntervalMs: number;
  private isPolling = false;

  constructor(rpcUrl?: string, pollIntervalMs?: number) {
    const url = rpcUrl ?? process.env.ETHEREUM_RPC_URL ?? 'http://localhost:8545';
    this.provider = new ethers.JsonRpcProvider(url);
    this.pollIntervalMs =
      (pollIntervalMs ?? Number(process.env.ETHEREUM_POLL_INTERVAL_MS)) || 15000;
    this.logger.log(`EthereumChainMonitor: connecting to ${url}`);
  }

  /**
   * Translate a raw Ethereum transaction into a NormalizedChainEvent.
   *
   * Handles:
   *  - Native ETH transfers (value > 0)
   *  - Contract calls (data field present)
   *  - Contract creation (to is null)
   */
  normalizeEvent(rawEvent: Record<string, unknown>): NormalizedChainEvent {
    const from = typeof rawEvent.from === 'string' ? rawEvent.from : '';
    const to = typeof rawEvent.to === 'string' ? rawEvent.to : undefined;
    const txHash = typeof rawEvent.hash === 'string' ? rawEvent.hash : '';

    let eventType = 'transfer';
    let amount: string | undefined;
    let asset: string | undefined;

    // Native ETH value transfer
    if (typeof rawEvent.value === 'string' || typeof rawEvent.value === 'bigint') {
      const valueWei = BigInt(rawEvent.value as string | bigint);
      if (valueWei > 0n) {
        amount = ethers.formatEther(valueWei);
        asset = 'ETH';
      }
    }

    // Classify event type: contract_deploy > contract_call > transfer
    if (to === undefined) {
      eventType = 'contract_deploy';
    } else if (
      rawEvent.data &&
      typeof rawEvent.data === 'string' &&
      (rawEvent.data as string).length > 2
    ) {
      eventType = 'contract_call';
    }

    let timestamp: string;
    if (typeof rawEvent.blockTimestamp === 'string') {
      timestamp = rawEvent.blockTimestamp;
    } else if (typeof rawEvent.blockTimestamp === 'number') {
      timestamp = new Date((rawEvent.blockTimestamp as number) * 1000).toISOString();
    } else {
      timestamp = new Date().toISOString();
    }

    return {
      timestamp,
      chainId: this.chainId,
      eventType,
      txHash,
      from,
      to,
      amount,
      asset,
      raw: rawEvent,
    };
  }

  async subscribe(onEvent: (event: NormalizedChainEvent) => void): Promise<void> {
    if (this.isPolling) {
      this.logger.warn('EthereumChainMonitor: already polling, skipping duplicate subscribe');
      return;
    }

    this.isPolling = true;
    this.logger.log('EthereumChainMonitor: starting block polling');

    let lastBlock = await this.provider.getBlockNumber().catch(() => undefined);

    const poll = async () => {
      try {
        const currentBlock = await this.provider.getBlockNumber();

        if (lastBlock === undefined) {
          lastBlock = currentBlock;
        }

        // Fetch new blocks since last poll
        const fromBlock = lastBlock + 1;
        if (fromBlock <= currentBlock) {
          for (let blockNum = fromBlock; blockNum <= currentBlock; blockNum++) {
            try {
              const block = await this.provider.getBlock(blockNum, true);
              if (!block?.transactions) continue;

              const txs = Array.isArray(block.transactions) ? block.transactions : [];

              for (const tx of txs) {
                if (typeof tx === 'object' && tx !== null) {
                  // Access getter properties from the TransactionResponse.
                  const txObj = tx as ethers.TransactionResponse;
                  const txPlain: Record<string, unknown> = {
                    hash: txObj.hash,
                    from: txObj.from,
                    to: txObj.to,
                    value: typeof txObj.value === 'bigint' ? txObj.value.toString() : txObj.value,
                    data: txObj.data,
                  };

                  const rawTx: Record<string, unknown> = {
                    ...txPlain,
                    blockTimestamp:
                      typeof block.timestamp === 'number' ? block.timestamp : undefined,
                    blockNumber: block.number,
                  };

                  const normalized = this.normalizeEvent(rawTx);
                  onEvent(normalized);
                }
              }
            } catch (blockError) {
              this.logger.warn(
                `EthereumChainMonitor: error fetching block ${blockNum}: ${String(blockError)}`,
              );
            }
          }

          lastBlock = currentBlock;
        }
      } catch (error) {
        this.logger.warn(`EthereumChainMonitor: poll error: ${String(error)}`);
      }

      setTimeout(() => void poll(), this.pollIntervalMs);
    };

    await poll();
  }

  async isHealthy(): Promise<boolean> {
    try {
      const blockNumber = await this.provider.getBlockNumber();
      return typeof blockNumber === 'number' && blockNumber >= 0;
    } catch (error) {
      this.logger.warn(`EthereumChainMonitor: health check failed: ${String(error)}`);
      return false;
    }
  }
}
