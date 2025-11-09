/**
 * Playlist Detail/Editor Page
 *
 * Displays playlist with full editing and playback controls.
 * Allows reordering clips, adding/removing clips, and sequential playback.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { PlaylistWithClips, UpdatePlaylistData } from '../types/playlist';
import PlaylistClipList from '../components/PlaylistClipList';
import ClipSelector from '../components/ClipSelector';
import './PlaylistDetailPage.css';

/**
 * Format time in seconds to MM:SS or HH:MM:SS
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * PlaylistDetailPage Component
 *
 * Full playlist editor with:
 * - Playlist metadata display and editing
 * - Clip list with drag-and-drop reordering
 * - Clip selector for adding new clips
 * - Remove clips functionality
 * - Sequential playback button
 * - Delete playlist button
 *
 * Features:
 * - Fetches playlist with clips from GET /api/playlists/:id
 * - Updates playlist via PUT /api/playlists/:id
 * - Deletes playlist via DELETE /api/playlists/:id
 * - Reorders clips via PATCH /api/playlists/:id/reorder
 * - Adds clips via POST /api/playlists/:id/clips
 * - Removes clips via DELETE /api/playlists/:id/clips/:clipId
 *
 * @example
 * ```tsx
 * <Route path="/playlist/:id" element={<PlaylistDetailPage />} />
 * ```
 */
export default function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [playlist, setPlaylist] = useState<PlaylistWithClips | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  /**
   * Fetch playlist with clips
   */
  const fetchPlaylist = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/api/playlists/${id}`);
      setPlaylist(response.data);
      setEditName(response.data.name);
      setEditDescription(response.data.description || '');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load playlist';
      setError(message);
      console.error('Error fetching playlist:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch playlist on component mount
  useEffect(() => {
    void fetchPlaylist();
  }, [id]);

  /**
   * Handle updating playlist metadata
   */
  const handleUpdatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editName.trim()) {
      alert('Playlist name is required');
      return;
    }

    try {
      const data: UpdatePlaylistData = {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      };
      await apiClient.put(`/api/playlists/${id}`, data);
      setIsEditing(false);
      await fetchPlaylist();
    } catch (err) {
      console.error('Error updating playlist:', err);
      alert('Failed to update playlist. Please try again.');
    }
  };

  /**
   * Handle deleting the playlist
   */
  const handleDeletePlaylist = async () => {
    if (!playlist) return;

    if (!window.confirm(`Are you sure you want to delete playlist "${playlist.name}"?`)) {
      return;
    }

    try {
      await apiClient.delete(`/api/playlists/${id}`);
      navigate('/playlists');
    } catch (err) {
      console.error('Error deleting playlist:', err);
      alert('Failed to delete playlist. Please try again.');
    }
  };

  /**
   * Handle reordering clips
   */
  const handleReorderClips = async (clipOrders: Array<{ clipId: number; order: number }>) => {
    await apiClient.patch(`/api/playlists/${id}/reorder`, { clipOrders });
    // Optimistic update handled by PlaylistClipList
  };

  /**
   * Handle removing a clip from the playlist
   */
  const handleRemoveClip = async (clipId: number) => {
    if (!window.confirm('Remove this clip from the playlist?')) {
      return;
    }

    try {
      await apiClient.delete(`/api/playlists/${id}/clips/${clipId}`);
      await fetchPlaylist();
    } catch (err) {
      console.error('Error removing clip:', err);
      alert('Failed to remove clip. Please try again.');
    }
  };

  /**
   * Handle adding a clip to the playlist
   */
  const handleAddClip = async (clipId: number) => {
    const order = playlist?.clips.length || 0;
    await apiClient.post(`/api/playlists/${id}/clips`, { clipId, order });
    await fetchPlaylist();
  };

  /**
   * Handle playing the playlist sequentially
   */
  const handlePlayPlaylist = () => {
    if (!playlist || playlist.clips.length === 0) {
      return;
    }

    // Navigate to first clip with playlist context
    navigate(`/clip/${playlist.clips[0].id}`, {
      state: {
        playlistId: playlist.id,
        playlistName: playlist.name,
        clipIndex: 0,
        clips: playlist.clips,
      },
    });
  };

  if (loading) {
    return (
      <div className="playlist-detail-page">
        <div className="playlist-detail-page__loading">
          <div className="playlist-detail-page__spinner" />
          <p>Loading playlist...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="playlist-detail-page">
        <div className="playlist-detail-page__error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h2>Error Loading Playlist</h2>
          <p>{error}</p>
          <button onClick={() => void fetchPlaylist()} className="playlist-detail-page__retry">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="playlist-detail-page">
        <div className="playlist-detail-page__error">
          <h2>Playlist Not Found</h2>
          <p>The requested playlist could not be found.</p>
          <button onClick={() => navigate('/playlists')} className="playlist-detail-page__retry">
            Back to Playlists
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="playlist-detail-page">
      {/* Header */}
      <div className="playlist-detail-page__header">
        {isEditing ? (
          /* Edit Form */
          <form onSubmit={handleUpdatePlaylist} className="playlist-detail-page__edit-form">
            <div className="playlist-detail-page__form-group">
              <label htmlFor="playlist-name">Name</label>
              <input
                id="playlist-name"
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="playlist-detail-page__form-group">
              <label htmlFor="playlist-description">Description</label>
              <textarea
                id="playlist-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="playlist-detail-page__form-actions">
              <button type="button" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
              <button type="submit" className="playlist-detail-page__save-button">
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          /* Display Mode */
          <>
            <div className="playlist-detail-page__info">
              <h1 className="playlist-detail-page__title">{playlist.name}</h1>
              {playlist.description && (
                <p className="playlist-detail-page__description">{playlist.description}</p>
              )}
              <div className="playlist-detail-page__meta">
                <span>{playlist.clips.length} {playlist.clips.length === 1 ? 'clip' : 'clips'}</span>
                <span>•</span>
                <span>{formatDuration(playlist.totalDuration || 0)}</span>
              </div>
            </div>
            <div className="playlist-detail-page__actions">
              {playlist.clips.length > 0 && (
                <button
                  onClick={handlePlayPlaylist}
                  className="playlist-detail-page__play-button"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <span>Play Playlist</span>
                </button>
              )}
              <button onClick={() => setIsEditing(true)} className="playlist-detail-page__edit-button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <span>Edit</span>
              </button>
              <button
                onClick={handleDeletePlaylist}
                className="playlist-detail-page__delete-button"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
                <span>Delete</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Content */}
      {!isEditing && (
        <div className="playlist-detail-page__content">
          <div className="playlist-detail-page__left">
            <h2>Clips in Playlist</h2>
            <PlaylistClipList
              playlistId={playlist.id}
              clips={playlist.clips}
              onReorder={handleReorderClips}
              onRemove={handleRemoveClip}
            />
          </div>

          <div className="playlist-detail-page__right">
            <ClipSelector
              playlistId={playlist.id}
              existingClipIds={playlist.clips.map((c) => c.id)}
              onAdd={handleAddClip}
            />
          </div>
        </div>
      )}
    </div>
  );
}
