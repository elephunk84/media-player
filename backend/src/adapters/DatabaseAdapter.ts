import { DatabaseConfig, Migration, ExecuteResult } from '../types/database';

/**
 * DatabaseAdapter Interface
 *
 * Abstract interface defining all database operations in a database-agnostic way.
 * This interface allows for interchangeable MySQL and PostgreSQL implementations
 * without requiring changes to the business logic layer.
 *
 * Implementations must handle database-specific syntax internally (e.g., parameter
 * placeholders, auto-increment fields, JSON types) while presenting a unified API.
 *
 * @example
 * ```typescript
 * const adapter = createDatabaseAdapter('mysql', config);
 * await adapter.connect(config);
 * const users = await adapter.query<User>('SELECT * FROM users WHERE id = ?', [1]);
 * await adapter.disconnect();
 * ```
 */
export interface DatabaseAdapter {
  // ==================== Connection Management ====================

  /**
   * Establish a connection to the database
   *
   * @param config - Database configuration including host, port, credentials
   * @throws Error if connection fails or configuration is invalid
   * @example
   * ```typescript
   * await adapter.connect({
   *   host: 'localhost',
   *   port: 3306,
   *   database: 'media_player',
   *   user: 'root',
   *   password: 'password'
   * });
   * ```
   */
  connect(config: DatabaseConfig): Promise<void>;

  /**
   * Close the database connection and clean up resources
   *
   * Should gracefully close all active connections in the pool.
   * Safe to call multiple times.
   *
   * @throws Error if disconnection fails
   */
  disconnect(): Promise<void>;

  // ==================== Migration Management ====================

  /**
   * Run all pending database migrations
   *
   * Executes migrations that have not yet been applied to the database.
   * Migrations are run in order based on their version numbers.
   * Each migration is executed within a transaction.
   *
   * @throws Error if any migration fails (will rollback that migration)
   * @example
   * ```typescript
   * await adapter.runMigrations();
   * console.log('All migrations applied successfully');
   * ```
   */
  runMigrations(): Promise<void>;

  /**
   * Get the history of executed migrations
   *
   * @returns Array of migration records, ordered by execution time
   * @example
   * ```typescript
   * const history = await adapter.getMigrationHistory();
   * history.forEach(m => console.log(`${m.version}: ${m.name}`));
   * ```
   */
  getMigrationHistory(): Promise<Migration[]>;

  // ==================== Query Execution ====================

  /**
   * Execute a SELECT query and return typed results
   *
   * Use this method for queries that return data (SELECT statements).
   * Parameters should be passed as an array to prevent SQL injection.
   *
   * @template T - The type of objects to return
   * @param sql - SQL query string with parameter placeholders
   * @param params - Array of parameter values
   * @returns Array of result objects typed as T
   * @throws Error if query fails
   *
   * @example
   * ```typescript
   * interface User { id: number; name: string; }
   * const users = await adapter.query<User>(
   *   'SELECT * FROM users WHERE age > ?',
   *   [18]
   * );
   * ```
   *
   * @remarks
   * - Use '?' as placeholder for MySQL adapter
   * - PostgreSQL adapter will convert '?' to '$1, $2, ...' internally
   * - Always use parameterized queries to prevent SQL injection
   */
  query<T>(sql: string, params: unknown[]): Promise<T[]>;

  /**
   * Execute a data modification query (INSERT, UPDATE, DELETE)
   *
   * Use this method for queries that modify data but don't return rows.
   * Returns information about the operation's effects.
   *
   * @param sql - SQL query string with parameter placeholders
   * @param params - Array of parameter values
   * @returns Object containing affectedRows and optional insertId
   * @throws Error if query fails
   *
   * @example
   * ```typescript
   * const result = await adapter.execute(
   *   'INSERT INTO users (name, email) VALUES (?, ?)',
   *   ['John', 'john@example.com']
   * );
   * console.log(`Inserted user with ID: ${result.insertId}`);
   * ```
   *
   * @remarks
   * - insertId is only populated for INSERT operations
   * - affectedRows indicates how many rows were modified
   */
  execute(sql: string, params: unknown[]): Promise<ExecuteResult>;

  // ==================== Transaction Support ====================

  /**
   * Begin a new database transaction
   *
   * All subsequent queries will be part of this transaction until
   * commit() or rollback() is called.
   *
   * @throws Error if a transaction is already active or if starting fails
   * @example
   * ```typescript
   * await adapter.beginTransaction();
   * try {
   *   await adapter.execute('INSERT INTO ...', [...]);
   *   await adapter.execute('UPDATE ...', [...]);
   *   await adapter.commit();
   * } catch (error) {
   *   await adapter.rollback();
   *   throw error;
   * }
   * ```
   *
   * @remarks
   * Transactions are isolated per connection. Ensure you're not
   * interleaving operations from different logical transactions.
   */
  beginTransaction(): Promise<void>;

  /**
   * Commit the current transaction
   *
   * Persists all changes made during the transaction to the database.
   *
   * @throws Error if no transaction is active or if commit fails
   * @example
   * ```typescript
   * await adapter.commit();
   * console.log('Transaction committed successfully');
   * ```
   */
  commit(): Promise<void>;

  /**
   * Rollback the current transaction
   *
   * Discards all changes made during the transaction.
   * Safe to call even if an error occurred during the transaction.
   *
   * @throws Error if no transaction is active or if rollback fails
   * @example
   * ```typescript
   * try {
   *   await adapter.beginTransaction();
   *   await someDatabaseOperation();
   *   await adapter.commit();
   * } catch (error) {
   *   await adapter.rollback();
   *   console.error('Transaction rolled back due to error:', error);
   * }
   * ```
   */
  rollback(): Promise<void>;
}
