import { AuthApiError, AuthSession, AuthUser, LoginCredentials } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

/** Shape the API returns on a successful login. */
interface LoginResponse {
  accessToken: string;
  /** Lifetime in seconds, as issued by the API. */
  expiresIn: number;
  user: AuthUser;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => ({}))) as {
    message?: string | string[];
  };

  if (!response.ok) {
    const message = Array.isArray(body.message)
      ? body.message.join(', ')
      : (body.message ?? `Request failed with status ${response.status}`);
    throw new AuthApiError(message, response.status);
  }

  return body as T;
}

const authHeaders = (token: string): HeadersInit => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

/**
 * Exchange credentials for a session.
 *
 * `expiresIn` is converted to an absolute `expiresAt` at the boundary, so the
 * rest of the app compares timestamps rather than recomputing a deadline from a
 * duration whose origin it no longer knows.
 */
export async function login(credentials: LoginCredentials): Promise<AuthSession> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  const body = await parseResponse<LoginResponse>(response);
  return {
    accessToken: body.accessToken,
    expiresAt: Date.now() + body.expiresIn * 1000,
    user: body.user,
  };
}

/**
 * Invalidate the session server-side.
 *
 * Deliberately never throws. Logout must clear local state even when the
 * network call fails, otherwise a user on a flaky connection is stuck holding a
 * session they asked to end.
 */
export async function logout(token: string): Promise<void> {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: authHeaders(token),
    });
  } catch {
    // Swallowed on purpose — see above.
  }
}

/** Re-read the current user, used to validate a restored session. */
export async function fetchCurrentUser(token: string): Promise<AuthUser> {
  const response = await fetch(`${API_BASE}/auth/me`, {
    method: 'GET',
    headers: authHeaders(token),
  });

  return parseResponse<AuthUser>(response);
}
