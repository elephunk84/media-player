/**
 * Base Layout Component
 *
 * Provides the common layout structure for all protected pages.
 * Includes navigation header and content outlet.
 */

import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './BaseLayout.css';

/**
 * BaseLayout Component
 *
 * Wraps all protected pages with a common navigation header and layout structure.
 * Uses React Router's Outlet to render child routes.
 * Uses AuthContext for logout functionality.
 *
 * @example
 * ```tsx
 * <Route path="/" element={<BaseLayout />}>
 *   <Route path="videos" element={<VideosPage />} />
 * </Route>
 * ```
 */
export default function BaseLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    // Clear authentication using AuthContext
    logout();
    navigate('/login');
  };

  return (
    <div className="base-layout">
      {/* Navigation Header */}
      <header className="base-layout__header">
        <div className="base-layout__header-content">
          <h1 className="base-layout__logo">
            <Link to="/videos">Media Player</Link>
          </h1>

          <nav className="base-layout__nav">
            <Link to="/videos" className="base-layout__nav-link">
              Videos
            </Link>
            <Link to="/clips" className="base-layout__nav-link">
              Clips
            </Link>
            <Link to="/playlists" className="base-layout__nav-link">
              Playlists
            </Link>
          </nav>

          <div className="base-layout__actions">
            <button onClick={handleLogout} className="base-layout__logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="base-layout__main">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="base-layout__footer">
        <p>&copy; 2024 Media Player. Self-hosted video management.</p>
      </footer>
    </div>
  );
}
