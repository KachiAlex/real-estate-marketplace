/**
 * Authentication Interceptor
 * 
 * Handles JWT token management and automatic token injection into requests.
 * Also handles token refresh and 401 error responses.
 */

import { getHttpClient } from '../config/api';

/**
 * Token storage keys
 */
const TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const TOKEN_EXPIRY_KEY = 'tokenExpiry';

/**
 * Get stored auth token
 */
export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Get stored refresh token
 */
export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Set auth tokens
 */
export function setAuthTokens(token: string, refreshToken?: string, expiryMs?: number): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    if (expiryMs) {
      localStorage.setItem(TOKEN_EXPIRY_KEY, (Date.now() + expiryMs).toString());
    }
  } catch (error) {
    console.error('Failed to store auth tokens:', error);
  }
}

/**
 * Clear auth tokens
 */
export function clearAuthTokens(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  } catch (error) {
    console.error('Failed to clear auth tokens:', error);
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(): boolean {
  try {
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiry) return false;
    return Date.now() > parseInt(expiry);
  } catch {
    return false;
  }
}

/**
 * Callback for handling logout
 */
let onLogoutCallback: (() => void) | null = null;

/**
 * Set logout callback
 */
export function setOnLogoutCallback(callback: () => void): void {
  onLogoutCallback = callback;
}

/**
 * Trigger logout
 */
function triggerLogout(): void {
  clearAuthTokens();
  if (onLogoutCallback) {
    onLogoutCallback();
  }
}

/**
 * Setup authentication interceptors
 * 
 * This should be called once during app initialization
 */
export function setupAuthInterceptors(): void {
  const httpClient = getHttpClient();

  // Request interceptor: Add token to all requests
  httpClient.addRequestInterceptor((config) => {
    const token = getAuthToken();
    
    if (token) {
      return {
        ...config,
        headers: {
          ...config.headers,
          'Authorization': `Bearer ${token}`,
        },
      };
    }
    
    return config;
  });

  // Response interceptor: Handle 401 errors
  httpClient.addResponseInterceptor((response) => {
    if (response.status === 401) {
      // Token is invalid or expired
      triggerLogout();
    }
    return response;
  });

  // Error interceptor: Log auth errors
  httpClient.addErrorInterceptor((error) => {
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      triggerLogout();
    }
    return error;
  });
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const token = getAuthToken();
  return !!token && !isTokenExpired();
}

/**
 * Get authorization header value
 */
export function getAuthorizationHeader(): string | null {
  const token = getAuthToken();
  return token ? `Bearer ${token}` : null;
}

export default {
  getAuthToken,
  getRefreshToken,
  setAuthTokens,
  clearAuthTokens,
  isTokenExpired,
  isAuthenticated,
  getAuthorizationHeader,
  setupAuthInterceptors,
  setOnLogoutCallback,
};
