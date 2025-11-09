/**
 * VideoService
 *
 * Business logic for video management (scanning, metadata, CRUD operations).
 */

import path from 'path';
import { DatabaseAdapter } from '../adapters/DatabaseAdapter';
import {
  Video,
  VideoRow,
  CreateVideoInput,
  UpdateVideoInput,
  VideoSearchCriteria,
} from '../models';
import { FileScanner } from '../utils/FileScanner';
import { FFmpegService } from './FFmpegService';
import {
  ValidationError,
  validatePositiveInteger,
  validateVideoTitle,
  validateVideoDescription,
  validateTags,
  validateMetadata,
  sanitizeFilePath,
} from '../utils/validation';

/**
 * VideoService class for managing video library
 *
 * Handles video scanning, CRUD operations, and search functionality.
 *
 * @example
 * ```typescript
 * const service = new VideoService(adapter);
 * const videos = await service.scanVideos('/path/to/videos');
 * const video = await service.getVideoById(1);
 * ```
 */
export class VideoService {
  private adapter: DatabaseAdapter;
  private fileScanner: FileScanner;
  private ffmpegService: FFmpegService;

  /**
   * Create a new VideoService
   *
   * @param adapter - Database adapter instance
   */
  constructor(adapter: DatabaseAdapter) {
    this.adapter = adapter;
    this.fileScanner = new FileScanner();
    this.ffmpegService = new FFmpegService();
  }

  /**
   * Convert database row to Video model
   *
   * @param row - Database row
   * @returns Video model
   */
  private rowToVideo(row: VideoRow): Video {
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
   * Generate a title from a file path
   *
   * @param filePath - File path
   * @returns Generated title
   */
  private generateTitleFromPath(filePath: string): string {
    const fileName = path.basename(filePath, path.extname(filePath));
    // Replace underscores and hyphens with spaces, capitalize words
    return fileName
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())
      .trim();
  }

