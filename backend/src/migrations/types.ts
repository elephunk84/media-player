import { DatabaseAdapter } from '../adapters/DatabaseAdapter';

/**
 * Migration file interface
 *
 * Each migration file must export up() and down() functions
 * that perform schema changes and their reverse operations.
 */
export interface MigrationFile {
  /**
   * Apply migration changes
   * @param adapter - Database adapter instance
   */
  up(adapter: DatabaseAdapter): Promise<void>;

  /**
   * Revert migration changes
   * @param adapter - Database adapter instance
   */
  down(adapter: DatabaseAdapter): Promise<void>;
}

/**
 * Migration status enumeration
 */
export enum MigrationStatusEnum {
  PENDING = 'pending',
  APPLIED = 'applied',
  FAILED = 'failed',
}

/**
 * Migration status record
 *
 * Represents the execution status of a migration
 */
export interface MigrationStatus {
  /**
   * Migration version/filename (e.g., "001_initial_schema")
   */
  version: string;

  /**
   * Human-readable migration name
   */
  name: string;

  /**
   * Current status of the migration
   */
  status: MigrationStatusEnum;

  /**
   * When the migration was executed (null if pending)
   */
  executedAt: Date | null;

  /**
   * Error message if migration failed (null otherwise)
   */
  error?: string | null;
}

/**
 * Migration record as stored in the database
 */
export interface MigrationRecord {
  id: number;
  version: string;
  name: string;
  executed_at: Date;
}
