/**
 * Example usage of MySQLAdapter
 *
 * This file demonstrates how to use the MySQLAdapter implementation.
 * This is for documentation purposes and shows best practices.
 */

import { MySQLAdapter } from './MySQLAdapter';
import { DatabaseConfig } from '../types/database';

/**
 * Example: Basic MySQL operations
 */
async function basicMySQLExample(): Promise<void> {
  const adapter = new MySQLAdapter();

  const config: DatabaseConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    database: process.env.DB_NAME || 'media_player',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    poolSize: 10,
    connectionTimeout: 10000,
  };

  try {
    // Connect to MySQL
    await adapter.connect(config);
    console.info('Connected to MySQL');

    // Run migrations
    await adapter.runMigrations();

    // Check migration history
    const migrations = await adapter.getMigrationHistory();
    console.info(`Migration history: ${migrations.length} migrations applied`);

    // Example: Insert a user (using MySQL ? placeholders)
    const insertResult = await adapter.execute(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      ['testuser', 'test@example.com', 'hashedpassword123']
    );
    console.info(`User inserted with ID: ${insertResult.insertId}`);

    // Example: Query with type safety
    interface User {
      id: number;
      username: string;
      email: string;
    }

    const users = await adapter.query<User>('SELECT id, username, email FROM users WHERE id = ?', [
      insertResult.insertId,
    ]);
    console.info(`Found user: ${users[0]?.username}`);

    // Example: Transaction
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
    await adapter.execute('DELETE FROM users WHERE id = ?', [insertResult.insertId]);
    console.info('Test user cleaned up');
  } catch (error) {
    console.error('MySQL example failed:', error);
    throw error;
  } finally {
    // Always disconnect
    await adapter.disconnect();
    console.info('Disconnected from MySQL');
  }
}

/**
 * Example: Connection pooling benefits
 */
async function connectionPoolingExample(): Promise<void> {
  const adapter = new MySQLAdapter();

  await adapter.connect({
    host: 'localhost',
    port: 3306,
    database: 'media_player',
    user: 'root',
    password: 'password',
    poolSize: 20, // Large pool for concurrent operations
  });

  // Simulate concurrent operations
  const promises = [];
  for (let i = 0; i < 100; i++) {
    promises.push(adapter.query('SELECT 1 as result', []));
  }

  const results = await Promise.all(promises);
  console.info(`Executed ${results.length} concurrent queries successfully`);

  await adapter.disconnect();
}

// Export examples for documentation
export { basicMySQLExample, connectionPoolingExample };
