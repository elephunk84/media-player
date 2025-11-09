/**
 * Validation Middleware
 *
 * Provides validation middleware factory for validating request data
 * using Joi schemas.
 */

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from '../utils/validation';

/**
 * Location of data to validate in the request
 */
export type ValidationSource = 'body' | 'query' | 'params';

/**
 * Validation options
 */
export interface ValidationOptions {
  /**
   * Where to find the data to validate (body, query, or params)
   * Default: 'body'
   */
  source?: ValidationSource;

  /**
   * Whether to strip unknown properties from the validated data
   * Default: true
   */
  stripUnknown?: boolean;

  /**
   * Whether to abort validation on first error
   * Default: false
   */
  abortEarly?: boolean;
}

/**
 * Default validation options
 */
const DEFAULT_OPTIONS: Required<ValidationOptions> = {
  source: 'body',
  stripUnknown: true,
  abortEarly: false,
};

/**
 * Format Joi validation error for user-friendly response
 *
 * @param error - Joi validation error
 * @returns Formatted error message
 */
function formatValidationError(error: Joi.ValidationError): string {
  // Extract all error messages
  const messages = error.details.map((detail) => detail.message);

  // Join messages with semicolon
  return messages.join('; ');
}

/**
 * Validation middleware factory
 *
 * Creates an Express middleware that validates request data against a Joi schema.
 * Returns 400 Bad Request with validation errors if validation fails.
 *
 * @param schema - Joi schema to validate against
 * @param options - Validation options
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * const createVideoSchema = Joi.object({
 *   title: Joi.string().required().max(255),
 *   description: Joi.string().optional().max(10000),
 * });
 *
 * router.post('/videos',
 *   validate(createVideoSchema),
 *   async (req, res) => {
 *     // req.body is now validated and typed
 *     const video = await videoService.createVideo(req.body);
 *     res.json(video);
 *   }
 * );
 * ```
 *
 * @example
 * ```typescript
 * // Validate query parameters
 * const searchSchema = Joi.object({
 *   query: Joi.string().optional(),
 *   limit: Joi.number().integer().min(1).max(100).default(20),
 * });
 *
 * router.get('/videos/search',
 *   validate(searchSchema, { source: 'query' }),
 *   async (req, res) => {
 *     const results = await videoService.search(req.query);
 *     res.json(results);
 *   }
 * );
 * ```
 */
export function validate(
  schema: Joi.ObjectSchema,
  options: ValidationOptions = {}
): (req: Request, res: Response, next: NextFunction) => void {
  // Merge options with defaults
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return (req: Request, _res: Response, next: NextFunction): void => {
    // Get data to validate from the specified source
    const dataToValidate = req[opts.source] as unknown;

    // Validate the data
    const { error, value } = schema.validate(dataToValidate, {
      stripUnknown: opts.stripUnknown,
      abortEarly: opts.abortEarly,
    }) as { error?: Joi.ValidationError; value: unknown };

    // If validation failed, throw ValidationError
    if (error) {
      const message = formatValidationError(error);
      return next(new ValidationError(message));
    }

    // Replace the request data with the validated (and possibly transformed) data
    // This ensures that default values and type coercions are applied
    req[opts.source] = value as never;

    // Proceed to next middleware
    next();
  };
}

/**
 * Validate request body
 *
 * Convenience wrapper for validate() with source='body'.
 *
 * @param schema - Joi schema to validate against
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * router.post('/videos',
 *   validateBody(createVideoSchema),
 *   async (req, res) => {
 *     // req.body is validated
 *   }
 * );
 * ```
 */
export function validateBody(
  schema: Joi.ObjectSchema
): (req: Request, res: Response, next: NextFunction) => void {
  return validate(schema, { source: 'body' });
}

/**
 * Validate request query parameters
 *
 * Convenience wrapper for validate() with source='query'.
 *
 * @param schema - Joi schema to validate against
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * router.get('/videos',
 *   validateQuery(videoSearchSchema),
 *   async (req, res) => {
 *     // req.query is validated
 *   }
 * );
 * ```
 */
export function validateQuery(
  schema: Joi.ObjectSchema
): (req: Request, res: Response, next: NextFunction) => void {
  return validate(schema, { source: 'query' });
}

/**
 * Validate request route parameters
 *
 * Convenience wrapper for validate() with source='params'.
 *
 * @param schema - Joi schema to validate against
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * router.get('/videos/:id',
 *   validateParams(idParamSchema),
 *   async (req, res) => {
 *     // req.params is validated
 *   }
 * );
 * ```
 */
export function validateParams(
  schema: Joi.ObjectSchema
): (req: Request, res: Response, next: NextFunction) => void {
  return validate(schema, { source: 'params' });
}
