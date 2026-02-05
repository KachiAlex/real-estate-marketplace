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

export const getAuthToken = async () => readToken();

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
  const requestOptions = {
    ...options,
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
