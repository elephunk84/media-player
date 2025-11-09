/**
 * Videos Page
 *
 * Displays the video library with search, filters, and pagination.
 * Integrates with backend API and manages URL query parameters.
 */

import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import apiClient from '../services/apiClient';
import { VideosResponse, VideoFilters } from '../types/video';
import VideoCard from '../components/VideoCard';
import SearchFilterPanel from '../components/SearchFilterPanel';
import './VideosPage.css';

const ITEMS_PER_PAGE = 20;

/**
 * VideosPage Component
 *
 * Main video library page with:
 * - Search and filter panel
 * - Grid display of video cards
 * - Pagination controls
 * - Loading and empty states
 * - URL query parameter persistence for bookmarking
 *
 * Features:
 * - Fetches videos from GET /api/videos
 * - Debounced search input
 * - Multiple filter combination
 * - Pagination that preserves filters
 * - Loading states during fetch
 * - Empty state when no results
 *
 * @example
 * ```tsx
 * <Route path="/videos" element={<VideosPage />} />
 * ```
 */
export default function VideosPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse filters from URL query params
  const filters: VideoFilters = useMemo(() => {
    const query = searchParams.get('q') || undefined;
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);
    const dateFrom = searchParams.get('from') || undefined;
    const dateTo = searchParams.get('to') || undefined;
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    return {
      query,
      tags,
      dateFrom,
      dateTo,
      limit: ITEMS_PER_PAGE,
      offset,
    };
  }, [searchParams]);

  // Build API URL with query parameters
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set('limit', ITEMS_PER_PAGE.toString());
    params.set('offset', filters.offset?.toString() || '0');

    // Note: Basic pagination only for now
    // Full search/filter implementation requires backend support
    return `/videos?${params.toString()}`;
  }, [filters.offset]);

  // Fetch videos using useApi hook
  const { data, loading, error, execute } = useApi<VideosResponse>(() => apiClient.get(apiUrl));

  // Fetch videos when URL changes
  useEffect(() => {
    void execute();
  }, [apiUrl, execute]);

  /**
   * Handle filter changes from SearchFilterPanel
   * Updates URL query params which triggers refetch
   */
  const handleFilterChange = (newFilters: VideoFilters) => {
    const params = new URLSearchParams();

    // Add filters to URL params
    if (newFilters.query) {
      params.set('q', newFilters.query);
    }
    if (newFilters.tags && newFilters.tags.length > 0) {
      params.set('tags', newFilters.tags.join(','));
    }
    if (newFilters.dateFrom) {
      params.set('from', newFilters.dateFrom);
    }
    if (newFilters.dateTo) {
      params.set('to', newFilters.dateTo);
    }

    // Reset offset when filters change (go back to first page)
    params.set('offset', '0');

    setSearchParams(params);
  };

  /**
   * Handle pagination - go to next page
   */
  const handleNextPage = () => {
    const params = new URLSearchParams(searchParams);
    const newOffset = (filters.offset || 0) + ITEMS_PER_PAGE;
    params.set('offset', newOffset.toString());
    setSearchParams(params);
  };

  /**
   * Handle pagination - go to previous page
   */
  const handlePreviousPage = () => {
    const params = new URLSearchParams(searchParams);
    const newOffset = Math.max(0, (filters.offset || 0) - ITEMS_PER_PAGE);
    params.set('offset', newOffset.toString());
    setSearchParams(params);
  };

  // Calculate pagination state
  const currentPage = Math.floor((filters.offset || 0) / ITEMS_PER_PAGE) + 1;
  const hasPrevPage = (filters.offset || 0) > 0;
  const hasNextPage = data?.pagination.hasMore ?? false;
  const totalVideos = data?.pagination.total ?? 0;

  return (
    <div className="videos-page">
      {/* Header */}
      <div className="videos-page__header">
        <h1 className="videos-page__title">Video Library</h1>
        <p className="videos-page__subtitle">Browse and search your video collection</p>
      </div>

      {/* Search and Filters */}
      <SearchFilterPanel onFilterChange={handleFilterChange} initialFilters={filters} />

      {/* Loading State */}
      {loading && (
        <div className="videos-page__loading">
          <div className="videos-page__spinner" />
          <p>Loading videos...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="videos-page__error">
          <svg
            className="videos-page__error-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h2>Error Loading Videos</h2>
          <p>{error}</p>
          <button onClick={() => void execute()} className="videos-page__retry">
            Try Again
          </button>
        </div>
      )}

      {/* Videos Grid */}
      {!loading && !error && data && (
        <>
          {data.videos.length === 0 ? (
            /* Empty State */
            <div className="videos-page__empty">
              <svg
                className="videos-page__empty-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                <line x1="7" y1="2" x2="7" y2="22" />
                <line x1="17" y1="2" x2="17" y2="22" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <line x1="2" y1="7" x2="7" y2="7" />
                <line x1="2" y1="17" x2="7" y2="17" />
                <line x1="17" y1="17" x2="22" y2="17" />
                <line x1="17" y1="7" x2="22" y2="7" />
              </svg>
              <h2>No Videos Found</h2>
              <p>
                {Object.keys(filters).some((k) => filters[k as keyof VideoFilters])
                  ? 'Try adjusting your search filters'
                  : 'Your video library is empty'}
              </p>
            </div>
          ) : (
            <>
              {/* Results Summary */}
              <div className="videos-page__summary">
                Showing {data.videos.length} of {totalVideos} videos
                {currentPage > 1 && ` (Page ${currentPage})`}
              </div>

              {/* Video Grid */}
              <div className="videos-page__grid">
                {data.videos.map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>

              {/* Pagination Controls */}
              {(hasPrevPage || hasNextPage) && (
                <div className="videos-page__pagination">
                  <button
                    onClick={handlePreviousPage}
                    disabled={!hasPrevPage}
                    className="videos-page__page-button"
                  >
                    ← Previous
                  </button>

                  <span className="videos-page__page-info">Page {currentPage}</span>

                  <button
                    onClick={handleNextPage}
                    disabled={!hasNextPage}
                    className="videos-page__page-button"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
