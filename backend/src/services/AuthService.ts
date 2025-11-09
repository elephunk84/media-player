/**
 * AuthService
 *
 * Handles authentication and authorization operations including user creation,
 * login, password management, and JWT token validation.
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { DatabaseAdapter } from '../adapters/DatabaseAdapter';
import {
  User,
  UserPublic,
  UserRow,
  CreateUserInput,
  LoginCredentials,
  ChangePasswordInput,
  AuthResponse,
} from '../models';
import { ValidationError } from '../utils/validation';

/**
 * JWT payload structure
 */
interface JWTPayload {
  userId: number;
  username: string;
  iat?: number;
  exp?: number;
}

/**
 * Configuration for AuthService
 */
export interface AuthServiceConfig {
  /**
   * JWT secret key (from environment variable JWT_SECRET)
   */
  jwtSecret: string;

  /**
   * Token expiration time in seconds
   * Default: 86400 (24 hours)
   */
  tokenExpirationSeconds?: number;

  /**
   * Bcrypt salt rounds
   * Default: 12
   */
  bcryptRounds?: number;
}

/**
 * AuthService class for authentication and authorization
 *
 * Provides secure user authentication with bcrypt password hashing
 * and JWT token-based authorization.
 *
 * Security features:
 * - Passwords hashed with bcrypt (12 rounds)
 * - JWT tokens with configurable expiration (default 24 hours)
 * - Generic error messages for login failures
 * - Password hashes never exposed in API responses
 * - Constant-time password comparison via bcrypt
 *
 * @example
 * ```typescript
 * const authService = new AuthService(adapter, {
 *   jwtSecret: process.env.JWT_SECRET || 'dev-secret',
 *   tokenExpirationSeconds: 86400, // 24 hours
 * });
 *
 * // Create a new user
 * const user = await authService.createUser({
 *   username: 'john',
 *   password: 'SecurePass123!',
 * });
 *
 * // Login
 * const authResponse = await authService.login({
 *   username: 'john',
 *   password: 'SecurePass123!',
 * });
 *
 * // Validate token
 * const user = await authService.validateToken(authResponse.token);
 * ```
 */
export class AuthService {
  private adapter: DatabaseAdapter;
  private jwtSecret: string;
  private tokenExpirationSeconds: number;
  private bcryptRounds: number;

  /**
   * Create a new AuthService
   *
   * @param adapter - Database adapter instance
   * @param config - Authentication configuration
   * @throws Error if JWT secret is not provided
   */
  constructor(adapter: DatabaseAdapter, config: AuthServiceConfig) {
    if (!config.jwtSecret || config.jwtSecret.trim() === '') {
      throw new Error('JWT_SECRET must be provided and cannot be empty');
    }

    this.adapter = adapter;
    this.jwtSecret = config.jwtSecret;
    this.tokenExpirationSeconds = config.tokenExpirationSeconds ?? 86400; // 24 hours default
    this.bcryptRounds = config.bcryptRounds ?? 12; // 12 rounds default
  }

  /**
   * Convert database row to User model
   *
   * @param row - Database row from users table
   * @returns User model with camelCase fields
   */
  private rowToUser(row: UserRow): User {
    return {
      id: row.id,
      username: row.username,
      passwordHash: row.password_hash,
      createdAt: new Date(row.created_at),
      lastLogin: row.last_login ? new Date(row.last_login) : null,
    };
  }

  /**
   * Convert User to UserPublic (remove sensitive fields)
   *
   * @param user - Full user object
   * @returns UserPublic object without password hash
   */
  private userToPublic(user: User): UserPublic {
    return {
      id: user.id,
      username: user.username,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    };
  }

