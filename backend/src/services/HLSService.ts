/**
 * HLSService
 *
 * Service for HTTP Live Streaming (HLS) with adaptive bitrate support.
 * Generates HLS manifests and segments using FFmpeg with caching.
 */

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { VideoService } from './VideoService';

/**
 * HLS cache entry metadata
 */
interface CacheMetadata {
  videoId: number;
  videoPath: string;
  createdAt: Date;
  lastAccessedAt: Date;
  segmentCount: number;
}

/**
 * HLSService class for HTTP Live Streaming
 *
 * Generates HLS manifests and segments on-demand with disk caching.
 * Automatically cleans up old cache entries to prevent disk overflow.
 *
 * @example
 * ```typescript
 * const hlsService = new HLSService(videoService, '/path/to/videos', '/path/to/cache');
 * const manifest = await hlsService.generateHLSManifest(videoId);
 * ```
 */
export class HLSService {
  private videoService: VideoService;
  private videoPath: string;
  private cacheDir: string;
  private maxCacheAgeDays: number;
  private segmentDuration: number;

  /**
   * Create a new HLSService
   *
   * @param videoService - VideoService instance
   * @param videoPath - Base path to video files (from VIDEO_PATH env var)
   * @param cacheDir - Directory for caching HLS segments (defaults to ./cache/hls)
   * @param maxCacheAgeDays - Maximum age of cache entries in days (defaults to 7)
   * @param segmentDuration - Duration of each HLS segment in seconds (defaults to 10)
   */
  constructor(
    videoService: VideoService,
    videoPath: string,
    cacheDir: string = './cache/hls',
    maxCacheAgeDays: number = 7,
    segmentDuration: number = 10
  ) {
    this.videoService = videoService;
    this.videoPath = path.resolve(videoPath);
    this.cacheDir = path.resolve(cacheDir);
    this.maxCacheAgeDays = maxCacheAgeDays;
    this.segmentDuration = segmentDuration;
  }

  /**
   * Get cache directory for a specific video
   *
   * @param videoId - Video ID
   * @returns Absolute path to cache directory for this video
   */
  private getVideoCacheDir(videoId: number): string {
    return path.join(this.cacheDir, videoId.toString());
  }

  /**
   * Get cache metadata file path
   *
   * @param videoId - Video ID
   * @returns Path to metadata JSON file
   */
  private getCacheMetadataPath(videoId: number): string {
    return path.join(this.getVideoCacheDir(videoId), 'metadata.json');
  }

  /**
   * Read cache metadata
   *
   * @param videoId - Video ID
   * @returns Cache metadata or null if not found
   */
  private async readCacheMetadata(videoId: number): Promise<CacheMetadata | null> {
    try {
      const metadataPath = this.getCacheMetadataPath(videoId);
      const data = await fs.readFile(metadataPath, 'utf-8');
      const metadata = JSON.parse(data) as CacheMetadata;

      // Convert date strings back to Date objects
      metadata.createdAt = new Date(metadata.createdAt);
      metadata.lastAccessedAt = new Date(metadata.lastAccessedAt);

      return metadata;
    } catch {
      return null;
    }
  }

  /**
   * Write cache metadata
   *
   * @param videoId - Video ID
   * @param metadata - Cache metadata
   */
  private async writeCacheMetadata(videoId: number, metadata: CacheMetadata): Promise<void> {
    try {
      const metadataPath = this.getCacheMetadataPath(videoId);
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
    } catch (error) {
      console.error(`Error writing cache metadata for video ${videoId}:`, error);
    }
  }

  /**
   * Update last accessed time for cache entry
   *
   * @param videoId - Video ID
   */
  private async updateLastAccessed(videoId: number): Promise<void> {
    const metadata = await this.readCacheMetadata(videoId);
    if (metadata) {
      metadata.lastAccessedAt = new Date();
      await this.writeCacheMetadata(videoId, metadata);
    }
  }

