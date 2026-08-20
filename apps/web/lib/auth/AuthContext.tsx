import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as authApi from './auth-api';
import { MemoryTokenStorage, TokenStorage } from './token-storage';
import {
  AuthApiError,
  AuthSession,
  AuthStatus,
  AuthUser,
  LoginCredentials,
  isSessionValid,
} from './types';

export interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  /** Current access token, or null. Exposed for API clients that need it. */
  token: string | null;
  /** Last login failure, cleared on the next attempt. */
  error: string | null;
  isSubmitting: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  children: React.ReactNode;
  /** Injectable so tests, and apps that opt into persistence, can swap it. */
  storage?: TokenStorage;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children, storage }) => {
  // Held in a ref so swapping storage never re-runs the restore effect, and so
  // the default instance is stable across renders.
  const storageRef = useRef<TokenStorage>(storage ?? new MemoryTokenStorage());

  const [session, setSession] = useState<AuthSession | null>(null);
  const [status, setStatus] = useState<AuthStatus>('unknown');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Restore once on mount. Until this runs, status stays 'unknown' so guards
  // render a loading state rather than briefly showing the login screen to
  // someone who is already signed in.
  useEffect(() => {
    const restored = storageRef.current.read();
    if (isSessionValid(restored)) {
      setSession(restored);
      setStatus('authenticated');
    } else {
      // An expired entry is cleared rather than left to fail on first use.
      storageRef.current.clear();
      setStatus('unauthenticated');
    }
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const newSession = await authApi.login(credentials);
      storageRef.current.write(newSession);
      setSession(newSession);
      setStatus('authenticated');
      return true;
    } catch (caught) {
      const message =
        caught instanceof AuthApiError && caught.isCredentialFailure
          ? 'Incorrect email or password.'
          : caught instanceof Error
            ? caught.message
            : 'Unable to sign in. Please try again.';

      setError(message);
      setStatus('unauthenticated');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    const token = session?.accessToken;

    // Local state is cleared first. If the network call is slow or fails, the
    // user is still signed out of this tab, which is what they asked for.
    storageRef.current.clear();
    setSession(null);
    setStatus('unauthenticated');
    setError(null);

    if (token) {
      await authApi.logout(token);
    }
  }, [session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user: session?.user ?? null,
      token: session?.accessToken ?? null,
      error,
      isSubmitting,
      login,
      logout,
    }),
    [status, session, error, isSubmitting, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/** Access the auth state. Throws outside a provider, which is a wiring bug. */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
