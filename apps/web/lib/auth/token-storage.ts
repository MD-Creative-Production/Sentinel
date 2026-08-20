import { AuthSession, isSessionValid } from './types';

/**
 * Where the session lives between reads.
 *
 * Two implementations ship. The default is in-memory, and that is a deliberate
 * choice for this product: a bearer token in `localStorage` is readable by any
 * script that manages to run on the page, so a single XSS becomes full account
 * takeover of a security console. Keeping it in the JS heap means the token
 * dies with the tab and is never exposed to `document`-level access.
 *
 * The cost is that a page refresh logs the user out. Persisting across reloads
 * safely needs the refresh token in an httpOnly cookie the frontend cannot
 * read, which requires backend support that does not exist yet. Until then
 * `LocalStorageTokenStorage` is available for teams that accept the trade, and
 * it is opt-in rather than the default.
 */
export interface TokenStorage {
  read(): AuthSession | null;
  write(session: AuthSession): void;
  clear(): void;
}

/** Default. The token never leaves the JS heap. */
export class MemoryTokenStorage implements TokenStorage {
  private session: AuthSession | null = null;

  read(): AuthSession | null {
    return this.session;
  }

  write(session: AuthSession): void {
    this.session = session;
  }

  clear(): void {
    this.session = null;
  }
}

export const SESSION_STORAGE_KEY = 'sentinel.auth.session';

/**
 * Opt-in persistence across reloads.
 *
 * Every access is guarded: `localStorage` throws in private browsing modes and
 * when the quota is exceeded, and a failure to persist a session must not take
 * down the login flow.
 */
export class LocalStorageTokenStorage implements TokenStorage {
  constructor(private readonly key: string = SESSION_STORAGE_KEY) {}

  read(): AuthSession | null {
    try {
      const raw = globalThis.localStorage?.getItem(this.key);
      if (!raw) return null;

      const parsed = JSON.parse(raw) as AuthSession;
      // A malformed or expired entry is treated as no session at all, and is
      // removed so it cannot be re-read on every mount.
      if (!parsed?.accessToken || !isSessionValid(parsed)) {
        this.clear();
        return null;
      }
      return parsed;
    } catch {
      // Corrupt JSON, or storage unavailable.
      this.clear();
      return null;
    }
  }

  write(session: AuthSession): void {
    try {
      globalThis.localStorage?.setItem(this.key, JSON.stringify(session));
    } catch {
      // Quota exceeded or storage disabled — the in-memory session in
      // AuthProvider remains authoritative for this tab.
    }
  }

  clear(): void {
    try {
      globalThis.localStorage?.removeItem(this.key);
    } catch {
      // Nothing to do; the caller is discarding the session regardless.
    }
  }
}
