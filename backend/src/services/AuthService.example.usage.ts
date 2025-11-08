/**
 * AuthService Example Usage
 *
 * Demonstrates how to use the AuthService class for authentication operations.
 */

import { AuthService } from './AuthService';
import { DatabaseAdapter } from '../adapters/DatabaseAdapter';

/**
 * Example: Initialize AuthService
 *
 * The AuthService requires a DatabaseAdapter and configuration with JWT secret.
 */
function example1_Initialize(adapter: DatabaseAdapter): void {
  new AuthService(adapter, {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-key',
    tokenExpirationSeconds: 86400, // 24 hours
    bcryptRounds: 12, // bcrypt cost factor
  });

  console.info('AuthService initialized with JWT authentication');
}

/**
 * Example: Create a new user
 *
 * Creates a user with a hashed password. Password is validated for strength
 * and username is validated for uniqueness.
 */
async function example2_CreateUser(adapter: DatabaseAdapter): Promise<void> {
  const authService = new AuthService(adapter, {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-key',
  });

  try {
    const user = await authService.createUser({
      username: 'john_doe',
      password: 'SecurePass123!',
    });

    console.info('User created:', {
      id: user.id,
      username: user.username,
      createdAt: user.createdAt,
    });
    // Password hash is NOT included in the returned object for security
  } catch (error) {
    if (error instanceof Error) {
      console.error('Failed to create user:', error.message);
    }
  }
}

/**
 * Example: Username validation
 *
 * Demonstrates username validation rules:
 * - Must be 3-50 characters
 * - Only alphanumeric, underscores, and hyphens
 * - Must be unique
 */
async function example3_UsernameValidation(adapter: DatabaseAdapter): Promise<void> {
  const authService = new AuthService(adapter, {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-key',
  });

  // Valid usernames
  const validUsernames = ['john_doe', 'user-123', 'JohnDoe', 'user_name_123'];

  // Invalid usernames (examples for reference):
  // 'ab' - Too short
  // 'user name' - Contains space
  // 'user@email' - Contains special character
  // 'a'.repeat(51) - Too long

  for (const username of validUsernames) {
    try {
      await authService.createUser({
        username,
        password: 'ValidPass123!',
      });
      console.info(`✓ Created user: ${username}`);
    } catch (error) {
      if (error instanceof Error) {
        console.info(`✗ Failed: ${username} - ${error.message}`);
      }
    }
  }
}

/**
 * Example: Password validation
 *
 * Demonstrates password validation rules:
 * - Must be 8-128 characters
 * - Must contain uppercase, lowercase, and number
 */
async function example4_PasswordValidation(adapter: DatabaseAdapter): Promise<void> {
  const authService = new AuthService(adapter, {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-key',
  });

  // Valid passwords
  const validPasswords = ['Password123', 'Secure1Pass', 'MyPass123!@#'];

  // Invalid passwords (examples for reference):
  // 'short1' - Too short
  // 'nouppercase123' - No uppercase
  // 'NOLOWERCASE123' - No lowercase
  // 'NoNumbers' - No numbers

  for (const password of validPasswords) {
    try {
      await authService.createUser({
        username: `user_${Math.random()}`,
        password,
      });
      console.info(`✓ Valid password accepted`);
    } catch (error) {
      if (error instanceof Error) {
        console.info(`✗ Password rejected: ${error.message}`);
      }
    }
  }
}

/**
 * Example: User login
 *
 * Authenticates a user and returns a JWT token.
 * Login failures return generic error messages for security.
 */
