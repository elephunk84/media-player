/**
 * FileScanner Utility
 *
 * Utility for scanning directories and finding video files.
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Video file extensions to scan for
 */
export const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.avi', '.mov', '.webm', '.flv', '.wmv', '.m4v'];

/**
 * File information returned by scanner
 */
export interface ScannedFile {
  /**
   * Absolute path to the file
   */
  absolutePath: string;

  /**
   * Relative path from the mount point
   */
  relativePath: string;

  /**
   * File size in bytes
   */
  fileSize: number;

  /**
   * File extension (lowercase)
   */
  extension: string;

  /**
   * Last modified timestamp
   */
  modifiedAt: Date;
}

/**
 * File scanner options
 */
export interface FileScannerOptions {
  /**
   * File extensions to scan for (defaults to VIDEO_EXTENSIONS)
   */
  extensions?: string[];

  /**
   * Maximum directory depth to scan (defaults to unlimited)
   */
  maxDepth?: number;

  /**
   * Patterns to exclude (glob-like patterns)
   */
  excludePatterns?: string[];

  /**
   * Whether to follow symbolic links (defaults to false)
   */
  followSymlinks?: boolean;
}

/**
 * FileScanner class for scanning directories and finding video files
 *
 * @example
 * ```typescript
 * const scanner = new FileScanner();
 * const files = await scanner.scanDirectory('/path/to/videos');
 * console.log(`Found ${files.length} video files`);
 * ```
 */
export class FileScanner {
  private options: Required<FileScannerOptions>;

  /**
   * Create a new FileScanner
   *
   * @param options - Scanner configuration options
   */
  constructor(options: FileScannerOptions = {}) {
    this.options = {
      extensions: options.extensions ?? VIDEO_EXTENSIONS,
      maxDepth: options.maxDepth ?? Infinity,
      excludePatterns: options.excludePatterns ?? [],
      followSymlinks: options.followSymlinks ?? false,
    };

    // Normalize extensions to lowercase with leading dot
    this.options.extensions = this.options.extensions.map((ext) =>
      ext.toLowerCase().startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`
    );
  }

  /**
   * Check if a path should be excluded based on exclude patterns
   *
   * @param filePath - Path to check
   * @returns true if the path should be excluded
   */
  private shouldExclude(filePath: string): boolean {
    if (this.options.excludePatterns.length === 0) {
      return false;
    }

    const normalizedPath = filePath.toLowerCase();

    for (const pattern of this.options.excludePatterns) {
      const normalizedPattern = pattern.toLowerCase();

      // Simple pattern matching (supports * wildcard)
      if (normalizedPattern.includes('*')) {
        const regex = new RegExp(
          '^' + normalizedPattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
        );
        if (regex.test(normalizedPath)) {
          return true;
        }
      } else if (normalizedPath.includes(normalizedPattern)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if a file has a video extension
   *
   * @param filePath - Path to check
   * @returns true if the file has a video extension
   */
  private isVideoFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return this.options.extensions.includes(ext);
  }

  /**
   * Recursively scan a directory for video files
   *
   * @param directory - Directory path to scan
   * @param mountPath - Base mount path for calculating relative paths
   * @param currentDepth - Current recursion depth
   * @returns Array of scanned video files
   * @throws Error if directory cannot be accessed
   */
  private async scanDirectoryRecursive(
    directory: string,
    mountPath: string,
    currentDepth: number = 0
  ): Promise<ScannedFile[]> {
    const results: ScannedFile[] = [];

    // Check depth limit
    if (currentDepth > this.options.maxDepth) {
      return results;
    }

    try {
      const entries = await fs.readdir(directory, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);

        // Check if path should be excluded
        if (this.shouldExclude(fullPath)) {
          continue;
        }

        try {
          let isDirectory = entry.isDirectory();
          let isFile = entry.isFile();

          // Handle symbolic links if followSymlinks is enabled
          if (entry.isSymbolicLink() && this.options.followSymlinks) {
            try {
              const stats = await fs.stat(fullPath);
              isDirectory = stats.isDirectory();
              isFile = stats.isFile();
            } catch (error) {
              // Skip broken symlinks
              console.warn(`Skipping broken symlink: ${fullPath}`);
              continue;
            }
          }

          if (isDirectory) {
            // Recursively scan subdirectory
            const subdirResults = await this.scanDirectoryRecursive(
              fullPath,
              mountPath,
              currentDepth + 1
            );
            results.push(...subdirResults);
          } else if (isFile && this.isVideoFile(fullPath)) {
            // Get file stats
            const stats = await fs.stat(fullPath);

            // Calculate relative path from mount point
            const relativePath = path.relative(mountPath, fullPath);

            results.push({
              absolutePath: fullPath,
              relativePath,
              fileSize: stats.size,
              extension: path.extname(fullPath).toLowerCase(),
              modifiedAt: stats.mtime,
            });
          }
        } catch (error) {
          // Log error but continue scanning other files
          console.warn(`Error processing ${fullPath}:`, error);
          continue;
        }
      }
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        if (error.code === 'EACCES') {
          console.warn(`Permission denied: ${directory}`);
        } else if (error.code === 'ENOENT') {
          console.warn(`Directory not found: ${directory}`);
        } else {
          console.error(`Error scanning directory ${directory}:`, error);
        }
      } else {
        console.error(`Error scanning directory ${directory}:`, error);
      }
    }

    return results;
  }

  /**
   * Scan a directory for video files
   *
   * Recursively scans the specified directory and returns information
   * about all video files found.
   *
   * @param directory - Directory path to scan
   * @returns Array of scanned video files
   * @throws Error if directory does not exist or cannot be accessed
   *
   * @example
   * ```typescript
   * const scanner = new FileScanner();
   * const files = await scanner.scanDirectory('/videos');
   * files.forEach(file => {
   *   console.log(`${file.relativePath}: ${file.fileSize} bytes`);
   * });
   * ```
   */
  async scanDirectory(directory: string): Promise<ScannedFile[]> {
    // Normalize and resolve the directory path
    const normalizedPath = path.resolve(directory);

    // Verify directory exists and is accessible
    try {
      const stats = await fs.stat(normalizedPath);
      if (!stats.isDirectory()) {
        throw new Error(`Path is not a directory: ${normalizedPath}`);
      }
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        throw new Error(`Directory does not exist: ${normalizedPath}`);
      }
      throw error;
    }

    // Scan the directory
    const files = await this.scanDirectoryRecursive(normalizedPath, normalizedPath, 0);

    console.info(`Scanned ${normalizedPath}: found ${files.length} video file(s)`);

    return files;
  }

  /**
   * Check if a file exists
   *
   * @param filePath - Path to check
   * @returns true if the file exists and is accessible
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file information
   *
   * @param filePath - Path to the file
   * @param mountPath - Base mount path for calculating relative path
   * @returns File information or null if file doesn't exist
   */
  async getFileInfo(filePath: string, mountPath: string): Promise<ScannedFile | null> {
    try {
      const stats = await fs.stat(filePath);

      if (!stats.isFile()) {
        return null;
      }

      const relativePath = path.relative(mountPath, filePath);

      return {
        absolutePath: filePath,
        relativePath,
        fileSize: stats.size,
        extension: path.extname(filePath).toLowerCase(),
        modifiedAt: stats.mtime,
      };
    } catch {
      return null;
    }
  }
}
