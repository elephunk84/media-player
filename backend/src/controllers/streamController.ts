/**
 * Stream Controller
 *
 * Handles video and clip streaming endpoints with HTTP range request support.
 */

import { Request, Response, NextFunction } from 'express';
import { VideoStreamingService } from '../services/VideoStreamingService';

/**
 * StreamController class for handling video streaming requests
 *
 * Provides endpoints for streaming full videos and time-based clips.
 *
 * @example
 * ```typescript
 * const controller = new StreamController(streamingService);
 * router.get('/video/:id', controller.streamVideo.bind(controller));
 * ```
 */
export class StreamController {
  private streamingService: VideoStreamingService;

  /**
   * Create a new StreamController
   *
   * @param streamingService - VideoStreamingService instance
   */
  constructor(streamingService: VideoStreamingService) {
    this.streamingService = streamingService;
  }

  /**
   * Stream a video file
   *
   * GET /api/stream/video/:id
   *
   * Streams a complete video file with support for HTTP Range requests
   * to enable seeking. Returns 206 Partial Content for range requests.
   *
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   *
   * @example
   * Request with Range header:
   * GET /api/stream/video/1
   * Range: bytes=0-1023
   *
   * Response:
   * 206 Partial Content
   * Content-Type: video/mp4
   * Content-Length: 1024
   * Content-Range: bytes 0-1023/5242880
   * Accept-Ranges: bytes
   */
  async streamVideo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const videoId = parseInt(req.params.id, 10);

      if (isNaN(videoId) || videoId <= 0) {
        res.status(400).json({
          error: {
            message: 'Invalid video ID',
            type: 'ValidationError',
          },
        });
        return;
      }

      await this.streamingService.streamVideo(videoId, req, res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Stream a clip
   *
   * GET /api/stream/clip/:id
   *
   * Streams a time-based clip extracted from a source video using FFmpeg.
   * The clip is generated on-the-fly without creating intermediate files.
   *
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   *
   * @example
   * Request:
   * GET /api/stream/clip/5
   *
   * Response:
   * 200 OK
   * Content-Type: video/mp4
   * Transfer-Encoding: chunked
   * Accept-Ranges: none
   *
   * Note: Range requests are not supported for clips as they are
   * generated on-the-fly by FFmpeg.
   */
  async streamClip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const clipId = parseInt(req.params.id, 10);

      if (isNaN(clipId) || clipId <= 0) {
        res.status(400).json({
          error: {
            message: 'Invalid clip ID',
            type: 'ValidationError',
          },
        });
        return;
      }

      await this.streamingService.streamClip(clipId, req, res);
    } catch (error) {
      next(error);
    }
  }
}
