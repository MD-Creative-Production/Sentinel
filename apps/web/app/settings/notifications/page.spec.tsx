import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import NotificationPreferencesPage from './page';

describe('NotificationPreferencesPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.clearAllMocks();
  });

  it('renders page headers and disabled form toggles initially', () => {
    render(<NotificationPreferencesPage />);

    expect(screen.getByRole('heading', { name: /notification preferences/i })).toBeInTheDocument();
    expect(
      screen.getByText(/configure where sentinel delivers security alerts/i),
    ).toBeInTheDocument();

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(3);
    checkboxes.forEach(cb => {
      expect(cb).not.toBeChecked();
    });
  });

  it('toggles Discord input visibility and validates invalid discord webhook URL', () => {
    render(<NotificationPreferencesPage />);

    const toggles = screen.getAllByRole('checkbox');
    // First toggle is Discord
    const discCb = toggles[0];

    fireEvent.click(discCb);
    expect(discCb).toBeChecked();

    const input = screen.getByLabelText(/webhook url/i);
    expect(input).toBeInTheDocument();

    // Input invalid URL and save
    fireEvent.change(input, { target: { value: 'https://invalid-discord.com' } });
    fireEvent.click(screen.getByRole('button', { name: /save preferences/i }));

    expect(screen.getByText(/invalid discord webhook url/i)).toBeInTheDocument();
    expect(screen.getByText(/validation failed/i)).toBeInTheDocument();
  });

  it('saves Discord preferences successfully on valid input', () => {
    render(<NotificationPreferencesPage />);

    const toggles = screen.getAllByRole('checkbox');
    fireEvent.click(toggles[0]); // Enable Discord

    const input = screen.getByLabelText(/webhook url/i);
    fireEvent.change(input, {
      target: { value: 'https://discord.com/api/webhooks/123456789/ABC_XYZ-123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /save preferences/i }));

    expect(screen.queryByText(/invalid discord webhook url/i)).not.toBeInTheDocument();
    expect(screen.getByText(/settings saved successfully!/i)).toBeInTheDocument();

    // Verify localStorage persistence
    const saved = JSON.parse(
      window.localStorage.getItem('sentinel_notification_preferences') || '{}',
    );
    expect(saved.discord.enabled).toBe(true);
    expect(saved.discord.webhookUrl).toBe('https://discord.com/api/webhooks/123456789/ABC_XYZ-123');
  });

  it('toggles Telegram inputs and validates Bot Token and Chat ID formats', () => {
    render(<NotificationPreferencesPage />);

    const toggles = screen.getAllByRole('checkbox');
    fireEvent.click(toggles[1]); // Enable Telegram

    const botTokenInput = screen.getByLabelText(/bot token/i);
    const chatIdInput = screen.getByLabelText(/chat id/i);

    // Empty validation check
    fireEvent.click(screen.getByRole('button', { name: /save preferences/i }));
    expect(screen.getByText(/bot token is required/i)).toBeInTheDocument();
    expect(screen.getByText(/chat id is required/i)).toBeInTheDocument();

    // Invalid format check
    fireEvent.change(botTokenInput, { target: { value: 'invalid_token' } });
    fireEvent.change(chatIdInput, { target: { value: 'not-an-integer' } });
    fireEvent.click(screen.getByRole('button', { name: /save preferences/i }));

    expect(screen.getByText(/invalid telegram bot token format/i)).toBeInTheDocument();
    expect(screen.getByText(/invalid chat id/i)).toBeInTheDocument();

    // Valid formats check
    fireEvent.change(botTokenInput, {
      target: { value: '123456789:ABCDefGhIJKlmNoPQRsTUVwxyZ123456789' },
    });
    fireEvent.change(chatIdInput, { target: { value: '-100123456789' } });
    fireEvent.click(screen.getByRole('button', { name: /save preferences/i }));

    expect(screen.queryByText(/invalid telegram bot token format/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/invalid chat id/i)).not.toBeInTheDocument();
    expect(screen.getByText(/settings saved successfully!/i)).toBeInTheDocument();
  });

  it('toggles Custom Webhook inputs and validates URL and Secret fields', () => {
    render(<NotificationPreferencesPage />);

    const toggles = screen.getAllByRole('checkbox');
    fireEvent.click(toggles[2]); // Enable Custom Webhook

    const urlInput = screen.getByLabelText(/endpoint url/i);
    const secretInput = screen.getByLabelText(/signing secret/i);

    // Empty validation
    fireEvent.click(screen.getByRole('button', { name: /save preferences/i }));
    expect(screen.getByText(/endpoint url is required/i)).toBeInTheDocument();
    expect(screen.getByText(/signing secret is required/i)).toBeInTheDocument();

    // Invalid format/length
    fireEvent.change(urlInput, { target: { value: 'not-a-url' } });
    fireEvent.change(secretInput, { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: /save preferences/i }));

    expect(screen.getByText(/invalid url format/i)).toBeInTheDocument();
    expect(screen.getByText(/signing secret must be at least 8 characters/i)).toBeInTheDocument();

    // Valid inputs
    fireEvent.change(urlInput, { target: { value: 'https://api.sentinel.com/webhook' } });
    fireEvent.change(secretInput, { target: { value: 'supersecret123' } });
    fireEvent.click(screen.getByRole('button', { name: /save preferences/i }));

    expect(screen.queryByText(/invalid url format/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/signing secret must be at least 8/i)).not.toBeInTheDocument();
    expect(screen.getByText(/settings saved successfully!/i)).toBeInTheDocument();
  });
});
