/**
 * Category Model
 *
 * Represents a normalized category in the media library.
 * Categories are used to classify and filter media files with case-insensitive matching.
 */

/**
 * Category interface representing a category record in the database
 *
 * Categories have unique names (case-insensitive) and can be associated with
 * multiple media files through the media_file_categories junction table.
 */
export interface Category {
  /**
   * Unique identifier (AUTO_INCREMENT)
   */
  readonly id: number;

  /**
   * Category name (case-insensitive unique, VARCHAR(100))
   * Examples: "Big Ass", "Big Tits", "HD Porn"
   */
  name: string;

  /**
   * Timestamp when the category was first created
   */
  readonly createdAt: Date;

  /**
   * Timestamp when the category was last updated
   */
  updatedAt: Date;
}

/**
 * Category database row (matches database column names with snake_case)
 *
 * Used for mapping database results to TypeScript objects.
 */
export interface CategoryRow {
  id: number;
  name: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Category creation input
 *
 * Used when inserting new categories into the database.
 */
export interface CreateCategoryInput {
  /**
   * Category name (will be normalized to lowercase for case-insensitive matching)
   */
  name: string;
}
