/**
 * API Types
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

export interface RequestOptions {
  timeout?: number;
  headers?: Record<string, string>;
  retries?: number;
}

export interface APIError {
  code: string;
  message: string;
  status?: number;
  details?: Record<string, any>;
}

export interface NetworkError extends APIError {
  isNetworkError: true;
}
