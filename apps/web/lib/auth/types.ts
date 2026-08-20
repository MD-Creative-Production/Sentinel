/**
 * Frontend authentication types.
 *
 * `AuthRole` mirrors the backend `Role` enum in `src/modules/rbac/roles.enum.ts`
 * so the values the UI gates on are the values the API actually issues.
 */
export type AuthRole = 'ADMIN' | 'MODERATOR' | 'USER';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  roles: AuthRole[];
}

/** A logged-in session. `expiresAt` is epoch milliseconds. */
export interface AuthSession {
  accessToken: string;
  expiresAt: number;
  user: AuthUser;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Resolution state of the session.
 *
 * `unknown` matters: on first render the app has not yet inspected storage, and
 * treating that as "unauthenticated" would flash the login screen at users who
 * are in fact signed in.
 */
export type AuthStatus = 'unknown' | 'authenticated' | 'unauthenticated';

/** Mirrors the shape of `ProfileApiError` used elsewhere in `lib/api`. */
export class AuthApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'AuthApiError';
  }

  /** Credentials were rejected, as opposed to the request failing. */
  get isCredentialFailure(): boolean {
    return this.status === 401 || this.status === 403;
  }
}

/** Session is absent or past its expiry. */
export const isSessionValid = (
  session: AuthSession | null,
  now: number = Date.now(),
): session is AuthSession => session !== null && session.expiresAt > now;

/** Whether a user holds at least one of the required roles. */
export const hasAnyRole = (user: AuthUser | null, required: AuthRole[]): boolean => {
  if (required.length === 0) return true;
  if (!user) return false;
  return required.some(role => user.roles.includes(role));
};
