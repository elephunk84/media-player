/**
 * Playlists Integration Tests
 *
 * Tests playlist endpoints with real database and HTTP layer.
 * Tests playlist CRUD, clip management, and reordering.
 */

import request from 'supertest';
import { Express } from 'express';
import { createApp } from '../../app';
import { AuthService } from '../../services/AuthService';
import {
  setupTestDatabase,
  cleanTestDatabase,
  teardownTestDatabase,
  getTestAdapter,
} from '../setup/testDb';
import {
  createTestUser,
  createTestVideo,
  createTestClip,
  createTestPlaylist,
  authenticatedRequest,
} from '../setup/testHelpers';

describe('Playlists Integration Tests', () => {
  let app: Express;
  let authService: AuthService;
  let authToken: string;

  // Setup: Connect to test database and create app
  beforeAll(async () => {
    const adapter = await setupTestDatabase();
    authService = new AuthService(adapter, {
      jwtSecret: process.env.JWT_SECRET || 'test-jwt-secret',
      tokenExpirationSeconds: 3600,
      bcryptRounds: 10,
    });
    app = createApp(adapter, authService);
  });

  // Create authenticated user before each test
  beforeEach(async () => {
    await cleanTestDatabase(getTestAdapter());
    const user = await createTestUser(app);
    authToken = user.token!;
  });

  // Teardown: Disconnect from database
  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('POST /api/playlists', () => {
    it('should create playlist with name and description (201)', async () => {
      const response = await authenticatedRequest(app, 'post', '/api/playlists', authToken).send({
        name: 'My Playlist',
        description: 'A collection of favorite clips',
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'My Playlist');
      expect(response.body).toHaveProperty('description', 'A collection of favorite clips');
    });

    it('should create playlist with only name (201)', async () => {
      const response = await authenticatedRequest(app, 'post', '/api/playlists', authToken).send({
        name: 'Simple Playlist',
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'Simple Playlist');
    });

    it('should return 400 for missing name', async () => {
      const response = await authenticatedRequest(app, 'post', '/api/playlists', authToken).send({
        description: 'No name provided',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).post('/api/playlists').send({
        name: 'Test Playlist',
      });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/playlists/:id', () => {
    it('should return playlist by ID with clips in order (200)', async () => {
      const playlist = await createTestPlaylist(getTestAdapter(), { name: 'Test Playlist' });
      const video = await createTestVideo(getTestAdapter());
      const clip1 = await createTestClip(getTestAdapter(), { videoId: video.id!, name: 'Clip 1' });
      const clip2 = await createTestClip(getTestAdapter(), { videoId: video.id!, name: 'Clip 2' });

      // Add clips to playlist
      const adapter = getTestAdapter();
      await adapter.execute(
        'INSERT INTO playlist_clips (playlist_id, clip_id, order_index) VALUES (?, ?, ?)',
        [playlist.id, clip1.id, 0]
      );
      await adapter.execute(
        'INSERT INTO playlist_clips (playlist_id, clip_id, order_index) VALUES (?, ?, ?)',
        [playlist.id, clip2.id, 1]
      );

      const response = await authenticatedRequest(
        app,
        'get',
        `/api/playlists/${playlist.id}`,
        authToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', playlist.id);
      expect(response.body).toHaveProperty('name', 'Test Playlist');
      expect(response.body).toHaveProperty('clips');
      expect(response.body.clips).toHaveLength(2);
      expect(response.body.clips[0].name).toBe('Clip 1');
      expect(response.body.clips[1].name).toBe('Clip 2');
    });

    it('should return 404 for non-existent playlist', async () => {
      const response = await authenticatedRequest(app, 'get', '/api/playlists/99999', authToken);

      expect(response.status).toBe(404);
    });

    it('should return 401 without authentication', async () => {
      const playlist = await createTestPlaylist(getTestAdapter());

      const response = await request(app).get(`/api/playlists/${playlist.id}`);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/playlists', () => {
    it('should return all playlists (200)', async () => {
      await createTestPlaylist(getTestAdapter(), { name: 'Playlist 1' });
      await createTestPlaylist(getTestAdapter(), { name: 'Playlist 2' });

      const response = await authenticatedRequest(app, 'get', '/api/playlists', authToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('playlists');
      expect(Array.isArray(response.body.playlists)).toBe(true);
      expect(response.body.playlists).toHaveLength(2);
    });

    it('should return empty array when no playlists exist', async () => {
      const response = await authenticatedRequest(app, 'get', '/api/playlists', authToken);

      expect(response.status).toBe(200);
      expect(response.body.playlists).toEqual([]);
    });
  });

  describe('POST /api/playlists/:id/clips', () => {
    it('should add clip to playlist with automatic ordering (201)', async () => {
      const playlist = await createTestPlaylist(getTestAdapter());
      const video = await createTestVideo(getTestAdapter());
      const clip = await createTestClip(getTestAdapter(), { videoId: video.id! });

      const response = await authenticatedRequest(
        app,
        'post',
        `/api/playlists/${playlist.id}/clips`,
        authToken
      ).send({
        clipId: clip.id,
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');
    });

    it('should add clip with specified order', async () => {
      const playlist = await createTestPlaylist(getTestAdapter());
      const video = await createTestVideo(getTestAdapter());
      const clip = await createTestClip(getTestAdapter(), { videoId: video.id! });

      const response = await authenticatedRequest(
        app,
        'post',
        `/api/playlists/${playlist.id}/clips`,
        authToken
      ).send({
        clipId: clip.id,
        order: 5,
      });

      expect(response.status).toBe(201);
    });

    it('should return 404 for non-existent playlist', async () => {
      const video = await createTestVideo(getTestAdapter());
      const clip = await createTestClip(getTestAdapter(), { videoId: video.id! });

      const response = await authenticatedRequest(
        app,
        'post',
        '/api/playlists/99999/clips',
        authToken
      ).send({
        clipId: clip.id,
      });

      expect(response.status).toBe(404);
    });

    it('should return 404 for non-existent clip', async () => {
      const playlist = await createTestPlaylist(getTestAdapter());

      const response = await authenticatedRequest(
        app,
        'post',
        `/api/playlists/${playlist.id}/clips`,
        authToken
      ).send({
        clipId: 99999,
      });

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/playlists/:id/reorder', () => {
    it('should reorder clips in playlist (200)', async () => {
      const playlist = await createTestPlaylist(getTestAdapter());
      const video = await createTestVideo(getTestAdapter());
      const clip1 = await createTestClip(getTestAdapter(), { videoId: video.id!, name: 'Clip 1' });
      const clip2 = await createTestClip(getTestAdapter(), { videoId: video.id!, name: 'Clip 2' });
      const clip3 = await createTestClip(getTestAdapter(), { videoId: video.id!, name: 'Clip 3' });

      // Add clips to playlist
      const adapter = getTestAdapter();
      await adapter.execute(
        'INSERT INTO playlist_clips (playlist_id, clip_id, order_index) VALUES (?, ?, ?)',
        [playlist.id, clip1.id, 0]
      );
      await adapter.execute(
        'INSERT INTO playlist_clips (playlist_id, clip_id, order_index) VALUES (?, ?, ?)',
        [playlist.id, clip2.id, 1]
      );
      await adapter.execute(
        'INSERT INTO playlist_clips (playlist_id, clip_id, order_index) VALUES (?, ?, ?)',
        [playlist.id, clip3.id, 2]
      );

      // Reorder: reverse the order
      const response = await authenticatedRequest(
        app,
        'patch',
        `/api/playlists/${playlist.id}/reorder`,
        authToken
      ).send({
        clipOrders: [
          { clipId: clip3.id, order: 0 },
          { clipId: clip2.id, order: 1 },
          { clipId: clip1.id, order: 2 },
        ],
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');

      // Verify order was updated
      const playlistResponse = await authenticatedRequest(
        app,
        'get',
        `/api/playlists/${playlist.id}`,
        authToken
      );
      expect(playlistResponse.body.clips[0].id).toBe(clip3.id);
      expect(playlistResponse.body.clips[1].id).toBe(clip2.id);
      expect(playlistResponse.body.clips[2].id).toBe(clip1.id);
    });

    it('should return 400 for empty reorder array', async () => {
      const playlist = await createTestPlaylist(getTestAdapter());

      const response = await authenticatedRequest(
        app,
        'patch',
        `/api/playlists/${playlist.id}/reorder`,
        authToken
      ).send({
        clipOrders: [],
      });

      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent playlist', async () => {
      const response = await authenticatedRequest(
        app,
        'patch',
        '/api/playlists/99999/reorder',
        authToken
      ).send({
        clipOrders: [{ clipId: 1, order: 0 }],
      });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/playlists/:id/clips/:clipId', () => {
    it('should remove clip from playlist (200)', async () => {
      const playlist = await createTestPlaylist(getTestAdapter());
      const video = await createTestVideo(getTestAdapter());
      const clip = await createTestClip(getTestAdapter(), { videoId: video.id! });

      // Add clip to playlist
      await getTestAdapter().execute(
        'INSERT INTO playlist_clips (playlist_id, clip_id, order_index) VALUES (?, ?, ?)',
        [playlist.id, clip.id, 0]
      );

      const response = await authenticatedRequest(
        app,
        'delete',
        `/api/playlists/${playlist.id}/clips/${clip.id}`,
        authToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');

      // Verify clip was removed
      const playlistResponse = await authenticatedRequest(
        app,
        'get',
        `/api/playlists/${playlist.id}`,
        authToken
      );
      expect(playlistResponse.body.clips).toHaveLength(0);
    });

    it('should return 404 for non-existent playlist', async () => {
      const response = await authenticatedRequest(
        app,
        'delete',
        '/api/playlists/99999/clips/1',
        authToken
      );

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/playlists/:id', () => {
    it('should delete playlist (200)', async () => {
      const playlist = await createTestPlaylist(getTestAdapter());

      const response = await authenticatedRequest(
        app,
        'delete',
        `/api/playlists/${playlist.id}`,
        authToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');

      // Verify playlist is deleted
      const getResponse = await authenticatedRequest(
        app,
        'get',
        `/api/playlists/${playlist.id}`,
        authToken
      );
      expect(getResponse.status).toBe(404);
    });

    it('should return 404 for non-existent playlist', async () => {
      const response = await authenticatedRequest(app, 'delete', '/api/playlists/99999', authToken);

      expect(response.status).toBe(404);
    });

    it('should return 401 without authentication', async () => {
      const playlist = await createTestPlaylist(getTestAdapter());

      const response = await request(app).delete(`/api/playlists/${playlist.id}`);

      expect(response.status).toBe(401);
    });
  });
});
