/**
 * Auth Controller
 *
 * Request handlers for authentication endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { LoginCredentials } from '../models';

/**
 * Auth controller class
 *
 * Handles HTTP requests for authentication operations and delegates to AuthService.
 */
export class AuthController {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  /**
   * POST /api/auth/login
   *
   * Authenticate a user and return a JWT token.
   *
   * Body (validated by Joi):
   * - username: string (required)
   * - password: string (required)
   *
   * Returns:
   * - 200 with JWT token and user info on success
   * - 401 with generic error message on failure
   *
   * SECURITY: Returns generic error message on failure.
   * Does NOT reveal whether username or password was incorrect.
   *
   * @example
   * POST /api/auth/login
   * Body: { "username": "john", "password": "SecurePass123!" }
   *
   * Response: {
   *   "token": "eyJhbGciOiJIUzI1NiIs...",
   *   "user": {
   *     "id": 1,
   *     "username": "john",
   *     "createdAt": "2024-01-01T00:00:00.000Z",
   *     "lastLogin": "2024-01-01T12:00:00.000Z"
   *   }
   * }
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Request body is already validated by Joi middleware
      const credentials = req.body as LoginCredentials;

      // Authenticate user (AuthService returns generic error for security)
      const authResponse = await this.authService.login(credentials);

      // Return JWT token and user info (password hash is NOT included)
      res.json(authResponse);
    } catch (error) {
      // Pass error to error handling middleware
      // AuthService.login() throws ValidationError with generic message
      // Error handler will convert to 401 for AuthenticationError or 400 for ValidationError
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   *
   * Logout endpoint (client-side token removal).
   *
   * This endpoint doesn't actually invalidate tokens server-side,
   * as JWTs are stateless. The client should remove the token from storage.
   *
   * This endpoint exists for:
   * - Client-side logout confirmation
   * - Future server-side token revocation (if implemented)
   * - Consistent API design
   *
   * Returns 200 OK to signal logout acknowledgment.
   *
   * @example
   * POST /api/auth/logout
   *
   * Response: {
   *   "message": "Logged out successfully"
   * }
   */
  logout(_req: Request, res: Response, _next: NextFunction): void {
    // Client should remove token from storage
    // Server-side JWT invalidation could be added here in the future
    // (e.g., token blacklist in Redis)

    res.json({
      message: 'Logged out successfully',
    });
  }

  /**
   * GET /api/auth/validate
   *
   * Validate the current JWT token and return user info.
   *
   * This endpoint REQUIRES authentication middleware.
   * If the token is invalid or missing, auth middleware returns 401.
   *
   * Returns the current authenticated user's information.
   *
   * @example
   * GET /api/auth/validate
   * Headers: { "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs..." }
   *
   * Response: {
   *   "user": {
   *     "id": 1,
   *     "username": "john",
   *     "createdAt": "2024-01-01T00:00:00.000Z",
   *     "lastLogin": "2024-01-01T12:00:00.000Z"
   *   }
   * }
   */
  validate(req: Request, res: Response, _next: NextFunction): void {
    // Authentication middleware has already validated the token
    // and attached the user to req.user

    // Return the authenticated user (password hash is NOT included)
    res.json({
      user: req.user,
    });
  }
}
