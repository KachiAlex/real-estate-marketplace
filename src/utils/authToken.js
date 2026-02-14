/**
 * Authentication Token Utility
 * Uses backend-issued tokens and will attempt to refresh the access token
 * automatically (once) when a request returns 401 Unauthorized.
 */

import { getApiUrl } from './apiConfig';

const readToken = () => {
  try {
    return localStorage.getItem('accessToken') || localStorage.getItem('token');
  } catch (error) {
    console.warn('getAuthToken: Could not read token from storage:', error);
    return null;
  }
};

const readRefreshToken = () => {
  try {
    return localStorage.getItem('refreshToken');
  } catch (error) {
    return null;
  }
};

export const getAuthToken = async () => readToken();

export const getAuthHeaders = async () => {
  const token = await getAuthToken();
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

export const hasAuthToken = async () => {
  const token = await getAuthToken();
  return Boolean(token);
};

const tryRefreshAccessToken = async () => {
  const refreshToken = readRefreshToken();
  if (!refreshToken) return null;
  try {
    const resp = await fetch(getApiUrl('/auth/jwt/refresh'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    const data = await resp.json();
    if (!resp.ok || !data?.accessToken) return null;
    localStorage.setItem('accessToken', data.accessToken);
    return data.accessToken;
  } catch (err) {
    console.warn('Refreshing access token failed', err);
    return null;
  }
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

  let res = await fetch(url, requestOptions);

  if (res.status === 401) {
    // Try refresh once
    const newToken = await tryRefreshAccessToken();
    if (newToken) {
      const retryHeaders = {
        ...requestOptions.headers,
        Authorization: `Bearer ${newToken}`
      };
      const retryOptions = { ...requestOptions, headers: retryHeaders };
      res = await fetch(url, retryOptions);
    }
  }

  return res;
};

export default {
  getAuthToken,
  getAuthHeaders,
  authenticatedFetch,
  hasAuthToken
};
