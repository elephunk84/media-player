/**
 * Clip Model
 *
 * Represents a time-based segment extracted from a video.
 */

/**
 * Clip metadata (can be inherited from video or custom)
 */
export interface ClipMetadata {
  /**
   * Tags associated with this clip
   */
  tags?: string[];

  /**
   * Category or genre
   */
  category?: string;

  /**
   * Rating or score (e.g., 1-5, 1-10)
   */
  rating?: number;

  /**
   * Any other custom fields
   */
  [key: string]: unknown;
}

/**
 * Clip model representing a time-based segment from a video
 *
 * Matches the clips table schema in the database.
 */
export interface Clip {
  /**
   * Unique clip identifier (auto-generated)
   */
  readonly id: number;

  /**
   * ID of the source video this clip is from
   */
  videoId: number;

  /**
   * User-friendly name for the clip
   */
  name: string;

  /**
   * Optional description of the clip content
   */
  description: string | null;

  /**
   * Start time in seconds from the beginning of the source video
   */
  startTime: number;

  /**
   * End time in seconds from the beginning of the source video
   */
  endTime: number;

  /**
   * Clip duration in seconds (calculated: endTime - startTime)
   * This is a generated column in the database
   */
  readonly duration: number;

  /**
   * Metadata inherited from the source video
   * Stored as JSON/JSONB in database
   */
  inheritedMetadata: Record<string, unknown>;

  /**
   * Custom metadata specific to this clip
   * Stored as JSON/JSONB in database
   */
  customMetadata: Record<string, unknown>;

  /**
   * Timestamp when the clip was created
   */
  readonly createdAt: Date;

  /**
   * Timestamp when the clip metadata was last updated
   */
  updatedAt: Date;
}

/**
 * Clip with populated source video information
 */
export interface ClipWithVideo extends Clip {
  /**
   * Source video details
   */
  video?: {
    id: number;
    title: string;
    filePath: string;
    duration: number;
  };
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
 * Clip update input (fields that can be updated)
 */
export interface UpdateClipInput {
  name?: string;
  description?: string | null;
  startTime?: number;
  endTime?: number;
  customMetadata?: Record<string, unknown>;
}

/**
 * Clip database row (matches database column names with snake_case)
 */
export interface ClipRow {
  id: number;
  video_id: number;
  name: string;
  description: string | null;
  start_time: number;
  end_time: number;
  duration: number;
  inherited_metadata: string; // JSON string in database
  custom_metadata: string; // JSON string in database
  created_at: Date;
  updated_at: Date;
}
