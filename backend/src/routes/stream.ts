/**
 * Stream Router
 *
 * Handles video and clip streaming endpoints with HTTP range request support.
 * Also handles HLS (HTTP Live Streaming) for adaptive bitrate streaming.
 */

import { Router } from 'express';
import { DatabaseAdapter } from '../adapters/DatabaseAdapter';
import { AuthService } from '../services/AuthService';
import { VideoService } from '../services/VideoService';
import { ClipService } from '../services/ClipService';
import { VideoStreamingService } from '../services/VideoStreamingService';
import { HLSService } from '../services/HLSService';
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

  // Get VIDEO_PATH and cache directory from environment
  const videoPath = process.env.VIDEO_PATH || './videos';
  const cacheDir = process.env.HLS_CACHE_DIR || './cache/hls';

  // Create service instances
  const videoService = new VideoService(adapter);
  const clipService = new ClipService(adapter);
  const streamingService = new VideoStreamingService(videoService, clipService, videoPath);
  const hlsService = new HLSService(videoService, videoPath, cacheDir);
  const streamController = new StreamController(streamingService, hlsService);

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

  /**
   * GET /api/stream/hls/:id/manifest.m3u8
   *
   * Get HLS manifest for adaptive bitrate streaming.
   *
   * Generates HLS segments on first request and returns the playlist manifest.
   * Segments are cached on disk for subsequent requests.
   *
   * @example
   * Request:
   * GET /api/stream/hls/1/manifest.m3u8
   *
   * Response:
   * 200 OK
   * Content-Type: application/vnd.apple.mpegurl
   * Access-Control-Allow-Origin: *
   * #EXTM3U
   * #EXT-X-VERSION:3
   * #EXT-X-TARGETDURATION:10
   * ...
   */
  router.get(
    '/hls/:id/manifest.m3u8',
    auth,
    asyncHandler(streamController.getHLSManifest.bind(streamController))
  );

  /**
   * GET /api/stream/hls/:id/:segment
   *
   * Get HLS segment file (.ts).
   *
   * Returns a specific segment file for HLS playback.
   * Segments are cached and reused for performance.
   *
   * @example
   * Request:
   * GET /api/stream/hls/1/segment000.ts
   *
   * Response:
   * 200 OK
   * Content-Type: video/mp2t
   * Access-Control-Allow-Origin: *
   * [binary segment data]
   */
  router.get(
    '/hls/:id/:segment',
    auth,
    asyncHandler(streamController.getHLSSegment.bind(streamController))
  );

  /* eslint-enable @typescript-eslint/no-misused-promises */

  return router;
}
