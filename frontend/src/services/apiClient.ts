/**
 * API Client
 *
 * Axios instance configured with base URL, authentication interceptors,
 * and error handling for the media player API.
 */

import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * API base URL from environment variables
 * Falls back to /api for proxy during development
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Create Axios instance with base configuration
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

/**
 * Request Interceptor
 *
 * Attaches JWT token from localStorage to all requests.
 * The token is sent in the Authorization header as a Bearer token.
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: unknown) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 *
 * Handles global error responses, particularly 401 Unauthorized.
 * Redirects to login page when authentication fails.
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Return successful responses as-is
    return response;
  },
  (error: unknown) => {
    // Handle 401 Unauthorized globally
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // Clear authentication state
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Redirect to login page
      // Only redirect if not already on login page to avoid infinite loop
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
