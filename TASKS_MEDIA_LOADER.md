# Media Metadata Loader - Implementation Tasks

This document provides a step-by-step checklist for implementing the Media Metadata Loader feature. Each task includes complete code examples and clear success criteria.

## Overview

The Media Metadata Loader automates the discovery, matching, and loading of video files with their associated metadata into the database. Video files are stored in `/mnt/Videos` with UUID-based filenames, while metadata is in `/mnt/Metadata/{UUID}/*.info.json`.

## Prerequisites

Before starting:
- [ ] Read `IMPLEMENTATION_GUIDE_MEDIA_LOADER.md` for workflow guidance
- [ ] Read `CODE_STANDARDS.md` for code style patterns
- [ ] Read existing code: `backend/src/services/VideoService.ts`, `backend/src/utils/FileScanner.ts`, `backend/src/models/Video.ts`

## Phase 1: Database Schema & Models (3 tasks)

### Task 1.1: Create Database Migration

**File:** `backend/src/migrations/00N_create_media_files_table.ts` (replace N with next number)

**Purpose:** Create `media_files` table for UUID-based media storage

**Code:**

```typescript
import { DatabaseAdapter } from '../adapters/DatabaseAdapter';
import { Migration } from '../types/database';

/**
 * Migration: Create media_files table
 *
 * Creates a new table for storing video files with UUID-based metadata.
 * Supports both MySQL and PostgreSQL with appropriate syntax.
 */
export const migration: Migration = {
  version: 'N', // Replace with actual next version number
  name: 'create_media_files_table',
  description: 'Create media_files table for UUID-based media metadata storage',

  async up(adapter: DatabaseAdapter): Promise<void> {
    // Detect database type (check if MySQL or PostgreSQL)
    // This is a simple detection - you may need to enhance based on your adapter implementation
    const testQuery = await adapter.query<any>('SELECT VERSION()', []);
    const isMysql = testQuery.length > 0 &&
                    testQuery[0].VERSION &&
                    testQuery[0].VERSION().toLowerCase().includes('mysql');

    if (isMysql) {
      // MySQL syntax
      await adapter.execute(`
        CREATE TABLE media_files (
          id INT AUTO_INCREMENT PRIMARY KEY,
          uuid VARCHAR(36) NOT NULL UNIQUE,
          file_path VARCHAR(512) NOT NULL,
          absolute_path VARCHAR(1024) NOT NULL,
          file_size BIGINT NOT NULL,
          extension VARCHAR(10) NOT NULL,
          metadata_file_path VARCHAR(1024),
          metadata JSON NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          is_available BOOLEAN DEFAULT TRUE
        )
      `, []);

      // Create indexes for MySQL
      await adapter.execute(
        'CREATE INDEX idx_media_uuid ON media_files(uuid)',
        []
      );
      await adapter.execute(
        'CREATE INDEX idx_media_file_path ON media_files(file_path)',
        []
      );
      await adapter.execute(
        'CREATE INDEX idx_media_created_at ON media_files(created_at)',
        []
      );
    } else {
      // PostgreSQL syntax
      await adapter.execute(`
        CREATE TABLE media_files (
          id SERIAL PRIMARY KEY,
          uuid UUID NOT NULL UNIQUE,
          file_path VARCHAR(512) NOT NULL,
          absolute_path VARCHAR(1024) NOT NULL,
          file_size BIGINT NOT NULL,
          extension VARCHAR(10) NOT NULL,
          metadata_file_path VARCHAR(1024),
          metadata JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          is_available BOOLEAN DEFAULT TRUE
        )
      `, []);

      // Create indexes for PostgreSQL
      await adapter.execute(
        'CREATE INDEX idx_media_uuid ON media_files(uuid)',
        []
      );
      await adapter.execute(
        'CREATE INDEX idx_media_file_path ON media_files(file_path)',
        []
      );
      await adapter.execute(
        'CREATE INDEX idx_media_created_at ON media_files(created_at)',
        []
      );
      await adapter.execute(
        'CREATE INDEX idx_media_metadata ON media_files USING GIN(metadata)',
        []
      );
    }

    console.info('✓ Created media_files table with indexes');
  },

  async down(adapter: DatabaseAdapter): Promise<void> {
    await adapter.execute('DROP TABLE IF EXISTS media_files', []);
    console.info('✓ Dropped media_files table');
  },
};
```

