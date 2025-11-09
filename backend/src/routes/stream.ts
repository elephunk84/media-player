/**
 * Stream Router
 *
 * Handles video and clip streaming endpoints with HTTP range request support.
 */

import { Router } from 'express';
import { DatabaseAdapter } from '../adapters/DatabaseAdapter';
import { AuthService } from '../services/AuthService';
import { VideoService } from '../services/VideoService';
import { ClipService } from '../services/ClipService';
import { VideoStreamingService } from '../services/VideoStreamingService';
import { StreamController } from '../controllers/streamController';
import { requireAuth, asyncHandler } from '../middleware';

/**
 * Create stream router
 *
 * @param adapter - Database adapter
 * @param authService - Auth service for authentication
 * @returns Express router
 */
export function createStreamRouter(adapter: DatabaseAdapter, authService: AuthService): Router {
  const router = Router();

  // Get VIDEO_PATH from environment
  const videoPath = process.env.VIDEO_PATH || './videos';

  // Create service instances
  const videoService = new VideoService(adapter);
  const clipService = new ClipService(adapter);
  const streamingService = new VideoStreamingService(videoService, clipService, videoPath);
  const streamController = new StreamController(streamingService);

  // Apply authentication to all stream routes
  const auth = requireAuth(authService);

  /* eslint-disable @typescript-eslint/no-misused-promises */
  // Note: asyncHandler properly wraps async functions for Express

  /**
   * GET /api/stream/video/:id
   *
   * Stream a complete video file with HTTP Range support for seeking.
   *
   * Supports range requests (206 Partial Content) for video seeking.
   * Returns appropriate headers (Content-Type, Accept-Ranges, Content-Length).
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
  router.get('/video/:id', auth, asyncHandler(streamController.streamVideo.bind(streamController)));

  /**
   * GET /api/stream/clip/:id
   *
   * Stream a clip (time-based segment) extracted from a video using FFmpeg.
   *
   * Generates the clip on-the-fly without creating intermediate files.
   * Uses FFmpeg with -ss (start time) and -to (end time) options.
   *
   * Note: Range requests are not supported for clips as they are
   * generated on-the-fly.
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
   */
  router.get('/clip/:id', auth, asyncHandler(streamController.streamClip.bind(streamController)));

  /* eslint-enable @typescript-eslint/no-misused-promises */

  return router;
}
