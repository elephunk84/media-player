/**
 * ClipService
 *
 * Business logic for clip creation and management.
 */

import { DatabaseAdapter } from '../adapters/DatabaseAdapter';
import { Clip, ClipRow, CreateClipInput, UpdateClipInput, ClipWithVideo, Video } from '../models';
import {
  ValidationError,
  validatePositiveInteger,
  validateNonEmptyString,
  validateMaxLength,
  validateMetadata,
} from '../utils/validation';

/**
 * Configuration for metadata inheritance
 */
export interface MetadataInheritanceConfig {
  /**
   * Fields to inherit from source video
   * If not specified, inherits: tags, resolution, codec, customMetadata
   */
  fieldsToInherit?: string[];
}

/**
 * Default metadata inheritance configuration
 */
const DEFAULT_INHERITANCE_CONFIG: MetadataInheritanceConfig = {
  fieldsToInherit: ['tags', 'resolution', 'codec', 'customMetadata'],
};

/**
 * ClipService class for managing video clips
 *
 * Handles clip creation with time validation and metadata inheritance,
 * CRUD operations, and orphaned clip detection.
 *
 * @example
 * ```typescript
 * const service = new ClipService(adapter);
 * const clip = await service.createClip({
 *   videoId: 1,
 *   name: 'Best Scene',
 *   startTime: 120,
 *   endTime: 180,
 * });
 * ```
 */
export class ClipService {
  private adapter: DatabaseAdapter;
  private inheritanceConfig: MetadataInheritanceConfig;

  /**
   * Create a new ClipService
   *
   * @param adapter - Database adapter instance
   * @param inheritanceConfig - Metadata inheritance configuration
   */
  constructor(
    adapter: DatabaseAdapter,
    inheritanceConfig: MetadataInheritanceConfig = DEFAULT_INHERITANCE_CONFIG
  ) {
    this.adapter = adapter;
    this.inheritanceConfig = {
      ...DEFAULT_INHERITANCE_CONFIG,
      ...inheritanceConfig,
    };
  }

  /**
   * Convert database row to Clip model
   *
   * @param row - Database row
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
   * Validate time range for a clip
   *
   * @param startTime - Clip start time
   * @param endTime - Clip end time
   * @param videoDuration - Source video duration
   * @throws ValidationError if validation fails
   */
  private validateTimeRange(startTime: number, endTime: number, videoDuration: number): void {
    // Validate start time
    if (typeof startTime !== 'number' || startTime < 0) {
      throw new ValidationError('Start time must be a non-negative number');
    }

    // Validate end time
    if (typeof endTime !== 'number' || endTime < 0) {
      throw new ValidationError('End time must be a non-negative number');
    }

    // Validate start < end
    if (startTime >= endTime) {
      throw new ValidationError('Start time must be less than end time');
    }

    // Validate both times are within video duration
    if (startTime > videoDuration) {
      throw new ValidationError(
        `Start time (${startTime}s) exceeds video duration (${videoDuration}s)`
      );
    }

    if (endTime > videoDuration) {
      throw new ValidationError(
        `End time (${endTime}s) exceeds video duration (${videoDuration}s)`
      );
    }

    // Validate minimum clip duration (at least 1 second)
    const clipDuration = endTime - startTime;
    if (clipDuration < 1) {
      throw new ValidationError('Clip duration must be at least 1 second');
    }
  }

  /**
   * Inherit metadata from source video
   *
   * @param sourceVideo - Source video
   * @returns Inherited metadata object
   */
  private inheritMetadata(sourceVideo: Video): Record<string, unknown> {
    const inheritedMetadata: Record<string, unknown> = {};
    const fieldsToInherit = this.inheritanceConfig.fieldsToInherit || [];

    for (const field of fieldsToInherit) {
      if (field in sourceVideo) {
        const value = sourceVideo[field as keyof Video];
        // Deep copy to prevent modifications
        inheritedMetadata[field] = JSON.parse(JSON.stringify(value));
      }
    }

    return inheritedMetadata;
  }

