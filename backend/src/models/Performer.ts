/**
 * Performer Model
 *
 * Represents a normalized performer/creator in the media library.
 * Performers are used to identify creators and filter media files with case-insensitive matching.
 */

/**
 * Performer interface representing a performer record in the database
 *
 * Performers have unique names (case-insensitive) and can be associated with
 * multiple media files through the media_file_performers junction table.
 */
export interface Performer {
  /**
   * Unique identifier (AUTO_INCREMENT)
   */
  readonly id: number;

  /**
   * Performer name (case-insensitive unique, VARCHAR(255))
   * Examples: "Raven", "John Doe", "Jane Smith"
   */
  name: string;

  /**
   * Timestamp when the performer was first created
   */
  readonly createdAt: Date;

  /**
   * Timestamp when the performer was last updated
   */
  updatedAt: Date;
}

/**
 * Performer database row (matches database column names with snake_case)
 *
 * Used for mapping database results to TypeScript objects.
 */
export interface PerformerRow {
  id: number;
  name: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Performer creation input
 *
 * Used when inserting new performers into the database.
 */
export interface CreatePerformerInput {
  /**
   * Performer name (will be normalized to lowercase for case-insensitive matching)
   */
  name: string;
}
