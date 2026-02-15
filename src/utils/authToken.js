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

  // Debug: show what headers we're sending
  try {
    console.log('authenticatedFetch: url=', url);
    console.log('authenticatedFetch: Authorization header present:', !!requestOptions.headers.Authorization);
    if (requestOptions.headers.Authorization) {
      console.log('authenticatedFetch: token starts with:', requestOptions.headers.Authorization.substring(0, 20) + '...');
    } else {
      console.log('authenticatedFetch: no Authorization header');
    }
  } catch (e) {}

  let res = await fetch(url, requestOptions);

  console.log('authenticatedFetch: initial response status:', res.status, 'for', url);

  if (res.status === 401) {
    console.log('authenticatedFetch: got 401, attempting token refresh');
    // Try refresh once
    const newToken = await tryRefreshAccessToken();
    if (newToken) {
      console.log('authenticatedFetch: token refresh successful, retrying request');
      const retryHeaders = {
        ...requestOptions.headers,
        Authorization: `Bearer ${newToken}`
      };
      const retryOptions = { ...requestOptions, headers: retryHeaders };
      try {
        console.debug('authenticatedFetch: retrying with refreshed token for', url);
      } catch (e) {}
      const retryRes = await fetch(url, retryOptions);
      console.log('authenticatedFetch: retry response status:', retryRes.status, 'for', url);
      
      // If retry also fails with 401, the refreshed token is invalid - logout user
      if (retryRes.status === 401) {
        console.log('authenticatedFetch: refreshed token also unauthorized, logging out user');
        // Clear tokens and trigger logout
        try {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('currentUser');
          // Trigger logout by calling the logout endpoint if possible
          await fetch(getApiUrl('/auth/jwt/logout'), {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${newToken}` }
          }).catch(() => {}); // Ignore logout errors
        } catch (e) {}
        // Return the 401 response so the component can handle it
        return retryRes;
      }
      
      // Retry successful, return the new response
      return retryRes;
    } else {
      console.log('authenticatedFetch: token refresh failed or no refresh token');
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
