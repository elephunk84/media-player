/**
 * Example usage of DatabaseAdapter interface
 *
 * This file demonstrates how to use the DatabaseAdapter interface
 * and is intended for documentation purposes only.
 * It will be removed once concrete implementations are created.
 */

import { DatabaseAdapter } from './DatabaseAdapter';
import { DatabaseConfig } from '../types/database';

/**
 * Example function demonstrating typical database operations
 */
async function exampleDatabaseOperations(adapter: DatabaseAdapter): Promise<void> {
  const config: DatabaseConfig = {
    host: 'localhost',
    port: 3306,
    database: 'media_player',
    user: 'root',
    password: 'password',
  };

  // Connect to database
  await adapter.connect(config);

  // Run migrations
  await adapter.runMigrations();

  // Get migration history
  const migrations = await adapter.getMigrationHistory();
  console.info(`Applied ${migrations.length} migrations`);

  // Execute a SELECT query with type safety
  interface User {
    id: number;
    username: string;
    email: string;
  }

  const users = await adapter.query<User>('SELECT * FROM users WHERE id = ?', [1]);
  console.info(`Found ${users.length} users`);

  // Execute an INSERT query
  const insertResult = await adapter.execute('INSERT INTO users (username, email) VALUES (?, ?)', [
    'john',
    'john@example.com',
  ]);
  console.info(`Inserted user with ID: ${insertResult.insertId}`);

  // Transaction example
  try {
    await adapter.beginTransaction();

    await adapter.execute('UPDATE users SET email = ? WHERE id = ?', ['newemail@example.com', 1]);

    await adapter.execute('INSERT INTO user_audit (user_id, action) VALUES (?, ?)', [1, 'update']);

    await adapter.commit();
    console.info('Transaction committed successfully');
  } catch (error) {
    await adapter.rollback();
    console.error('Transaction rolled back:', error);
    throw error;
  }

  // Disconnect
  await adapter.disconnect();
}

// Export for documentation purposes
export { exampleDatabaseOperations };
