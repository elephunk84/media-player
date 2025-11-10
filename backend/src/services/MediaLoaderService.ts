/**
 * MediaLoaderService
 *
 * Service for loading video files and their metadata into the database.
 * Automatically discovers UUID-based video files and matches them with
 * their corresponding metadata from .info.json files.
 */

import path from 'path';
import { DatabaseAdapter } from '../adapters/DatabaseAdapter';
import {
  MediaFile,
  MediaFileRow,
  CreateMediaFileInput,
  UpdateMediaFileInput,
  MediaFileData,
} from '../models/MediaFile';
import { FileScanner, ScannedFile } from '../utils/FileScanner';
import { UUIDExtractor } from '../utils/UUIDExtractor';
import { MetadataReader } from '../utils/MetadataReader';

/**
 * Options for configuring the media loader
 */
export interface MediaLoaderOptions {
  /**
   * Base path for video files (default: '/mnt/Videos')
   */
  videoPath?: string;

  /**
   * Base path for metadata files (default: '/mnt/Metadata')
   */
  metadataPath?: string;

  /**
   * Number of files to process in each batch (default: 100)
   */
  batchSize?: number;

  /**
   * Dry run mode - don't make any database changes (default: false)
   */
  dryRun?: boolean;

  /**
   * Verbose logging mode (default: false)
   */
  verbose?: boolean;
}

/**
 * Statistics from the loading operation
 */
export interface LoaderStatistics {
  /**
   * Total number of files scanned
   */
  filesScanned: number;

  /**
   * Number of files successfully processed
   */
  filesProcessed: number;

  /**
   * Number of files with valid UUIDs
   */
  filesWithUUID: number;

  /**
   * Number of files without valid UUIDs
   */
  filesWithoutUUID: number;

  /**
   * Number of files with metadata found
   */
  filesWithMetadata: number;

  /**
   * Number of files without metadata
   */
  filesWithoutMetadata: number;

  /**
   * Number of new records inserted
   */
  recordsInserted: number;

  /**
   * Number of existing records updated
   */
  recordsUpdated: number;

  /**
   * Number of records that already existed (no changes)
   */
  recordsUnchanged: number;

  /**
   * Number of errors encountered
   */
  errors: number;

  /**
   * List of error messages
   */
  errorMessages: string[];

  /**
   * Processing start time
   */
  startTime: Date;

  /**
   * Processing end time
   */
  endTime?: Date;

  /**
   * Duration in milliseconds
   */
  durationMs?: number;
}

/**
 * MediaLoaderService class for loading video files and metadata
 *
 * Orchestrates the complete workflow:
 * 1. Scan video directory for files
 * 2. Extract UUIDs from filenames
 * 3. Find corresponding metadata files
 * 4. Insert or update database records
 *
 * @example
 * ```typescript
 * const service = new MediaLoaderService(adapter, {
 *   videoPath: '/mnt/Videos',
 *   metadataPath: '/mnt/Metadata',
 *   verbose: true,
 * });
 *
 * const stats = await service.loadMedia();
 * console.log(`Processed ${stats.filesProcessed} files`);
 * ```
 */
export class MediaLoaderService {
  private adapter: DatabaseAdapter;
  private fileScanner: FileScanner;
  private metadataReader: MetadataReader;
  private options: Required<MediaLoaderOptions>;

  /**
   * Create a new MediaLoaderService
   *
   * @param adapter - Database adapter instance
   * @param options - Configuration options
   */
  constructor(adapter: DatabaseAdapter, options: MediaLoaderOptions = {}) {
    this.adapter = adapter;
    this.options = {
      videoPath: options.videoPath || '/mnt/Videos',
      metadataPath: options.metadataPath || '/mnt/Metadata',
      batchSize: options.batchSize || 100,
      dryRun: options.dryRun || false,
      verbose: options.verbose || false,
    };

    this.fileScanner = new FileScanner();
    this.metadataReader = new MetadataReader(this.options.metadataPath);
  }

