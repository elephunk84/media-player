#!/usr/bin/env ts-node

/**
 * Media Metadata Loader CLI
 *
 * Command-line interface for loading video files and metadata into the database.
 * Automatically discovers UUID-based video files and matches them with their
 * corresponding .info.json metadata files.
 *
 * Usage:
 *   npm run load-media [options]
 *
 * Options:
 *   --video-path <path>      Path to video files directory (default: /mnt/Videos)
 *   --metadata-path <path>   Path to metadata directory (default: /mnt/Metadata)
 *   --batch-size <number>    Number of files per batch (default: 100)
 *   --dry-run                Preview changes without writing to database
 *   --verbose                Enable verbose logging
 *   --help                   Display help information
 */

import { createDatabaseAdapter } from '../adapters/factory';
import { MigrationRunner } from '../migrations/MigrationRunner';
import { MediaLoaderService, LoaderStatistics } from '../services/MediaLoaderService';
import { getDatabaseType } from '../config/database';
import path from 'path';

/**
 * Parse command-line arguments
 */
function parseArgs(): {
  videoPath: string;
  metadataPath: string;
  batchSize: number;
  dryRun: boolean;
  verbose: boolean;
  help: boolean;
} {
  const args = process.argv.slice(2);

  const config = {
    videoPath: '/mnt/Videos',
    metadataPath: '/mnt/Metadata',
    batchSize: 100,
    dryRun: false,
    verbose: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--video-path':
        config.videoPath = args[++i];
        break;
      case '--metadata-path':
        config.metadataPath = args[++i];
        break;
      case '--batch-size':
        config.batchSize = parseInt(args[++i], 10);
        break;
      case '--dry-run':
        config.dryRun = true;
        break;
      case '--verbose':
        config.verbose = true;
        break;
      case '--help':
      case '-h':
        config.help = true;
        break;
      default:
        console.warn(`Unknown argument: ${arg}`);
        break;
    }
  }

  return config;
}

/**
 * Display help information
 */
function displayHelp(): void {
  console.info(`
Media Metadata Loader CLI

Automatically load video files and their metadata into the database.

USAGE:
  npm run load-media [options]

OPTIONS:
  --video-path <path>        Path to video files directory
                             Default: /mnt/Videos

  --metadata-path <path>     Path to metadata directory
                             Default: /mnt/Metadata

  --batch-size <number>      Number of files to process per batch
                             Default: 100

  --dry-run                  Preview changes without writing to database
                             Shows what would be inserted/updated

  --verbose                  Enable detailed logging
                             Shows per-file processing information

  --help, -h                 Display this help information

EXAMPLES:
  # Load with default paths
  npm run load-media

  # Load with custom paths
  npm run load-media -- --video-path /custom/videos --metadata-path /custom/metadata

  # Preview changes without making database modifications
  npm run load-media -- --dry-run --verbose

  # Process with custom batch size
  npm run load-media -- --batch-size 50

DIRECTORY STRUCTURE:
  Videos:    /mnt/Videos/{UUID}.mp4
  Metadata:  /mnt/Metadata/{UUID}/*.info.json

  Example:
    /mnt/Videos/550e8400-e29b-41d4-a716-446655440000.mp4
    /mnt/Metadata/550e8400-e29b-41d4-a716-446655440000/video.info.json

OUTPUT:
  The loader will display:
  - Number of files found and processed
  - Files with/without UUIDs
  - Files with/without metadata
  - Database operations (inserts/updates)
  - Processing time and rate
  - Any errors encountered

EXIT CODES:
  0  Success
  1  Error occurred during processing
`);
}

/**
 * Format duration in human-readable format
 */
function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }

  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Display formatted results
 */
function displayResults(stats: LoaderStatistics): void {
  console.info('\n' + '='.repeat(60));
  console.info('RESULTS SUMMARY');
  console.info('='.repeat(60));

  // File statistics
  console.info('\nFILE STATISTICS:');
  console.info(`  Total files scanned:        ${stats.filesScanned}`);
  console.info(`  Files processed:            ${stats.filesProcessed}`);
  console.info(`  Files with UUID:            ${stats.filesWithUUID}`);
  console.info(`  Files without UUID:         ${stats.filesWithoutUUID}`);
  console.info(`  Files with metadata:        ${stats.filesWithMetadata}`);
  console.info(`  Files without metadata:     ${stats.filesWithoutMetadata}`);

  // Database operations
  console.info('\nDATABASE OPERATIONS:');
  console.info(`  Records inserted:           ${stats.recordsInserted}`);
  console.info(`  Records updated:            ${stats.recordsUpdated}`);
  console.info(`  Records unchanged:          ${stats.recordsUnchanged}`);
  console.info(`  Total records affected:     ${stats.recordsInserted + stats.recordsUpdated}`);

  // Performance metrics
  if (stats.durationMs !== undefined) {
    const duration = formatDuration(stats.durationMs);
    const rate =
      stats.durationMs > 0 ? ((stats.filesProcessed / stats.durationMs) * 1000).toFixed(2) : '0';

    console.info('\nPERFORMANCE:');
    console.info(`  Processing time:            ${duration}`);
    console.info(`  Processing rate:            ${rate} files/second`);
  }

  // Error information
  if (stats.errors > 0) {
    console.info('\nERRORS:');
    console.info(`  Total errors:               ${stats.errors}`);

    if (stats.errorMessages.length > 0) {
      console.info('\n  Error details:');
      stats.errorMessages.slice(0, 10).forEach((msg, idx) => {
        console.info(`    ${idx + 1}. ${msg}`);
      });

      if (stats.errorMessages.length > 10) {
        console.info(`    ... and ${stats.errorMessages.length - 10} more errors`);
      }
    }
  }

  console.info('\n' + '='.repeat(60));

  // Final status
  if (stats.errors === 0) {
    console.info('✓ Completed successfully!');
  } else if (stats.filesProcessed > 0) {
    console.warn(`⚠ Completed with ${stats.errors} error(s)`);
  } else {
    console.error('✗ Failed - no files processed');
  }

  console.info('='.repeat(60) + '\n');
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  const config = parseArgs();

  // Display help if requested
  if (config.help) {
    displayHelp();
    process.exit(0);
  }

  try {
    // Initialize database adapter
    console.info('Initializing database connection...');
    const dbType = getDatabaseType();
    const adapter = createDatabaseAdapter(dbType);

    // Run pending migrations
    console.info('Running database migrations...');
    const migrationsPath = path.join(__dirname, '../migrations');
    const migrationRunner = new MigrationRunner(migrationsPath);
    await migrationRunner.runPendingMigrations(adapter);
    console.info('✓ Database migrations complete\n');

    // Create media loader service
    const loaderService = new MediaLoaderService(adapter, {
      videoPath: config.videoPath,
      metadataPath: config.metadataPath,
      batchSize: config.batchSize,
      dryRun: config.dryRun,
      verbose: config.verbose,
    });

    // Run the loader
    const stats = await loaderService.loadMedia();

    // Display results
    displayResults(stats);

    // Close database connection
    await adapter.disconnect();

    // Exit with appropriate code
    if (stats.errors > 0 && stats.filesProcessed === 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('FATAL ERROR');
    console.error('='.repeat(60));
    console.error(error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    console.error('='.repeat(60) + '\n');
    process.exit(1);
  }
}

// Run the CLI
if (require.main === module) {
  main().catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}
