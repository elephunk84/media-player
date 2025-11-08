/**
 * Configuration Module
 *
 * This module exports configuration loading functions for the application.
 */

export {
  loadDatabaseConfig,
  getDatabaseType,
  loadFullDatabaseConfig,
  type DatabaseType,
} from './database';

// Future exports (will be implemented in later tasks):
// export { loadJWTConfig } from './jwt';
// export { loadServerConfig } from './server';
// export { loadVideoConfig } from './video';