  /**
   * Convert database row to MediaFile model
   *
   * @param row - Database row
   * @returns MediaFile model
   */
  private rowToMediaFile(row: MediaFileRow): MediaFile {
    return {
      uuid: row.uuid,
      filePath: row.file_path,
      fileName: row.file_name,
      fileSize: row.file_size,
      fileExtension: row.file_extension,
      metadata:
        typeof row.metadata === 'string' && row.metadata
          ? (JSON.parse(row.metadata) as Record<string, unknown>)
          : (row.metadata as Record<string, unknown>) || null,
      metadataFilePath: row.metadata_file_path,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      lastScannedAt: new Date(row.last_scanned_at),
    };
  }

  /**
   * Load media files and metadata into the database
   *
   * Main entry point for the media loading workflow.
   * Scans video directory, processes each file, and returns statistics.
   *
   * @returns Statistics about the loading operation
   * @throws Error if scanning or processing fails
   *
   * @example
   * ```typescript
   * const stats = await service.loadMedia();
   * console.log(`Success: ${stats.recordsInserted} inserted, ${stats.recordsUpdated} updated`);
   * ```
   */
  async loadMedia(): Promise<LoaderStatistics> {
    const stats: LoaderStatistics = {
      filesScanned: 0,
      filesProcessed: 0,
      filesWithUUID: 0,
      filesWithoutUUID: 0,
      filesWithMetadata: 0,
      filesWithoutMetadata: 0,
      recordsInserted: 0,
      recordsUpdated: 0,
      recordsUnchanged: 0,
      errors: 0,
      errorMessages: [],
      startTime: new Date(),
    };

    try {
      console.info('='.repeat(60));
      console.info('Media Metadata Loader - Starting');
      console.info('='.repeat(60));
      console.info(`Video path: ${this.options.videoPath}`);
      console.info(`Metadata path: ${this.options.metadataPath}`);
      console.info(`Dry run: ${this.options.dryRun ? 'YES' : 'NO'}`);
      console.info(`Verbose: ${this.options.verbose ? 'YES' : 'NO'}`);
      console.info('='.repeat(60));

      // Scan video directory
      console.info('\n[1/3] Scanning video directory...');
      const scannedFiles = await this.fileScanner.scanDirectory(this.options.videoPath);
      stats.filesScanned = scannedFiles.length;
      console.info(`Found ${stats.filesScanned} video file(s)\n`);

      if (scannedFiles.length === 0) {
        console.warn('No video files found. Nothing to process.');
        stats.endTime = new Date();
        stats.durationMs = stats.endTime.getTime() - stats.startTime.getTime();
        return stats;
      }

      // Process files in batches
      console.info('[2/3] Processing files...');
      const batchCount = Math.ceil(scannedFiles.length / this.options.batchSize);

      for (let i = 0; i < batchCount; i++) {
        const start = i * this.options.batchSize;
        const end = Math.min(start + this.options.batchSize, scannedFiles.length);
        const batch = scannedFiles.slice(start, end);

        console.info(`\nProcessing batch ${i + 1}/${batchCount} (${batch.length} files)...`);

        for (const file of batch) {
          try {
            await this.processVideoFile(file, stats);
            stats.filesProcessed++;

            // Log progress periodically
            if (stats.filesProcessed % 10 === 0 || this.options.verbose) {
              this.logProgress(stats);
            }
          } catch (error) {
            stats.errors++;
            const errorMsg = `Error processing ${file.relativePath}: ${error instanceof Error ? error.message : String(error)}`;
            stats.errorMessages.push(errorMsg);
            console.error(errorMsg);
          }
        }
      }

      console.info('\n[3/3] Processing complete!');
      this.logProgress(stats);

      stats.endTime = new Date();
      stats.durationMs = stats.endTime.getTime() - stats.startTime.getTime();

      return stats;
    } catch (error) {
      stats.errors++;
      const errorMsg = `Fatal error: ${error instanceof Error ? error.message : String(error)}`;
      stats.errorMessages.push(errorMsg);
      console.error(errorMsg);

      stats.endTime = new Date();
      stats.durationMs = stats.endTime.getTime() - stats.startTime.getTime();

      throw error;
    }
  }

