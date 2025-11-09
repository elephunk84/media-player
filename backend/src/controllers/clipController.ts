/**
 * Clip Controller
 *
 * Request handlers for clip management endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import { ClipService } from '../services/ClipService';
import { CreateClipInput, UpdateClipInput } from '../models';
import { NotFoundError } from '../middleware/errors';

/**
 * Clip controller class
 *
 * Handles HTTP requests for clip operations and delegates business logic to ClipService.
 */
export class ClipController {
  private clipService: ClipService;

  constructor(clipService: ClipService) {
    this.clipService = clipService;
  }

  /**
   * GET /api/clips
   *
   * List all clips, optionally filtered by videoId.
   *
   * Query params:
   * - videoId: number (optional) - Filter clips by video ID
   *
   * @example
   * GET /api/clips
   * GET /api/clips?videoId=1
   */
  async listClips(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const videoId = req.query.videoId ? Number(req.query.videoId) : undefined;

      let clips;
      if (videoId) {
        // Get clips for specific video
        clips = await this.clipService.getClipsByVideo(videoId);
      } else {
        // Get all clips
        clips = await this.clipService.getAllClips();
      }

      res.json({
        clips,
        count: clips.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/clips/:id
   *
   * Get a single clip by ID.
   *
   * @example
   * GET /api/clips/1
   */
  async getClip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);

      const clip = await this.clipService.getClipById(id);

      if (!clip) {
        throw new NotFoundError('Clip');
      }

      res.json({ clip });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/clips
   *
   * Create a new clip from a video.
   *
   * Body (validated by Joi):
   * - videoId: number (required)
   * - title: string (required)
   * - startTime: number (required, >= 0)
   * - endTime: number (required, > startTime)
   * - description: string | null (optional)
   * - tags: string[] (optional)
   * - customMetadata: object (optional)
   *
   * Time range validation:
   * - startTime must be < endTime
   * - Both must be within video duration
   * - Minimum clip duration is 1 second
   *
   * @example
   * POST /api/clips
   * Body: {
   *   "videoId": 1,
   *   "title": "Highlight",
   *   "startTime": 10,
   *   "endTime": 30,
   *   "tags": ["best-moments"]
   * }
   */
  async createClip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Request body is already validated by Joi middleware
      const input = req.body as CreateClipInput;

      // Create clip (service layer handles video existence check and time validation)
      const clip = await this.clipService.createClip(input);

      res.status(201).json({
        message: 'Clip created successfully',
        clip,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/clips/:id/metadata
   *
   * Update clip metadata.
   *
   * IMPORTANT: This ONLY updates the clip's custom metadata and properties.
   * It does NOT modify the source video or inherited metadata.
   *
   * Body (all fields optional, at least one required):
   * - title: string
   * - description: string | null
   * - tags: string[]
   * - customMetadata: object
   *
   * @example
   * PATCH /api/clips/1/metadata
   * Body: { "title": "New Title", "tags": ["updated"] }
   */
  async updateMetadata(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);

      // Check if clip exists
      const clip = await this.clipService.getClipById(id);
      if (!clip) {
        throw new NotFoundError('Clip');
      }

      // Update metadata (validated by Joi middleware)
      // Service layer ensures source video is never modified
      await this.clipService.updateClipMetadata(id, req.body as UpdateClipInput);

      // Get updated clip
      const updatedClip = await this.clipService.getClipById(id);

      res.json({
        message: 'Clip metadata updated successfully',
        clip: updatedClip,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/clips/:id
   *
   * Delete a clip.
   *
   * Note: This only deletes the clip, not the source video.
   *
   * @example
   * DELETE /api/clips/1
   */
  async deleteClip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);

      // Check if clip exists
      const clip = await this.clipService.getClipById(id);
      if (!clip) {
        throw new NotFoundError('Clip');
      }

      // Delete clip
      await this.clipService.deleteClip(id);

      res.json({
        message: 'Clip deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
