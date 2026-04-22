/**
 * Authentication Manager Tests
 */

import { AuthenticationManager } from './AuthenticationManager';
import { TokenStorage } from './TokenStorage';
import { JWTToken } from './types';

// Mock TokenStorage
jest.mock('./TokenStorage');

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe('AuthenticationManager', () => {
  let authManager: AuthenticationManager;
  let mockTokenStorage: jest.Mocked<TokenStorage>;
  let mockAPIClient: any;

  const mockToken: JWTToken = {
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
    expiresIn: 3600,
    tokenType: 'Bearer',
    issuedAt: Date.now(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockTokenStorage = new TokenStorage() as jest.Mocked<TokenStorage>;
    authManager = new AuthenticationManager(mockTokenStorage);

    mockAPIClient = {
      post: jest.fn(),
      setAuthToken: jest.fn(),
    };
    authManager.setAPIClient(mockAPIClient);
  });

  describe('login', () => {
    it('should login with valid credentials and store token', async () => {
      mockAPIClient.post.mockResolvedValue({
        success: true,
        data: mockToken,
      });
      mockTokenStorage.storeToken = jest.fn().mockResolvedValue(undefined);
      mockTokenStorage.storeTokenExpiration = jest.fn().mockResolvedValue(undefined);

      const result = await authManager.login('test@example.com', 'password123');

      expect(result).toEqual(mockToken);
      expect(mockAPIClient.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockTokenStorage.storeToken).toHaveBeenCalled();
      expect(mockTokenStorage.storeTokenExpiration).toHaveBeenCalledWith(mockToken.expiresIn);
    });

    it('should throw error with invalid credentials', async () => {
      mockAPIClient.post.mockResolvedValue({
        success: false,
      });

      await expect(authManager.login('test@example.com', 'wrongpassword')).rejects.toThrow(
        'Invalid email or password'
      );
    });

    it('should throw error when API client is not configured', async () => {
      const manager = new AuthenticationManager(mockTokenStorage);

      await expect(manager.login('test@example.com', 'password123')).rejects.toThrow(
        'API client not configured'
      );
    });
  });

  describe('logout', () => {
    it('should clear token and reset state', async () => {
      mockTokenStorage.deleteToken = jest.fn().mockResolvedValue(undefined);

      await authManager.logout();

      expect(mockTokenStorage.deleteToken).toHaveBeenCalled();
      expect(mockAPIClient.setAuthToken).toHaveBeenCalledWith(null);
    });

    it('should throw error if token deletion fails', async () => {
      mockTokenStorage.deleteToken = jest.fn().mockRejectedValue(new Error('Storage error'));

      await expect(authManager.logout()).rejects.toThrow('Logout failed');
    });
  });

  describe('setToken', () => {
    it('should store token and update API client', async () => {
      mockTokenStorage.storeToken = jest.fn().mockResolvedValue(undefined);
      mockTokenStorage.storeTokenExpiration = jest.fn().mockResolvedValue(undefined);

      await authManager.setToken(mockToken);

      expect(mockTokenStorage.storeToken).toHaveBeenCalledWith(JSON.stringify(mockToken));
      expect(mockTokenStorage.storeTokenExpiration).toHaveBeenCalledWith(mockToken.expiresIn);
      expect(mockAPIClient.setAuthToken).toHaveBeenCalledWith(mockToken.accessToken);
    });

    it('should throw error if token storage fails', async () => {
      mockTokenStorage.storeToken = jest.fn().mockRejectedValue(new Error('Storage error'));

      await expect(authManager.setToken(mockToken)).rejects.toThrow('Failed to store token');
    });
  });

  describe('getToken', () => {
    it('should retrieve stored token', async () => {
      mockTokenStorage.retrieveToken = jest.fn().mockResolvedValue(JSON.stringify(mockToken));

      const result = await authManager.getToken();

      expect(result).toEqual(mockToken);
      expect(mockTokenStorage.retrieveToken).toHaveBeenCalled();
    });

    it('should return null if no token stored', async () => {
      mockTokenStorage.retrieveToken = jest.fn().mockResolvedValue(null);

      const result = await authManager.getToken();

      expect(result).toBeNull();
    });

    it('should return cached token on subsequent calls', async () => {
      mockTokenStorage.retrieveToken = jest.fn().mockResolvedValue(JSON.stringify(mockToken));

      await authManager.getToken();
      const result = await authManager.getToken();

      expect(result).toEqual(mockToken);
      expect(mockTokenStorage.retrieveToken).toHaveBeenCalledTimes(1);
    });
  });

  describe('isAuthenticated', () => {
    it('should return true for valid non-expired token', async () => {
      const futureExpiration = Date.now() + 3600000; // 1 hour from now
      mockTokenStorage.retrieveToken = jest.fn().mockResolvedValue(JSON.stringify(mockToken));
      mockTokenStorage.getTokenExpiration = jest.fn().mockResolvedValue(futureExpiration);

      const result = await authManager.isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false if no token stored', async () => {
      mockTokenStorage.retrieveToken = jest.fn().mockResolvedValue(null);

      const result = await authManager.isAuthenticated();

      expect(result).toBe(false);
    });

    it('should return false if token is expired and refresh fails', async () => {
      const pastExpiration = Date.now() - 1000; // 1 second ago
      mockTokenStorage.retrieveToken = jest.fn().mockResolvedValue(JSON.stringify(mockToken));
      mockTokenStorage.getTokenExpiration = jest.fn().mockResolvedValue(pastExpiration);
      mockAPIClient.post.mockRejectedValue(new Error('Refresh failed'));

      const result = await authManager.isAuthenticated();

      expect(result).toBe(false);
    });

    it('should attempt to refresh expired token', async () => {
      const pastExpiration = Date.now() - 1000;
      const newToken = { ...mockToken, accessToken: 'new-access-token' };

      mockTokenStorage.retrieveToken = jest.fn().mockResolvedValue(JSON.stringify(mockToken));
      mockTokenStorage.getTokenExpiration = jest.fn().mockResolvedValue(pastExpiration);
      mockAPIClient.post.mockResolvedValue({
        success: true,
        data: newToken,
      });
      mockTokenStorage.storeToken = jest.fn().mockResolvedValue(undefined);
      mockTokenStorage.storeTokenExpiration = jest.fn().mockResolvedValue(undefined);

      const result = await authManager.isAuthenticated();

      expect(result).toBe(true);
      expect(mockAPIClient.post).toHaveBeenCalledWith('/auth/refresh', {
        refreshToken: mockToken.refreshToken,
      });
    });
  });

  describe('refreshToken', () => {
    it('should refresh token and update storage', async () => {
      const newToken = { ...mockToken, accessToken: 'new-access-token' };
      mockTokenStorage.retrieveToken = jest.fn().mockResolvedValue(JSON.stringify(mockToken));
      mockAPIClient.post.mockResolvedValue({
        success: true,
        data: newToken,
      });
      mockTokenStorage.storeToken = jest.fn().mockResolvedValue(undefined);
      mockTokenStorage.storeTokenExpiration = jest.fn().mockResolvedValue(undefined);

      const result = await authManager.refreshToken();

      expect(result).toEqual(newToken);
      expect(mockAPIClient.post).toHaveBeenCalledWith('/auth/refresh', {
        refreshToken: mockToken.refreshToken,
      });
      expect(mockTokenStorage.storeToken).toHaveBeenCalled();
    });

    it('should clear token on refresh failure', async () => {
      mockTokenStorage.retrieveToken = jest.fn().mockResolvedValue(JSON.stringify(mockToken));
      mockAPIClient.post.mockResolvedValue({
        success: false,
      });
      mockTokenStorage.deleteToken = jest.fn().mockResolvedValue(undefined);

      await expect(authManager.refreshToken()).rejects.toThrow('Failed to refresh session');
      expect(mockTokenStorage.deleteToken).toHaveBeenCalled();
    });

    it('should throw error if no token to refresh', async () => {
      mockTokenStorage.retrieveToken = jest.fn().mockResolvedValue(null);

      await expect(authManager.refreshToken()).rejects.toThrow('Your session has expired');
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for non-expired token', async () => {
      const futureExpiration = Date.now() + 3600000;
      mockTokenStorage.getTokenExpiration = jest.fn().mockResolvedValue(futureExpiration);

      const result = await authManager.isTokenExpired();

      expect(result).toBe(false);
    });

    it('should return true for expired token', async () => {
      const pastExpiration = Date.now() - 1000;
      mockTokenStorage.getTokenExpiration = jest.fn().mockResolvedValue(pastExpiration);

      const result = await authManager.isTokenExpired();

      expect(result).toBe(true);
    });

    it('should return true if no expiration found', async () => {
      mockTokenStorage.getTokenExpiration = jest.fn().mockResolvedValue(null);

      const result = await authManager.isTokenExpired();

      expect(result).toBe(true);
    });
  });
});
