/**
 * FFmpegService
 *
 * Service for extracting video metadata using FFmpeg's ffprobe tool.
 * Handles video file analysis and metadata extraction.
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import { VideoMetadata } from '../models';

/**
 * FFprobe JSON output format
 * This matches the structure returned by ffprobe -print_format json
 */
interface FFprobeOutput {
  format?: {
    duration?: string;
    size?: string;
    bit_rate?: string;
    format_name?: string;
  };
  streams?: Array<{
    codec_type?: string;
    codec_name?: string;
    width?: number;
    height?: number;
    r_frame_rate?: string;
    bit_rate?: string;
  }>;
}

/**
 * FFmpegService class for video metadata extraction
 *
 * Uses ffprobe (part of FFmpeg suite) to extract accurate video metadata
 * including duration, resolution, codec, and file size.
 *
 * @example
 * ```typescript
 * const service = new FFmpegService();
 * const metadata = await service.extractMetadata('/path/to/video.mp4');
 * if (metadata) {
 *   console.log(`Duration: ${metadata.duration}s`);
 *   console.log(`Resolution: ${metadata.resolution}`);
 * }
 * ```
 */
export class FFmpegService {
  private ffprobeCommand: string;
  private ffprobeAvailable: boolean | null = null;

  /**
   * Create a new FFmpegService
   *
   * @param ffprobeCommand - Path to ffprobe command (defaults to 'ffprobe')
   */
  constructor(ffprobeCommand: string = 'ffprobe') {
    this.ffprobeCommand = ffprobeCommand;
  }

  /**
   * Check if ffprobe is available on the system
   *
   * Tests if the ffprobe command can be executed.
   * Results are cached after first check.
   *
   * @returns true if ffprobe is available, false otherwise
   */
  async checkFFprobeAvailable(): Promise<boolean> {
    // Return cached result if available
    if (this.ffprobeAvailable !== null) {
      return this.ffprobeAvailable;
    }

    return new Promise<boolean>((resolve) => {
      const process = spawn(this.ffprobeCommand, ['-version']);

      process.on('error', () => {
        this.ffprobeAvailable = false;
        resolve(false);
      });

      process.on('close', (code) => {
        this.ffprobeAvailable = code === 0;
        resolve(code === 0);
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        process.kill();
        this.ffprobeAvailable = false;
        resolve(false);
      }, 5000);
    });
  }

  /**
   * Parse frame rate string to number
   *
   * Converts ffprobe frame rate format (e.g., "30000/1001") to decimal number.
   *
   * @param frameRateStr - Frame rate string from ffprobe
   * @returns Frame rate as number or undefined if invalid
   */
  private parseFrameRate(frameRateStr: string | undefined): number | undefined {
    if (!frameRateStr) {
      return undefined;
    }

    try {
      // Frame rate can be in format "30000/1001" or "30"
      if (frameRateStr.includes('/')) {
        const [numerator, denominator] = frameRateStr.split('/').map(Number);
        if (denominator && !isNaN(numerator) && !isNaN(denominator)) {
          return numerator / denominator;
        }
      } else {
        const rate = parseFloat(frameRateStr);
        if (!isNaN(rate)) {
          return rate;
        }
      }
    } catch {
      return undefined;
    }

    return undefined;
  }

  /**
   * Extract metadata from ffprobe JSON output
   *
   * Parses the JSON output from ffprobe and extracts relevant video metadata.
   *
   * @param output - ffprobe JSON output
   * @param fileSize - File size in bytes (from fs.stat)
   * @returns VideoMetadata object or null if extraction fails
   */
  private extractMetadataFromOutput(output: FFprobeOutput, fileSize: number): VideoMetadata | null {
    try {
      // Find video stream
      const videoStream = output.streams?.find((stream) => stream.codec_type === 'video');
      const audioStream = output.streams?.find((stream) => stream.codec_type === 'audio');

      if (!videoStream) {
        console.warn('No video stream found in file');
        return null;
      }

      // Extract duration (in seconds)
      const duration = output.format?.duration ? parseFloat(output.format.duration) : 0;

      // Extract resolution
      const width = videoStream.width ?? 0;
      const height = videoStream.height ?? 0;
      const resolution = width > 0 && height > 0 ? `${width}x${height}` : 'unknown';

      // Extract codec (video codec name)
      const codec = videoStream.codec_name ?? 'unknown';

      // Extract optional fields
      const frameRate = this.parseFrameRate(videoStream.r_frame_rate);
      const bitrate = output.format?.bit_rate ? parseInt(output.format.bit_rate, 10) : undefined;
      const audioCodec = audioStream?.codec_name;
      const format = output.format?.format_name?.split(',')[0]; // Take first format if multiple

      return {
        duration: !isNaN(duration) ? duration : 0,
        resolution,
        codec,
        fileSize,
        frameRate,
        bitrate: bitrate && !isNaN(bitrate) ? bitrate : undefined,
        audioCodec,
        format,
      };
    } catch (error) {
      console.error('Error extracting metadata from ffprobe output:', error);
      return null;
    }
  }

