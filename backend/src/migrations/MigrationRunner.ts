import path from 'path';
import fs from 'fs/promises';
import { DatabaseAdapter } from '../adapters/DatabaseAdapter';
import { MigrationFile, MigrationStatus, MigrationStatusEnum, MigrationRecord } from './types';

/**
 * MigrationRunner
 *
 * Manages database schema migrations with version tracking.
 * Executes pending migrations in order and maintains migration history.
 *
 * @example
 * ```typescript
 * const runner = new MigrationRunner('./migrations');
 * await runner.runPendingMigrations(adapter);
 * const status = await runner.getMigrationStatus(adapter);
 * ```
 */
export class MigrationRunner {
  private migrationsPath: string;

  /**
   * Create a new MigrationRunner
   *
   * @param migrationsPath - Absolute path to migrations directory
   */
  constructor(migrationsPath: string) {
    this.migrationsPath = migrationsPath;
  }

  /**
   * Ensure migrations table exists in the database
   *
   * Creates the migrations tracking table if it doesn't exist yet.
   * Uses database-specific syntax (AUTO_INCREMENT vs SERIAL).
   *
   * @param adapter - Database adapter instance
   */
  private async ensureMigrationsTable(adapter: DatabaseAdapter): Promise<void> {
    const isMySQL = adapter.constructor.name === 'MySQLAdapter';

    const createTableSQL = isMySQL
      ? `CREATE TABLE IF NOT EXISTS migrations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          version VARCHAR(50) NOT NULL UNIQUE,
          name VARCHAR(255) NOT NULL,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
      : `CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          version VARCHAR(50) NOT NULL UNIQUE,
          name VARCHAR(255) NOT NULL,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;

    await adapter.execute(createTableSQL, []);
  }

  /**
   * Get list of executed migrations from database
   *
   * @param adapter - Database adapter instance
   * @returns Array of executed migration versions
   */
  private async getExecutedMigrations(adapter: DatabaseAdapter): Promise<string[]> {
    const migrations = await adapter.query<MigrationRecord>(
      'SELECT version FROM migrations ORDER BY version ASC',
      []
    );

    return migrations.map((m) => m.version);
  }

  /**
   * Scan migrations directory for migration files
   *
   * Looks for .ts and .js files matching the pattern: NNN_name.ts/js
   * Returns sorted list of migration files.
   *
   * @returns Array of migration file information
   */
  private async scanMigrationFiles(): Promise<
    Array<{ version: string; name: string; path: string }>
  > {
    let files: string[];

    try {
      files = await fs.readdir(this.migrationsPath);
    } catch (error) {
      // If migrations directory doesn't exist, return empty array
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }

    const migrationFiles = files
      .filter((file) => /^\d{3}_.*\.(ts|js)$/.test(file))
      .map((file) => {
        const version = file.replace(/\.(ts|js)$/, '');
        const name = version.replace(/^\d{3}_/, '').replace(/_/g, ' ');
        return {
          version,
          name,
          path: path.join(this.migrationsPath, file),
        };
      })
      .sort((a, b) => a.version.localeCompare(b.version));

    return migrationFiles;
  }

