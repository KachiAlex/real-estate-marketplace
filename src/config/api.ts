/**
 * Capacitor Mobile App - API Configuration Module
 * 
 * This module provides environment-specific API endpoint configuration
 * for the Capacitor mobile app, with platform detection and fallback support.
 */

import { Capacitor } from '@capacitor/core';
import { CapacitorHttpClient } from '../services/capacitorHttpClient';

/**
 * Singleton instance of the HTTP client
 */
let httpClient: CapacitorHttpClient | null = null;

/**
 * Get or create the HTTP client instance
 */
export const getHttpClient = (): CapacitorHttpClient => {
  if (!httpClient) {
    const baseUrl = getApiBaseUrl();
    httpClient = new CapacitorHttpClient(baseUrl, 30000);
    
    // Set default headers
    httpClient.setDefaultHeaders(getDefaultHeaders());
  }
  return httpClient;
};

/**
 * Reset the HTTP client (useful for testing or changing base URL)
 */
export const resetHttpClient = (): void => {
  httpClient = null;
};

/**
 * Get the API base URL based on environment and platform
 * 
 * Priority:
 * 1. REACT_APP_MOBILE_API_URL (for native mobile)
 * 2. REACT_APP_API_URL (general environment variable)
 * 3. Platform-specific defaults
 * 4. Fallback to production URL
 */
export const getApiBaseUrl = (): string => {
  // For native platforms, prefer mobile-specific URL
  if (Capacitor.isNativePlatform()) {
    if (process.env.REACT_APP_MOBILE_API_URL) {
      return process.env.REACT_APP_MOBILE_API_URL;
    }
  }

  // Fall back to general API URL
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // Platform-specific defaults
  if (Capacitor.isNativePlatform()) {
    // For native apps, use production URL
    return 'https://propertyark.vercel.app';
  }

  // For web, use localhost or production
  if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
    return 'http://localhost:5001';
  }

  // Default to production
  return 'https://propertyark.vercel.app';
};

/**
 * Get the full API endpoint URL
 * 
 * @param path - The API path (e.g., '/users', 'blog')
 * @returns Full API endpoint URL
 */
export const getApiUrl = (path: string = ''): string => {
  const base = getApiBaseUrl();
  
  if (!path) {
    return `${base}/api`;
  }

  // Handle absolute URLs
  if (path.startsWith('http')) {
    return path;
  }

  // Handle paths with /api prefix
  if (path.startsWith('/api')) {
    return `${base}${path}`;
  }

  // Handle paths with leading slash
  if (path.startsWith('/')) {
    return `${base}/api${path}`;
  }

  // Handle relative paths
  return `${base}/api/${path}`;
};

/**
 * Get platform information for API configuration
 */
export const getPlatformInfo = () => {
  const platform = Capacitor.getPlatform();
  const isNative = Capacitor.isNativePlatform();

  return {
    platform,
    isNative,
    isIOS: platform === 'ios',
    isAndroid: platform === 'android',
    isWeb: platform === 'web',
  };
};

/**
 * Configure HTTP plugin for API calls
 * 
 * This initializes the Capacitor HTTP client with appropriate headers
 * and configuration for the mobile app.
 */
export const configureHttpPlugin = async (): Promise<void> => {
  try {
    // Initialize the HTTP client
    getHttpClient();
    
    // Add any custom interceptors if needed
    // Example: getHttpClient().addRequestInterceptor((config) => { ... });
    
    console.log('HTTP client configured for Capacitor');
  } catch (error) {
    console.error('Failed to configure HTTP client:', error);
  }
};

/**
 * Get default HTTP headers for API requests
 * 
 * @returns Object with default headers
 */
export const getDefaultHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Add platform identifier for debugging
  if (Capacitor.isNativePlatform()) {
    const platform = Capacitor.getPlatform();
    headers['X-Platform'] = platform;
    headers['X-Client'] = 'capacitor-mobile';
  }

  return headers;
};

/**
 * Check if we should use Capacitor HTTP plugin
 * 
 * @returns true if running on native platform
 */
export const shouldUseCapacitorHttp = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Get API configuration object
 * 
 * @returns Configuration object with all API settings
 */
export const getApiConfig = () => {
  return {
    baseUrl: getApiBaseUrl(),
    apiUrl: getApiUrl(),
    platform: getPlatformInfo(),
    headers: getDefaultHeaders(),
    useCapacitorHttp: shouldUseCapacitorHttp(),
    timeout: 30000, // 30 seconds
  };
};

export default {
  getApiBaseUrl,
  getApiUrl,
  getPlatformInfo,
  configureHttpPlugin,
  getDefaultHeaders,
  shouldUseCapacitorHttp,
  getApiConfig,
  getHttpClient,
  resetHttpClient,
};
