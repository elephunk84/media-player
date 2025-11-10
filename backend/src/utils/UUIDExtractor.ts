/**
 * UUIDExtractor Utility
 *
 * Utility for extracting and validating UUID v4 identifiers from filenames.
 * Used by the Media Metadata Loader to identify video files with UUID-based naming.
 */

/**
 * Regular expression for matching UUID v4 format
 *
 * UUID v4 format: 8-4-4-4-12 hexadecimal digits
 * - First group: 8 hex digits
 * - Second group: 4 hex digits
 * - Third group: 4 hex digits starting with '4' (version 4 identifier)
 * - Fourth group: 4 hex digits starting with [89ab] (variant bits)
 * - Fifth group: 12 hex digits
 *
 * Example: 550e8400-e29b-41d4-a716-446655440000
 */
const UUID_V4_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi;

/**
 * UUIDExtractor class for extracting and validating UUID v4 from filenames
 *
 * Provides static methods for:
 * - Extracting the first UUID from a filename
 * - Validating UUID format
 * - Extracting all UUIDs from a string
 *
 * @example
 * ```typescript
 * const uuid = UUIDExtractor.extract('550e8400-e29b-41d4-a716-446655440000.mp4');
 * console.log(uuid); // '550e8400-e29b-41d4-a716-446655440000'
 *
 * const isValid = UUIDExtractor.isValidUUID('550e8400-e29b-41d4-a716-446655440000');
 * console.log(isValid); // true
 * ```
 */
export class UUIDExtractor {
  /**
   * Extract the first UUID v4 from a filename or string
   *
   * Searches for UUID v4 pattern in the input string and returns the first match.
   * The search is case-insensitive, and the result is normalized to lowercase.
   *
   * @param filename - Filename or string to extract UUID from
   * @returns Extracted UUID in lowercase, or null if no UUID found
   *
   * @example
   * ```typescript
   * UUIDExtractor.extract('550e8400-e29b-41d4-a716-446655440000.mp4');
   * // Returns: '550e8400-e29b-41d4-a716-446655440000'
   *
   * UUIDExtractor.extract('video-550E8400-E29B-41D4-A716-446655440000-1080p.mkv');
   * // Returns: '550e8400-e29b-41d4-a716-446655440000'
   *
   * UUIDExtractor.extract('no-uuid-here.mp4');
   * // Returns: null
   * ```
   */
  static extract(filename: string): string | null {
    if (!filename || typeof filename !== 'string') {
      return null;
    }

    // Reset regex lastIndex (important for global regex)
    UUID_V4_PATTERN.lastIndex = 0;

    const match = UUID_V4_PATTERN.exec(filename.toLowerCase());
    return match ? match[0] : null;
  }

  /**
   * Validate if a string is a valid UUID v4
   *
   * Checks if the entire string matches the UUID v4 format.
   * More strict than extract() - requires exact match, not just contains.
   *
   * @param uuid - String to validate
   * @returns true if the string is a valid UUID v4, false otherwise
   *
   * @example
   * ```typescript
   * UUIDExtractor.isValidUUID('550e8400-e29b-41d4-a716-446655440000');
   * // Returns: true
   *
   * UUIDExtractor.isValidUUID('550e8400-e29b-11d4-a716-446655440000');
   * // Returns: false (not version 4)
   *
   * UUIDExtractor.isValidUUID('not-a-uuid');
   * // Returns: false
   * ```
   */
  static isValidUUID(uuid: string): boolean {
    if (!uuid || typeof uuid !== 'string') {
      return false;
    }

    // Create a new regex for exact match (without global flag)
    const exactPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return exactPattern.test(uuid);
  }

  /**
   * Extract all UUID v4 occurrences from a string
   *
   * Finds all UUID v4 patterns in the input string.
   * Useful for processing strings that may contain multiple UUIDs.
   *
   * @param text - String to extract UUIDs from
   * @returns Array of extracted UUIDs in lowercase (empty array if none found)
   *
   * @example
   * ```typescript
   * UUIDExtractor.extractAll('550e8400-e29b-41d4-a716-446655440000 and 123e4567-e89b-42d3-a456-426614174000');
   * // Returns: ['550e8400-e29b-41d4-a716-446655440000', '123e4567-e89b-42d3-a456-426614174000']
   *
   * UUIDExtractor.extractAll('no uuids here');
   * // Returns: []
   * ```
   */
  static extractAll(text: string): string[] {
    if (!text || typeof text !== 'string') {
      return [];
    }

    // Reset regex lastIndex
    UUID_V4_PATTERN.lastIndex = 0;

    const matches: string[] = [];
    let match: RegExpExecArray | null;

    const lowerText = text.toLowerCase();

    // Use loop with exec to get all matches
    while ((match = UUID_V4_PATTERN.exec(lowerText)) !== null) {
      matches.push(match[0]);
    }

    return matches;
  }

  /**
   * Get the UUID v4 regex pattern
   *
   * Returns a new instance of the UUID v4 regex pattern.
   * Useful for custom pattern matching scenarios.
   *
   * @returns RegExp instance for UUID v4 pattern
   */
  static getPattern(): RegExp {
    return new RegExp(UUID_V4_PATTERN.source, 'gi');
  }
}