  /**
   * Load a migration file and return its up/down functions
   *
   * @param migrationPath - Absolute path to migration file
   * @returns MigrationFile with up() and down() functions
   * @throws Error if migration file is invalid
   */
  private loadMigrationFile(migrationPath: string): MigrationFile {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const migrationModule = require(migrationPath) as MigrationFile;

      if (typeof migrationModule.up !== 'function') {
        throw new Error(`Migration file ${migrationPath} does not export an 'up' function`);
      }

      if (typeof migrationModule.down !== 'function') {
        throw new Error(`Migration file ${migrationPath} does not export a 'down' function`);
      }

      return migrationModule;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to load migration file ${migrationPath}: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Record a migration as executed in the database
   *
   * @param adapter - Database adapter instance
   * @param version - Migration version
   * @param name - Migration name
   */
  private async recordMigration(
    adapter: DatabaseAdapter,
    version: string,
    name: string
  ): Promise<void> {
    await adapter.execute('INSERT INTO migrations (version, name) VALUES (?, ?)', [version, name]);
  }

  /**
   * Remove a migration record from the database (for rollback)
   *
   * @param adapter - Database adapter instance
   * @param version - Migration version
   */
  private async removeMigrationRecord(adapter: DatabaseAdapter, version: string): Promise<void> {
    await adapter.execute('DELETE FROM migrations WHERE version = ?', [version]);
  }

  /**
   * Run all pending migrations
   *
   * Executes migrations that haven't been applied yet, in version order.
   * Each migration runs in its own transaction for atomicity.
   *
   * @param adapter - Database adapter instance
   * @throws Error if any migration fails
   *
   * @example
   * ```typescript
   * const runner = new MigrationRunner('./migrations');
   * await runner.runPendingMigrations(adapter);
   * console.log('All migrations completed successfully');
   * ```
   */
  async runPendingMigrations(adapter: DatabaseAdapter): Promise<void> {
    // Ensure migrations table exists
    await this.ensureMigrationsTable(adapter);

    // Get list of executed migrations
    const executedMigrations = await this.getExecutedMigrations(adapter);

    // Scan for migration files
    const allMigrations = await this.scanMigrationFiles();

    // Filter to get pending migrations
    const pendingMigrations = allMigrations.filter(
      (migration) => !executedMigrations.includes(migration.version)
    );

    if (pendingMigrations.length === 0) {
      console.info('No pending migrations to run');
      return;
    }

    console.info(`Found ${pendingMigrations.length} pending migration(s)`);

    // Execute each pending migration in order
    for (const migration of pendingMigrations) {
      console.info(`Running migration: ${migration.version} - ${migration.name}`);

      try {
        // Load migration file
        const migrationFile = this.loadMigrationFile(migration.path);

        // Execute migration in transaction
        await adapter.beginTransaction();

        try {
          // Run up() function
          await migrationFile.up(adapter);

          // Record migration as executed
          await this.recordMigration(adapter, migration.version, migration.name);

          // Commit transaction
          await adapter.commit();

          console.info(`✓ Migration ${migration.version} completed successfully`);
        } catch (error) {
          // Rollback on error
          await adapter.rollback();
          throw error;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        console.error(`✗ Migration ${migration.version} failed: ${errorMessage}`);

        throw new Error(
          `Migration ${migration.version} failed: ${errorMessage}\n` +
            'All changes have been rolled back. Please fix the migration and try again.'
        );
      }
    }

    console.info(`Successfully applied ${pendingMigrations.length} migration(s)`);
  }

  /**
   * Get status of all migrations
   *
   * Returns information about all migration files and their execution status.
   *
   * @param adapter - Database adapter instance
   * @returns Array of migration status records
   *
   * @example
   * ```typescript
   * const runner = new MigrationRunner('./migrations');
   * const status = await runner.getMigrationStatus(adapter);
   * status.forEach(m => {
   *   console.log(`${m.version}: ${m.status} ${m.executedAt || ''}`);
   * });
   * ```
   */
  async getMigrationStatus(adapter: DatabaseAdapter): Promise<MigrationStatus[]> {
    // Ensure migrations table exists
    await this.ensureMigrationsTable(adapter);

    // Get executed migrations from database
    const executedMigrations = await adapter.query<MigrationRecord>(
      'SELECT version, name, executed_at FROM migrations ORDER BY version ASC',
      []
    );

    // Create map for quick lookup
    const executedMap = new Map<string, MigrationRecord>();
    executedMigrations.forEach((m) => {
      executedMap.set(m.version, m);
    });

    // Scan for migration files
    const allMigrations = await this.scanMigrationFiles();

    // Build status array
    const statuses: MigrationStatus[] = allMigrations.map((migration) => {
      const executed = executedMap.get(migration.version);

      if (executed) {
        return {
          version: migration.version,
          name: migration.name,
          status: MigrationStatusEnum.APPLIED,
          executedAt: executed.executed_at,
        };
      } else {
        return {
          version: migration.version,
          name: migration.name,
          status: MigrationStatusEnum.PENDING,
          executedAt: null,
        };
      }
    });

    return statuses;
  }

  /**
   * Rollback the most recent migration
   *
   * Executes the down() function of the last applied migration
   * and removes it from the migration history.
   *
   * @param adapter - Database adapter instance
   * @throws Error if no migrations to rollback or rollback fails
   *
   * @example
   * ```typescript
   * const runner = new MigrationRunner('./migrations');
   * await runner.rollbackLastMigration(adapter);
   * console.log('Last migration rolled back');
   * ```
   */
  async rollbackLastMigration(adapter: DatabaseAdapter): Promise<void> {
    // Ensure migrations table exists
    await this.ensureMigrationsTable(adapter);

    // Get list of executed migrations
    const executedMigrations = await adapter.query<MigrationRecord>(
      'SELECT version, name FROM migrations ORDER BY version DESC LIMIT 1',
      []
    );

    if (executedMigrations.length === 0) {
      throw new Error('No migrations to rollback');
    }

    const lastMigration = executedMigrations[0];

    console.info(`Rolling back migration: ${lastMigration.version} - ${lastMigration.name}`);

    // Scan for migration files to find the matching file
    const allMigrations = await this.scanMigrationFiles();
    const migrationToRollback = allMigrations.find((m) => m.version === lastMigration.version);

    if (!migrationToRollback) {
      throw new Error(
        `Migration file for ${lastMigration.version} not found. ` +
          'Cannot rollback without migration file.'
      );
    }

    try {
      // Load migration file
      const migrationFile = this.loadMigrationFile(migrationToRollback.path);

      // Execute rollback in transaction
      await adapter.beginTransaction();

      try {
        // Run down() function
        await migrationFile.down(adapter);

        // Remove migration record
        await this.removeMigrationRecord(adapter, lastMigration.version);

        // Commit transaction
        await adapter.commit();

        console.info(`✓ Migration ${lastMigration.version} rolled back successfully`);
      } catch (error) {
        // Rollback on error
        await adapter.rollback();
        throw error;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      console.error(`✗ Rollback of ${lastMigration.version} failed: ${errorMessage}`);

      throw new Error(
        `Rollback of ${lastMigration.version} failed: ${errorMessage}\n` +
          'All changes have been rolled back.'
      );
    }
  }
}
