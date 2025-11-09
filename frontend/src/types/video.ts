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

/**
 * Clip model representing a time-based segment from a video
 */
export interface Clip {
  id: number;
  videoId: number;
  name: string;
  description: string | null;
  startTime: number;
  endTime: number;
  duration: number;
  inheritedMetadata: Record<string, unknown>;
  customMetadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Clip creation input (fields required to create a new clip)
 */
export interface CreateClipInput {
  videoId: number;
  name: string;
  description?: string | null;
  startTime: number;
  endTime: number;
  inheritedMetadata?: Record<string, unknown>;
  customMetadata?: Record<string, unknown>;
}

/**
 * Response from GET /api/clips
 */
export interface ClipsResponse {
  clips: Clip[];
  count: number;
}

/**
 * Clip with populated source video information
 */
export interface ClipWithVideo extends Clip {
  video?: {
    id: number;
    title: string;
    filePath: string;
    duration: number;
    isAvailable: boolean;
  };
}
