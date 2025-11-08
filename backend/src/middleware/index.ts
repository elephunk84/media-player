/**
 * Middleware Module
 *
 * This module exports all middleware functions and utilities.
 */

// Error handling middleware
export { errorHandler, notFoundHandler, asyncHandler } from './errorHandler';

// Validation middleware
export {
  validate,
  validateBody,
  validateQuery,
  validateParams,
  type ValidationSource,
  type ValidationOptions,
} from './validation';

// Authentication middleware
export { requireAuth, optionalAuth } from './auth';

// Custom error classes
export {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  BadRequestError,
} from './errors';

// Logging middleware
export { requestLogger } from './logging';

// Common Joi schemas
export * from './schemas';