  /**
   * Check if cache exists and is valid for a video
   *
   * @param videoId - Video ID
   * @param videoPath - Path to source video file
   * @returns true if cache exists and is valid
   */
  private async isCacheValid(videoId: number, videoPath: string): Promise<boolean> {
    try {
      const metadata = await this.readCacheMetadata(videoId);
      if (!metadata) {
        return false;
      }

      // Check if cache is for the same video file
      if (metadata.videoPath !== videoPath) {
        return false;
      }

      // Check if manifest file exists
      const manifestPath = path.join(this.getVideoCacheDir(videoId), 'playlist.m3u8');
      try {
        await fs.access(manifestPath);
      } catch {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate HLS segments using FFmpeg
   *
   * Uses FFmpeg to transcode video into HLS format with multiple segments.
   * Segments are cached on disk for subsequent requests.
   *
   * @param videoId - Video ID
   * @param videoPath - Absolute path to source video file
   * @returns Promise that resolves when generation is complete
   */
  private async generateHLSSegments(videoId: number, videoPath: string): Promise<void> {
    const cacheDir = this.getVideoCacheDir(videoId);

    // Create cache directory
    await fs.mkdir(cacheDir, { recursive: true });

    const manifestPath = path.join(cacheDir, 'playlist.m3u8');
    const segmentPattern = path.join(cacheDir, 'segment%03d.ts');

    console.info(`Generating HLS segments for video ${videoId}...`);

    return new Promise<void>((resolve, reject) => {
      // FFmpeg command to generate HLS
      const ffmpegArgs = [
        '-i',
        videoPath,
        '-c:v',
        'libx264', // H.264 video codec
        '-c:a',
        'aac', // AAC audio codec
        '-hls_time',
        this.segmentDuration.toString(), // Segment duration
        '-hls_list_size',
        '0', // Include all segments in playlist
        '-hls_segment_filename',
        segmentPattern,
        '-f',
        'hls', // HLS format
        manifestPath,
      ];

      const ffmpeg = spawn('ffmpeg', ffmpegArgs);

      let stderr = '';

      ffmpeg.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
        // Log progress (FFmpeg outputs to stderr)
        const progressMatch = stderr.match(/time=(\d{2}:\d{2}:\d{2}\.\d{2})/);
        if (progressMatch) {
          console.info(`HLS generation progress: ${progressMatch[1]}`);
        }
      });

      ffmpeg.on('error', (error) => {
        console.error(`FFmpeg spawn error for video ${videoId}:`, error);
        reject(new Error('Failed to generate HLS segments'));
      });

      ffmpeg.on('close', (code) => {
        if (code !== 0) {
          console.error(`FFmpeg exited with code ${code} for video ${videoId}`);
          console.error(`FFmpeg stderr: ${stderr}`);
          reject(new Error(`FFmpeg failed with code ${code}`));
          return;
        }

        // Use void to handle async operation in event handler
        void (async () => {
          try {
            // Count generated segments
            const files = await fs.readdir(cacheDir);
            const segmentCount = files.filter((f) => f.endsWith('.ts')).length;

            // Write cache metadata
            const metadata: CacheMetadata = {
              videoId,
              videoPath,
              createdAt: new Date(),
              lastAccessedAt: new Date(),
              segmentCount,
            };

            await this.writeCacheMetadata(videoId, metadata);

            console.info(
              `HLS generation complete for video ${videoId}: ${segmentCount} segments created`
            );
            resolve();
          } catch (error) {
            reject(error);
          }
        })();
      });

      // Timeout after 10 minutes
      setTimeout(() => {
        ffmpeg.kill('SIGKILL');
        reject(new Error('HLS generation timeout'));
      }, 600000);
    });
  }

  /**
   * Generate or retrieve HLS manifest for a video
   *
   * Generates HLS segments if they don't exist in cache, then returns the manifest.
   * Subsequent requests will serve the cached manifest.
   *
   * @param videoId - Video ID
   * @returns Manifest content as string
   * @throws Error if video not found or generation fails
   *
   * @example
   * ```typescript
   * const manifest = await hlsService.generateHLSManifest(1);
   * // Returns .m3u8 manifest content
   * ```
   */
  async generateHLSManifest(videoId: number): Promise<string> {
    // Get video from database
    const video = await this.videoService.getVideoById(videoId);

    if (!video) {
      throw new Error('Video not found');
    }

    if (!video.isAvailable) {
      throw new Error('Video not available');
    }

    // Validate and resolve file path
    const absolutePath = path.resolve(this.videoPath, video.filePath);

    // Check if file exists
    if (!fsSync.existsSync(absolutePath)) {
      throw new Error('Video file not found on disk');
    }

    // Check if cache exists and is valid
    const cacheValid = await this.isCacheValid(videoId, absolutePath);

    if (!cacheValid) {
      // Generate HLS segments
      await this.generateHLSSegments(videoId, absolutePath);
    } else {
      // Update last accessed time
      await this.updateLastAccessed(videoId);
    }

    // Read and return manifest
    const manifestPath = path.join(this.getVideoCacheDir(videoId), 'playlist.m3u8');
    const manifest = await fs.readFile(manifestPath, 'utf-8');

    return manifest;
  }

  /**
   * Get HLS segment file
   *
   * Retrieves a specific HLS segment file from cache.
   * Validates that the segment exists and belongs to the requested video.
   *
   * @param videoId - Video ID
   * @param segmentName - Segment filename (e.g., "segment000.ts")
   * @returns Segment file path
   * @throws Error if segment not found or invalid
   *
   * @example
   * ```typescript
   * const segmentPath = await hlsService.getHLSSegment(1, 'segment000.ts');
   * // Returns absolute path to segment file
   * ```
   */
  async getHLSSegment(videoId: number, segmentName: string): Promise<string> {
    // Validate segment name (prevent directory traversal)
    if (!segmentName.match(/^segment\d{3}\.ts$/)) {
      throw new Error('Invalid segment name');
    }

    // Check if cache exists
    const metadata = await this.readCacheMetadata(videoId);
    if (!metadata) {
      throw new Error('HLS cache not found for this video');
    }

    // Update last accessed time
    await this.updateLastAccessed(videoId);

    // Get segment path
    const segmentPath = path.join(this.getVideoCacheDir(videoId), segmentName);

    // Verify segment exists
    try {
      await fs.access(segmentPath);
    } catch {
      throw new Error('Segment not found');
    }

    return segmentPath;
  }

  /**
   * Clean up old cache entries
   *
   * Removes cache entries that haven't been accessed within the configured time period.
   * Should be called periodically (e.g., via cron job or on startup).
   *
   * @returns Number of cache entries removed
   *
   * @example
   * ```typescript
   * const removed = await hlsService.cleanupOldCache();
   * console.log(`Removed ${removed} old cache entries`);
   * ```
   */
  async cleanupOldCache(): Promise<number> {
    try {
      let removedCount = 0;

      // Ensure cache directory exists
      try {
        await fs.access(this.cacheDir);
      } catch {
        return 0; // Cache directory doesn't exist yet
      }

      const entries = await fs.readdir(this.cacheDir);
      const now = new Date();
      const maxAgeMs = this.maxCacheAgeDays * 24 * 60 * 60 * 1000;

      for (const entry of entries) {
        const videoId = parseInt(entry, 10);
        if (isNaN(videoId)) {
          continue;
        }

        const metadata = await this.readCacheMetadata(videoId);
        if (!metadata) {
          continue;
        }

        const age = now.getTime() - new Date(metadata.lastAccessedAt).getTime();

        if (age > maxAgeMs) {
          // Remove cache directory
          const cacheDir = this.getVideoCacheDir(videoId);
          await fs.rm(cacheDir, { recursive: true, force: true });
          removedCount++;
          console.info(
            `Removed old HLS cache for video ${videoId} (last accessed: ${metadata.lastAccessedAt.toISOString()})`
          );
        }
      }

      if (removedCount > 0) {
        console.info(`HLS cache cleanup: removed ${removedCount} old entries`);
      }

      return removedCount;
    } catch (error) {
      console.error('Error during HLS cache cleanup:', error);
      return 0;
    }
  }

  /**
   * Delete cache for a specific video
   *
   * Removes all HLS segments and metadata for a specific video.
   * Useful when a video is deleted or updated.
   *
   * @param videoId - Video ID
   *
   * @example
   * ```typescript
   * await hlsService.deleteCacheForVideo(1);
   * ```
   */
  async deleteCacheForVideo(videoId: number): Promise<void> {
    try {
      const cacheDir = this.getVideoCacheDir(videoId);
      await fs.rm(cacheDir, { recursive: true, force: true });
      console.info(`Deleted HLS cache for video ${videoId}`);
    } catch (error) {
      console.error(`Error deleting HLS cache for video ${videoId}:`, error);
    }
  }
}