  /**
   * Scan videos directory and add new videos to the database
   *
   * Scans the specified directory for video files and adds them to the database.
   * Extracts real metadata using FFmpeg (duration, resolution, codec).
   * Falls back to default values if FFmpeg is not available or extraction fails.
   *
   * @param mountPath - Path to the videos directory to scan
   * @returns Array of newly added videos
   * @throws Error if directory cannot be scanned
   *
   * @example
   * ```typescript
   * const videos = await service.scanVideos('/media/videos');
   * console.log(`Added ${videos.length} new videos`);
   * ```
   */
  async scanVideos(mountPath: string): Promise<Video[]> {
    console.info(`Starting video scan: ${mountPath}`);

    // Sanitize the mount path
    const sanitizedPath = sanitizeFilePath(mountPath);

    // Scan for video files
    const scannedFiles = await this.fileScanner.scanDirectory(sanitizedPath);

    console.info(`Found ${scannedFiles.length} video file(s)`);

    const newVideos: Video[] = [];

    for (const file of scannedFiles) {
      try {
        // Check if video already exists in database
        const existing = await this.adapter.query<VideoRow>(
          'SELECT id FROM videos WHERE file_path = ?',
          [file.relativePath]
        );

        if (existing.length > 0) {
          console.info(`Video already exists: ${file.relativePath}`);
          continue;
        }

        // Extract metadata using FFmpeg
        console.info(`Extracting metadata for: ${file.relativePath}`);
        const metadata = await this.ffmpegService.extractMetadataWithDefaults(
          file.absolutePath,
          file.fileSize
        );

        // Store optional metadata in customMetadata if available
        const customMetadata: Record<string, unknown> = {};
        if (metadata.frameRate !== undefined) {
          customMetadata.frameRate = metadata.frameRate;
        }
        if (metadata.bitrate !== undefined) {
          customMetadata.bitrate = metadata.bitrate;
        }
        if (metadata.audioCodec !== undefined) {
          customMetadata.audioCodec = metadata.audioCodec;
        }
        if (metadata.format !== undefined) {
          customMetadata.format = metadata.format;
        }

        // Create video input with extracted metadata
        const videoInput: CreateVideoInput = {
          filePath: file.relativePath,
          title: this.generateTitleFromPath(file.relativePath),
          description: null,
          tags: [],
          duration: metadata.duration,
          resolution: metadata.resolution,
          codec: metadata.codec,
          fileSize: metadata.fileSize,
          customMetadata,
        };

        // Insert into database
        const result = await this.adapter.execute(
          `INSERT INTO videos
           (file_path, title, description, tags, duration, resolution, codec, file_size, custom_metadata, is_available)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            videoInput.filePath,
            videoInput.title,
            videoInput.description,
            JSON.stringify(videoInput.tags),
            videoInput.duration,
            videoInput.resolution,
            videoInput.codec,
            videoInput.fileSize,
            JSON.stringify(videoInput.customMetadata),
            true,
          ]
        );

        if (result.insertId) {
          // Retrieve the inserted video
          const insertedVideo = await this.getVideoById(result.insertId);
          if (insertedVideo) {
            newVideos.push(insertedVideo);
            console.info(
              `Added video: ${videoInput.title} (ID: ${result.insertId}) - ${metadata.duration}s, ${metadata.resolution}, ${metadata.codec}`
            );
          }
        }
      } catch (error) {
        console.error(`Error processing file ${file.relativePath}:`, error);
        // Continue with next file - don't let one failure stop the scan
      }
    }

    console.info(`Scan complete: added ${newVideos.length} new video(s)`);

    return newVideos;
  }

  /**
   * Get a video by ID
   *
   * @param id - Video ID
   * @returns Video or null if not found
   *
   * @example
   * ```typescript
   * const video = await service.getVideoById(1);
   * if (video) {
   *   console.log(video.title);
   * }
   * ```
   */
  async getVideoById(id: number): Promise<Video | null> {
    try {
      validatePositiveInteger(id, 'Video ID');

      const rows = await this.adapter.query<VideoRow>('SELECT * FROM videos WHERE id = ?', [id]);

      if (rows.length === 0) {
        return null;
      }

      return this.rowToVideo(rows[0]);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error(`Error fetching video ${id}:`, error);
      throw new Error(
        `Failed to fetch video: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Update video metadata
   *
   * Updates the metadata fields of a video. Does not update file-related fields
   * like filePath, fileSize, or isAvailable.
   *
   * @param id - Video ID
   * @param updates - Fields to update
   * @throws ValidationError if validation fails
   * @throws Error if video not found or update fails
   *
   * @example
   * ```typescript
   * await service.updateVideoMetadata(1, {
   *   title: 'New Title',
   *   tags: ['action', 'thriller'],
   * });
   * ```
   */
  async updateVideoMetadata(id: number, updates: UpdateVideoInput): Promise<void> {
    try {
      validatePositiveInteger(id, 'Video ID');

      // Verify video exists
      const existing = await this.getVideoById(id);
      if (!existing) {
        throw new Error(`Video not found: ${id}`);
      }

      // Validate and sanitize inputs
      const updateFields: string[] = [];
      const updateValues: unknown[] = [];

      if (updates.title !== undefined) {
        const validatedTitle = validateVideoTitle(updates.title);
        updateFields.push('title = ?');
        updateValues.push(validatedTitle);
      }

      if (updates.description !== undefined) {
        const validatedDescription = validateVideoDescription(updates.description);
        updateFields.push('description = ?');
        updateValues.push(validatedDescription);
      }

      if (updates.tags !== undefined) {
        const validatedTags = validateTags(updates.tags);
        updateFields.push('tags = ?');
        updateValues.push(JSON.stringify(validatedTags));
      }

      if (updates.customMetadata !== undefined) {
        const validatedMetadata = validateMetadata(updates.customMetadata);
        updateFields.push('custom_metadata = ?');
        updateValues.push(JSON.stringify(validatedMetadata));
      }

      if (updates.isAvailable !== undefined) {
        updateFields.push('is_available = ?');
        updateValues.push(updates.isAvailable);
      }

      // If no fields to update, return early
      if (updateFields.length === 0) {
        console.warn(`No fields to update for video ${id}`);
        return;
      }

      // Add ID to parameters
      updateValues.push(id);

      // Build and execute update query
      const sql = `UPDATE videos SET ${updateFields.join(', ')} WHERE id = ?`;
      await this.adapter.execute(sql, updateValues);

      console.info(`Updated video ${id}: ${updateFields.length} field(s) modified`);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error(`Error updating video ${id}:`, error);
      throw new Error(
        `Failed to update video: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Search for videos based on criteria
   *
   * Supports full-text search on title and description, as well as filtering
   * by various metadata fields.
   *
   * @param criteria - Search criteria
   * @returns Array of matching videos
   *
   * @example
   * ```typescript
   * const results = await service.searchVideos({
   *   query: 'action',
   *   tags: ['thriller'],
   *   isAvailable: true,
   * });
   * ```
   */
  async searchVideos(criteria: VideoSearchCriteria): Promise<Video[]> {
    try {
      const whereClauses: string[] = [];
      const params: unknown[] = [];

      // Full-text search on title and description
      if (criteria.query) {
        whereClauses.push('(title LIKE ? OR description LIKE ?)');
        const searchTerm = `%${criteria.query}%`;
        params.push(searchTerm, searchTerm);
      }

      // Filter by availability
      if (criteria.isAvailable !== undefined) {
        whereClauses.push('is_available = ?');
        params.push(criteria.isAvailable);
      }

      // Filter by tags (match any of the specified tags)
      if (criteria.tags && criteria.tags.length > 0) {
        const tagConditions = criteria.tags.map(() => 'tags LIKE ?');
        whereClauses.push(`(${tagConditions.join(' OR ')})`);
        criteria.tags.forEach((tag) => {
          params.push(`%"${tag}"%`);
        });
      }

      // Filter by duration range
      if (criteria.duration) {
        if (criteria.duration.min !== undefined) {
          whereClauses.push('duration >= ?');
          params.push(criteria.duration.min);
        }
        if (criteria.duration.max !== undefined) {
          whereClauses.push('duration <= ?');
          params.push(criteria.duration.max);
        }
      }

      // Filter by file size range
      if (criteria.fileSize) {
        if (criteria.fileSize.min !== undefined) {
          whereClauses.push('file_size >= ?');
          params.push(criteria.fileSize.min);
        }
        if (criteria.fileSize.max !== undefined) {
          whereClauses.push('file_size <= ?');
          params.push(criteria.fileSize.max);
        }
      }

      // Filter by resolution
      if (criteria.resolution) {
        if (Array.isArray(criteria.resolution)) {
          const placeholders = criteria.resolution.map(() => '?').join(', ');
          whereClauses.push(`resolution IN (${placeholders})`);
          params.push(...criteria.resolution);
        } else {
          whereClauses.push('resolution = ?');
          params.push(criteria.resolution);
        }
      }

      // Filter by codec
      if (criteria.codec) {
        if (Array.isArray(criteria.codec)) {
          const placeholders = criteria.codec.map(() => '?').join(', ');
          whereClauses.push(`codec IN (${placeholders})`);
          params.push(...criteria.codec);
        } else {
          whereClauses.push('codec = ?');
          params.push(criteria.codec);
        }
      }

      // Filter by creation date range
      if (criteria.createdAt) {
        if (criteria.createdAt.from) {
          whereClauses.push('created_at >= ?');
          params.push(criteria.createdAt.from);
        }
        if (criteria.createdAt.to) {
          whereClauses.push('created_at <= ?');
          params.push(criteria.createdAt.to);
        }
      }

      // Build the WHERE clause
      const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      // Build ORDER BY clause
      let orderClause = '';
      if (criteria.sort && criteria.sort.length > 0) {
        const orderParts = criteria.sort.map((sort) => `${sort.field} ${sort.direction}`);
        orderClause = `ORDER BY ${orderParts.join(', ')}`;
      } else {
        // Default sort by creation date descending
        orderClause = 'ORDER BY created_at DESC';
      }

      // Build LIMIT/OFFSET clause
      let limitClause = '';
      if (criteria.pagination) {
        limitClause = `LIMIT ? OFFSET ?`;
        params.push(criteria.pagination.limit, criteria.pagination.offset);
      }

      // Execute query
      const sql = `SELECT * FROM videos ${whereClause} ${orderClause} ${limitClause}`.trim();
      const rows = await this.adapter.query<VideoRow>(sql, params);

      return rows.map((row) => this.rowToVideo(row));
    } catch (error) {
      console.error('Error searching videos:', error);
      throw new Error(
        `Failed to search videos: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Delete a video (soft delete - marks as unavailable)
   *
   * Marks the video as unavailable rather than physically deleting it.
   * This preserves the metadata and allows for recovery if needed.
   *
   * @param id - Video ID
   * @throws ValidationError if ID is invalid
   * @throws Error if video not found or deletion fails
   *
   * @example
   * ```typescript
   * await service.deleteVideo(1);
   * console.log('Video marked as unavailable');
   * ```
   */
  async deleteVideo(id: number): Promise<void> {
    try {
      validatePositiveInteger(id, 'Video ID');

      // Verify video exists
      const existing = await this.getVideoById(id);
      if (!existing) {
        throw new Error(`Video not found: ${id}`);
      }

      // Soft delete - mark as unavailable
      await this.adapter.execute('UPDATE videos SET is_available = ? WHERE id = ?', [false, id]);

      console.info(`Deleted video ${id} (marked as unavailable)`);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error(`Error deleting video ${id}:`, error);
      throw new Error(
        `Failed to delete video: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get all videos (for listing)
   *
   * @param includeUnavailable - Whether to include unavailable videos
   * @returns Array of all videos
   */
  async getAllVideos(includeUnavailable: boolean = false): Promise<Video[]> {
    try {
      const whereClause = includeUnavailable ? '' : 'WHERE is_available = ?';
      const params = includeUnavailable ? [] : [true];

      const sql = `SELECT * FROM videos ${whereClause} ORDER BY created_at DESC`;
      const rows = await this.adapter.query<VideoRow>(sql, params);

      return rows.map((row) => this.rowToVideo(row));
    } catch (error) {
      console.error('Error fetching all videos:', error);
      throw new Error(
        `Failed to fetch videos: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get total count of videos
   *
   * @param includeUnavailable - Whether to include unavailable videos
   * @returns Total count of videos
   */
  async getVideoCount(includeUnavailable: boolean = false): Promise<number> {
    try {
      const whereClause = includeUnavailable ? '' : 'WHERE is_available = ?';
      const params = includeUnavailable ? [] : [true];

      const sql = `SELECT COUNT(*) as count FROM videos ${whereClause}`;
      const rows = await this.adapter.query<{ count: number }>(sql, params);

      return rows[0]?.count ?? 0;
    } catch (error) {
      console.error('Error counting videos:', error);
      throw new Error(
        `Failed to count videos: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
