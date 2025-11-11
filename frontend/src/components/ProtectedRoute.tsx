/**
 * Protected Route Component
 *
 * Wrapper component that checks authentication before rendering protected content.
 * Redirects to login page if user is not authenticated.
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute Component
 *
 * Checks if user is authenticated before rendering children.
 * If not authenticated, redirects to /login with return URL preserved.
 *
 * Uses AuthContext to determine authentication state.
 * Shows loading state while validating token on initial mount.
 *
 * @param props - Component props
 * @param props.children - Child components to render if authenticated
 *
 * @example
 * ```tsx
 * <Route
 *   path="/videos"
 *   element={
 *     <ProtectedRoute>
 *       <VideosPage />
 *     </ProtectedRoute>
 *   }
 * />
 * ```
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();

  // Show loading state while validating token
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <div>Loading...</div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Preserve the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
