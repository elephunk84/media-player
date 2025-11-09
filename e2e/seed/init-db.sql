-- E2E Test Database Seed Data
-- This script initializes the test database with consistent seed data for E2E tests

-- Create Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create Videos table
CREATE TABLE IF NOT EXISTS videos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  file_path VARCHAR(500) NOT NULL,
  title VARCHAR(255) NOT NULL,
  duration FLOAT NOT NULL,
  file_size BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSON
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create Clips table
CREATE TABLE IF NOT EXISTS clips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  video_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  start_time FLOAT NOT NULL,
  end_time FLOAT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  custom_metadata JSON,
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create Playlists table
CREATE TABLE IF NOT EXISTS playlists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create PlaylistClips junction table
CREATE TABLE IF NOT EXISTS playlist_clips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  playlist_id INT NOT NULL,
  clip_id INT NOT NULL,
  position INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
  FOREIGN KEY (clip_id) REFERENCES clips(id) ON DELETE CASCADE,
  UNIQUE KEY unique_playlist_clip (playlist_id, clip_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert test user (password: 'testpass123')
-- Password hash for 'testpass123' using bcrypt (10 rounds)
INSERT INTO users (username, password_hash) VALUES
  ('testuser', '$2b$10$rKjXZ.vZ5QZ5Y5YxQZ5YxO5Y5YxQZ5YxO5Y5YxQZ5YxO5Y5YxQZ5Yx');

-- Insert test videos
INSERT INTO videos (file_path, title, duration, file_size, metadata) VALUES
  ('/media/test-video-1.mp4', 'Test Video 1', 120.5, 10485760, '{"resolution": "1920x1080", "codec": "h264"}'),
  ('/media/test-video-2.mp4', 'Test Video 2', 180.0, 15728640, '{"resolution": "1280x720", "codec": "h264"}'),
  ('/media/test-video-3.mp4', 'Sample Documentary', 300.0, 20971520, '{"resolution": "1920x1080", "codec": "h264", "tags": ["documentary", "nature"]}');

-- Insert test clips
INSERT INTO clips (video_id, name, start_time, end_time, custom_metadata) VALUES
  (1, 'Test Clip 1', 10.0, 30.0, '{"quality": "high"}'),
  (1, 'Test Clip 2', 45.0, 65.0, '{"quality": "medium"}'),
  (2, 'Intro Scene', 0.0, 15.0, '{"scene": "intro"}');

-- Insert test playlists
INSERT INTO playlists (name, description) VALUES
  ('My Test Playlist', 'A playlist for E2E testing'),
  ('Nature Highlights', 'Best nature scenes');

-- Add clips to playlists
INSERT INTO playlist_clips (playlist_id, clip_id, position) VALUES
  (1, 1, 0),
  (1, 2, 1),
  (2, 3, 0);
