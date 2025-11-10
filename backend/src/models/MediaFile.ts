/**
 * MediaFile Model
 *
 * Represents a media file with UUID-based metadata in the media library.
 * Used by the Media Metadata Loader to store video files and their associated
 * metadata from .info.json files.
 */

/**
 * Metadata file information
 *
 * Describes a metadata file (.info.json) associated with a media file.
 */
export interface MetadataFile {
  /**
   * Absolute path to the metadata file
   */
  filePath: string;

  /**
   * Whether the metadata file exists
   */
  exists: boolean;

  /**
   * Parsed metadata content (if file exists and is valid JSON)
   */
  content?: Record<string, unknown>;

  /**
   * Error message if metadata could not be read or parsed
   */
  error?: string;
}

/**
 * Media file data for internal processing
 *
 * Used during the loading workflow to pass data between processing steps.
 */
export interface MediaFileData {
  /**
   * UUID extracted from the filename
   */
  uuid: string;

  /**
   * Absolute path to the video file
   */
  absolutePath: string;

  /**
   * Relative path from the mount point
   */
  relativePath: string;

  /**
   * Original filename (with extension)
   */
  fileName: string;

  /**
   * File size in bytes
   */
  fileSize: number;

  /**
   * File extension (e.g., '.mp4', '.mkv')
   */
  fileExtension: string;

  /**
   * Metadata information (if found)
   */
  metadata?: MetadataFile;
}

/**
 * Media file model representing a UUID-based media file in the library
 *
 * Matches the media_files table schema in the database.
 */
export interface MediaFile {
  /**
   * Unique identifier (UUID v4) extracted from filename
   * Format: 8-4-4-4-12 hexadecimal digits (e.g., 550e8400-e29b-41d4-a716-446655440000)
   */
  readonly uuid: string;

  /**
   * Relative path from mount point to the video file
   * Must be unique across all media files
   */
  filePath: string;

  /**
   * Original filename (including extension)
   */
  fileName: string;

  /**
   * File size in bytes
   */
  fileSize: number | null;

  /**
   * File extension (e.g., '.mp4', '.mkv', '.avi')
   */
  fileExtension: string | null;

  /**
   * Parsed metadata from .info.json file
   * Contains arbitrary metadata fields extracted from the metadata file
   * Stored as JSON/JSONB in database
   */
  metadata: Record<string, unknown> | null;

  /**
   * Relative path to the metadata file (if found)
   * Typically in format: /mnt/Metadata/{UUID}/*.info.json
   */
  metadataFilePath: string | null;

  /**
   * Timestamp when the record was first created in the database
   */
  readonly createdAt: Date;

  /**
   * Timestamp when the record was last updated
   */
  updatedAt: Date;

  /**
   * Timestamp when the file was last scanned by the loader
   * Used to detect stale entries or track synchronization
   */
  lastScannedAt: Date;
}

/**
 * Media file creation input (fields required to create a new media file)
 *
 * Used when inserting new records into the database.
 */
export interface CreateMediaFileInput {
  /**
   * UUID v4 identifier (PRIMARY KEY)
   */
  uuid: string;

  /**
   * Relative path to the video file
   */
  filePath: string;

  /**
   * Original filename
   */
  fileName: string;

  /**
   * File size in bytes
   */
  fileSize?: number | null;

  /**
   * File extension (e.g., '.mp4')
   */
  fileExtension?: string | null;

  /**
   * Parsed metadata from .info.json file
   */
  metadata?: Record<string, unknown> | null;

  /**
   * Path to the metadata file
   */
  metadataFilePath?: string | null;
}

/**
 * Media file update input (fields that can be updated)
 *
 * Used when updating existing records during re-scans.
 */
export interface UpdateMediaFileInput {
  /**
   * Updated file path (if file was moved)
   */
  filePath?: string;

  /**
   * Updated filename (if file was renamed)
   */
  fileName?: string;

  /**
   * Updated file size
   */
  fileSize?: number | null;

  /**
   * Updated file extension
   */
  fileExtension?: string | null;

  /**
   * Updated metadata content
   */
  metadata?: Record<string, unknown> | null;

  /**
   * Updated metadata file path
   */
  metadataFilePath?: string | null;

  /**
   * Update the last_scanned_at timestamp
   */
  updateLastScanned?: boolean;
}

/**
 * Media file database row (matches database column names with snake_case)
 *
 * Used for mapping database results to TypeScript objects.
 */
export interface MediaFileRow {
  uuid: string;
  file_path: string;
  file_name: string;
  file_size: number | null;
  file_extension: string | null;
  metadata: string | Record<string, unknown> | null; // JSON string or parsed object
  metadata_file_path: string | null;
  created_at: Date;
  updated_at: Date;
  last_scanned_at: Date;
}
