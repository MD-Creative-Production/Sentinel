import { NormalizedChainEvent } from './normalized-chain-event.interface';

/**
 * Contract every chain monitor must implement.
 *
 * Extension points:
 * - `chainId` — uniquely identifies the chain in the registry
 * - `normalizeEvent` — translates a raw chain payload to NormalizedChainEvent
 * - `subscribe` — starts emitting events via the provided callback
 * - `isHealthy` — verifies RPC/node connectivity
 *
 * To add a new chain:
 * 1. Implement this interface in monitors/
 * 2. Register the monitor in ChainsModule
 * 3. ChainRegistry picks it up automatically — no other changes needed
 */
export interface IChainMonitor {
  /** Unique chain identifier (e.g. "stellar", "ethereum", "polygon"). */
  readonly chainId: string;

  /**
   * Translate a raw chain-specific event payload into the shared
   * NormalizedChainEvent shape.
   */
  normalizeEvent(rawEvent: Record<string, unknown>): NormalizedChainEvent;

  /**
   * Begin delivering normalized events to the provided callback.
   * Implementations should handle reconnection internally.
   * @param onEvent - Called for each incoming event.
   */
  subscribe(onEvent: (event: NormalizedChainEvent) => void): Promise<void>;

  /** Return true when the underlying RPC / node connection is healthy. */
  isHealthy(): Promise<boolean>;
}
