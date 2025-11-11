/**
 * PlaylistCard Component
 *
 * Displays a playlist card with name, description, clip count, and total duration.
 * Includes delete functionality with confirmation.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import type { Playlist } from '../types/playlist';
import './PlaylistCard.css';

interface PlaylistCardProps {
  playlist: Playlist;
  onDelete: (id: number) => void;
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
 * PlaylistCard Component
 *
 * Displays playlist information in a card format with icon,
 * playlist name, description, clip count, and total duration.
 * Includes a delete button with confirmation dialog.
 *
 * @param props - Component props
 * @param props.playlist - Playlist data
 * @param props.onDelete - Callback function when delete is confirmed
 */
export default function PlaylistCard({ playlist, onDelete }: PlaylistCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to detail page
    e.stopPropagation();

    if (window.confirm(`Are you sure you want to delete playlist "${playlist.name}"?`)) {
      onDelete(playlist.id);
    }
  };

  return (
    <Link to={`/playlist/${playlist.id}`} className="playlist-card">
      {/* Thumbnail/Icon Area */}
      <div className="playlist-card-thumbnail">
        <div className="playlist-card-thumbnail-placeholder">
          <svg
            className="playlist-card-thumbnail-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <div className="playlist-card-count">
            {playlist.clipCount} {playlist.clipCount === 1 ? 'clip' : 'clips'}
          </div>
        </div>
      </div>

      {/* Playlist Info */}
      <div className="playlist-card-info">
        <h3 className="playlist-card-name">{playlist.name}</h3>

        {playlist.description && (
          <p className="playlist-card-description">{playlist.description}</p>
        )}

        <div className="playlist-card-meta">
          <div className="playlist-card-stats">
            <svg
              className="playlist-card-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{formatDuration(playlist.totalDuration)}</span>
          </div>
        </div>

        {/* Delete Button */}
        <button
          className="playlist-card-delete"
          onClick={handleDelete}
          title="Delete playlist"
          aria-label={`Delete playlist ${playlist.name}`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </button>
      </div>
    </Link>
  );
}
