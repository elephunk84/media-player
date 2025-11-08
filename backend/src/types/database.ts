/**
 * Database configuration options
 * Used to configure database connection for both MySQL and PostgreSQL
 */
export interface DatabaseConfig {
  /** Database host address */
  host: string;

  /** Database port number (3306 for MySQL, 5432 for PostgreSQL) */
  port: number;

  /** Database name */
  database: string;

  /** Database user */
  user: string;

  /** Database password */
  password: string;

  /** Optional connection pool size */
  poolSize?: number;

  /** Optional connection timeout in milliseconds */
  connectionTimeout?: number;
}

/**
 * Migration record representing a database migration
 */
export interface Migration {
  /** Migration ID (auto-incremented) */
  id: number;

  /** Migration version identifier (e.g., "001", "002") */
  version: string;

  /** Human-readable migration name */
  name: string;

  /** Timestamp when migration was executed */
  executedAt: Date;
}

/**
 * Result of a query execution that modifies data
 * Returned by INSERT, UPDATE, DELETE operations
 */
export interface ExecuteResult {
  /** Number of rows affected by the operation */
  affectedRows: number;

  /** ID of the last inserted row (if applicable) */
  insertId?: number;
}

/**
 * Status of a migration
 * Used to track which migrations have been applied
 */
export interface MigrationStatus {
  /** Migration version identifier */
  version: string;

  /** Migration name */
  name: string;

  /** Whether the migration has been applied */
  applied: boolean;

  /** When the migration was applied (if applied) */
  appliedAt?: Date;
}
