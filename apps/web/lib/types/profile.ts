export interface NotificationPreferencesSummary {
  discordEnabled: boolean;
  telegramEnabled: boolean;
  emailEnabled: boolean;
  alertTypes: string[];
}

export interface AccountMetadata {
  watchlistCount: number;
  openAlertsCount: number;
  notificationPreferences: NotificationPreferencesSummary | null;
}

export interface UserProfile {
  id: string;
  email: string;
  createdAt: string;
  metadata: AccountMetadata;
}

export interface UpdateProfileRequest {
  email: string;
}

export class ProfileApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ProfileApiError';
  }
}
