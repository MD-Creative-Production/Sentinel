import React, { useState } from 'react';
import { useAuth } from './AuthContext';

export interface LoginFormProps {
  /** Called after a successful sign-in. */
  onSuccess?: () => void;
  heading?: string;
}

/**
 * Credential sign-in form.
 *
 * The submit button stays enabled while fields are empty so that pressing it
 * surfaces validation messages, rather than leaving the user with a dead
 * control and no explanation. It disables only while a request is in flight.
 */
export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  heading = 'Sign in to Sentinel',
}) => {
  const { login, error, isSubmitting } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      setValidationError('Enter both your email and password.');
      return;
    }
    setValidationError(null);

    const ok = await login({ email: email.trim(), password });
    if (ok) onSuccess?.();
  };

  const message = validationError ?? error;

  return (
    <form className="auth-login" onSubmit={handleSubmit} aria-label="Sign in">
      <h1 className="auth-login-heading">{heading}</h1>

      <label className="auth-field" htmlFor="auth-email">
        Email
        <input
          id="auth-email"
          type="email"
          value={email}
          autoComplete="username"
          onChange={event => setEmail(event.target.value)}
        />
      </label>

      <label className="auth-field" htmlFor="auth-password">
        Password
        <input
          id="auth-password"
          type="password"
          value={password}
          autoComplete="current-password"
          onChange={event => setPassword(event.target.value)}
        />
      </label>

      {message && (
        <p className="auth-error" role="alert">
          {message}
        </p>
      )}

      <button className="auth-submit" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
};

export default LoginForm;
