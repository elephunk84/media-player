/**
 * Playlists Page
 *
 * Displays all playlists with create/delete functionality.
 * Manages playlist CRUD operations and navigates to playlist editor.
 */

import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { Playlist, CreatePlaylistData } from '../types/playlist';
import PlaylistCard from '../components/PlaylistCard';
import CreatePlaylistModal from '../components/CreatePlaylistModal';
import './PlaylistsPage.css';

/**
 * PlaylistsPage Component
 *
 * Main playlists page with:
 * - Grid display of playlist cards
 * - Create new playlist button/modal
 * - Delete playlist functionality
 * - Loading and empty states
 *
 * Features:
 * - Fetches playlists from GET /api/playlists
 * - Creates playlists via POST /api/playlists
 * - Deletes playlists via DELETE /api/playlists/:id
 * - Navigates to playlist detail page on card click
 *
 * @example
 * ```tsx
 * <Route path="/playlists" element={<PlaylistsPage />} />
 * ```
 */
export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  /**
   * Fetch all playlists from the API
   */
  const fetchPlaylists = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get<Playlist[]>('/api/playlists');
      setPlaylists(response.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load playlists';
      setError(message);
      console.error('Error fetching playlists:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch playlists on component mount
  useEffect(() => {
    void fetchPlaylists();
  }, []);

  /**
   * Handle creating a new playlist
   */
  const handleCreatePlaylist = async (data: CreatePlaylistData) => {
    await apiClient.post('/api/playlists', data);
    setShowCreateModal(false);
    await fetchPlaylists(); // Refresh the list
  };

  /**
   * Handle deleting a playlist
   */
  const handleDeletePlaylist = async (id: number) => {
    try {
      await apiClient.delete(`/api/playlists/${id}`);
      await fetchPlaylists(); // Refresh the list
    } catch (err) {
      console.error('Error deleting playlist:', err);
      alert('Failed to delete playlist. Please try again.');
    }
  };

  return (
    <div className="playlists-page">
      {/* Header */}
      <div className="playlists-page__header">
        <div>
          <h1 className="playlists-page__title">Playlists</h1>
          <p className="playlists-page__subtitle">Create and manage your clip playlists</p>
        </div>
        <button
          className="playlists-page__create-button"
          onClick={() => setShowCreateModal(true)}
          aria-label="Create new playlist"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Create Playlist</span>
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="playlists-page__loading">
          <div className="playlists-page__spinner" />
          <p>Loading playlists...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="playlists-page__error">
          <svg
            className="playlists-page__error-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h2>Error Loading Playlists</h2>
          <p>{error}</p>
          <button onClick={() => void fetchPlaylists()} className="playlists-page__retry">
            Try Again
          </button>
        </div>
      )}

      {/* Playlists Grid */}
      {!loading && !error && (
        <>
          {playlists.length === 0 ? (
            /* Empty State */
            <div className="playlists-page__empty">
              <svg
                className="playlists-page__empty-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <h2>No Playlists Yet</h2>
              <p>Create your first playlist to organize your clips!</p>
              <button
                className="playlists-page__create-button"
                onClick={() => setShowCreateModal(true)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Create Playlist</span>
              </button>
            </div>
          ) : (
            <>
              {/* Results Summary */}
              <div className="playlists-page__summary">
                {playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'}
              </div>

              {/* Playlists Grid */}
              <div className="playlists-page__grid">
                {playlists.map((playlist) => (
                  <PlaylistCard
                    key={playlist.id}
                    playlist={playlist}
                    onDelete={(id) => void handleDeletePlaylist(id)}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <CreatePlaylistModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreatePlaylist}
        />
      )}
    </div>
  );
}
