export interface SplunkEvent {
  time: number;

  host: string;

  source: string;

  sourcetype: string;

  event: {
    eventId?: string;

    eventType: string;

    severity: string;

    title?: string;

    description?: string;

    source?: string;

    transactionHash?: string;

    walletAddress?: string;

    network?: string;

    timestamp?: string | Date;

    metadata?: Record<string, unknown>;
  };
}
