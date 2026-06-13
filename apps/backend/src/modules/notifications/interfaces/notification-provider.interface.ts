/**
 * Represents the payload sent to any notification provider.
 */
export interface NotificationPayload {
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, unknown>;
}

/**
 * Common interface that every notification provider must implement.
 * Implement this to add new channels (Slack, PagerDuty, email, etc.)
 * without changing existing alert logic.
 */
export interface INotificationProvider {
  /**
   * Unique identifier for this provider (e.g. "discord", "telegram").
   */
  readonly providerName: string;

  /**
   * Send an alert through this notification channel.
   * @param payload - The structured alert payload to deliver.
   */
  sendAlert(payload: NotificationPayload): Promise<void>;

  /**
   * Verify the provider is reachable and correctly configured.
   * Returns true when the provider is healthy.
   */
  isHealthy(): Promise<boolean>;
}
