import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { DiscordNotificationProvider } from './providers/discord.notification-provider';
import { TelegramNotificationProvider } from './providers/telegram.notification-provider';
import { INotificationProvider } from './interfaces/notification-provider.interface';

/**
 * Provides a registry of notification providers and a unified service
 * for dispatching alerts to one or more channels.
 *
 * To add a new provider:
 * 1. Implement `INotificationProvider` in `providers/`
 * 2. Register it in the `NOTIFICATION_PROVIDERS` token below
 */
@Module({
  providers: [
    NotificationsService,
    {
      provide: 'NOTIFICATION_PROVIDERS',
      useFactory: (): INotificationProvider[] => {
        const providers: INotificationProvider[] = [];

        if (process.env.DISCORD_WEBHOOK_URL) {
          providers.push(new DiscordNotificationProvider(process.env.DISCORD_WEBHOOK_URL));
        }

        if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
          providers.push(
            new TelegramNotificationProvider(
              process.env.TELEGRAM_BOT_TOKEN,
              process.env.TELEGRAM_CHAT_ID,
            ),
          );
        }

        return providers;
      },
    },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
