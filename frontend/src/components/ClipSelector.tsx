/**
 * ClipSelector Component
 *
 * Allows searching and selecting clips to add to a playlist.
 * Prevents adding duplicates and shows loading states.
 */

import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { ClipWithVideo } from '../types/video';
import './ClipSelector.css';

interface ClipSelectorProps {
  playlistId: number;
  existingClipIds: number[];
  onAdd: (clipId: number) => Promise<void>;
}

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
 * ClipSelector Component
 *
 * Displays available clips with search functionality.
 * Shows only clips not already in the playlist.
 * Handles adding clips with loading state per clip.
 *
 * @param props - Component props
 * @param props.playlistId - ID of the current playlist
 * @param props.existingClipIds - Array of clip IDs already in the playlist
 * @param props.onAdd - Callback when a clip is added
 */
export default function ClipSelector({
  existingClipIds,
  onAdd,
}: ClipSelectorProps) {
  const [clips, setClips] = useState<ClipWithVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [addingClipId, setAddingClipId] = useState<number | null>(null);

  /**
   * Fetch all clips from the API
   */
  useEffect(() => {
    const fetchClips = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.get<{ clips?: ClipWithVideo[] } | ClipWithVideo[]>('/api/clips');
        const data = response.data;
        setClips(Array.isArray(data) ? data : (data.clips || []));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to fetch clips';
        setError(message);
        console.error('Error fetching clips:', err);
      } finally {
        setLoading(false);
      }
    };

    void fetchClips();
  }, []);

  /**
   * Filter clips based on search query and existing clips
   */
  const filteredClips = clips.filter((clip) => {
    const matchesSearch =
      searchQuery === '' ||
      clip.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clip.video?.title.toLowerCase().includes(searchQuery.toLowerCase());
    const notInPlaylist = !existingClipIds.includes(clip.id);
    return matchesSearch && notInPlaylist;
  });

  /**
   * Handle adding a clip to the playlist
   */
  const handleAddClip = async (clipId: number) => {
    try {
      setAddingClipId(clipId);
      await onAdd(clipId);
      // Note: Parent component should refresh playlist to update existingClipIds
    } catch (err) {
      console.error('Error adding clip:', err);
      alert('Failed to add clip. Please try again.');
    } finally {
      setAddingClipId(null);
    }
  };

  return (
    <div className="clip-selector">
      <div className="clip-selector__header">
        <h3 className="clip-selector__title">Add Clips</h3>
        <div className="clip-selector__search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search clips..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search clips"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="clip-selector__loading">
          <div className="clip-selector__spinner" />
          <p>Loading clips...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="clip-selector__error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p>{error}</p>
        </div>
      )}

      {/* Clips List */}
      {!loading && !error && (
        <>
          {filteredClips.length === 0 ? (
            <div className="clip-selector__empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                <line x1="7" y1="2" x2="7" y2="22" />
              </svg>
              <p>
                {searchQuery
                  ? 'No clips match your search'
                  : 'All clips have been added to this playlist'}
              </p>
            </div>
          ) : (
            <div className="clip-selector__list">
              {filteredClips.map((clip) => {
                const isAdding = addingClipId === clip.id;
                const isOrphaned = !clip.video || !clip.video.isAvailable;

                return (
                  <div key={clip.id} className="clip-selector-item">
                    <div className="clip-selector-item__info">
                      <div className="clip-selector-item__name">{clip.name}</div>
                      <div className="clip-selector-item__meta">
                        {isOrphaned ? (
                          <span className="clip-selector-item__orphan">
                            Source unavailable
                          </span>
                        ) : (
                          <span className="clip-selector-item__video">
                            {clip.video?.title}
                          </span>
                        )}
                        <span className="clip-selector-item__duration">
                          {formatDuration(clip.duration)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => void handleAddClip(clip.id)}
                      disabled={isAdding || isOrphaned}
                      className="clip-selector-item__add"
                      title={isOrphaned ? 'Cannot add orphaned clip' : 'Add to playlist'}
                      aria-label={`Add ${clip.name} to playlist`}
                    >
                      {isAdding ? (
                        <div className="clip-selector-item__spinner" />
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
