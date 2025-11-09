/**
 * Video Types
 *
 * Type definitions for video data matching the backend API.
 */

/**
 * Video model representing a video in the library
 */
export interface Video {
  id: number;
  filePath: string;
  title: string;
  description: string | null;
  tags: string[];
  duration: number;
  resolution: string | null;
  codec: string | null;
  fileSize: number | null;
  createdAt: string;
  updatedAt: string;
  isAvailable: boolean;
  customMetadata: Record<string, unknown>;
}

/**
 * Pagination metadata from API
 */
export interface PaginationMeta {
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}

/**
 * Response from GET /api/videos
 */
export interface VideosResponse {
  videos: Video[];
  pagination: PaginationMeta;
}

/**
 * Video search/filter parameters
 */
export interface VideoFilters {
  query?: string;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}
