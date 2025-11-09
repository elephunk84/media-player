/**
 * Test Helper Utilities
 *
 * Provides helper functions for creating test data and making
 * authenticated requests in integration tests.
 */

import request from 'supertest';
import { Express } from 'express';
import { DatabaseAdapter } from '../../adapters/DatabaseAdapter';

/**
 * Test user credentials
 */
export interface TestUser {
  id?: number;
  username: string;
  password: string;
  token?: string;
}

/**
 * Test video data
 */
export interface TestVideo {
  id?: number;
  filePath: string;
  title: string;
  description?: string;
  duration: number;
  resolution: string;
  codec: string;
  tags?: string[];
  customMetadata?: Record<string, unknown>;
}

/**
 * Test clip data
 */
export interface TestClip {
  id?: number;
  videoId: number;
  name: string;
  description?: string;
  startTime: number;
  endTime: number;
}

/**
 * Test playlist data
 */
export interface TestPlaylist {
  id?: number;
  name: string;
  description?: string;
}

/**
 * Create a test user and return with auth token
 *
 * @param app - Express app instance
 * @param username - Username for the test user
 * @param password - Password for the test user
 * @returns Test user with auth token
 */
export async function createTestUser(
  app: Express,
  username = 'testuser',
  password = 'TestPass123!'
): Promise<TestUser> {
  const response = await request(app).post('/api/auth/register').send({
    username,
    password,
  });

  if (response.status !== 201) {
    throw new Error(`Failed to create test user: ${JSON.stringify(response.body)}`);
  }

  return {
    id: response.body.user.id,
    username,
    password,
    token: response.body.token,
  };
}

/**
 * Login as a test user and return auth token
 *
 * @param app - Express app instance
 * @param username - Username
 * @param password - Password
 * @returns Auth token
 */
export async function loginTestUser(
  app: Express,
  username: string,
  password: string
): Promise<string> {
  const response = await request(app).post('/api/auth/login').send({
    username,
    password,
  });

  if (response.status !== 200) {
    throw new Error(`Failed to login test user: ${JSON.stringify(response.body)}`);
  }

  return response.body.token;
}

/**
 * Create a test video directly in the database
 * (bypasses scanning, for testing purposes)
 *
 * @param adapter - Database adapter
 * @param videoData - Video data
 * @returns Created video with ID
 */
export async function createTestVideo(
  adapter: DatabaseAdapter,
  videoData: Partial<TestVideo> = {}
): Promise<TestVideo> {
  const video: TestVideo = {
    filePath: videoData.filePath || '/media/test-video.mp4',
    title: videoData.title || 'Test Video',
    description: videoData.description || 'A test video for integration tests',
    duration: videoData.duration || 120,
    resolution: videoData.resolution || '1920x1080',
    codec: videoData.codec || 'h264',
    tags: videoData.tags || ['test', 'integration'],
    customMetadata: videoData.customMetadata || { source: 'test' },
  };

  const result = await adapter.execute(
    `INSERT INTO videos
      (file_path, title, description, duration, file_size, resolution, codec, tags, custom_metadata, is_available, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      video.filePath,
      video.title,
      video.description,
      video.duration,
      1024 * 1024 * 100, // 100MB default
      video.resolution,
      video.codec,
      JSON.stringify(video.tags),
      JSON.stringify(video.customMetadata),
      true,
    ]
  );

  if (!result.insertId) {
    throw new Error('Failed to create test video');
  }

  return {
    ...video,
    id: result.insertId,
  };
}

/**
 * Create a test clip directly in the database
 *
 * @param adapter - Database adapter
 * @param clipData - Clip data
 * @returns Created clip with ID
 */
export async function createTestClip(
  adapter: DatabaseAdapter,
  clipData: Partial<TestClip> & { videoId: number }
): Promise<TestClip> {
  const clip: TestClip = {
    videoId: clipData.videoId,
    name: clipData.name || 'Test Clip',
    description: clipData.description || 'A test clip',
    startTime: clipData.startTime || 10,
    endTime: clipData.endTime || 30,
  };

  const duration = clip.endTime - clip.startTime;

  const result = await adapter.execute(
    `INSERT INTO clips
      (video_id, name, description, start_time, end_time, duration, inherited_metadata, custom_metadata, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      clip.videoId,
      clip.name,
      clip.description,
      clip.startTime,
      clip.endTime,
      duration,
      JSON.stringify({}),
      JSON.stringify({}),
    ]
  );

  if (!result.insertId) {
    throw new Error('Failed to create test clip');
  }

  return {
    ...clip,
    id: result.insertId,
  };
}

/**
 * Create a test playlist directly in the database
 *
 * @param adapter - Database adapter
 * @param playlistData - Playlist data
 * @returns Created playlist with ID
 */
export async function createTestPlaylist(
  adapter: DatabaseAdapter,
  playlistData: Partial<TestPlaylist> = {}
): Promise<TestPlaylist> {
  const playlist: TestPlaylist = {
    name: playlistData.name || 'Test Playlist',
    description: playlistData.description || 'A test playlist',
  };

  const result = await adapter.execute(
    `INSERT INTO playlists (name, description, created_at, updated_at)
    VALUES (?, ?, NOW(), NOW())`,
    [playlist.name, playlist.description]
  );

  if (!result.insertId) {
    throw new Error('Failed to create test playlist');
  }

  return {
    ...playlist,
    id: result.insertId,
  };
}

/**
 * Make an authenticated request with supertest
 *
 * @param app - Express app
 * @param method - HTTP method
 * @param path - Request path
 * @param token - Auth token
 * @returns Supertest request object
 */
export function authenticatedRequest(
  app: Express,
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  path: string,
  token: string
) {
  return request(app)[method](path).set('Authorization', `Bearer ${token}`);
}
