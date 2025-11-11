/**
 * Clip Detail Page
 *
 * Displays clip player with metadata editing (inherited vs custom metadata).
 */

import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import VideoPlayer from '../components/VideoPlayer';
import ClipMetadataEditor from '../components/ClipMetadataEditor';
import { useApi } from '../hooks/useApi';
import apiClient from '../services/apiClient';
import type { Clip, Video } from '../types/video';
import type { PlaylistClip } from '../types/playlist';
import './ClipDetailPage.css';

/**
 * Format time in seconds to MM:SS or HH:MM:SS
 */
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Render metadata value (handles arrays, objects, primitives)
 */
function renderMetadataValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  }
  return String(value);
}

interface PlaylistState {
  playlistId: number;
  playlistName: string;
  clipIndex: number;
  clips: PlaylistClip[];
}

export default function ClipDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const clipId = id ? parseInt(id, 10) : undefined;
  const [isSavingMetadata, setIsSavingMetadata] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Playlist context from navigation state
  const playlistState = location.state as PlaylistState | undefined;

  // Fetch clip details
  const {
    data: clip,
    loading: clipLoading,
    error: clipError,
    execute: fetchClip,
  } = useApi<Clip>(() => apiClient.get(`/api/clips/${clipId}`));

  // Fetch source video details (if clip is loaded)
  const {
    data: video,
    loading: videoLoading,
    error: videoError,
    execute: fetchVideo,
  } = useApi<Video>(() => apiClient.get(`/api/videos/${clip?.videoId}`));

  // Fetch clip on mount
  useEffect(() => {
    if (clipId) {
      void fetchClip();
    }
  }, [clipId, fetchClip]);

  // Fetch video when clip is loaded
  useEffect(() => {
    if (clip?.videoId) {
      void fetchVideo();
    }
  }, [clip?.videoId, fetchVideo]);

  // Handle save custom metadata
  const handleSaveMetadata = useCallback(
    async (customMetadata: Record<string, unknown>) => {
      if (!clipId) {
        return;
      }

      setIsSavingMetadata(true);
      setSaveSuccess(false);

      try {
        await apiClient.patch(`/api/clips/${clipId}/metadata`, {
          customMetadata,
        });

        // Reload clip to get updated data
        await fetchClip();

        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } catch (error) {
        console.error('Failed to save metadata:', error);
        alert('Failed to save metadata. Please try again.');
      } finally {
        setIsSavingMetadata(false);
      }
    },
    [clipId, fetchClip]
  );

  // Playlist navigation handlers
  const handleNextClip = useCallback(() => {
    if (!playlistState) {
      return;
    }

    const nextIndex = playlistState.clipIndex + 1;
    if (nextIndex < playlistState.clips.length) {
      const nextClip = playlistState.clips[nextIndex];
      navigate(`/clip/${nextClip.id}`, {
        state: {
          ...playlistState,
          clipIndex: nextIndex,
        },
      });
    }
  }, [playlistState, navigate]);

  const handlePreviousClip = useCallback(() => {
    if (!playlistState) {
      return;
    }

    const prevIndex = playlistState.clipIndex - 1;
    if (prevIndex >= 0) {
      const prevClip = playlistState.clips[prevIndex];
      navigate(`/clip/${prevClip.id}`, {
        state: {
          ...playlistState,
          clipIndex: prevIndex,
        },
      });
    }
  }, [playlistState, navigate]);

  // Validation
  if (!clipId || isNaN(clipId)) {
    return (
      <div className="page">
        <div className="clip-detail-error">
          <h1>Clip Not Found</h1>
          <p>Invalid clip ID</p>
          <Link to="/clips" className="btn btn-primary">
            Back to Clips
          </Link>
        </div>
      </div>
    );
  }

  // Loading state
  if (clipLoading) {
    return (
      <div className="page">
        <div className="clip-detail-loading">
          <div className="spinner" />
          <p>Loading clip...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (clipError || !clip) {
    return (
      <div className="page">
        <div className="clip-detail-error">
          <h1>Error Loading Clip</h1>
          <p>{clipError || 'Clip not found'}</p>
          <Link to="/clips" className="btn btn-primary">
            Back to Clips
          </Link>
        </div>
      </div>
    );
  }

  const isOrphaned = videoError || !video || !video.isAvailable;
  const hasInheritedMetadata = Object.keys(clip.inheritedMetadata).length > 0;

  return (
    <div className="page clip-detail-page">
      <div className="clip-detail-container">
        {/* Breadcrumb */}
        <div className="clip-detail-breadcrumb">
          <Link to="/clips">Clips</Link>
          <span className="breadcrumb-separator">/</span>
          <span>{clip.name}</span>
        </div>

        {/* Playlist Navigation */}
        {playlistState && (
          <div className="playlist-navigation">
            <div className="playlist-navigation__header">
              <Link to={`/playlist/${playlistState.playlistId}`} className="playlist-name">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {playlistState.playlistName}
              </Link>
              <span className="playlist-position">
                Clip {playlistState.clipIndex + 1} of {playlistState.clips.length}
              </span>
            </div>
            <div className="playlist-navigation__controls">
              <button
                onClick={handlePreviousClip}
                disabled={playlistState.clipIndex === 0}
                className="playlist-nav-button"
                title="Previous clip"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                </svg>
                <span>Previous</span>
              </button>
              <button
                onClick={handleNextClip}
                disabled={playlistState.clipIndex >= playlistState.clips.length - 1}
                className="playlist-nav-button"
                title="Next clip"
              >
                <span>Next</span>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 18h2V6h-2zM6 18l8.5-6L6 6z" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Clip Title */}
        <h1 className="clip-detail-title">{clip.name}</h1>

        {/* Success Message */}
        {saveSuccess && <div className="save-success-message">✓ Metadata saved successfully!</div>}

        {/* Video Player */}
        <div className="clip-detail-player">
          <VideoPlayer clipId={clipId} autoplay={false} />
        </div>

        {/* Source Video Info */}
        <div className="clip-detail-source">
          <h2>Source Video</h2>
          {videoLoading ? (
            <p>Loading video information...</p>
          ) : isOrphaned ? (
            <div className="clip-detail-orphan">
              <span className="orphan-icon">⚠</span>
              <span>Source video is unavailable</span>
            </div>
          ) : (
            <div className="clip-detail-source-info">
              <Link to={`/video/${video.id}`} className="source-video-link">
                <strong>{video.title}</strong>
              </Link>
              <div className="source-video-meta">
                Duration: {formatTime(video.duration)}
                {video.resolution && ` • ${video.resolution}`}
              </div>
            </div>
          )}
        </div>

        {/* Clip Metadata */}
        <div className="clip-detail-metadata">
          <h2>Clip Information</h2>
          <div className="metadata-grid">
            <div className="metadata-item">
              <span className="metadata-label">Duration:</span>
              <span className="metadata-value">{formatTime(clip.duration)}</span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Start Time:</span>
              <span className="metadata-value">{formatTime(clip.startTime)}</span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">End Time:</span>
              <span className="metadata-value">{formatTime(clip.endTime)}</span>
            </div>
            {clip.description && (
              <div className="metadata-item metadata-item-full">
                <span className="metadata-label">Description:</span>
                <span className="metadata-value">{clip.description}</span>
              </div>
            )}
          </div>
        </div>

        {/* Inherited Metadata (Read-Only) */}
        {hasInheritedMetadata && (
          <div className="inherited-metadata">
            <div className="metadata-section-header">
              <h2>Inherited Metadata</h2>
              <span className="metadata-badge read-only-badge">Read-Only</span>
            </div>
            <p className="metadata-section-description">
              Metadata inherited from the source video. These values are read-only and cannot be
              edited.
            </p>
            <div className="metadata-list inherited">
              {Object.entries(clip.inheritedMetadata).map(([key, value]) => (
                <div key={key} className="metadata-list-item">
                  <span className="metadata-list-key">{key}:</span>
                  <span className="metadata-list-value">{renderMetadataValue(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custom Metadata (Editable) */}
        <ClipMetadataEditor
          customMetadata={clip.customMetadata}
          onSave={handleSaveMetadata}
          isSaving={isSavingMetadata}
        />

        {/* Actions */}
        <div className="clip-detail-actions">
          <Link to="/clips" className="btn btn-secondary">
            Back to Clips
          </Link>
          {!isOrphaned && video && (
            <Link to={`/video/${video.id}`} className="btn btn-primary">
              View Full Video
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
