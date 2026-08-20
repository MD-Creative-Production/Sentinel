import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// The 'unknown' window closes as soon as the provider's restore effect runs, so
// it cannot be observed through AuthProvider in a test. Stubbing useAuth pins
// the contract directly: an unresolved session must render `loading`, never the
// signed-out fallback, or users who are signed in see the login screen flash.
jest.mock('./AuthContext', () => ({
  useAuth: () => ({
    status: 'unknown',
    user: null,
    token: null,
    error: null,
    isSubmitting: false,
    login: jest.fn(),
    logout: jest.fn(),
  }),
}));

import { ProtectedRoute } from './ProtectedRoute';

describe('ProtectedRoute while the session is unresolved', () => {
  it('renders the loading state, not the signed-out fallback', () => {
    render(
      <ProtectedRoute loading={<p>Checking session</p>} fallback={<p>Sign in</p>}>
        <p>Incident data</p>
      </ProtectedRoute>,
    );

    expect(screen.getByText('Checking session')).toBeInTheDocument();
    expect(screen.queryByText('Sign in')).not.toBeInTheDocument();
    expect(screen.queryByText('Incident data')).not.toBeInTheDocument();
  });
});
