/**
 * Test Database Setup Utilities
 *
 * Provides utilities for setting up and tearing down a test database
 * for integration tests. Connects to a real database (MySQL or PostgreSQL)
 * and handles migrations and cleanup.
 */

import { DatabaseAdapter } from '../../adapters/DatabaseAdapter';
import { createDatabaseAdapter } from '../../adapters/factory';
import { DatabaseConfig } from '../../types/database';

/**
 * Test database configuration
 * Uses environment variables with fallback to defaults
 */
export const TEST_DB_CONFIG: DatabaseConfig = {
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '3306', 10),
  database: process.env.TEST_DB_NAME || 'media_player_test',
  user: process.env.TEST_DB_USER || 'root',
  password: process.env.TEST_DB_PASSWORD || 'rootpassword',
};

/**
 * Test database type (mysql or postgres)
 */
export const TEST_DB_TYPE = (process.env.TEST_DB_TYPE || 'mysql') as 'mysql' | 'postgres';

/**
 * Global test database adapter
 */
let testAdapter: DatabaseAdapter | null = null;

/**
 * Initialize test database connection and run migrations
 *
 * @returns Configured database adapter
 */
export async function setupTestDatabase(): Promise<DatabaseAdapter> {
  // Create adapter if not already created
  if (!testAdapter) {
    testAdapter = createDatabaseAdapter(TEST_DB_TYPE, TEST_DB_CONFIG);
    await testAdapter.connect(TEST_DB_CONFIG);

    // Run migrations to set up schema
    await testAdapter.runMigrations();
  }

  return testAdapter;
}

/**
 * Clean all data from test database tables
 * Preserves schema but removes all records
 */
export async function cleanTestDatabase(adapter: DatabaseAdapter): Promise<void> {
  // Disable foreign key checks temporarily
  if (TEST_DB_TYPE === 'mysql') {
    await adapter.execute('SET FOREIGN_KEY_CHECKS = 0', []);
  } else {
    // PostgreSQL doesn't need this for TRUNCATE CASCADE
  }

  // Truncate all tables in reverse dependency order
  const tables = [
    'playlist_clips',
    'playlists',
    'clips',
    'videos',
    'users',
    'migrations', // Also clean migrations to allow re-running if needed
  ];

  for (const table of tables) {
    if (TEST_DB_TYPE === 'mysql') {
      await adapter.execute(`TRUNCATE TABLE ${table}`, []);
    } else {
      await adapter.execute(`TRUNCATE TABLE ${table} CASCADE`, []);
    }
  }

  // Re-enable foreign key checks
  if (TEST_DB_TYPE === 'mysql') {
    await adapter.execute('SET FOREIGN_KEY_CHECKS = 1', []);
  }

  // Re-run migrations to ensure schema is correct
  await adapter.runMigrations();
}

/**
 * Close test database connection
 */
export async function teardownTestDatabase(): Promise<void> {
  if (testAdapter) {
    await testAdapter.disconnect();
    testAdapter = null;
  }
}

/**
 * Get the current test database adapter
 * Throws if adapter hasn't been initialized
 */
export function getTestAdapter(): DatabaseAdapter {
  if (!testAdapter) {
    throw new Error('Test database not initialized. Call setupTestDatabase() first.');
  }
  return testAdapter;
}
