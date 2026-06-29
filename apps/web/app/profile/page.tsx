'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { getProfile, updateProfile } from '../../lib/api/profile';
import { ProfileApiError, UserProfile } from '../../lib/types/profile';
import './profile.css';

const USER_ID_STORAGE_KEY = 'sentinel_user_id';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

function resolveInitialUserId(): string {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_USER_ID ?? '';
  }

  return window.localStorage.getItem(USER_ID_STORAGE_KEY) ?? process.env.NEXT_PUBLIC_USER_ID ?? '';
}

export const UserProfilePage: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [userIdInput, setUserIdInput] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error'>('info');

  const loadProfile = useCallback(async (resolvedUserId: string) => {
    if (!resolvedUserId.trim()) {
      setProfile(null);
      setStatusMessage('Enter your user ID to load the profile.');
      setStatusType('info');
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    try {
      const data = await getProfile(resolvedUserId.trim());
      setProfile(data);
      setEmail(data.email);
      setStatusMessage(null);
    } catch (error) {
      setProfile(null);
      const message = error instanceof ProfileApiError ? error.message : 'Failed to load profile.';
      setStatusMessage(message);
      setStatusType('error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialUserId = resolveInitialUserId();
    setUserId(initialUserId);
    setUserIdInput(initialUserId);
    void loadProfile(initialUserId);
  }, [loadProfile]);

  const handleConnect = () => {
    const trimmed = userIdInput.trim();
    setUserId(trimmed);

    if (typeof window !== 'undefined') {
      if (trimmed) {
        window.localStorage.setItem(USER_ID_STORAGE_KEY, trimmed);
      } else {
        window.localStorage.removeItem(USER_ID_STORAGE_KEY);
      }
    }

    void loadProfile(trimmed);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!userId.trim()) {
      setStatusMessage('User ID is required before saving.');
      setStatusType('error');
      return;
    }

    setSaving(true);
    setStatusMessage(null);

    try {
      const updated = await updateProfile(userId.trim(), { email: email.trim() });
      setProfile(updated);
      setEmail(updated.email);
      setStatusMessage('Profile updated successfully.');
      setStatusType('success');
    } catch (error) {
      const message =
        error instanceof ProfileApiError ? error.message : 'Failed to update profile.';
      setStatusMessage(message);
      setStatusType('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-container">
      <header className="profile-header">
        <h1 className="profile-title">User Profile</h1>
        <p className="profile-subtitle">Manage your Sentinel account information and metadata.</p>
      </header>

      <div className="profile-grid">
        <section className="profile-card" aria-label="Account connection">
          <h2 className="profile-card-title">Account Connection</h2>
          <div className="profile-field">
            <label className="profile-label" htmlFor="user-id">
              User ID
            </label>
            <input
              id="user-id"
              className="profile-input"
              value={userIdInput}
              onChange={event => setUserIdInput(event.target.value)}
              placeholder="Paste your Sentinel user ID"
              aria-label="User ID"
            />
          </div>
          <div className="profile-actions">
            <button type="button" className="profile-button" onClick={handleConnect}>
              Load Profile
            </button>
            {loading && <span className="profile-status profile-status--info">Loading...</span>}
          </div>
          <p className="profile-dev-note">
            Temporary auth via <code>X-User-Id</code> until login is implemented (#80).
          </p>
        </section>

        {profile ? (
          <>
            <section className="profile-card" aria-label="Profile information">
              <h2 className="profile-card-title">Profile Information</h2>
              <form onSubmit={handleSave}>
                <div className="profile-field">
                  <label className="profile-label" htmlFor="profile-id">
                    Account ID
                  </label>
                  <input
                    id="profile-id"
                    className="profile-input"
                    value={profile.id}
                    readOnly
                    aria-readonly="true"
                  />
                </div>
                <div className="profile-field">
                  <label className="profile-label" htmlFor="profile-email">
                    Email
                  </label>
                  <input
                    id="profile-email"
                    className="profile-input"
                    type="email"
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                    required
                    aria-label="Email"
                  />
                </div>
                <div className="profile-actions">
                  <button type="submit" className="profile-button" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  {statusMessage && (
                    <span className={`profile-status profile-status--${statusType}`}>
                      {statusMessage}
                    </span>
                  )}
                </div>
              </form>
            </section>

            <section className="profile-card" aria-label="Account metadata">
              <h2 className="profile-card-title">Account Metadata</h2>
              <ul className="profile-meta-list">
                <li className="profile-meta-item">
                  <span className="profile-meta-label">Member since</span>
                  <span className="profile-meta-value">{formatDate(profile.createdAt)}</span>
                </li>
                <li className="profile-meta-item">
                  <span className="profile-meta-label">Watchlist entries</span>
                  <span className="profile-meta-value">{profile.metadata.watchlistCount}</span>
                </li>
                <li className="profile-meta-item">
                  <span className="profile-meta-label">Open alerts</span>
                  <span className="profile-meta-value">{profile.metadata.openAlertsCount}</span>
                </li>
              </ul>

              {profile.metadata.notificationPreferences ? (
                <div className="profile-prefs" aria-label="Notification preferences summary">
                  <h3 className="profile-label">Notification preferences</h3>
                  <div className="profile-pref-row">
                    <span>Discord</span>
                    <span>
                      {profile.metadata.notificationPreferences.discordEnabled
                        ? 'Enabled'
                        : 'Disabled'}
                    </span>
                  </div>
                  <div className="profile-pref-row">
                    <span>Telegram</span>
                    <span>
                      {profile.metadata.notificationPreferences.telegramEnabled
                        ? 'Enabled'
                        : 'Disabled'}
                    </span>
                  </div>
                  <div className="profile-pref-row">
                    <span>Email</span>
                    <span>
                      {profile.metadata.notificationPreferences.emailEnabled
                        ? 'Enabled'
                        : 'Disabled'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="profile-dev-note">No notification preferences configured yet.</p>
              )}
            </section>
          </>
        ) : (
          !loading && (
            <section className="profile-card profile-empty" role="status">
              {statusMessage ?? 'Connect with a user ID to view your profile.'}
            </section>
          )
        )}
      </div>
    </div>
  );
};

export default UserProfilePage;