**Success Criteria:**
- [ ] Migration file compiles without errors
- [ ] `up()` creates table for both MySQL and PostgreSQL
- [ ] All indexes are created
- [ ] `down()` removes table cleanly
- [ ] Migration runs via `MigrationRunner`

---

### Task 1.2: Create MediaFile Model

**File:** `backend/src/models/MediaFile.ts`

**Purpose:** Define TypeScript interfaces for media file data structures

**Code:**

```typescript
/**
 * MediaFile Model
 *
 * Represents a media file with UUID and metadata from file system.
 */

/**
 * MediaFile metadata file information
 */
export interface MetadataFile {
  /**
   * Absolute path to metadata file
   */
  filePath: string;

  /**
   * Parsed JSON content from metadata file
   */
  content: Record<string, unknown>;

  /**
   * Metadata file size in bytes
   */
  fileSize: number;

  /**
   * Last modified timestamp
   */
  modifiedAt: Date;
}

/**
 * MediaFile model representing a video file with UUID-based metadata
 *
 * Matches the media_files table schema in the database.
 */
export interface MediaFile {
  /**
   * Unique media file identifier (auto-generated)
   */
  readonly id: number;

  /**
   * Video file UUID extracted from filename
   * Must be unique across all media files
   */
  uuid: string;

  /**
   * Relative path from mount point to the video file
   */
  filePath: string;

  /**
   * Absolute path to the video file
   */
  absolutePath: string;

  /**
   * File size in bytes
   */
  fileSize: number;

  /**
   * File extension (e.g., ".mp4", ".mkv")
   */
  extension: string;

  /**
   * Absolute path to the metadata JSON file
   * Null if no metadata file was found
   */
  metadataFilePath: string | null;

  /**
   * Parsed metadata JSON object from *.info.json file
   * Empty object if no metadata available
   */
  metadata: Record<string, unknown>;

  /**
   * Timestamp when the media file was added to the database
   */
  readonly createdAt: Date;

  /**
   * Timestamp when the media file was last updated
   */
  updatedAt: Date;

  /**
   * Whether the media file is currently accessible
   */
  isAvailable: boolean;
}

/**
 * MediaFile creation input (fields required to create a new media file)
 */
export interface CreateMediaFileInput {
  uuid: string;
  filePath: string;
  absolutePath: string;
  fileSize: number;
  extension: string;
  metadataFilePath?: string | null;
  metadata: Record<string, unknown>;
}

/**
 * MediaFile database row (matches database column names with snake_case)
 */
export interface MediaFileRow {
  id: number;
  uuid: string;
  file_path: string;
  absolute_path: string;
  file_size: number;
  extension: string;
  metadata_file_path: string | null;
  metadata: string; // JSON string in database
  created_at: Date;
  updated_at: Date;
  is_available: boolean;
}

/**
 * Internal data structure used during media loading
 */
export interface MediaFileData {
  uuid: string;
  videoFilePath: string;
  videoAbsolutePath: string;
  videoFileSize: number;
  videoExtension: string;
  metadataFile: MetadataFile | null;
  discoveredAt: Date;
}
```

**Success Criteria:**
- [ ] All interfaces compile with strict TypeScript mode
- [ ] Clear separation between model and database representations
- [ ] Comprehensive JSDoc comments
- [ ] Matches database schema from Task 1.1

---

### Task 1.3: Export MediaFile Model

**File:** `backend/src/models/index.ts` (modify existing)

**Purpose:** Make MediaFile types available throughout the application

**Code to add:**

```typescript
// Add to existing exports (maintain alphabetical order)
export type {
  MediaFile,
  MediaFileRow,
  CreateMediaFileInput,
  MediaFileData,
  MetadataFile,
} from './MediaFile';
```

**Success Criteria:**
- [ ] Types are properly exported
- [ ] Imports work: `import { MediaFile } from '../models'`
- [ ] No compilation errors
- [ ] Alphabetically ordered with other exports

---

## Phase 2: Core Utilities (4 tasks)

### Task 2.1: Create UUIDExtractor Utility

**File:** `backend/src/utils/UUIDExtractor.ts`

**Purpose:** Extract UUIDs from video filenames using regex

**Code:**

