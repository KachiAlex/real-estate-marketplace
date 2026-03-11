import { createApiClient, createRefreshFunction } from '@real-estate-marketplace/shared';
import { getApiBaseUrl } from '../utils/apiConfig';
import axios from 'axios';

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

const client = createApiClient({
  baseUrl: getApiBaseUrl(),
  storage: tokenStorage,
  refreshFn: createRefreshFunction(getApiBaseUrl()),
  onBeforeRequest: addMockHeaders,
  axios: axios
});

export default client;
