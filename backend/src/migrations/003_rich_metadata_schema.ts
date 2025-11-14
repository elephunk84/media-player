import { DatabaseAdapter } from '../adapters/DatabaseAdapter';

/**
 * Rich Metadata Schema Migration
 *
 * Creates normalized tables for tags, categories, and performers with junction tables
 * for many-to-many relationships. Adds rich metadata columns to media_files table.
 *
 * New Tables:
 * - tags: Normalized tags with case-insensitive unique names
 * - categories: Normalized categories with case-insensitive unique names
 * - performers: Normalized performers with case-insensitive unique names
 * - media_file_tags: Junction table linking media files to tags
 * - media_file_categories: Junction table linking media files to categories
 * - media_file_performers: Junction table linking media files to performers
 *
 * Enhanced media_files columns:
 * - display_name: Human-readable title
 * - provider: Source provider (pornhub, youtube, etc.)
 * - provider_id: Provider's video ID
 * - webpage_url: Original source URL
 * - thumbnail: Thumbnail image URL
 * - duration: Video length in seconds
 * - downloaded_format: Format that was downloaded
 * - available_formats: JSON/JSONB array of available formats
 * - creator: Video creator/uploader
 * - primary_tag_id: Foreign key to tags(id)
 *
 * Handles both MySQL and PostgreSQL syntax differences.
 */

/**
 * Apply migration: Create all tables and add columns
 */