```typescript
/**
 * UUIDExtractor Utility
 *
 * Utility for extracting and validating UUIDs from filenames.
 * Supports UUID v4 format: 8-4-4-4-12 hexadecimal pattern.
 */

/**
 * Regular expression for matching UUID v4 format
 * Pattern: 8-4-4-4-12 hexadecimal characters
 * Version 4 UUID has '4' in the third group
 * Variant bits are 8, 9, a, or b in the fourth group
 */
const UUID_V4_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi;

/**
 * UUIDExtractor class for extracting and validating UUIDs
 *
 * All methods are static - no instance creation needed.
 *
 * @example
 * ```typescript
 * const uuid = UUIDExtractor.extract('video_550e8400-e29b-41d4-a716-446655440000.mp4');
 * console.log(uuid); // "550e8400-e29b-41d4-a716-446655440000"
 * ```
 */
export class UUIDExtractor {
  /**
   * Extract the first valid UUID v4 from a filename
   *
   * Performs case-insensitive matching and returns the UUID in lowercase.
   *
   * @param filename - Filename to extract UUID from
   * @returns First valid UUID found, or null if none found
   *
   * @example
   * ```typescript
   * UUIDExtractor.extract('550e8400-e29b-41d4-a716-446655440000.mp4');
   * // Returns: "550e8400-e29b-41d4-a716-446655440000"
   *
   * UUIDExtractor.extract('video_550E8400-E29B-41D4-A716-446655440000.mp4');
   * // Returns: "550e8400-e29b-41d4-a716-446655440000"
   *
   * UUIDExtractor.extract('no-uuid-here.mp4');
   * // Returns: null
   * ```
   */
  static extract(filename: string): string | null {
    if (!filename || typeof filename !== 'string') {
      return null;
    }

    // Reset regex lastIndex to ensure consistent behavior
    UUID_V4_REGEX.lastIndex = 0;

    const match = UUID_V4_REGEX.exec(filename.toLowerCase());
    return match ? match[0] : null;
  }

  /**
   * Validate if a string is a valid UUID v4 format
   *
   * @param uuid - String to validate
   * @returns true if valid UUID v4 format, false otherwise
   *
   * @example
   * ```typescript
   * UUIDExtractor.isValidUUID('550e8400-e29b-41d4-a716-446655440000');
   * // Returns: true
   *
   * UUIDExtractor.isValidUUID('not-a-uuid');
   * // Returns: false
   * ```
   */
  static isValidUUID(uuid: string): boolean {
    if (!uuid || typeof uuid !== 'string') {
      return false;
    }

    // Reset regex lastIndex
    UUID_V4_REGEX.lastIndex = 0;

    const match = UUID_V4_REGEX.exec(uuid.toLowerCase());
    // Must match entire string (not just contain a UUID)
    return match !== null && match[0] === uuid.toLowerCase();
  }

  /**
   * Extract all valid UUID v4s from a filename
   *
   * Useful for filenames that might contain multiple UUIDs.
   *
   * @param filename - Filename to extract UUIDs from
   * @returns Array of all valid UUIDs found (may be empty)
   *
   * @example
   * ```typescript
   * UUIDExtractor.extractAll('550e8400-e29b-41d4-a716-446655440000_6ba7b810-9dad-11d1-80b4-00c04fd430c8.mp4');
   * // Returns: ["550e8400-e29b-41d4-a716-446655440000", "6ba7b810-9dad-11d1-80b4-00c04fd430c8"]
   * ```
   */
  static extractAll(filename: string): string[] {
    if (!filename || typeof filename !== 'string') {
      return [];
    }

    const uuids: string[] = [];
    const lowerFilename = filename.toLowerCase();

    // Reset regex lastIndex
    UUID_V4_REGEX.lastIndex = 0;

    let match: RegExpExecArray | null;
    while ((match = UUID_V4_REGEX.exec(lowerFilename)) !== null) {
      uuids.push(match[0]);
    }

    return uuids;
  }
}
```

**Success Criteria:**
- [ ] `extract()` returns first UUID from filename
- [ ] `isValidUUID()` validates UUID v4 format
- [ ] `extractAll()` returns all UUIDs
- [ ] Case-insensitive matching works
- [ ] Returns null for invalid input
- [ ] Comprehensive JSDoc comments

---

### Task 2.2: Create MetadataReader Utility

**File:** `backend/src/utils/MetadataReader.ts`

**Purpose:** Locate and parse *.info.json metadata files

**Code:**

