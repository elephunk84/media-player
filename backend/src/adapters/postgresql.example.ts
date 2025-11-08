/**
 * Example usage of PostgreSQLAdapter
 *
 * This file demonstrates how to use the PostgreSQLAdapter implementation
 * and highlights PostgreSQL-specific features.
 */

import { PostgreSQLAdapter } from './PostgreSQLAdapter';
import { DatabaseConfig } from '../types/database';

/**
 * Example: Basic PostgreSQL operations
 */
async function basicPostgreSQLExample(): Promise<void> {
  const adapter = new PostgreSQLAdapter();

  const config: DatabaseConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'media_player',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    poolSize: 10,
    connectionTimeout: 10000,
  };

  try {
    // Connect to PostgreSQL
    await adapter.connect(config);
    console.info('Connected to PostgreSQL');

    // Run migrations (creates table with SERIAL primary key)
    await adapter.runMigrations();

    // Check migration history
    const migrations = await adapter.getMigrationHistory();
    console.info(`Migration history: ${migrations.length} migrations applied`);

    // Example: Insert with automatic RETURNING id
    // Note: Using ? placeholders (adapter converts to $1, $2, $3)
    const insertResult = await adapter.execute(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      ['testuser', 'test@example.com', 'hashedpassword123']
    );
    console.info(`User inserted with ID: ${insertResult.insertId}`);

    // Example: Query with type safety and numbered placeholders
    interface User {
      id: number;
      username: string;
      email: string;
    }

    // Using ? placeholders - adapter automatically converts to $1
    const users = await adapter.query<User>('SELECT id, username, email FROM users WHERE id = ?', [
      insertResult.insertId,
    ]);
    console.info(`Found user: ${users[0]?.username}`);

    // Example: JSONB field operations
    await adapter.execute(
      `CREATE TABLE IF NOT EXISTS user_preferences (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        preferences JSONB NOT NULL
      )`,
      []
    );

    // Insert with JSONB data
    const jsonbData = {
      theme: 'dark',
      notifications: true,
      language: 'en',
    };

    await adapter.execute('INSERT INTO user_preferences (user_id, preferences) VALUES (?, ?)', [
      insertResult.insertId,
      JSON.stringify(jsonbData),
    ]);

    // Query JSONB fields
    const preferences = await adapter.query<{ preferences: unknown }>(
      'SELECT preferences FROM user_preferences WHERE user_id = ?',
      [insertResult.insertId]
    );
    console.info('User preferences:', preferences[0]?.preferences);

    // Example: Transaction with PostgreSQL
    await adapter.beginTransaction();
    try {
      await adapter.execute('UPDATE users SET email = ? WHERE id = ?', [
        'updated@example.com',
        insertResult.insertId,
      ]);

      await adapter.execute('INSERT INTO user_audit (user_id, action) VALUES (?, ?)', [
        insertResult.insertId,
        'email_updated',
      ]);

      await adapter.commit();
      console.info('Transaction committed successfully');
    } catch (error) {
      await adapter.rollback();
      console.error('Transaction failed, rolled back:', error);
      throw error;
    }

    // Cleanup
    await adapter.execute('DELETE FROM user_preferences WHERE user_id = ?', [
      insertResult.insertId,
    ]);
    await adapter.execute('DELETE FROM users WHERE id = ?', [insertResult.insertId]);
    console.info('Test data cleaned up');
  } catch (error) {
    console.error('PostgreSQL example failed:', error);
    throw error;
  } finally {
    // Always disconnect
    await adapter.disconnect();
    console.info('Disconnected from PostgreSQL');
  }
}

/**
 * Example: PostgreSQL-specific features
 */
async function postgresqlSpecificFeatures(): Promise<void> {
  const adapter = new PostgreSQLAdapter();

  await adapter.connect({
    host: 'localhost',
    port: 5432,
    database: 'media_player',
    user: 'postgres',
    password: 'password',
  });

  try {
    // Example 1: SERIAL auto-increment
    await adapter.execute(
      `CREATE TABLE IF NOT EXISTS test_serial (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100)
      )`,
      []
    );

    const result = await adapter.execute('INSERT INTO test_serial (name) VALUES (?)', ['test']);
    console.info(`SERIAL generated ID: ${result.insertId}`);

    // Example 2: JSONB indexing and querying
    await adapter.execute(
      `CREATE TABLE IF NOT EXISTS test_jsonb (
        id SERIAL PRIMARY KEY,
        data JSONB
      )`,
      []
    );

    // Create index on JSONB field for better performance
    await adapter.execute('CREATE INDEX IF NOT EXISTS idx_data ON test_jsonb USING gin(data)', []);

    // Insert JSONB data
    await adapter.execute('INSERT INTO test_jsonb (data) VALUES (?)', [
      JSON.stringify({ key: 'value', nested: { prop: 123 } }),
    ]);

    // Query JSONB using PostgreSQL operators
    const jsonbResults = await adapter.query<{ data: unknown }>(
      "SELECT data FROM test_jsonb WHERE data->>'key' = ?",
      ['value']
    );
    console.info('JSONB query results:', jsonbResults);

    // Example 3: Array types
    await adapter.execute(
      `CREATE TABLE IF NOT EXISTS test_arrays (
        id SERIAL PRIMARY KEY,
        tags TEXT[]
      )`,
      []
    );

    await adapter.execute('INSERT INTO test_arrays (tags) VALUES (?)', [
      '{tag1,tag2,tag3}', // PostgreSQL array syntax
    ]);

    // Example 4: RETURNING with multiple columns
    const multiReturn = await adapter.query<{ id: number; name: string }>(
      'INSERT INTO test_serial (name) VALUES (?) RETURNING id, name',
      ['explicit_returning']
    );
    console.info('Multi-column RETURNING:', multiReturn[0]);

    // Cleanup
    await adapter.execute('DROP TABLE IF EXISTS test_serial', []);
    await adapter.execute('DROP TABLE IF EXISTS test_jsonb', []);
    await adapter.execute('DROP TABLE IF EXISTS test_arrays', []);
  } finally {
    await adapter.disconnect();
  }
}

/**
 * Example: Placeholder conversion demonstration
 */
async function placeholderConversionExample(): Promise<void> {
  const adapter = new PostgreSQLAdapter();

  await adapter.connect({
    host: 'localhost',
    port: 5432,
    database: 'media_player',
    user: 'postgres',
    password: 'password',
  });

  try {
    // You write SQL with ? placeholders (database-agnostic)
    // Adapter automatically converts to $1, $2, $3 for PostgreSQL
    const sql = 'SELECT * FROM users WHERE username = ? AND email = ? AND active = ?';
    // Internally becomes: "SELECT * FROM users WHERE username = $1 AND email = $2 AND active = $3"

    const users = await adapter.query(sql, ['john', 'john@example.com', true]);
    console.info(`Found ${users.length} users`);
  } finally {
    await adapter.disconnect();
  }
}

// Export examples for documentation
export { basicPostgreSQLExample, postgresqlSpecificFeatures, placeholderConversionExample };
