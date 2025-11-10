/**
 * Tag Model
 *
 * Represents a normalized tag in the media library.
 * Tags are used to categorize and filter media files with case-insensitive matching.
 */

/**
 * Tag interface representing a tag record in the database
 *
 * Tags have unique names (case-insensitive) and can be associated with
 * multiple media files through the media_file_tags junction table.
 */
export interface Tag {
  /**
   * Unique identifier (AUTO_INCREMENT)
   */
  readonly id: number;

  /**
   * Tag name (case-insensitive unique, VARCHAR(100))
   * Examples: "brunette", "office", "blowjob"
   */
  name: string;

  /**
   * Timestamp when the tag was first created
   */
  readonly createdAt: Date;

  /**
   * Timestamp when the tag was last updated
   */
  updatedAt: Date;
}

/**
 * Tag database row (matches database column names with snake_case)
 *
 * Used for mapping database results to TypeScript objects.
 */
export interface TagRow {
  id: number;
  name: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Tag creation input
 *
 * Used when inserting new tags into the database.
 */
export interface CreateTagInput {
  /**
   * Tag name (will be normalized to lowercase for case-insensitive matching)
   */
  name: string;
}
