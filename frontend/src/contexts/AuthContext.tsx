/**
 * Auth Context
 *
 * Provides authentication state and methods throughout the application.
 * Manages JWT token, user state, login, and logout operations.
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiClient from '../services/apiClient';
import { User, LoginRequest, LoginResponse } from '../types/user';

/**
 * Auth context value interface
 */
interface AuthContextValue {
  currentUser: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
}

/**
 * Auth context - provides authentication state and methods
 */
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Auth Provider Props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth Provider Component
 *
 * Wraps the application and provides authentication context.
 * Handles token validation on mount, login, and logout operations.
 *
 * @param props - Component props
 * @returns Provider component
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  /**
   * Validate token on mount
   *
   * Checks if a valid token exists in localStorage and validates it
   * with the backend. If valid, sets the current user.
   */
  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          // Parse stored user
          const user = JSON.parse(storedUser) as User;

          // Validate token with backend by making a test request
          // The apiClient will automatically attach the token
          await apiClient.get('/auth/me');

          // Token is valid, set current user
          setCurrentUser(user);
        } catch (error) {
          // Token is invalid, clear storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setCurrentUser(null);
        }
      }

      setLoading(false);
    };

    void validateToken();
  }, []);

  /**
   * Login function
   *
   * Authenticates user with credentials, stores token and user data.
   *
   * @param credentials - Login credentials (username, password)
   * @throws Error if login fails
   */
  const login = async (credentials: LoginRequest): Promise<void> => {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
      const { token, user } = response.data;

      // Store token and user in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Update state
      setCurrentUser(user);
    } catch (error) {
      // Clear any existing auth state
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setCurrentUser(null);

      // Re-throw error to be handled by caller
      throw error;
    }
  };

  /**
   * Logout function
   *
   * Clears authentication state and removes token from storage.
   */
  const logout = (): void => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Clear state
    setCurrentUser(null);
  };

  /**
   * Computed authentication status
   */
  const isAuthenticated = currentUser !== null;

  const value: AuthContextValue = {
    currentUser,
    isAuthenticated,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth Hook
 *
 * Custom hook to access auth context.
 * Must be used within AuthProvider.
 *
 * @returns Auth context value
 * @throws Error if used outside AuthProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { currentUser, login, logout } = useAuth();
 *
 *   if (!currentUser) {
 *     return <div>Please login</div>;
 *   }
 *
 *   return <div>Welcome {currentUser.username}</div>;
 * }
 * ```
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
