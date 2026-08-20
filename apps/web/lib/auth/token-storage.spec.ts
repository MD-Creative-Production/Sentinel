import { LocalStorageTokenStorage, MemoryTokenStorage, SESSION_STORAGE_KEY } from './token-storage';
import { AuthSession, hasAnyRole, isSessionValid } from './types';

const session = (overrides: Partial<AuthSession> = {}): AuthSession => ({
  accessToken: 'token-123',
  expiresAt: Date.now() + 60_000,
  user: { id: 'u1', email: 'analyst@sentinel.test', roles: ['USER'] },
  ...overrides,
});

describe('MemoryTokenStorage', () => {
  it('round-trips a session', () => {
    const storage = new MemoryTokenStorage();
    const value = session();

    storage.write(value);
    expect(storage.read()).toEqual(value);
  });

  it('returns null before anything is written', () => {
    expect(new MemoryTokenStorage().read()).toBeNull();
  });

  it('clears the session', () => {
    const storage = new MemoryTokenStorage();
    storage.write(session());
    storage.clear();
    expect(storage.read()).toBeNull();
  });

  it('does not leak the session to localStorage', () => {
    const storage = new MemoryTokenStorage();
    storage.write(session());
    expect(globalThis.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });
});

describe('LocalStorageTokenStorage', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
    jest.restoreAllMocks();
  });

  it('persists a session across instances', () => {
    const value = session();
    new LocalStorageTokenStorage().write(value);

    expect(new LocalStorageTokenStorage().read()).toEqual(value);
  });

  it('treats an expired entry as absent and removes it', () => {
    const expired = session({ expiresAt: Date.now() - 1_000 });
    globalThis.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(expired));

    const storage = new LocalStorageTokenStorage();
    expect(storage.read()).toBeNull();
    expect(globalThis.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it('survives corrupt JSON', () => {
    globalThis.localStorage.setItem(SESSION_STORAGE_KEY, '{ not json');

    expect(() => new LocalStorageTokenStorage().read()).not.toThrow();
    expect(new LocalStorageTokenStorage().read()).toBeNull();
  });

  it('treats an entry without a token as absent', () => {
    globalThis.localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ expiresAt: Date.now() + 60_000 }),
    );
    expect(new LocalStorageTokenStorage().read()).toBeNull();
  });

  // jsdom's localStorage is not spy-able, so these swap the whole object.
  const withLocalStorage = (stub: Partial<Storage>, run: () => void) => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Object.defineProperty(globalThis, 'localStorage', {
      value: stub,
      configurable: true,
      writable: true,
    });
    try {
      run();
    } finally {
      if (original) Object.defineProperty(globalThis, 'localStorage', original);
    }
  };

  it('does not throw when the quota is exceeded', () => {
    withLocalStorage(
      {
        getItem: () => null,
        setItem: () => {
          throw new Error('QuotaExceededError');
        },
        removeItem: () => undefined,
      },
      () => {
        expect(() => new LocalStorageTokenStorage().write(session())).not.toThrow();
      },
    );
  });

  it('does not throw when reading is blocked', () => {
    withLocalStorage(
      {
        getItem: () => {
          throw new Error('SecurityError');
        },
        setItem: () => undefined,
        removeItem: () => undefined,
      },
      () => {
        expect(new LocalStorageTokenStorage().read()).toBeNull();
      },
    );
  });
});

describe('session helpers', () => {
  it('rejects a null session', () => {
    expect(isSessionValid(null)).toBe(false);
  });

  it('rejects an expired session', () => {
    expect(isSessionValid(session({ expiresAt: Date.now() - 1 }))).toBe(false);
  });

  it('accepts a live session', () => {
    expect(isSessionValid(session())).toBe(true);
  });

  it('treats an empty role requirement as satisfied', () => {
    expect(hasAnyRole(null, [])).toBe(true);
  });

  it('requires a user when roles are demanded', () => {
    expect(hasAnyRole(null, ['ADMIN'])).toBe(false);
  });

  it('matches when the user holds one of several roles', () => {
    const user = { id: 'u1', email: 'a@b.c', roles: ['MODERATOR' as const] };
    expect(hasAnyRole(user, ['ADMIN', 'MODERATOR'])).toBe(true);
  });

  it('rejects when the user holds none of them', () => {
    const user = { id: 'u1', email: 'a@b.c', roles: ['USER' as const] };
    expect(hasAnyRole(user, ['ADMIN'])).toBe(false);
  });
});
