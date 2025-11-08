/**
 * Database Adapters
 *
 * This module exports the DatabaseAdapter interface and will export
 * concrete implementations (MySQLAdapter, PostgreSQLAdapter) and
 * the factory function for creating adapter instances.
 */

export { DatabaseAdapter } from './DatabaseAdapter';
export { MySQLAdapter } from './MySQLAdapter';
export { PostgreSQLAdapter } from './PostgreSQLAdapter';
export { createDatabaseAdapter, isValidDatabaseType, getSupportedDatabaseTypes } from './factory';
