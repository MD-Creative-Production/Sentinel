import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { IChainMonitor } from '../interfaces/chain-monitor.interface';
import { NormalizedChainEvent } from '../interfaces/normalized-chain-event.interface';

/**
 * Stellar chain monitor — the reference IChainMonitor implementation.
 *
 * Polls the Horizon /payments endpoint via SSE-style cursor paging and
 * normalizes each Stellar payment operation to NormalizedChainEvent.
 *
 * Environment variables:
 *   STELLAR_HORIZON_URL — Horizon base URL (default: https://horizon-testnet.stellar.org)
 */
@Injectable()
export class StellarChainMonitor implements IChainMonitor {
  readonly chainId = 'stellar';
  private readonly logger = new Logger(StellarChainMonitor.name);
  private readonly horizonUrl: string;

  constructor(horizonUrl?: string) {
    this.horizonUrl =
      horizonUrl ?? process.env.STELLAR_HORIZON_URL ?? 'https://horizon-testnet.stellar.org';
  }

  normalizeEvent(rawEvent: Record<string, unknown>): NormalizedChainEvent {
    const createdAt =
      typeof rawEvent.created_at === 'string' ? rawEvent.created_at : new Date().toISOString();
    const txHash = typeof rawEvent.transaction_hash === 'string' ? rawEvent.transaction_hash : '';
    const from = typeof rawEvent.from === 'string' ? rawEvent.from : '';
    const to = typeof rawEvent.to === 'string' ? rawEvent.to : undefined;
    const amount = typeof rawEvent.amount === 'string' ? rawEvent.amount : undefined;

    let asset: string | undefined;
    if (rawEvent.asset_type === 'native') {
      asset = 'XLM';
    } else if (typeof rawEvent.asset_code === 'string') {
      asset = rawEvent.asset_code;
    }

    return {
      timestamp: createdAt,
      chainId: this.chainId,
      eventType: typeof rawEvent.type === 'string' ? rawEvent.type : 'payment',
      txHash,
      from,
      to,
      amount,
      asset,
      raw: rawEvent,
    };
  }

  async subscribe(onEvent: (event: NormalizedChainEvent) => void): Promise<void> {
    this.logger.log('StellarChainMonitor: subscribing to Horizon payment stream');

    let cursor = 'now';

    const poll = async () => {
      try {
        const response = await axios.get(`${this.horizonUrl}/payments`, {
          params: { cursor, order: 'asc', limit: 50 },
        });

        const records: Record<string, unknown>[] = Array.isArray(response.data?._embedded?.records)
          ? (response.data._embedded.records as Record<string, unknown>[])
          : [];

        for (const record of records) {
          const normalized = this.normalizeEvent(record);
          onEvent(normalized);
          if (typeof record.paging_token === 'string') {
            cursor = record.paging_token;
          }
        }
      } catch (error) {
        this.logger.warn(`StellarChainMonitor: poll error: ${String(error)}`);
      }

      // Poll every 5 seconds — replace with SSE streaming for production use.
      setTimeout(() => void poll(), 5000);
    };

    await poll();
  }

  async isHealthy(): Promise<boolean> {
    try {
      await axios.get(`${this.horizonUrl}`, { timeout: 5000 });
      return true;
    } catch (error) {
      this.logger.warn(`StellarChainMonitor: health check failed: ${String(error)}`);
      return false;
    }
  }
}
