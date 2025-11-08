import dotenv from 'dotenv';
import { DatabaseConfig } from '../types/database';

// Load environment variables from .env file
dotenv.config();

/**
 * Database type enumeration
 */
export type DatabaseType = 'mysql' | 'postgresql';

/**
 * Load and validate database configuration from environment variables
 *
 * Reads the following environment variables:
 * - DB_TYPE: Database type ('mysql' or 'postgresql')
 * - DB_HOST: Database host address
 * - DB_PORT: Database port number
 * - DB_NAME: Database name
 * - DB_USER: Database user
 * - DB_PASSWORD: Database password
 * - DB_POOL_SIZE: (optional) Connection pool size
 * - DB_CONNECTION_TIMEOUT: (optional) Connection timeout in milliseconds
 *
 * @returns DatabaseConfig object with validated configuration
 * @throws Error if required environment variables are missing or invalid
 *
 * @example
 * ```typescript
 * const config = loadDatabaseConfig();
 * console.log(`Connecting to ${config.database} on ${config.host}:${config.port}`);
 * ```
 */
export function loadDatabaseConfig(): DatabaseConfig {
  const errors: string[] = [];

  // Required environment variables
  const dbHost = process.env.DB_HOST;
  const dbPort = process.env.DB_PORT;
  const dbName = process.env.DB_NAME;
  const dbUser = process.env.DB_USER;
  const dbPassword = process.env.DB_PASSWORD;

  // Validate required fields
  if (!dbHost) {
    errors.push('DB_HOST is required');
  }
  if (!dbPort) {
    errors.push('DB_PORT is required');
  }
  if (!dbName) {
    errors.push('DB_NAME is required');
  }
  if (!dbUser) {
    errors.push('DB_USER is required');
  }
  if (!dbPassword) {
    errors.push('DB_PASSWORD is required');
  }

  // Throw error with all missing fields if any validation failed
  if (errors.length > 0) {
    throw new Error(
      `Database configuration validation failed:\n${errors.map((e) => `  - ${e}`).join('\n')}\n\n` +
        'Please ensure all required environment variables are set in your .env file or environment.'
    );
  }

  // Parse port number
  const port = parseInt(dbPort!, 10);
  if (isNaN(port) || port <= 0 || port > 65535) {
    throw new Error(
      `Invalid DB_PORT value: "${dbPort}". Must be a valid port number between 1 and 65535.`
    );
  }

  // Optional configuration
  const poolSize = process.env.DB_POOL_SIZE ? parseInt(process.env.DB_POOL_SIZE, 10) : undefined;
  const connectionTimeout = process.env.DB_CONNECTION_TIMEOUT
    ? parseInt(process.env.DB_CONNECTION_TIMEOUT, 10)
    : undefined;

  // Validate optional numeric fields
  if (poolSize !== undefined && (isNaN(poolSize) || poolSize <= 0)) {
    throw new Error(
      `Invalid DB_POOL_SIZE value: "${process.env.DB_POOL_SIZE}". Must be a positive number.`
    );
  }

  if (connectionTimeout !== undefined && (isNaN(connectionTimeout) || connectionTimeout <= 0)) {
    throw new Error(
      `Invalid DB_CONNECTION_TIMEOUT value: "${process.env.DB_CONNECTION_TIMEOUT}". Must be a positive number.`
    );
  }

  return {
    host: dbHost!,
    port,
    database: dbName!,
    user: dbUser!,
    password: dbPassword!,
    poolSize,
    connectionTimeout,
  };
}

/**
 * Get the database type from environment variables
 *
 * @returns Database type ('mysql' or 'postgresql')
 * @throws Error if DB_TYPE is not set or invalid
 *
 * @example
 * ```typescript
 * const dbType = getDatabaseType();
 * console.log(`Using database: ${dbType}`);
 * ```
 */
export function getDatabaseType(): DatabaseType {
  const dbType = process.env.DB_TYPE;

  if (!dbType) {
    throw new Error(
      'DB_TYPE environment variable is required.\n' +
        'Please set DB_TYPE to either "mysql" or "postgresql" in your .env file or environment.'
    );
  }

  const normalizedType = dbType.toLowerCase().trim();

  if (normalizedType !== 'mysql' && normalizedType !== 'postgresql') {
    throw new Error(
      `Invalid DB_TYPE value: "${dbType}".\n` +
        'DB_TYPE must be either "mysql" or "postgresql".\n' +
        `Current value: "${dbType}" (normalized: "${normalizedType}")`
    );
  }

  return normalizedType as DatabaseType;
}

/**
 * Load complete database configuration including type
 *
 * This is a convenience function that combines getDatabaseType() and loadDatabaseConfig()
 *
 * @returns Object containing database type and configuration
 * @throws Error if environment variables are missing or invalid
 *
 * @example
 * ```typescript
 * const { type, config } = loadFullDatabaseConfig();
 * const adapter = createDatabaseAdapter(type, config);
 * await adapter.connect(config);
 * ```
 */
export function loadFullDatabaseConfig(): { type: DatabaseType; config: DatabaseConfig } {
  return {
    type: getDatabaseType(),
    config: loadDatabaseConfig(),
  };
}
