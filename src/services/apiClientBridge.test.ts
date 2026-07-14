/**
 * API Client Bridge Tests
 */

import { ApiClientBridge, getApiClient, resetApiClient } from './apiClientBridge';
import { CapacitorHttpClient } from './capacitorHttpClient';
import * as apiConfig from '../config/api';

// Mock the config module
jest.mock('../config/api', () => ({
  getHttpClient: jest.fn(),
  getApiUrl: jest.fn((path) => `https://api.example.com${path}`),
}));

describe('ApiClientBridge', () => {
  let bridge: ApiClientBridge;
  let mockHttpClient: jest.Mocked<CapacitorHttpClient>;

  beforeEach(() => {
    resetApiClient();

    // Create mock HTTP client
    mockHttpClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn(),
      addRequestInterceptor: jest.fn(),
      addResponseInterceptor: jest.fn(),
      addErrorInterceptor: jest.fn(),
    } as any;

    // Mock getHttpClient to return our mock
    (apiConfig.getHttpClient as jest.Mock).mockReturnValue(mockHttpClient);

    bridge = new ApiClientBridge();
  });

  describe('GET requests', () => {
    it('should make successful GET request', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockHttpClient.get.mockResolvedValue({
        data: mockData,
        status: 200,
        statusText: 'OK',
        headers: {},
      });

      const result = await bridge.get('/users/1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(result.status).toBe(200);
      expect(mockHttpClient.get).toHaveBeenCalled();
    });

    it('should handle GET request with options', async () => {
      mockHttpClient.get.mockResolvedValue({
        data: { items: [] },
        status: 200,
        statusText: 'OK',
        headers: {},
      });

      const result = await bridge.get('/users', {
        headers: { 'X-Custom': 'value' },
        params: { page: 1 },
        timeout: 5000,
      });

      expect(result.success).toBe(true);
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: { 'X-Custom': 'value' },
          params: { page: 1 },
          timeout: 5000,
        })
      );
    });

    it('should handle GET request error', async () => {
      const error = new Error('Network error');
      mockHttpClient.get.mockRejectedValue(error);

      const result = await bridge.get('/users');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.data).toBeUndefined();
    });
  });

  describe('POST requests', () => {
    it('should make successful POST request', async () => {
      const mockData = { id: 1, name: 'New User' };
      mockHttpClient.post.mockResolvedValue({
        data: mockData,
        status: 201,
        statusText: 'Created',
        headers: {},
      });

      const result = await bridge.post('/users', { name: 'New User' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(result.status).toBe(201);
      expect(mockHttpClient.post).toHaveBeenCalled();
    });

    it('should handle POST request with options', async () => {
      mockHttpClient.post.mockResolvedValue({
        data: { id: 1 },
        status: 201,
        statusText: 'Created',
        headers: {},
      });

      const result = await bridge.post('/users', { name: 'Test' }, {
        headers: { 'X-Custom': 'value' },
      });

      expect(result.success).toBe(true);
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        expect.any(String),
        { name: 'Test' },
        expect.objectContaining({
          headers: { 'X-Custom': 'value' },
        })
      );
    });

    it('should handle POST request error', async () => {
      const error = new Error('Server error');
      mockHttpClient.post.mockRejectedValue(error);

      const result = await bridge.post('/users', { name: 'Test' });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('PUT requests', () => {
    it('should make successful PUT request', async () => {
      const mockData = { id: 1, name: 'Updated' };
      mockHttpClient.put.mockResolvedValue({
        data: mockData,
        status: 200,
        statusText: 'OK',
        headers: {},
      });

      const result = await bridge.put('/users/1', { name: 'Updated' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(mockHttpClient.put).toHaveBeenCalled();
    });

    it('should handle PUT request error', async () => {
      const error = new Error('Not found');
      mockHttpClient.put.mockRejectedValue(error);

      const result = await bridge.put('/users/999', { name: 'Test' });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('DELETE requests', () => {
    it('should make successful DELETE request', async () => {
      mockHttpClient.delete.mockResolvedValue({
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: {},
      });

      const result = await bridge.delete('/users/1');

      expect(result.success).toBe(true);
      expect(mockHttpClient.delete).toHaveBeenCalled();
    });

    it('should handle DELETE request error', async () => {
      const error = new Error('Forbidden');
      mockHttpClient.delete.mockRejectedValue(error);

      const result = await bridge.delete('/users/1');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('PATCH requests', () => {
    it('should make successful PATCH request', async () => {
      const mockData = { id: 1, status: 'active' };
      mockHttpClient.patch.mockResolvedValue({
        data: mockData,
        status: 200,
        statusText: 'OK',
        headers: {},
      });

      const result = await bridge.patch('/users/1', { status: 'active' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(mockHttpClient.patch).toHaveBeenCalled();
    });

    it('should handle PATCH request error', async () => {
      const error = new Error('Validation error');
      mockHttpClient.patch.mockRejectedValue(error);

      const result = await bridge.patch('/users/1', { status: 'invalid' });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Interceptors', () => {
    it('should add request interceptor', () => {
      const interceptor = jest.fn();
      bridge.addRequestInterceptor(interceptor);

      expect(mockHttpClient.addRequestInterceptor).toHaveBeenCalledWith(interceptor);
    });

    it('should add response interceptor', () => {
      const interceptor = jest.fn();
      bridge.addResponseInterceptor(interceptor);

      expect(mockHttpClient.addResponseInterceptor).toHaveBeenCalledWith(interceptor);
    });

    it('should add error interceptor', () => {
      const interceptor = jest.fn();
      bridge.addErrorInterceptor(interceptor);

      expect(mockHttpClient.addErrorInterceptor).toHaveBeenCalledWith(interceptor);
    });
  });

  describe('Error handling', () => {
    it('should handle HTTP error with status', async () => {
      const error = new Error('Bad Request');
      (error as any).status = 400;
      (error as any).statusText = 'Bad Request';
      mockHttpClient.get.mockRejectedValue(error);

      const result = await bridge.get('/users');

      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      expect(result.error).toContain('400');
    });

    it('should extract error message from response data', async () => {
      const error = new Error('Request failed');
      (error as any).status = 400;
      (error as any).data = { message: 'Invalid input' };
      mockHttpClient.get.mockRejectedValue(error);

      const result = await bridge.get('/users');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid input');
    });

    it('should skip error handling when requested', async () => {
      const error = new Error('Test error');
      mockHttpClient.get.mockRejectedValue(error);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await bridge.get('/users', { skipErrorHandling: true });

      expect(result.success).toBe(false);
      expect(consoleErrorSpy).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Singleton', () => {
    it('should return same instance', () => {
      const client1 = getApiClient();
      const client2 = getApiClient();

      expect(client1).toBe(client2);
    });

    it('should reset singleton', () => {
      const client1 = getApiClient();
      resetApiClient();
      const client2 = getApiClient();

      expect(client1).not.toBe(client2);
    });
  });
});
