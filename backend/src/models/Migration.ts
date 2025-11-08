/**
 * Migration Model
 *
 * Represents a database schema migration record.
 */

/**
 * Migration record tracking executed database migrations
 *
 * Matches the migrations table schema in the database.
 */
export interface Migration {
  /**
   * Unique migration identifier (auto-generated)
   */
  readonly id: number;

  /**
   * Migration version/filename (e.g., "001_initial_schema")
   * Must be unique
   */
  version: string;

  /**
   * Human-readable migration name
   */
  name: string;

  /**
   * Timestamp when the migration was executed
   */
  readonly executedAt: Date;
}

/**
 * Migration database row (matches database column names with snake_case)
 */
export interface MigrationRow {
  id: number;
  version: string;
  name: string;
  executed_at: Date;
}
