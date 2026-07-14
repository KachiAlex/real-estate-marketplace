/**
 * Capacitor-aware API Client
 * 
 * Wraps the CapacitorHttpClient to provide a unified API client interface
 * that works seamlessly across web and native platforms.
 * 
 * Features:
 * - Automatic platform detection (native vs web)
 * - Token management and refresh
 * - CSRF token handling
 * - Request/response interceptors
 * - Error handling with custom error types
 */

import { CapacitorHttpClient, HttpError, NetworkError, TimeoutError, HttpResponse } from './capacitorHttpClient';
import { getApiBaseUrl, getDefaultHeaders } from '../config/api';

/**
 * Token storage interface
 */
export interface TokenStorage {
  getAccessToken(): string | null;
  getRefreshToken(): string | null;
  setAccessToken(token: string | null): void;
  setRefreshToken(token: string | null): void;
}

/**
 * API Client configuration
 */
export interface ApiClientConfig {
  baseUrl?: string;
  storage: TokenStorage;
  refreshFn: (refreshToken?: string) => Promise<string | null>;
  onBeforeRequest?: (config: any) => Promise<void>;
  timeout?: number;
}

/**
 * Capacitor API Client
 */
export class CapacitorApiClient {
  private httpClient: CapacitorHttpClient;
  private tokenStorage: TokenStorage;
  private refreshFn: (refreshToken?: string) => Promise<string | null>;
  private onBeforeRequest?: (config: any) => Promise<void>;
  private isRefreshing = false;
  private refreshQueue: Array<{ resolve: (token: string) => void; reject: (error: Error) => void }> = [];
  private csrfToken: string | null = null;

  constructor(config: ApiClientConfig) {
    this.tokenStorage = config.storage;
    this.refreshFn = config.refreshFn;
    this.onBeforeRequest = config.onBeforeRequest;

    const baseUrl = config.baseUrl || getApiBaseUrl();
    this.httpClient = new CapacitorHttpClient(baseUrl, config.timeout || 30000);

    // Set default headers
    this.httpClient.setDefaultHeaders(getDefaultHeaders());

    // Add interceptors
    this.setupInterceptors();
  }