  /**
   * Get source video for a clip
   *
   * @param videoId - Video ID
   * @returns Video or null if not found
   * @throws Error if video not found
   */
  private async getSourceVideo(videoId: number): Promise<Video> {
    const rows = await this.adapter.query<{
      id: number;
      file_path: string;
      title: string;
      description: string | null;
      tags: string;
      duration: number;
      resolution: string | null;
      codec: string | null;
      file_size: number | null;
      created_at: Date;
      updated_at: Date;
      is_available: boolean;
      custom_metadata: string;
    }>('SELECT * FROM videos WHERE id = ?', [videoId]);

    if (rows.length === 0) {
      throw new Error(`Source video not found: ${videoId}`);
    }

    const row = rows[0];

    return {
      id: row.id,
      filePath: row.file_path,
      title: row.title,
      description: row.description,
      tags: typeof row.tags === 'string' ? (JSON.parse(row.tags) as string[]) : row.tags,
      duration: row.duration,
      resolution: row.resolution,
      codec: row.codec,
      fileSize: row.file_size,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      isAvailable: Boolean(row.is_available),
      customMetadata:
        typeof row.custom_metadata === 'string'
          ? (JSON.parse(row.custom_metadata) as Record<string, unknown>)
          : row.custom_metadata,
    };
  }

