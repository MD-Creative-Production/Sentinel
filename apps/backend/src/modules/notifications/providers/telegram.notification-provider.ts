import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import {
  INotificationProvider,
  NotificationPayload,
} from '../interfaces/notification-provider.interface';

const SEVERITY_EMOJI: Record<NotificationPayload['severity'], string> = {
  low: '🔵',
  medium: '🟡',
  high: '🟠',
  critical: '🔴',
};

/**
 * Notification provider that delivers alerts to a Telegram chat
 * via the Telegram Bot API.
 */
@Injectable()
export class TelegramNotificationProvider implements INotificationProvider {
  readonly providerName = 'telegram';
  private readonly logger = new Logger(TelegramNotificationProvider.name);
  private readonly apiBase: string;

  constructor(
    private readonly botToken: string,
    private readonly chatId: string,
  ) {
    if (!botToken) throw new Error('TelegramNotificationProvider: botToken is required');
    if (!chatId) throw new Error('TelegramNotificationProvider: chatId is required');
    this.apiBase = `https://api.telegram.org/bot${this.botToken}`;
  }

  async sendAlert(payload: NotificationPayload): Promise<void> {
    const emoji = SEVERITY_EMOJI[payload.severity];
    const lines: string[] = [
      `${emoji} *${this.escapeMarkdown(payload.title)}*`,
      '',
      this.escapeMarkdown(payload.message),
    ];

    if (payload.metadata) {
      lines.push('');
      for (const [key, value] of Object.entries(payload.metadata)) {
        lines.push(`• *${this.escapeMarkdown(key)}*: ${this.escapeMarkdown(String(value))}`);
      }
    }

    const text = lines.join('\n');

    try {
      await axios.post(`${this.apiBase}/sendMessage`, {
        chat_id: this.chatId,
        text,
        parse_mode: 'MarkdownV2',
      });
      this.logger.log(`Telegram alert sent: ${payload.title}`);
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.description ?? error.message)
        : String(error);
      this.logger.error(`Telegram alert failed: ${message}`);
      throw new Error(`TelegramNotificationProvider.sendAlert failed: ${message}`);
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await axios.get<{ ok: boolean }>(`${this.apiBase}/getMe`);
      return response.data.ok === true;
    } catch (error) {
      this.logger.warn(`Telegram health check failed: ${String(error)}`);
      return false;
    }
  }

  /** Escapes special characters required by Telegram's MarkdownV2 format. */
  private escapeMarkdown(text: string): string {
    return text.replace(/[_*[\]()~`>#+=|{}.!\\-]/g, char => `\\${char}`);
  }
}