export async function up(adapter: DatabaseAdapter): Promise<void> {
  const isMySQL = adapter.constructor.name === 'MySQLAdapter';

  // ==================== 1. Create tags table ====================
  const createTagsTable = isMySQL
    ? `CREATE TABLE tags (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY idx_name_unique (name),
        INDEX idx_name (name)
      )`
    : `CREATE TABLE tags (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT idx_name_unique UNIQUE (LOWER(name))
      )`;

  await adapter.execute(createTagsTable, []);

  // Create index and trigger for PostgreSQL
  if (!isMySQL) {
    await adapter.execute('CREATE INDEX idx_name ON tags(name)', []);

    await adapter.execute(
      `CREATE TRIGGER update_tags_updated_at
       BEFORE UPDATE ON tags
       FOR EACH ROW
       EXECUTE FUNCTION update_updated_at_column()`,
      []
    );
  }

  console.info('✓ Created tags table');

  // ==================== 2. Create categories table ====================
  const createCategoriesTable = isMySQL
    ? `CREATE TABLE categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY idx_name_unique (name),
        INDEX idx_name (name)
      )`
    : `CREATE TABLE categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT idx_name_unique UNIQUE (LOWER(name))
      )`;

  await adapter.execute(createCategoriesTable, []);

  // Create index and trigger for PostgreSQL
  if (!isMySQL) {
    await adapter.execute('CREATE INDEX idx_name ON categories(name)', []);

    await adapter.execute(
      `CREATE TRIGGER update_categories_updated_at
       BEFORE UPDATE ON categories
       FOR EACH ROW
       EXECUTE FUNCTION update_updated_at_column()`,
      []
    );
  }

  console.info('✓ Created categories table');

  // ==================== 3. Create performers table ====================
  const createPerformersTable = isMySQL
    ? `CREATE TABLE performers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY idx_name_unique (name),
        INDEX idx_name (name)
      )`
    : `CREATE TABLE performers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT idx_name_unique UNIQUE (LOWER(name))
      )`;

  await adapter.execute(createPerformersTable, []);

  // Create index and trigger for PostgreSQL
  if (!isMySQL) {
    await adapter.execute('CREATE INDEX idx_name ON performers(name)', []);

    await adapter.execute(
      `CREATE TRIGGER update_performers_updated_at
       BEFORE UPDATE ON performers
       FOR EACH ROW
       EXECUTE FUNCTION update_updated_at_column()`,
      []
    );
  }

  console.info('✓ Created performers table');

  // ==================== 4. Create media_file_tags junction table ====================
  const createMediaFileTagsTable = `CREATE TABLE media_file_tags (
    media_file_uuid VARCHAR(36) NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (media_file_uuid, tag_id),
    FOREIGN KEY (media_file_uuid) REFERENCES media_files(uuid) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE${
      isMySQL
        ? `,
    INDEX idx_media_file_uuid (media_file_uuid),
    INDEX idx_tag_id (tag_id)`
        : ''
    }
  )`;

  await adapter.execute(createMediaFileTagsTable, []);

  // Create indexes for PostgreSQL
  if (!isMySQL) {
    await adapter.execute('CREATE INDEX idx_media_file_uuid ON media_file_tags(media_file_uuid)', []);
    await adapter.execute('CREATE INDEX idx_tag_id ON media_file_tags(tag_id)', []);
  }

  console.info('✓ Created media_file_tags junction table');

  // ==================== 5. Create media_file_categories junction table ====================
  const createMediaFileCategoriesTable = `CREATE TABLE media_file_categories (
    media_file_uuid VARCHAR(36) NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (media_file_uuid, category_id),
    FOREIGN KEY (media_file_uuid) REFERENCES media_files(uuid) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE${
      isMySQL
        ? `,
    INDEX idx_media_file_uuid (media_file_uuid),
    INDEX idx_category_id (category_id)`
        : ''
    }
  )`;

  await adapter.execute(createMediaFileCategoriesTable, []);

  // Create indexes for PostgreSQL
  if (!isMySQL) {
    await adapter.execute(
      'CREATE INDEX idx_media_file_uuid ON media_file_categories(media_file_uuid)',
      []
    );
    await adapter.execute('CREATE INDEX idx_category_id ON media_file_categories(category_id)', []);
  }

  console.info('✓ Created media_file_categories junction table');

  // ==================== 6. Create media_file_performers junction table ====================
  const createMediaFilePerformersTable = `CREATE TABLE media_file_performers (
    media_file_uuid VARCHAR(36) NOT NULL,
    performer_id INT NOT NULL,
    PRIMARY KEY (media_file_uuid, performer_id),
    FOREIGN KEY (media_file_uuid) REFERENCES media_files(uuid) ON DELETE CASCADE,
    FOREIGN KEY (performer_id) REFERENCES performers(id) ON DELETE CASCADE${
      isMySQL
        ? `,
    INDEX idx_media_file_uuid (media_file_uuid),
    INDEX idx_performer_id (performer_id)`
        : ''
    }
  )`;

  await adapter.execute(createMediaFilePerformersTable, []);

  // Create indexes for PostgreSQL
  if (!isMySQL) {
    await adapter.execute(
      'CREATE INDEX idx_media_file_uuid ON media_file_performers(media_file_uuid)',
      []
    );
    await adapter.execute('CREATE INDEX idx_performer_id ON media_file_performers(performer_id)', []);
  }

  console.info('✓ Created media_file_performers junction table');

  // ==================== 7. Add columns to media_files table ====================
  console.info('Adding columns to media_files table...');

  // Add display_name column
  await adapter.execute('ALTER TABLE media_files ADD COLUMN display_name VARCHAR(255)', []);

  // Add provider column
  await adapter.execute('ALTER TABLE media_files ADD COLUMN provider VARCHAR(100)', []);

  // Add provider_id column
  await adapter.execute('ALTER TABLE media_files ADD COLUMN provider_id VARCHAR(255)', []);

  // Add webpage_url column
  await adapter.execute('ALTER TABLE media_files ADD COLUMN webpage_url VARCHAR(512)', []);

  // Add thumbnail column
  await adapter.execute('ALTER TABLE media_files ADD COLUMN thumbnail VARCHAR(512)', []);

  // Add duration column
  await adapter.execute('ALTER TABLE media_files ADD COLUMN duration INT', []);

  // Add downloaded_format column
  await adapter.execute('ALTER TABLE media_files ADD COLUMN downloaded_format VARCHAR(50)', []);

  // Add available_formats column (JSON/JSONB)
  const availableFormatsType = isMySQL ? 'JSON' : 'JSONB';
  await adapter.execute(
    `ALTER TABLE media_files ADD COLUMN available_formats ${availableFormatsType}`,
    []
  );

  // Add creator column
  await adapter.execute('ALTER TABLE media_files ADD COLUMN creator VARCHAR(255)', []);

  // Add primary_tag_id column with foreign key
  await adapter.execute('ALTER TABLE media_files ADD COLUMN primary_tag_id INT', []);
  await adapter.execute(
    'ALTER TABLE media_files ADD FOREIGN KEY (primary_tag_id) REFERENCES tags(id) ON DELETE SET NULL',
    []
  );

  console.info('✓ Added 10 columns to media_files table');

  // ==================== 8. Create indexes on new media_files columns ====================
  await adapter.execute('CREATE INDEX idx_display_name ON media_files(display_name)', []);
  await adapter.execute('CREATE INDEX idx_provider ON media_files(provider)', []);
  await adapter.execute('CREATE INDEX idx_duration ON media_files(duration)', []);
  await adapter.execute('CREATE INDEX idx_primary_tag_id ON media_files(primary_tag_id)', []);

  console.info('✓ Created indexes on media_files columns');
  console.info('✓ Rich metadata schema migration completed successfully');
}

