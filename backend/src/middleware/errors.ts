/**
 * Custom Error Classes
 *
 * Defines custom error types for different HTTP error scenarios.
 * These errors are caught by the error handling middleware and converted
 * to appropriate HTTP responses.
 */

/**
 * Authentication error (401 Unauthorized)
 *
 * Thrown when authentication fails or token is invalid/expired.
 */
export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization error (403 Forbidden)
 *
 * Thrown when user doesn't have permission to access a resource.
 */
export class AuthorizationError extends Error {
  constructor(message: string = 'Access forbidden') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Resource not found error (404 Not Found)
 *
 * Thrown when a requested resource doesn't exist.
 */
export class NotFoundError extends Error {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict error (409 Conflict)
 *
 * Thrown when a request conflicts with the current state of the server.
 * For example, trying to create a resource that already exists.
 */
export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

/**
 * Bad request error (400 Bad Request)
 *
 * Thrown when the request is malformed or contains invalid data.
 */
export class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BadRequestError';
  }
}
