/**
 * Logging Middleware
 *
 * Custom logging middleware for HTTP requests.
 * Logs request details and response times.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Request logging middleware
 *
 * Logs incoming HTTP requests with method, path, and response time.
 * Uses console.info for visibility.
 *
 * @example
 * ```typescript
 * app.use(requestLogger);
 * ```
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // Log request details
  console.info(`[${new Date().toISOString()}] ${req.method} ${req.path}`);

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const statusEmoji = statusCode < 400 ? '✓' : '✗';

    console.info(
      `[${new Date().toISOString()}] ${statusEmoji} ${req.method} ${req.path} ${statusCode} - ${duration}ms`
    );
  });

  next();
}
