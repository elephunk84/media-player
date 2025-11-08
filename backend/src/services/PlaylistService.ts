/**
 * PlaylistService
 *
 * Business logic for playlist creation and management.
 */

import { DatabaseAdapter } from '../adapters/DatabaseAdapter';
import {
  Playlist,
  PlaylistRow,
  PlaylistClipRow,
  PlaylistClip,
  PlaylistWithClips,
  CreatePlaylistInput,
  UpdatePlaylistInput,
  ReorderPlaylistInput,
  Clip,
  ClipRow,
} from '../models';
import {
  ValidationError,
  validatePositiveInteger,
  validateNonEmptyString,
  validateMaxLength,
  validateNonNegativeInteger,
} from '../utils/validation';

/**
 * PlaylistService class for managing playlists
 *
 * Handles playlist creation, clip ordering, and retrieval with proper
 * order management and orphaned clip detection.
 *
 * @example
 * ```typescript
 * const service = new PlaylistService(adapter);
 * const playlist = await service.createPlaylist({
 *   name: 'Best Scenes',
 *   description: 'Collection of favorite moments',
 * });
 * ```
 */
export class PlaylistService {
  private adapter: DatabaseAdapter;

  /**
   * Create a new PlaylistService
   *
   * @param adapter - Database adapter instance
   */
  constructor(adapter: DatabaseAdapter) {
    this.adapter = adapter;
  }