```typescript
/**
 * MetadataReader Utility
 *
 * Utility for finding and reading metadata JSON files from nested directory structure.
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Metadata file information
 */
export interface MetadataFile {
  /**
   * Absolute path to metadata file
   */
  filePath: string;

  /**
   * Parsed JSON content
   */
  content: Record<string, unknown>;

  /**
   * File size in bytes
   */
  fileSize: number;

  /**
   * Last modified timestamp
   */
  modifiedAt: Date;
}

/**
 * MetadataReader class for finding and parsing metadata JSON files
 *
 * @example
 * ```typescript
 * const reader = new MetadataReader('/mnt/Metadata');
 * const metadata = await reader.getMetadataForUUID('550e8400-e29b-41d4-a716-446655440000');
 * if (metadata) {
 *   console.log('Found metadata:', metadata.content);
 * }
 * ```
 */
export class MetadataReader {
  private metadataBasePath: string;

  /**
   * Create a new MetadataReader
   *
   * @param metadataBasePath - Base path for metadata directories (e.g., "/mnt/Metadata")
   */
  constructor(metadataBasePath: string) {
    this.metadataBasePath = metadataBasePath;
  }

  /**
   * Find metadata file for a given UUID
   *
   * Searches for *.info.json files in /mnt/Metadata/{UUID}/ directory.
   * If multiple files exist, returns the first alphabetically.
   *
   * @param uuid - UUID to find metadata for
   * @returns Path to metadata file, or null if not found
   * @throws Error if directory cannot be read (permission denied, etc.)
   *
   * @example
   * ```typescript
   * const filePath = await reader.findMetadataFile('550e8400-e29b-41d4-a716-446655440000');
   * // Returns: "/mnt/Metadata/550e8400-e29b-41d4-a716-446655440000/video.info.json"
   * ```
   */
  async findMetadataFile(uuid: string): Promise<string | null> {
    const metadataDir = path.join(this.metadataBasePath, uuid);

    try {
      // Check if directory exists
      const stats = await fs.stat(metadataDir);
      if (!stats.isDirectory()) {
        return null;
      }

      // Read directory contents
      const files = await fs.readdir(metadataDir);

      // Find .info.json files (case-insensitive)
      const infoFiles = files
        .filter((file) => file.toLowerCase().endsWith('.info.json'))
        .sort(); // Alphabetical order

      if (infoFiles.length === 0) {
        return null;
      }

      // Return first file found
      return path.join(metadataDir, infoFiles[0]);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // Directory doesn't exist
        return null;
      }
      // Re-throw other errors (permission denied, etc.)
      throw error;
    }
  }

  /**
   * Read and parse metadata JSON file
   *
   * @param filePath - Absolute path to metadata file
   * @returns Parsed metadata file information
   * @throws Error if file cannot be read or JSON is malformed
   *
   * @example
   * ```typescript
   * const metadata = await reader.readMetadata('/path/to/video.info.json');
   * console.log(metadata.content); // Parsed JSON object
   * ```
   */
  async readMetadata(filePath: string): Promise<MetadataFile> {
    try {
      // Get file stats
      const stats = await fs.stat(filePath);

      // Read file contents
      const content = await fs.readFile(filePath, 'utf-8');

      // Parse JSON
      let parsedContent: unknown;
      try {
        parsedContent = JSON.parse(content);
      } catch (parseError) {
        throw new Error(
          `Failed to parse JSON in ${filePath}: ${
            parseError instanceof Error ? parseError.message : String(parseError)
          }`
        );
      }

      // Validate that parsed content is an object
      if (typeof parsedContent !== 'object' || parsedContent === null || Array.isArray(parsedContent)) {
        throw new Error(
          `Invalid metadata format in ${filePath}: expected JSON object, got ${typeof parsedContent}`
        );
      }

      return {
        filePath,
        content: parsedContent as Record<string, unknown>,
        fileSize: stats.size,
        modifiedAt: stats.mtime,
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`Metadata file not found: ${filePath}`);
      }
      if ((error as NodeJS.ErrnoException).code === 'EACCES') {
        throw new Error(`Permission denied reading metadata file: ${filePath}`);
      }
      throw error;
    }
  }

  /**
   * Find and read metadata for a UUID in one operation
   *
   * Convenience method combining findMetadataFile() and readMetadata().
   *
   * @param uuid - UUID to find metadata for
   * @returns Metadata file information, or null if not found
   * @throws Error if file exists but cannot be read or parsed
   *
   * @example
   * ```typescript
   * const metadata = await reader.getMetadataForUUID('550e8400-e29b-41d4-a716-446655440000');
   * if (metadata) {
   *   console.log('Title:', metadata.content.title);
   * } else {
   *   console.log('No metadata found');
   * }
   * ```
   */
  async getMetadataForUUID(uuid: string): Promise<MetadataFile | null> {
    const filePath = await this.findMetadataFile(uuid);
    if (!filePath) {
      return null;
    }

    return await this.readMetadata(filePath);
  }
}
```

