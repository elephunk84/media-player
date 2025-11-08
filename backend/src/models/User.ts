/**
 * User Model
 *
 * Represents a user account for authentication and authorization.
 */

/**
 * User model for authentication
 *
 * Matches the users table schema in the database.
 */
export interface User {
  /**
   * Unique user identifier (auto-generated)
   */
  readonly id: number;

  /**
   * Unique username for login
   */
  username: string;

  /**
   * Bcrypt hashed password
   * Should never be exposed to clients
   */
  passwordHash: string;

  /**
   * Timestamp when the user account was created
   */
  readonly createdAt: Date;

  /**
   * Timestamp of the user's last successful login
   */
  lastLogin: Date | null;
}

/**
 * User without sensitive fields (safe for API responses)
 */
export interface UserPublic {
  /**
   * Unique user identifier
   */
  readonly id: number;

  /**
   * Username
   */
  username: string;

  /**
   * Timestamp when the user account was created
   */
  readonly createdAt: Date;

  /**
   * Timestamp of the user's last successful login
   */
  lastLogin: Date | null;
}

/**
 * User creation input
 */
export interface CreateUserInput {
  username: string;
  password: string; // Plain text password, will be hashed
}

/**
 * User login credentials
 */
export interface LoginCredentials {
  username: string;
  password: string;
}

/**
 * Change password input
 */
export interface ChangePasswordInput {
  userId: number;
  oldPassword: string;
  newPassword: string;
}

/**
 * Authentication response with token and user info
 */
export interface AuthResponse {
  /**
   * JWT authentication token
   */
  token: string;

  /**
   * User information (without sensitive fields)
   */
  user: UserPublic;
}

/**
 * User database row (matches database column names with snake_case)
 */
export interface UserRow {
  id: number;
  username: string;
  password_hash: string;
  created_at: Date;
  last_login: Date | null;
}
