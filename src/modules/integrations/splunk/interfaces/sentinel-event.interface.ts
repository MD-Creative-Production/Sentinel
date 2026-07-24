export interface SentinelEvent {
  id?: string;

  eventType: string;

  severity: string;

  title?: string;

  description?: string;

  timestamp?: string | Date;

  source?: string;

  transactionHash?: string;

  walletAddress?: string;

  network?: string;

  metadata?: Record<string, unknown>;
}
