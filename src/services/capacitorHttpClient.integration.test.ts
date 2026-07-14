/**
 * Integration Tests for Capacitor HTTP Client
 * 
 * Tests the integration of the Capacitor HTTP client with the API configuration
 * and API client bridge.
 */

import { getHttpClient, resetHttpClient, getApiUrl, getApiBaseUrl } from '../config/api';
import { getApiClient, resetApiClient, ApiClientBridge } from './apiClientBridge';
import { CapacitorHttpClient } from './capacitorHttpClient';

describe('Capacitor HTTP Client Integration', () => {
  beforeEach(() => {
    resetHttpClient();
    resetApiClient();
    jest.clearAllMocks();
  });

  describe('HTTP Client Initialization', () => {
    it('should create HTTP client with correct base URL', () => {
      const httpClient = getHttpClient();
      expect(httpClient).toBeInstanceOf(CapacitorHttpClient);
      expect(httpClient.getBaseUrl()).toBeDefined();
    });

    it('should return same instance on multiple calls', () => {
      const client1 = getHttpClient();
      const client2 = getHttpClient();
      expect(client1).toBe(client2);
    });

    it('should reset HTTP client', () => {
      const client1 = getHttpClient();
      resetHttpClient();
      const client2 = getHttpClient();
      expect(client1).not.toBe(client2);
    });
  });

  describe('API Client Bridge', () => {
    it('should create API client bridge', () => {
      const apiClient = getApiClient();
      expect(apiClient).toBeInstanceOf(ApiClientBridge);
    });

    it('should return same instance on multiple calls', () => {
      const client1 = getApiClient();
      const client2 = getApiClient();
      expect(client1).toBe(client2);
    });

    it('should reset API client', () => {
      const client1 = getApiClient();
      resetApiClient();
      const client2 = getApiClient();
      expect(client1).not.toBe(client2);
    });
  });

  describe('API URL Building', () => {
    it('should build correct API URL for paths', () => {
      const url1 = getApiUrl('/users');
      expect(url1).toContain('/api/users');

      const url2 = getApiUrl('properties');
      expect(url2).toContain('/api/properties');

      const url3 = getApiUrl('/api/listings');
      expect(url3).toContain('/api/listings');
    });

    it('should handle absolute URLs', () => {
      const url = getApiUrl('https://other-api.com/data');
      expect(url).toBe('https://other-api.com/data');
    });

    it('should return base API URL when no path provided', () => {
      const url = getApiUrl();
      expect(url).toContain('/api');
    });
  });

  describe('API Client Bridge Methods', () => {
    it('should have GET method', () => {
      const apiClient = getApiClient();
      expect(apiClient.get).toBeDefined();
      expect(typeof apiClient.get).toBe('function');
    });

    it('should have POST method', () => {
      const apiClient = getApiClient();
      expect(apiClient.post).toBeDefined();
      expect(typeof apiClient.post).toBe('function');
    });

    it('should have PUT method', () => {
      const apiClient = getApiClient();
      expect(apiClient.put).toBeDefined();
      expect(typeof apiClient.put).toBe('function');
    });

    it('should have DELETE method', () => {
      const apiClient = getApiClient();
      expect(apiClient.delete).toBeDefined();
      expect(typeof apiClient.delete).toBe('function');
    });

    it('should have PATCH method', () => {
      const apiClient = getApiClient();
      expect(apiClient.patch).toBeDefined();
      expect(typeof apiClient.patch).toBe('function');
    });
  });

  describe('Interceptor Support', () => {
    it('should support request interceptors', () => {
      const apiClient = getApiClient();
      const interceptor = jest.fn((config) => config);
      
      expect(() => {
        apiClient.addRequestInterceptor(interceptor);
      }).not.toThrow();
    });

    it('should support response interceptors', () => {
      const apiClient = getApiClient();
      const interceptor = jest.fn((response) => response);
      
      expect(() => {
        apiClient.addResponseInterceptor(interceptor);
      }).not.toThrow();
    });

    it('should support error interceptors', () => {
      const apiClient = getApiClient();
      const interceptor = jest.fn((error) => error);
      
      expect(() => {
        apiClient.addErrorInterceptor(interceptor);
      }).not.toThrow();
    });
  });

  describe('API Response Format', () => {
    it('should return response with success flag', async () => {
      const apiClient = getApiClient();
      
      // Mock the HTTP client
      const httpClient = getHttpClient();
      jest.spyOn(httpClient, 'get').mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: {},
        data: { id: 1, name: 'Test' },
      });

      const response = await apiClient.get('/test');
      
      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('data');
      expect(response.success).toBe(true);
    });

    it('should return error response on failure', async () => {
      const apiClient = getApiClient();
      
      // Mock the HTTP client to throw error
      const httpClient = getHttpClient();
      jest.spyOn(httpClient, 'get').mockRejectedValue(
        new Error('Network error')
      );

      const response = await apiClient.get('/test');
      
      expect(response.success).toBe(false);
      expect(response).toHaveProperty('error');
    });
  });

  describe('Configuration Integration', () => {
    it('should use configured base URL', () => {
      const baseUrl = getApiBaseUrl();
      expect(baseUrl).toBeDefined();
      expect(typeof baseUrl).toBe('string');
      expect(baseUrl.length).toBeGreaterThan(0);
    });

    it('should include default headers', () => {
      const httpClient = getHttpClient();
      const headers = httpClient.getDefaultHeaders();
      
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['Accept']).toBe('application/json');
    });

    it('should have configured timeout', () => {
      const httpClient = getHttpClient();
      const timeout = httpClient.getDefaultTimeout();
      
      expect(timeout).toBeGreaterThan(0);
      expect(timeout).toBe(30000); // 30 seconds
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP errors gracefully', async () => {
      const apiClient = getApiClient();
      
      const httpClient = getHttpClient();
      jest.spyOn(httpClient, 'get').mockRejectedValue(
        new Error('HTTP 404: Not Found')
      );

      const response = await apiClient.get('/nonexistent');
      
      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });

    it('should handle network errors gracefully', async () => {
      const apiClient = getApiClient();
      
      const httpClient = getHttpClient();
      jest.spyOn(httpClient, 'get').mockRejectedValue(
        new Error('Network error')
      );

      const response = await apiClient.get('/test');
      
      expect(response.success).toBe(false);
      expect(response.error).toContain('Network error');
    });

    it('should handle timeout errors gracefully', async () => {
      const apiClient = getApiClient();
      
      const httpClient = getHttpClient();
      jest.spyOn(httpClient, 'get').mockRejectedValue(
        new Error('Request timeout')
      );

      const response = await apiClient.get('/test');
      
      expect(response.success).toBe(false);
      expect(response.error).toContain('timeout');
    });
  });

  describe('Request Options', () => {
    it('should pass custom headers', async () => {
      const apiClient = getApiClient();
      
      const httpClient = getHttpClient();
      const getSpy = jest.spyOn(httpClient, 'get').mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: {},
        data: {},
      });

      await apiClient.get('/test', {
        headers: { 'Authorization': 'Bearer token' },
      });

      expect(getSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer token',
          }),
        })
      );
    });

    it('should pass query parameters', async () => {
      const apiClient = getApiClient();
      
      const httpClient = getHttpClient();
      const getSpy = jest.spyOn(httpClient, 'get').mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: {},
        data: {},
      });

      await apiClient.get('/test', {
        params: { page: 1, limit: 10 },
      });

      expect(getSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: { page: 1, limit: 10 },
        })
      );
    });

    it('should pass custom timeout', async () => {
      const apiClient = getApiClient();
      
      const httpClient = getHttpClient();
      const getSpy = jest.spyOn(httpClient, 'get').mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: {},
        data: {},
      });

      await apiClient.get('/test', {
        timeout: 5000,
      });

      expect(getSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          timeout: 5000,
        })
      );
    });
  });
});