  /**
   * Process a single video file
   *
   * Extracts UUID, finds metadata, and inserts/updates database record.
   *
   * @param file - Scanned file information
   * @param stats - Statistics object to update
   */
  private async processVideoFile(file: ScannedFile, stats: LoaderStatistics): Promise<void> {
    // Extract UUID from filename
    const uuid = UUIDExtractor.extract(file.relativePath);

    if (!uuid) {
      stats.filesWithoutUUID++;
      if (this.options.verbose) {
        console.warn(`No UUID found in filename: ${file.relativePath}`);
      }
      return;
    }

    stats.filesWithUUID++;

    if (this.options.verbose) {
      console.info(`Processing: ${file.relativePath} [UUID: ${uuid}]`);
    }

    // Find and read metadata
    const metadataResult = await this.metadataReader.getMetadataForUUID(uuid);

    if (metadataResult.exists && metadataResult.content) {
      stats.filesWithMetadata++;
    } else {
      stats.filesWithoutMetadata++;
      if (this.options.verbose && metadataResult.error) {
        console.warn(`Metadata error for ${uuid}: ${metadataResult.error}`);
      }
    }

    // Prepare media file data
    const mediaFileData: MediaFileData = {
      uuid,
      absolutePath: file.absolutePath,
      relativePath: file.relativePath,
      fileName: path.basename(file.relativePath),
      fileSize: file.fileSize,
      fileExtension: file.extension,
      metadata: metadataResult.exists ? metadataResult : undefined,
    };

    // Check if record already exists
    const existingRecord = await this.checkExisting(uuid);

    if (this.options.dryRun) {
      if (existingRecord) {
        console.info(`[DRY RUN] Would update existing record: ${uuid}`);
        stats.recordsUpdated++;
      } else {
        console.info(`[DRY RUN] Would insert new record: ${uuid}`);
        stats.recordsInserted++;
      }
      return;
    }

    if (existingRecord) {
      // Check if update is needed
      const needsUpdate = this.compareMetadata(existingRecord, mediaFileData);

      if (needsUpdate) {
        await this.updateMediaFile(uuid, mediaFileData);
        stats.recordsUpdated++;
        if (this.options.verbose) {
          console.info(`Updated: ${uuid}`);
        }
      } else {
        // Update last_scanned_at timestamp even if no changes
        await this.updateLastScanned(uuid);
        stats.recordsUnchanged++;
        if (this.options.verbose) {
          console.info(`Unchanged: ${uuid}`);
        }
      }
    } else {
      // Insert new record
      await this.upsertMediaFile(mediaFileData);
      stats.recordsInserted++;
      if (this.options.verbose) {
        console.info(`Inserted: ${uuid}`);
      }
    }
  }

  /**
   * Check if a media file record already exists
   *
   * @param uuid - UUID to check
   * @returns Existing MediaFile or null
   */
  private async checkExisting(uuid: string): Promise<MediaFile | null> {
    const rows = await this.adapter.query<MediaFileRow>(
      'SELECT * FROM media_files WHERE uuid = ?',
      [uuid]
    );

    if (rows.length === 0) {
      return null;
    }

    return this.rowToMediaFile(rows[0]);
  }

