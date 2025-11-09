/**
 * Login Form Component
 *
 * User authentication form with validation using React Hook Form.
 * Calls the login API and updates AuthContext on success.
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoginRequest } from '../types/user';
import './LoginForm.css';

/**
 * LoginForm Component
 *
 * Renders a login form with username and password fields.
 * Uses React Hook Form for validation and state management.
 * Authenticates user via AuthContext and redirects on success.
 *
 * Features:
 * - Required field validation
 * - Generic error messages for security
 * - Loading state with disabled submit button
 * - Redirect to intended destination after login
 *
 * @example
 * ```tsx
 * <LoginForm />
 * ```
 */
export default function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>({
    mode: 'onSubmit', // Only validate on submit to avoid premature error messages
  });

  /**
   * Handle form submission
   *
   * @param data - Form data containing username and password
   */
  const onSubmit = async (data: LoginRequest) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      // Call login through AuthContext
      await login(data);

      // Redirect to intended destination or default to /videos
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
      navigate(from || '/videos', { replace: true });
    } catch (error) {
      // Display generic error message for security
      // Don't reveal whether username or password was incorrect
      setErrorMessage('Invalid username or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(onSubmit)(e);
      }}
      className="login-form"
      noValidate
    >
      <div className="login-form__title">
        <h2>Welcome Back</h2>
        <p>Sign in to your account to continue</p>
      </div>

      {/* Display API error message */}
      {errorMessage && (
        <div className="login-form__error" role="alert">
          {errorMessage}
        </div>
      )}

      {/* Username Field */}
      <div className="login-form__field">
        <label htmlFor="username" className="login-form__label">
          Username
        </label>
        <input
          id="username"
          type="text"
          autoComplete="username"
          className={`login-form__input ${errors.username ? 'login-form__input--error' : ''}`}
          {...register('username', {
            required: 'Username is required',
          })}
          disabled={isLoading}
          aria-invalid={errors.username ? 'true' : 'false'}
          aria-describedby={errors.username ? 'username-error' : undefined}
        />
        {errors.username && (
          <span id="username-error" className="login-form__field-error" role="alert">
            {errors.username.message}
          </span>
        )}
      </div>

      {/* Password Field */}
      <div className="login-form__field">
        <label htmlFor="password" className="login-form__label">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className={`login-form__input ${errors.password ? 'login-form__input--error' : ''}`}
          {...register('password', {
            required: 'Password is required',
          })}
          disabled={isLoading}
          aria-invalid={errors.password ? 'true' : 'false'}
          aria-describedby={errors.password ? 'password-error' : undefined}
        />
        {errors.password && (
          <span id="password-error" className="login-form__field-error" role="alert">
            {errors.password.message}
          </span>
        )}
      </div>

      {/* Submit Button */}
      <button type="submit" className="login-form__submit" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}
