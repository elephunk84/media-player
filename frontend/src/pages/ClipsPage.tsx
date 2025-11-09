/**
 * Clips Page
 *
 * Displays all clips with filtering by source video.
 */

import { useEffect, useState, useMemo } from 'react';
import ClipCard from '../components/ClipCard';
import { useApi } from '../hooks/useApi';
import apiClient from '../services/apiClient';
import type { ClipsResponse, VideosResponse, ClipWithVideo, Video } from '../types/video';
import './ClipsPage.css';

export default function ClipsPage() {
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);

  // Fetch all clips (or filtered by videoId)
  const {
    data: clipsData,
    loading: clipsLoading,
    error: clipsError,
    execute: fetchClips,
  } = useApi<ClipsResponse>(() => {
    const url = selectedVideoId ? `/api/clips?videoId=${selectedVideoId}` : '/api/clips';
    return apiClient.get(url);
  });

  // Fetch all videos for the filter dropdown
  const {
    data: videosData,
    loading: videosLoading,
    execute: fetchVideos,
  } = useApi<VideosResponse>(() => apiClient.get('/api/videos?limit=1000'));

  // Fetch clips on mount or when filter changes
  useEffect(() => {
    void fetchClips();
  }, [selectedVideoId, fetchClips]);

  // Fetch videos on mount
  useEffect(() => {
    void fetchVideos();
  }, [fetchVideos]);

  // Memoize clips and videos arrays to avoid recreating them on every render
  const clips = useMemo(() => clipsData?.clips || [], [clipsData?.clips]);
  const videos = useMemo(() => videosData?.videos || [], [videosData?.videos]);

  // Create a map of videoId to video for quick lookup
  const videoMap = useMemo(() => {
    const map = new Map<number, Video>();
    videos.forEach((video) => {
      map.set(video.id, video);
    });
    return map;
  }, [videos]);

  // Enhance clips with video information
  const clipsWithVideo: ClipWithVideo[] = useMemo(() => {
    return clips.map((clip) => {
      const video = videoMap.get(clip.videoId);
      return {
        ...clip,
        video: video
          ? {
              id: video.id,
              title: video.title,
              filePath: video.filePath,
              duration: video.duration,
              isAvailable: video.isAvailable,
            }
          : undefined,
      };
    });
  }, [clips, videoMap]);

  // Handle filter change
  const handleFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelectedVideoId(value ? parseInt(value, 10) : null);
  };

  // Handle clear filter
  const handleClearFilter = () => {
    setSelectedVideoId(null);
  };

  return (
    <div className="page clips-page">
      <div className="clips-header">
        <h1>Clips Library</h1>
        <p>Browse and manage your video clips.</p>
      </div>

      {/* Filter Section */}
      <div className="clips-filter">
        <div className="filter-group">
          <label htmlFor="video-filter">Filter by Source Video:</label>
          <select
            id="video-filter"
            value={selectedVideoId || ''}
            onChange={handleFilterChange}
            disabled={videosLoading}
          >
            <option value="">All Videos</option>
            {videos.map((video) => (
              <option key={video.id} value={video.id}>
                {video.title}
              </option>
            ))}
          </select>
        </div>

        {selectedVideoId && (
          <button onClick={handleClearFilter} className="btn btn-secondary">
            Clear Filter
          </button>
        )}

        <div className="clips-count">
          {clipsData && `${clipsData.count} clip${clipsData.count !== 1 ? 's' : ''}`}
        </div>
      </div>

      {/* Loading State */}
      {clipsLoading && (
        <div className="clips-loading">
          <div className="spinner" />
          <p>Loading clips...</p>
        </div>
      )}

      {/* Error State */}
      {clipsError && (
        <div className="clips-error">
          <p>Error loading clips: {clipsError}</p>
        </div>
      )}

      {/* Empty State */}
      {!clipsLoading && !clipsError && clipsWithVideo.length === 0 && (
        <div className="clips-empty">
          <svg
            className="empty-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
          <h2>No Clips Found</h2>
          {selectedVideoId ? (
            <p>No clips found for the selected video. Try selecting a different video.</p>
          ) : (
            <p>Start creating clips from your videos to see them here.</p>
          )}
        </div>
      )}

      {/* Clips Grid */}
      {!clipsLoading && !clipsError && clipsWithVideo.length > 0 && (
        <div className="clips-grid">
          {clipsWithVideo.map((clip) => (
            <ClipCard key={clip.id} clip={clip} />
          ))}
        </div>
      )}
    </div>
  );
}
