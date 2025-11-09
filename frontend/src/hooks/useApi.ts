/**
 * useApi Hook
 *
 * Custom React hook for managing API calls with loading, error, and data states.
 * Provides a clean interface for making API requests in components.
 */

import { useState, useCallback } from 'react';
import { AxiosError, AxiosResponse } from 'axios';

/**
 * API state interface
 */
export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * useApi hook return type
 */
export interface UseApiReturn<T> extends ApiState<T> {
  execute: (...args: unknown[]) => Promise<T | null>;
  reset: () => void;
}

/**
 * useApi Hook
 *
 * Manages the state of an API call including loading, error, and data states.
 * Provides an execute function to trigger the API call and a reset function to clear state.
 *
 * @param apiFunction - Async function that makes the API call
 * @returns Object with data, loading, error states and execute/reset functions
 *
 * @example
 * ```tsx
 * const { data, loading, error, execute } = useApi(
 *   (id: number) => apiClient.get(`/videos/${id}`)
 * );
 *
 * useEffect(() => {
 *   execute(videoId);
 * }, [videoId]);
 *
 * if (loading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error}</div>;
 * if (data) return <div>{data.title}</div>;
 * ```
 */
export function useApi<T = unknown>(
  apiFunction: (...args: unknown[]) => Promise<AxiosResponse<T>>
): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Execute the API call
   *
   * @param args - Arguments to pass to the API function
   * @returns The response data or null if error
   */
  const execute = useCallback(
    async (...args: unknown[]): Promise<T | null> => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiFunction(...args);
        setData(response.data);
        return response.data;
      } catch (err) {
        let errorMessage = 'An unexpected error occurred';

        if (err instanceof AxiosError) {
          errorMessage =
            (err.response?.data as { error?: { message?: string } })?.error?.message ||
            err.message ||
            'An error occurred';
        }

        setError(errorMessage);
        setData(null);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction]
  );

  /**
   * Reset the state to initial values
   */
  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
}
