/**
 * Capacitor HTTP Client
 * 
 * Unified HTTP client that uses Capacitor HTTP plugin on native platforms
 * and fetch API on web. This ensures consistent API across all platforms.
 */

import { Capacitor } from '@capacitor/core';

/**
 * HTTP Response interface
 */
export interface HttpResponse<T = any> {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: T;
}

/**
 * HTTP Request Config interface
 */
export interface HttpRequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  timeout?: number;
  responseType?: 'json' | 'text' | 'blob';
}

/**
 * HTTP Error class
 */
export class HttpError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: any
  ) {
    super(`HTTP Error ${status}: ${statusText}`);
    this.name = 'HttpError';
  }
}

/**
 * Network Error class
 */
export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * Timeout Error class
 */
export class TimeoutError extends Error {
  constructor(message: string = 'Request timeout') {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Capacitor HTTP Client
 * 
 * Provides a unified HTTP client interface for both native and web platforms.
 * On native platforms, uses Capacitor HTTP plugin for better performance and security.
 * On web, uses the standard fetch API.
 */
export class CapacitorHttpClient {
  private baseUrl: string;
  private defaultTimeout: number = 30000; // 30 seconds
  private defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  private requestInterceptors: Array<(config: any) => any> = [];
  private responseInterceptors: Array<(response: HttpResponse) => HttpResponse> = [];
  private errorInterceptors: Array<(error: any) => any> = [];
  private isNative: boolean = false;
  private Http: any = null;

  constructor(baseUrl: string = '', timeout: number = 30000) {
    this.baseUrl = baseUrl || this.getDefaultBaseUrl();
    this.defaultTimeout = timeout;
    this.isNative = Capacitor.isNativePlatform();
    
    // Initialize Capacitor HTTP plugin on native platforms
    if (this.isNative) {
      this.initializeCapacitorHttp();
    }
  }

  /**
   * Initialize Capacitor HTTP plugin
   */
  private async initializeCapacitorHttp(): Promise<void> {
    try {
      // Dynamically import Capacitor HTTP plugin
      const { Http } = await import('@capacitor/http');
      this.Http = Http;
      console.log('[CapacitorHttpClient] Capacitor HTTP plugin initialized');
    } catch (error) {
      console.warn('[CapacitorHttpClient] Failed to load Capacitor HTTP plugin:', error);
      // Fall back to fetch API
      this.Http = null;
    }
  }

  /**
   * Get default base URL
   */
  private getDefaultBaseUrl(): string {
    if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
      return 'http://localhost:5001';
    }
    return 'https://propertyark.vercel.app';
  }

  /**
   * Get the base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Set the base URL
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /**
   * Get default timeout
   */
  getDefaultTimeout(): number {
    return this.defaultTimeout;
  }

  /**
   * Set default timeout
   */
  setDefaultTimeout(timeout: number): void {
    this.defaultTimeout = timeout;
  }

  /**
   * Get default headers
   */
  getDefaultHeaders(): Record<string, string> {
    return { ...this.defaultHeaders };
  }

  /**
   * Set default headers
   */
  setDefaultHeaders(headers: Record<string, string>): void {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor: (config: any) => any): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(interceptor: (response: HttpResponse) => HttpResponse): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Add error interceptor
   */
  addErrorInterceptor(interceptor: (error: any) => any): void {
    this.errorInterceptors.push(interceptor);
  }

  /**
   * Build full URL from path
   */
  private buildUrl(path: string): string {
    if (path.startsWith('http')) {
      return path;
    }
    return `${this.baseUrl}${path.startsWith('/') ? path : '/' + path}`;
  }

  /**
   * Build query string from params
   */
  private buildQueryString(params?: Record<string, any>): string {
    if (!params || Object.keys(params).length === 0) {
      return '';
    }
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        queryParams.append(key, String(value));
      }
    });
    return queryParams.toString();
  }

  /**
   * Make HTTP request using Capacitor HTTP plugin (native platform)
   */
  private async requestNative<T>(
    method: string,
    url: string,
    config: HttpRequestConfig,
    body?: any
  ): Promise<HttpResponse<T>> {
    if (!this.Http) {
      // Fall back to web request if plugin not available
      return this.requestWeb<T>(method, url, config, body);
    }

    try {
      const headers = {
        ...this.defaultHeaders,
        ...config.headers,
      };

      const queryString = this.buildQueryString(config.params);
      const fullUrl = queryString ? `${url}?${queryString}` : url;

      const requestOptions: any = {
        url: fullUrl,
        method,
        headers,
        responseType: config.responseType === 'text' ? 'text' : 'json',
      };

      if (body) {
        requestOptions.data = body;
      }

      if (config.timeout) {
        requestOptions.connectTimeout = config.timeout;
        requestOptions.readTimeout = config.timeout;
      }

      const response = await this.Http.request(requestOptions);

      if (response.status < 200 || response.status >= 300) {
        throw new HttpError(response.status, `HTTP ${response.status}`, response.data);
      }

      const httpResponse: HttpResponse<T> = {
        status: response.status,
        statusText: `HTTP ${response.status}`,
        headers: response.headers || {},
        data: response.data,
      };

      // Apply response interceptors
      let result = httpResponse;
      for (const interceptor of this.responseInterceptors) {
        result = interceptor(result);
      }

      return result;
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }

      // Apply error interceptors
      let processedError = error;
      for (const interceptor of this.errorInterceptors) {
        processedError = interceptor(processedError);
      }

      if (processedError instanceof HttpError || processedError instanceof TimeoutError) {
        throw processedError;
      }

      throw new NetworkError(String(error));
    }
  }

  /**
   * Make HTTP request using fetch API (web platform)
   */
  private async requestWeb<T>(
    method: string,
    url: string,
    config: HttpRequestConfig,
    body?: any
  ): Promise<HttpResponse<T>> {
    const timeout = config.timeout || this.defaultTimeout;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const headers = {
        ...this.defaultHeaders,
        ...config.headers,
      };

      const queryString = this.buildQueryString(config.params);
      const fullUrl = queryString ? `${url}?${queryString}` : url;

      const fetchOptions: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };

      if (body) {
        fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
      }

      const response = await fetch(fullUrl, fetchOptions);

      const contentType = response.headers.get('content-type') || '';
      let data: any;

      if (contentType.includes('application/json')) {
        data = await response.json();
      } else if (config.responseType === 'text') {
        data = await response.text();
      } else {
        data = await response.blob();
      }

      if (!response.ok) {
        throw new HttpError(response.status, response.statusText, data);
      }

      const httpResponse: HttpResponse<T> = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data,
      };

      // Apply response interceptors
      let result = httpResponse;
      for (const interceptor of this.responseInterceptors) {
        result = interceptor(result);
      }

      return result;
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new TimeoutError(`Request timeout after ${timeout}ms`);
      }

      // Apply error interceptors
      let processedError = error;
      for (const interceptor of this.errorInterceptors) {
        processedError = interceptor(processedError);
      }

      if (processedError instanceof HttpError || processedError instanceof TimeoutError) {
        throw processedError;
      }

      throw new NetworkError(String(error));
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Make HTTP request (platform-aware)
   */
  private async request<T>(
    method: string,
    url: string,
    config: HttpRequestConfig,
    body?: any
  ): Promise<HttpResponse<T>> {
    if (this.isNative && this.Http) {
      return this.requestNative<T>(method, url, config, body);
    }
    return this.requestWeb<T>(method, url, config, body);
  }

  /**
   * Make HTTP GET request
   */
  async get<T = any>(path: string, config: HttpRequestConfig = {}): Promise<HttpResponse<T>> {
    const url = this.buildUrl(path);
    return this.request<T>('GET', url, config);
  }

  /**
   * Make HTTP POST request
   */
  async post<T = any>(
    path: string,
    body?: any,
    config: HttpRequestConfig = {}
  ): Promise<HttpResponse<T>> {
    const url = this.buildUrl(path);
    return this.request<T>('POST', url, config, body);
  }

  /**
   * Make HTTP PUT request
   */
  async put<T = any>(
    path: string,
    body?: any,
    config: HttpRequestConfig = {}
  ): Promise<HttpResponse<T>> {
    const url = this.buildUrl(path);
    return this.request<T>('PUT', url, config, body);
  }

  /**
   * Make HTTP PATCH request
   */
  async patch<T = any>(
    path: string,
    body?: any,
    config: HttpRequestConfig = {}
  ): Promise<HttpResponse<T>> {
    const url = this.buildUrl(path);
    return this.request<T>('PATCH', url, config, body);
  }

  /**
   * Make HTTP DELETE request
   */
  async delete<T = any>(path: string, config: HttpRequestConfig = {}): Promise<HttpResponse<T>> {
    const url = this.buildUrl(path);
    return this.request<T>('DELETE', url, config);
  }

  /**
   * Make HTTP HEAD request
   */
  async head<T = any>(path: string, config: HttpRequestConfig = {}): Promise<HttpResponse<T>> {
    const url = this.buildUrl(path);
    return this.request<T>('HEAD', url, config);
  }

  /**
   * Make HTTP OPTIONS request
   */
  async options<T = any>(path: string, config: HttpRequestConfig = {}): Promise<HttpResponse<T>> {
    const url = this.buildUrl(path);
    return this.request<T>('OPTIONS', url, config);
  }
}

export default CapacitorHttpClient;
