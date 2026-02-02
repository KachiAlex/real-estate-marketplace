/**
 * Authentication Token Utility
 * Provides functions to get and refresh Firebase authentication tokens
 */

import { auth } from '../config/firebase';

/**
 * Get a fresh Firebase ID token
 * Tries to get a fresh token from Firebase auth, falls back to stored token
 * @param {boolean} forceRefresh - Force token refresh even if not expired
 * @returns {Promise<string|null>} The token or null if not available
 */
export const getAuthToken = async (forceRefresh = false) => {
  let tokenSource = null;

  try {
    tokenSource = localStorage.getItem('tokenSource');
  } catch (storageError) {
    console.warn('getAuthToken: Could not read tokenSource from storage:', storageError);
  }

  if (tokenSource === 'backend') {
    try {
      const backendToken = localStorage.getItem('token');
      if (backendToken) {
        return backendToken;
      }
    } catch (storageError) {
      console.warn('getAuthToken: Failed to read backend token from storage:', storageError);
    }
  }

  try {
    // Only attempt Firebase token refresh when backend tokens are not explicitly preferred
    if (auth.currentUser && tokenSource !== 'backend') {
      const token = await auth.currentUser.getIdToken(forceRefresh);
      if (token) {
        // Update localStorage with fresh token and mark its source
        localStorage.setItem('token', token);
        localStorage.setItem('firebaseToken', token);
        localStorage.setItem('tokenSource', 'firebase');
        return token;
      }
    }
  } catch (error) {
    console.warn('getAuthToken: Could not get fresh Firebase token:', error);
  }

  // Fallback to stored tokens
  try {
    const storedToken = localStorage.getItem('token') || localStorage.getItem('firebaseToken');
    if (storedToken) {
      return storedToken;
    }
  } catch (storageError) {
    console.warn('getAuthToken: Failed to read stored token:', storageError);
  }

  // Try to get token from user object in localStorage
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser.token || currentUser.firebaseToken) {
      return currentUser.token || currentUser.firebaseToken;
    }
  } catch (error) {
    console.warn('getAuthToken: Could not parse user from localStorage:', error);
  }

  return null;
};

/**
 * Get authentication headers for API calls
 * @param {boolean} forceRefresh - Force token refresh
 * @returns {Promise<Object>} Headers object with Authorization header
 */
export const getAuthHeaders = async (forceRefresh = false) => {
  const token = await getAuthToken(forceRefresh);
  
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Check if user has a valid Firebase token
 * @returns {Promise<boolean>} True if user has a valid Firebase token
 */
export const hasAuthToken = async () => {
  const token = await getAuthToken();
  if (token) return true;
  
  // Check if auth.currentUser exists (indicates Firebase authentication)
  try {
    if (auth.currentUser) {
      return true;
    }
  } catch (error) {
    // Ignore
  }
  
  return false;
};

/**
 * Make an authenticated API call with automatic token refresh on 401
 * @param {string} url - The API endpoint URL
 * @param {Object} options - Fetch options (method, body, etc.)
 * @param {boolean} retryOn401 - Whether to retry once with refreshed token on 401
 * @returns {Promise<Response>} The fetch response
 */
export const authenticatedFetch = async (url, options = {}, retryOn401 = true) => {
  // Get initial headers (may include Authorization)
  let headers = await getAuthHeaders();

  // If there is no Authorization header but a Firebase user exists, force refresh once
  try {
    if (!headers.Authorization && auth && auth.currentUser) {
      console.log('authenticatedFetch: No Authorization header present, forcing token refresh');
      headers = await getAuthHeaders(true);
    }
  } catch (e) {
    console.warn('authenticatedFetch: Error while refreshing token:', e?.message || e);
  }

  // If still no Authorization header and no Firebase user, return 401 to avoid unauthenticated calls
  if (!headers.Authorization && (!auth || !auth.currentUser)) {
    console.log('authenticatedFetch: No auth token available and no Firebase user, skipping API call');
    return new Response(JSON.stringify({ error: 'No authentication token' }), {
      status: 401,
      statusText: 'Unauthorized',
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // If using a mock token, also send x-mock-user-email header so backend can verify it
  if (headers.Authorization && headers.Authorization.includes('mock-')) {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (currentUser.email) {
        headers['x-mock-user-email'] = currentUser.email;
        console.log('authenticatedFetch: Mock token detected, adding x-mock-user-email header');
      }
    } catch (e) {
      console.warn('authenticatedFetch: Error reading currentUser for mock header:', e?.message || e);
    }
  }

  const initialOptions = {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {})
    }
  };

  console.log('authenticatedFetch: Request headers:', initialOptions.headers);

  let response = await fetch(url, initialOptions);

  // If 401 and retry is enabled, try once with refreshed token
  // But only if we actually have auth.currentUser (Firebase user)
  if (response.status === 401 && retryOn401) {
    const canRefresh = auth && auth.currentUser !== null;
    if (canRefresh) {
      console.log('authenticatedFetch: Got 401, refreshing token and retrying...');
      const refreshedHeaders = await getAuthHeaders(true); // Force refresh
      const retryOptions = {
        ...options,
        headers: {
          ...refreshedHeaders,
          ...(options.headers || {})
        }
      };
      console.log('authenticatedFetch: Retry request headers:', retryOptions.headers);
      response = await fetch(url, retryOptions);
    } else {
      // No Firebase user, so token refresh won't help
      console.log('authenticatedFetch: Got 401 but no Firebase user available for token refresh');
    }
  }

  return response;
};

export default {
  getAuthToken,
  getAuthHeaders,
  authenticatedFetch,
  hasAuthToken
};

