import mysql from 'mysql2/promise';
import { DatabaseAdapter } from './DatabaseAdapter';
import { DatabaseConfig, Migration, ExecuteResult } from '../types/database';

/**
 * MySQL implementation of the DatabaseAdapter interface
 *
 * This adapter uses mysql2/promise driver with connection pooling for
 * optimal performance. It handles MySQL-specific syntax internally while
 * presenting a database-agnostic interface to the application.
 *
 * @example
 * ```typescript
 * const adapter = new MySQLAdapter();
 * await adapter.connect({
 *   host: 'localhost',
 *   port: 3306,
 *   database: 'media_player',
 *   user: 'root',
 *   password: 'password'
 * });
 * ```
 */
export class MySQLAdapter implements DatabaseAdapter {
  private pool: mysql.Pool | null = null;
  private transactionConnection: mysql.PoolConnection | null = null;

  /**
   * Establish a connection pool to the MySQL database
   *
   * Creates a connection pool with configurable size for better performance.
   * The pool will maintain multiple connections and reuse them efficiently.
   *
   * @param config - Database configuration
   * @throws Error if connection fails or configuration is invalid
   */
  async connect(config: DatabaseConfig): Promise<void> {
    try {
      this.pool = mysql.createPool({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
        password: config.password,
        waitForConnections: true,
        connectionLimit: config.poolSize || 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
        connectTimeout: config.connectionTimeout || 10000,
      });

      // Test the connection
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();

      console.info('MySQL connection pool established successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to connect to MySQL database: ${message}`);
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
      if (this.transactionConnection) {
        await this.rollback();
      }

      await this.pool.end();
      this.pool = null;
      console.info('MySQL connection pool closed successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to disconnect from MySQL database: ${message}`);
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
      // Create migrations table if it doesn't exist
      await this.execute(
        `CREATE TABLE IF NOT EXISTS migrations (
          id INT AUTO_INCREMENT PRIMARY KEY,
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
      if (error instanceof Error && error.message.includes("doesn't exist")) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Execute a SELECT query and return typed results
   *
   * @template T - The type of objects to return
   * @param sql - SQL query string with ? placeholders
   * @param params - Array of parameter values
   * @returns Array of result objects typed as T
   */
  async query<T>(sql: string, params: unknown[]): Promise<T[]> {
    this.ensureConnected();

    try {
      const connection = this.transactionConnection || this.pool!;
      const [rows] = await connection.execute(sql, params);

      // mysql2 returns rows as an array
      return rows as T[];
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Query execution failed: ${message}\nSQL: ${sql}`);
    }
  }

  /**
   * Execute a data modification query (INSERT, UPDATE, DELETE)
   *
   * @param sql - SQL query string with ? placeholders
   * @param params - Array of parameter values
   * @returns Object containing affectedRows and optional insertId
   */
  async execute(sql: string, params: unknown[]): Promise<ExecuteResult> {
    this.ensureConnected();

    try {
      const connection = this.transactionConnection || this.pool!;
      const [result] = await connection.execute(sql, params);

      // mysql2 returns a ResultSetHeader for modification queries
      const resultHeader = result as mysql.ResultSetHeader;

      return {
        affectedRows: resultHeader.affectedRows,
        insertId: resultHeader.insertId !== 0 ? resultHeader.insertId : undefined,
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

    if (this.transactionConnection) {
      throw new Error('Transaction already in progress');
    }

    try {
      this.transactionConnection = await this.pool!.getConnection();
      await this.transactionConnection.beginTransaction();
      console.info('Transaction started');
    } catch (error) {
      // Clean up on error
      if (this.transactionConnection) {
        this.transactionConnection.release();
        this.transactionConnection = null;
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
    if (!this.transactionConnection) {
      throw new Error('No transaction in progress');
    }

    try {
      await this.transactionConnection.commit();
      console.info('Transaction committed');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to commit transaction: ${message}`);
    } finally {
      this.transactionConnection.release();
      this.transactionConnection = null;
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
    if (!this.transactionConnection) {
      throw new Error('No transaction in progress');
    }

    try {
      await this.transactionConnection.rollback();
      console.info('Transaction rolled back');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to rollback transaction: ${message}`);
      // Don't throw on rollback failure, just log it
    } finally {
      this.transactionConnection.release();
      this.transactionConnection = null;
    }
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
