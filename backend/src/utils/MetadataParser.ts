/**
 * MetadataParser Utility
 *
 * Pure functions for parsing and validating rich metadata from .info.json files.
 * All functions are side-effect free and handle missing/invalid data gracefully.
 */

import {
  ParsedRichMetadata,
  ProviderInfo,
  FormatInfo,
  ValidationResult,
} from '../models/RichMetadata';

/**
 * Extract display name from metadata with fallback chain
 *
 * Fallback order:
 * 1. display_name field
 * 2. title field
 * 3. stored_name field (filename)
 * 4. Default: 'Unknown'
 *
 * @param metadata - Raw metadata object
 * @returns Display name string
 *
 * @example
 * ```typescript
 * const name = extractDisplayName({ display_name: 'My Video' });
 * // Returns: 'My Video'
 *
 * const name2 = extractDisplayName({ title: 'Fallback Title' });
 * // Returns: 'Fallback Title'
 * ```
 */
export function extractDisplayName(metadata: any): string {
  // Try display_name first
  if (metadata.display_name && typeof metadata.display_name === 'string') {
    const name = metadata.display_name.trim();
    if (name.length > 0) {
      return name;
    }
  }

  // Try title second
  if (metadata.title && typeof metadata.title === 'string') {
    const title = metadata.title.trim();
    if (title.length > 0) {
      return title;
    }
  }

  // Try stored_name (filename) third
  if (metadata.stored_name && typeof metadata.stored_name === 'string') {
    const storedName = metadata.stored_name.trim();
    if (storedName.length > 0) {
      return storedName;
    }
  }

  // Default fallback
  return 'Unknown';
}

/**
 * Extract tags array from metadata
 *
 * Normalizes tags to lowercase and trims whitespace.
 * Returns empty array if tags are missing or invalid.
 *
 * @param metadata - Raw metadata object
 * @returns Array of normalized tag strings
 *
 * @example
 * ```typescript
 * const tags = extractTags({ tags: ['Brunette', ' Office ', 'BLOWJOB'] });
 * // Returns: ['brunette', 'office', 'blowjob']
 * ```
 */
export function extractTags(metadata: any): string[] {
  if (!metadata.tags || !Array.isArray(metadata.tags)) {
    return [];
  }

  return metadata.tags
    .filter((tag: any) => typeof tag === 'string')
    .map((tag: string) => tag.trim().toLowerCase())
    .filter((tag: string) => tag.length > 0);
}

/**
 * Extract categories array from metadata
 *
 * Normalizes categories to lowercase and trims whitespace.
 * Returns empty array if categories are missing or invalid.
 *
 * @param metadata - Raw metadata object
 * @returns Array of normalized category strings
 *
 * @example
 * ```typescript
 * const categories = extractCategories({ categories: ['Big Ass', 'HD Porn'] });
 * // Returns: ['big ass', 'hd porn']
 * ```
 */
export function extractCategories(metadata: any): string[] {
  if (!metadata.categories || !Array.isArray(metadata.categories)) {
    return [];
  }

  return metadata.categories
    .filter((category: any) => typeof category === 'string')
    .map((category: string) => category.trim().toLowerCase())
    .filter((category: string) => category.length > 0);
}

/**
 * Extract performers array from metadata
 *
 * Extracts from the 'pornstars' array (provider-specific naming).
 * Normalizes performer names to lowercase and trims whitespace.
 * Returns empty array if performers are missing or invalid.
 *
 * @param metadata - Raw metadata object
 * @returns Array of normalized performer strings
 *
 * @example
 * ```typescript
 * const performers = extractPerformers({ pornstars: ['Raven', 'Jane Doe'] });
 * // Returns: ['raven', 'jane doe']
 * ```
 */
export function extractPerformers(metadata: any): string[] {
  if (!metadata.pornstars || !Array.isArray(metadata.pornstars)) {
    return [];
  }

  return metadata.pornstars
    .filter((performer: any) => typeof performer === 'string')
    .map((performer: string) => performer.trim().toLowerCase())
    .filter((performer: string) => performer.length > 0);
}

/**
 * Extract provider information from metadata
 *
 * Extracts:
 * - provider: Source provider name (e.g., "pornhub", "youtube")
 * - providerId: Provider's video ID (from 'id' field)
 * - webpageUrl: Original webpage URL (from 'webpage_url' field)
 *
 * @param metadata - Raw metadata object
 * @returns ProviderInfo object
 *
 * @example
 * ```typescript
 * const info = extractProviderInfo({
 *   provider: 'pornhub',
 *   id: 'ph5952b413d0f8e',
 *   webpage_url: 'https://www.pornhub.com/view_video.php?viewkey=ph5952b413d0f8e'
 * });
 * // Returns: { provider: 'pornhub', providerId: 'ph5952b413d0f8e', webpageUrl: '...' }
 * ```
 */