/**
 * Revert migration: Drop all tables and columns in reverse order
 */
export async function down(adapter: DatabaseAdapter): Promise<void> {
  const isMySQL = adapter.constructor.name === 'MySQLAdapter';

  // ==================== 1. Drop indexes from media_files ====================
  await adapter.execute('DROP INDEX idx_primary_tag_id ON media_files', []);
  await adapter.execute('DROP INDEX idx_duration ON media_files', []);
  await adapter.execute('DROP INDEX idx_provider ON media_files', []);
  await adapter.execute('DROP INDEX idx_display_name ON media_files', []);

  console.info('✓ Dropped indexes from media_files');

  // ==================== 2. Drop foreign key constraint (MySQL requires explicit drop) ====================
  if (isMySQL) {
    // Get the constraint name first
    const constraints = await adapter.query<{ CONSTRAINT_NAME: string }>(
      `SELECT CONSTRAINT_NAME
       FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
       WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'media_files'
       AND COLUMN_NAME = 'primary_tag_id'
       AND REFERENCED_TABLE_NAME IS NOT NULL`,
      []
    );

    if (constraints.length > 0) {
      await adapter.execute(
        `ALTER TABLE media_files DROP FOREIGN KEY ${constraints[0].CONSTRAINT_NAME}`,
        []
      );
    }
  }

  // ==================== 3. Drop columns from media_files table ====================
  await adapter.execute('ALTER TABLE media_files DROP COLUMN primary_tag_id', []);
  await adapter.execute('ALTER TABLE media_files DROP COLUMN creator', []);
  await adapter.execute('ALTER TABLE media_files DROP COLUMN available_formats', []);
  await adapter.execute('ALTER TABLE media_files DROP COLUMN downloaded_format', []);
  await adapter.execute('ALTER TABLE media_files DROP COLUMN duration', []);
  await adapter.execute('ALTER TABLE media_files DROP COLUMN thumbnail', []);
  await adapter.execute('ALTER TABLE media_files DROP COLUMN webpage_url', []);
  await adapter.execute('ALTER TABLE media_files DROP COLUMN provider_id', []);
  await adapter.execute('ALTER TABLE media_files DROP COLUMN provider', []);
  await adapter.execute('ALTER TABLE media_files DROP COLUMN display_name', []);

  console.info('✓ Dropped columns from media_files table');

  // ==================== 4. Drop junction tables (in reverse order) ====================
  await adapter.execute('DROP TABLE IF EXISTS media_file_performers', []);
  console.info('✓ Dropped media_file_performers table');

  await adapter.execute('DROP TABLE IF EXISTS media_file_categories', []);
  console.info('✓ Dropped media_file_categories table');

  await adapter.execute('DROP TABLE IF EXISTS media_file_tags', []);
  console.info('✓ Dropped media_file_tags table');

  // ==================== 5. Drop main tables ====================
  await adapter.execute('DROP TABLE IF EXISTS performers', []);
  console.info('✓ Dropped performers table');

  await adapter.execute('DROP TABLE IF EXISTS categories', []);
  console.info('✓ Dropped categories table');

  await adapter.execute('DROP TABLE IF EXISTS tags', []);
  console.info('✓ Dropped tags table');

  console.info('✓ Rich metadata schema rollback completed successfully');
}
