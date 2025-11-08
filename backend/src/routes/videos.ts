/**
 * Videos Router
 *
 * Defines all video-related API routes with authentication and validation.
 */

import { Router } from 'express';
import { VideoController } from '../controllers/videoController';
import { VideoService } from '../services/VideoService';
import { AuthService } from '../services/AuthService';
import { DatabaseAdapter } from '../adapters/DatabaseAdapter';
import {
  requireAuth,
  asyncHandler,
  validateBody,
  validateQuery,
  validateParams,
  idParamSchema,
  updateVideoSchema,
  scanVideosSchema,
  videoSearchSchema,
  paginationSchema,
} from '../middleware';

/**
 * Create videos router
 *
 * @param adapter - Database adapter
 * @param authService - Auth service for authentication
 * @returns Express router
 */
export function createVideosRouter(adapter: DatabaseAdapter, authService: AuthService): Router {
  const router = Router();
  const videoService = new VideoService(adapter);
  const videoController = new VideoController(videoService);

  // Apply authentication to all video routes
  const auth = requireAuth(authService);

  /* eslint-disable @typescript-eslint/no-misused-promises */
  // Note: asyncHandler properly wraps async functions for Express

  /**
   * GET /api/videos
   *
   * List all videos with pagination.
   *
   * Query params:
   * - limit: number (1-1000, default: 100)
   * - offset: number (min: 0, default: 0)
   * - includeUnavailable: boolean (default: false)
   */
  router.get(
    '/',
    auth,
    validateQuery(
      paginationSchema.keys({
        includeUnavailable: paginationSchema
          .extract('includeUnavailable')
          .optional()
          .default(false),
      })
    ),
    asyncHandler(videoController.listVideos.bind(videoController))
  );

  /**
   * GET /api/videos/search
   *
   * Search for videos.
   * Note: This must be before /:id route to avoid conflict.
   *
   * Query params: See videoSearchSchema
   */
  router.get(
    '/search',
    auth,
    validateQuery(videoSearchSchema),
    asyncHandler(videoController.searchVideos.bind(videoController))
  );

  /**
   * GET /api/videos/:id
   *
   * Get a single video by ID.
   */
  router.get(
    '/:id',
    auth,
    validateParams(idParamSchema),
    asyncHandler(videoController.getVideo.bind(videoController))
  );

  /**
   * PATCH /api/videos/:id/metadata
   *
   * Update video metadata.
   *
   * Body: See updateVideoSchema
   */
  router.patch(
    '/:id/metadata',
    auth,
    validateParams(idParamSchema),
    validateBody(updateVideoSchema),
    asyncHandler(videoController.updateMetadata.bind(videoController))
  );

  /**
   * DELETE /api/videos/:id
   *
   * Delete a video (soft delete).
   */
  router.delete(
    '/:id',
    auth,
    validateParams(idParamSchema),
    asyncHandler(videoController.deleteVideo.bind(videoController))
  );

  /**
   * POST /api/videos/scan
   *
   * Scan a directory for new videos.
   *
   * Body:
   * - mountPath: string (required)
   */
  router.post(
    '/scan',
    auth,
    validateBody(scanVideosSchema),
    asyncHandler(videoController.scanVideos.bind(videoController))
  );

  /* eslint-enable @typescript-eslint/no-misused-promises */

  return router;
}
