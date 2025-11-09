/**
 * VideoStreamingService
 *
 * Service for streaming video files and clips with HTTP range request support.
 * Handles efficient video delivery with seeking capabilities.
 */

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { Request, Response } from 'express';
import { VideoService } from './VideoService';
import { ClipService } from './ClipService';

/**
 * Stream options for video streaming
 */
export interface StreamOptions {
  /**
   * Start byte position for range requests
   */
  start?: number;

  /**
   * End byte position for range requests
   */
  end?: number;
}

/**
 * MIME type mapping for video files
 */
const MIME_TYPES: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.mkv': 'video/x-matroska',
  '.avi': 'video/x-msvideo',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
  '.flv': 'video/x-flv',
  '.wmv': 'video/x-ms-wmv',
  '.m4v': 'video/x-m4v',
};

/**
 * VideoStreamingService class for handling video and clip streaming
 *
 * Provides efficient video streaming with HTTP Range support for seeking.
 * Supports on-the-fly clip extraction using FFmpeg.
 *
 * @example
 * ```typescript
 * const service = new VideoStreamingService(videoService, clipService, '/path/to/videos');
 * await service.streamVideo(1, req, res);
 * ```
 */
export class VideoStreamingService {
  private videoService: VideoService;
  private clipService: ClipService;
  private videoPath: string;

  /**
   * Create a new VideoStreamingService
   *
   * @param videoService - VideoService instance
   * @param clipService - ClipService instance
   * @param videoPath - Base path to video files (from VIDEO_PATH env var)
   */
  constructor(videoService: VideoService, clipService: ClipService, videoPath: string) {
    this.videoService = videoService;
    this.clipService = clipService;
    this.videoPath = path.resolve(videoPath);
  }

