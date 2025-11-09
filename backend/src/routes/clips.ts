/**
 * Clips Router
 *
 * Defines all clip-related API routes with authentication and validation.
 */

import { Router } from 'express';
import { ClipController } from '../controllers/clipController';
import { ClipService } from '../services/ClipService';
import { AuthService } from '../services/AuthService';
import { DatabaseAdapter } from '../adapters/DatabaseAdapter';
import {
  requireAuth,
  asyncHandler,
  validateBody,
  validateQuery,
  validateParams,
  idParamSchema,
  createClipSchema,
  updateClipSchema,
} from '../middleware';
import Joi from 'joi';

/**
 * Create clips router
 *
 * @param adapter - Database adapter
 * @param authService - Auth service for authentication
 * @returns Express router
 */
export function createClipsRouter(adapter: DatabaseAdapter, authService: AuthService): Router {
  const router = Router();
  const clipService = new ClipService(adapter);
  const clipController = new ClipController(clipService);

  // Apply authentication to all clip routes
  const auth = requireAuth(authService);

  /* eslint-disable @typescript-eslint/no-misused-promises */
  // Note: asyncHandler properly wraps async functions for Express

  /**
   * GET /api/clips
   *
   * List all clips, optionally filtered by videoId.
   *
   * Query params:
   * - videoId: number (optional) - Filter clips by video ID
   */
  router.get(
    '/',
    auth,
    validateQuery(
      Joi.object({
        videoId: Joi.number().integer().positive().optional().messages({
          'number.base': 'Video ID must be a number',
          'number.integer': 'Video ID must be an integer',
          'number.positive': 'Video ID must be positive',
        }),
      })
    ),
    asyncHandler(clipController.listClips.bind(clipController))
  );

  /**
   * GET /api/clips/:id
   *
   * Get a single clip by ID.
   */
  router.get(
    '/:id',
    auth,
    validateParams(idParamSchema),
    asyncHandler(clipController.getClip.bind(clipController))
  );

  /**
   * POST /api/clips
   *
   * Create a new clip.
   *
   * Body:
   * - videoId: number (required)
   * - title: string (required)
   * - startTime: number (required, >= 0)
   * - endTime: number (required, > startTime)
   * - description: string | null (optional)
   * - tags: string[] (optional)
   * - customMetadata: object (optional)
   */
  router.post(
    '/',
    auth,
    validateBody(createClipSchema),
    asyncHandler(clipController.createClip.bind(clipController))
  );

  /**
   * PATCH /api/clips/:id/metadata
   *
   * Update clip metadata.
   *
   * Body (at least one required):
   * - title: string
   * - description: string | null
   * - tags: string[]
   * - customMetadata: object
   */
  router.patch(
    '/:id/metadata',
    auth,
    validateParams(idParamSchema),
    validateBody(updateClipSchema),
    asyncHandler(clipController.updateMetadata.bind(clipController))
  );

  /**
   * DELETE /api/clips/:id
   *
   * Delete a clip.
   */
  router.delete(
    '/:id',
    auth,
    validateParams(idParamSchema),
    asyncHandler(clipController.deleteClip.bind(clipController))
  );

  /* eslint-enable @typescript-eslint/no-misused-promises */

  return router;
}