**Success Criteria:**
- [ ] `findMetadataFile()` locates *.info.json files
- [ ] `readMetadata()` parses JSON successfully
- [ ] `getMetadataForUUID()` combines both operations
- [ ] Handles missing directories/files gracefully
- [ ] Throws descriptive errors for permission/parse issues
- [ ] Validates JSON is an object

---

### Task 2.3: Add UUID Validation Functions

**File:** `backend/src/utils/validation.ts` (modify existing)

**Purpose:** Add UUID validation to existing validation utilities

**Code to add:**

```typescript
// Add these imports at the top
import { UUIDExtractor } from './UUIDExtractor';

// Add these functions (place with other validation functions)

/**
 * Validate and sanitize a UUID
 *
 * @param uuid - UUID to validate
 * @param fieldName - Field name for error messages (default: "UUID")
 * @returns Validated and normalized UUID (lowercase, trimmed)
 * @throws ValidationError if UUID is invalid
 *
 * @example
 * ```typescript
 * const uuid = validateUUID('550E8400-E29B-41D4-A716-446655440000');
 * // Returns: "550e8400-e29b-41d4-a716-446655440000"
 *
 * validateUUID('invalid');
 * // Throws: ValidationError
 * ```
 */
export function validateUUID(
  uuid: string | null | undefined,
  fieldName: string = 'UUID'
): string {
  if (!uuid || typeof uuid !== 'string' || uuid.trim() === '') {
    throw new ValidationError(`${fieldName} is required and must be a non-empty string`);
  }

  const normalized = uuid.trim().toLowerCase();

  if (!UUIDExtractor.isValidUUID(normalized)) {
    throw new ValidationError(
      `${fieldName} must be a valid UUID v4 format (8-4-4-4-12 hexadecimal)`
    );
  }

  return normalized;
}

/**
 * Sanitize a UUID to lowercase and trimmed format
 *
 * Does not validate - use validateUUID() for validation.
 *
 * @param uuid - UUID to sanitize
 * @returns Sanitized UUID (lowercase, trimmed)
 *
 * @example
 * ```typescript
 * const uuid = sanitizeUUID('  550E8400-E29B-41D4-A716-446655440000  ');
 * // Returns: "550e8400-e29b-41d4-a716-446655440000"
 * ```
 */
export function sanitizeUUID(uuid: string): string {
  return uuid.trim().toLowerCase();
}
```

**Success Criteria:**
- [ ] `validateUUID()` validates and normalizes UUIDs
- [ ] Throws `ValidationError` for invalid UUIDs
- [ ] `sanitizeUUID()` normalizes format
- [ ] Follows existing validation patterns
- [ ] Comprehensive JSDoc comments

---

### Task 2.4: Export Utility Functions

**File:** `backend/src/utils/index.ts` (modify existing)

**Purpose:** Export new utilities for application-wide use

**Code to add:**

```typescript
// Add to existing exports (maintain alphabetical order)
export { MetadataReader, MetadataFile } from './MetadataReader';
export { UUIDExtractor } from './UUIDExtractor';
```

**Success Criteria:**
- [ ] Utilities are properly exported
- [ ] Imports work: `import { UUIDExtractor } from '../utils'`
- [ ] No compilation errors
- [ ] Alphabetically ordered

---

## Phase 3: Service Layer (5 tasks)

### Task 3.1: Create MediaLoaderService Foundation

**File:** `backend/src/services/MediaLoaderService.ts`

**Purpose:** Create service class structure with configuration

**Code:**

