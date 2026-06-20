import { SiemEvent } from './siem-event.interface';

/**
 * Contract every SIEM provider adapter must implement.
 * Add new platforms (QRadar, Sentinel, etc.) by implementing this interface
 * and registering the adapter in SiemModule — no changes to SiemService needed.
 */
export interface ISiemProvider {
  /** Unique identifier for this provider (e.g. "splunk", "elastic"). */
  readonly providerName: string;

  /** Forward a normalized security event to the SIEM platform. */
  forwardEvent(event: SiemEvent): Promise<void>;

  /** Return true when the provider endpoint is reachable and configured. */
  isHealthy(): Promise<boolean>;
}
