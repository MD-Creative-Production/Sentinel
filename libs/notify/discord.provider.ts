import axios from 'axios';

export interface AlertPayload {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class DiscordProvider {
  private webhookUrl: string;

  constructor(webhookUrl: string) {
    if (!webhookUrl) {
      throw new Error('Discord Webhook URL is required');
    }
    // Basic validation for URL
    try {
      new URL(webhookUrl);
    } catch {
      throw new Error('Invalid Discord Webhook URL provided');
    }
    this.webhookUrl = webhookUrl;
  }

  /**
   * Sends an alert payload to the configured Discord Webhook.
   * @param payload The alert details
   */
  public async sendAlert(payload: AlertPayload): Promise<void> {
    try {
      const discordPayload = {
        embeds: [
          {
            title: payload.title,
            description: payload.description,
            color: this.getColorForSeverity(payload.severity),
            timestamp: new Date().toISOString(),
          },
        ],
      };

      await axios.post(this.webhookUrl, discordPayload);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to send alert to Discord: ${error.response?.data?.message || error.message}`,
        );
      }
      throw new Error('An unexpected error occurred while sending the alert to Discord.');
    }
  }

  /**
   * Maps severity levels to Discord embed colors.
   */
  private getColorForSeverity(severity: AlertPayload['severity']): number {
    switch (severity) {
      case 'low':
        return 3447003; // Blue
      case 'medium':
        return 16776960; // Yellow
      case 'high':
        return 16737380; // Orange
      case 'critical':
        return 16711680; // Red
      default:
        return 8421504; // Gray
    }
  }
}
