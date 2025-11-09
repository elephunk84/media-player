/**
 * Express Application Setup
 *
 * Configures the Express application with middleware chain and routes.
 * This module exports the configured Express app for use by server.ts.
 */

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { DatabaseAdapter } from './adapters/DatabaseAdapter';
import { AuthService } from './services/AuthService';
import { errorHandler, notFoundHandler, requestLogger } from './middleware';
import {
  createVideosRouter,
  createClipsRouter,
  createPlaylistsRouter,
  createAuthRouter,
  createStreamRouter,
} from './routes';

/**
 * CORS configuration
 *
 * Allows requests from configured frontend origin.
 * Falls back to localhost:5173 (Vite default) if not configured.
 */
const CORS_ORIGIN = process.env.CORS_ORIGIN || process.env.VITE_API_URL || 'http://localhost:5173';

/**
 * Create and configure Express application
 *
 * Sets up middleware chain in the correct order:
 * 1. CORS (allow configured frontend origin)
 * 2. JSON body parser
 * 3. Custom request logging
 * 4. API routes
 * 5. 404 handler (for undefined routes)
 * 6. Error handler (must be last)
 *
 * @param adapter - Database adapter for data access
 * @param authService - Authentication service
 * @returns Configured Express application
 *
 * @example
 * ```typescript
 * const adapter = createDatabaseAdapter('mysql', config);
 * const authService = new AuthService(adapter);
 * const app = createApp(adapter, authService);
 * ```
 */
export function createApp(adapter: DatabaseAdapter, authService: AuthService): Express {
  const app = express();

  // ============================================
  // MIDDLEWARE CHAIN (order matters!)
  // ============================================

  // 1. CORS - Allow frontend origin
  app.use(
    cors({
      origin: CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // 2. JSON body parser
  app.use(express.json());

  // 3. Custom request logging
  app.use(requestLogger);

  // ============================================
  // HEALTH CHECK & API INFO
  // ============================================

  // Health check endpoint (no authentication required)
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    });
  });

  // API information endpoint (no authentication required)
  app.get('/api', (_req: Request, res: Response) => {
    res.json({
      name: 'Media Player API',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        auth: '/api/auth',
        videos: '/api/videos',
        clips: '/api/clips',
        playlists: '/api/playlists',
        stream: '/api/stream',
      },
    });
  });

  // ============================================
  // API ROUTES
  // ============================================

  // Authentication routes
  app.use('/api/auth', createAuthRouter(adapter, authService));

  // Video routes
  app.use('/api/videos', createVideosRouter(adapter, authService));

  // Clip routes
  app.use('/api/clips', createClipsRouter(adapter, authService));

  // Playlist routes
  app.use('/api/playlists', createPlaylistsRouter(adapter, authService));

  // Stream routes (placeholder for now)
  app.use('/api/stream', createStreamRouter(adapter, authService));

  // ============================================
  // ERROR HANDLING (must be after all routes)
  // ============================================

  // 404 handler for undefined routes
  app.use(notFoundHandler);

  // Error handler (must be last middleware)
  app.use(errorHandler);

  return app;
}