  /**
   * Validate username format
   *
   * @param username - Username to validate
   * @throws ValidationError if username is invalid
   */
  private validateUsername(username: string): void {
    if (!username || typeof username !== 'string') {
      throw new ValidationError('Username must be a non-empty string');
    }

    const trimmed = username.trim();
    if (trimmed.length === 0) {
      throw new ValidationError('Username cannot be empty');
    }

    if (trimmed.length < 3) {
      throw new ValidationError('Username must be at least 3 characters long');
    }

    if (trimmed.length > 50) {
      throw new ValidationError('Username cannot exceed 50 characters');
    }

    // Only allow alphanumeric characters, underscores, and hyphens
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(trimmed)) {
      throw new ValidationError(
        'Username can only contain letters, numbers, underscores, and hyphens'
      );
    }
  }

  /**
   * Validate password strength
   *
   * @param password - Password to validate
   * @throws ValidationError if password is invalid
   */
  private validatePassword(password: string): void {
    if (!password || typeof password !== 'string') {
      throw new ValidationError('Password must be a non-empty string');
    }

    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }

    if (password.length > 128) {
      throw new ValidationError('Password cannot exceed 128 characters');
    }

    // Require at least one uppercase, one lowercase, one number
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasUppercase || !hasLowercase || !hasNumber) {
      throw new ValidationError(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      );
    }
  }

  /**
   * Hash a password using bcrypt
   *
   * @param password - Plain text password
   * @returns Hashed password
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.bcryptRounds);
  }

  /**
   * Verify a password against a hash using bcrypt
   *
   * Uses constant-time comparison to prevent timing attacks.
   *
   * @param password - Plain text password
   * @param hash - Bcrypt hash to compare against
   * @returns True if password matches hash, false otherwise
   */
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate a JWT token for a user
   *
   * @param user - User to generate token for
   * @returns JWT token string
   */
  private generateToken(user: User): string {
    const payload: JWTPayload = {
      userId: user.id,
      username: user.username,
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.tokenExpirationSeconds,
    });
  }

  /**
   * Verify and decode a JWT token
   *
   * @param token - JWT token to verify
   * @returns Decoded payload or null if invalid
   */
  private verifyToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as JWTPayload;
      return decoded;
    } catch (error) {
      // Token is invalid, expired, or malformed
      return null;
    }
  }

  /**
   * Create a new user account
   *
   * Validates username and password, checks for uniqueness, and stores
   * the user with a bcrypt-hashed password.
   *
   * @param input - User creation data (username and plain text password)
   * @returns UserPublic object (without password hash)
   * @throws ValidationError if username or password is invalid
   * @throws Error if username already exists
   *
   * @example
   * ```typescript
   * const user = await authService.createUser({
   *   username: 'john',
   *   password: 'SecurePass123!',
   * });
   * console.log(`Created user: ${user.username}`);
   * ```
   */
  async createUser(input: CreateUserInput): Promise<UserPublic> {
    // Validate input
    this.validateUsername(input.username);
    this.validatePassword(input.password);

    const username = input.username.trim();

    // Check if username already exists
    const existing = await this.adapter.query<UserRow>('SELECT id FROM users WHERE username = ?', [
      username,
    ]);

    if (existing.length > 0) {
      throw new ValidationError('Username already exists');
    }

    // Hash password
    const passwordHash = await this.hashPassword(input.password);

    // Insert user
    const result = await this.adapter.execute(
      'INSERT INTO users (username, password_hash, created_at, last_login) VALUES (?, ?, NOW(), NULL)',
      [username, passwordHash]
    );

    if (!result.insertId) {
      throw new Error('Failed to create user: no insert ID returned');
    }

    // Fetch and return the created user
    const rows = await this.adapter.query<UserRow>('SELECT * FROM users WHERE id = ?', [
      result.insertId,
    ]);

    if (rows.length === 0) {
      throw new Error('Failed to retrieve created user');
    }

    const user = this.rowToUser(rows[0]);
    return this.userToPublic(user);
  }

  /**
   * Authenticate a user and generate a JWT token
   *
   * Validates username and password credentials. Returns a JWT token
   * and user information if authentication succeeds.
   *
   * For security, returns a generic error message on failure (doesn't
   * indicate whether username or password was incorrect).
   *
   * @param credentials - Login credentials
   * @returns AuthResponse with JWT token and user info
   * @throws ValidationError if credentials are invalid (generic message)
   *
   * @example
   * ```typescript
   * const authResponse = await authService.login({
   *   username: 'john',
   *   password: 'SecurePass123!',
   * });
   * console.log(`Token: ${authResponse.token}`);
   * console.log(`User: ${authResponse.user.username}`);
   * ```
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Validate input format
    if (!credentials.username || !credentials.password) {
      throw new ValidationError('Invalid username or password');
    }

    const username = credentials.username.trim();

    // Fetch user by username
    const rows = await this.adapter.query<UserRow>('SELECT * FROM users WHERE username = ?', [
      username,
    ]);

    // User not found - return generic error for security
    if (rows.length === 0) {
      throw new ValidationError('Invalid username or password');
    }

    const user = this.rowToUser(rows[0]);

    // Verify password using bcrypt.compare (constant-time comparison)
    const isPasswordValid = await this.verifyPassword(credentials.password, user.passwordHash);

    if (!isPasswordValid) {
      // Password incorrect - return generic error for security
      throw new ValidationError('Invalid username or password');
    }

    // Update last login timestamp
    await this.adapter.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    // Update user object with new last login
    user.lastLogin = new Date();

    // Generate JWT token
    const token = this.generateToken(user);

    // Return token and public user info
    return {
      token,
      user: this.userToPublic(user),
    };
  }

  /**
   * Validate a JWT token and return the associated user
   *
   * Verifies the JWT signature and expiration, then fetches the user
   * from the database.
   *
   * @param token - JWT token to validate
   * @returns UserPublic object if token is valid, null otherwise
   *
   * @example
   * ```typescript
   * const user = await authService.validateToken(token);
   * if (user) {
   *   console.log(`Authenticated as: ${user.username}`);
   * } else {
   *   console.log('Invalid or expired token');
   * }
   * ```
   */
  async validateToken(token: string): Promise<UserPublic | null> {
    // Verify and decode token
    const payload = this.verifyToken(token);

    if (!payload) {
      return null;
    }

    // Fetch user from database to ensure they still exist
    const rows = await this.adapter.query<UserRow>('SELECT * FROM users WHERE id = ?', [
      payload.userId,
    ]);

    if (rows.length === 0) {
      // User no longer exists
      return null;
    }

    const user = this.rowToUser(rows[0]);
    return this.userToPublic(user);
  }

  /**
   * Change a user's password
   *
   * Validates the old password, then updates to the new hashed password.
   * Requires the user to provide their current password for security.
   *
   * @param input - Change password data
   * @throws ValidationError if old password is incorrect or new password is invalid
   * @throws Error if user not found
   *
   * @example
   * ```typescript
   * await authService.changePassword({
   *   userId: 1,
   *   oldPassword: 'OldPass123!',
   *   newPassword: 'NewSecurePass456!',
   * });
   * console.log('Password changed successfully');
   * ```
   */
  async changePassword(input: ChangePasswordInput): Promise<void> {
    // Validate new password
    this.validatePassword(input.newPassword);

    // Fetch user
    const rows = await this.adapter.query<UserRow>('SELECT * FROM users WHERE id = ?', [
      input.userId,
    ]);

    if (rows.length === 0) {
      throw new Error('User not found');
    }

    const user = this.rowToUser(rows[0]);

    // Verify old password
    const isOldPasswordValid = await this.verifyPassword(input.oldPassword, user.passwordHash);

    if (!isOldPasswordValid) {
      throw new ValidationError('Current password is incorrect');
    }

    // Ensure new password is different from old password
    const isSamePassword = await this.verifyPassword(input.newPassword, user.passwordHash);

    if (isSamePassword) {
      throw new ValidationError('New password must be different from current password');
    }

    // Hash new password
    const newPasswordHash = await this.hashPassword(input.newPassword);

    // Update password in database
    const result = await this.adapter.execute('UPDATE users SET password_hash = ? WHERE id = ?', [
      newPasswordHash,
      input.userId,
    ]);

    if (result.affectedRows === 0) {
      throw new Error('Failed to update password');
    }
  }

  /**
   * Get a user by ID (for internal use)
   *
   * @param userId - User ID
   * @returns UserPublic object or null if not found
   *
   * @example
   * ```typescript
   * const user = await authService.getUserById(1);
   * if (user) {
   *   console.log(`Found user: ${user.username}`);
   * }
   * ```
   */
  async getUserById(userId: number): Promise<UserPublic | null> {
    const rows = await this.adapter.query<UserRow>('SELECT * FROM users WHERE id = ?', [userId]);

    if (rows.length === 0) {
      return null;
    }

    const user = this.rowToUser(rows[0]);
    return this.userToPublic(user);
  }

  /**
   * Get a user by username (for internal use)
   *
   * @param username - Username
   * @returns UserPublic object or null if not found
   *
   * @example
   * ```typescript
   * const user = await authService.getUserByUsername('john');
   * if (user) {
   *   console.log(`Found user: ${user.username}`);
   * }
   * ```
   */
  async getUserByUsername(username: string): Promise<UserPublic | null> {
    const rows = await this.adapter.query<UserRow>('SELECT * FROM users WHERE username = ?', [
      username.trim(),
    ]);

    if (rows.length === 0) {
      return null;
    }

    const user = this.rowToUser(rows[0]);
    return this.userToPublic(user);
  }

  /**
   * Delete a user account
   *
   * Permanently removes a user from the database.
   *
   * @param userId - User ID to delete
   * @throws Error if user not found
   *
   * @example
   * ```typescript
   * await authService.deleteUser(1);
   * console.log('User deleted successfully');
   * ```
   */
  async deleteUser(userId: number): Promise<void> {
    const result = await this.adapter.execute('DELETE FROM users WHERE id = ?', [userId]);

    if (result.affectedRows === 0) {
      throw new Error('User not found');
    }
  }

  /**
   * Get all users (for admin purposes)
   *
   * @returns Array of UserPublic objects
   *
   * @example
   * ```typescript
   * const users = await authService.getAllUsers();
   * console.log(`Total users: ${users.length}`);
   * ```
   */
  async getAllUsers(): Promise<UserPublic[]> {
    const rows = await this.adapter.query<UserRow>(
      'SELECT * FROM users ORDER BY created_at ASC',
      []
    );

    return rows.map((row) => this.userToPublic(this.rowToUser(row)));
  }
}
