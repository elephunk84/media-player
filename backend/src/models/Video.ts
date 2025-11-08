/**
 * Video Model
 *
 * Represents a video file in the media library with associated metadata.
 */

/**
 * Video metadata extracted from file or user-provided
 */
export interface VideoMetadata {
  /**
   * Video duration in seconds
   */
  duration: number;

  /**
   * Video resolution (e.g., "1920x1080", "3840x2160")
   */
  resolution: string;

  /**
   * Video codec (e.g., "h264", "h265", "vp9")
   */
  codec: string;

  /**
   * File size in bytes
   */
  fileSize: number;

  /**
   * Frame rate (e.g., 23.976, 29.97, 60)
   */
  frameRate?: number;

  /**
   * Bitrate in bits per second
   */
  bitrate?: number;

  /**
   * Audio codec (e.g., "aac", "mp3", "opus")
   */
  audioCodec?: string;

  /**
   * Container format (e.g., "mp4", "mkv", "webm")
   */
  format?: string;
}

/**
 * Video model representing a video file in the library
 *
 * Matches the videos table schema in the database.
 */
export interface Video {
  /**
   * Unique video identifier (auto-generated)
   */
  readonly id: number;

  /**
   * Relative path from mount point to the video file
   * Must be unique across all videos
   */
  filePath: string;

  /**
   * User-friendly title for the video
   */
  title: string;

  /**
   * Optional description of the video content
   */
  description: string | null;

  /**
   * Array of tags for categorization and search
   * Stored as JSON in database
   */
  tags: string[];

  /**
   * Video duration in seconds
   */
  duration: number;

  /**
   * Video resolution (e.g., "1920x1080")
   */
  resolution: string | null;

  /**
   * Video codec (e.g., "h264", "h265")
   */
  codec: string | null;

  /**
   * File size in bytes
   */
  fileSize: number | null;

  /**
   * Timestamp when the video was added to the library
   */
  readonly createdAt: Date;

  /**
   * Timestamp when the video metadata was last updated
   */
  updatedAt: Date;

  /**
   * Whether the video file is currently accessible
   * Set to false if file is deleted or moved
   */
  isAvailable: boolean;

  /**
   * Custom metadata fields for extensibility
   * Can store any additional video information
   * Stored as JSON/JSONB in database
   */
  customMetadata: Record<string, unknown>;
}

/**
 * Video creation input (fields required to create a new video)
 */
export interface CreateVideoInput {
  filePath: string;
  title: string;
  description?: string | null;
  tags?: string[];
  duration: number;
  resolution?: string | null;
  codec?: string | null;
  fileSize?: number | null;
  customMetadata?: Record<string, unknown>;
}

/**
 * Video update input (fields that can be updated)
 */
export interface UpdateVideoInput {
  title?: string;
  description?: string | null;
  tags?: string[];
  customMetadata?: Record<string, unknown>;
  isAvailable?: boolean;
}

/**
 * Video database row (matches database column names with snake_case)
 */
export interface VideoRow {
  id: number;
  file_path: string;
  title: string;
  description: string | null;
  tags: string; // JSON string in database
  duration: number;
  resolution: string | null;
  codec: string | null;
  file_size: number | null;
  created_at: Date;
  updated_at: Date;
  is_available: boolean;
  custom_metadata: string; // JSON string in database
}
