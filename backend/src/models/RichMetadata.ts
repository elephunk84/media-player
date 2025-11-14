/**
 * Rich Metadata Models
 *
 * Interfaces for parsing and handling rich metadata from .info.json files.
 * Used by MetadataParser utility to extract structured metadata.
 */

/**
 * Provider information extracted from metadata
 *
 * Contains details about the source provider of the media file.
 */
export interface ProviderInfo {
  /**
   * Provider name (e.g., "pornhub", "youtube")
   */
  provider: string | null;

  /**
   * Provider's video ID (e.g., "ph5952b413d0f8e")
   */
  providerId: string | null;

  /**
   * Original webpage URL
   */
  webpageUrl: string | null;
}

/**
 * Format information extracted from metadata
 *
 * Contains details about available and downloaded video formats.
 */
export interface FormatInfo {
  /**
   * Format that was downloaded (e.g., "720p", "hls-2054")
   */
  downloadedFormat: string | null;

  /**
   * Array of available formats (e.g., ["240p", "480p", "720p"])
   */
  availableFormats: string[];
}

/**
 * Parsed rich metadata from .info.json file
 *
 * Contains all extracted metadata fields ready for database insertion.
 * All fields are optional to support partial metadata.
 */
export interface ParsedRichMetadata {
  /**
   * Human-readable title for display
   * Fallback chain: display_name > title > filename
   */
  displayName: string;

  /**
   * Provider name (pornhub, youtube, etc.)
   */
  provider: string | null;

  /**
   * Provider's video ID
   */
  providerId: string | null;

  /**
   * Original webpage URL
   */
  webpageUrl: string | null;

  /**
   * Thumbnail image URL
   */
  thumbnail: string | null;

  /**
   * Video duration in seconds
   */
  duration: number | null;

  /**
   * Format that was downloaded (e.g., "720p")
   */
  downloadedFormat: string | null;

  /**
   * Array of available formats
   */
  availableFormats: string[];

  /**
   * Video creator/uploader name
   */
  creator: string | null;

  /**
   * Primary tag/category name (will be looked up in tags table)
   */
  primaryTag: string | null;

  /**
   * Array of tag names
   */
  tags: string[];

  /**
   * Array of category names
   */
  categories: string[];

  /**
   * Array of performer names
   */
  performers: string[];
}

/**
 * Validation result from metadata parsing
 *
 * Contains any errors or warnings encountered during parsing.
 */
export interface ValidationResult {
  /**
   * Whether the metadata is valid
   */
  valid: boolean;

  /**
   * Array of error messages
   */
  errors: string[];

  /**
   * Array of warning messages
   */
  warnings: string[];
}