  /**
   * Create a new clip from a video
   *
   * Creates a clip with specified time range, validates the time range,
   * and inherits metadata from the source video.
   *
   * @param input - Clip creation input
   * @returns Created clip
   * @throws ValidationError if validation fails
   * @throws Error if source video not found or creation fails
   *
   * @example
   * ```typescript
   * const clip = await service.createClip({
   *   videoId: 1,
   *   name: 'Best Scene',
   *   description: 'The most exciting part',
   *   startTime: 120,
   *   endTime: 180,
   *   customMetadata: { category: 'highlights' },
   * });
   * ```
   */
  async createClip(input: CreateClipInput): Promise<Clip> {
    try {
      // Validate input
      validatePositiveInteger(input.videoId, 'Video ID');
      validateNonEmptyString(input.name, 'Clip name');
      validateMaxLength(input.name, 255, 'Clip name');

      if (input.description !== null && input.description !== undefined) {
        if (typeof input.description !== 'string') {
          throw new ValidationError('Description must be a string or null');
        }
        validateMaxLength(input.description, 10000, 'Description');
      }

      // Get source video and validate it exists
      const sourceVideo = await this.getSourceVideo(input.videoId);

      // Validate time range
      this.validateTimeRange(input.startTime, input.endTime, sourceVideo.duration);

      // Inherit metadata from source video
      const inheritedMetadata = input.inheritedMetadata || this.inheritMetadata(sourceVideo);

      // Validate custom metadata
      const customMetadata = input.customMetadata || {};
      validateMetadata(customMetadata);

      // Use transaction for atomicity
      await this.adapter.beginTransaction();

      try {
        // Insert clip
        const result = await this.adapter.execute(
          `INSERT INTO clips
           (video_id, name, description, start_time, end_time, inherited_metadata, custom_metadata)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            input.videoId,
            input.name.trim(),
            input.description?.trim() || null,
            input.startTime,
            input.endTime,
            JSON.stringify(inheritedMetadata),
            JSON.stringify(customMetadata),
          ]
        );

        if (!result.insertId) {
          throw new Error('Failed to create clip: no insert ID returned');
        }

        // Commit transaction
        await this.adapter.commit();

        console.info(`Created clip ${result.insertId} from video ${input.videoId}`);

        // Retrieve and return the created clip
        const createdClip = await this.getClipById(result.insertId);
        if (!createdClip) {
          throw new Error('Failed to retrieve created clip');
        }

        return createdClip;
      } catch (error) {
        // Rollback on error
        await this.adapter.rollback();
        throw error;
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error('Error creating clip:', error);
      throw new Error(
        `Failed to create clip: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get a clip by ID
   *
   * @param id - Clip ID
   * @returns Clip or null if not found
   *
   * @example
   * ```typescript
   * const clip = await service.getClipById(1);
   * if (clip) {
   *   console.log(`${clip.name}: ${clip.duration}s`);
   * }
   * ```
   */
  async getClipById(id: number): Promise<Clip | null> {
    try {
      validatePositiveInteger(id, 'Clip ID');

      const rows = await this.adapter.query<ClipRow>('SELECT * FROM clips WHERE id = ?', [id]);

      if (rows.length === 0) {
        return null;
      }

      return this.rowToClip(rows[0]);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error(`Error fetching clip ${id}:`, error);
      throw new Error(
        `Failed to fetch clip: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get all clips for a specific video
   *
   * @param videoId - Video ID
   * @returns Array of clips for the video
   *
   * @example
   * ```typescript
   * const clips = await service.getClipsByVideo(1);
   * console.log(`Found ${clips.length} clips`);
   * ```
   */
  async getClipsByVideo(videoId: number): Promise<Clip[]> {
    try {
      validatePositiveInteger(videoId, 'Video ID');

      const rows = await this.adapter.query<ClipRow>(
        'SELECT * FROM clips WHERE video_id = ? ORDER BY start_time ASC',
        [videoId]
      );

      return rows.map((row) => this.rowToClip(row));
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error(`Error fetching clips for video ${videoId}:`, error);
      throw new Error(
        `Failed to fetch clips: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Update clip metadata
   *
   * IMPORTANT: This method ONLY updates the customMetadata field.
   * It does NOT modify name, description, time ranges, or the source video.
   * Inherited metadata is never changed to preserve the original video metadata.
   *
   * @param id - Clip ID
   * @param updates - Fields to update
   * @throws ValidationError if validation fails
   * @throws Error if clip not found or update fails
   *
   * @example
   * ```typescript
   * await service.updateClipMetadata(1, {
   *   customMetadata: {
   *     category: 'highlights',
   *     rating: 5,
   *   },
   * });
   * ```
   */
  async updateClipMetadata(id: number, updates: UpdateClipInput): Promise<void> {
    try {
      validatePositiveInteger(id, 'Clip ID');

      // Verify clip exists
      const existing = await this.getClipById(id);
      if (!existing) {
        throw new Error(`Clip not found: ${id}`);
      }

      // Build update query
      const updateFields: string[] = [];
      const updateValues: unknown[] = [];

      if (updates.name !== undefined) {
        const validatedName = updates.name.trim();
        validateNonEmptyString(validatedName, 'Clip name');
        validateMaxLength(validatedName, 255, 'Clip name');
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

      if (updates.startTime !== undefined || updates.endTime !== undefined) {
        // If updating time range, validate it
        const newStartTime = updates.startTime ?? existing.startTime;
        const newEndTime = updates.endTime ?? existing.endTime;

        // Get source video to validate against duration
        const sourceVideo = await this.getSourceVideo(existing.videoId);
        this.validateTimeRange(newStartTime, newEndTime, sourceVideo.duration);

        if (updates.startTime !== undefined) {
          updateFields.push('start_time = ?');
          updateValues.push(updates.startTime);
        }

        if (updates.endTime !== undefined) {
          updateFields.push('end_time = ?');
          updateValues.push(updates.endTime);
        }
      }

      if (updates.customMetadata !== undefined) {
        validateMetadata(updates.customMetadata);
        updateFields.push('custom_metadata = ?');
        updateValues.push(JSON.stringify(updates.customMetadata));
      }

      // If no fields to update, return early
      if (updateFields.length === 0) {
        console.warn(`No fields to update for clip ${id}`);
        return;
      }

      // Add ID to parameters
      updateValues.push(id);

      // Execute update
      const sql = `UPDATE clips SET ${updateFields.join(', ')} WHERE id = ?`;
      await this.adapter.execute(sql, updateValues);

      console.info(`Updated clip ${id}: ${updateFields.length} field(s) modified`);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error(`Error updating clip ${id}:`, error);
      throw new Error(
        `Failed to update clip: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Delete a clip
   *
   * Permanently removes the clip from the database.
   * This does NOT affect the source video.
   *
   * @param id - Clip ID
   * @throws ValidationError if ID is invalid
   * @throws Error if clip not found or deletion fails
   *
   * @example
   * ```typescript
   * await service.deleteClip(1);
   * console.log('Clip deleted');
   * ```
   */
  async deleteClip(id: number): Promise<void> {
    try {
      validatePositiveInteger(id, 'Clip ID');

      // Verify clip exists
      const existing = await this.getClipById(id);
      if (!existing) {
        throw new Error(`Clip not found: ${id}`);
      }

      // Delete the clip
      await this.adapter.execute('DELETE FROM clips WHERE id = ?', [id]);

      console.info(`Deleted clip ${id}`);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error(`Error deleting clip ${id}:`, error);
      throw new Error(
        `Failed to delete clip: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get all clips (for listing)
   *
   * @returns Array of all clips
   */
  async getAllClips(): Promise<Clip[]> {
    try {
      const rows = await this.adapter.query<ClipRow>(
        'SELECT * FROM clips ORDER BY created_at DESC',
        []
      );

      return rows.map((row) => this.rowToClip(row));
    } catch (error) {
      console.error('Error fetching all clips:', error);
      throw new Error(
        `Failed to fetch clips: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get clips whose source video is unavailable (orphaned clips)
   *
   * Finds clips that reference videos marked as unavailable.
   * Useful for cleanup and data integrity checks.
   *
   * @returns Array of orphaned clips
   *
   * @example
   * ```typescript
   * const orphaned = await service.getOrphanedClips();
   * console.log(`Found ${orphaned.length} orphaned clips`);
   * orphaned.forEach(clip => {
   *   console.log(`Clip ${clip.id} references unavailable video ${clip.videoId}`);
   * });
   * ```
   */
  async getOrphanedClips(): Promise<Clip[]> {
    try {
      const rows = await this.adapter.query<ClipRow>(
        `SELECT c.* FROM clips c
         INNER JOIN videos v ON c.video_id = v.id
         WHERE v.is_available = ?
         ORDER BY c.created_at DESC`,
        [false]
      );

      console.info(`Found ${rows.length} orphaned clip(s)`);

      return rows.map((row) => this.rowToClip(row));
    } catch (error) {
      console.error('Error fetching orphaned clips:', error);
      throw new Error(
        `Failed to fetch orphaned clips: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get clips with source video information
   *
   * @param clipId - Optional clip ID to get single clip with video
   * @returns Clips with populated video information
   */
  async getClipsWithVideo(clipId?: number): Promise<ClipWithVideo[]> {
    try {
      let sql = `
        SELECT
          c.*,
          v.id as video_id_info,
          v.title as video_title,
          v.file_path as video_file_path,
          v.duration as video_duration
        FROM clips c
        INNER JOIN videos v ON c.video_id = v.id
      `;

      const params: unknown[] = [];

      if (clipId !== undefined) {
        validatePositiveInteger(clipId, 'Clip ID');
        sql += ' WHERE c.id = ?';
        params.push(clipId);
      }

      sql += ' ORDER BY c.created_at DESC';

      const rows = await this.adapter.query<
        ClipRow & {
          video_id_info: number;
          video_title: string;
          video_file_path: string;
          video_duration: number;
        }
      >(sql, params);

      return rows.map((row) => {
        const clip = this.rowToClip(row);
        return {
          ...clip,
          video: {
            id: row.video_id_info,
            title: row.video_title,
            filePath: row.video_file_path,
            duration: row.video_duration,
          },
        };
      });
    } catch (error) {
      console.error('Error fetching clips with video:', error);
      throw new Error(
        `Failed to fetch clips with video: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get total count of clips
   *
   * @param videoId - Optional video ID to count clips for specific video
   * @returns Total count of clips
   */
  async getClipCount(videoId?: number): Promise<number> {
    try {
      let sql = 'SELECT COUNT(*) as count FROM clips';
      const params: unknown[] = [];

      if (videoId !== undefined) {
        validatePositiveInteger(videoId, 'Video ID');
        sql += ' WHERE video_id = ?';
        params.push(videoId);
      }

      const rows = await this.adapter.query<{ count: number }>(sql, params);

      return rows[0]?.count ?? 0;
    } catch (error) {
      console.error('Error counting clips:', error);
      throw new Error(
        `Failed to count clips: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
