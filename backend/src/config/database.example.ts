/**
 * Example usage of database configuration and factory
 *
 * This file demonstrates how to use the configuration loader and factory
 * pattern to create and configure database adapters.
 */

import { createDatabaseAdapter, getSupportedDatabaseTypes } from '../adapters';
import { loadDatabaseConfig, getDatabaseType, loadFullDatabaseConfig } from './database';

/**
 * Example 1: Basic usage with factory pattern
 */
async function basicFactoryUsage(): Promise<void> {
  try {
    // Load configuration from environment variables
    const dbType = getDatabaseType();
    const config = loadDatabaseConfig();

    console.info(`Database type: ${dbType}`);
    console.info(`Connecting to: ${config.host}:${config.port}/${config.database}`);

    // Create appropriate adapter based on DB_TYPE
    const adapter = createDatabaseAdapter(dbType);

    // Connect and use the adapter
    await adapter.connect(config);
    console.info('Connected successfully!');

    // Use the adapter (works the same regardless of MySQL or PostgreSQL)
    const result = await adapter.query('SELECT 1 as test', []);
    console.info('Test query result:', result);

    // Disconnect
    await adapter.disconnect();
  } catch (error) {
    console.error('Database operation failed:', error);
    throw error;
  }
}

/**
 * Example 2: Simplified usage with loadFullDatabaseConfig
 */
async function simplifiedUsage(): Promise<void> {
  try {
    // Load type and config in one call
    const { type, config } = loadFullDatabaseConfig();

    // Create adapter
    const adapter = createDatabaseAdapter(type);
    await adapter.connect(config);

    console.info(`Connected to ${type} database successfully`);

    // Run migrations
    await adapter.runMigrations();

    // Check migration history
    const migrations = await adapter.getMigrationHistory();
    console.info(`Applied ${migrations.length} migrations`);

    await adapter.disconnect();
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Example 3: Error handling and validation
 */
function errorHandlingExample(): void {
  try {
    // This will throw clear error messages if env vars are missing
    const config = loadDatabaseConfig();
    console.info('Configuration loaded successfully:', config);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Configuration error:');
      console.error(error.message);
      // Example output:
      // Database configuration validation failed:
      //   - DB_HOST is required
      //   - DB_PORT is required
      //   - DB_NAME is required
    }
  }

  try {
    // This will throw if DB_TYPE is invalid
    const dbType = getDatabaseType();
    console.info(`Using database type: ${dbType}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Database type error:');
      console.error(error.message);
      // Example output:
      // DB_TYPE environment variable is required.
      // Please set DB_TYPE to either "mysql" or "postgresql"
    }
  }
}

/**
 * Example 4: Database type switching
 */
async function databaseSwitchingExample(): Promise<void> {
  // Show supported database types
  const supportedTypes = getSupportedDatabaseTypes();
  console.info('Supported databases:', supportedTypes.join(', '));

  // Load config (DB_TYPE from environment)
  const { type, config } = loadFullDatabaseConfig();

  console.info(`Current database: ${type}`);

  // Create adapter - automatically uses correct implementation
  const adapter = createDatabaseAdapter(type);

  await adapter.connect(config);

  // The same code works for both MySQL and PostgreSQL
  // The adapter handles database-specific details internally
  const users = await adapter.query(
    'SELECT * FROM users WHERE active = ?', // Works for both!
    [true]
  );

  console.info(`Found ${users.length} active users`);

  await adapter.disconnect();
}

/**
 * Example 5: Using in application initialization
 */
async function applicationInitialization(): Promise<void> {
  console.info('Initializing application...');

  try {
    // Step 1: Load configuration with validation
    const { type, config } = loadFullDatabaseConfig();
    console.info(`Database: ${type} (${config.host}:${config.port}/${config.database})`);

    // Step 2: Create adapter using factory
    const adapter = createDatabaseAdapter(type);

    // Step 3: Connect to database
    await adapter.connect(config);
    console.info('✓ Database connected');

    // Step 4: Run migrations
    await adapter.runMigrations();
    console.info('✓ Migrations completed');

    // Step 5: Verify connection
    await adapter.query('SELECT 1', []);
    console.info('✓ Database connection verified');

    // Application is ready!
    console.info('Application initialized successfully');

    // Clean up for example
    await adapter.disconnect();
  } catch (error) {
    console.error('Failed to initialize application:');
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  }
}

/**
 * Example 6: Environment-specific configuration
 */
function environmentSpecificExample(): void {
  // Development environment
  if (process.env.NODE_ENV === 'development') {
    console.info('Development mode:');
    // Typically uses MySQL for local development
    // DB_TYPE=mysql in .env.development
  }

  // Production environment
  if (process.env.NODE_ENV === 'production') {
    console.info('Production mode:');
    // Might use PostgreSQL for production
    // DB_TYPE=postgresql in .env.production
  }

  // Test environment
  if (process.env.NODE_ENV === 'test') {
    console.info('Test mode:');
    // Could use either database for testing
    // DB_TYPE=postgresql in .env.test
  }

  // The factory pattern allows switching databases without code changes
  const { type } = loadFullDatabaseConfig();
  console.info(`Using ${type} database for ${process.env.NODE_ENV} environment`);
}

// Export examples for documentation
export {
  basicFactoryUsage,
  simplifiedUsage,
  errorHandlingExample,
  databaseSwitchingExample,
  applicationInitialization,
  environmentSpecificExample,
};
