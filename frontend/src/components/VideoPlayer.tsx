/**
 * Video Player Component
 *
 * Video.js-based player that supports streaming both full videos and clips.
 * Provides custom controls, keyboard shortcuts, and responsive design.
 */

import { useEffect, useRef } from 'react';
import { useVideoPlayer } from '../hooks/useVideoPlayer';
import 'video.js/dist/video-js.css';
import './VideoPlayer.css';

interface VideoPlayerProps {
  videoId?: number;
  clipId?: number;
  autoplay?: boolean;
  controls?: boolean;
  className?: string;
}

/**
 * VideoPlayer Component
 *
 * Renders a Video.js player that streams from the backend API.
 * Supports both full video and clip streaming via different endpoints.
 *
 * Features:
 * - Streams from /api/stream/video/:id or /api/stream/clip/:id
 * - Custom controls (play/pause, seek, volume, fullscreen)
 * - Keyboard shortcuts (space for play/pause, arrows for seek)
 * - Responsive player sizing
 * - Loading and error states
 * - HLS support via Video.js
 *
 * @param props - Component props
 * @param props.videoId - ID of video to stream (mutually exclusive with clipId)
 * @param props.clipId - ID of clip to stream (mutually exclusive with videoId)
 * @param props.autoplay - Whether to autoplay video (default: false)
 * @param props.controls - Whether to show controls (default: true)
 * @param props.className - Additional CSS classes
 *
 * @example
 * ```tsx
 * <VideoPlayer videoId={123} autoplay={false} />
 * <VideoPlayer clipId={456} />
 * ```
 */
export default function VideoPlayer({
  videoId,
  clipId,
  autoplay = false,
  controls = true,
  className = '',
}: VideoPlayerProps) {
  const videoElementRef = useRef<HTMLVideoElement>(null);
  const player = useVideoPlayer();

  // Determine streaming URL based on videoId or clipId
  const streamUrl = videoId
    ? `/api/stream/video/${videoId}`
    : clipId
      ? `/api/stream/clip/${clipId}`
      : null;

  // Initialize player when component mounts or URL changes
  useEffect(() => {
    if (!videoElementRef.current || !streamUrl) {
      return;
    }

    // Initialize Video.js player
    player.initialize(videoElementRef.current, {
      controls,
      autoplay,
      preload: 'auto',
      fluid: true, // Responsive sizing
      responsive: true,
      aspectRatio: '16:9',
      sources: [
        {
          src: streamUrl,
          type: 'video/mp4', // Will auto-detect HLS if available
        },
      ],
      controlBar: {
        playToggle: true,
        volumePanel: {
          inline: false,
        },
        currentTimeDisplay: true,
        timeDivider: true,
        durationDisplay: true,
        progressControl: true,
        remainingTimeDisplay: false,
        fullscreenToggle: true,
        pictureInPictureToggle: false,
      },
    });

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if player is focused or video element is in view
      if (document.activeElement?.tagName === 'INPUT') {
        return;
      }

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          player.togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          player.seek(Math.max(0, player.currentTime - 5));
          break;
        case 'ArrowRight':
          e.preventDefault();
          player.seek(Math.min(player.duration, player.currentTime + 5));
          break;
        case 'ArrowUp':
          e.preventDefault();
          player.setVolume(Math.min(1, player.volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          player.setVolume(Math.max(0, player.volume - 0.1));
          break;
        case 'm':
          e.preventDefault();
          player.toggleMute();
          break;
        case 'f':
          e.preventDefault();
          player.toggleFullscreen();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      player.dispose();
    };
  }, [streamUrl, autoplay, controls, player]);

  // Show error if neither videoId nor clipId is provided
  if (!videoId && !clipId) {
    return (
      <div className={`video-player-error ${className}`}>
        <div className="video-player-error__content">
          <svg
            className="video-player-error__icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p>Error: Must provide either videoId or clipId</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`video-player ${className}`} data-vjs-player>
      {/* Video.js will enhance this video element */}
      <video
        ref={videoElementRef}
        className="video-js vjs-big-play-centered vjs-theme-fantasy"
        playsInline
      />

      {/* Loading State */}
      {player.buffering && (
        <div className="video-player__loading">
          <div className="video-player__spinner" />
        </div>
      )}

      {/* Error State */}
      {player.error && (
        <div className="video-player__error-overlay">
          <div className="video-player__error-content">
            <svg
              className="video-player__error-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="video-player__error-message">{player.error}</p>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help (optional, can be toggled) */}
      <div className="video-player__shortcuts-hint">
        Press <kbd>?</kbd> for keyboard shortcuts
      </div>
    </div>
  );
}
