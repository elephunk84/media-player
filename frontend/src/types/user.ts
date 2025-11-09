/**
 * User Types
 *
 * Type definitions for user data and authentication.
 */

/**
 * User model matching backend User entity
 */
export interface User {
  id: number;
  username: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Login request payload
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * Login response from API
 */
export interface LoginResponse {
  token: string;
  user: User;
}

/**
 * Register request payload
 */
export interface RegisterRequest {
  username: string;
  password: string;
}

/**
 * Register response from API
 */
export interface RegisterResponse {
  token: string;
  user: User;
}