async function example5_Login(adapter: DatabaseAdapter): Promise<void> {
  const authService = new AuthService(adapter, {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-key',
  });

  // First create a user
  await authService.createUser({
    username: 'john_doe',
    password: 'SecurePass123!',
  });

  // Login with correct credentials
  try {
    const authResponse = await authService.login({
      username: 'john_doe',
      password: 'SecurePass123!',
    });

    console.info('Login successful:', {
      token: authResponse.token.substring(0, 20) + '...',
      user: authResponse.user.username,
      userId: authResponse.user.id,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Login failed:', error.message);
    }
  }

  // Login with incorrect password (generic error message)
  try {
    await authService.login({
      username: 'john_doe',
      password: 'WrongPassword123!',
    });
  } catch (error) {
    if (error instanceof Error) {
      console.info('Expected error:', error.message);
      // Output: "Invalid username or password" (generic for security)
    }
  }
}

/**
 * Example: Validate JWT token
 *
 * Validates a JWT token and returns the user if valid.
 * Returns null for invalid, expired, or malformed tokens.
 */
async function example6_ValidateToken(adapter: DatabaseAdapter): Promise<void> {
  const authService = new AuthService(adapter, {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-key',
  });

  // Create user and login
  await authService.createUser({
    username: 'jane_doe',
    password: 'SecurePass123!',
  });

  const authResponse = await authService.login({
    username: 'jane_doe',
    password: 'SecurePass123!',
  });

  // Validate the token
  const user = await authService.validateToken(authResponse.token);

  if (user) {
    console.info('Token is valid for user:', {
      id: user.id,
      username: user.username,
    });
  } else {
    console.info('Token is invalid or expired');
  }

  // Validate an invalid token
  const invalidUser = await authService.validateToken('invalid.jwt.token');
  console.info('Invalid token result:', invalidUser); // null
}

/**
 * Example: Token expiration
 *
 * Demonstrates JWT token expiration after the configured time.
 */
async function example7_TokenExpiration(adapter: DatabaseAdapter): Promise<void> {
  // Create service with 5-second token expiration (for demo)
  const authService = new AuthService(adapter, {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-key',
    tokenExpirationSeconds: 5, // 5 seconds
  });

  await authService.createUser({
    username: 'token_test',
    password: 'SecurePass123!',
  });

  const authResponse = await authService.login({
    username: 'token_test',
    password: 'SecurePass123!',
  });

  // Validate immediately - should succeed
  const user1 = await authService.validateToken(authResponse.token);
  console.info('Token valid immediately:', user1 !== null);

  // Wait 6 seconds
  await new Promise((resolve) => setTimeout(resolve, 6000));

  // Validate after expiration - should fail
  const user2 = await authService.validateToken(authResponse.token);
  console.info('Token valid after 6 seconds:', user2 !== null); // false
}

/**
 * Example: Change password
 *
 * Updates a user's password after verifying the old password.
 */
async function example8_ChangePassword(adapter: DatabaseAdapter): Promise<void> {
  const authService = new AuthService(adapter, {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-key',
  });

  // Create user
  const user = await authService.createUser({
    username: 'password_change_test',
    password: 'OldPass123!',
  });

  // Change password
  try {
    await authService.changePassword({
      userId: user.id,
      oldPassword: 'OldPass123!',
      newPassword: 'NewSecurePass456!',
    });

    console.info('Password changed successfully');

    // Verify old password no longer works
    try {
      await authService.login({
        username: 'password_change_test',
        password: 'OldPass123!',
      });
      console.info('ERROR: Old password still works!');
    } catch {
      console.info('✓ Old password no longer works');
    }

    // Verify new password works
    await authService.login({
      username: 'password_change_test',
      password: 'NewSecurePass456!',
    });
    console.info('✓ New password works');
  } catch (error) {
    if (error instanceof Error) {
      console.error('Failed to change password:', error.message);
    }
  }
}

/**
 * Example: Change password validation
 *
 * Demonstrates password change validation:
 * - Old password must be correct
 * - New password must be different from old password
 * - New password must meet strength requirements
 */
async function example9_ChangePasswordValidation(adapter: DatabaseAdapter): Promise<void> {
  const authService = new AuthService(adapter, {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-key',
  });

  const user = await authService.createUser({
    username: 'pwd_validation_test',
    password: 'CurrentPass123!',
  });

  // Try with wrong old password
  try {
    await authService.changePassword({
      userId: user.id,
      oldPassword: 'WrongPass123!',
      newPassword: 'NewPass123!',
    });
  } catch (error) {
    if (error instanceof Error) {
      console.info('Expected error:', error.message);
      // "Current password is incorrect"
    }
  }

  // Try with same password
  try {
    await authService.changePassword({
      userId: user.id,
      oldPassword: 'CurrentPass123!',
      newPassword: 'CurrentPass123!',
    });
  } catch (error) {
    if (error instanceof Error) {
      console.info('Expected error:', error.message);
      // "New password must be different from current password"
    }
  }

  // Try with weak new password
  try {
    await authService.changePassword({
      userId: user.id,
      oldPassword: 'CurrentPass123!',
      newPassword: 'weak',
    });
  } catch (error) {
    if (error instanceof Error) {
      console.info('Expected error:', error.message);
      // "Password must be at least 8 characters long"
    }
  }
}

/**
 * Example: Get user by ID
 *
 * Retrieves a user by their ID (without password hash).
 */
async function example10_GetUserById(adapter: DatabaseAdapter): Promise<void> {
  const authService = new AuthService(adapter, {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-key',
  });

  const createdUser = await authService.createUser({
    username: 'lookup_test',
    password: 'SecurePass123!',
  });

  const user = await authService.getUserById(createdUser.id);

  if (user) {
    console.info('Found user:', {
      id: user.id,
      username: user.username,
      createdAt: user.createdAt,
    });
  } else {
    console.info('User not found');
  }
}

/**
 * Example: Get user by username
 *
 * Retrieves a user by their username (without password hash).
 */
async function example11_GetUserByUsername(adapter: DatabaseAdapter): Promise<void> {
  const authService = new AuthService(adapter, {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-key',
  });

  await authService.createUser({
    username: 'username_lookup_test',
    password: 'SecurePass123!',
  });

  const user = await authService.getUserByUsername('username_lookup_test');

  if (user) {
    console.info('Found user:', {
      id: user.id,
      username: user.username,
    });
  } else {
    console.info('User not found');
  }
}

/**
 * Example: Delete user
 *
 * Permanently removes a user from the database.
 */
async function example12_DeleteUser(adapter: DatabaseAdapter): Promise<void> {
  const authService = new AuthService(adapter, {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-key',
  });

  const user = await authService.createUser({
    username: 'delete_test',
    password: 'SecurePass123!',
  });

  console.info(`Created user with ID: ${user.id}`);

  await authService.deleteUser(user.id);
  console.info('User deleted');

  // Verify user is gone
  const deletedUser = await authService.getUserById(user.id);
  console.info('User exists after deletion:', deletedUser !== null); // false
}

/**
 * Example: Get all users
 *
 * Retrieves all users from the database (for admin purposes).
 */
async function example13_GetAllUsers(adapter: DatabaseAdapter): Promise<void> {
  const authService = new AuthService(adapter, {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-key',
  });

  // Create multiple users
  await authService.createUser({ username: 'user1', password: 'Pass123!' });
  await authService.createUser({ username: 'user2', password: 'Pass123!' });
  await authService.createUser({ username: 'user3', password: 'Pass123!' });

  const users = await authService.getAllUsers();

  console.info(`Total users: ${users.length}`);
  users.forEach((user) => {
    console.info(`- ${user.username} (ID: ${user.id})`);
  });
}

/**
 * Example: Security - Generic error messages
 *
 * Demonstrates that login failures don't reveal whether the username
 * or password was incorrect (prevents user enumeration).
 */
async function example14_GenericErrorMessages(adapter: DatabaseAdapter): Promise<void> {
  const authService = new AuthService(adapter, {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-key',
  });

  await authService.createUser({
    username: 'security_test',
    password: 'SecurePass123!',
  });

  // Wrong username
  try {
    await authService.login({
      username: 'nonexistent_user',
      password: 'SecurePass123!',
    });
  } catch (error) {
    if (error instanceof Error) {
      console.info('Wrong username error:', error.message);
      // "Invalid username or password"
    }
  }

  // Wrong password
  try {
    await authService.login({
      username: 'security_test',
      password: 'WrongPassword123!',
    });
  } catch (error) {
    if (error instanceof Error) {
      console.info('Wrong password error:', error.message);
      // "Invalid username or password" (same message)
    }
  }

  // Both errors return the same generic message for security
}

/**
 * Example: Last login tracking
 *
 * Demonstrates that the lastLogin timestamp is updated on successful login.
 */
async function example15_LastLoginTracking(adapter: DatabaseAdapter): Promise<void> {
  const authService = new AuthService(adapter, {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-key',
  });

  const user = await authService.createUser({
    username: 'login_tracking_test',
    password: 'SecurePass123!',
  });

  console.info('Initial lastLogin:', user.lastLogin); // null

  // First login
  await authService.login({
    username: 'login_tracking_test',
    password: 'SecurePass123!',
  });

  const userAfterFirstLogin = await authService.getUserById(user.id);
  console.info('After first login:', userAfterFirstLogin?.lastLogin); // timestamp

  // Wait 2 seconds
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Second login
  await authService.login({
    username: 'login_tracking_test',
    password: 'SecurePass123!',
  });

  const userAfterSecondLogin = await authService.getUserById(user.id);
  console.info('After second login:', userAfterSecondLogin?.lastLogin); // newer timestamp
}

// Export examples for documentation
export {
  example1_Initialize,
  example2_CreateUser,
  example3_UsernameValidation,
  example4_PasswordValidation,
  example5_Login,
  example6_ValidateToken,
  example7_TokenExpiration,
  example8_ChangePassword,
  example9_ChangePasswordValidation,
  example10_GetUserById,
  example11_GetUserByUsername,
  example12_DeleteUser,
  example13_GetAllUsers,
  example14_GenericErrorMessages,
  example15_LastLoginTracking,
};
