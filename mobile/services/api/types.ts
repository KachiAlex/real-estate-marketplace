/**
 * API Types
 * Defines all TypeScript interfaces for API-related data structures
 */

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  timestamp: number;
}

export interface APIRequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

export interface APIError {
  code: string;
  message: string;
  status?: number;
  details?: Record<string, any>;
}

export interface RequestInterceptorConfig {
  onRequest?: (config: any) => any;
  onError?: (error: any) => any;
}

export interface ResponseInterceptorConfig {
  onResponse?: (response: any) => any;
  onError?: (error: any) => any;
}