```typescript
/**
 * MediaLoaderService
 *
 * Service for orchestrating media file and metadata loading from file system.
 */

import { DatabaseAdapter } from '../adapters/DatabaseAdapter';
import { FileScanner, ScannedFile } from '../utils/FileScanner';
import { MetadataReader, MetadataFile } from '../utils/MetadataReader';
import { UUIDExtractor } from '../utils/UUIDExtractor';
import { MediaFileRow } from '../models/MediaFile';

/**
 * Media loader configuration options
 */
export interface MediaLoaderOptions {
  /**
   * Path to video files directory
   * @default "/mnt/Videos"
   */
  videoPath: string;

  /**
   * Path to metadata base directory
   * @default "/mnt/Metadata"
   */
  metadataPath: string;

  /**
   * Number of files to process per batch
   * @default 100
   */
  batchSize: number;

  /**
   * Preview mode - scan but don't write to database
   * @default false
   */
  dryRun: boolean;

  /**
   * Enable detailed debug logging
   * @default false
   */
  verbose: boolean;
}

/**
 * Statistics from media loading operation
 */
export interface LoaderStatistics {
  /**
   * Total number of video files found
   */
  totalFilesFound: number;

  /**
   * Number of files successfully processed
   */
  successCount: number;

  /**
   * Number of files that failed processing
   */
  failedCount: number;

  /**
   * Number of files with missing metadata
   */
  missingMetadataCount: number;

  /**
   * Number of files that already existed (skipped)
   */
  alreadyExistsCount: number;

  /**
   * Number of files that were updated (metadata changed)
   */
  updatedCount: number;

  /**
   * Total processing time in milliseconds
   */
  processingTimeMs: number;

  /**
   * Array of errors encountered during processing
   */
  errors: Array<{ file: string; error: string }>;
}

/**
 * MediaLoaderService class for orchestrating media loading workflow
 *
 * @example
 * ```typescript
 * const service = new MediaLoaderService(adapter, {
 *   videoPath: '/mnt/Videos',
 *   metadataPath: '/mnt/Metadata',
 *   batchSize: 100,
 *   dryRun: false,
 *   verbose: true,
 * });
 *
 * const stats = await service.loadMedia();
 * console.log(`Processed ${stats.successCount} files`);
 * ```
 */
export class MediaLoaderService {
  private adapter: DatabaseAdapter;
  private options: MediaLoaderOptions;
  private fileScanner: FileScanner;
  private metadataReader: MetadataReader;

  /**
   * Create a new MediaLoaderService
   *
   * @param adapter - Database adapter instance
   * @param options - Service configuration options
   */
  constructor(adapter: DatabaseAdapter, options: Partial<MediaLoaderOptions> = {}) {
    this.adapter = adapter;

    // Set default options
    this.options = {
      videoPath: options.videoPath ?? '/mnt/Videos',
      metadataPath: options.metadataPath ?? '/mnt/Metadata',
      batchSize: options.batchSize ?? 100,
      dryRun: options.dryRun ?? false,
      verbose: options.verbose ?? false,
    };

    // Initialize utilities
    this.fileScanner = new FileScanner();
    this.metadataReader = new MetadataReader(this.options.metadataPath);
  }

  /**
   * Load all media files from video directory
   *
   * Main entry point for media loading workflow.
   *
   * @returns Statistics about the loading operation
   * @throws Error if video directory doesn't exist or cannot be accessed
   */
  async loadMedia(): Promise<LoaderStatistics> {
    // Placeholder - will implement in next task
    console.info('MediaLoaderService.loadMedia() - not yet implemented');

    return {
      totalFilesFound: 0,
      successCount: 0,
      failedCount: 0,
      missingMetadataCount: 0,
      alreadyExistsCount: 0,
      updatedCount: 0,
      processingTimeMs: 0,
      errors: [],
    };
  }
}
```

**Success Criteria:**
- [ ] Service class compiles without errors
- [ ] Constructor initializes all dependencies
- [ ] Options interface is well-defined
- [ ] Statistics interface is comprehensive
- [ ] Follows VideoService pattern

---

### Task 3.2: Implement Core Loading Logic

**File:** `backend/src/services/MediaLoaderService.ts` (continue from 3.1)

**Purpose:** Implement complete workflow orchestration

**Code to add/replace in MediaLoaderService class:**