export function extractProviderInfo(metadata: any): ProviderInfo {
  const provider =
    metadata.provider && typeof metadata.provider === 'string'
      ? metadata.provider.trim()
      : null;

  const providerId =
    metadata.id && typeof metadata.id === 'string' ? metadata.id.trim() : null;

  const webpageUrl =
    metadata.webpage_url && typeof metadata.webpage_url === 'string'
      ? metadata.webpage_url.trim()
      : null;

  return {
    provider: provider && provider.length > 0 ? provider : null,
    providerId: providerId && providerId.length > 0 ? providerId : null,
    webpageUrl: webpageUrl && webpageUrl.length > 0 ? webpageUrl : null,
  };
}

/**
 * Extract thumbnail URL from metadata
 *
 * Validates that the URL has a proper scheme (http/https).
 * Returns null if thumbnail is missing or invalid.
 *
 * @param metadata - Raw metadata object
 * @returns Thumbnail URL or null
 *
 * @example
 * ```typescript
 * const thumbnail = extractThumbnail({ thumbnail: 'https://example.com/thumb.jpg' });
 * // Returns: 'https://example.com/thumb.jpg'
 *
 * const invalid = extractThumbnail({ thumbnail: 'not-a-url' });
 * // Returns: null
 * ```
 */
export function extractThumbnail(metadata: any): string | null {
  if (!metadata.thumbnail || typeof metadata.thumbnail !== 'string') {
    return null;
  }

  const thumbnail = metadata.thumbnail.trim();

  // Validate URL format (simple check for http/https scheme)
  if (!thumbnail.startsWith('http://') && !thumbnail.startsWith('https://')) {
    return null;
  }

  return thumbnail;
}

/**
 * Extract duration from metadata
 *
 * Converts to integer if needed. Returns null if duration is missing,
 * invalid, or negative.
 *
 * @param metadata - Raw metadata object
 * @returns Duration in seconds or null
 *
 * @example
 * ```typescript
 * const duration = extractDuration({ duration: 1404 });
 * // Returns: 1404
 *
 * const stringDuration = extractDuration({ duration: '1404' });
 * // Returns: 1404
 *
 * const invalid = extractDuration({ duration: 'invalid' });
 * // Returns: null
 * ```
 */
export function extractDuration(metadata: any): number | null {
  if (metadata.duration === undefined || metadata.duration === null) {
    return null;
  }

  let duration: number;

  if (typeof metadata.duration === 'number') {
    duration = metadata.duration;
  } else if (typeof metadata.duration === 'string') {
    duration = parseInt(metadata.duration, 10);
    if (isNaN(duration)) {
      return null;
    }
  } else {
    return null;
  }

  // Validate that duration is positive
  if (duration < 0) {
    return null;
  }

  return Math.floor(duration); // Ensure integer
}

/**
 * Extract format information from metadata
 *
 * Extracts:
 * - downloadedFormat: The format that was downloaded (from 'downloaded_format' field)
 * - availableFormats: Array of available formats (from 'formats' field)
 *
 * @param metadata - Raw metadata object
 * @returns FormatInfo object
 *
 * @example
 * ```typescript
 * const formats = extractFormats({
 *   downloaded_format: 'hls-2054',
 *   formats: ['240p', '480p', '720p', 'hls-2054']
 * });
 * // Returns: { downloadedFormat: 'hls-2054', availableFormats: ['240p', '480p', '720p', 'hls-2054'] }
 * ```
 */
export function extractFormats(metadata: any): FormatInfo {
  const downloadedFormat =
    metadata.downloaded_format && typeof metadata.downloaded_format === 'string'
      ? metadata.downloaded_format.trim()
      : null;

  let availableFormats: string[] = [];

  if (metadata.formats && Array.isArray(metadata.formats)) {
    availableFormats = metadata.formats
      .filter((format: any) => typeof format === 'string')
      .map((format: string) => format.trim())
      .filter((format: string) => format.length > 0);
  }

  return {
    downloadedFormat: downloadedFormat && downloadedFormat.length > 0 ? downloadedFormat : null,
    availableFormats,
  };
}

/**
 * Extract creator/uploader name from metadata
 *
 * Returns null if creator is missing or invalid.
 *
 * @param metadata - Raw metadata object
 * @returns Creator name or null
 *
 * @example
 * ```typescript
 * const creator = extractCreator({ creator: 'Channel Name' });
 * // Returns: 'Channel Name'
 * ```
 */
