/**
 * Environment Configuration
 * Environment-specific settings for API, cache, and build
 */

const ENV = process.env.REACT_APP_BUILD_ENV || 'production';

export const CONFIG = {
  // API Configuration
  API_URL:
    ENV === 'development'
      ? 'http://localhost:5001'
      : process.env.REACT_APP_API_URL || 'https://propertyark-backend.onrender.com/api',
  API_TIMEOUT: parseInt(process.env.REACT_APP_API_TIMEOUT || '30000', 10),

  // Authentication
  AUTH_REFRESH_ENDPOINT: process.env.REACT_APP_AUTH_REFRESH_ENDPOINT || '/auth/refresh',
  AUTH_LOGIN_ENDPOINT: process.env.REACT_APP_AUTH_LOGIN_ENDPOINT || '/auth/login',
  AUTH_LOGOUT_ENDPOINT: process.env.REACT_APP_AUTH_LOGOUT_ENDPOINT || '/auth/logout',

  // Cache Configuration
  CACHE_TTL: parseInt(process.env.REACT_APP_CACHE_TTL || '86400000', 10), // 24 hours
  CACHE_MAX_SIZE: parseInt(process.env.REACT_APP_CACHE_MAX_SIZE || '104857600', 10), // 100MB

  // Build Configuration
  BUILD_ENV: ENV,
  VERSION: process.env.REACT_APP_VERSION || '1.0.0',

  // Security
  CERTIFICATE_PINNING: process.env.REACT_APP_CERTIFICATE_PINNING === 'true',
  SECURE_STORAGE: process.env.REACT_APP_SECURE_STORAGE !== 'false',
};
