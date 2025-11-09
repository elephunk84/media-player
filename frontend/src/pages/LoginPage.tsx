/**
 * Login Page
 *
 * Public page for user authentication with form validation and API integration.
 */

import LoginForm from '../components/LoginForm';
import './LoginPage.css';

/**
 * LoginPage Component
 *
 * Renders the login page with authentication form.
 * Uses LoginForm component for user authentication with React Hook Form validation.
 * Integrates with AuthContext for global authentication state management.
 *
 * Features:
 * - Form validation with React Hook Form
 * - API integration via AuthContext
 * - Automatic redirect to protected routes after login
 * - Error handling and display
 *
 * @example
 * ```tsx
 * <Route path="/login" element={<LoginPage />} />
 * ```
 */
export default function LoginPage() {
  return (
    <div className="login-page">
      <div className="login-page__container">
        <div className="login-page__header">
          <h1 className="login-page__title">Media Player</h1>
          <p className="login-page__subtitle">Self-hosted video management and streaming</p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
