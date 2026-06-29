import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UserProfilePage } from './page';
import { UserProfile } from '../../lib/types/profile';

const mockProfile: UserProfile = {
  id: 'user-1',
  email: 'user@example.com',
  createdAt: '2026-06-15T10:00:00.000Z',
  metadata: {
    watchlistCount: 2,
    openAlertsCount: 1,
    notificationPreferences: {
      discordEnabled: true,
      telegramEnabled: false,
      emailEnabled: true,
      alertTypes: ['critical'],
    },
  },
};

describe('UserProfilePage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the profile page heading', () => {
    render(<UserProfilePage />);
    expect(screen.getByRole('heading', { name: /user profile/i })).toBeInTheDocument();
  });

  it('loads and displays profile data', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockProfile,
    } as Response);

    window.localStorage.setItem('sentinel_user_id', 'user-1');
    render(<UserProfilePage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Email')).toHaveValue('user@example.com');
    });

    expect(screen.getByLabelText('Account ID')).toHaveValue('user-1');
    expect(screen.getByText(/watchlist entries/i)).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('submits profile updates', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfile,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockProfile, email: 'updated@example.com' }),
      } as Response);
    global.fetch = fetchMock;

    window.localStorage.setItem('sentinel_user_id', 'user-1');
    render(<UserProfilePage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Email')).toHaveValue('user@example.com');
    });

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'updated@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining('/profile'),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ email: 'updated@example.com' }),
      }),
    );
  });

  it('shows an error when profile loading fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ message: 'User missing not found' }),
    } as Response);

    window.localStorage.setItem('sentinel_user_id', 'missing');
    render(<UserProfilePage />);

    await waitFor(() => {
      expect(screen.getByText(/user missing not found/i)).toBeInTheDocument();
    });
  });
});
