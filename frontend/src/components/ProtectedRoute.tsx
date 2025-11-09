/**
 * Protected Route Component
 *
 * Wrapper component that checks authentication before rendering protected content.
 * Redirects to login page if user is not authenticated.
 */

import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute Component
 *
 * Checks if user is authenticated before rendering children.
 * If not authenticated, redirects to /login with return URL preserved.
 *
 * Authentication is currently checked via localStorage token.
 * This will be enhanced with AuthContext in a future task.
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

  // Check if user is authenticated
  // For now, check localStorage token
  // This will be replaced with AuthContext in task 6.2
  const token = localStorage.getItem('token');
  const isAuthenticated = !!token;

  if (!isAuthenticated) {
    // Redirect to login, preserving the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
