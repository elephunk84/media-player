/**
 * Error Handling Middleware
 *
 * Centralized error handling for Express application.
 * Catches all errors, logs them, and returns consistent JSON responses.
 */

import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/validation';
import {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  BadRequestError,
} from './errors';

/**
 * Error response structure
 */
interface ErrorResponse {
  error: {
    message: string;
    type: string;
    details?: unknown;
  };
}

/**
 * Determine if we're running in production mode
 */
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Sanitize error message for production
 *
 * Removes sensitive information from error messages in production.
 *
 * @param message - Original error message
 * @param error - Original error object
 * @returns Sanitized error message
 */
function sanitizeErrorMessage(message: string, error: Error): string {
  // In production, don't expose internal implementation details
  if (isProduction) {
    // For database errors, return generic message
    if (message.includes('ECONNREFUSED') || message.includes('ER_')) {
      return 'A database error occurred';
    }

    // For file system errors, return generic message
    if (message.includes('ENOENT') || message.includes('EACCES')) {
      return 'A file system error occurred';
    }

    // For stack overflow or memory errors
    if (message.includes('RangeError') || message.includes('Maximum call stack')) {
      return 'An internal server error occurred';
    }

    // For custom error types, allow the message through (they're designed to be user-facing)
    if (
      error instanceof ValidationError ||
      error instanceof AuthenticationError ||
      error instanceof AuthorizationError ||
      error instanceof NotFoundError ||
      error instanceof ConflictError ||
      error instanceof BadRequestError
    ) {
      return message;
    }

    // Default generic message for unknown errors
    return 'An unexpected error occurred';
  }

  // In development, return the original message
  return message;
}

/**
 * Get HTTP status code for error
 *
 * @param error - Error object
 * @returns HTTP status code
 */
function getStatusCode(error: Error): number {
  if (error instanceof ValidationError || error instanceof BadRequestError) {
    return 400;
  }

  if (error instanceof AuthenticationError) {
    return 401;
  }

  if (error instanceof AuthorizationError) {
    return 403;
  }

  if (error instanceof NotFoundError) {
    return 404;
  }

  if (error instanceof ConflictError) {
    return 409;
  }

  // Default to 500 for unknown errors
  return 500;
}

/**
 * Get error type string
 *
 * @param error - Error object
 * @returns Error type string
 */
function getErrorType(error: Error): string {
  if (error instanceof ValidationError) {
    return 'ValidationError';
  }

  if (error instanceof BadRequestError) {
    return 'BadRequestError';
  }

  if (error instanceof AuthenticationError) {
    return 'AuthenticationError';
  }

  if (error instanceof AuthorizationError) {
    return 'AuthorizationError';
  }

  if (error instanceof NotFoundError) {
    return 'NotFoundError';
  }

  if (error instanceof ConflictError) {
    return 'ConflictError';
  }

  return 'InternalServerError';
}

/**
 * Log error details
 *
 * @param error - Error object
 * @param req - Express request object
 */
function logError(error: Error, req: Request): void {
  const statusCode = getStatusCode(error);

  // Log error with context
  console.error('Error occurred:', {
    type: error.name,
    message: error.message,
    statusCode,
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body as unknown,
    timestamp: new Date().toISOString(),
    stack: !isProduction ? error.stack : undefined,
  });
}

/**
 * Error handling middleware
 *
 * Catches all errors thrown in the application and converts them to
 * consistent JSON responses with appropriate status codes.
 *
 * Usage: Register as the last middleware in your Express app
 *
 * @example
 * ```typescript
 * app.use(errorHandler);
 * ```
 *
 * @param error - Error object
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export function errorHandler(error: Error, req: Request, res: Response, _next: NextFunction): void {
  // Log the error
  logError(error, req);

  // Get status code
  const statusCode = getStatusCode(error);

  // Get error type
  const errorType = getErrorType(error);

  // Sanitize error message
  const message = sanitizeErrorMessage(error.message, error);

  // Build error response
  const errorResponse: ErrorResponse = {
    error: {
      message,
      type: errorType,
    },
  };

  // In development, include stack trace
  if (!isProduction && error.stack) {
    errorResponse.error.details = {
      stack: error.stack.split('\n'),
    };
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
}

/**
 * 404 Not Found handler
 *
 * Middleware to handle routes that don't exist.
 * Should be registered before the error handler but after all valid routes.
 *
 * @example
 * ```typescript
 * // Register all your routes first
 * app.use('/api/videos', videoRouter);
 *
 * // Then register the 404 handler
 * app.use(notFoundHandler);
 *
 * // Finally register the error handler
 * app.use(errorHandler);
 * ```
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  const error = new NotFoundError(`Route ${req.method} ${req.path}`);
  next(error);
}

/**
 * Async handler wrapper
 *
 * Wraps async route handlers to automatically catch errors and pass them to
 * the error handling middleware.
 *
 * @example
 * ```typescript
 * router.get('/videos', asyncHandler(async (req, res) => {
 *   const videos = await videoService.getAllVideos();
 *   res.json(videos);
 * }));
 * ```
 *
 * @param fn - Async route handler function
 * @returns Express middleware function
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
