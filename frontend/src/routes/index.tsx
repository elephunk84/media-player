/**
 * Routes Configuration
 *
 * Defines all application routes with public and protected access.
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import BaseLayout from '../components/BaseLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import LoginPage from '../pages/LoginPage';
import VideosPage from '../pages/VideosPage';
import VideoDetailPage from '../pages/VideoDetailPage';
import ClipsPage from '../pages/ClipsPage';
import PlaylistsPage from '../pages/PlaylistsPage';
import PlaylistDetailPage from '../pages/PlaylistDetailPage';

/**
 * App Routes Component
 *
 * Configures all application routes with public and protected access.
 * Protected routes require authentication and redirect to login if not authenticated.
 *
 * Routes:
 * - / - Redirects to /videos
 * - /login - Public login page
 * - /videos - Protected videos library page
 * - /video/:id - Protected video detail page
 * - /clips - Protected clips library page
 * - /playlists - Protected playlists page
 * - /playlist/:id - Protected playlist detail/editor page
 */
export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes - all require authentication */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <BaseLayout />
          </ProtectedRoute>
        }
      >
        {/* Default redirect to videos */}
        <Route index element={<Navigate to="/videos" replace />} />

        {/* Videos routes */}
        <Route path="videos" element={<VideosPage />} />
        <Route path="video/:id" element={<VideoDetailPage />} />

        {/* Clips routes */}
        <Route path="clips" element={<ClipsPage />} />

        {/* Playlists routes */}
        <Route path="playlists" element={<PlaylistsPage />} />
        <Route path="playlist/:id" element={<PlaylistDetailPage />} />
      </Route>

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
