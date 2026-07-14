/**
 * Network Error Handler
 * 
 * Handles network failures, provides user-friendly error messages,
 * implements retry logic, and logs network errors for debugging.
 */

import { OfflineManager, getOfflineManager } from './offlineManager';
import { Capacitor } from '@capacitor/core';

/**
 * Network error types
 */
export enum NetworkErrorType {
  TIMEOUT = 'TIMEOUT',
  NO_CONNECTION = 'NO_CONNECTION',
  SERVER_ERROR = 'SERVER_ERROR',
  CLIENT_ERROR = 'CLIENT_ERROR',
  CORS_ERROR = 'CORS_ERROR',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Network error details
 */
export interface NetworkErrorDetails {
  type: NetworkErrorType;
  message: string;
  userMessage: string;
  status?: number;
  originalError?: Error;
  timestamp: number;
  retryable: boolean;
  platform: string;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

/**
 * Network Error Handler class
 */
export class NetworkErrorHandler {
  private offlineManager: OfflineManager;
  private errorListeners: Set<(error: NetworkErrorDetails) => void> = new Set();
  private retryConfig: RetryConfig = {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
  };

  constructor() {
    this.offlineManager = getOfflineManager();
  }

  /**
   * Classify network error
   */
  classifyError(error: any): NetworkErrorType {
    if (!error) {
      return NetworkErrorType.UNKNOWN;
    }

    const message = error.message?.toLowerCase() || '';

    // Timeout error
    if (message.includes('timeout') || error.code === 'ETIMEDOUT') {
      return NetworkErrorType.TIMEOUT;
    }

    // No connection
    if (
      message.includes('network') ||
      message.includes('offline') ||
      error.code === 'ENOTFOUND' ||
      error.code === 'ECONNREFUSED'
    ) {
      return NetworkErrorType.NO_CONNECTION;
    }

    // CORS error
    if (message.includes('cors') || message.includes('cross-origin')) {
      return NetworkErrorType.CORS_ERROR;
    }

    // HTTP status codes
    if (error.status) {
      if (error.status >= 500) {
        return NetworkErrorType.SERVER_ERROR;
      }
      if (error.status >= 400) {
        return NetworkErrorType.CLIENT_ERROR;
      }
    }

    return NetworkErrorType.UNKNOWN;
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(errorType: NetworkErrorType, status?: number): string {
    switch (errorType) {
      case NetworkErrorType.TIMEOUT:
        return 'Request timed out. Please check your connection and try again.';
      case NetworkErrorType.NO_CONNECTION:
        return 'No internet connection. Please check your network and try again.';
      case NetworkErrorType.SERVER_ERROR:
        return 'Server error. Please try again later.';
      case NetworkErrorType.CLIENT_ERROR:
        if (status === 401) {
          return 'Authentication failed. Please log in again.';
        }
        if (status === 403) {
          return 'You do not have permission to perform this action.';
        }
        if (status === 404) {
          return 'The requested resource was not found.';
        }
        return 'Invalid request. Please check your input and try again.';
      case NetworkErrorType.CORS_ERROR:
        return 'Cross-origin request failed. Please contact support.';
      default:
        return 'An error occurred. Please try again.';
    }
  }

  /**
   * Determine if error is retryable
   */
  isRetryable(errorType: NetworkErrorType, status?: number): boolean {
    switch (errorType) {
      case NetworkErrorType.TIMEOUT:
      case NetworkErrorType.NO_CONNECTION:
      case NetworkErrorType.SERVER_ERROR:
        return true;
      case NetworkErrorType.CLIENT_ERROR:
        // Retry on 408 (Request Timeout) and 429 (Too Many Requests)
        return status === 408 || status === 429;
      default:
        return false;
    }
  }

  /**
   * Handle network error
   */
  handleError(error: any): NetworkErrorDetails {
    const errorType = this.classifyError(error);
    const status = error.status;
    const userMessage = this.getUserMessage(errorType, status);
    const retryable = this.isRetryable(errorType, status);

    const errorDetails: NetworkErrorDetails = {
      type: errorType,
      message: error.message || 'Unknown error',
      userMessage,
      status,
      originalError: error,
      timestamp: Date.now(),
      retryable,
      platform: Capacitor.getPlatform(),
    };

    // Log error
    this.logError(errorDetails);

    // Notify listeners
    this.notifyListeners(errorDetails);

    // Queue request if offline and retryable
    if (errorType === NetworkErrorType.NO_CONNECTION && retryable) {
      console.log('Error is retryable and offline - request will be queued');
    }

    return errorDetails;
  }

  /**
   * Log network error
   */
  private logError(error: NetworkErrorDetails): void {
    console.error('[Network Error Handler]', {
      type: error.type,
      message: error.message,
      status: error.status,
      platform: error.platform,
      timestamp: new Date(error.timestamp).toISOString(),
    });

    // Send to backend for monitoring (optional)
    if (Capacitor.isNativePlatform()) {
      this.sendErrorToBackend(error).catch((err) => {
        console.error('[Network Error Handler] Failed to send error to backend:', err);
      });
    }
  }

  /**
   * Send error to backend for monitoring
   */
  private async sendErrorToBackend(error: NetworkErrorDetails): Promise<void> {
    try {
      const errorData = {
        type: error.type,
        message: error.message,
        status: error.status,
        platform: error.platform,
        timestamp: error.timestamp,
        userAgent: navigator.userAgent,
      };

      await fetch('/api/logs/network-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData),
      });
    } catch (err: unknown) {
      // Silently fail - don't throw
      console.debug('[Network Error Handler] Could not send error to backend:', err);
    }
  }

