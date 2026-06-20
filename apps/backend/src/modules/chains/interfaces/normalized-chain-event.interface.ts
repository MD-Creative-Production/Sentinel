/**
 * Chain-agnostic representation of a security-relevant blockchain event.
 * Every IChainMonitor normalizes its raw events to this shape so downstream
 * consumers (alerting, SIEM forwarding) work the same regardless of chain.
 */
export interface NormalizedChainEvent {
  /** ISO-8601 timestamp from the chain (block time or ledger close time). */
  timestamp: string;
  /** Identifier of the originating chain (e.g. "stellar", "ethereum"). */
  chainId: string;
  /** Human-readable event classification (e.g. "large_transfer", "contract_call"). */
  eventType: string;
  /** Transaction or operation hash. */
  txHash: string;
  /** Account or address that initiated the event. */
  from: string;
  /** Destination account or contract address, if applicable. */
  to?: string;
  /** Asset amount in the chain's base unit (string to preserve precision). */
  amount?: string;
  /** Asset code or symbol (e.g. "XLM", "ETH", "USDC"). */
  asset?: string;
  /** Raw chain-specific payload for provider-level enrichment. */
  raw: Record<string, unknown>;
}