  /**
   * Get MIME type for a file based on its extension
   *
   * @param filePath - File path
   * @returns MIME type string
   */
  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    return MIME_TYPES[ext] || 'application/octet-stream';
  }

  /**
   * Validate that a file path is within the allowed video directory
   *
   * Prevents directory traversal attacks by ensuring the resolved path
   * is within the configured video path.
   *
   * @param filePath - File path to validate
   * @returns Absolute path if valid
   * @throws Error if path is outside allowed directory
   */
  private validateFilePath(filePath: string): string {
    const absolutePath = path.resolve(this.videoPath, filePath);

    // Ensure the path is within the video directory
    if (!absolutePath.startsWith(this.videoPath)) {
      throw new Error('File access denied: path outside allowed directory');
    }

    return absolutePath;
  }

  /**
   * Parse HTTP Range header
   *
   * @param rangeHeader - Range header value (e.g., "bytes=0-1023")
   * @param fileSize - Total file size
   * @returns StreamOptions with start and end positions
   */
  private parseRangeHeader(rangeHeader: string | undefined, fileSize: number): StreamOptions {
    if (!rangeHeader) {
      return { start: 0, end: fileSize - 1 };
    }

    // Parse "bytes=start-end" format
    const parts = rangeHeader.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    return {
      start: isNaN(start) ? 0 : start,
      end: isNaN(end) ? fileSize - 1 : Math.min(end, fileSize - 1),
    };
  }

  /**
   * Stream a video file with HTTP Range support
   *
   * Handles range requests for video seeking. Returns 206 Partial Content
   * for range requests, 200 OK for full file requests.
   *
   * @param videoId - Video ID
   * @param req - Express request object
   * @param res - Express response object
   * @throws Error if video not found or not available
   *
   * @example
   * ```typescript
   * // In a route handler:
   * await streamingService.streamVideo(videoId, req, res);
   * ```
   */
  async streamVideo(videoId: number, req: Request, res: Response): Promise<void> {
    try {
      // Get video from database
      const video = await this.videoService.getVideoById(videoId);

      if (!video) {
        res.status(404).json({
          error: {
            message: 'Video not found',
            type: 'NotFoundError',
          },
        });
        return;
      }

      if (!video.isAvailable) {
        res.status(404).json({
          error: {
            message: 'Video not available',
            type: 'NotFoundError',
          },
        });
        return;
      }

      // Validate and resolve file path
      const absolutePath = this.validateFilePath(video.filePath);

      // Check if file exists
      if (!fs.existsSync(absolutePath)) {
        console.error(`Video file not found on disk: ${absolutePath}`);
        res.status(404).json({
          error: {
            message: 'Video file not found',
            type: 'NotFoundError',
          },
        });
        return;
      }

      // Get file stats
      const stat = fs.statSync(absolutePath);
      const fileSize = stat.size;

      // Parse range header
      const range = this.parseRangeHeader(req.headers.range, fileSize);
      const start = range.start!;
      const end = range.end!;
      const contentLength = end - start + 1;

      // Set headers
      const mimeType = this.getMimeType(absolutePath);

      if (req.headers.range) {
        // 206 Partial Content for range requests
        res.status(206);
        res.set({
          'Content-Type': mimeType,
          'Content-Length': contentLength,
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=3600',
        });
      } else {
        // 200 OK for full file
        res.status(200);
        res.set({
          'Content-Type': mimeType,
          'Content-Length': fileSize,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=3600',
        });
      }

      // Create read stream
      const stream = fs.createReadStream(absolutePath, { start, end });

      // Handle stream errors
      stream.on('error', (error) => {
        console.error(`Error streaming video ${videoId}:`, error);
        if (!res.headersSent) {
          res.status(500).json({
            error: {
              message: 'Error streaming video',
              type: 'InternalServerError',
            },
          });
        }
      });

      // Pipe stream to response
      stream.pipe(res);

      // Handle client disconnect
      req.on('close', () => {
        stream.destroy();
      });
    } catch (error) {
      console.error(`Error in streamVideo for ID ${videoId}:`, error);
      if (!res.headersSent) {
        res.status(500).json({
          error: {
            message: error instanceof Error ? error.message : 'Error streaming video',
            type: 'InternalServerError',
          },
        });
      }
    }
  }

  /**
   * Stream a clip using FFmpeg to extract specific time range
   *
   * Uses FFmpeg to extract and stream a specific time range from a video
   * on-the-fly without creating intermediate files.
   *
   * @param clipId - Clip ID
   * @param req - Express request object
   * @param res - Express response object
   * @throws Error if clip not found or video not available
   *
   * @example
   * ```typescript
   * // In a route handler:
   * await streamingService.streamClip(clipId, req, res);
   * ```
   */
  async streamClip(clipId: number, req: Request, res: Response): Promise<void> {
    try {
      // Get clip from database
      const clip = await this.clipService.getClipById(clipId);

      if (!clip) {
        res.status(404).json({
          error: {
            message: 'Clip not found',
            type: 'NotFoundError',
          },
        });
        return;
      }

      // Get source video
      const video = await this.videoService.getVideoById(clip.videoId);

      if (!video) {
        res.status(404).json({
          error: {
            message: 'Source video not found',
            type: 'NotFoundError',
          },
        });
        return;
      }

      if (!video.isAvailable) {
        res.status(404).json({
          error: {
            message: 'Source video not available',
            type: 'NotFoundError',
          },
        });
        return;
      }

      // Validate and resolve file path
      const absolutePath = this.validateFilePath(video.filePath);

      // Check if file exists
      if (!fs.existsSync(absolutePath)) {
        console.error(`Video file not found on disk: ${absolutePath}`);
        res.status(404).json({
          error: {
            message: 'Video file not found',
            type: 'NotFoundError',
          },
        });
        return;
      }

      // Set headers for streaming
      const mimeType = this.getMimeType(absolutePath);
      res.set({
        'Content-Type': mimeType,
        'Accept-Ranges': 'none', // FFmpeg output doesn't support range requests
        'Cache-Control': 'public, max-age=3600',
        'Transfer-Encoding': 'chunked',
      });

      // Use FFmpeg to extract clip on-the-fly
      // -ss: start time, -to: end time
      // -c copy: copy streams without re-encoding (fast)
      // -f: force output format
      const format = path.extname(absolutePath).substring(1) || 'mp4';

      const ffmpegArgs = [
        '-ss',
        clip.startTime.toString(),
        '-to',
        clip.endTime.toString(),
        '-i',
        absolutePath,
        '-c',
        'copy', // Copy without re-encoding for performance
        '-f',
        format,
        '-movflags',
        'frag_keyframe+empty_moov', // Enable streaming for MP4
        'pipe:1', // Output to stdout
      ];

      console.info(
        `Streaming clip ${clipId}: ${clip.startTime}s - ${clip.endTime}s from video ${video.id}`
      );

      const ffmpeg = spawn('ffmpeg', ffmpegArgs);

      // Pipe FFmpeg output to response
      ffmpeg.stdout.pipe(res);

      // Log FFmpeg errors
      ffmpeg.stderr.on('data', (data: Buffer) => {
        // FFmpeg writes progress info to stderr, so we only log if there's an actual error
        const message = data.toString();
        if (message.includes('Error') || message.includes('error')) {
          console.error(`FFmpeg stderr: ${message}`);
        }
      });

      // Handle FFmpeg errors
      ffmpeg.on('error', (error) => {
        console.error(`FFmpeg spawn error for clip ${clipId}:`, error);
        if (!res.headersSent) {
          res.status(500).json({
            error: {
              message: 'Error streaming clip',
              type: 'InternalServerError',
            },
          });
        }
      });

      // Handle FFmpeg exit
      ffmpeg.on('close', (code) => {
        if (code !== 0) {
          console.error(`FFmpeg exited with code ${code} for clip ${clipId}`);
        }
        res.end();
      });

      // Handle client disconnect
      req.on('close', () => {
        ffmpeg.kill('SIGKILL');
      });
    } catch (error) {
      console.error(`Error in streamClip for ID ${clipId}:`, error);
      if (!res.headersSent) {
        res.status(500).json({
          error: {
            message: error instanceof Error ? error.message : 'Error streaming clip',
            type: 'InternalServerError',
          },
        });
      }
    }
  }
}