export function extractCreator(metadata: any): string | null {
  if (!metadata.creator || typeof metadata.creator !== 'string') {
    return null;
  }

  const creator = metadata.creator.trim();
  return creator.length > 0 ? creator : null;
}

/**
 * Extract primary tag from metadata
 *
 * Returns null if primary_tag is missing or invalid.
 *
 * @param metadata - Raw metadata object
 * @returns Primary tag name or null
 *
 * @example
 * ```typescript
 * const primaryTag = extractPrimaryTag({ primary_tag: 'Combat_Zone' });
 * // Returns: 'combat_zone'
 * ```
 */
export function extractPrimaryTag(metadata: any): string | null {
  if (!metadata.primary_tag || typeof metadata.primary_tag !== 'string') {
    return null;
  }

  const primaryTag = metadata.primary_tag.trim().toLowerCase();
  return primaryTag.length > 0 ? primaryTag : null;
}

/**
 * Parse rich metadata from raw metadata object
 *
 * Main entry point for metadata parsing. Calls all extraction functions
 * and returns a complete ParsedRichMetadata object.
 *
 * All fields are extracted using their specific extraction functions,
 * which handle missing/invalid data gracefully.
 *
 * @param rawMetadata - Raw metadata object from .info.json file
 * @returns ParsedRichMetadata object with all extracted fields
 *
 * @example
 * ```typescript
 * const parsed = parseRichMetadata({
 *   display_name: 'My Video',
 *   tags: ['tag1', 'tag2'],
 *   categories: ['Category1'],
 *   pornstars: ['Performer1'],
 *   provider: 'pornhub',
 *   id: 'ph123',
 *   thumbnail: 'https://example.com/thumb.jpg',
 *   duration: 1404,
 *   downloaded_format: '720p',
 *   formats: ['240p', '480p', '720p'],
 *   creator: 'Channel',
 *   primary_tag: 'Main_Tag'
 * });
 * ```
 */
export function parseRichMetadata(rawMetadata: any): ParsedRichMetadata {
  const providerInfo = extractProviderInfo(rawMetadata);
  const formatInfo = extractFormats(rawMetadata);

  return {
    displayName: extractDisplayName(rawMetadata),
    provider: providerInfo.provider,
    providerId: providerInfo.providerId,
    webpageUrl: providerInfo.webpageUrl,
    thumbnail: extractThumbnail(rawMetadata),
    duration: extractDuration(rawMetadata),
    downloadedFormat: formatInfo.downloadedFormat,
    availableFormats: formatInfo.availableFormats,
    creator: extractCreator(rawMetadata),
    primaryTag: extractPrimaryTag(rawMetadata),
    tags: extractTags(rawMetadata),
    categories: extractCategories(rawMetadata),
    performers: extractPerformers(rawMetadata),
  };
}

/**
 * Validate parsed rich metadata
 *
 * Checks for common validation issues:
 * - Invalid URLs (if present)
 * - Negative durations (if present)
 * - Empty required fields
 *
 * Returns a ValidationResult with errors and warnings arrays.
 *
 * @param parsed - ParsedRichMetadata object
 * @returns ValidationResult object
 *
 * @example
 * ```typescript
 * const validation = validateMetadata(parsed);
 * if (!validation.valid) {
 *   console.error('Validation errors:', validation.errors);
 * }
 * ```
 */
export function validateMetadata(parsed: ParsedRichMetadata): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate display name (required, should never be empty due to fallback)
  if (!parsed.displayName || parsed.displayName === 'Unknown') {
    warnings.push('Display name fell back to default value');
  }

  // Validate thumbnail URL if present
  if (parsed.thumbnail) {
    if (!parsed.thumbnail.startsWith('http://') && !parsed.thumbnail.startsWith('https://')) {
      errors.push('Thumbnail URL must use http or https scheme');
    }
  }

  // Validate webpage URL if present
  if (parsed.webpageUrl) {
    if (!parsed.webpageUrl.startsWith('http://') && !parsed.webpageUrl.startsWith('https://')) {
      errors.push('Webpage URL must use http or https scheme');
    }
  }

  // Validate duration if present
  if (parsed.duration !== null) {
    if (parsed.duration < 0) {
      errors.push('Duration cannot be negative');
    }
    if (!Number.isInteger(parsed.duration)) {
      errors.push('Duration must be an integer');
    }
  }

  // Warnings for missing optional but useful fields
  if (parsed.tags.length === 0 && parsed.categories.length === 0) {
    warnings.push('No tags or categories found');
  }

  if (!parsed.provider) {
    warnings.push('No provider information found');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
