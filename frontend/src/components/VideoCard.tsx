/**
 * Video Card Component
 *
 * Displays a video thumbnail, title, duration, and basic metadata.
 * Used in grid layouts for video library browsing.
 */

import { Link } from 'react-router-dom';
import { Video } from '../types/video';
import './VideoCard.css';

interface VideoCardProps {
  video: Video;
}

/**
 * Format duration from seconds to HH:MM:SS or MM:SS
 *
 * @param seconds - Duration in seconds
 * @returns Formatted duration string
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
 * Format file size to human-readable format
 *
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
function formatFileSize(bytes: number | null): string {
  if (bytes === null) {
    return 'Unknown size';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * VideoCard Component
 *
 * Displays a video with thumbnail placeholder, title, duration, and metadata.
 * Clicking navigates to the video detail page.
 *
 * @param props - Component props
 * @param props.video - Video data to display
 *
 * @example
 * ```tsx
 * <VideoCard video={videoData} />
 * ```
 */
export default function VideoCard({ video }: VideoCardProps) {
  return (
    <Link to={`/video/${video.id}`} className="video-card">
      {/* Thumbnail Placeholder */}
      <div className="video-card__thumbnail">
        <div className="video-card__thumbnail-placeholder">
          <svg
            className="video-card__play-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </div>
        <div className="video-card__duration">{formatDuration(video.duration)}</div>
      </div>

      {/* Video Info */}
      <div className="video-card__info">
        <h3 className="video-card__title" title={video.title}>
          {video.title}
        </h3>

        <div className="video-card__metadata">
          {video.resolution && <span className="video-card__meta-item">{video.resolution}</span>}
          {video.codec && (
            <span className="video-card__meta-item">{video.codec.toUpperCase()}</span>
          )}
          <span className="video-card__meta-item">{formatFileSize(video.fileSize)}</span>
        </div>

        {video.tags && video.tags.length > 0 && (
          <div className="video-card__tags">
            {video.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="video-card__tag">
                {tag}
              </span>
            ))}
            {video.tags.length > 3 && (
              <span className="video-card__tag video-card__tag--more">
                +{video.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
