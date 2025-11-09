/**
 * Authentication Integration Tests
 *
 * Tests authentication endpoints with real database and HTTP layer.
 * Tests user registration, login, token validation, and authentication errors.
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
import { createTestUser } from '../setup/testHelpers';

describe('Authentication Integration Tests', () => {
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

  describe('POST /api/auth/register', () => {
    it('should register a new user and return 201 with token', async () => {
      const response = await request(app).post('/api/auth/register').send({
        username: 'newuser',
        password: 'SecurePass123!',
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.username).toBe('newuser');
      expect(response.body.user).not.toHaveProperty('passwordHash');
      expect(response.body.user).not.toHaveProperty('password_hash');
    });

    it('should return 400 for invalid username (empty)', async () => {
      const response = await request(app).post('/api/auth/register').send({
        username: '',
        password: 'SecurePass123!',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('username');
    });

    it('should return 400 for weak password', async () => {
      const response = await request(app).post('/api/auth/register').send({
        username: 'testuser',
        password: '123',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('password');
    });

    it('should return 400 when username already exists', async () => {
      // Create first user
      await createTestUser(app, 'existinguser', 'Pass123!');

      // Try to create duplicate
      const response = await request(app).post('/api/auth/register').send({
        username: 'existinguser',
        password: 'AnotherPass123!',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials and return 200 with token', async () => {
      // Create test user
      const testUser = await createTestUser(app, 'loginuser', 'LoginPass123!');

      // Login
      const response = await request(app).post('/api/auth/login').send({
        username: 'loginuser',
        password: 'LoginPass123!',
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.id).toBe(testUser.id);
      expect(response.body.user.username).toBe('loginuser');
    });

    it('should return 401 for non-existent user', async () => {
      const response = await request(app).post('/api/auth/login').send({
        username: 'nonexistent',
        password: 'SomePass123!',
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 for incorrect password', async () => {
      // Create test user
      await createTestUser(app, 'testuser', 'CorrectPass123!');

      // Try wrong password
      const response = await request(app).post('/api/auth/login').send({
        username: 'testuser',
        password: 'WrongPass123!',
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for missing credentials', async () => {
      const response = await request(app).post('/api/auth/login').send({
        username: 'testuser',
        // Missing password
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user with valid token (200)', async () => {
      // Create and login user
      const testUser = await createTestUser(app, 'meuser', 'MePass123!');

      // Get current user
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testUser.id);
      expect(response.body).toHaveProperty('username', 'meuser');
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('should return 401 without authorization header', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token-here');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 with malformed authorization header', async () => {
      const response = await request(app).get('/api/auth/me').set('Authorization', 'InvalidFormat');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('should change password with valid credentials (200)', async () => {
      // Create user
      const testUser = await createTestUser(app, 'changeuser', 'OldPass123!');

      // Change password
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          oldPassword: 'OldPass123!',
          newPassword: 'NewPass456!',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');

      // Verify can login with new password
      const loginResponse = await request(app).post('/api/auth/login').send({
        username: 'changeuser',
        password: 'NewPass456!',
      });

      expect(loginResponse.status).toBe(200);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).post('/api/auth/change-password').send({
        oldPassword: 'OldPass123!',
        newPassword: 'NewPass456!',
      });

      expect(response.status).toBe(401);
    });

    it('should return 400 for incorrect old password', async () => {
      const testUser = await createTestUser(app, 'testuser', 'CurrentPass123!');

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          oldPassword: 'WrongOldPass123!',
          newPassword: 'NewPass456!',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for weak new password', async () => {
      const testUser = await createTestUser(app, 'testuser', 'CurrentPass123!');

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          oldPassword: 'CurrentPass123!',
          newPassword: '123', // Too weak
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
});
