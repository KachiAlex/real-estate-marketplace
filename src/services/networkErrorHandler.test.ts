/**
 * Network Error Handler Tests
 */

import {
  NetworkErrorHandler,
  NetworkErrorType,
  getNetworkErrorHandler,
  resetNetworkErrorHandler,
} from './networkErrorHandler';
import { getOfflineManager, resetOfflineManager } from './offlineManager';

describe('NetworkErrorHandler', () => {
  let handler: NetworkErrorHandler;

  beforeEach(() => {
    resetNetworkErrorHandler();
    resetOfflineManager();
    handler = getNetworkErrorHandler();
  });

  describe('classifyError', () => {
    it('should classify timeout errors', () => {
      const error = new Error('Request timeout');
      expect(handler.classifyError(error)).toBe(NetworkErrorType.TIMEOUT);
    });

    it('should classify network errors', () => {
      const error = new Error('Network error');
      expect(handler.classifyError(error)).toBe(NetworkErrorType.NO_CONNECTION);
    });

    it('should classify CORS errors', () => {
      const error = new Error('CORS error');
      expect(handler.classifyError(error)).toBe(NetworkErrorType.CORS_ERROR);
    });

    it('should classify server errors (5xx)', () => {
      const error = new Error('Server error');
      (error as any).status = 500;
      expect(handler.classifyError(error)).toBe(NetworkErrorType.SERVER_ERROR);
    });

    it('should classify client errors (4xx)', () => {
      const error = new Error('Client error');
      (error as any).status = 400;
      expect(handler.classifyError(error)).toBe(NetworkErrorType.CLIENT_ERROR);
    });

    it('should return UNKNOWN for unclassified errors', () => {
      const error = new Error('Unknown error');
      expect(handler.classifyError(error)).toBe(NetworkErrorType.UNKNOWN);
    });

    it('should handle null error', () => {
      expect(handler.classifyError(null)).toBe(NetworkErrorType.UNKNOWN);
    });
  });

  describe('getUserMessage', () => {
    it('should return timeout message', () => {
      const message = handler.getUserMessage(NetworkErrorType.TIMEOUT);
      expect(message).toContain('timed out');
    });

    it('should return no connection message', () => {
      const message = handler.getUserMessage(NetworkErrorType.NO_CONNECTION);
      expect(message).toContain('internet connection');
    });

    it('should return server error message', () => {
      const message = handler.getUserMessage(NetworkErrorType.SERVER_ERROR);
      expect(message).toContain('Server error');
    });

    it('should return 401 message for authentication error', () => {
      const message = handler.getUserMessage(NetworkErrorType.CLIENT_ERROR, 401);
      expect(message).toContain('Authentication');
    });

    it('should return 403 message for permission error', () => {
      const message = handler.getUserMessage(NetworkErrorType.CLIENT_ERROR, 403);
      expect(message).toContain('permission');
    });

    it('should return 404 message for not found error', () => {
      const message = handler.getUserMessage(NetworkErrorType.CLIENT_ERROR, 404);
      expect(message).toContain('not found');
    });

    it('should return CORS error message', () => {
      const message = handler.getUserMessage(NetworkErrorType.CORS_ERROR);
      expect(message).toContain('Cross-origin');
    });
  });

  describe('isRetryable', () => {
    it('should mark timeout as retryable', () => {
      expect(handler.isRetryable(NetworkErrorType.TIMEOUT)).toBe(true);
    });

    it('should mark no connection as retryable', () => {
      expect(handler.isRetryable(NetworkErrorType.NO_CONNECTION)).toBe(true);
    });

    it('should mark server error as retryable', () => {
      expect(handler.isRetryable(NetworkErrorType.SERVER_ERROR)).toBe(true);
    });

    it('should mark 408 as retryable', () => {
      expect(handler.isRetryable(NetworkErrorType.CLIENT_ERROR, 408)).toBe(true);
    });

    it('should mark 429 as retryable', () => {
      expect(handler.isRetryable(NetworkErrorType.CLIENT_ERROR, 429)).toBe(true);
    });

    it('should not mark 400 as retryable', () => {
      expect(handler.isRetryable(NetworkErrorType.CLIENT_ERROR, 400)).toBe(false);
    });

    it('should not mark CORS error as retryable', () => {
      expect(handler.isRetryable(NetworkErrorType.CORS_ERROR)).toBe(false);
    });
  });

  describe('handleError', () => {
    it('should handle error and return details', () => {
      const error = new Error('Test error');
      const details = handler.handleError(error);

      expect(details).toBeDefined();
      expect(details.message).toBe('Test error');
      expect(details.timestamp).toBeDefined();
      expect(details.platform).toBeDefined();
    });

    it('should set retryable flag correctly', () => {
      const error = new Error('Timeout');
      const details = handler.handleError(error);

      expect(details.retryable).toBe(true);
    });

    it('should include user message', () => {
      const error = new Error('Timeout');
      const details = handler.handleError(error);

      expect(details.userMessage).toBeDefined();
      expect(details.userMessage.length > 0).toBe(true);
    });
  });

  describe('error listeners', () => {
    it('should add and call error listener', (done) => {
      const listener = jest.fn();
      handler.addErrorListener(listener);

      const error = new Error('Test error');
      handler.handleError(error);

      setTimeout(() => {
        expect(listener).toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should remove error listener', (done) => {
      const listener = jest.fn();
      const unsubscribe = handler.addErrorListener(listener);

      unsubscribe();

      const error = new Error('Test error');
      handler.handleError(error);

      setTimeout(() => {
        expect(listener).not.toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should handle listener errors gracefully', () => {
      const listener = jest.fn(() => {
        throw new Error('Listener error');
      });
      handler.addErrorListener(listener);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const error = new Error('Test error');
      handler.handleError(error);

      expect(listener).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('retryWithBackoff', () => {
    beforeEach(() => {
      // Set shorter delays for testing
      handler.setRetryConfig({
        maxRetries: 3,
        initialDelayMs: 10,
        maxDelayMs: 100,
        backoffMultiplier: 2,
      });
    });

    it('should succeed on first attempt', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const result = await handler.retryWithBackoff(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce('success');

      const result = await handler.retryWithBackoff(fn, 2);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should throw after max retries', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Timeout'));

      await expect(handler.retryWithBackoff(fn, 1)).rejects.toThrow('Timeout');
      expect(fn).toHaveBeenCalledTimes(2); // Initial + 1 retry
    });

    it('should not retry non-retryable errors', async () => {
      const error = new Error('CORS error');
      const fn = jest.fn().mockRejectedValue(error);

      await expect(handler.retryWithBackoff(fn, 2)).rejects.toThrow('CORS error');
      expect(fn).toHaveBeenCalledTimes(1); // No retries
    });
  });

  describe('retry configuration', () => {
    it('should set retry config', () => {
      handler.setRetryConfig({ maxRetries: 5 });
      const config = handler.getRetryConfig();

      expect(config.maxRetries).toBe(5);
    });

    it('should preserve other config values when updating', () => {
      const originalConfig = handler.getRetryConfig();
      handler.setRetryConfig({ maxRetries: 5 });
      const newConfig = handler.getRetryConfig();

      expect(newConfig.initialDelayMs).toBe(originalConfig.initialDelayMs);
      expect(newConfig.maxRetries).toBe(5);
    });
  });

  describe('online status', () => {
    it('should check if online', () => {
      const isOnline = handler.isOnline();
      expect(typeof isOnline).toBe('boolean');
    });

    it('should add online status listener', () => {
      const listener = jest.fn();
      const unsubscribe = handler.addOnlineStatusListener(listener);

      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('singleton', () => {
    it('should return same instance', () => {
      const handler1 = getNetworkErrorHandler();
      const handler2 = getNetworkErrorHandler();

      expect(handler1).toBe(handler2);
    });

    it('should reset singleton', () => {
      const handler1 = getNetworkErrorHandler();
      resetNetworkErrorHandler();
      const handler2 = getNetworkErrorHandler();

      expect(handler1).not.toBe(handler2);
    });
  });
});
