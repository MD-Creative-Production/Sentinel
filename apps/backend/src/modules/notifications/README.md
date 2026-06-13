# Notifications Module

Standardises alert delivery across notification channels behind a single
provider interface. Adding a new channel (Slack, email, PagerDuty…) never
requires touching existing alert logic.

## Architecture

```
NotificationsService
       │
       ├── DiscordNotificationProvider   (implements INotificationProvider)
       └── TelegramNotificationProvider  (implements INotificationProvider)
```

## Interface

```typescript
interface INotificationProvider {
  readonly providerName: string;
  sendAlert(payload: NotificationPayload): Promise<void>;
  isHealthy(): Promise<boolean>;
}
```

## Adding a new provider

1. Create `providers/my-channel.notification-provider.ts`.
2. Implement `INotificationProvider`.
3. Instantiate it inside the `NOTIFICATION_PROVIDERS` factory in
   `notifications.module.ts`.

That's it — `NotificationsService` will automatically pick it up.

## Environment variables

| Variable              | Required for |
| --------------------- | ------------ |
| `DISCORD_WEBHOOK_URL` | Discord      |
| `TELEGRAM_BOT_TOKEN`  | Telegram     |
| `TELEGRAM_CHAT_ID`    | Telegram     |

Providers are only registered when the relevant env vars are present.

## Closes

GitHub issue #74 — Create Notification Provider Abstraction
