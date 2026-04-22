/**
 * Token Storage Tests
 */

import { TokenStorage } from './TokenStorage';
import * as SecureStore from 'expo-secure-store';

jest.mock('expo-secure-store');

describe('TokenStorage', () => {
  let tokenStorage: TokenStorage;
  const mockToken = 'test-jwt-token';

  beforeEach(() => {
    jest.clearAllMocks();
    tokenStorage = new TokenStorage();
  });

  describe('storeToken', () => {
    it('should store token securely', async () => {
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

      await tokenStorage.storeToken(mockToken);

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('propertyark_jwt_token', mockToken);
    });

    it('should throw error if storage fails', async () => {
      (SecureStore.setItemAsync as jest.Mock).mockRejectedValue(new Error('Storage error'));

      await expect(tokenStorage.storeToken(mockToken)).rejects.toThrow('Failed to store token');
    });
  });

  describe('retrieveToken', () => {
    it('should retrieve stored token', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(mockToken);

      const result = await tokenStorage.retrieveToken();

      expect(result).toBe(mockToken);
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('propertyark_jwt_token');
    });

    it('should return null if no token stored', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const result = await tokenStorage.retrieveToken();

      expect(result).toBeNull();
    });

    it('should throw error if retrieval fails', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(new Error('Retrieval error'));

      await expect(tokenStorage.retrieveToken()).rejects.toThrow('Failed to retrieve token');
    });
  });

  describe('deleteToken', () => {
    it('should delete all token-related data', async () => {
      (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);

      await tokenStorage.deleteToken();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('propertyark_jwt_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('propertyark_refresh_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('propertyark_token_expiration');
    });

    it('should throw error if deletion fails', async () => {
      (SecureStore.deleteItemAsync as jest.Mock).mockRejectedValue(new Error('Deletion error'));

      await expect(tokenStorage.deleteToken()).rejects.toThrow('Failed to delete token');
    });
  });

  describe('storeTokenExpiration', () => {
    it('should store token expiration timestamp', async () => {
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
      const expiresIn = 3600; // 1 hour

      await tokenStorage.storeTokenExpiration(expiresIn);

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'propertyark_token_expiration',
        expect.any(String)
      );

      // Verify the stored value is a valid timestamp in the future
      const callArgs = (SecureStore.setItemAsync as jest.Mock).mock.calls[0];
      const storedTimestamp = parseInt(callArgs[1], 10);
      expect(storedTimestamp).toBeGreaterThan(Date.now());
      expect(storedTimestamp).toBeLessThanOrEqual(Date.now() + expiresIn * 1000 + 1000); // Allow 1s margin
    });

    it('should throw error if storage fails', async () => {
      (SecureStore.setItemAsync as jest.Mock).mockRejectedValue(new Error('Storage error'));

      await expect(tokenStorage.storeTokenExpiration(3600)).rejects.toThrow(
        'Failed to store token expiration'
      );
    });
  });

  describe('getTokenExpiration', () => {
    it('should retrieve token expiration timestamp', async () => {
      const futureTimestamp = Date.now() + 3600000;
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(futureTimestamp.toString());

      const result = await tokenStorage.getTokenExpiration();

      expect(result).toBe(futureTimestamp);
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('propertyark_token_expiration');
    });

    it('should return null if no expiration stored', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const result = await tokenStorage.getTokenExpiration();

      expect(result).toBeNull();
    });

    it('should throw error if retrieval fails', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(new Error('Retrieval error'));

      await expect(tokenStorage.getTokenExpiration()).rejects.toThrow(
        'Failed to get token expiration'
      );
    });
  });
});
