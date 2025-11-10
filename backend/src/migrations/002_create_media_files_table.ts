import { DatabaseAdapter } from '../adapters/DatabaseAdapter';

/**
 * Create Media Files Table Migration
 *
 * Creates the media_files table for storing video files with UUID-based metadata.
 * This table supports the Media Metadata Loader feature which automatically
 * discovers video files and their associated metadata.
 *
 * Table structure:
 * - uuid: Unique identifier extracted from filename (PRIMARY KEY)
 * - file_path: Relative path to video file
 * - file_name: Original filename
 * - file_size: File size in bytes
 * - file_extension: File extension (e.g., .mp4, .mkv)
 * - metadata: JSON/JSONB field containing parsed metadata from .info.json files
 * - metadata_file_path: Path to the metadata file
 * - created_at: Timestamp when record was first created
 * - updated_at: Timestamp when record was last updated
 * - last_scanned_at: Timestamp of last file system scan
 *
 * Handles both MySQL and PostgreSQL syntax differences.
 */

/**
 * Apply migration: Create media_files table
 */
export async function up(adapter: DatabaseAdapter): Promise<void> {
  const isMySQL = adapter.constructor.name === 'MySQLAdapter';

  // Create media_files table
  const createMediaFilesTable = isMySQL
    ? `CREATE TABLE media_files (
        uuid VARCHAR(36) PRIMARY KEY,
        file_path VARCHAR(512) NOT NULL UNIQUE,
        file_name VARCHAR(255) NOT NULL,
        file_size BIGINT,
        file_extension VARCHAR(20),
        metadata JSON,
        metadata_file_path VARCHAR(512),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        last_scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_file_name (file_name),
        INDEX idx_last_scanned (last_scanned_at),
        INDEX idx_file_extension (file_extension)
      )`
    : `CREATE TABLE media_files (
        uuid VARCHAR(36) PRIMARY KEY,
        file_path VARCHAR(512) NOT NULL UNIQUE,
        file_name VARCHAR(255) NOT NULL,
        file_size BIGINT,
        file_extension VARCHAR(20),
        metadata JSONB,
        metadata_file_path VARCHAR(512),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`;

  await adapter.execute(createMediaFilesTable, []);

  // Create indexes for PostgreSQL (MySQL creates them inline)
  if (!isMySQL) {
    await adapter.execute('CREATE INDEX idx_file_name ON media_files(file_name)', []);
    await adapter.execute('CREATE INDEX idx_last_scanned ON media_files(last_scanned_at)', []);
    await adapter.execute('CREATE INDEX idx_file_extension ON media_files(file_extension)', []);

    // Create trigger for updated_at auto-update in PostgreSQL
    await adapter.execute(
      `CREATE TRIGGER update_media_files_updated_at
       BEFORE UPDATE ON media_files
       FOR EACH ROW
       EXECUTE FUNCTION update_updated_at_column()`,
      []
    );
  }

  console.info('✓ Created media_files table');
  console.info('✓ Media files migration completed successfully');
}

/**
 * Revert migration: Drop media_files table
 */
export async function down(adapter: DatabaseAdapter): Promise<void> {
  await adapter.execute('DROP TABLE IF EXISTS media_files', []);
  console.info('✓ Dropped media_files table');
  console.info('✓ Media files migration rollback completed successfully');
}
