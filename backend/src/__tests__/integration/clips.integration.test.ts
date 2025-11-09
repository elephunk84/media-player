/**
 * Clips Integration Tests
 *
 * Tests clip endpoints with real database and HTTP layer.
 * Tests clip creation, retrieval, metadata updates, and validation.
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
  authenticatedRequest,
} from '../setup/testHelpers';

describe('Clips Integration Tests', () => {
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

  describe('POST /api/clips', () => {
    it('should create clip with valid data (201)', async () => {
      const testVideo = await createTestVideo(getTestAdapter(), { duration: 120 });

      const response = await authenticatedRequest(app, 'post', '/api/clips', authToken).send({
        videoId: testVideo.id,
        name: 'Test Clip',
        description: 'A test clip',
        startTime: 10,
        endTime: 30,
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'Test Clip');
      expect(response.body).toHaveProperty('startTime', 10);
      expect(response.body).toHaveProperty('endTime', 30);
      expect(response.body).toHaveProperty('duration', 20);
    });

    it('should return 400 when startTime >= endTime', async () => {
      const testVideo = await createTestVideo(getTestAdapter());

      const response = await authenticatedRequest(app, 'post', '/api/clips', authToken).send({
        videoId: testVideo.id,
        name: 'Invalid Clip',
        startTime: 50,
        endTime: 30, // End before start
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/start.*end/i);
    });

    it('should return 400 when times exceed video duration', async () => {
      const testVideo = await createTestVideo(getTestAdapter(), { duration: 120 });

      const response = await authenticatedRequest(app, 'post', '/api/clips', authToken).send({
        videoId: testVideo.id,
        name: 'Out of Bounds',
        startTime: 100,
        endTime: 200, // Exceeds 120s duration
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/duration|exceed/i);
    });

    it('should return 404 for non-existent video', async () => {
      const response = await authenticatedRequest(app, 'post', '/api/clips', authToken).send({
        videoId: 99999,
        name: 'Test Clip',
        startTime: 10,
        endTime: 30,
      });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 without authentication', async () => {
      const testVideo = await createTestVideo(getTestAdapter());

      const response = await request(app).post('/api/clips').send({
        videoId: testVideo.id,
        name: 'Test Clip',
        startTime: 10,
        endTime: 30,
      });

      expect(response.status).toBe(401);
    });

    it('should accept custom metadata at creation', async () => {
      const testVideo = await createTestVideo(getTestAdapter());

      const response = await authenticatedRequest(app, 'post', '/api/clips', authToken).send({
        videoId: testVideo.id,
        name: 'Clip with Metadata',
        startTime: 10,
        endTime: 30,
        customMetadata: {
          category: 'highlight',
          rating: 5,
        },
      });

      expect(response.status).toBe(201);
      expect(response.body.customMetadata).toHaveProperty('category', 'highlight');
      expect(response.body.customMetadata).toHaveProperty('rating', 5);
    });
  });

  describe('GET /api/clips/:id', () => {
    it('should return clip by ID (200)', async () => {
      const testVideo = await createTestVideo(getTestAdapter());
      const testClip = await createTestClip(getTestAdapter(), {
        videoId: testVideo.id!,
        name: 'Test Clip',
        startTime: 10,
        endTime: 30,
      });

      const response = await authenticatedRequest(
        app,
        'get',
        `/api/clips/${testClip.id}`,
        authToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testClip.id);
      expect(response.body).toHaveProperty('name', 'Test Clip');
      expect(response.body).toHaveProperty('videoId', testVideo.id);
    });

    it('should return 404 for non-existent clip', async () => {
      const response = await authenticatedRequest(app, 'get', '/api/clips/99999', authToken);

      expect(response.status).toBe(404);
    });

    it('should return 401 without authentication', async () => {
      const testVideo = await createTestVideo(getTestAdapter());
      const testClip = await createTestClip(getTestAdapter(), { videoId: testVideo.id! });

      const response = await request(app).get(`/api/clips/${testClip.id}`);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/clips', () => {
    it('should return all clips (200)', async () => {
      const video1 = await createTestVideo(getTestAdapter(), { title: 'Video 1' });
      const video2 = await createTestVideo(getTestAdapter(), { title: 'Video 2' });

      await createTestClip(getTestAdapter(), { videoId: video1.id!, name: 'Clip 1' });
      await createTestClip(getTestAdapter(), { videoId: video2.id!, name: 'Clip 2' });

      const response = await authenticatedRequest(app, 'get', '/api/clips', authToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('clips');
      expect(Array.isArray(response.body.clips)).toBe(true);
      expect(response.body.clips).toHaveLength(2);
    });

    it('should filter clips by videoId', async () => {
      const video1 = await createTestVideo(getTestAdapter());
      const video2 = await createTestVideo(getTestAdapter());

      await createTestClip(getTestAdapter(), { videoId: video1.id!, name: 'Video 1 Clip' });
      await createTestClip(getTestAdapter(), { videoId: video2.id!, name: 'Video 2 Clip' });

      const response = await authenticatedRequest(
        app,
        'get',
        `/api/clips?videoId=${video1.id}`,
        authToken
      );

      expect(response.status).toBe(200);
      expect(response.body.clips).toHaveLength(1);
      expect(response.body.clips[0].name).toBe('Video 1 Clip');
    });
  });

  describe('PATCH /api/clips/:id/metadata', () => {
    it('should update clip custom metadata (200)', async () => {
      const testVideo = await createTestVideo(getTestAdapter());
      const testClip = await createTestClip(getTestAdapter(), { videoId: testVideo.id! });

      const response = await authenticatedRequest(
        app,
        'patch',
        `/api/clips/${testClip.id}/metadata`,
        authToken
      ).send({
        customMetadata: {
          scene: 'opening',
          importance: 'high',
        },
      });

      expect(response.status).toBe(200);
      expect(response.body.customMetadata).toHaveProperty('scene', 'opening');
      expect(response.body.customMetadata).toHaveProperty('importance', 'high');
    });

    it('should not allow modifying inherited metadata', async () => {
      const testVideo = await createTestVideo(getTestAdapter());
      const testClip = await createTestClip(getTestAdapter(), { videoId: testVideo.id! });

      // Try to update with inheritedMetadata (should only accept customMetadata)
      const response = await authenticatedRequest(
        app,
        'patch',
        `/api/clips/${testClip.id}/metadata`,
        authToken
      ).send({
        customMetadata: { valid: 'data' },
        inheritedMetadata: { invalid: 'should not work' }, // Should be ignored
      });

      expect(response.status).toBe(200);
      // Only customMetadata should be updated
      expect(response.body.customMetadata).toHaveProperty('valid', 'data');
    });

    it('should return 404 for non-existent clip', async () => {
      const response = await authenticatedRequest(
        app,
        'patch',
        '/api/clips/99999/metadata',
        authToken
      ).send({
        customMetadata: { test: 'data' },
      });

      expect(response.status).toBe(404);
    });

    it('should return 401 without authentication', async () => {
      const testVideo = await createTestVideo(getTestAdapter());
      const testClip = await createTestClip(getTestAdapter(), { videoId: testVideo.id! });

      const response = await request(app)
        .patch(`/api/clips/${testClip.id}/metadata`)
        .send({ customMetadata: { test: 'data' } });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/clips/:id', () => {
    it('should delete clip (200)', async () => {
      const testVideo = await createTestVideo(getTestAdapter());
      const testClip = await createTestClip(getTestAdapter(), { videoId: testVideo.id! });

      const response = await authenticatedRequest(
        app,
        'delete',
        `/api/clips/${testClip.id}`,
        authToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');

      // Verify clip is deleted
      const getResponse = await authenticatedRequest(
        app,
        'get',
        `/api/clips/${testClip.id}`,
        authToken
      );
      expect(getResponse.status).toBe(404);
    });

    it('should return 404 for non-existent clip', async () => {
      const response = await authenticatedRequest(app, 'delete', '/api/clips/99999', authToken);

      expect(response.status).toBe(404);
    });

    it('should return 401 without authentication', async () => {
      const testVideo = await createTestVideo(getTestAdapter());
      const testClip = await createTestClip(getTestAdapter(), { videoId: testVideo.id! });

      const response = await request(app).delete(`/api/clips/${testClip.id}`);

      expect(response.status).toBe(401);
    });
  });
});
