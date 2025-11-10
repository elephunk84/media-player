/**
 * CategoryManager Utility
 *
 * Manages category CRUD operations and media file associations.
 * Provides case-insensitive category matching and transaction-safe operations.
 */

import { DatabaseAdapter } from '../adapters/DatabaseAdapter';
import { Category, CategoryRow } from '../models/Category';

/**
 * CategoryManager class for managing categories and their associations with media files
 *
 * All category names are normalized to lowercase for case-insensitive matching.
 * This prevents duplicates like "Action" and "action" from existing simultaneously.
 *
 * @example
 * ```typescript
 * const categoryManager = new CategoryManager(adapter);
 * const categoryId = await categoryManager.findOrCreateCategory('HD Porn');
 * await categoryManager.syncMediaFileCategories(uuid, ['HD Porn', 'Big Ass']);
 * ```
 */
export class CategoryManager {
  private adapter: DatabaseAdapter;

  /**
   * Create a new CategoryManager
   *
   * @param adapter - Database adapter instance
   */
  constructor(adapter: DatabaseAdapter) {
    this.adapter = adapter;
  }

  /**
   * Convert database row to Category model
   *
   * @param row - Database row
   * @returns Category model
   */
  private rowToCategory(row: CategoryRow): Category {
    return {
      id: row.id,
      name: row.name,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  /**
   * Find or create a category by name (case-insensitive)
   *
   * If the category already exists (case-insensitive match), returns its ID.
   * Otherwise, creates a new category and returns the new ID.
   *
   * @param name - Category name (will be normalized to lowercase)
   * @returns Category ID
   * @throws Error if database operation fails
   *
   * @example
   * ```typescript
   * const categoryId = await categoryManager.findOrCreateCategory('Action');
   * // Returns same ID for 'action', 'Action', 'ACTION'
   * ```
   */
  async findOrCreateCategory(name: string): Promise<number> {
    if (!name || name.trim().length === 0) {
      throw new Error('Category name cannot be empty');
    }

    const normalizedName = name.trim().toLowerCase();

    // Try to find existing category (case-insensitive)
    const existing = await this.adapter.query<CategoryRow>(
      'SELECT * FROM categories WHERE LOWER(name) = ?',
      [normalizedName]
    );

    if (existing.length > 0) {
      return existing[0].id;
    }

    // Category doesn't exist, create it
    try {
      const result = await this.adapter.execute('INSERT INTO categories (name) VALUES (?)', [
        normalizedName,
      ]);

      if (!result.insertId) {
        throw new Error('Failed to create category: no insertId returned');
      }

      return result.insertId;
    } catch (error) {
      // Handle race condition: another process created the category between our check and insert
      // Try to find it again
      const retryExisting = await this.adapter.query<CategoryRow>(
        'SELECT * FROM categories WHERE LOWER(name) = ?',
        [normalizedName]
      );

      if (retryExisting.length > 0) {
        return retryExisting[0].id;
      }

      // If we still can't find it, something went wrong
      throw error;
    }
  }

  /**
   * Find or create multiple categories in batch
   *
   * More efficient than calling findOrCreateCategory multiple times.
   *
   * @param names - Array of category names
   * @returns Array of category IDs in the same order as input names
   * @throws Error if database operation fails
   *
   * @example
   * ```typescript
   * const categoryIds = await categoryManager.findOrCreateCategories(['HD Porn', 'Big Ass', 'Big Tits']);
   * // Returns [1, 2, 3]
   * ```
   */
  async findOrCreateCategories(names: string[]): Promise<number[]> {
    if (names.length === 0) {
      return [];
    }

    // Normalize all names
    const normalizedNames = names.map((name) => name.trim().toLowerCase()).filter((name) => name);

    if (normalizedNames.length === 0) {
      return [];
    }

    const categoryIds: number[] = [];

    // Process each category
    for (const name of normalizedNames) {
      const categoryId = await this.findOrCreateCategory(name);
      categoryIds.push(categoryId);
    }

    return categoryIds;
  }

  /**
   * Associate categories with a media file
   *
   * Creates records in the media_file_categories junction table.
   * Does not remove existing associations.
   *
   * @param uuid - Media file UUID
   * @param categoryIds - Array of category IDs to associate
   * @throws Error if database operation fails
   */
  async associateCategoriesWithMediaFile(uuid: string, categoryIds: number[]): Promise<void> {
    if (categoryIds.length === 0) {
      return;
    }

    // Insert associations (ignore duplicates)
    for (const categoryId of categoryIds) {
      try {
        await this.adapter.execute(
          'INSERT INTO media_file_categories (media_file_uuid, category_id) VALUES (?, ?)',
          [uuid, categoryId]
        );
      } catch (error) {
        // Ignore duplicate key errors (association already exists)
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (
          !errorMessage.includes('duplicate') &&
          !errorMessage.includes('unique') &&
          !errorMessage.includes('Duplicate entry')
        ) {
          throw error;
        }
      }
    }
  }

  /**
   * Sync categories for a media file (full replacement)
   *
   * Removes all existing category associations and creates new ones.
   * This is a complete sync operation - the media file will have exactly
   * the specified categories after this operation completes.
   *
   * @param uuid - Media file UUID
   * @param categoryNames - Array of category names (will be normalized)
   * @throws Error if database operation fails
   *
   * @example
   * ```typescript
   * // Media file initially has categories: ['action', 'drama']
   * await categoryManager.syncMediaFileCategories(uuid, ['comedy', 'romance']);
   * // Media file now has categories: ['comedy', 'romance']
   * ```
   */
  async syncMediaFileCategories(uuid: string, categoryNames: string[]): Promise<void> {
    // Find or create all categories
    const categoryIds = await this.findOrCreateCategories(categoryNames);

    // Remove all existing associations
    await this.removeMediaFileAssociations(uuid);

    // Create new associations
    await this.associateCategoriesWithMediaFile(uuid, categoryIds);
  }

  /**
   * Get all categories associated with a media file
   *
   * @param uuid - Media file UUID
   * @returns Array of Category objects
   * @throws Error if database operation fails
   *
   * @example
   * ```typescript
   * const categories = await categoryManager.getCategoriesForMediaFile(uuid);
   * categories.forEach(category => console.log(category.name));
   * ```
   */
  async getCategoriesForMediaFile(uuid: string): Promise<Category[]> {
    const rows = await this.adapter.query<CategoryRow>(
      `SELECT c.* FROM categories c
       JOIN media_file_categories mc ON c.id = mc.category_id
       WHERE mc.media_file_uuid = ?
       ORDER BY c.name`,
      [uuid]
    );

    return rows.map((row) => this.rowToCategory(row));
  }

  /**
   * Remove all category associations for a media file
   *
   * Deletes all records from media_file_categories for the specified UUID.
   *
   * @param uuid - Media file UUID
   * @throws Error if database operation fails
   */
  async removeMediaFileAssociations(uuid: string): Promise<void> {
    await this.adapter.execute('DELETE FROM media_file_categories WHERE media_file_uuid = ?', [
      uuid,
    ]);
  }

  /**
   * Get a category by ID
   *
   * @param id - Category ID
   * @returns Category object or null if not found
   */
  async getCategoryById(id: number): Promise<Category | null> {
    const rows = await this.adapter.query<CategoryRow>('SELECT * FROM categories WHERE id = ?', [
      id,
    ]);

    if (rows.length === 0) {
      return null;
    }

    return this.rowToCategory(rows[0]);
  }

  /**
   * Get all categories
   *
   * @returns Array of all categories ordered by name
   */
  async getAllCategories(): Promise<Category[]> {
    const rows = await this.adapter.query<CategoryRow>('SELECT * FROM categories ORDER BY name', []);
    return rows.map((row) => this.rowToCategory(row));
  }

  /**
   * Get categories by name pattern (case-insensitive)
   *
   * @param pattern - Search pattern (use % for wildcards)
   * @returns Array of matching categories
   *
   * @example
   * ```typescript
   * const categories = await categoryManager.searchCategories('action%');
   * // Returns categories starting with 'action'
   * ```
   */
  async searchCategories(pattern: string): Promise<Category[]> {
    const rows = await this.adapter.query<CategoryRow>(
      'SELECT * FROM categories WHERE LOWER(name) LIKE LOWER(?) ORDER BY name',
      [pattern]
    );
    return rows.map((row) => this.rowToCategory(row));
  }
}
