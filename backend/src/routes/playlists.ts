/**
 * Playlists Router
 *
 * Defines all playlist-related API routes with authentication and validation.
 */

import { Router } from 'express';
import { PlaylistController } from '../controllers/playlistController';
import { PlaylistService } from '../services/PlaylistService';
import { AuthService } from '../services/AuthService';
import { DatabaseAdapter } from '../adapters/DatabaseAdapter';
import {
  requireAuth,
  asyncHandler,
  validateBody,
  validateQuery,
  validateParams,
  idParamSchema,
  createPlaylistSchema,
  updatePlaylistSchema,
  addClipToPlaylistSchema,
  reorderPlaylistSchema,
} from '../middleware';
import Joi from 'joi';

/**
 * Create playlists router
 *
 * @param adapter - Database adapter
 * @param authService - Auth service for authentication
 * @returns Express router
 */
export function createPlaylistsRouter(adapter: DatabaseAdapter, authService: AuthService): Router {
  const router = Router();
  const playlistService = new PlaylistService(adapter);
  const playlistController = new PlaylistController(playlistService);

  // Apply authentication to all playlist routes
  const auth = requireAuth(authService);

  /* eslint-disable @typescript-eslint/no-misused-promises */
  // Note: asyncHandler properly wraps async functions for Express

  /**
   * GET /api/playlists
   *
   * List all playlists.
   */
  router.get('/', auth, asyncHandler(playlistController.listPlaylists.bind(playlistController)));

  /**
   * GET /api/playlists/:id
   *
   * Get a single playlist by ID with ordered clips.
   *
   * Query params:
   * - includeOrphaned: boolean (default: false)
   */
  router.get(
    '/:id',
    auth,
    validateParams(idParamSchema),
    validateQuery(
      Joi.object({
        includeOrphaned: Joi.boolean().optional().default(false),
      })
    ),
    asyncHandler(playlistController.getPlaylist.bind(playlistController))
  );

  /**
   * POST /api/playlists
   *
   * Create a new playlist.
   *
   * Body:
   * - name: string (required)
   * - description: string | null (optional)
   * - tags: string[] (optional)
   */
  router.post(
    '/',
    auth,
    validateBody(createPlaylistSchema),
    asyncHandler(playlistController.createPlaylist.bind(playlistController))
  );

  /**
   * PUT /api/playlists/:id
   *
   * Update a playlist.
   *
   * Body (at least one required):
   * - name: string
   * - description: string | null
   * - tags: string[]
   */
  router.put(
    '/:id',
    auth,
    validateParams(idParamSchema),
    validateBody(updatePlaylistSchema),
    asyncHandler(playlistController.updatePlaylist.bind(playlistController))
  );

  /**
   * DELETE /api/playlists/:id
   *
   * Delete a playlist.
   */
  router.delete(
    '/:id',
    auth,
    validateParams(idParamSchema),
    asyncHandler(playlistController.deletePlaylist.bind(playlistController))
  );

  /**
   * POST /api/playlists/:id/clips
   *
   * Add a clip to a playlist.
   *
   * Body:
   * - clipId: number (required)
   * - order: number (optional)
   */
  router.post(
    '/:id/clips',
    auth,
    validateParams(idParamSchema),
    validateBody(addClipToPlaylistSchema),
    asyncHandler(playlistController.addClip.bind(playlistController))
  );

  /**
   * DELETE /api/playlists/:id/clips/:clipId
   *
   * Remove a clip from a playlist.
   *
   * Query params:
   * - reorder: boolean (default: true)
   */
  router.delete(
    '/:id/clips/:clipId',
    auth,
    validateParams(
      Joi.object({
        id: idParamSchema.extract('id'),
        clipId: idParamSchema.extract('id'),
      })
    ),
    validateQuery(
      Joi.object({
        reorder: Joi.boolean().optional().default(true),
      })
    ),
    asyncHandler(playlistController.removeClip.bind(playlistController))
  );

  /**
   * PATCH /api/playlists/:id/reorder
   *
   * Reorder clips in a playlist (atomic operation).
   *
   * Body:
   * - clipOrders: Array<{ clipId: number, order: number }>
   */
  router.patch(
    '/:id/reorder',
    auth,
    validateParams(idParamSchema),
    validateBody(reorderPlaylistSchema),
    asyncHandler(playlistController.reorderClips.bind(playlistController))
  );

  /* eslint-enable @typescript-eslint/no-misused-promises */

  return router;
}
