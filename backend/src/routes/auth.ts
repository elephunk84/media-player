/**
 * Auth Router
 *
 * Defines authentication-related API routes.
 */

import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { AuthService } from '../services/AuthService';
import { DatabaseAdapter } from '../adapters/DatabaseAdapter';
import { requireAuth, asyncHandler, validateBody, loginSchema } from '../middleware';

/**
 * Create auth router
 *
 * @param adapter - Database adapter
 * @param authService - Auth service for authentication
 * @returns Express router
 */
export function createAuthRouter(_adapter: DatabaseAdapter, authService: AuthService): Router {
  const router = Router();
  const authController = new AuthController(authService);

  /* eslint-disable @typescript-eslint/no-misused-promises */
  // Note: asyncHandler properly wraps async functions for Express

  /**
   * POST /api/auth/login
   *
   * Authenticate user and return JWT token.
   *
   * Body:
   * - username: string (required)
   * - password: string (required)
   *
   * Returns 200 with token and user on success.
   * Returns 401 with generic error message on failure.
   */
  router.post(
    '/login',
    validateBody(loginSchema),
    asyncHandler(authController.login.bind(authController))
  );

  /**
   * POST /api/auth/logout
   *
   * Logout endpoint (client-side token removal).
   *
   * This is a no-op on the server side, as JWTs are stateless.
   * The client should remove the token from storage.
   *
   * Returns 200 OK to acknowledge logout.
   */
  router.post('/logout', asyncHandler(authController.logout.bind(authController)));

  /**
   * GET /api/auth/validate
   *
   * Validate the current JWT token.
   *
   * Requires authentication middleware.
   * Returns current user info if token is valid.
   * Returns 401 if token is invalid or missing.
   */
  router.get(
    '/validate',
    requireAuth(authService),
    asyncHandler(authController.validate.bind(authController))
  );

  /* eslint-enable @typescript-eslint/no-misused-promises */

  return router;
}