  /**
   * Setup request/response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.httpClient.addRequestInterceptor((config) => {
      return this.handleRequestInterceptor(config);
    });

    // Response interceptor
    this.httpClient.addResponseInterceptor((response) => {
      return response;
    });

    // Error interceptor
    this.httpClient.addErrorInterceptor((error) => {
      return this.handleErrorInterceptor(error);
    });
  }

  /**
   * Handle request interceptor
   */
  private async handleRequestInterceptor(config: any): Promise<any> {
    // Call custom before request handler
    if (this.onBeforeRequest) {
      await this.onBeforeRequest(config);
    }

    // Add authorization token
    const token = this.tokenStorage.getAccessToken();
    if (token && !config.headers?.Authorization) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add CSRF token for state-changing requests
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method?.toUpperCase())) {
      if (!this.csrfToken) {
        await this.fetchCsrfToken();
      }
      if (this.csrfToken) {
        config.headers = config.headers || {};
        config.headers['X-CSRF-Token'] = this.csrfToken;
      }
    }

    return config;
  }

  /**
   * Handle error interceptor
   */
  private handleErrorInterceptor(error: Error): Error {
    // For now, just return the error as-is
    // In a real implementation, you might want to log or transform errors
    return error;
  }

  /**
   * Fetch CSRF token from backend
   */
  private async fetchCsrfToken(): Promise<void> {
    try {
      const response = await this.httpClient.get<{ token: string }>('/csrf-token');
      if (response.data?.token) {
        this.csrfToken = response.data.token;
      }
    } catch (error) {
      console.warn('Failed to fetch CSRF token:', error);
    }
  }

  /**
   * Process token refresh queue
   */
  private processRefreshQueue(error: Error | null, token: string | null = null): void {
    while (this.refreshQueue.length > 0) {
      const pending = this.refreshQueue.shift();
      if (!pending) continue;

      if (error || !token) {
        pending.reject(error || new Error('Token refresh failed'));
      } else {
        pending.resolve(token);
      }
    }
  }

  /**
   * Refresh token if needed
   */
  private async refreshTokenIfNeeded(): Promise<string | null> {
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.refreshQueue.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;

    try {
      const refreshToken = this.tokenStorage.getRefreshToken();
      const newToken = await this.refreshFn(refreshToken || undefined);

      if (newToken) {
        this.tokenStorage.setAccessToken(newToken);
        this.processRefreshQueue(null, newToken);
        return newToken;
      } else {
        const error = new Error('Token refresh failed');
        this.processRefreshQueue(error);
        throw error;
      }
    } catch (error) {
      this.processRefreshQueue(error as Error);
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Make a GET request
   */
  async get<T = any>(url: string, config?: any): Promise<HttpResponse<T>> {
    try {
      return await this.httpClient.get<T>(url, config);
    } catch (error) {
      return this.handleHttpError(error);
    }
  }

  /**
   * Make a POST request
   */
  async post<T = any>(url: string, data?: any, config?: any): Promise<HttpResponse<T>> {
    try {
      return await this.httpClient.post<T>(url, data, config);
    } catch (error) {
      return this.handleHttpError(error);
    }
  }

  /**
   * Make a PUT request
   */
  async put<T = any>(url: string, data?: any, config?: any): Promise<HttpResponse<T>> {
    try {
      return await this.httpClient.put<T>(url, data, config);
    } catch (error) {
      return this.handleHttpError(error);
    }
  }

  /**
   * Make a DELETE request
   */
  async delete<T = any>(url: string, config?: any): Promise<HttpResponse<T>> {
    try {
      return await this.httpClient.delete<T>(url, config);
    } catch (error) {
      return this.handleHttpError(error);
    }
  }

  /**
   * Make a PATCH request
   */
  async patch<T = any>(url: string, data?: any, config?: any): Promise<HttpResponse<T>> {
    try {
      return await this.httpClient.patch<T>(url, data, config);
    } catch (error) {
      return this.handleHttpError(error);
    }
  }

  /**
   * Handle HTTP errors with token refresh logic
   */
  private async handleHttpError(error: any): Promise<never> {
    // Handle 401 Unauthorized - try to refresh token
    if (error instanceof HttpError && error.status === 401) {
      try {
        await this.refreshTokenIfNeeded();
        // After refresh, the caller should retry the request
        throw error;
      } catch (refreshError) {
        // Clear tokens on refresh failure
        this.tokenStorage.setAccessToken(null);
        this.tokenStorage.setRefreshToken(null);
        throw refreshError;
      }
    }

    throw error;
  }

  /**
   * Set base URL
   */
  setBaseUrl(url: string): void {
    this.httpClient.setBaseUrl(url);
  }

  /**
   * Get base URL
   */
  getBaseUrl(): string {
    return this.httpClient.getBaseUrl();
  }

  /**
   * Set default headers
   */
  setDefaultHeaders(headers: Record<string, string>): void {
    this.httpClient.setDefaultHeaders(headers);
  }

  /**
   * Get default headers
   */
  getDefaultHeaders(): Record<string, string> {
    return this.httpClient.getDefaultHeaders();
  }

  /**
   * Set CSRF token manually
   */
  setCsrfToken(token: string): void {
    this.csrfToken = token;
  }

  /**
   * Get CSRF token
   */
  getCsrfToken(): string | null {
    return this.csrfToken;
  }
}

/**
 * Create a Capacitor API client instance
 */
export const createCapacitorApiClient = (config: ApiClientConfig): CapacitorApiClient => {
  return new CapacitorApiClient(config);
};

export { HttpError, NetworkError, TimeoutError };
