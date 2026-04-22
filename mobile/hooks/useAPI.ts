/**
 * useAPI Hook
 * Custom hook for API operations
 */

import { useState, useCallback } from 'react';
import type { APIResponse } from '@/types';

export function useAPI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async <T,>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any
  ): Promise<APIResponse<T> | null> => {
    setLoading(true);
    setError(null);
    try {
      // Implementation will be added
      throw new Error('Not implemented');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'API request failed';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback(
    async <T,>(endpoint: string) => request<T>('GET', endpoint),
    [request]
  );

  const post = useCallback(
    async <T,>(endpoint: string, data: any) => request<T>('POST', endpoint, data),
    [request]
  );

  const put = useCallback(
    async <T,>(endpoint: string, data: any) => request<T>('PUT', endpoint, data),
    [request]
  );

  const del = useCallback(
    async <T,>(endpoint: string) => request<T>('DELETE', endpoint),
    [request]
  );

  return {
    loading,
    error,
    request,
    get,
    post,
    put,
    delete: del,
  };
}
