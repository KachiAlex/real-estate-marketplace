const { resolveApiBaseUrl } = require('../utils/apiConfig');

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

const createApiClient = ({ baseUrl, storage, refreshFn, onBeforeRequest, axios } = {}) => {
  if (typeof refreshFn !== 'function') {
    throw new Error('refreshFn is required to handle 401 responses');
  }

  if (!axios || typeof axios.create !== 'function') {
    throw new Error('axios is required and must have a create method');
  }

  const tokenStorage = ensureStorage(storage);
  const resolvedBase = resolveApiBaseUrl(baseUrl);

  const instance = axios.create({
    baseURL: `${resolvedBase}/api`,
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
          if (result && result.accessToken) {
            tokenStorage.setAccessToken(result.accessToken);
            if (result.refreshToken) {
              tokenStorage.setRefreshToken(result.refreshToken);
            }
            processQueue(null, result.accessToken);

            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${result.accessToken}`;
            return instance(originalRequest);
          }

          tokenStorage.setAccessToken(null);
          tokenStorage.setRefreshToken(null);
          processQueue(new Error('Refresh failed'), null);
          return Promise.reject(error);
        } catch (refreshError) {
          processQueue(refreshError, null);
          tokenStorage.setAccessToken(null);
          tokenStorage.setRefreshToken(null);
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

module.exports = {
  createApiClient
};
