/**
 * Capacitor-based API Client
 * 
 * This is an updated version of apiClient.js that uses the CapacitorHttpClient
 * instead of axios. It maintains the same interface for backward compatibility.
 * 
 * Migration path:
 * 1. Import this instead of apiClient.js
 * 2. Gradually migrate components to use the new client
 * 3. Eventually replace the old axios-based client entirely
 */

import { getApiBaseUrl } from '../config/api';
import { createAxiosCompatibleClient } from './apiClientBridge';

// Token storage implementation
const tokenStorage = {
  getAccessToken: () => localStorage.getItem('accessToken') || localStorage.getItem('token'),
  getRefreshToken: () => localStorage.getItem('refreshToken'),
  setAccessToken: (token) => {
    if (!token) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('token');
    } else {
      localStorage.setItem('accessToken', token);
    }
  },
  setRefreshToken: (token) => {
    if (!token) {
      localStorage.removeItem('refreshToken');
    } else {
      localStorage.setItem('refreshToken', token);
    }
  }
};

// CSRF Token Management
let csrfToken = null;

/**
 * Fetch CSRF token from backend
 */
export const fetchCsrfToken = async (client) => {
  try {
    const response = await client.get('/csrf-token');
    if (response.data && response.data.token) {
      csrfToken = response.data.token;
      return response.data.token;
    }
  } catch (error) {
    console.warn('Failed to fetch CSRF token:', error?.message);
    return null;
  }
};

/**
 * Get current CSRF token
 */
export const getCsrfToken = () => csrfToken;

/**
 * Add mock headers for testing
 */
const addMockHeaders = (config) => {
  const token = tokenStorage.getAccessToken();
  if (!token || typeof token !== 'string' || !token.startsWith('mock-')) return;

  try {
    const rawUser = localStorage.getItem('currentUser');
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      if (parsed?.email) {
        config.headers = config.headers || {};
        config.headers['x-mock-user-email'] = parsed.email;
      }
    }
  } catch (_err) {
    // ignore parse errors
  }
};

/**
 * Create refresh function
 */
const createRefreshFunction = (baseUrl) => {
  const resolvedBase = getApiBaseUrl(baseUrl);
  const endpoints = [
    `${resolvedBase}/api/auth/jwt/refresh`,
    `${resolvedBase}/api/auth/refresh`
  ];

  return async (refreshToken) => {
    if (!refreshToken) return null;

    for (const url of endpoints) {
      try {
        // Use fetch directly for token refresh to avoid circular dependencies
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          return data?.accessToken || data?.token || data;
        }
      } catch (error) {
        console.warn(`Token refresh failed for ${url}:`, error);
        continue;
      }
    }

    return null;
  };
};

/**
 * Create the API client
 */
const client = createAxiosCompatibleClient({
  baseUrl: getApiBaseUrl(),
  storage: tokenStorage,
  refreshFn: createRefreshFunction(getApiBaseUrl()),
  onBeforeRequest: async (config) => {
    addMockHeaders(config);
    // CSRF token is handled by the CapacitorApiClient
  },
  timeout: 30000,
});

export default client;
