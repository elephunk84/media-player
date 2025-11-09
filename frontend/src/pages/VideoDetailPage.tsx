/**
 * Video Detail Page
 *
 * Displays video player with metadata, clip creation tools, and clip markers.
 */

import { useParams } from 'react-router-dom';
import { useEffect, useCallback } from 'react';
import VideoPlayer from '../components/VideoPlayer';
import ClipCreator from '../components/ClipCreator';
import ClipMarkerTimeline from '../components/ClipMarkerTimeline';
import { useApi } from '../hooks/useApi';
import { useVideoPlayer } from '../hooks/useVideoPlayer';
import apiClient from '../services/apiClient';
import type { Video, ClipsResponse, CreateClipInput } from '../types/video';
import './VideoDetailPage.css';

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
 * Format file size in bytes to human-readable format
 */
function formatFileSize(bytes: number | null): string {
  if (bytes === null) {
    return 'Unknown';
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

export default function VideoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const videoId = id ? parseInt(id, 10) : undefined;
  const player = useVideoPlayer();

  // Fetch video details
  const {
    data: video,
    loading: videoLoading,
    error: videoError,
    execute: fetchVideo,
  } = useApi<Video>(() => apiClient.get(`/api/videos/${videoId}`));

  // Fetch clips for this video
  const {
    data: clipsData,
    loading: clipsLoading,
    error: clipsError,
    execute: fetchClips,
  } = useApi<ClipsResponse>(() => apiClient.get(`/api/clips?videoId=${videoId}`));

  const clips = clipsData?.clips || [];

  // Fetch video on mount or when videoId changes
  useEffect(() => {
    if (videoId) {
      void fetchVideo();
    }
  }, [videoId, fetchVideo]);

  // Fetch clips on mount or when videoId changes
  useEffect(() => {
    if (videoId) {
      void fetchClips();
    }
  }, [videoId, fetchClips]);

  // Handle clip creation
  const handleCreateClip = useCallback(async (clipData: CreateClipInput) => {
    await apiClient.post('/api/clips', clipData);
  }, []);

  // Handle clip created - refresh clips list
  const handleClipCreated = useCallback(() => {
    void fetchClips();
  }, [fetchClips]);

  // Handle seek to clip
  const handleSeekToClip = useCallback(
    (startTime: number) => {
      player.seek(startTime);
    },
    [player]
  );

  // Validation
  if (!videoId || isNaN(videoId)) {
    return (
      <div className="page">
        <div className="video-detail-error">
          <h1>Video Not Found</h1>
          <p>Invalid video ID</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (videoLoading) {
    return (
      <div className="page">
        <div className="video-detail-loading">
          <div className="spinner" />
          <p>Loading video...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (videoError || !video) {
    return (
      <div className="page">
        <div className="video-detail-error">
          <h1>Error Loading Video</h1>
          <p>{videoError || 'Video not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page video-detail-page">
      <div className="video-detail-container">
        {/* Video Title */}
        <h1 className="video-detail-title">{video.title}</h1>

        {/* Video Player */}
        <div className="video-detail-player">
          <VideoPlayer videoId={videoId} autoplay={false} playerInstance={player} />
        </div>

        {/* Clip Markers Timeline */}
        {!clipsLoading && !clipsError && clips.length > 0 && (
          <ClipMarkerTimeline
            clips={clips}
            videoDuration={video.duration}
            onSeekToClip={handleSeekToClip}
          />
        )}

        {/* Video Metadata */}
        <div className="video-detail-metadata">
          <h2>Video Information</h2>
          <div className="metadata-grid">
            <div className="metadata-item">
              <span className="metadata-label">Duration:</span>
              <span className="metadata-value">{formatTime(video.duration)}</span>
            </div>
            {video.resolution && (
              <div className="metadata-item">
                <span className="metadata-label">Resolution:</span>
                <span className="metadata-value">{video.resolution}</span>
              </div>
            )}
            {video.codec && (
              <div className="metadata-item">
                <span className="metadata-label">Codec:</span>
                <span className="metadata-value">{video.codec}</span>
              </div>
            )}
            {video.fileSize !== null && (
              <div className="metadata-item">
                <span className="metadata-label">File Size:</span>
                <span className="metadata-value">{formatFileSize(video.fileSize)}</span>
              </div>
            )}
            {video.tags && video.tags.length > 0 && (
              <div className="metadata-item metadata-item-full">
                <span className="metadata-label">Tags:</span>
                <span className="metadata-value">
                  {video.tags.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </span>
              </div>
            )}
            {video.description && (
              <div className="metadata-item metadata-item-full">
                <span className="metadata-label">Description:</span>
                <span className="metadata-value">{video.description}</span>
              </div>
            )}
          </div>
        </div>

        {/* Clip Creator */}
        <ClipCreator
          videoId={videoId}
          videoDuration={video.duration}
          currentTime={player.currentTime}
          onClipCreated={handleClipCreated}
          onCreateClip={handleCreateClip}
        />

        {/* Keyboard Shortcuts Help */}
        <div className="keyboard-shortcuts">
          <h3>Keyboard Shortcuts</h3>
          <div className="shortcuts-grid">
            <div className="shortcut-item">
              <kbd>Space</kbd> or <kbd>K</kbd>
              <span>Play/Pause</span>
            </div>
            <div className="shortcut-item">
              <kbd>←</kbd> / <kbd>→</kbd>
              <span>Seek backward/forward 5s</span>
            </div>
            <div className="shortcut-item">
              <kbd>↑</kbd> / <kbd>↓</kbd>
              <span>Volume up/down</span>
            </div>
            <div className="shortcut-item">
              <kbd>M</kbd>
              <span>Toggle mute</span>
            </div>
            <div className="shortcut-item">
              <kbd>F</kbd>
              <span>Toggle fullscreen</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
