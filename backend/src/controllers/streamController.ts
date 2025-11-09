/**
 * Stream Controller
 *
 * Handles video and clip streaming endpoints with HTTP range request support.
 * Also handles HLS (HTTP Live Streaming) manifests and segments.
 */

import { Request, Response, NextFunction } from 'express';
import { VideoStreamingService } from '../services/VideoStreamingService';
import { HLSService } from '../services/HLSService';
import fs from 'fs';

/**
 * StreamController class for handling video streaming requests
 *
 * Provides endpoints for streaming full videos, time-based clips, and HLS adaptive streaming.
 *
 * @example
 * ```typescript
 * const controller = new StreamController(streamingService, hlsService);
 * router.get('/video/:id', controller.streamVideo.bind(controller));
 * ```
 */
export class StreamController {
  private streamingService: VideoStreamingService;
  private hlsService: HLSService;

  /**
   * Create a new StreamController
   *
   * @param streamingService - VideoStreamingService instance
   * @param hlsService - HLSService instance
   */
  constructor(streamingService: VideoStreamingService, hlsService: HLSService) {
    this.streamingService = streamingService;
    this.hlsService = hlsService;
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

  /**
   * Get HLS manifest
   *
   * GET /api/stream/hls/:id/manifest.m3u8
   *
   * Returns the HLS playlist manifest for adaptive bitrate streaming.
   * Generates HLS segments on first request and caches them for subsequent requests.
   *
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   *
   * @example
   * Request:
   * GET /api/stream/hls/1/manifest.m3u8
   *
   * Response:
   * 200 OK
   * Content-Type: application/vnd.apple.mpegurl
   * #EXTM3U
   * #EXT-X-VERSION:3
   * #EXT-X-TARGETDURATION:10
   * ...
   */
  async getHLSManifest(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      // Generate or retrieve manifest
      const manifest = await this.hlsService.generateHLSManifest(videoId);

      // Set appropriate headers
      res.set({
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*', // Allow CORS for HLS
      });

      res.send(manifest);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            error: {
              message: error.message,
              type: 'NotFoundError',
            },
          });
          return;
        }
      }
      next(error);
    }
  }

  /**
   * Get HLS segment
   *
   * GET /api/stream/hls/:id/:segment
   *
   * Returns a specific HLS segment file (.ts).
   * Segments are cached on disk after first generation.
   *
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   *
   * @example
   * Request:
   * GET /api/stream/hls/1/segment000.ts
   *
   * Response:
   * 200 OK
   * Content-Type: video/mp2t
   * [binary segment data]
   */
  async getHLSSegment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const videoId = parseInt(req.params.id, 10);
      const segmentName = req.params.segment;

      if (isNaN(videoId) || videoId <= 0) {
        res.status(400).json({
          error: {
            message: 'Invalid video ID',
            type: 'ValidationError',
          },
        });
        return;
      }

      // Get segment file path
      const segmentPath = await this.hlsService.getHLSSegment(videoId, segmentName);

      // Set appropriate headers
      res.set({
        'Content-Type': 'video/mp2t',
        'Cache-Control': 'public, max-age=86400', // Cache segments for 24 hours
        'Access-Control-Allow-Origin': '*', // Allow CORS for HLS
      });

      // Stream the segment file
      const stream = fs.createReadStream(segmentPath);

      stream.on('error', (error) => {
        console.error(`Error streaming HLS segment ${segmentName}:`, error);
        if (!res.headersSent) {
          res.status(500).json({
            error: {
              message: 'Error streaming segment',
              type: 'InternalServerError',
            },
          });
        }
      });

      stream.pipe(res);

      // Handle client disconnect
      req.on('close', () => {
        stream.destroy();
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('Invalid segment')) {
          res.status(404).json({
            error: {
              message: error.message,
              type: 'NotFoundError',
            },
          });
          return;
        }
      }
      next(error);
    }
  }
}
