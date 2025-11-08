/**
 * Authentication Middleware
 *
 * Middleware for protecting routes with JWT authentication.
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { UserPublic } from '../models';
import { AuthenticationError } from './errors';

/**
 * Extend Express Request to include user property
 */
/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      user?: UserPublic;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

/**
 * Authentication middleware factory
 *
 * Creates middleware that validates JWT tokens and attaches user to request.
 *
 * @param authService - AuthService instance for token validation
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * const authService = new AuthService(adapter, { jwtSecret: 'secret' });
 * const authMiddleware = requireAuth(authService);
 *
 * router.get('/protected', authMiddleware, (req, res) => {
 *   // req.user is available here
 *   res.json({ user: req.user });
 * });
 * ```
 */
export function requireAuth(authService: AuthService) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        throw new AuthenticationError('No authorization header provided');
      }

      // Check for Bearer token format
      if (!authHeader.startsWith('Bearer ')) {
        throw new AuthenticationError('Invalid authorization header format');
      }

      // Extract token
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      if (!token) {
        throw new AuthenticationError('No token provided');
      }

      // Validate token and get user
      const user = await authService.validateToken(token);

      if (!user) {
        throw new AuthenticationError('Invalid or expired token');
      }

      // Attach user to request
      req.user = user;

      // Continue to next middleware
      next();
    } catch (error) {
      // If it's already an AuthenticationError, pass it through
      if (error instanceof AuthenticationError) {
        next(error);
      } else {
        // For any other error, wrap it in AuthenticationError
        next(new AuthenticationError('Authentication failed'));
      }
    }
  };
}

/**
 * Optional authentication middleware
 *
 * Attempts to validate JWT token but doesn't fail if missing or invalid.
 * Useful for routes that have different behavior for authenticated vs. unauthenticated users.
 *
 * @param authService - AuthService instance for token validation
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * router.get('/videos', optionalAuth(authService), (req, res) => {
 *   if (req.user) {
 *     // User is authenticated
 *   } else {
 *     // User is not authenticated
 *   }
 * });
 * ```
 */
export function optionalAuth(authService: AuthService) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);

        if (token) {
          const user = await authService.validateToken(token);
          if (user) {
            req.user = user;
          }
        }
      }

      // Always continue, even if authentication failed
      next();
    } catch (error) {
      // Silently ignore authentication errors for optional auth
      next();
    }
  };
}
