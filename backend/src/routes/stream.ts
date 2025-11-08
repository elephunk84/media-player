/**
 * Stream Router
 *
 * Handles video streaming endpoints.
 * This is a placeholder router - full implementation to be added later.
 */

import { Router, Request, Response } from 'express';
import { DatabaseAdapter } from '../adapters/DatabaseAdapter';
import { AuthService } from '../services/AuthService';
import { requireAuth } from '../middleware';

/**
 * Create stream router
 *
 * @param _adapter - Database adapter (unused in placeholder implementation)
 * @param authService - Auth service for authentication
 * @returns Express router
 */
export function createStreamRouter(_adapter: DatabaseAdapter, authService: AuthService): Router {
  const router = Router();

  // Apply authentication to all stream routes
  const auth = requireAuth(authService);

  /**
   * GET /api/stream/:videoId
   *
   * Stream video content with range support.
   * This is a placeholder - full implementation pending.
   *
   * TODO: Implement video streaming with:
   * - Range header support for seeking
   * - Proper content-type headers
   * - File streaming from VIDEO_PATH
   * - Bandwidth throttling (optional)
   */
  /* eslint-disable @typescript-eslint/no-misused-promises */
  router.get('/:videoId', auth, (req: Request, res: Response) => {
    const { videoId } = req.params;

    // Placeholder response
    res.status(501).json({
      error: {
        message: 'Video streaming not yet implemented',
        type: 'NotImplementedError',
        details: {
          videoId,
          note: 'This endpoint is a placeholder and will be implemented in a future task',
        },
      },
    });
  });
  /* eslint-enable @typescript-eslint/no-misused-promises */

  return router;
}