  /**
   * Insert a new media file record
   *
   * @param data - Media file data
   */
  private async upsertMediaFile(data: MediaFileData): Promise<void> {
    const input: CreateMediaFileInput = {
      uuid: data.uuid,
      filePath: data.relativePath,
      fileName: data.fileName,
      fileSize: data.fileSize,
      fileExtension: data.fileExtension,
      metadata: data.metadata?.content || null,
      metadataFilePath: data.metadata?.filePath || null,
    };

    await this.adapter.execute(
      `INSERT INTO media_files
       (uuid, file_path, file_name, file_size, file_extension, metadata, metadata_file_path, last_scanned_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        input.uuid,
        input.filePath,
        input.fileName,
        input.fileSize,
        input.fileExtension,
        input.metadata ? JSON.stringify(input.metadata) : null,
        input.metadataFilePath,
      ]
    );
  }

  /**
   * Update an existing media file record
   *
   * @param uuid - UUID of the record to update
   * @param data - Updated media file data
   */
  private async updateMediaFile(uuid: string, data: MediaFileData): Promise<void> {
    const updates: UpdateMediaFileInput = {
      filePath: data.relativePath,
      fileName: data.fileName,
      fileSize: data.fileSize,
      fileExtension: data.fileExtension,
      metadata: data.metadata?.content || null,
      metadataFilePath: data.metadata?.filePath || null,
    };

    await this.adapter.execute(
      `UPDATE media_files
       SET file_path = ?, file_name = ?, file_size = ?, file_extension = ?,
           metadata = ?, metadata_file_path = ?, last_scanned_at = CURRENT_TIMESTAMP
       WHERE uuid = ?`,
      [
        updates.filePath,
        updates.fileName,
        updates.fileSize,
        updates.fileExtension,
        updates.metadata ? JSON.stringify(updates.metadata) : null,
        updates.metadataFilePath,
        uuid,
      ]
    );
  }

  /**
   * Update only the last_scanned_at timestamp
   *
   * @param uuid - UUID of the record to update
   */
  private async updateLastScanned(uuid: string): Promise<void> {
    await this.adapter.execute(
      'UPDATE media_files SET last_scanned_at = CURRENT_TIMESTAMP WHERE uuid = ?',
      [uuid]
    );
  }

  /**
   * Compare existing record with new data to detect changes
   *
   * @param existing - Existing MediaFile record
   * @param newData - New MediaFileData
   * @returns true if update is needed, false otherwise
   */
  private compareMetadata(existing: MediaFile, newData: MediaFileData): boolean {
    // Compare file properties
    if (existing.filePath !== newData.relativePath) return true;
    if (existing.fileName !== newData.fileName) return true;
    if (existing.fileSize !== newData.fileSize) return true;
    if (existing.fileExtension !== newData.fileExtension) return true;

    // Compare metadata
    const newMetadata = newData.metadata?.content || null;
    const existingMetadata = existing.metadata;

    // If one is null and other isn't, they're different
    if ((newMetadata === null) !== (existingMetadata === null)) return true;

    // If both are null, they're the same
    if (newMetadata === null && existingMetadata === null) return false;

    // Compare metadata content (deep comparison)
    const newMetadataStr = JSON.stringify(newMetadata);
    const existingMetadataStr = JSON.stringify(existingMetadata);

    return newMetadataStr !== existingMetadataStr;
  }

  /**
   * Log current progress
   *
   * @param stats - Current statistics
   */
  private logProgress(stats: LoaderStatistics): void {
    console.info(
      `Progress: ${stats.filesProcessed}/${stats.filesScanned} | ` +
        `UUIDs: ${stats.filesWithUUID} | ` +
        `Metadata: ${stats.filesWithMetadata} | ` +
        `Inserted: ${stats.recordsInserted} | ` +
        `Updated: ${stats.recordsUpdated} | ` +
        `Errors: ${stats.errors}`
    );
  }

  /**
   * Get a media file by UUID
   *
   * @param uuid - UUID to fetch
   * @returns MediaFile or null if not found
   */
  async getMediaFileByUUID(uuid: string): Promise<MediaFile | null> {
    return this.checkExisting(uuid);
  }

  /**
   * Get all media files
   *
   * @param limit - Maximum number of records to return
   * @param offset - Number of records to skip
   * @returns Array of MediaFile records
   */
  async getAllMediaFiles(limit?: number, offset?: number): Promise<MediaFile[]> {
    let sql = 'SELECT * FROM media_files ORDER BY created_at DESC';
    const params: unknown[] = [];

    if (limit !== undefined) {
      sql += ' LIMIT ?';
      params.push(limit);

      if (offset !== undefined) {
        sql += ' OFFSET ?';
        params.push(offset);
      }
    }

    const rows = await this.adapter.query<MediaFileRow>(sql, params);
    return rows.map((row) => this.rowToMediaFile(row));
  }

  /**
   * Get total count of media files
   *
   * @returns Total number of media files in the database
   */
  async getMediaFileCount(): Promise<number> {
    const rows = await this.adapter.query<{ count: number }>(
      'SELECT COUNT(*) as count FROM media_files',
      []
    );
    return rows[0]?.count ?? 0;
  }
}
