/**
 * Video Controller
 *
 * Request handlers for video management endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import { VideoService } from '../services/VideoService';
import { UpdateVideoInput, VideoSearchCriteria } from '../models';
import { NotFoundError } from '../middleware/errors';

/**
 * Video controller class
 *
 * Handles HTTP requests for video operations and delegates business logic to VideoService.
 */
export class VideoController {
  private videoService: VideoService;

  constructor(videoService: VideoService) {
    this.videoService = videoService;
  }

  /**
   * GET /api/videos
   *
   * List all videos with pagination support.
   *
   * Query params:
   * - limit: Number of videos per page (default: 100, max: 1000)
   * - offset: Number of videos to skip (default: 0)
   * - includeUnavailable: Include unavailable videos (default: false)
   *
   * @example
   * GET /api/videos?limit=20&offset=0
   */
  async listVideos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 100;
      const offset = req.query.offset ? Number(req.query.offset) : 0;
      const includeUnavailable = req.query.includeUnavailable === 'true';

      // Get all videos (service layer will handle the logic)
      const allVideos = await this.videoService.getAllVideos(includeUnavailable);

      // Apply pagination
      const paginatedVideos = allVideos.slice(offset, offset + limit);

      // Get total count
      const total = allVideos.length;

      res.json({
        videos: paginatedVideos,
        pagination: {
          limit,
          offset,
          total,
          hasMore: offset + limit < total,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/videos/:id
   *
   * Get a single video by ID.
   *
   * @example
   * GET /api/videos/1
   */
  async getVideo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);

      const video = await this.videoService.getVideoById(id);

      if (!video) {
        throw new NotFoundError('Video');
      }

      res.json({ video });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/videos/:id/metadata
   *
   * Update video metadata.
   *
   * Body (all fields optional):
   * - title: string
   * - description: string | null
   * - tags: string[]
   * - duration: number
   * - resolution: string
   * - codec: string
   * - customMetadata: object
   *
   * @example
   * PATCH /api/videos/1/metadata
   * Body: { "title": "New Title", "tags": ["action", "adventure"] }
   */
  async updateMetadata(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);

      // Check if video exists
      const video = await this.videoService.getVideoById(id);
      if (!video) {
        throw new NotFoundError('Video');
      }

      // Update metadata (validated by Joi middleware)
      await this.videoService.updateVideoMetadata(id, req.body as UpdateVideoInput);

      // Get updated video
      const updatedVideo = await this.videoService.getVideoById(id);

      res.json({
        message: 'Video metadata updated successfully',
        video: updatedVideo,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/videos/:id
   *
   * Delete a video (soft delete - marks as unavailable).
   *
   * @example
   * DELETE /api/videos/1
   */
  async deleteVideo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);

      // Check if video exists
      const video = await this.videoService.getVideoById(id);
      if (!video) {
        throw new NotFoundError('Video');
      }

      // Delete video
      await this.videoService.deleteVideo(id);

      res.json({
        message: 'Video deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/videos/scan
   *
   * Scan a directory for new videos and add them to the database.
   *
   * Body:
   * - mountPath: string (required) - Path to scan for videos
   *
   * @example
   * POST /api/videos/scan
   * Body: { "mountPath": "/media/videos" }
   */
  async scanVideos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { mountPath } = req.body as { mountPath: string };

      // Scan for videos
      const newVideos = await this.videoService.scanVideos(mountPath);

      res.status(201).json({
        message: `Scan completed: ${newVideos.length} new video(s) added`,
        count: newVideos.length,
        videos: newVideos,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/videos/search
   *
   * Search for videos based on criteria.
   *
   * Query params:
   * - query: string - Text search (title and description)
   * - tags: string[] or comma-separated string - Filter by tags
   * - minDuration: number - Minimum duration in seconds
   * - maxDuration: number - Maximum duration in seconds
   * - resolution: string - Filter by resolution
   * - includeUnavailable: boolean - Include unavailable videos (default: false)
   * - limit: number - Max results (default: 100, max: 1000)
   * - offset: number - Offset for pagination (default: 0)
   *
   * @example
   * GET /api/videos/search?query=action&tags=adventure&limit=20
   */
  async searchVideos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // The query params are already validated by Joi middleware
      // and transformed (e.g., tags as array, defaults applied)
      const criteria = req.query as unknown as VideoSearchCriteria;

      const videos = await this.videoService.searchVideos(criteria);

      res.json({
        videos,
        count: videos.length,
      });
    } catch (error) {
      next(error);
    }
  }
}
