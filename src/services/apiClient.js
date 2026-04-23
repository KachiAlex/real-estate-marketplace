import { getApiBaseUrl } from '../utils/apiConfig';
import axios from 'axios';

// Inline implementations from shared package
const ensureStorage = (storage) => {
  if (!storage) {
    throw new Error('Token storage implementation is required for createApiClient');
  }

  const requiredFns = ['getAccessToken', 'getRefreshToken', 'setAccessToken', 'setRefreshToken'];
  const missing = requiredFns.filter((fn) => typeof storage[fn] !== 'function');
  if (missing.length) {
    throw new Error(`Token storage must implement ${missing.join(', ')}`);
  }

  return storage;
};

const createApiClient = ({ baseUrl, storage, refreshFn, onBeforeRequest, axios: axiosToUse } = {}) => {
  if (typeof refreshFn !== 'function') {
    throw new Error('refreshFn is required to handle 401 responses');
  }

  if (!axiosToUse || typeof axiosToUse.create !== 'function') {
    throw new Error('axios is required and must have a create method');
  }

  const tokenStorage = ensureStorage(storage);
  const resolvedBase = getApiBaseUrl(baseUrl);

  const instance = axiosToUse.create({
    baseURL: '/api',
    withCredentials: true,
    timeout: 30_000
  });

  let isRefreshing = false;
  const queue = [];

  const processQueue = (error, token = null) => {
    while (queue.length) {
      const pending = queue.shift();
      if (!pending) continue;
      if (error || !token) {
        pending.reject(error || new Error('Token refresh failed'));
      } else {
        pending.resolve(token);
      }
    }
  };

  const refreshTokenIfNeeded = async (originalRequest) => {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push({ resolve, reject });
      });
    }

    isRefreshing = true;

    try {
      const newToken = await refreshFn();
      if (newToken) {
        tokenStorage.setAccessToken(newToken);
        processQueue(null, newToken);

        // Retry the original request with new token
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosToUse(originalRequest);
      } else {
        processQueue(new Error('Token refresh failed'));
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      processQueue(error);
      throw error;
    } finally {
      isRefreshing = false;
    }
  };

  // Request interceptor
  instance.interceptors.request.use(
    (config) => {
      if (onBeforeRequest) {
        onBeforeRequest(config);
      }

      const token = tokenStorage.getAccessToken();
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          return await refreshTokenIfNeeded(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          tokenStorage.setAccessToken(null);
          tokenStorage.setRefreshToken(null);
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

const createRefreshFunction = (baseUrl) => {
  const endpoints = [
    '/api/auth/jwt/refresh',
    '/api/auth/refresh'
  ];

  return async (refreshToken) => {
    if (!refreshToken) return null;

    for (const url of endpoints) {
      try {
        const response = await axios.post(url, { refreshToken }, { withCredentials: true });
        if (response?.data) {
          return response.data;
        }
      } catch (error) {
        const status = error?.response?.status;
        if (status && status !== 404) {
          // For non-404 errors we still attempt the remaining endpoints once
          continue;
        }
      }
    }

    return null;
  };
};

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

// CSRF Token Management (Phase 2.1)
// Store CSRF token in memory (not localStorage) for security
let csrfToken = null;

/**
 * Fetch CSRF token from backend
 * Should be called on app initialization
 */
export const fetchCsrfToken = async () => {
  try {
    const { getApiUrl } = require('../utils/apiConfig');
    const response = await axios.get(getApiUrl('/csrf-token'));
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
 * Add CSRF token to request headers for state-changing requests
 */
const addCsrfToken = (config) => {
  // Only add CSRF token for state-changing requests
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method?.toUpperCase())) {
    if (csrfToken) {
      config.headers = config.headers || {};
      config.headers['X-CSRF-Token'] = csrfToken;
    } else {
      console.warn('⚠️ [CSRF] No token available for state-changing request to', config.url);
    }
  }
  return config;
};

const client = createApiClient({
  baseUrl: getApiBaseUrl(),
  storage: tokenStorage,
  refreshFn: createRefreshFunction(getApiBaseUrl()),
  onBeforeRequest: (config) => {
    addMockHeaders(config);
    addCsrfToken(config);
    return config;
  },
  axios: axios
});

export default client;
