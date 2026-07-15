/**
 * Authentication Token Utility
 * Uses backend-issued tokens only.
 */

const readToken = () => {
  try {
    return localStorage.getItem('accessToken') || localStorage.getItem('token');
  } catch (error) {
    console.warn('getAuthToken: Could not read token from storage:', error);
    return null;
  }
};

export const getAuthToken = () => readToken();

export const getAuthHeaders = async () => {
  const token = await getAuthToken();
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

export const hasAuthToken = async () => {
  const token = await getAuthToken();
  return Boolean(token);
};

export const authenticatedFetch = async (url, options = {}) => {
  const headers = await getAuthHeaders();

  // Add CSRF token for state-changing requests
  const method = (options.method || 'GET').toUpperCase();
  if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
    try {
      const { fetchCsrfToken } = await import('../services/apiClient');
      const csrfToken = await fetchCsrfToken();
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }
    } catch (e) {
      console.warn('authenticatedFetch: Failed to fetch CSRF token:', e?.message);
    }
  }

  const requestOptions = {
    ...options,
    credentials: 'include',
    headers: {
      ...headers,
      ...(options.headers || {})
    }
  };

  return fetch(url, requestOptions);
};

export default {
  getAuthToken,
  getAuthHeaders,
  authenticatedFetch,
  hasAuthToken
};
