import { Pool, PoolClient } from 'pg';
import { DatabaseAdapter } from './DatabaseAdapter';
import { DatabaseConfig, Migration, ExecuteResult } from '../types/database';

/**
 * PostgreSQL implementation of the DatabaseAdapter interface
 *
 * This adapter uses the pg (node-postgres) driver with connection pooling for
 * optimal performance. It handles PostgreSQL-specific syntax internally while
 * presenting a database-agnostic interface to the application.
 *
 * Key PostgreSQL features:
 * - Numbered placeholders ($1, $2, $3) instead of ?
 * - SERIAL for auto-increment instead of AUTO_INCREMENT
 * - RETURNING clause for getting insertId
 * - JSONB for better JSON performance
 *
 * @example
 * ```typescript
 * const adapter = new PostgreSQLAdapter();
 * await adapter.connect({
 *   host: 'localhost',
 *   port: 5432,
 *   database: 'media_player',
 *   user: 'postgres',
 *   password: 'password'
 * });
 * ```
 */
export class PostgreSQLAdapter implements DatabaseAdapter {
  private pool: Pool | null = null;
  private transactionClient: PoolClient | null = null;

  /**
   * Establish a connection pool to the PostgreSQL database
   *
   * Creates a connection pool with configurable size for better performance.
   * The pool will maintain multiple connections and reuse them efficiently.
   *
   * @param config - Database configuration
   * @throws Error if connection fails or configuration is invalid
   */
  async connect(config: DatabaseConfig): Promise<void> {
    try {
      this.pool = new Pool({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
        password: config.password,
        max: config.poolSize || 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: config.connectionTimeout || 10000,
      });

      // Test the connection
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();

      console.info('PostgreSQL connection pool established successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to connect to PostgreSQL database: ${message}`);
    }
  }

  /**
   * Close the connection pool and clean up resources
   *
   * Gracefully closes all connections in the pool.
   * Safe to call multiple times.
   */
  async disconnect(): Promise<void> {
    if (!this.pool) {
      return;
    }

    try {
      // If there's an active transaction, roll it back
      if (this.transactionClient) {
        await this.rollback();
      }

      await this.pool.end();
      this.pool = null;
      console.info('PostgreSQL connection pool closed successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to disconnect from PostgreSQL database: ${message}`);
    }
  }

  /**
   * Run all pending database migrations
   *
   * Creates the migrations table if it doesn't exist, then executes
   * all migrations that haven't been applied yet.
   */
  async runMigrations(): Promise<void> {
    this.ensureConnected();

    try {
      // Create migrations table if it doesn't exist (PostgreSQL syntax)
      await this.execute(
        `CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          version VARCHAR(50) NOT NULL UNIQUE,
          name VARCHAR(255) NOT NULL,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        []
      );

      console.info('Migration table ready');
      // Note: Actual migration files will be loaded and executed by MigrationRunner
      // This method ensures the migrations table exists and is ready
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to run migrations: ${message}`);
    }
  }

  /**
   * Get the history of executed migrations
   *
   * @returns Array of migration records, ordered by execution time
   */
  async getMigrationHistory(): Promise<Migration[]> {
    this.ensureConnected();

    try {
      const migrations = await this.query<{
        id: number;
        version: string;
        name: string;
        executed_at: Date;
      }>('SELECT id, version, name, executed_at FROM migrations ORDER BY executed_at ASC', []);

      return migrations.map((m) => ({
        id: m.id,
        version: m.version,
        name: m.name,
        executedAt: m.executed_at,
      }));
    } catch (error) {
      // If migrations table doesn't exist yet, return empty array
      if (error instanceof Error && error.message.includes('does not exist')) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Execute a SELECT query and return typed results
   *
   * Automatically translates ? placeholders to PostgreSQL's $1, $2, $3 format.
   *
   * @template T - The type of objects to return
   * @param sql - SQL query string with ? placeholders
   * @param params - Array of parameter values
   * @returns Array of result objects typed as T
   */
  async query<T>(sql: string, params: unknown[]): Promise<T[]> {
    this.ensureConnected();

    try {
      // Convert ? placeholders to $1, $2, $3... for PostgreSQL
      const pgSql = this.convertPlaceholders(sql);

      const client = this.transactionClient || this.pool!;
      const result = await client.query(pgSql, params);

      return result.rows as T[];
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Query execution failed: ${message}\nSQL: ${sql}`);
    }
  }

  /**
   * Execute a data modification query (INSERT, UPDATE, DELETE)
   *
   * Automatically translates ? placeholders to PostgreSQL's $1, $2, $3 format.
   * For INSERT operations, automatically adds RETURNING id if not present.
   *
   * @param sql - SQL query string with ? placeholders
   * @param params - Array of parameter values
   * @returns Object containing affectedRows and optional insertId
   */
  async execute(sql: string, params: unknown[]): Promise<ExecuteResult> {
    this.ensureConnected();

    try {
      // Convert ? placeholders to $1, $2, $3... for PostgreSQL
      let pgSql = this.convertPlaceholders(sql);

      // For INSERT queries, add RETURNING id if not already present
      const isInsert = /^\s*INSERT\s+INTO/i.test(pgSql);
      const hasReturning = /RETURNING/i.test(pgSql);

      if (isInsert && !hasReturning) {
        pgSql = `${pgSql} RETURNING id`;
      }

      const client = this.transactionClient || this.pool!;
      const result = await client.query(pgSql, params);

      // Extract insertId from RETURNING clause if available
      let insertId: number | undefined;
      if (isInsert && result.rows.length > 0) {
        const firstRow = result.rows[0] as Record<string, unknown>;
        if ('id' in firstRow && typeof firstRow.id === 'number') {
          insertId = firstRow.id;
        }
      }

      return {
        affectedRows: result.rowCount || 0,
        insertId,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Execute failed: ${message}\nSQL: ${sql}`);
    }
  }

  /**
   * Begin a new database transaction
   *
   * Gets a dedicated connection from the pool and starts a transaction.
   *
   * @throws Error if a transaction is already active
   */
  async beginTransaction(): Promise<void> {
    this.ensureConnected();

    if (this.transactionClient) {
      throw new Error('Transaction already in progress');
    }

    try {
      this.transactionClient = await this.pool!.connect();
      await this.transactionClient.query('BEGIN');
      console.info('Transaction started');
    } catch (error) {
      // Clean up on error
      if (this.transactionClient) {
        this.transactionClient.release();
        this.transactionClient = null;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to begin transaction: ${message}`);
    }
  }

  /**
   * Commit the current transaction
   *
   * Persists all changes and releases the transaction connection.
   *
   * @throws Error if no transaction is active
   */
  async commit(): Promise<void> {
    if (!this.transactionClient) {
      throw new Error('No transaction in progress');
    }

    try {
      await this.transactionClient.query('COMMIT');
      console.info('Transaction committed');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to commit transaction: ${message}`);
    } finally {
      this.transactionClient.release();
      this.transactionClient = null;
    }
  }

  /**
   * Rollback the current transaction
   *
   * Discards all changes and releases the transaction connection.
   * Safe to call even if transaction failed.
   *
   * @throws Error if no transaction is active
   */
  async rollback(): Promise<void> {
    if (!this.transactionClient) {
      throw new Error('No transaction in progress');
    }

    try {
      await this.transactionClient.query('ROLLBACK');
      console.info('Transaction rolled back');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to rollback transaction: ${message}`);
      // Don't throw on rollback failure, just log it
    } finally {
      this.transactionClient.release();
      this.transactionClient = null;
    }
  }

  /**
   * Convert MySQL-style ? placeholders to PostgreSQL's numbered placeholders
   *
   * Converts: "SELECT * FROM users WHERE id = ? AND name = ?"
   * To: "SELECT * FROM users WHERE id = $1 AND name = $2"
   *
   * @param sql - SQL string with ? placeholders
   * @returns SQL string with $1, $2, $3... placeholders
   * @private
   */
  private convertPlaceholders(sql: string): string {
    let index = 1;
    return sql.replace(/\?/g, () => `$${index++}`);
  }

  /**
   * Ensure that a connection pool exists
   *
   * @throws Error if not connected
   * @private
   */
  private ensureConnected(): void {
    if (!this.pool) {
      throw new Error('Not connected to database. Call connect() first.');
    }
  }
}
