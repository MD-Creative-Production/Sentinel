import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import {
  INotificationProvider,
  NotificationPayload,
} from '../interfaces/notification-provider.interface';

/** Discord embed colour values mapped to alert severity. */
const SEVERITY_COLORS: Record<NotificationPayload['severity'], number> = {
  low: 3447003, // Blue
  medium: 16776960, // Yellow
  high: 16737380, // Orange
  critical: 16711680, // Red
};

/**
 * Notification provider that delivers alerts to a Discord channel
 * via an incoming webhook.
 */
@Injectable()
export class DiscordNotificationProvider implements INotificationProvider {
  readonly providerName = 'discord';
  private readonly logger = new Logger(DiscordNotificationProvider.name);

  constructor(private readonly webhookUrl: string) {
    if (!webhookUrl) {
      throw new Error('DiscordNotificationProvider: webhookUrl is required');
    }
    try {
      new URL(webhookUrl);
    } catch {
      throw new Error('DiscordNotificationProvider: invalid webhookUrl format');
    }
  }

  async sendAlert(payload: NotificationPayload): Promise<void> {
    const body = {
      embeds: [
        {
          title: payload.title,
          description: payload.message,
          color: SEVERITY_COLORS[payload.severity],
          timestamp: new Date().toISOString(),
          fields: payload.metadata
            ? Object.entries(payload.metadata).map(([name, value]) => ({
                name,
                value: String(value),
                inline: true,
              }))
            : [],
        },
      ],
    };

    try {
      await axios.post(this.webhookUrl, body);
      this.logger.log(`Discord alert sent: ${payload.title}`);
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.message ?? error.message)
        : String(error);
      this.logger.error(`Discord alert failed: ${message}`);
      throw new Error(`DiscordNotificationProvider.sendAlert failed: ${message}`);
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      // Discord webhooks respond with 405 on GET — that still proves connectivity.
      await axios.get(this.webhookUrl);
      return true;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 405) {
        return true;
      }
      this.logger.warn(`Discord health check failed: ${String(error)}`);
      return false;
    }
  }
}