  /**
   * Extract video metadata using ffprobe
   *
   * Uses ffprobe to analyze a video file and extract metadata including:
   * - duration (seconds)
   * - resolution (WxH string)
   * - codec (video codec name)
   * - fileSize (bytes)
   * - frameRate (optional)
   * - bitrate (optional)
   * - audioCodec (optional)
   * - format (optional)
   *
   * @param filePath - Absolute path to the video file
   * @returns VideoMetadata object or null if extraction fails
   *
   * @example
   * ```typescript
   * const service = new FFmpegService();
   * const metadata = await service.extractMetadata('/videos/movie.mp4');
   * if (metadata) {
   *   console.log(`${metadata.resolution} @ ${metadata.frameRate}fps`);
   * }
   * ```
   */
  async extractMetadata(filePath: string): Promise<VideoMetadata | null> {
    try {
      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        console.error(`File not found: ${filePath}`);
        return null;
      }

      // Get file size
      let fileSize = 0;
      try {
        const stats = await fs.stat(filePath);
        fileSize = stats.size;
      } catch (error) {
        console.error(`Error getting file stats: ${filePath}`, error);
        return null;
      }

      // Check if ffprobe is available
      const isAvailable = await this.checkFFprobeAvailable();
      if (!isAvailable) {
        console.warn(
          'ffprobe is not available. Please install FFmpeg to enable metadata extraction.'
        );
        // Return default metadata when ffprobe is not available
        return {
          duration: 0,
          resolution: 'unknown',
          codec: 'unknown',
          fileSize,
        };
      }

      // Execute ffprobe with JSON output
      return new Promise<VideoMetadata | null>((resolve) => {
        const args = [
          '-v',
          'quiet', // Suppress ffprobe output
          '-print_format',
          'json', // Output in JSON format
          '-show_format', // Show format information
          '-show_streams', // Show stream information
          filePath,
        ];

        const process = spawn(this.ffprobeCommand, args);

        let stdout = '';
        let stderr = '';

        process.stdout.on('data', (data: Buffer) => {
          stdout += data.toString();
        });

        process.stderr.on('data', (data: Buffer) => {
          stderr += data.toString();
        });

        process.on('error', (error) => {
          console.error(`Error spawning ffprobe for ${filePath}:`, error.message);
          resolve(null);
        });

        process.on('close', (code) => {
          if (code !== 0) {
            console.error(`ffprobe exited with code ${code} for ${filePath}`);
            if (stderr) {
              console.error(`ffprobe stderr: ${stderr}`);
            }
            resolve(null);
            return;
          }

          try {
            // Parse JSON output
            const output = JSON.parse(stdout) as FFprobeOutput;
            const metadata = this.extractMetadataFromOutput(output, fileSize);
            resolve(metadata);
          } catch (error) {
            console.error(`Error parsing ffprobe JSON output for ${filePath}:`, error);
            resolve(null);
          }
        });

        // Timeout after 30 seconds for slow files
        setTimeout(() => {
          process.kill();
          console.error(`ffprobe timeout for ${filePath}`);
          resolve(null);
        }, 30000);
      });
    } catch (error) {
      console.error(`Error extracting metadata for ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Extract metadata with fallback to defaults
   *
   * Attempts to extract metadata, but returns default values if extraction fails
   * instead of null. Useful when you need metadata but can tolerate defaults.
   *
   * @param filePath - Absolute path to the video file
   * @param fileSize - File size in bytes (optional, will be retrieved if not provided)
   * @returns VideoMetadata object with defaults if extraction fails
   *
   * @example
   * ```typescript
   * const service = new FFmpegService();
   * const metadata = await service.extractMetadataWithDefaults('/videos/movie.mp4');
   * // metadata is always non-null, uses defaults if extraction fails
   * ```
   */
  async extractMetadataWithDefaults(filePath: string, fileSize?: number): Promise<VideoMetadata> {
    const metadata = await this.extractMetadata(filePath);

    if (metadata) {
      return metadata;
    }

    // Return defaults if extraction failed
    const size = fileSize ?? 0;

    // Try to get file size if not provided
    if (fileSize === undefined) {
      try {
        const stats = await fs.stat(filePath);
        return {
          duration: 0,
          resolution: 'unknown',
          codec: 'unknown',
          fileSize: stats.size,
        };
      } catch {
        // Ignore error, use 0 for file size
      }
    }

    return {
      duration: 0,
      resolution: 'unknown',
      codec: 'unknown',
      fileSize: size,
    };
  }
}
