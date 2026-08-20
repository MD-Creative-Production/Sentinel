import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginForm } from './LoginForm';
import { MemoryTokenStorage } from './token-storage';
import { AuthSession, AuthRole } from './types';

const validSession = (roles: AuthRole[] = ['USER']): AuthSession => ({
  accessToken: 'token-123',
  expiresAt: Date.now() + 60_000,
  user: { id: 'u1', email: 'analyst@sentinel.test', name: 'Analyst', roles },
});

/** Minimal fetch stub; each test declares the response it cares about. */
const mockFetch = (impl: (url: string) => Partial<Response> & { json: () => Promise<unknown> }) => {
  (globalThis as unknown as { fetch: jest.Mock }).fetch = jest.fn((url: string) =>
    Promise.resolve(impl(String(url)) as Response),
  );
};

const okLogin = (roles: AuthRole[] = ['USER']) =>
  mockFetch(() => ({
    ok: true,
    status: 200,
    json: () =>
      Promise.resolve({
        accessToken: 'token-123',
        expiresIn: 3600,
        user: { id: 'u1', email: 'analyst@sentinel.test', roles },
      }),
  }));

/** Surfaces context state for assertions. */
const AuthProbe: React.FC = () => {
  const { status, user, token } = useAuth();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="user">{user?.email ?? 'none'}</span>
      <span data-testid="token">{token ?? 'none'}</span>
    </div>
  );
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe('AuthProvider', () => {
  it('resolves to unauthenticated when storage is empty', async () => {
    render(
      <AuthProvider storage={new MemoryTokenStorage()}>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'));
  });

  it('restores a valid session from storage', async () => {
    const storage = new MemoryTokenStorage();
    storage.write(validSession());

    render(
      <AuthProvider storage={storage}>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));
    expect(screen.getByTestId('user')).toHaveTextContent('analyst@sentinel.test');
  });

  it('ignores and clears an expired stored session', async () => {
    const storage = new MemoryTokenStorage();
    storage.write({ ...validSession(), expiresAt: Date.now() - 1_000 });

    render(
      <AuthProvider storage={storage}>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'));
    expect(storage.read()).toBeNull();
  });

  it('signs in and persists the session', async () => {
    okLogin();
    const storage = new MemoryTokenStorage();

    render(
      <AuthProvider storage={storage}>
        <LoginForm />
        <AuthProbe />
      </AuthProvider>,
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'analyst@sentinel.test' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'correct-horse' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));
    expect(storage.read()?.accessToken).toBe('token-123');
  });

  it('converts expiresIn into an absolute expiry', async () => {
    okLogin();
    const storage = new MemoryTokenStorage();
    const before = Date.now();

    render(
      <AuthProvider storage={storage}>
        <LoginForm />
      </AuthProvider>,
    );

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.c' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'pw' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(storage.read()).not.toBeNull());
    const expiresAt = storage.read()!.expiresAt;
    expect(expiresAt).toBeGreaterThanOrEqual(before + 3600 * 1000);
  });

  it('reports rejected credentials in plain language', async () => {
    mockFetch(() => ({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: 'Unauthorized' }),
    }));

    render(
      <AuthProvider storage={new MemoryTokenStorage()}>
        <LoginForm />
        <AuthProbe />
      </AuthProvider>,
    );

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.c' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/incorrect email or password/i),
    );
    expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated');
  });

  it('signs out and clears storage', async () => {
    okLogin();
    const storage = new MemoryTokenStorage();
    storage.write(validSession());

    const Controls: React.FC = () => {
      const { logout } = useAuth();
      return (
        <button type="button" onClick={() => void logout()}>
          Sign out
        </button>
      );
    };

    render(
      <AuthProvider storage={storage}>
        <Controls />
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign out/i }));
    });

    expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated');
    expect(storage.read()).toBeNull();
  });

  it('signs out locally even when the logout request fails', async () => {
    mockFetch(() => {
      throw new Error('network down');
    });

    const storage = new MemoryTokenStorage();
    storage.write(validSession());

    const Controls: React.FC = () => {
      const { logout } = useAuth();
      return (
        <button type="button" onClick={() => void logout()}>
          Sign out
        </button>
      );
    };

    render(
      <AuthProvider storage={storage}>
        <Controls />
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign out/i }));
    });

    expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated');
    expect(storage.read()).toBeNull();
  });

  it('throws when useAuth is used outside a provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<AuthProbe />)).toThrow(/must be used within an AuthProvider/i);
    spy.mockRestore();
  });
});

describe('ProtectedRoute', () => {
  const Secret = () => <p>Incident data</p>;

  it('shows the fallback when signed out', async () => {
    render(
      <AuthProvider storage={new MemoryTokenStorage()}>
        <ProtectedRoute fallback={<p>Sign in</p>}>
          <Secret />
        </ProtectedRoute>
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByText('Sign in')).toBeInTheDocument());
    expect(screen.queryByText('Incident data')).not.toBeInTheDocument();
  });

  it('renders children when signed in', async () => {
    const storage = new MemoryTokenStorage();
    storage.write(validSession());

    render(
      <AuthProvider storage={storage}>
        <ProtectedRoute fallback={<p>Sign in</p>}>
          <Secret />
        </ProtectedRoute>
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByText('Incident data')).toBeInTheDocument());
  });

  it('distinguishes lacking permission from being signed out', async () => {
    const storage = new MemoryTokenStorage();
    storage.write(validSession(['USER']));

    render(
      <AuthProvider storage={storage}>
        <ProtectedRoute
          requiredRoles={['ADMIN']}
          fallback={<p>Sign in</p>}
          forbiddenFallback={<p>Administrator access required</p>}
        >
          <Secret />
        </ProtectedRoute>
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByText('Administrator access required')).toBeInTheDocument(),
    );
    // Being told to sign in again would be misleading — they already are.
    expect(screen.queryByText('Sign in')).not.toBeInTheDocument();
  });

  it('admits a user holding one of the required roles', async () => {
    const storage = new MemoryTokenStorage();
    storage.write(validSession(['MODERATOR']));

    render(
      <AuthProvider storage={storage}>
        <ProtectedRoute requiredRoles={['ADMIN', 'MODERATOR']}>
          <Secret />
        </ProtectedRoute>
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByText('Incident data')).toBeInTheDocument());
  });
});

describe('LoginForm', () => {
  it('asks for both fields before calling the API', async () => {
    const fetchSpy = jest.fn();
    (globalThis as unknown as { fetch: jest.Mock }).fetch = fetchSpy;

    render(
      <AuthProvider storage={new MemoryTokenStorage()}>
        <LoginForm />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/enter both your email and password/i),
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('calls onSuccess after signing in', async () => {
    okLogin();
    const onSuccess = jest.fn();

    render(
      <AuthProvider storage={new MemoryTokenStorage()}>
        <LoginForm onSuccess={onSuccess} />
      </AuthProvider>,
    );

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.c' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'pw' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  });
});
