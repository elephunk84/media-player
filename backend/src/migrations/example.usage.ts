/**
 * MigrationRunner Usage Examples
 *
 * This file demonstrates how to use the MigrationRunner to manage
 * database schema migrations.
 */

import path from 'path';
import { MigrationRunner } from './MigrationRunner';
import { MigrationStatusEnum } from './types';
import { createDatabaseAdapter, loadFullDatabaseConfig } from '../config';

/**
 * Example 1: Run all pending migrations
 */
async function runMigrations(): Promise<void> {
  try {
    // Load database configuration
    const { type, config } = loadFullDatabaseConfig();

    // Create database adapter
    const adapter = createDatabaseAdapter(type);
    await adapter.connect(config);

    console.info('Connected to database successfully');

    // Create migration runner
    const migrationsPath = path.join(__dirname, '.');
    const runner = new MigrationRunner(migrationsPath);

    // Run pending migrations
    await runner.runPendingMigrations(adapter);

    console.info('All migrations completed');

    await adapter.disconnect();
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

/**
 * Example 2: Check migration status
 */
async function checkMigrationStatus(): Promise<void> {
  try {
    const { type, config } = loadFullDatabaseConfig();
    const adapter = createDatabaseAdapter(type);
    await adapter.connect(config);

    const migrationsPath = path.join(__dirname, '.');
    const runner = new MigrationRunner(migrationsPath);

    // Get migration status
    const statuses = await runner.getMigrationStatus(adapter);

    console.info('\nMigration Status:');
    console.info('─'.repeat(80));

    statuses.forEach((migrationStatus) => {
      const statusIcon = migrationStatus.status === MigrationStatusEnum.APPLIED ? '✓' : '○';
      const executedAt = migrationStatus.executedAt
        ? new Date(migrationStatus.executedAt).toLocaleString()
        : 'Not executed';

      console.info(`${statusIcon} ${migrationStatus.version} - ${migrationStatus.name}`);
      console.info(`  Status: ${migrationStatus.status}`);
      console.info(`  Executed: ${executedAt}`);
      console.info('');
    });

    await adapter.disconnect();
  } catch (error) {
    console.error('Failed to get migration status:', error);
    throw error;
  }
}

/**
 * Example 3: Rollback last migration
 */
async function rollbackMigration(): Promise<void> {
  try {
    const { type, config } = loadFullDatabaseConfig();
    const adapter = createDatabaseAdapter(type);
    await adapter.connect(config);

    const migrationsPath = path.join(__dirname, '.');
    const runner = new MigrationRunner(migrationsPath);

    // Rollback last migration
    await runner.rollbackLastMigration(adapter);

    console.info('Migration rolled back successfully');

    await adapter.disconnect();
  } catch (error) {
    console.error('Rollback failed:', error);
    throw error;
  }
}

/**
 * Example 4: Initialize fresh database
 */
async function initializeDatabase(): Promise<void> {
  try {
    console.info('Initializing database...');

    const { type, config } = loadFullDatabaseConfig();
    console.info(`Database type: ${type}`);

    const adapter = createDatabaseAdapter(type);
    await adapter.connect(config);
    console.info('✓ Connected to database');

    const migrationsPath = path.join(__dirname, '.');
    const runner = new MigrationRunner(migrationsPath);

    // Run all migrations
    await runner.runPendingMigrations(adapter);
    console.info('✓ Migrations completed');

    // Verify migration status
    const statuses = await runner.getMigrationStatus(adapter);
    const appliedCount = statuses.filter(
      (migrationStatus) => migrationStatus.status === MigrationStatusEnum.APPLIED
    ).length;
    console.info(`✓ ${appliedCount} migration(s) applied`);

    await adapter.disconnect();
    console.info('✓ Database initialization complete');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

/**
 * Example 5: Application startup with migrations
 */
async function startupWithMigrations(): Promise<void> {
  try {
    console.info('Starting application...');

    // Load configuration
    const { type, config } = loadFullDatabaseConfig();

    // Create and connect adapter
    const adapter = createDatabaseAdapter(type);
    await adapter.connect(config);

    // Run migrations automatically on startup
    const migrationsPath = path.join(__dirname, '.');
    const runner = new MigrationRunner(migrationsPath);

    console.info('Checking for pending migrations...');
    const statusBefore = await runner.getMigrationStatus(adapter);
    const pendingCount = statusBefore.filter(
      (migrationStatus) => migrationStatus.status === MigrationStatusEnum.PENDING
    ).length;

    if (pendingCount > 0) {
      console.info(`Found ${pendingCount} pending migration(s), applying...`);
      await runner.runPendingMigrations(adapter);
    } else {
      console.info('No pending migrations');
    }

    // Application is ready
    console.info('Application ready!');

    // Keep connection for application use
    // In real app, this would start the Express server
    // For example: await startExpressServer(adapter);

    // Cleanup for example
    await adapter.disconnect();
  } catch (error) {
    console.error('Application startup failed:', error);
    process.exit(1);
  }
}

// Export examples for documentation
export {
  runMigrations,
  checkMigrationStatus,
  rollbackMigration,
  initializeDatabase,
  startupWithMigrations,
};
