import axios from 'axios';
import { getApiBaseUrl } from '../utils/apiConfig';

// Base API URL points to the normalized /api base
const API_BASE = `${getApiBaseUrl()}/api`;

const client = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // allow cookies for refresh endpoints (if used)
  timeout: 30_000
});

// Helper to read tokens from storage (AuthContext-new also persists here)
const readAccessToken = () => localStorage.getItem('accessToken') || localStorage.getItem('token');
const readRefreshToken = () => localStorage.getItem('refreshToken');

// Attach access token to requests when present
client.interceptors.request.use((config) => {
  const token = readAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: on 401 try a refresh and retry once
let isRefreshing = false;
let refreshQueue = [];

const processQueue = (error, token = null) => {
  refreshQueue.forEach(p => (error ? p.reject(error) : p.resolve(token)));
  refreshQueue = [];
};

client.interceptors.response.use(
  (resp) => resp,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    const status = error.response?.status;

    // Only handle 401 for API requests and allow one retry
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        if (isRefreshing) {
          // Queue the request until refresh finishes
          return new Promise((resolve, reject) => {
            refreshQueue.push({ resolve, reject });
          }).then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return client(originalRequest);
          });
        }

        isRefreshing = true;
        const refreshToken = readRefreshToken();
        if (!refreshToken) {
          // No refresh token available — clear auth and fail
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          return Promise.reject(error);
        }

        // Call refresh endpoint (backend returns new accessToken)
        const resp = await axios.post(`${API_BASE.replace(/\/api$/, '')}/auth/jwt/refresh`, { refreshToken }, { withCredentials: true });

        if (resp?.data?.accessToken) {
          const newToken = resp.data.accessToken;
          localStorage.setItem('accessToken', newToken);
          // resolve queued requests
          processQueue(null, newToken);

          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return client(originalRequest);
        }

        // Refresh failed — clear stored tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        processQueue(new Error('Refresh failed'), null);
        return Promise.reject(error);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default client;
