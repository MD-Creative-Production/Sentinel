/**
 * Normalized security event forwarded to SIEM platforms.
 * All provider adapters receive this common shape.
 */
export interface SiemEvent {
  /** ISO-8601 timestamp of when the event occurred. */
  timestamp: string;
  /** Short machine-readable event type (e.g. "suspicious_transaction"). */
  eventType: string;
  /** Human-readable summary. */
  title: string;
  /** Full description with contextual detail. */
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Source chain or system (e.g. "stellar", "ethereum", "internal"). */
  source: string;
  /** Arbitrary key-value pairs for provider-specific enrichment. */
  metadata?: Record<string, unknown>;
}
