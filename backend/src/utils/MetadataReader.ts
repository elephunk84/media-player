/**
 * MetadataReader Utility
 *
 * Utility for reading and parsing metadata JSON files associated with video files.
 * Used by the Media Metadata Loader to find and read .info.json files from
 * /mnt/Metadata/{UUID}/ directories.
 */

import fs from 'fs/promises';
import path from 'path';
import { MetadataFile } from '../models/MediaFile';

/**
 * MetadataReader class for finding and reading metadata JSON files
 *
 * Provides methods for:
 * - Finding *.info.json files in UUID-specific directories
 * - Reading and parsing JSON metadata files
 * - Combining find and read operations
 *
 * @example
 * ```typescript
 * const reader = new MetadataReader('/mnt/Metadata');
 * const metadata = await reader.getMetadataForUUID('550e8400-e29b-41d4-a716-446655440000');
 *
 * if (metadata.exists && metadata.content) {
 *   console.log('Metadata:', metadata.content);
 * }
 * ```
 */
export class MetadataReader {
  private metadataBasePath: string;

  /**
   * Create a new MetadataReader
   *
   * @param metadataBasePath - Base path for metadata directory (e.g., '/mnt/Metadata')
   *
   * @example
   * ```typescript
   * const reader = new MetadataReader('/mnt/Metadata');
   * ```
   */
  constructor(metadataBasePath: string) {
    this.metadataBasePath = metadataBasePath;
  }

  /**
   * Find metadata file for a given UUID
   *
   * Searches for *.info.json files in the UUID-specific directory:
   * {metadataBasePath}/{UUID}/*.info.json
   *
   * Returns the first *.info.json file found, or null if none exists.
   *
   * @param uuid - UUID to find metadata for
   * @returns Path to metadata file, or null if not found
   *
   * @example
   * ```typescript
   * const filePath = await reader.findMetadataFile('550e8400-e29b-41d4-a716-446655440000');
   * // Returns: '/mnt/Metadata/550e8400-e29b-41d4-a716-446655440000/video.info.json'
   * ```
   */
  async findMetadataFile(uuid: string): Promise<string | null> {
    try {
      // Construct path to UUID directory
      const uuidDir = path.join(this.metadataBasePath, uuid);

      // Check if directory exists
      try {
        const stats = await fs.stat(uuidDir);
        if (!stats.isDirectory()) {
          return null;
        }
      } catch (error) {
        // Directory doesn't exist
        return null;
      }

      // Read directory contents
      const files = await fs.readdir(uuidDir);

      // Find first *.info.json file
      const infoFile = files.find((file) => file.endsWith('.info.json'));

      if (!infoFile) {
        return null;
      }

      // Return full path to the metadata file
      return path.join(uuidDir, infoFile);
    } catch (error) {
      // Log error but don't throw - return null to indicate not found
      console.warn(`Error finding metadata file for UUID ${uuid}:`, error);
      return null;
    }
  }

  /**
   * Read and parse a metadata JSON file
   *
   * Reads the file content and parses it as JSON.
   * Handles file read errors and JSON parsing errors gracefully.
   *
   * @param filePath - Absolute path to the metadata file
   * @returns Parsed metadata object, or null if read/parse fails
   * @throws Error if file cannot be read or parsed (with descriptive message)
   *
   * @example
   * ```typescript
   * const metadata = await reader.readMetadata('/path/to/metadata.info.json');
   * console.log(metadata.title); // Access metadata fields
   * ```
   */
  async readMetadata(filePath: string): Promise<Record<string, unknown> | null> {
    try {
      // Read file content
      const content = await fs.readFile(filePath, 'utf-8');

      // Parse JSON
      const parsed = JSON.parse(content) as Record<string, unknown>;

      return parsed;
    } catch (error) {
      if (error instanceof Error) {
        if ('code' in error && error.code === 'ENOENT') {
          throw new Error(`Metadata file not found: ${filePath}`);
        } else if (error instanceof SyntaxError) {
          throw new Error(`Invalid JSON in metadata file: ${filePath}`);
        } else if ('code' in error && error.code === 'EACCES') {
          throw new Error(`Permission denied reading metadata file: ${filePath}`);
        }
      }
      throw new Error(
        `Failed to read metadata file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get metadata for a UUID (combined find and read operation)
   *
   * Convenience method that finds the metadata file for a UUID and reads it.
   * Returns a MetadataFile object with status information.
   *
   * @param uuid - UUID to get metadata for
   * @returns MetadataFile object with file path, content, and error information
   *
   * @example
   * ```typescript
   * const result = await reader.getMetadataForUUID('550e8400-e29b-41d4-a716-446655440000');
   *
   * if (result.exists && result.content) {
   *   console.log('Found metadata:', result.content);
   * } else if (result.error) {
   *   console.error('Error:', result.error);
   * } else {
   *   console.log('No metadata file found');
   * }
   * ```
   */
  async getMetadataForUUID(uuid: string): Promise<MetadataFile> {
    try {
      // Find metadata file
      const filePath = await this.findMetadataFile(uuid);

      if (!filePath) {
        return {
          filePath: '',
          exists: false,
          error: 'No metadata file found',
        };
      }

      // Read and parse metadata
      try {
        const content = await this.readMetadata(filePath);

        return {
          filePath,
          exists: true,
          content: content || undefined,
        };
      } catch (error) {
        // Return error information
        return {
          filePath,
          exists: true,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    } catch (error) {
      // Unexpected error
      return {
        filePath: '',
        exists: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Check if a metadata file exists for a UUID
   *
   * Quick check without reading the file content.
   *
   * @param uuid - UUID to check
   * @returns true if a metadata file exists, false otherwise
   *
   * @example
   * ```typescript
   * const exists = await reader.hasMetadata('550e8400-e29b-41d4-a716-446655440000');
   * console.log(exists); // true or false
   * ```
   */
  async hasMetadata(uuid: string): Promise<boolean> {
    const filePath = await this.findMetadataFile(uuid);
    return filePath !== null;
  }

  /**
   * Get the expected directory path for a UUID's metadata
   *
   * Returns the directory path where metadata files should be located,
   * regardless of whether the directory actually exists.
   *
   * @param uuid - UUID to get directory path for
   * @returns Expected directory path
   *
   * @example
   * ```typescript
   * const dir = reader.getMetadataDirectory('550e8400-e29b-41d4-a716-446655440000');
   * // Returns: '/mnt/Metadata/550e8400-e29b-41d4-a716-446655440000'
   * ```
   */
  getMetadataDirectory(uuid: string): string {
    return path.join(this.metadataBasePath, uuid);
  }

  /**
   * Get the base path for metadata
   *
   * @returns Base path for metadata directory
   */
  getBasePath(): string {
    return this.metadataBasePath;
  }
}