  /**
   * Convert database row to Playlist model
   *
   * @param row - Database row
   * @returns Playlist model
   */
  private rowToPlaylist(row: PlaylistRow): Playlist {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  /**
   * Convert clip database row to Clip model
   *
   * @param row - Clip database row
   * @returns Clip model
   */
  private rowToClip(row: ClipRow): Clip {
    return {
      id: row.id,
      videoId: row.video_id,
      name: row.name,
      description: row.description,
      startTime: row.start_time,
      endTime: row.end_time,
      duration: row.duration,
      inheritedMetadata:
        typeof row.inherited_metadata === 'string'
          ? (JSON.parse(row.inherited_metadata) as Record<string, unknown>)
          : row.inherited_metadata,
      customMetadata:
        typeof row.custom_metadata === 'string'
          ? (JSON.parse(row.custom_metadata) as Record<string, unknown>)
          : row.custom_metadata,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  /**
   * Get the next order index for a playlist
   *
   * @param playlistId - Playlist ID
   * @returns Next available order index
   */
  private async getNextOrderIndex(playlistId: number): Promise<number> {
    const rows = await this.adapter.query<{ max_order: number | null }>(
      'SELECT MAX(order_index) as max_order FROM playlist_clips WHERE playlist_id = ?',
      [playlistId]
    );

    const maxOrder = rows[0]?.max_order;
    return maxOrder !== null ? maxOrder + 1 : 0;
  }

  /**
   * Verify that a clip exists and is accessible
   *
   * @param clipId - Clip ID
   * @throws Error if clip does not exist
   */
  private async verifyClipExists(clipId: number): Promise<void> {
    const rows = await this.adapter.query<{ id: number }>('SELECT id FROM clips WHERE id = ?', [
      clipId,
    ]);

    if (rows.length === 0) {
      throw new Error(`Clip not found: ${clipId}`);
    }
  }

  /**
   * Create a new playlist
   *
   * @param input - Playlist creation input
   * @returns Created playlist
   * @throws ValidationError if validation fails
   * @throws Error if creation fails
   *
   * @example
   * ```typescript
   * const playlist = await service.createPlaylist({
   *   name: 'My Playlist',
   *   description: 'A collection of favorite clips',
   * });
   * ```
   */
  async createPlaylist(input: CreatePlaylistInput): Promise<Playlist> {
    try {
      // Validate input
      validateNonEmptyString(input.name, 'Playlist name');
      validateMaxLength(input.name, 255, 'Playlist name');

      if (input.description !== null && input.description !== undefined) {
        if (typeof input.description !== 'string') {
          throw new ValidationError('Description must be a string or null');
        }
        validateMaxLength(input.description, 10000, 'Description');
      }

      // Insert playlist
      const result = await this.adapter.execute(
        'INSERT INTO playlists (name, description) VALUES (?, ?)',
        [input.name.trim(), input.description?.trim() || null]
      );

      if (!result.insertId) {
        throw new Error('Failed to create playlist: no insert ID returned');
      }

      console.info(`Created playlist ${result.insertId}: ${input.name}`);

      // Retrieve and return the created playlist
      const createdPlaylist = await this.getPlaylistById(result.insertId);
      if (!createdPlaylist) {
        throw new Error('Failed to retrieve created playlist');
      }

      return createdPlaylist;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error('Error creating playlist:', error);
      throw new Error(
        `Failed to create playlist: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Add a clip to a playlist
   *
   * Adds a clip at the specified order index. If order is not provided,
   * appends to the end of the playlist. Validates that the clip exists
   * before adding.
   *
   * @param playlistId - Playlist ID
   * @param clipId - Clip ID to add
   * @param order - Optional order index (defaults to end of playlist)
   * @throws ValidationError if validation fails
   * @throws Error if playlist or clip not found, or clip already in playlist
   *
   * @example
   * ```typescript
   * // Add clip to end of playlist
   * await service.addClipToPlaylist(1, 5);
   *
   * // Add clip at specific position
   * await service.addClipToPlaylist(1, 5, 2);
   * ```
   */
  async addClipToPlaylist(playlistId: number, clipId: number, order?: number): Promise<void> {
    try {
      validatePositiveInteger(playlistId, 'Playlist ID');
      validatePositiveInteger(clipId, 'Clip ID');

      // Verify playlist exists
      const playlistRows = await this.adapter.query<{ id: number }>(
        'SELECT id FROM playlists WHERE id = ?',
        [playlistId]
      );
      if (playlistRows.length === 0) {
        throw new Error(`Playlist not found: ${playlistId}`);
      }

      // Verify clip exists
      await this.verifyClipExists(clipId);

      // Check if clip is already in playlist
      const existingRows = await this.adapter.query<PlaylistClipRow>(
        'SELECT * FROM playlist_clips WHERE playlist_id = ? AND clip_id = ?',
        [playlistId, clipId]
      );
      if (existingRows.length > 0) {
        throw new Error(`Clip ${clipId} is already in playlist ${playlistId}`);
      }

      // Determine order index
      let orderIndex: number;
      if (order !== undefined) {
        validateNonNegativeInteger(order, 'Order index');
        orderIndex = order;
      } else {
        orderIndex = await this.getNextOrderIndex(playlistId);
      }

      // If inserting at specific position, shift existing clips
      if (order !== undefined) {
        await this.adapter.execute(
          'UPDATE playlist_clips SET order_index = order_index + 1 WHERE playlist_id = ? AND order_index >= ?',
          [playlistId, orderIndex]
        );
      }

      // Insert clip into playlist
      await this.adapter.execute(
        'INSERT INTO playlist_clips (playlist_id, clip_id, order_index) VALUES (?, ?, ?)',
        [playlistId, clipId, orderIndex]
      );

      console.info(`Added clip ${clipId} to playlist ${playlistId} at position ${orderIndex}`);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error(`Error adding clip to playlist:`, error);
      throw new Error(
        `Failed to add clip to playlist: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Remove a clip from a playlist
   *
   * Removes the clip and optionally reorders remaining clips to eliminate gaps.
   *
   * @param playlistId - Playlist ID
   * @param clipId - Clip ID to remove
   * @param reorderAfterRemoval - Whether to reorder remaining clips (default: true)
   * @throws ValidationError if validation fails
   * @throws Error if playlist or clip not found
   *
   * @example
   * ```typescript
   * await service.removeClipFromPlaylist(1, 5);
   * ```
   */
  async removeClipFromPlaylist(
    playlistId: number,
    clipId: number,
    reorderAfterRemoval: boolean = true
  ): Promise<void> {
    try {
      validatePositiveInteger(playlistId, 'Playlist ID');
      validatePositiveInteger(clipId, 'Clip ID');

      // Verify the clip is in the playlist
      const existingRows = await this.adapter.query<PlaylistClipRow>(
        'SELECT * FROM playlist_clips WHERE playlist_id = ? AND clip_id = ?',
        [playlistId, clipId]
      );

      if (existingRows.length === 0) {
        throw new Error(`Clip ${clipId} is not in playlist ${playlistId}`);
      }

      const removedOrder = existingRows[0].order_index;

      // Use transaction for atomic removal and reordering
      await this.adapter.beginTransaction();

      try {
        // Remove the clip
        await this.adapter.execute(
          'DELETE FROM playlist_clips WHERE playlist_id = ? AND clip_id = ?',
          [playlistId, clipId]
        );

        // Reorder remaining clips if requested
        if (reorderAfterRemoval) {
          await this.adapter.execute(
            'UPDATE playlist_clips SET order_index = order_index - 1 WHERE playlist_id = ? AND order_index > ?',
            [playlistId, removedOrder]
          );
        }

        await this.adapter.commit();

        console.info(`Removed clip ${clipId} from playlist ${playlistId}`);
      } catch (error) {
        await this.adapter.rollback();
        throw error;
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error('Error removing clip from playlist:', error);
      throw new Error(
        `Failed to remove clip from playlist: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Reorder clips in a playlist
   *
   * Updates the order of multiple clips atomically using a transaction.
   * Ensures order integrity with no gaps or duplicates.
   *
   * @param input - Reorder input with playlist ID and clip orders
   * @throws ValidationError if validation fails
   * @throws Error if reordering fails or order is invalid
   *
   * @example
   * ```typescript
   * await service.reorderPlaylist({
   *   playlistId: 1,
   *   clipOrders: [
   *     { clipId: 5, order: 0 },
   *     { clipId: 3, order: 1 },
   *     { clipId: 7, order: 2 },
   *   ],
   * });
   * ```
   */
  async reorderPlaylist(input: ReorderPlaylistInput): Promise<void> {
    try {
      validatePositiveInteger(input.playlistId, 'Playlist ID');

      if (!Array.isArray(input.clipOrders) || input.clipOrders.length === 0) {
        throw new ValidationError('Clip orders must be a non-empty array');
      }

      // Validate all clip orders
      const orderIndices = new Set<number>();
      for (const clipOrder of input.clipOrders) {
        validatePositiveInteger(clipOrder.clipId, 'Clip ID');
        validateNonNegativeInteger(clipOrder.order, 'Order index');

        // Check for duplicate order indices
        if (orderIndices.has(clipOrder.order)) {
          throw new ValidationError(`Duplicate order index: ${clipOrder.order}`);
        }
        orderIndices.add(clipOrder.order);
      }

      // Verify all clips are in the playlist
      const clipIds = input.clipOrders.map((co) => co.clipId);
      const placeholders = clipIds.map(() => '?').join(', ');
      const existingClips = await this.adapter.query<PlaylistClipRow>(
        `SELECT clip_id FROM playlist_clips WHERE playlist_id = ? AND clip_id IN (${placeholders})`,
        [input.playlistId, ...clipIds]
      );

      if (existingClips.length !== clipIds.length) {
        const existingClipIds = new Set(existingClips.map((c) => c.clip_id));
        const missingClips = clipIds.filter((id) => !existingClipIds.has(id));
        throw new Error(`Clips not in playlist: ${missingClips.join(', ')}`);
      }

      // Use transaction for atomic reordering
      await this.adapter.beginTransaction();

      try {
        // Update each clip's order
        for (const clipOrder of input.clipOrders) {
          await this.adapter.execute(
            'UPDATE playlist_clips SET order_index = ? WHERE playlist_id = ? AND clip_id = ?',
            [clipOrder.order, input.playlistId, clipOrder.clipId]
          );
        }

        await this.adapter.commit();

        console.info(
          `Reordered ${input.clipOrders.length} clip(s) in playlist ${input.playlistId}`
        );
      } catch (error) {
        await this.adapter.rollback();
        throw error;
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error('Error reordering playlist:', error);
      throw new Error(
        `Failed to reorder playlist: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get a playlist by ID
   *
   * Retrieves the playlist with all clips in order. Does NOT include
   * orphaned clips (clips whose source video is unavailable) by default.
   *
   * @param id - Playlist ID
   * @param includeOrphaned - Whether to include orphaned clips (default: false)
   * @returns Playlist with clips or null if not found
   *
   * @example
   * ```typescript
   * const playlist = await service.getPlaylistById(1);
   * if (playlist) {
   *   console.log(`${playlist.name}: ${playlist.clips?.length || 0} clips`);
   * }
   * ```
   */
  async getPlaylistById(id: number, includeOrphaned: boolean = false): Promise<Playlist | null> {
    try {
      validatePositiveInteger(id, 'Playlist ID');

      // Get playlist
      const playlistRows = await this.adapter.query<PlaylistRow>(
        'SELECT * FROM playlists WHERE id = ?',
        [id]
      );

      if (playlistRows.length === 0) {
        return null;
      }

      const playlist = this.rowToPlaylist(playlistRows[0]);

      // Get clips with JOIN
      const clipQuery = includeOrphaned
        ? `SELECT pc.clip_id, pc.order_index, c.*
           FROM playlist_clips pc
           INNER JOIN clips c ON pc.clip_id = c.id
           WHERE pc.playlist_id = ?
           ORDER BY pc.order_index ASC`
        : `SELECT pc.clip_id, pc.order_index, c.*
           FROM playlist_clips pc
           INNER JOIN clips c ON pc.clip_id = c.id
           INNER JOIN videos v ON c.video_id = v.id
           WHERE pc.playlist_id = ? AND v.is_available = ?
           ORDER BY pc.order_index ASC`;

      const params = includeOrphaned ? [id] : [id, true];

      const clipRows = await this.adapter.query<ClipRow & { clip_id: number; order_index: number }>(
        clipQuery,
        params
      );

      // Build playlist clips array
      playlist.clips = clipRows.map((row) => ({
        clipId: row.clip_id,
        order: row.order_index,
        clip: this.rowToClip(row),
      }));

      return playlist;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error(`Error fetching playlist ${id}:`, error);
      throw new Error(
        `Failed to fetch playlist: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Update playlist metadata
   *
   * Updates the name and/or description of a playlist.
   *
   * @param id - Playlist ID
   * @param updates - Fields to update
   * @throws ValidationError if validation fails
   * @throws Error if playlist not found or update fails
   *
   * @example
   * ```typescript
   * await service.updatePlaylist(1, {
   *   name: 'Updated Name',
   *   description: 'Updated description',
   * });
   * ```
   */
  async updatePlaylist(id: number, updates: UpdatePlaylistInput): Promise<void> {
    try {
      validatePositiveInteger(id, 'Playlist ID');

      // Verify playlist exists
      const existing = await this.getPlaylistById(id);
      if (!existing) {
        throw new Error(`Playlist not found: ${id}`);
      }

      // Build update query
      const updateFields: string[] = [];
      const updateValues: unknown[] = [];

      if (updates.name !== undefined) {
        const validatedName = updates.name.trim();
        validateNonEmptyString(validatedName, 'Playlist name');
        validateMaxLength(validatedName, 255, 'Playlist name');
        updateFields.push('name = ?');
        updateValues.push(validatedName);
      }

      if (updates.description !== undefined) {
        const desc = updates.description?.trim() || null;
        if (desc !== null) {
          validateMaxLength(desc, 10000, 'Description');
        }
        updateFields.push('description = ?');
        updateValues.push(desc);
      }

      // If no fields to update, return early
      if (updateFields.length === 0) {
        console.warn(`No fields to update for playlist ${id}`);
        return;
      }

      // Add ID to parameters
      updateValues.push(id);

      // Execute update
      const sql = `UPDATE playlists SET ${updateFields.join(', ')} WHERE id = ?`;
      await this.adapter.execute(sql, updateValues);

      console.info(`Updated playlist ${id}: ${updateFields.length} field(s) modified`);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error(`Error updating playlist ${id}:`, error);
      throw new Error(
        `Failed to update playlist: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Delete a playlist
   *
   * Permanently removes the playlist and all its clip associations.
   * Cascade delete is handled by database foreign key constraints.
   *
   * @param id - Playlist ID
   * @throws ValidationError if ID is invalid
   * @throws Error if playlist not found or deletion fails
   *
   * @example
   * ```typescript
   * await service.deletePlaylist(1);
   * console.log('Playlist deleted');
   * ```
   */
  async deletePlaylist(id: number): Promise<void> {
    try {
      validatePositiveInteger(id, 'Playlist ID');

      // Verify playlist exists
      const existing = await this.getPlaylistById(id);
      if (!existing) {
        throw new Error(`Playlist not found: ${id}`);
      }

      // Delete the playlist (cascade deletes playlist_clips)
      await this.adapter.execute('DELETE FROM playlists WHERE id = ?', [id]);

      console.info(`Deleted playlist ${id}`);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error(`Error deleting playlist ${id}:`, error);
      throw new Error(
        `Failed to delete playlist: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get all playlists (for listing)
   *
   * @returns Array of all playlists (without clips)
   */
  async getAllPlaylists(): Promise<Playlist[]> {
    try {
      const rows = await this.adapter.query<PlaylistRow>(
        'SELECT * FROM playlists ORDER BY created_at DESC',
        []
      );

      return rows.map((row) => this.rowToPlaylist(row));
    } catch (error) {
      console.error('Error fetching all playlists:', error);
      throw new Error(
        `Failed to fetch playlists: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get playlists with full clip details
   *
   * Retrieves playlists with all clips populated.
   *
   * @param playlistId - Optional playlist ID to get single playlist
   * @param includeOrphaned - Whether to include orphaned clips
   * @returns Array of playlists with clips
   */
  async getPlaylistsWithClips(
    playlistId?: number,
    includeOrphaned: boolean = false
  ): Promise<PlaylistWithClips[]> {
    try {
      let playlistQuery = 'SELECT * FROM playlists';
      const playlistParams: unknown[] = [];

      if (playlistId !== undefined) {
        validatePositiveInteger(playlistId, 'Playlist ID');
        playlistQuery += ' WHERE id = ?';
        playlistParams.push(playlistId);
      }

      playlistQuery += ' ORDER BY created_at DESC';

      const playlistRows = await this.adapter.query<PlaylistRow>(playlistQuery, playlistParams);

      const playlists: PlaylistWithClips[] = [];

      for (const playlistRow of playlistRows) {
        const playlist = await this.getPlaylistById(playlistRow.id, includeOrphaned);
        if (playlist && playlist.clips) {
          playlists.push({
            ...playlist,
            clips: playlist.clips as Array<PlaylistClip & { clip: Clip }>,
          });
        }
      }

      return playlists;
    } catch (error) {
      console.error('Error fetching playlists with clips:', error);
      throw new Error(
        `Failed to fetch playlists with clips: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get orphaned clips in a playlist
   *
   * Finds clips in the playlist whose source video is unavailable.
   * Useful for identifying clips that won't play.
   *
   * @param playlistId - Playlist ID
   * @returns Array of orphaned playlist clips
   *
   * @example
   * ```typescript
   * const orphaned = await service.getOrphanedClips(1);
   * console.log(`Found ${orphaned.length} orphaned clips`);
   * ```
   */
  async getOrphanedClips(playlistId: number): Promise<PlaylistClip[]> {
    try {
      validatePositiveInteger(playlistId, 'Playlist ID');

      const rows = await this.adapter.query<ClipRow & { order_index: number }>(
        `SELECT pc.order_index, c.*
         FROM playlist_clips pc
         INNER JOIN clips c ON pc.clip_id = c.id
         INNER JOIN videos v ON c.video_id = v.id
         WHERE pc.playlist_id = ? AND v.is_available = ?
         ORDER BY pc.order_index ASC`,
        [playlistId, false]
      );

      console.info(`Found ${rows.length} orphaned clip(s) in playlist ${playlistId}`);

      return rows.map((row) => ({
        clipId: row.id,
        order: row.order_index,
        clip: this.rowToClip(row),
      }));
    } catch (error) {
      console.error('Error fetching orphaned clips:', error);
      throw new Error(
        `Failed to fetch orphaned clips: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get total count of playlists
   *
   * @returns Total count of playlists
   */
  async getPlaylistCount(): Promise<number> {
    try {
      const rows = await this.adapter.query<{ count: number }>(
        'SELECT COUNT(*) as count FROM playlists',
        []
      );

      return rows[0]?.count ?? 0;
    } catch (error) {
      console.error('Error counting playlists:', error);
      throw new Error(
        `Failed to count playlists: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
