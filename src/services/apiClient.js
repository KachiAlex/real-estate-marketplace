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
    // If using a frontend mock token, also attach the mock user email header so backend can resolve mock user
    try {
      if (typeof token === 'string' && token.startsWith('mock-')) {
        const rawUser = localStorage.getItem('currentUser');
        if (rawUser) {
          const parsed = JSON.parse(rawUser);
          if (parsed && parsed.email) {
            config.headers['x-mock-user-email'] = parsed.email;
          }
        }
      }
    } catch (e) {
      // ignore JSON parse errors
    }
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
        // Call refresh endpoint (try jwt path first, then fallback to non-jwt)
        const performRefresh = async (token) => {
          const base = API_BASE.replace(/\/api$/, '');
          // Ensure refresh endpoints include the /api prefix (server mounts routes under /api)
          const jwtUrl = `${base}/api/auth/jwt/refresh`;
          const altUrl = `${base}/api/auth/refresh`;
          try {
            const r = await axios.post(jwtUrl, { refreshToken: token }, { withCredentials: true });
            if (r?.data) return r.data;
            if (r?.status === 404) {
              const r2 = await axios.post(altUrl, { refreshToken: token }, { withCredentials: true });
              return r2?.data || null;
            }
            return r?.data || null;
          } catch (e) {
            // If first call returned 404 or failed, try fallback once
            if (e?.response?.status === 404) {
              try {
                const r2 = await axios.post(altUrl, { refreshToken: token }, { withCredentials: true });
                return r2?.data || null;
              } catch (e2) {
                return null;
              }
            }
            // For other errors, attempt fallback as a last resort
            try {
              const r2 = await axios.post(altUrl, { refreshToken: token }, { withCredentials: true });
              return r2?.data || null;
            } catch (e2) {
              return null;
            }
          }
        };

        const resp = await performRefresh(refreshToken);

        if (resp && resp.accessToken) {
          const newToken = resp.accessToken;
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
