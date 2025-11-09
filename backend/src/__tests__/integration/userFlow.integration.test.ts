/**
 * End-to-End User Flow Integration Tests
 *
 * Tests complete user journeys through the application:
 * 1. Login -> Browse Videos -> Create Clip -> Add to Playlist
 * 2. Register -> Create Playlist -> Add Multiple Clips -> Reorder
 *
 * These tests verify the integration of multiple endpoints working together.
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
import { createTestVideo, authenticatedRequest } from '../setup/testHelpers';

describe('End-to-End User Flow Integration Tests', () => {
  let app: Express;
  let authService: AuthService;

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

  // Cleanup: Clear database after each test
  afterEach(async () => {
    await cleanTestDatabase(getTestAdapter());
  });

  // Teardown: Disconnect from database
  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('User Flow: Login -> Browse Videos -> Create Clip -> Add to Playlist', () => {
    it('should complete full workflow successfully', async () => {
      // Step 1: Register a new user
      const registerResponse = await request(app).post('/api/auth/register').send({
        username: 'flowuser',
        password: 'FlowPass123!',
      });

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body).toHaveProperty('token');
      const authToken = registerResponse.body.token;

      // Step 2: Create test videos in database
      await createTestVideo(getTestAdapter(), {
        title: 'Tutorial Video',
        duration: 300,
      });
      await createTestVideo(getTestAdapter(), {
        title: 'Comedy Special',
        duration: 600,
      });

      // Step 3: Browse all videos
      const videosResponse = await authenticatedRequest(app, 'get', '/api/videos', authToken);

      expect(videosResponse.status).toBe(200);
      expect(videosResponse.body.videos).toHaveLength(2);
      const selectedVideo = videosResponse.body.videos.find(
        (v: { title: string }) => v.title === 'Tutorial Video'
      );
      expect(selectedVideo).toBeDefined();

      // Step 4: Get specific video details
      const videoDetailResponse = await authenticatedRequest(
        app,
        'get',
        `/api/videos/${selectedVideo.id}`,
        authToken
      );

      expect(videoDetailResponse.status).toBe(200);
      expect(videoDetailResponse.body.title).toBe('Tutorial Video');

      // Step 5: Create a clip from the video
      const clipResponse = await authenticatedRequest(app, 'post', '/api/clips', authToken).send({
        videoId: selectedVideo.id,
        name: 'Best Part',
        description: 'The most important part of the tutorial',
        startTime: 60,
        endTime: 120,
        customMetadata: {
          category: 'highlight',
          importance: 'high',
        },
      });

      expect(clipResponse.status).toBe(201);
      expect(clipResponse.body).toHaveProperty('id');
      expect(clipResponse.body.name).toBe('Best Part');
      expect(clipResponse.body.duration).toBe(60);
      const clipId = clipResponse.body.id;

      // Step 6: Create a playlist
      const playlistResponse = await authenticatedRequest(
        app,
        'post',
        '/api/playlists',
        authToken
      ).send({
        name: 'My Favorite Clips',
        description: 'A collection of the best moments',
      });

      expect(playlistResponse.status).toBe(201);
      expect(playlistResponse.body).toHaveProperty('id');
      const playlistId = playlistResponse.body.id;

      // Step 7: Add clip to playlist
      const addClipResponse = await authenticatedRequest(
        app,
        'post',
        `/api/playlists/${playlistId}/clips`,
        authToken
      ).send({
        clipId: clipId,
      });

      expect(addClipResponse.status).toBe(201);

      // Step 8: Verify playlist contains the clip
      const playlistDetailResponse = await authenticatedRequest(
        app,
        'get',
        `/api/playlists/${playlistId}`,
        authToken
      );

      expect(playlistDetailResponse.status).toBe(200);
      expect(playlistDetailResponse.body.name).toBe('My Favorite Clips');
      expect(playlistDetailResponse.body.clips).toHaveLength(1);
      expect(playlistDetailResponse.body.clips[0].name).toBe('Best Part');

      // Step 9: Update clip metadata
      const updateClipResponse = await authenticatedRequest(
        app,
        'patch',
        `/api/clips/${clipId}/metadata`,
        authToken
      ).send({
        customMetadata: {
          category: 'highlight',
          importance: 'critical',
          reviewed: true,
        },
      });

      expect(updateClipResponse.status).toBe(200);
      expect(updateClipResponse.body.customMetadata.importance).toBe('critical');
      expect(updateClipResponse.body.customMetadata.reviewed).toBe(true);

      // Step 10: Verify the updated clip is still in the playlist
      const finalPlaylistResponse = await authenticatedRequest(
        app,
        'get',
        `/api/playlists/${playlistId}`,
        authToken
      );

      expect(finalPlaylistResponse.status).toBe(200);
      expect(finalPlaylistResponse.body.clips).toHaveLength(1);
    });
  });

  describe('User Flow: Register -> Create Playlist -> Add Multiple Clips -> Reorder', () => {
    it('should handle complex playlist management workflow', async () => {
      // Step 1: Register user
      const registerResponse = await request(app).post('/api/auth/register').send({
        username: 'playlistuser',
        password: 'PlaylistPass123!',
      });

      expect(registerResponse.status).toBe(201);
      const authToken = registerResponse.body.token;

      // Step 2: Create test video
      const testVideo = await createTestVideo(getTestAdapter(), {
        title: 'Long Documentary',
        duration: 1800, // 30 minutes
      });

      // Step 3: Create multiple clips from different parts
      const clip1Response = await authenticatedRequest(app, 'post', '/api/clips', authToken).send({
        videoId: testVideo.id,
        name: 'Introduction',
        startTime: 0,
        endTime: 60,
      });
      expect(clip1Response.status).toBe(201);
      const clip1Id = clip1Response.body.id;

      const clip2Response = await authenticatedRequest(app, 'post', '/api/clips', authToken).send({
        videoId: testVideo.id,
        name: 'Main Content',
        startTime: 300,
        endTime: 900,
      });
      expect(clip2Response.status).toBe(201);
      const clip2Id = clip2Response.body.id;

      const clip3Response = await authenticatedRequest(app, 'post', '/api/clips', authToken).send({
        videoId: testVideo.id,
        name: 'Conclusion',
        startTime: 1500,
        endTime: 1800,
      });
      expect(clip3Response.status).toBe(201);
      const clip3Id = clip3Response.body.id;

      // Step 4: Create a playlist
      const playlistResponse = await authenticatedRequest(
        app,
        'post',
        '/api/playlists',
        authToken
      ).send({
        name: 'Documentary Highlights',
        description: 'Key moments from the documentary',
      });
      expect(playlistResponse.status).toBe(201);
      const playlistId = playlistResponse.body.id;

      // Step 5: Add clips to playlist in order
      await authenticatedRequest(app, 'post', `/api/playlists/${playlistId}/clips`, authToken).send(
        {
          clipId: clip1Id,
          order: 0,
        }
      );

      await authenticatedRequest(app, 'post', `/api/playlists/${playlistId}/clips`, authToken).send(
        {
          clipId: clip2Id,
          order: 1,
        }
      );

      await authenticatedRequest(app, 'post', `/api/playlists/${playlistId}/clips`, authToken).send(
        {
          clipId: clip3Id,
          order: 2,
        }
      );

      // Step 6: Verify initial order
      const initialPlaylistResponse = await authenticatedRequest(
        app,
        'get',
        `/api/playlists/${playlistId}`,
        authToken
      );

      expect(initialPlaylistResponse.status).toBe(200);
      expect(initialPlaylistResponse.body.clips).toHaveLength(3);
      expect(initialPlaylistResponse.body.clips[0].name).toBe('Introduction');
      expect(initialPlaylistResponse.body.clips[1].name).toBe('Main Content');
      expect(initialPlaylistResponse.body.clips[2].name).toBe('Conclusion');

      // Step 7: Reorder clips (reverse order)
      const reorderResponse = await authenticatedRequest(
        app,
        'patch',
        `/api/playlists/${playlistId}/reorder`,
        authToken
      ).send({
        clipOrders: [
          { clipId: clip3Id, order: 0 },
          { clipId: clip2Id, order: 1 },
          { clipId: clip1Id, order: 2 },
        ],
      });

      expect(reorderResponse.status).toBe(200);

      // Step 8: Verify new order
      const reorderedPlaylistResponse = await authenticatedRequest(
        app,
        'get',
        `/api/playlists/${playlistId}`,
        authToken
      );

      expect(reorderedPlaylistResponse.status).toBe(200);
      expect(reorderedPlaylistResponse.body.clips[0].name).toBe('Conclusion');
      expect(reorderedPlaylistResponse.body.clips[1].name).toBe('Main Content');
      expect(reorderedPlaylistResponse.body.clips[2].name).toBe('Introduction');

      // Step 9: Remove middle clip
      const removeResponse = await authenticatedRequest(
        app,
        'delete',
        `/api/playlists/${playlistId}/clips/${clip2Id}`,
        authToken
      );

      expect(removeResponse.status).toBe(200);

      // Step 10: Verify final playlist state
      const finalPlaylistResponse = await authenticatedRequest(
        app,
        'get',
        `/api/playlists/${playlistId}`,
        authToken
      );

      expect(finalPlaylistResponse.status).toBe(200);
      expect(finalPlaylistResponse.body.clips).toHaveLength(2);
      expect(finalPlaylistResponse.body.clips[0].name).toBe('Conclusion');
      expect(finalPlaylistResponse.body.clips[1].name).toBe('Introduction');
    });
  });

  describe('User Flow: Authentication Edge Cases', () => {
    it('should reject unauthenticated access at each step', async () => {
      // Create some test data
      const video = await createTestVideo(getTestAdapter());

      // Try to access videos without auth
      const videosResponse = await request(app).get('/api/videos');
      expect(videosResponse.status).toBe(401);

      // Try to create clip without auth
      const clipResponse = await request(app).post('/api/clips').send({
        videoId: video.id,
        name: 'Test',
        startTime: 0,
        endTime: 10,
      });
      expect(clipResponse.status).toBe(401);

      // Try to create playlist without auth
      const playlistResponse = await request(app).post('/api/playlists').send({
        name: 'Test Playlist',
      });
      expect(playlistResponse.status).toBe(401);
    });

    it('should maintain session across multiple requests', async () => {
      // Register and get token
      const registerResponse = await request(app).post('/api/auth/register').send({
        username: 'sessionuser',
        password: 'SessionPass123!',
      });

      const authToken = registerResponse.body.token;

      // Make multiple requests with same token
      for (let i = 0; i < 5; i++) {
        const response = await authenticatedRequest(app, 'get', '/api/auth/me', authToken);
        expect(response.status).toBe(200);
        expect(response.body.username).toBe('sessionuser');
      }
    });
  });
});
