'use client';

import React, { useEffect, useState } from 'react';
import { SettingsNav } from '../components/SettingsNav';
import './notifications.css';

interface DiscordSettings {
  enabled: boolean;
  webhookUrl: string;
}

interface TelegramSettings {
  enabled: boolean;
  botToken: string;
  chatId: string;
}

interface WebhookSettings {
  enabled: boolean;
  endpointUrl: string;
  secret: string;
}

interface PreferencesState {
  discord: DiscordSettings;
  telegram: TelegramSettings;
  webhook: WebhookSettings;
}

const STORAGE_KEY = 'sentinel_notification_preferences';

const initialPreferences: PreferencesState = {
  discord: {
    enabled: false,
    webhookUrl: '',
  },
  telegram: {
    enabled: false,
    botToken: '',
    chatId: '',
  },
  webhook: {
    enabled: false,
    endpointUrl: '',
    secret: '',
  },
};

export default function NotificationPreferencesPage() {
  const [preferences, setPreferences] = useState<PreferencesState>(initialPreferences);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Merge with initialPreferences to ensure all fields exist
          setPreferences({
            discord: { ...initialPreferences.discord, ...parsed.discord },
            telegram: { ...initialPreferences.telegram, ...parsed.telegram },
            webhook: { ...initialPreferences.webhook, ...parsed.webhook },
          });
        } catch {
          // Keep default if JSON parsing fails
        }
      }
    }
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Discord validation
    if (preferences.discord.enabled) {
      const url = preferences.discord.webhookUrl.trim();
      if (!url) {
        newErrors.discordUrl = 'Webhook URL is required.';
      } else {
        const discordRegex =
          /^https:\/\/(?:discord|discordapp)\.com\/api\/webhooks\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/;
        if (!discordRegex.test(url)) {
          newErrors.discordUrl =
            'Invalid Discord webhook URL. Must match format: https://discord.com/api/webhooks/{webhookId}/{webhookToken}';
        }
      }
    }

    // Telegram validation
    if (preferences.telegram.enabled) {
      const token = preferences.telegram.botToken.trim();
      const chat = preferences.telegram.chatId.trim();

      if (!token) {
        newErrors.telegramToken = 'Bot Token is required.';
      } else {
        const tokenRegex = /^\d+:[A-Za-z0-9_-]{35}$/;
        if (!tokenRegex.test(token)) {
          newErrors.telegramToken =
            'Invalid Telegram bot token format. Must match standard token (e.g. 123456789:ABCDefGhIJKlmNoPQRsTUVwxyZ123456789).';
        }
      }

      if (!chat) {
        newErrors.telegramChatId = 'Chat ID is required.';
      } else {
        const chatIdRegex = /^-?\d+$/;
        if (!chatIdRegex.test(chat)) {
          newErrors.telegramChatId = 'Invalid Chat ID. Must be a valid integer.';
        }
      }
    }

    // Webhook validation
    if (preferences.webhook.enabled) {
      const url = preferences.webhook.endpointUrl.trim();
      const secret = preferences.webhook.secret.trim();

      if (!url) {
        newErrors.webhookUrl = 'Endpoint URL is required.';
      } else {
        try {
          const parsedUrl = new URL(url);
          if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
            newErrors.webhookUrl = 'Endpoint URL must use HTTP or HTTPS protocol.';
          }
        } catch {
          newErrors.webhookUrl = 'Invalid URL format.';
        }
      }

      if (!secret) {
        newErrors.webhookSecret = 'Signing Secret is required.';
      } else if (secret.length < 8) {
        newErrors.webhookSecret = 'Signing Secret must be at least 8 characters.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (validate()) {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      }
      setStatus({ message: 'Settings saved successfully!', type: 'success' });
    } else {
      setStatus({ message: 'Validation failed. Please correct the errors below.', type: 'error' });
    }
  };

  return (
    <div className="notifications-container w-full">
      <header className="notifications-header">
        <h1 className="notifications-title">Notification Preferences</h1>
        <p className="notifications-subtitle">
          Configure where Sentinel delivers security alerts and events.
        </p>
      </header>

      <div className="notifications-layout">
        <SettingsNav />

        <main className="notifications-content">
          <form onSubmit={handleSave} className="space-y-6">
            {/* Discord section */}
            <section className="notifications-card" aria-label="Discord notification settings">
              <div className="notifications-card-header">
                <h2 className="notifications-card-title">Discord Alerts</h2>
                <label className="notifications-toggle-label">
                  <input
                    type="checkbox"
                    className="notifications-toggle-input"
                    checked={preferences.discord.enabled}
                    onChange={e =>
                      setPreferences({
                        ...preferences,
                        discord: { ...preferences.discord, enabled: e.target.checked },
                      })
                    }
                  />
                  Enabled
                </label>
              </div>

              {preferences.discord.enabled && (
                <div className="notifications-fields">
                  <div className="notifications-field">
                    <label className="notifications-label" htmlFor="discord-webhook-url">
                      Webhook URL
                    </label>
                    <input
                      id="discord-webhook-url"
                      className="notifications-input"
                      type="text"
                      placeholder="https://discord.com/api/webhooks/..."
                      value={preferences.discord.webhookUrl}
                      onChange={e =>
                        setPreferences({
                          ...preferences,
                          discord: { ...preferences.discord, webhookUrl: e.target.value },
                        })
                      }
                      aria-describedby={errors.discordUrl ? 'discord-url-error' : undefined}
                    />
                    {errors.discordUrl && (
                      <span id="discord-url-error" className="notifications-error">
                        {errors.discordUrl}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* Telegram section */}
            <section className="notifications-card" aria-label="Telegram notification settings">
              <div className="notifications-card-header">
                <h2 className="notifications-card-title">Telegram Alerts</h2>
                <label className="notifications-toggle-label">
                  <input
                    type="checkbox"
                    className="notifications-toggle-input"
                    checked={preferences.telegram.enabled}
                    onChange={e =>
                      setPreferences({
                        ...preferences,
                        telegram: { ...preferences.telegram, enabled: e.target.checked },
                      })
                    }
                  />
                  Enabled
                </label>
              </div>

              {preferences.telegram.enabled && (
                <div className="notifications-fields">
                  <div className="notifications-field">
                    <label className="notifications-label" htmlFor="telegram-bot-token">
                      Bot Token
                    </label>
                    <input
                      id="telegram-bot-token"
                      className="notifications-input"
                      type="text"
                      placeholder="123456789:ABCDefGhIJKlmNoPQRsTUVwxyZ123456789"
                      value={preferences.telegram.botToken}
                      onChange={e =>
                        setPreferences({
                          ...preferences,
                          telegram: { ...preferences.telegram, botToken: e.target.value },
                        })
                      }
                      aria-describedby={errors.telegramToken ? 'telegram-token-error' : undefined}
                    />
                    {errors.telegramToken && (
                      <span id="telegram-token-error" className="notifications-error">
                        {errors.telegramToken}
                      </span>
                    )}
                  </div>

                  <div className="notifications-field">
                    <label className="notifications-label" htmlFor="telegram-chat-id">
                      Chat ID
                    </label>
                    <input
                      id="telegram-chat-id"
                      className="notifications-input"
                      type="text"
                      placeholder="-100123456789"
                      value={preferences.telegram.chatId}
                      onChange={e =>
                        setPreferences({
                          ...preferences,
                          telegram: { ...preferences.telegram, chatId: e.target.value },
                        })
                      }
                      aria-describedby={errors.telegramChatId ? 'telegram-chat-error' : undefined}
                    />
                    {errors.telegramChatId && (
                      <span id="telegram-chat-error" className="notifications-error">
                        {errors.telegramChatId}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* Custom Webhook section */}
            <section className="notifications-card" aria-label="Custom webhook settings">
              <div className="notifications-card-header">
                <h2 className="notifications-card-title">Custom Webhook</h2>
                <label className="notifications-toggle-label">
                  <input
                    type="checkbox"
                    className="notifications-toggle-input"
                    checked={preferences.webhook.enabled}
                    onChange={e =>
                      setPreferences({
                        ...preferences,
                        webhook: { ...preferences.webhook, enabled: e.target.checked },
                      })
                    }
                  />
                  Enabled
                </label>
              </div>

              {preferences.webhook.enabled && (
                <div className="notifications-fields">
                  <div className="notifications-field">
                    <label className="notifications-label" htmlFor="webhook-endpoint-url">
                      Endpoint URL
                    </label>
                    <input
                      id="webhook-endpoint-url"
                      className="notifications-input"
                      type="text"
                      placeholder="https://api.yourdomain.com/alerts"
                      value={preferences.webhook.endpointUrl}
                      onChange={e =>
                        setPreferences({
                          ...preferences,
                          webhook: { ...preferences.webhook, endpointUrl: e.target.value },
                        })
                      }
                      aria-describedby={errors.webhookUrl ? 'webhook-url-error' : undefined}
                    />
                    {errors.webhookUrl && (
                      <span id="webhook-url-error" className="notifications-error">
                        {errors.webhookUrl}
                      </span>
                    )}
                  </div>

                  <div className="notifications-field">
                    <label className="notifications-label" htmlFor="webhook-signing-secret">
                      Signing Secret
                    </label>
                    <input
                      id="webhook-signing-secret"
                      className="notifications-input"
                      type="password"
                      placeholder="••••••••••••••••"
                      value={preferences.webhook.secret}
                      onChange={e =>
                        setPreferences({
                          ...preferences,
                          webhook: { ...preferences.webhook, secret: e.target.value },
                        })
                      }
                      aria-describedby={errors.webhookSecret ? 'webhook-secret-error' : undefined}
                    />
                    {errors.webhookSecret && (
                      <span id="webhook-secret-error" className="notifications-error">
                        {errors.webhookSecret}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* Actions and Status messages */}
            <div className="notifications-actions">
              <button type="submit" className="notifications-button">
                Save Preferences
              </button>
              {status && (
                <span className={`notifications-status notifications-status--${status.type}`}>
                  {status.message}
                </span>
              )}
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
