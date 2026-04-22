/**
 * Error Messages
 * Centralized error message definitions
 */

export const ERROR_MESSAGES = {
  // Authentication Errors
  INVALID_CREDENTIALS: 'Invalid email or password',
  TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
  REFRESH_FAILED: 'Failed to refresh session. Please log in again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',

  // Network Errors
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  NOT_FOUND: 'Resource not found.',

  // Validation Errors
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_PASSWORD: 'Password must be at least 8 characters long.',
  REQUIRED_FIELD: 'This field is required.',

  // Cache Errors
  CACHE_ERROR: 'Failed to access cache.',
  SYNC_ERROR: 'Failed to synchronize data.',

  // Generic Errors
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
};
