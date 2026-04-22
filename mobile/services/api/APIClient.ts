/**
 * API Client
 * Handles HTTP communication with Render backend
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { APIResponse, APIError, APIRequestConfig } from './types';
import { AuthenticationManager } from '../auth/AuthenticationManager';

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_BASE_URL = 'https://propertyark-backend.onrender.com/api';

export class APIClient {
  private static instance: APIClient;
  private client: AxiosInstance;
  private baseURL: string = DEFAULT_BASE_URL;

  private constructor() {
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: DEFAULT_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): APIClient {
    if (!APIClient.instance) {
      APIClient.instance = new APIClient();
    }
    return APIClient.instance;
  }

  /**
   * Set base URL
   */
  setBaseURL(url: string): void {
    this.baseURL = url;
    this.client.defaults.baseURL = url;
  }

  /**
   * Set auth token
   */
  setAuthToken(token: string): void {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Clear auth token
   */
  clearAuthToken(): void {
    delete this.client.defaults.headers.common['Authorization'];
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, config?: APIRequestConfig): Promise<T> {
    try {
      const response = await this.client.get<APIResponse<T>>(endpoint, {
        timeout: config?.timeout || DEFAULT_TIMEOUT,
        headers: config?.headers,
      });

      return this.handleResponse(response.data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any, config?: APIRequestConfig): Promise<T> {
    try {
      const response = await this.client.post<APIResponse<T>>(endpoint, data, {
        timeout: config?.timeout || DEFAULT_TIMEOUT,
        headers: config?.headers,
      });

      return this.handleResponse(response.data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any, config?: APIRequestConfig): Promise<T> {
    try {
      const response = await this.client.put<APIResponse<T>>(endpoint, data, {
        timeout: config?.timeout || DEFAULT_TIMEOUT,
        headers: config?.headers,
      });

      return this.handleResponse(response.data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, config?: APIRequestConfig): Promise<T> {
    try {
      const response = await this.client.delete<APIResponse<T>>(endpoint, {
        timeout: config?.timeout || DEFAULT_TIMEOUT,
        headers: config?.headers,
      });

      return this.handleResponse(response.data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Setup request/response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add token if available
        const auth = AuthenticationManager.getInstance();
        const token = auth.getToken();

        if (token) {
          config.headers.Authorization = `Bearer ${token.accessToken}`;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
          const auth = AuthenticationManager.getInstance();
          const refreshed = await auth.refreshToken();

          if (refreshed) {
            // Retry original request
            const config = error.config;
            if (config) {
              const token = auth.getToken();
              if (token) {
                config.headers.Authorization = `Bearer ${token.accessToken}`;
              }
              return this.client(config);
            }
          } else {
            // Refresh failed, redirect to login
            await auth.logout();
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Handle API response
   */
  private handleResponse<T>(response: APIResponse<T>): T {
    if (!response.success) {
      throw new Error(response.error?.message || 'API request failed');
    }

    if (response.data === undefined) {
      throw new Error('No data in response');
    }

    return response.data;
  }

  /**
   * Handle API error
   */
  private handleError(error: any): APIError {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data as any;

      let message = 'API request failed';
      let code = 'UNKNOWN_ERROR';

      if (status === 400) {
        message = data?.error?.message || 'Bad request';
        code = 'BAD_REQUEST';
      } else if (status === 401) {
        message = 'Unauthorized';
        code = 'UNAUTHORIZED';
      } else if (status === 403) {
        message = 'Forbidden';
        code = 'FORBIDDEN';
      } else if (status === 404) {
        message = 'Not found';
        code = 'NOT_FOUND';
      } else if (status === 500) {
        message = 'Server error';
        code = 'SERVER_ERROR';
      } else if (error.code === 'ECONNABORTED') {
        message = 'Request timeout';
        code = 'TIMEOUT';
      } else if (!error.response) {
        message = 'Network error';
        code = 'NETWORK_ERROR';
      }

      return {
        code,
        message,
        status,
        details: data?.error?.details,
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export default APIClient.getInstance();