  /**
   * Add error listener
   */
  addErrorListener(listener: (error: NetworkErrorDetails) => void): () => void {
    this.errorListeners.add(listener);
    return () => {
      this.errorListeners.delete(listener);
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(error: NetworkErrorDetails): void {
    this.errorListeners.forEach((listener) => {
      try {
        listener(error);
      } catch (err) {
        console.error('[Network Error Handler] Error in listener:', err);
      }
    });
  }

  /**
   * Retry with exponential backoff
   */
  async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries?: number
  ): Promise<T> {
    const retries = maxRetries ?? this.retryConfig.maxRetries;
    let lastError: any;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (error: unknown) {
        lastError = error;
        const errorType = this.classifyError(error);
        const status = (error as any)?.status;

        if (!this.isRetryable(errorType, status)) {
          throw error;
        }

        if (attempt < retries) {
          const delay = this.calculateBackoffDelay(attempt);
          console.log(
            `[Network Error Handler] Retry attempt ${attempt + 1}/${retries} after ${delay}ms`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoffDelay(attempt: number): number {
    const delay =
      this.retryConfig.initialDelayMs *
      Math.pow(this.retryConfig.backoffMultiplier, attempt);
    return Math.min(delay, this.retryConfig.maxDelayMs);
  }

  /**
   * Set retry configuration
   */
  setRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config };
  }

  /**
   * Get retry configuration
   */
  getRetryConfig(): RetryConfig {
    return { ...this.retryConfig };
  }

  /**
   * Check if online
   */
  isOnline(): boolean {
    return this.offlineManager.isConnected();
  }

  /**
   * Add online status listener
   */
  addOnlineStatusListener(listener: (isOnline: boolean) => void): () => void {
    return this.offlineManager.addListener(listener);
  }
}

/**
 * Singleton instance
 */
let networkErrorHandler: NetworkErrorHandler | null = null;

/**
 * Get or create network error handler instance
 */
export function getNetworkErrorHandler(): NetworkErrorHandler {
  if (!networkErrorHandler) {
    networkErrorHandler = new NetworkErrorHandler();
  }
  return networkErrorHandler;
}

/**
 * Reset network error handler (for testing)
 */
export function resetNetworkErrorHandler(): void {
  networkErrorHandler = null;
}

export default {
  getNetworkErrorHandler,
  resetNetworkErrorHandler,
  NetworkErrorHandler,
  NetworkErrorType,
};
