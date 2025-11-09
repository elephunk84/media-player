/**
 * Videos Integration Tests
 *
 * Tests video endpoints with real database and HTTP layer.
 * Tests video retrieval, search, updates, and authentication.
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
import { createTestUser, createTestVideo, authenticatedRequest } from '../setup/testHelpers';

describe('Videos Integration Tests', () => {
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

  describe('GET /api/videos', () => {
    it('should return all videos with authentication (200)', async () => {
      // Create test videos
      await createTestVideo(getTestAdapter(), { title: 'Video 1' });
      await createTestVideo(getTestAdapter(), { title: 'Video 2' });

      const response = await authenticatedRequest(app, 'get', '/api/videos', authToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('videos');
      expect(Array.isArray(response.body.videos)).toBe(true);
      expect(response.body.videos).toHaveLength(2);
      expect(response.body.videos[0]).toHaveProperty('id');
      expect(response.body.videos[0]).toHaveProperty('title');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/videos');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return empty array when no videos exist', async () => {
      const response = await authenticatedRequest(app, 'get', '/api/videos', authToken);

      expect(response.status).toBe(200);
      expect(response.body.videos).toEqual([]);
    });

    it('should filter by tags query parameter', async () => {
      await createTestVideo(getTestAdapter(), {
        title: 'Action Movie',
        tags: ['action', 'thriller'],
      });
      await createTestVideo(getTestAdapter(), { title: 'Comedy Show', tags: ['comedy', 'funny'] });

      const response = await authenticatedRequest(app, 'get', '/api/videos?tags=action', authToken);

      expect(response.status).toBe(200);
      expect(response.body.videos).toHaveLength(1);
      expect(response.body.videos[0].title).toBe('Action Movie');
    });
  });

  describe('GET /api/videos/:id', () => {
    it('should return video by ID with authentication (200)', async () => {
      const testVideo = await createTestVideo(getTestAdapter(), {
        title: 'Test Video',
        description: 'Test Description',
      });

      const response = await authenticatedRequest(
        app,
        'get',
        `/api/videos/${testVideo.id}`,
        authToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testVideo.id);
      expect(response.body).toHaveProperty('title', 'Test Video');
      expect(response.body).toHaveProperty('description', 'Test Description');
    });

    it('should return 404 for non-existent video', async () => {
      const response = await authenticatedRequest(app, 'get', '/api/videos/99999', authToken);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 without authentication', async () => {
      const testVideo = await createTestVideo(getTestAdapter());

      const response = await request(app).get(`/api/videos/${testVideo.id}`);

      expect(response.status).toBe(401);
    });

    it('should return 400 for invalid video ID format', async () => {
      const response = await authenticatedRequest(app, 'get', '/api/videos/invalid', authToken);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/videos/search', () => {
    it('should search videos by query (200)', async () => {
      await createTestVideo(getTestAdapter(), { title: 'Amazing Documentary' });
      await createTestVideo(getTestAdapter(), { title: 'Funny Comedy Show' });
      await createTestVideo(getTestAdapter(), { title: 'Action Movie' });

      const response = await authenticatedRequest(
        app,
        'get',
        '/api/videos/search?q=documentary',
        authToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('videos');
      expect(response.body.videos).toHaveLength(1);
      expect(response.body.videos[0].title).toContain('Documentary');
    });

    it('should return empty array for no matches', async () => {
      await createTestVideo(getTestAdapter(), { title: 'Test Video' });

      const response = await authenticatedRequest(
        app,
        'get',
        '/api/videos/search?q=nonexistent',
        authToken
      );

      expect(response.status).toBe(200);
      expect(response.body.videos).toEqual([]);
    });

    it('should return 400 when search query is missing', async () => {
      const response = await authenticatedRequest(app, 'get', '/api/videos/search', authToken);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PATCH /api/videos/:id/metadata', () => {
    it('should update video metadata (200)', async () => {
      const testVideo = await createTestVideo(getTestAdapter(), {
        title: 'Original Title',
        customMetadata: { category: 'education' },
      });

      const response = await authenticatedRequest(
        app,
        'patch',
        `/api/videos/${testVideo.id}/metadata`,
        authToken
      ).send({
        title: 'Updated Title',
        customMetadata: { category: 'entertainment', rating: 5 },
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('title', 'Updated Title');
      expect(response.body.customMetadata).toHaveProperty('category', 'entertainment');
      expect(response.body.customMetadata).toHaveProperty('rating', 5);
    });

    it('should return 404 for non-existent video', async () => {
      const response = await authenticatedRequest(
        app,
        'patch',
        '/api/videos/99999/metadata',
        authToken
      ).send({
        title: 'New Title',
      });

      expect(response.status).toBe(404);
    });

    it('should return 401 without authentication', async () => {
      const testVideo = await createTestVideo(getTestAdapter());

      const response = await request(app)
        .patch(`/api/videos/${testVideo.id}/metadata`)
        .send({ title: 'New Title' });

      expect(response.status).toBe(401);
    });

    it('should validate metadata format (400)', async () => {
      const testVideo = await createTestVideo(getTestAdapter());

      const response = await authenticatedRequest(
        app,
        'patch',
        `/api/videos/${testVideo.id}/metadata`,
        authToken
      ).send({
        customMetadata: 'invalid-not-an-object', // Should be object
      });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/videos/:id', () => {
    it('should delete video (soft delete) (200)', async () => {
      const testVideo = await createTestVideo(getTestAdapter());

      const response = await authenticatedRequest(
        app,
        'delete',
        `/api/videos/${testVideo.id}`,
        authToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');

      // Verify video is soft deleted (not in regular list)
      const listResponse = await authenticatedRequest(app, 'get', '/api/videos', authToken);
      expect(listResponse.body.videos).toHaveLength(0);
    });

    it('should return 404 for non-existent video', async () => {
      const response = await authenticatedRequest(app, 'delete', '/api/videos/99999', authToken);

      expect(response.status).toBe(404);
    });

    it('should return 401 without authentication', async () => {
      const testVideo = await createTestVideo(getTestAdapter());

      const response = await request(app).delete(`/api/videos/${testVideo.id}`);

      expect(response.status).toBe(401);
    });
  });
});