```typescript
  /**
   * Load all media files from video directory
   *
   * Main entry point for media loading workflow:
   * 1. Scan video directory
   * 2. Process each file (extract UUID, find metadata, insert/update DB)
   * 3. Return statistics
   *
   * @returns Statistics about the loading operation
   * @throws Error if video directory doesn't exist or cannot be accessed
   */
  async loadMedia(): Promise<LoaderStatistics> {
    const startTime = Date.now();

    console.info('='.repeat(60));
    console.info('Starting Media Loader');
    console.info('='.repeat(60));
    console.info(`Video path: ${this.options.videoPath}`);
    console.info(`Metadata path: ${this.options.metadataPath}`);
    console.info(`Batch size: ${this.options.batchSize}`);
    console.info(`Dry run: ${this.options.dryRun}`);
    console.info('');

    // Initialize statistics
    const stats: LoaderStatistics = {
      totalFilesFound: 0,
      successCount: 0,
      failedCount: 0,
      missingMetadataCount: 0,
      alreadyExistsCount: 0,
      updatedCount: 0,
      processingTimeMs: 0,
      errors: [],
    };

    try {
      // Step 1: Scan video directory
      console.info('Scanning video directory...');
      const scannedFiles = await this.fileScanner.scanDirectory(this.options.videoPath);
      stats.totalFilesFound = scannedFiles.length;
      console.info(`Found ${stats.totalFilesFound} video file(s)`);
      console.info('');

      if (scannedFiles.length === 0) {
        console.info('No video files found.');
        stats.processingTimeMs = Date.now() - startTime;
        return stats;
      }

      // Step 2: Process files
      console.info('Processing files...');
      for (let i = 0; i < scannedFiles.length; i++) {
        const file = scannedFiles[i];

        try {
          const result = await this.processVideoFile(file);

          // Update statistics based on result
          switch (result) {
            case 'success':
              stats.successCount++;
              break;
            case 'failed':
              stats.failedCount++;
              break;
            case 'missing-metadata':
              stats.missingMetadataCount++;
              stats.successCount++; // Still counts as success (file loaded)
              break;
            case 'already-exists':
              stats.alreadyExistsCount++;
              break;
            case 'updated':
              stats.updatedCount++;
              stats.successCount++; // Updated counts as success
              break;
          }

          // Log progress every 10 files
          if ((i + 1) % 10 === 0 || i === scannedFiles.length - 1) {
            this.logProgress(i + 1, scannedFiles.length, startTime);
          }
        } catch (error) {
          stats.failedCount++;
          const errorMessage = error instanceof Error ? error.message : String(error);
          stats.errors.push({
            file: file.relativePath,
            error: errorMessage,
          });
          console.error(`✗ Error processing ${file.relativePath}: ${errorMessage}`);
        }
      }

      console.info('');
      console.info('Processing complete!');
    } catch (error) {
      console.error('Fatal error during media loading:', error);
      throw error;
    } finally {
      stats.processingTimeMs = Date.now() - startTime;
    }

    return stats;
  }

  /**
   * Process a single video file
   *
   * Workflow:
   * 1. Extract UUID from filename
   * 2. Check if already exists in database
   * 3. Find and read metadata file
   * 4. Insert or update database record
   *
   * @param scannedFile - Scanned file information
   * @returns Processing result status
   */
  private async processVideoFile(
    scannedFile: ScannedFile
  ): Promise<'success' | 'failed' | 'missing-metadata' | 'already-exists' | 'updated'> {
    if (this.options.verbose) {
      console.info(`Processing: ${scannedFile.relativePath}`);
    }

    // Step 1: Extract UUID from filename
    const uuid = UUIDExtractor.extract(scannedFile.relativePath);
    if (!uuid) {
      if (this.options.verbose) {
        console.warn(`  ⚠ No valid UUID found in filename: ${scannedFile.relativePath}`);
      }
      return 'failed';
    }

    if (this.options.verbose) {
      console.info(`  UUID: ${uuid}`);
    }

    // Step 2: Check if media file already exists
    const existing = await this.checkExisting(uuid);
    if (existing && !this.options.dryRun) {
      // Check if metadata has changed
      const metadata = await this.metadataReader.getMetadataForUUID(uuid);

      if (metadata) {
        const hasChanged = this.compareMetadata(existing, metadata);
        if (hasChanged) {
          // Update existing record
          await this.updateMediaFile(uuid, metadata.content, metadata.filePath);
          if (this.options.verbose) {
            console.info(`  ✓ Updated (metadata changed)`);
          }
          return 'updated';
        }
      }

      if (this.options.verbose) {
        console.info(`  ○ Already exists (no changes)`);
      }
      return 'already-exists';
    }

    // Step 3: Get metadata for UUID
    const metadata = await this.metadataReader.getMetadataForUUID(uuid);

    if (!metadata) {
      if (this.options.verbose) {
        console.info(`  ⚠ No metadata found for UUID: ${uuid}`);
      }

      // Insert with empty metadata if dry-run is false
      if (!this.options.dryRun) {
        await this.upsertMediaFile({
          uuid,
          filePath: scannedFile.relativePath,
          absolutePath: scannedFile.absolutePath,
          fileSize: scannedFile.fileSize,
          extension: scannedFile.extension,
          metadataFilePath: null,
          metadata: {},
        });
      }

      return 'missing-metadata';
    }

    if (this.options.verbose) {
      console.info(`  ✓ Found metadata: ${metadata.filePath}`);
    }

    // Step 4: Insert into database
    if (!this.options.dryRun) {
      await this.upsertMediaFile({
        uuid,
        filePath: scannedFile.relativePath,
        absolutePath: scannedFile.absolutePath,
        fileSize: scannedFile.fileSize,
        extension: scannedFile.extension,
        metadataFilePath: metadata.filePath,
        metadata: metadata.content,
      });
    }

    if (this.options.verbose) {
      console.info(`  ✓ ${this.options.dryRun ? 'Would insert' : 'Inserted'} into database`);
    }

    return 'success';
  }

  /**
   * Check if media file already exists in database
   *
   * @param uuid - UUID to check
   * @returns MediaFileRow if exists, null otherwise
   */
  private async checkExisting(uuid: string): Promise<MediaFileRow | null> {
    const rows = await this.adapter.query<MediaFileRow>(
      'SELECT * FROM media_files WHERE uuid = ?',
      [uuid]
    );

    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Compare existing metadata with new metadata to detect changes
   *
   * @param existing - Existing database row
   * @param newData - New metadata file
   * @returns true if metadata has changed, false otherwise
   */
  private compareMetadata(existing: MediaFileRow, newData: MetadataFile): boolean {
    try {
      const existingMetadata = typeof existing.metadata === 'string'
        ? JSON.parse(existing.metadata)
        : existing.metadata;

      // Deep compare using JSON stringify
      return JSON.stringify(existingMetadata) !== JSON.stringify(newData.content);
    } catch {
      // If comparison fails, assume changed
      return true;
    }
  }

  /**
   * Insert media file into database
   *
   * @param data - Media file data to insert
   */
  private async upsertMediaFile(data: {
    uuid: string;
    filePath: string;
    absolutePath: string;
    fileSize: number;
    extension: string;
    metadataFilePath: string | null;
    metadata: Record<string, unknown>;
  }): Promise<void> {
    await this.adapter.execute(
      `INSERT INTO media_files
       (uuid, file_path, absolute_path, file_size, extension, metadata_file_path, metadata, is_available)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.uuid,
        data.filePath,
        data.absolutePath,
        data.fileSize,
        data.extension,
        data.metadataFilePath,
        JSON.stringify(data.metadata),
        true,
      ]
    );
  }

  /**
   * Update existing media file metadata
   *
   * @param uuid - UUID of file to update
   * @param metadata - New metadata content
   * @param metadataFilePath - New metadata file path
   */
  private async updateMediaFile(
    uuid: string,
    metadata: Record<string, unknown>,
    metadataFilePath: string
  ): Promise<void> {
    await this.adapter.execute(
      `UPDATE media_files
       SET metadata = ?, metadata_file_path = ?, updated_at = CURRENT_TIMESTAMP
       WHERE uuid = ?`,
      [JSON.stringify(metadata), metadataFilePath, uuid]
    );
  }

  /**
   * Log progress during processing
   *
   * @param current - Current file number
   * @param total - Total number of files
   * @param startTime - Start time in milliseconds
   */
  private logProgress(current: number, total: number, startTime: number): void {
    const percentage = ((current / total) * 100).toFixed(1);
    const elapsed = (Date.now() - startTime) / 1000;

    // Calculate ETA (only after processing at least 10 files)
    let etaStr = 'calculating...';
    if (current >= 10) {
      const avgTimePerFile = elapsed / current;
      const remaining = (total - current) * avgTimePerFile;
      etaStr = remaining < 60
        ? `${remaining.toFixed(0)}s`
        : `${(remaining / 60).toFixed(1)}m`;
    }

    console.info(`Progress: ${current}/${total} (${percentage}%) | ETA: ${etaStr}`);
  }
```

**Success Criteria:**
- [ ] `loadMedia()` orchestrates complete workflow
- [ ] `processVideoFile()` handles single file processing
- [ ] UUID extraction and validation works
- [ ] Metadata matching and loading works
- [ ] Database operations execute correctly
- [ ] Progress logging provides useful feedback
- [ ] Dry-run mode skips database writes
- [ ] Verbose logging shows detailed information

---

**Continue with remaining tasks...**

Due to length constraints, I'll create the remaining tasks and supporting documents in separate files. Let me continue with the rest of the TASKS.md and create the supporting documents.
