import React from 'react';
import { useAuth } from './AuthContext';
import { AuthRole, hasAnyRole } from './types';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  /** When non-empty, the user must hold at least one of these roles. */
  requiredRoles?: AuthRole[];
  /** Shown to unauthenticated users. Typically the login screen. */
  fallback?: React.ReactNode;
  /** Shown to authenticated users who lack the required role. */
  forbiddenFallback?: React.ReactNode;
  /** Shown while the session is still being resolved. */
  loading?: React.ReactNode;
}

/**
 * Gates its children on authentication, and optionally on role.
 *
 * Three states, not two. While `status` is `unknown` the app has not yet
 * inspected storage, and rendering the fallback then would flash the login
 * screen at users who are in fact signed in — so that case renders `loading`.
 *
 * Being signed out and lacking permission are also kept distinct: the first
 * should send you to sign in, the second should tell you that signing in again
 * will not help.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  fallback = null,
  forbiddenFallback = null,
  loading = null,
}) => {
  const { status, user } = useAuth();

  if (status === 'unknown') {
    return <>{loading}</>;
  }

  if (status !== 'authenticated' || !user) {
    return <>{fallback}</>;
  }

  if (!hasAnyRole(user, requiredRoles)) {
    return <>{forbiddenFallback}</>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
