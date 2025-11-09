/**
 * AuthService Unit Tests
 *
 * Tests authentication operations including user creation, login,
 * password hashing, and token generation/validation.
 */

import { AuthService } from '../AuthService';
import { DatabaseAdapter } from '../../adapters/DatabaseAdapter';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  let authService: AuthService;
  let mockAdapter: jest.Mocked<DatabaseAdapter>;
  const jwtSecret = 'test-secret';

  beforeEach(() => {
    // Create mock adapter
    mockAdapter = {
      query: jest.fn(),
      execute: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      runMigrations: jest.fn(),
      getMigrationHistory: jest.fn(),
    } as unknown as jest.Mocked<DatabaseAdapter>;

    // Create service instance
    authService = new AuthService(mockAdapter, {
      jwtSecret,
      tokenExpirationSeconds: 3600,
      bcryptRounds: 10,
    });

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    const validInput = {
      username: 'testuser',
      password: 'Password123!',
    };

    it('should create a new user with hashed password', async () => {
      const hashedPassword = 'hashed_password';
      const userId = 1;

      // Mock bcrypt.hash
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      // Mock database response
      // First call: Username existence check returns empty
      mockAdapter.query.mockResolvedValueOnce([]);
      // Second call: Returns the created user row
      mockAdapter.query.mockResolvedValueOnce([
        {
          id: userId,
          username: validInput.username,
          password_hash: hashedPassword,
          created_at: new Date(),
          last_login: null,
        },
      ]);
      mockAdapter.execute.mockResolvedValue({ affectedRows: 1, insertId: userId });

      const result = await authService.createUser(validInput);

      // Verify bcrypt was called with correct parameters
      expect(bcrypt.hash).toHaveBeenCalledWith(validInput.password, 10);

      // Verify result
      expect(result).toEqual({
        id: userId,
        username: validInput.username,
        createdAt: expect.any(Date),
        lastLogin: null,
      });
    });

    it('should throw error when username already exists', async () => {
      // Username existence check returns existing user
      mockAdapter.query.mockResolvedValueOnce([{ id: 1 }]);

      await expect(authService.createUser(validInput)).rejects.toThrow('Username already exists');
    });

    it('should throw ValidationError for invalid username', async () => {
      await expect(
        authService.createUser({ username: '', password: 'Password123!' })
      ).rejects.toThrow('Username must be a non-empty string');
    });

    it('should throw ValidationError for weak password', async () => {
      await expect(
        authService.createUser({ username: 'testuser', password: '123' })
      ).rejects.toThrow('Password must be at least 8 characters');
    });
  });

  describe('login', () => {
    const credentials = {
      username: 'testuser',
      password: 'Password123!',
    };

    it('should return token and user info for valid credentials', async () => {
      const userRow = {
        id: 1,
        username: credentials.username,
        password_hash: 'hashed_password',
        created_at: new Date(),
        last_login: null,
      };

      const token = 'generated_token';

      mockAdapter.query.mockResolvedValue([userRow]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue(token);
      mockAdapter.execute.mockResolvedValue({ affectedRows: 1 });

      const result = await authService.login(credentials);

      expect(mockAdapter.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM users WHERE username'),
        [credentials.username]
      );

      expect(bcrypt.compare).toHaveBeenCalledWith(credentials.password, userRow.password_hash);

      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: userRow.id, username: userRow.username },
        jwtSecret,
        { expiresIn: 3600 }
      );

      expect(result).toEqual({
        token,
        user: {
          id: userRow.id,
          username: userRow.username,
          createdAt: userRow.created_at,
          lastLogin: expect.any(Date),
        },
      });
    });

    it('should throw error for non-existent user', async () => {
      mockAdapter.query.mockResolvedValue([]);

      await expect(authService.login(credentials)).rejects.toThrow('Invalid username or password');
    });

    it('should throw error for incorrect password', async () => {
      mockAdapter.query.mockResolvedValue([
        {
          id: 1,
          username: credentials.username,
          password_hash: 'hashed_password',
          created_at: new Date(),
          last_login: null,
        },
      ]);

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(credentials)).rejects.toThrow('Invalid username or password');
    });
  });

  describe('validateToken', () => {
    it('should return user info for valid token', async () => {
      const token = 'valid_token';
      const decoded = {
        userId: 1,
        username: 'testuser',
      };

      const userRow = {
        id: 1,
        username: 'testuser',
        password_hash: 'hash',
        created_at: new Date(),
        last_login: null,
      };

      (jwt.verify as jest.Mock).mockReturnValue(decoded);
      mockAdapter.query.mockResolvedValue([userRow]);

      const result = await authService.validateToken(token);

      expect(jwt.verify).toHaveBeenCalledWith(token, jwtSecret);
      expect(result).toEqual({
        id: userRow.id,
        username: userRow.username,
        createdAt: userRow.created_at,
        lastLogin: null,
      });
    });

    it('should return null for invalid token', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('invalid token');
      });

      const result = await authService.validateToken('invalid_token');

      expect(result).toBeNull();
    });

    it('should return null when user no longer exists', async () => {
      const decoded = {
        userId: 1,
        username: 'testuser',
      };

      (jwt.verify as jest.Mock).mockReturnValue(decoded);
      mockAdapter.query.mockResolvedValue([]);

      const result = await authService.validateToken('valid_token');

      expect(result).toBeNull();
    });
  });

  describe('changePassword', () => {
    const input = {
      userId: 1,
      oldPassword: 'OldPassword123!',
      newPassword: 'NewPassword456!',
    };

    it('should change password successfully', async () => {
      const userRow = {
        id: input.userId,
        username: 'testuser',
        password_hash: 'old_hash',
        created_at: new Date(),
        last_login: null,
      };

      const newHash = 'new_hash';

      mockAdapter.query.mockResolvedValue([userRow]);
      // First call: verify old password is correct
      // Second call: check if new password is different from old
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true).mockResolvedValueOnce(false);
      (bcrypt.hash as jest.Mock).mockResolvedValue(newHash);
      mockAdapter.execute.mockResolvedValue({ affectedRows: 1 });

      await authService.changePassword(input);

      expect(bcrypt.compare).toHaveBeenCalledWith(input.oldPassword, userRow.password_hash);

      expect(bcrypt.hash).toHaveBeenCalledWith(input.newPassword, 10);

      expect(mockAdapter.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET password_hash'),
        [newHash, input.userId]
      );
    });

    it('should throw error for incorrect current password', async () => {
      mockAdapter.query.mockResolvedValue([
        {
          id: input.userId,
          username: 'testuser',
          password_hash: 'old_hash',
          created_at: new Date(),
          last_login: null,
        },
      ]);

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.changePassword(input)).rejects.toThrow(
        'Current password is incorrect'
      );
    });

    it('should throw error for non-existent user', async () => {
      mockAdapter.query.mockResolvedValue([]);

      await expect(authService.changePassword(input)).rejects.toThrow('User not found');
    });
  });

  describe('getUserById', () => {
    it('should return user for existing id', async () => {
      const userRow = {
        id: 1,
        username: 'testuser',
        password_hash: 'hash',
        created_at: new Date(),
        last_login: null,
      };

      mockAdapter.query.mockResolvedValue([userRow]);

      const result = await authService.getUserById(1);

      expect(result).toEqual({
        id: userRow.id,
        username: userRow.username,
        createdAt: userRow.created_at,
        lastLogin: null,
      });
    });

    it('should return null for non-existent id', async () => {
      mockAdapter.query.mockResolvedValue([]);

      const result = await authService.getUserById(999);

      expect(result).toBeNull();
    });
  });

  describe('getUserByUsername', () => {
    it('should return user for existing username', async () => {
      const userRow = {
        id: 1,
        username: 'testuser',
        password_hash: 'hash',
        created_at: new Date(),
        last_login: null,
      };

      mockAdapter.query.mockResolvedValue([userRow]);

      const result = await authService.getUserByUsername('testuser');

      expect(result).toEqual({
        id: userRow.id,
        username: userRow.username,
        createdAt: userRow.created_at,
        lastLogin: null,
      });
    });

    it('should return null for non-existent username', async () => {
      mockAdapter.query.mockResolvedValue([]);

      const result = await authService.getUserByUsername('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('deleteUser', () => {
    it('should delete existing user', async () => {
      mockAdapter.execute.mockResolvedValue({ affectedRows: 1 });

      await authService.deleteUser(1);

      expect(mockAdapter.execute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM users WHERE id'),
        [1]
      );
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      const userRows = [
        {
          id: 1,
          username: 'user1',
          password_hash: 'hash1',
          created_at: new Date(),
          last_login: null,
        },
        {
          id: 2,
          username: 'user2',
          password_hash: 'hash2',
          created_at: new Date(),
          last_login: null,
        },
      ];

      mockAdapter.query.mockResolvedValue(userRows);

      const result = await authService.getAllUsers();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 1,
        username: 'user1',
        createdAt: expect.any(Date),
        lastLogin: null,
      });
    });

    it('should return empty array when no users exist', async () => {
      mockAdapter.query.mockResolvedValue([]);

      const result = await authService.getAllUsers();

      expect(result).toEqual([]);
    });
  });
});
