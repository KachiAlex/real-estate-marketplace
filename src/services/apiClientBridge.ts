/**
 * API Client Bridge
 * 
 * Provides a unified interface for making API calls using the Capacitor HTTP client.
 * This bridge handles common patterns like authentication, error handling, and response formatting.
 */

import { getHttpClient, getApiUrl } from '../config/api';
import { CapacitorHttpClient, HttpError, NetworkError, TimeoutError } from './capacitorHttpClient';

/**
 * API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

/**
 * API request options
 */
export interface ApiRequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  timeout?: number;
  skipErrorHandling?: boolean;
}

/**
 * API Client Bridge - Unified interface for API calls
 */
export class ApiClientBridge {
  private httpClient: CapacitorHttpClient | null = null;
  private initError: Error | null = null;

  constructor() {
    try {
      this.httpClient = getHttpClient();
    } catch (error) {
      console.error('[ApiClientBridge] Failed to initialize HTTP client:', error);
      this.initError = error instanceof Error ? error : new Error(String(error));
      // Create a fallback HTTP client
      this.httpClient = new CapacitorHttpClient();
    }
  }

  /**
   * Ensure HTTP client is available
   */
  private ensureHttpClient(): CapacitorHttpClient {
    if (!this.httpClient) {
      throw new Error('HTTP client is not available');
    }
    return this.httpClient;
  }

  /**
   * Make a GET request
   */
  async get<T = any>(path: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    try {
      const httpClient = this.ensureHttpClient();
      const url = getApiUrl(path);
      const response = await httpClient.get<T>(url, {
        headers: options?.headers,
        params: options?.params,
        timeout: options?.timeout,
      });

      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      return this.handleError(error, options?.skipErrorHandling);
    }
  }

  /**
   * Make a POST request
   */
  async post<T = any>(path: string, data?: any, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    try {
      const httpClient = this.ensureHttpClient();
      const url = getApiUrl(path);
      const response = await httpClient.post<T>(url, data, {
        headers: options?.headers,
        params: options?.params,
        timeout: options?.timeout,
      });

      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      return this.handleError(error, options?.skipErrorHandling);
    }
  }

  /**
   * Make a PUT request
   */
  async put<T = any>(path: string, data?: any, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    try {
      const httpClient = this.ensureHttpClient();
      const url = getApiUrl(path);
      const response = await httpClient.put<T>(url, data, {
        headers: options?.headers,
        params: options?.params,
        timeout: options?.timeout,
      });

      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      return this.handleError(error, options?.skipErrorHandling);
    }
  }

  /**
   * Make a DELETE request
   */
  async delete<T = any>(path: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    try {
      const httpClient = this.ensureHttpClient();
      const url = getApiUrl(path);
      const response = await httpClient.delete<T>(url, {
        headers: options?.headers,
        params: options?.params,
        timeout: options?.timeout,
      });

      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      return this.handleError(error, options?.skipErrorHandling);
    }
  }

  /**
   * Make a PATCH request
   */
  async patch<T = any>(path: string, data?: any, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    try {
      const httpClient = this.ensureHttpClient();
      const url = getApiUrl(path);
      const response = await httpClient.patch<T>(url, data, {
        headers: options?.headers,
        params: options?.params,
        timeout: options?.timeout,
      });

      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      return this.handleError(error, options?.skipErrorHandling);
    }
  }

  /**
   * Add a request interceptor
   */
  addRequestInterceptor(interceptor: (config: any) => any): void {
    const httpClient = this.ensureHttpClient();
    httpClient.addRequestInterceptor(interceptor);
  }

  /**
   * Add a response interceptor
   */
  addResponseInterceptor(interceptor: (response: any) => any): void {
    const httpClient = this.ensureHttpClient();
    httpClient.addResponseInterceptor(interceptor);
  }

  /**
   * Add an error interceptor
   */
  addErrorInterceptor(interceptor: (error: Error) => Error): void {
    const httpClient = this.ensureHttpClient();
    httpClient.addErrorInterceptor(interceptor);
  }

  /**
   * Handle errors and return formatted response
   */
  private handleError(error: any, skipErrorHandling?: boolean): ApiResponse {
    let errorMessage = 'An error occurred';
    let status: number | undefined;

    if (error instanceof HttpError) {
      errorMessage = `HTTP ${error.status}: ${error.statusText}`;
      status = error.status;
      
      // Try to extract error message from response data
      if (error.data?.message) {
        errorMessage = error.data.message;
      } else if (error.data?.error) {
        errorMessage = error.data.error;
      }
    } else if (error instanceof TimeoutError) {
      errorMessage = 'Request timeout - please check your connection';
    } else if (error instanceof NetworkError) {
      errorMessage = 'Network error - please check your connection';
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    if (!skipErrorHandling) {
      console.error('API Error:', errorMessage);
    }

    return {
      success: false,
      error: errorMessage,
      status,
    };
  }
}

/**
 * Singleton instance of the API client bridge
 */
let apiClientBridge: ApiClientBridge | null = null;

/**
 * Get or create the API client bridge instance
 */
export const getApiClient = (): ApiClientBridge => {
  if (!apiClientBridge) {
    apiClientBridge = new ApiClientBridge();
  }
  return apiClientBridge;
};

/**
 * Reset the API client bridge (useful for testing)
 */
export const resetApiClient = (): void => {
  apiClientBridge = null;
};

export default {
  getApiClient,
  resetApiClient,
  ApiClientBridge,
};
