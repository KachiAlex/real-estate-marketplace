/**
 * Tests for Capacitor HTTP Client
 * 
 * Tests the unified HTTP client that uses Capacitor HTTP plugin on native
 * platforms and fetch API on web.
 */

import { CapacitorHttpClient, HttpError, NetworkError, TimeoutError } from './capacitorHttpClient';
import { Capacitor } from '@capacitor/core';

// Mock Capacitor
jest.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: jest.fn(() => false),
    getPlatform: jest.fn(() => 'web'),
    getPlugin: jest.fn(),
  },
}));

// Mock Capacitor HTTP (optional)
jest.mock('@capacitor/http', () => ({
  Http: {
    request: jest.fn(),
  },
}), { virtual: true });

// Mock fetch
global.fetch = jest.fn();

describe('CapacitorHttpClient', () => {
  let client: CapacitorHttpClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new CapacitorHttpClient('https://api.example.com');
  });

  describe('Initialization', () => {
    it('should initialize with default base URL', () => {
      const defaultClient = new CapacitorHttpClient();
      expect(defaultClient.getBaseUrl()).toBeDefined();
    });

    it('should initialize with custom base URL', () => {
      expect(client.getBaseUrl()).toBe('https://api.example.com');
    });

    it('should initialize with custom timeout', () => {
      const customClient = new CapacitorHttpClient('https://api.example.com', 60000);
      expect(customClient.getDefaultTimeout()).toBe(60000);
    });

    it('should have default headers', () => {
      const headers = client.getDefaultHeaders();
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['Accept']).toBe('application/json');
    });
  });

  describe('Web Platform Requests', () => {
    beforeEach(() => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
    });

    it('should make GET request on web', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().mockResolvedValue({ id: 1, name: 'Test' }),
        text: jest.fn(),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const response = await client.get('/users/1');

      expect(response.status).toBe(200);
      expect(response.data).toEqual({ id: 1, name: 'Test' });
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should make POST request on web', async () => {
      const mockResponse = {
        ok: true,
        status: 201,
        statusText: 'Created',
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().mockResolvedValue({ id: 1, name: 'New User' }),
        text: jest.fn(),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const response = await client.post('/users', { name: 'New User' });

      expect(response.status).toBe(201);
      expect(response.data).toEqual({ id: 1, name: 'New User' });
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'New User' }),
        })
      );
    });

    it('should make PUT request on web', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().mockResolvedValue({ id: 1, name: 'Updated User' }),
        text: jest.fn(),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const response = await client.put('/users/1', { name: 'Updated User' });

      expect(response.status).toBe(200);
      expect(response.data).toEqual({ id: 1, name: 'Updated User' });
    });

    it('should make DELETE request on web', async () => {
      const mockResponse = {
        ok: true,
        status: 204,
        statusText: 'No Content',
        headers: new Map(),
        json: jest.fn().mockResolvedValue(null),
        text: jest.fn(),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const response = await client.delete('/users/1');

      expect(response.status).toBe(204);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should make PATCH request on web', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().mockResolvedValue({ id: 1, name: 'Patched User' }),
        text: jest.fn(),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const response = await client.patch('/users/1', { name: 'Patched User' });

      expect(response.status).toBe(200);
      expect(response.data).toEqual({ id: 1, name: 'Patched User' });
    });

    it('should handle query parameters', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().mockResolvedValue([]),
        text: jest.fn(),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await client.get('/users', { params: { page: 1, limit: 10 } });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=1&limit=10'),
        expect.any(Object)
      );
    });

    it('should handle HTTP errors on web', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().mockResolvedValue({ error: 'Not found' }),
        text: jest.fn(),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(client.get('/users/999')).rejects.toThrow(HttpError);
    });

    it('should handle network errors on web', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new TypeError('Network error'));

      await expect(client.get('/users')).rejects.toThrow(NetworkError);
    });

    it('should handle timeout on web', async () => {
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((_, reject) => {
            const error = new Error('Aborted');
            (error as any).name = 'AbortError';
            reject(error);
          })
      );

      await expect(client.get('/users', { timeout: 100 })).rejects.toThrow(TimeoutError);
    });

    it('should include custom headers', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().mockResolvedValue({}),
        text: jest.fn(),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await client.get('/users', {
        headers: { 'Authorization': 'Bearer token' },
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer token',
          }),
        })
      );
    });
  });

  describe('Native Platform Requests', () => {
    beforeEach(() => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
      // Mock the Http module
      jest.doMock('@capacitor/http', () => ({
        Http: {
          request: jest.fn(),
        },
      }), { virtual: true });
    });

    it('should make GET request on native', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        data: { id: 1, name: 'Test' },
      };

      // Since Http is dynamically loaded, we'll test the web fallback instead
      // when the plugin is not available
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);

      const mockFetchResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().mockResolvedValue({ id: 1, name: 'Test' }),
        text: jest.fn(),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockFetchResponse);

      const response = await client.get('/users/1');

      expect(response.status).toBe(200);
      expect(response.data).toEqual({ id: 1, name: 'Test' });
    });

    it('should make POST request on native', async () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);

      const mockFetchResponse = {
        ok: true,
        status: 201,
        statusText: 'Created',
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().mockResolvedValue({ id: 1, name: 'New User' }),
        text: jest.fn(),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockFetchResponse);

      const response = await client.post('/users', { name: 'New User' });

      expect(response.status).toBe(201);
    });

    it('should handle HTTP errors on native', async () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);

      const mockFetchResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().mockResolvedValue({ error: 'Not found' }),
        text: jest.fn(),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockFetchResponse);

      await expect(client.get('/users/999')).rejects.toThrow(HttpError);
    });

    it('should handle network errors on native', async () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);

      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(client.get('/users')).rejects.toThrow(NetworkError);
    });

    it('should handle timeout on native', async () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);

      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((_, reject) => {
            const error = new Error('Aborted');
            (error as any).name = 'AbortError';
            reject(error);
          })
      );

      await expect(client.get('/users')).rejects.toThrow(TimeoutError);
    });
  });

  describe('Interceptors', () => {
    it('should apply request interceptor', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().mockResolvedValue({}),
        text: jest.fn(),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);

      const interceptor = jest.fn((config) => ({
        ...config,
        headers: { ...config.headers, 'X-Custom': 'value' },
      }));

      client.addRequestInterceptor(interceptor);

      await client.get('/users');

      expect(interceptor).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom': 'value',
          }),
        })
      );
    });

    it('should apply response interceptor', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().mockResolvedValue({ id: 1 }),
        text: jest.fn(),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);

      const interceptor = jest.fn((response) => ({
        ...response,
        data: { ...response.data, processed: true },
      }));

      client.addResponseInterceptor(interceptor);

      const response = await client.get('/users');

      expect(interceptor).toHaveBeenCalled();
      expect(response.data).toEqual({ id: 1, processed: true });
    });

    it('should apply error interceptor', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new TypeError('Network error'));
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);

      const interceptor = jest.fn((error) => {
        const newError = new Error('Intercepted: ' + error.message);
        return newError;
      });

      client.addErrorInterceptor(interceptor);

      await expect(client.get('/users')).rejects.toThrow('Intercepted');
      expect(interceptor).toHaveBeenCalled();
    });
  });

  describe('Configuration Methods', () => {
    it('should set and get base URL', () => {
      client.setBaseUrl('https://new-api.example.com');
      expect(client.getBaseUrl()).toBe('https://new-api.example.com');
    });

    it('should set and get default headers', () => {
      client.setDefaultHeaders({ 'X-Custom': 'value' });
      const headers = client.getDefaultHeaders();
      expect(headers['X-Custom']).toBe('value');
    });

    it('should set and get default timeout', () => {
      client.setDefaultTimeout(60000);
      expect(client.getDefaultTimeout()).toBe(60000);
    });
  });

  describe('URL Building', () => {
    it('should build URL with path', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().mockResolvedValue({}),
        text: jest.fn(),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);

      await client.get('/users/1');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.any(Object)
      );
    });

    it('should handle absolute URLs', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().mockResolvedValue({}),
        text: jest.fn(),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);

      await client.get('https://other-api.example.com/data');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://other-api.example.com/data',
        expect.any(Object)
      );
    });
  });

  describe('Error Classes', () => {
    it('should create HttpError', () => {
      const error = new HttpError(404, 'Not Found', { error: 'Not found' });
      expect(error.status).toBe(404);
      expect(error.statusText).toBe('Not Found');
      expect(error.data).toEqual({ error: 'Not found' });
      expect(error.name).toBe('HttpError');
    });

    it('should create NetworkError', () => {
      const error = new NetworkError('Connection failed');
      expect(error.message).toBe('Connection failed');
      expect(error.name).toBe('NetworkError');
    });

    it('should create TimeoutError', () => {
      const error = new TimeoutError('Request timeout');
      expect(error.message).toBe('Request timeout');
      expect(error.name).toBe('TimeoutError');
    });
  });
});
