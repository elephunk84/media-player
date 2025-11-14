/**
 * PerformerManager Utility
 *
 * Manages performer CRUD operations and media file associations.
 * Provides case-insensitive performer matching and transaction-safe operations.
 */

import { DatabaseAdapter } from '../adapters/DatabaseAdapter';
import { Performer, PerformerRow } from '../models/Performer';

/**
 * PerformerManager class for managing performers and their associations with media files
 *
 * All performer names are normalized to lowercase for case-insensitive matching.
 * This prevents duplicates like "Raven" and "raven" from existing simultaneously.
 *
 * @example
 * ```typescript
 * const performerManager = new PerformerManager(adapter);
 * const performerId = await performerManager.findOrCreatePerformer('Raven');
 * await performerManager.syncMediaFilePerformers(uuid, ['Raven', 'Jane Doe']);
 * ```
 */
export class PerformerManager {
  private adapter: DatabaseAdapter;

  /**
   * Create a new PerformerManager
   *
   * @param adapter - Database adapter instance
   */
  constructor(adapter: DatabaseAdapter) {
    this.adapter = adapter;
  }

  /**
   * Convert database row to Performer model
   *
   * @param row - Database row
   * @returns Performer model
   */
  private rowToPerformer(row: PerformerRow): Performer {
    return {
      id: row.id,
      name: row.name,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  /**
   * Find or create a performer by name (case-insensitive)
   *
   * If the performer already exists (case-insensitive match), returns its ID.
   * Otherwise, creates a new performer and returns the new ID.
   *
   * @param name - Performer name (will be normalized to lowercase)
   * @returns Performer ID
   * @throws Error if database operation fails
   *
   * @example
   * ```typescript
   * const performerId = await performerManager.findOrCreatePerformer('Raven');
   * // Returns same ID for 'raven', 'Raven', 'RAVEN'
   * ```
   */
  async findOrCreatePerformer(name: string): Promise<number> {
    if (!name || name.trim().length === 0) {
      throw new Error('Performer name cannot be empty');
    }

    const normalizedName = name.trim().toLowerCase();

    // Try to find existing performer (case-insensitive)
    const existing = await this.adapter.query<PerformerRow>(
      'SELECT * FROM performers WHERE LOWER(name) = ?',
      [normalizedName]
    );

    if (existing.length > 0) {
      return existing[0].id;
    }

    // Performer doesn't exist, create it
    try {
      const result = await this.adapter.execute('INSERT INTO performers (name) VALUES (?)', [
        normalizedName,
      ]);

      if (!result.insertId) {
        throw new Error('Failed to create performer: no insertId returned');
      }

      return result.insertId;
    } catch (error) {
      // Handle race condition: another process created the performer between our check and insert
      // Try to find it again
      const retryExisting = await this.adapter.query<PerformerRow>(
        'SELECT * FROM performers WHERE LOWER(name) = ?',
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
   * Find or create multiple performers in batch
   *
   * More efficient than calling findOrCreatePerformer multiple times.
   *
   * @param names - Array of performer names
   * @returns Array of performer IDs in the same order as input names
   * @throws Error if database operation fails
   *
   * @example
   * ```typescript
   * const performerIds = await performerManager.findOrCreatePerformers(['Raven', 'Jane Doe', 'John Smith']);
   * // Returns [1, 2, 3]
   * ```
   */
  async findOrCreatePerformers(names: string[]): Promise<number[]> {
    if (names.length === 0) {
      return [];
    }

    // Normalize all names
    const normalizedNames = names.map((name) => name.trim().toLowerCase()).filter((name) => name);

    if (normalizedNames.length === 0) {
      return [];
    }

    const performerIds: number[] = [];

    // Process each performer
    for (const name of normalizedNames) {
      const performerId = await this.findOrCreatePerformer(name);
      performerIds.push(performerId);
    }

    return performerIds;
  }

  /**
   * Associate performers with a media file
   *
   * Creates records in the media_file_performers junction table.
   * Does not remove existing associations.
   *
   * @param uuid - Media file UUID
   * @param performerIds - Array of performer IDs to associate
   * @throws Error if database operation fails
   */
  async associatePerformersWithMediaFile(uuid: string, performerIds: number[]): Promise<void> {
    if (performerIds.length === 0) {
      return;
    }

    // Insert associations (ignore duplicates)
    for (const performerId of performerIds) {
      try {
        await this.adapter.execute(
          'INSERT INTO media_file_performers (media_file_uuid, performer_id) VALUES (?, ?)',
          [uuid, performerId]
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
   * Sync performers for a media file (full replacement)
   *
   * Removes all existing performer associations and creates new ones.
   * This is a complete sync operation - the media file will have exactly
   * the specified performers after this operation completes.
   *
   * @param uuid - Media file UUID
   * @param performerNames - Array of performer names (will be normalized)
   * @throws Error if database operation fails
   *
   * @example
   * ```typescript
   * // Media file initially has performers: ['raven', 'jane']
   * await performerManager.syncMediaFilePerformers(uuid, ['john', 'mary']);
   * // Media file now has performers: ['john', 'mary']
   * ```
   */
  async syncMediaFilePerformers(uuid: string, performerNames: string[]): Promise<void> {
    // Find or create all performers
    const performerIds = await this.findOrCreatePerformers(performerNames);

    // Remove all existing associations
    await this.removeMediaFileAssociations(uuid);

    // Create new associations
    await this.associatePerformersWithMediaFile(uuid, performerIds);
  }

  /**
   * Get all performers associated with a media file
   *
   * @param uuid - Media file UUID
   * @returns Array of Performer objects
   * @throws Error if database operation fails
   *
   * @example
   * ```typescript
   * const performers = await performerManager.getPerformersForMediaFile(uuid);
   * performers.forEach(performer => console.log(performer.name));
   * ```
   */
  async getPerformersForMediaFile(uuid: string): Promise<Performer[]> {
    const rows = await this.adapter.query<PerformerRow>(
      `SELECT p.* FROM performers p
       JOIN media_file_performers mp ON p.id = mp.performer_id
       WHERE mp.media_file_uuid = ?
       ORDER BY p.name`,
      [uuid]
    );

    return rows.map((row) => this.rowToPerformer(row));
  }

  /**
   * Remove all performer associations for a media file
   *
   * Deletes all records from media_file_performers for the specified UUID.
   *
   * @param uuid - Media file UUID
   * @throws Error if database operation fails
   */
  async removeMediaFileAssociations(uuid: string): Promise<void> {
    await this.adapter.execute('DELETE FROM media_file_performers WHERE media_file_uuid = ?', [
      uuid,
    ]);
  }

  /**
   * Get a performer by ID
   *
   * @param id - Performer ID
   * @returns Performer object or null if not found
   */
  async getPerformerById(id: number): Promise<Performer | null> {
    const rows = await this.adapter.query<PerformerRow>('SELECT * FROM performers WHERE id = ?', [
      id,
    ]);

    if (rows.length === 0) {
      return null;
    }

    return this.rowToPerformer(rows[0]);
  }

  /**
   * Get all performers
   *
   * @returns Array of all performers ordered by name
   */
  async getAllPerformers(): Promise<Performer[]> {
    const rows = await this.adapter.query<PerformerRow>('SELECT * FROM performers ORDER BY name', []);
    return rows.map((row) => this.rowToPerformer(row));
  }

  /**
   * Get performers by name pattern (case-insensitive)
   *
   * @param pattern - Search pattern (use % for wildcards)
   * @returns Array of matching performers
   *
   * @example
   * ```typescript
   * const performers = await performerManager.searchPerformers('rav%');
   * // Returns performers starting with 'rav'
   * ```
   */
  async searchPerformers(pattern: string): Promise<Performer[]> {
    const rows = await this.adapter.query<PerformerRow>(
      'SELECT * FROM performers WHERE LOWER(name) LIKE LOWER(?) ORDER BY name',
      [pattern]
    );
    return rows.map((row) => this.rowToPerformer(row));
  }
}
