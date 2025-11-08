import { DatabaseAdapter } from '../adapters/DatabaseAdapter';

/**
 * Initial Schema Migration
 *
 * Creates all core tables for the media player application:
 * - videos: Video library with metadata
 * - clips: Time-based segments from videos
 * - playlists: Collections of clips
 * - playlist_clips: Junction table for playlist ordering
 * - users: User authentication
 *
 * Handles both MySQL and PostgreSQL syntax differences.
 */

/**
 * Apply migration: Create all tables
 */
export async function up(adapter: DatabaseAdapter): Promise<void> {
  const isMySQL = adapter.constructor.name === 'MySQLAdapter';

  // 1. Create videos table
  const createVideosTable = isMySQL
    ? `CREATE TABLE videos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        file_path VARCHAR(512) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        tags JSON,
        duration DECIMAL(10, 2) NOT NULL,
        resolution VARCHAR(50),
        codec VARCHAR(50),
        file_size BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        is_available BOOLEAN DEFAULT TRUE,
        custom_metadata JSON,
        INDEX idx_title (title),
        INDEX idx_created_at (created_at)
      )`
    : `CREATE TABLE videos (
        id SERIAL PRIMARY KEY,
        file_path VARCHAR(512) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        tags JSONB,
        duration DECIMAL(10, 2) NOT NULL,
        resolution VARCHAR(50),
        codec VARCHAR(50),
        file_size BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_available BOOLEAN DEFAULT TRUE,
        custom_metadata JSONB
      )`;

  await adapter.execute(createVideosTable, []);

  // Create indexes for PostgreSQL (MySQL creates them inline)
  if (!isMySQL) {
    await adapter.execute('CREATE INDEX idx_title ON videos(title)', []);
    await adapter.execute('CREATE INDEX idx_created_at ON videos(created_at)', []);

    // Create trigger for updated_at auto-update in PostgreSQL
    await adapter.execute(
      `CREATE OR REPLACE FUNCTION update_updated_at_column()
       RETURNS TRIGGER AS $$
       BEGIN
         NEW.updated_at = CURRENT_TIMESTAMP;
         RETURN NEW;
       END;
       $$ language 'plpgsql'`,
      []
    );

    await adapter.execute(
      `CREATE TRIGGER update_videos_updated_at
       BEFORE UPDATE ON videos
       FOR EACH ROW
       EXECUTE FUNCTION update_updated_at_column()`,
      []
    );
  }

  console.info('✓ Created videos table');

  // 2. Create clips table
  const createClipsTable = isMySQL
    ? `CREATE TABLE clips (
        id INT AUTO_INCREMENT PRIMARY KEY,
        video_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        start_time DECIMAL(10, 2) NOT NULL,
        end_time DECIMAL(10, 2) NOT NULL,
        duration DECIMAL(10, 2) GENERATED ALWAYS AS (end_time - start_time) STORED,
        inherited_metadata JSON,
        custom_metadata JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
        INDEX idx_video_id (video_id),
        CONSTRAINT chk_time_range CHECK (start_time < end_time)
      )`
    : `CREATE TABLE clips (
        id SERIAL PRIMARY KEY,
        video_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        start_time DECIMAL(10, 2) NOT NULL,
        end_time DECIMAL(10, 2) NOT NULL,
        duration DECIMAL(10, 2) GENERATED ALWAYS AS (end_time - start_time) STORED,
        inherited_metadata JSONB,
        custom_metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
        CONSTRAINT chk_time_range CHECK (start_time < end_time)
      )`;

  await adapter.execute(createClipsTable, []);

  // Create indexes and triggers for PostgreSQL
  if (!isMySQL) {
    await adapter.execute('CREATE INDEX idx_video_id ON clips(video_id)', []);

    await adapter.execute(
      `CREATE TRIGGER update_clips_updated_at
       BEFORE UPDATE ON clips
       FOR EACH ROW
       EXECUTE FUNCTION update_updated_at_column()`,
      []
    );
  }

  console.info('✓ Created clips table');

  // 3. Create playlists table
  const createPlaylistsTable = isMySQL
    ? `CREATE TABLE playlists (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_name (name)
      )`
    : `CREATE TABLE playlists (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`;

  await adapter.execute(createPlaylistsTable, []);

  // Create indexes and triggers for PostgreSQL
  if (!isMySQL) {
    await adapter.execute('CREATE INDEX idx_name ON playlists(name)', []);

    await adapter.execute(
      `CREATE TRIGGER update_playlists_updated_at
       BEFORE UPDATE ON playlists
       FOR EACH ROW
       EXECUTE FUNCTION update_updated_at_column()`,
      []
    );
  }

  console.info('✓ Created playlists table');

  // 4. Create playlist_clips junction table
  const createPlaylistClipsTable = isMySQL
    ? `CREATE TABLE playlist_clips (
        playlist_id INT NOT NULL,
        clip_id INT NOT NULL,
        order_index INT NOT NULL,
        PRIMARY KEY (playlist_id, clip_id),
        FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
        FOREIGN KEY (clip_id) REFERENCES clips(id) ON DELETE CASCADE,
        INDEX idx_order (playlist_id, order_index)
      )`
    : `CREATE TABLE playlist_clips (
        playlist_id INT NOT NULL,
        clip_id INT NOT NULL,
        order_index INT NOT NULL,
        PRIMARY KEY (playlist_id, clip_id),
        FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
        FOREIGN KEY (clip_id) REFERENCES clips(id) ON DELETE CASCADE
      )`;

  await adapter.execute(createPlaylistClipsTable, []);

  // Create index for PostgreSQL
  if (!isMySQL) {
    await adapter.execute('CREATE INDEX idx_order ON playlist_clips(playlist_id, order_index)', []);
  }

  console.info('✓ Created playlist_clips table');

  // 5. Create users table
  const createUsersTable = isMySQL
    ? `CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP NULL,
        INDEX idx_username (username)
      )`
    : `CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP NULL
      )`;

  await adapter.execute(createUsersTable, []);

  // Create index for PostgreSQL
  if (!isMySQL) {
    await adapter.execute('CREATE INDEX idx_username ON users(username)', []);
  }

  console.info('✓ Created users table');
  console.info('✓ Initial schema migration completed successfully');
}

/**
 * Revert migration: Drop all tables in reverse order
 */
export async function down(adapter: DatabaseAdapter): Promise<void> {
  const isMySQL = adapter.constructor.name === 'MySQLAdapter';

  // Drop tables in reverse order to handle foreign key constraints
  await adapter.execute('DROP TABLE IF EXISTS playlist_clips', []);
  console.info('✓ Dropped playlist_clips table');

  await adapter.execute('DROP TABLE IF EXISTS playlists', []);
  console.info('✓ Dropped playlists table');

  await adapter.execute('DROP TABLE IF EXISTS clips', []);
  console.info('✓ Dropped clips table');

  await adapter.execute('DROP TABLE IF EXISTS videos', []);
  console.info('✓ Dropped videos table');

  await adapter.execute('DROP TABLE IF EXISTS users', []);
  console.info('✓ Dropped users table');

  // Drop PostgreSQL function if it exists
  if (!isMySQL) {
    await adapter.execute('DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE', []);
    console.info('✓ Dropped update_updated_at_column function');
  }

  console.info('✓ Initial schema rollback completed successfully');
}
