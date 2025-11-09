/**
 * Server Entry Point
 *
 * Initializes database, runs migrations, and starts the Express server.
 * Handles graceful shutdown to properly close database connections.
 */

import dotenv from 'dotenv';
import path from 'path';
import { Server } from 'http';
import { createApp } from './app';
import { loadFullDatabaseConfig } from './config/database';
import { createDatabaseAdapter } from './adapters';
import { AuthService } from './services/AuthService';
import { MigrationRunner } from './migrations';

// Load environment variables
dotenv.config();

/**
 * Server configuration
 */
const PORT = parseInt(process.env.PORT || '3000', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Global database adapter and server instances for graceful shutdown
 */
let dbAdapter: ReturnType<typeof createDatabaseAdapter> | null = null;
let httpServer: Server | null = null;

/**
 * Start the application server
 *
 * 1. Load database configuration from environment variables
 * 2. Create and connect database adapter
 * 3. Run pending migrations
 * 4. Create Express app with routes
 * 5. Start HTTP server
 *
 * @throws Error if startup fails at any step
 */
async function startServer(): Promise<void> {
  try {
    console.info('='.repeat(60));
    console.info('Starting Media Player API Server');
    console.info('='.repeat(60));
    console.info(`Environment: ${NODE_ENV}`);
    console.info(`Port: ${PORT}`);
    console.info('');

    // ============================================
    // 1. Load database configuration
    // ============================================
    console.info('Loading database configuration...');
    const { type: dbType, config: dbConfig } = loadFullDatabaseConfig();
    console.info(`Database type: ${dbType}`);
    console.info(`Database host: ${dbConfig.host}:${dbConfig.port}`);
    console.info(`Database name: ${dbConfig.database}`);
    console.info('');

    // ============================================
    // 2. Create and connect database adapter
    // ============================================
    console.info('Connecting to database...');
    dbAdapter = createDatabaseAdapter(dbType);
    await dbAdapter.connect(dbConfig);
    console.info('✓ Database connection established');
    console.info('');

    // ============================================
    // 3. Run database migrations
    // ============================================
    console.info('Running database migrations...');
    const migrationsPath = path.join(__dirname, 'migrations');
    const migrationRunner = new MigrationRunner(migrationsPath);
    await migrationRunner.runPendingMigrations(dbAdapter);
    console.info('✓ Database migrations completed');
    console.info('');

    // ============================================
    // 4. Create services and Express app
    // ============================================
    console.info('Initializing services and application...');

    // Load JWT secret from environment
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret.trim() === '') {
      throw new Error(
        'JWT_SECRET environment variable is required.\n' +
          'Please set JWT_SECRET in your .env file or environment.'
      );
    }

    const authService = new AuthService(dbAdapter, { jwtSecret });
    const app = createApp(dbAdapter, authService);
    console.info('✓ Application initialized');
    console.info('');

    // ============================================
    // 5. Start HTTP server
    // ============================================
    console.info('Starting HTTP server...');
    httpServer = app.listen(PORT, () => {
      console.info('='.repeat(60));
      console.info('✓ Server is running');
      console.info('='.repeat(60));
      console.info(`URL: http://localhost:${PORT}`);
      console.info(`Health check: http://localhost:${PORT}/health`);
      console.info(`API info: http://localhost:${PORT}/api`);
      console.info('='.repeat(60));
      console.info('');
      console.info('Press Ctrl+C to stop the server');
      console.info('');
    });
  } catch (error) {
    // ============================================
    // Handle startup errors
    // ============================================
    console.error('');
    console.error('='.repeat(60));
    console.error('✗ Failed to start server');
    console.error('='.repeat(60));

    if (error instanceof Error) {
      console.error('Error:', error.message);
      if (error.stack && NODE_ENV === 'development') {
        console.error('');
        console.error('Stack trace:');
        console.error(error.stack);
      }
    } else {
      console.error('Unknown error:', error);
    }

    console.error('='.repeat(60));
    console.error('');

    // Clean up resources before exiting
    await cleanup();

    // Exit with error code
    process.exit(1);
  }
}

/**
 * Gracefully shutdown the server
 *
 * 1. Close HTTP server (stop accepting new connections)
 * 2. Close database connections
 * 3. Exit process
 *
 * @param signal - Signal that triggered shutdown (SIGTERM, SIGINT, etc.)
 */
async function gracefulShutdown(signal: string): Promise<void> {
  console.info('');
  console.info('='.repeat(60));
  console.info(`${signal} signal received: starting graceful shutdown...`);
  console.info('='.repeat(60));

  await cleanup();

  console.info('='.repeat(60));
  console.info('✓ Graceful shutdown completed');
  console.info('='.repeat(60));
  console.info('');

  // Exit successfully
  process.exit(0);
}

/**
 * Clean up resources (HTTP server and database connections)
 */
async function cleanup(): Promise<void> {
  // Close HTTP server
  if (httpServer) {
    console.info('Closing HTTP server...');
    await new Promise<void>((resolve) => {
      httpServer!.close(() => {
        console.info('✓ HTTP server closed');
        resolve();
      });
    });
  }

  // Close database connection
  if (dbAdapter) {
    console.info('Closing database connection...');
    try {
      await dbAdapter.disconnect();
      console.info('✓ Database connection closed');
    } catch (error) {
      console.error('Error closing database connection:', error);
    }
  }
}

/**
 * Handle uncaught exceptions
 */
process.on('uncaughtException', (error: Error) => {
  console.error('');
  console.error('='.repeat(60));
  console.error('UNCAUGHT EXCEPTION');
  console.error('='.repeat(60));
  console.error('Error:', error.message);
  if (error.stack) {
    console.error('');
    console.error('Stack trace:');
    console.error(error.stack);
  }
  console.error('='.repeat(60));
  console.error('');

  // Perform cleanup and exit
  void cleanup().then(() => {
    process.exit(1);
  });
});

/**
 * Handle unhandled promise rejections
 */
process.on('unhandledRejection', (reason: unknown) => {
  console.error('');
  console.error('='.repeat(60));
  console.error('UNHANDLED PROMISE REJECTION');
  console.error('='.repeat(60));
  if (reason instanceof Error) {
    console.error('Error:', reason.message);
    if (reason.stack) {
      console.error('');
      console.error('Stack trace:');
      console.error(reason.stack);
    }
  } else {
    console.error('Reason:', reason);
  }
  console.error('='.repeat(60));
  console.error('');

  // Perform cleanup and exit
  void cleanup().then(() => {
    process.exit(1);
  });
});

/**
 * Handle SIGTERM (graceful shutdown requested)
 */
process.on('SIGTERM', () => {
  void gracefulShutdown('SIGTERM');
});

/**
 * Handle SIGINT (Ctrl+C pressed)
 */
process.on('SIGINT', () => {
  void gracefulShutdown('SIGINT');
});

// ============================================
// Start the server
// ============================================
void startServer();
