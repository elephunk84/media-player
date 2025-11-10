/**
 * TagManager Utility
 *
 * Manages tag CRUD operations and media file associations.
 * Provides case-insensitive tag matching and transaction-safe operations.
 */

import { DatabaseAdapter } from '../adapters/DatabaseAdapter';
import { Tag, TagRow } from '../models/Tag';

/**
 * TagManager class for managing tags and their associations with media files
 *
 * All tag names are normalized to lowercase for case-insensitive matching.
 * This prevents duplicates like "Action" and "action" from existing simultaneously.
 *
 * @example
 * ```typescript
 * const tagManager = new TagManager(adapter);
 * const tagId = await tagManager.findOrCreateTag('brunette');
 * await tagManager.syncMediaFileTags(uuid, ['brunette', 'office']);
 * ```
 */
export class TagManager {
  private adapter: DatabaseAdapter;

  /**
   * Create a new TagManager
   *
   * @param adapter - Database adapter instance
   */
  constructor(adapter: DatabaseAdapter) {
    this.adapter = adapter;
  }

  /**
   * Convert database row to Tag model
   *
   * @param row - Database row
   * @returns Tag model
   */
  private rowToTag(row: TagRow): Tag {
    return {
      id: row.id,
      name: row.name,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  /**
   * Find or create a tag by name (case-insensitive)
   *
   * If the tag already exists (case-insensitive match), returns its ID.
   * Otherwise, creates a new tag and returns the new ID.
   *
   * @param name - Tag name (will be normalized to lowercase)
   * @returns Tag ID
   * @throws Error if database operation fails
   *
   * @example
   * ```typescript
   * const tagId = await tagManager.findOrCreateTag('Action');
   * // Returns same ID for 'action', 'Action', 'ACTION'
   * ```
   */
  async findOrCreateTag(name: string): Promise<number> {
    if (!name || name.trim().length === 0) {
      throw new Error('Tag name cannot be empty');
    }

    const normalizedName = name.trim().toLowerCase();

    // Try to find existing tag (case-insensitive)
    const existing = await this.adapter.query<TagRow>(
      'SELECT * FROM tags WHERE LOWER(name) = ?',
      [normalizedName]
    );

    if (existing.length > 0) {
      return existing[0].id;
    }

    // Tag doesn't exist, create it
    try {
      const result = await this.adapter.execute('INSERT INTO tags (name) VALUES (?)', [
        normalizedName,
      ]);

      if (!result.insertId) {
        throw new Error('Failed to create tag: no insertId returned');
      }

      return result.insertId;
    } catch (error) {
      // Handle race condition: another process created the tag between our check and insert
      // Try to find it again
      const retryExisting = await this.adapter.query<TagRow>(
        'SELECT * FROM tags WHERE LOWER(name) = ?',
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
   * Find or create multiple tags in batch
   *
   * More efficient than calling findOrCreateTag multiple times.
   *
   * @param names - Array of tag names
   * @returns Array of tag IDs in the same order as input names
   * @throws Error if database operation fails
   *
   * @example
   * ```typescript
   * const tagIds = await tagManager.findOrCreateTags(['brunette', 'office', 'blowjob']);
   * // Returns [1, 2, 3]
   * ```
   */
  async findOrCreateTags(names: string[]): Promise<number[]> {
    if (names.length === 0) {
      return [];
    }

    // Normalize all names
    const normalizedNames = names.map((name) => name.trim().toLowerCase()).filter((name) => name);

    if (normalizedNames.length === 0) {
      return [];
    }

    const tagIds: number[] = [];

    // Process each tag
    for (const name of normalizedNames) {
      const tagId = await this.findOrCreateTag(name);
      tagIds.push(tagId);
    }

    return tagIds;
  }

  /**
   * Associate tags with a media file
   *
   * Creates records in the media_file_tags junction table.
   * Does not remove existing associations.
   *
   * @param uuid - Media file UUID
   * @param tagIds - Array of tag IDs to associate
   * @throws Error if database operation fails
   */
  async associateTagsWithMediaFile(uuid: string, tagIds: number[]): Promise<void> {
    if (tagIds.length === 0) {
      return;
    }

    // Insert associations (ignore duplicates)
    for (const tagId of tagIds) {
      try {
        await this.adapter.execute(
          'INSERT INTO media_file_tags (media_file_uuid, tag_id) VALUES (?, ?)',
          [uuid, tagId]
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
   * Sync tags for a media file (full replacement)
   *
   * Removes all existing tag associations and creates new ones.
   * This is a complete sync operation - the media file will have exactly
   * the specified tags after this operation completes.
   *
   * @param uuid - Media file UUID
   * @param tagNames - Array of tag names (will be normalized)
   * @throws Error if database operation fails
   *
   * @example
   * ```typescript
   * // Media file initially has tags: ['action', 'drama']
   * await tagManager.syncMediaFileTags(uuid, ['comedy', 'romance']);
   * // Media file now has tags: ['comedy', 'romance']
   * ```
   */
  async syncMediaFileTags(uuid: string, tagNames: string[]): Promise<void> {
    // Find or create all tags
    const tagIds = await this.findOrCreateTags(tagNames);

    // Remove all existing associations
    await this.removeMediaFileAssociations(uuid);

    // Create new associations
    await this.associateTagsWithMediaFile(uuid, tagIds);
  }

  /**
   * Get all tags associated with a media file
   *
   * @param uuid - Media file UUID
   * @returns Array of Tag objects
   * @throws Error if database operation fails
   *
   * @example
   * ```typescript
   * const tags = await tagManager.getTagsForMediaFile(uuid);
   * tags.forEach(tag => console.log(tag.name));
   * ```
   */
  async getTagsForMediaFile(uuid: string): Promise<Tag[]> {
    const rows = await this.adapter.query<TagRow>(
      `SELECT t.* FROM tags t
       JOIN media_file_tags mt ON t.id = mt.tag_id
       WHERE mt.media_file_uuid = ?
       ORDER BY t.name`,
      [uuid]
    );

    return rows.map((row) => this.rowToTag(row));
  }

  /**
   * Remove all tag associations for a media file
   *
   * Deletes all records from media_file_tags for the specified UUID.
   *
   * @param uuid - Media file UUID
   * @throws Error if database operation fails
   */
  async removeMediaFileAssociations(uuid: string): Promise<void> {
    await this.adapter.execute('DELETE FROM media_file_tags WHERE media_file_uuid = ?', [uuid]);
  }

  /**
   * Get a tag by ID
   *
   * @param id - Tag ID
   * @returns Tag object or null if not found
   */
  async getTagById(id: number): Promise<Tag | null> {
    const rows = await this.adapter.query<TagRow>('SELECT * FROM tags WHERE id = ?', [id]);

    if (rows.length === 0) {
      return null;
    }

    return this.rowToTag(rows[0]);
  }

  /**
   * Get all tags
   *
   * @returns Array of all tags ordered by name
   */
  async getAllTags(): Promise<Tag[]> {
    const rows = await this.adapter.query<TagRow>('SELECT * FROM tags ORDER BY name', []);
    return rows.map((row) => this.rowToTag(row));
  }

  /**
   * Get tags by name pattern (case-insensitive)
   *
   * @param pattern - Search pattern (use % for wildcards)
   * @returns Array of matching tags
   *
   * @example
   * ```typescript
   * const tags = await tagManager.searchTags('action%');
   * // Returns tags starting with 'action'
   * ```
   */
  async searchTags(pattern: string): Promise<Tag[]> {
    const rows = await this.adapter.query<TagRow>(
      'SELECT * FROM tags WHERE LOWER(name) LIKE LOWER(?) ORDER BY name',
      [pattern]
    );
    return rows.map((row) => this.rowToTag(row));
  }
}
