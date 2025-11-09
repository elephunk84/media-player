/**
 * ClipCard Component
 *
 * Displays a clip card with name, duration, and source video information.
 * Handles orphaned clips (source video unavailable).
 */

import { Link } from 'react-router-dom';
import type { ClipWithVideo } from '../types/video';
import './ClipCard.css';

interface ClipCardProps {
  clip: ClipWithVideo;
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
 * ClipCard Component
 *
 * Displays clip information in a card format with thumbnail placeholder,
 * clip name, duration, and source video title. Handles orphaned clips
 * by indicating when the source video is unavailable.
 *
 * @param props - Component props
 * @param props.clip - Clip with optional video information
 */
export default function ClipCard({ clip }: ClipCardProps) {
  const isOrphaned = !clip.video || !clip.video.isAvailable;
  const videoTitle = clip.video?.title || 'Unknown Video';

  return (
    <Link to={`/clip/${clip.id}`} className="clip-card">
      {/* Thumbnail Placeholder */}
      <div className="clip-card-thumbnail">
        <div className="clip-card-thumbnail-placeholder">
          <svg
            className="clip-card-thumbnail-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
          <div className="clip-card-duration">{formatDuration(clip.duration)}</div>
        </div>
      </div>

      {/* Clip Info */}
      <div className="clip-card-info">
        <h3 className="clip-card-name">{clip.name}</h3>

        <div className="clip-card-meta">
          <div className="clip-card-video">
            {isOrphaned && <span className="clip-card-orphan-badge">⚠</span>}
            <span className={isOrphaned ? 'clip-card-video-unavailable' : ''}>{videoTitle}</span>
          </div>

          <div className="clip-card-time">
            {formatDuration(clip.startTime)} - {formatDuration(clip.endTime)}
          </div>
        </div>

        {isOrphaned && <div className="clip-card-orphan-message">Source video unavailable</div>}
      </div>
    </Link>
  );
}
