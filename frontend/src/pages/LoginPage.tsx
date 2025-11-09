/**
 * Login Page
 *
 * Public page for user authentication.
 * Will be fully implemented in task 6.3.
 */

import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

/**
 * LoginPage Component
 *
 * Placeholder login page that allows basic authentication for testing.
 * Full implementation with form validation and API integration will be added in task 6.3.
 */
export default function LoginPage() {
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // Placeholder login - just set a token for now
    // Real implementation will come in task 6.3
    localStorage.setItem('token', 'placeholder-token');
    navigate('/videos');
  };

  return (
    <div className="login-page">
      <div className="login-page__container">
        <div className="login-page__card">
          <h1 className="login-page__title">Media Player</h1>
          <p className="login-page__subtitle">Sign in to access your media library</p>

          <form onSubmit={handleLogin} className="login-page__form">
            <div className="login-page__form-group">
              <label htmlFor="username" className="login-page__label">
                Username
              </label>
              <input
                type="text"
                id="username"
                className="login-page__input"
                placeholder="Enter your username"
                required
              />
            </div>

            <div className="login-page__form-group">
              <label htmlFor="password" className="login-page__label">
                Password
              </label>
              <input
                type="password"
                id="password"
                className="login-page__input"
                placeholder="Enter your password"
                required
              />
            </div>

            <button type="submit" className="login-page__button">
              Sign In
            </button>
          </form>

          <p className="login-page__note">
            Note: This is a placeholder login. Full authentication will be implemented in task 6.3.
          </p>
        </div>
      </div>
    </div>
  );
}
