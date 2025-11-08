import { DatabaseAdapter } from './DatabaseAdapter';
import { MySQLAdapter } from './MySQLAdapter';
import { PostgreSQLAdapter } from './PostgreSQLAdapter';
import { DatabaseType } from '../config/database';

/**
 * Factory function to create the appropriate database adapter
 *
 * Creates and returns a database adapter instance based on the specified type.
 * This enables the application to switch between MySQL and PostgreSQL without
 * changing business logic code.
 *
 * @param type - Database type ('mysql' or 'postgresql')
 * @returns DatabaseAdapter instance (MySQLAdapter or PostgreSQLAdapter)
 * @throws Error if an unsupported database type is provided
 *
 * @example
 * ```typescript
 * // Create MySQL adapter
 * const mysqlAdapter = createDatabaseAdapter('mysql');
 * await mysqlAdapter.connect(config);
 *
 * // Create PostgreSQL adapter
 * const pgAdapter = createDatabaseAdapter('postgresql');
 * await pgAdapter.connect(config);
 * ```
 */
export function createDatabaseAdapter(type: DatabaseType): DatabaseAdapter {
  switch (type) {
    case 'mysql':
      console.info('Creating MySQL database adapter');
      return new MySQLAdapter();

    case 'postgresql':
      console.info('Creating PostgreSQL database adapter');
      return new PostgreSQLAdapter();

    default: {
      // This should never happen with TypeScript's type checking,
      // but we include it for runtime safety
      const invalidType: never = type;
      throw new Error(
        `Unsupported database type: "${String(invalidType)}".\n` +
          'Supported types are: "mysql", "postgresql".\n' +
          `Received: "${String(invalidType)}"`
      );
    }
  }
}

/**
 * Check if a given string is a valid database type
 *
 * @param type - String to check
 * @returns true if the type is valid, false otherwise
 *
 * @example
 * ```typescript
 * if (isValidDatabaseType('mysql')) {
 *   // type is 'mysql' or 'postgresql'
 * }
 * ```
 */
export function isValidDatabaseType(type: string): type is DatabaseType {
  return type === 'mysql' || type === 'postgresql';
}

/**
 * Get a list of supported database types
 *
 * @returns Array of supported database type strings
 *
 * @example
 * ```typescript
 * const types = getSupportedDatabaseTypes();
 * console.log(`Supported databases: ${types.join(', ')}`);
 * // Output: "Supported databases: mysql, postgresql"
 * ```
 */
export function getSupportedDatabaseTypes(): DatabaseType[] {
  return ['mysql', 'postgresql'];
}
