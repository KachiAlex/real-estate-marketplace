/**
 * Token Storage Service
 * Handles secure storage and retrieval of JWT tokens using expo-secure-store
 */

import * as SecureStore from 'expo-secure-store';
import { JWTToken } from './types';

const TOKEN_KEY = 'propertyark_auth_token';
const REFRESH_TOKEN_KEY = 'propertyark_refresh_token';

export class TokenStorage {
  /**
   * Store JWT token securely
   */
  static async storeToken(token: JWTToken): Promise<void> {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(token));
    } catch (error) {
      console.error('Failed to store token:', error);
      throw new Error('Failed to store authentication token');
    }
  }

  /**
   * Retrieve stored JWT token
   */
  static async retrieveToken(): Promise<JWTToken | null> {
    try {
      const tokenString = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!tokenString) {
        return null;
      }
      return JSON.parse(tokenString) as JWTToken;
    } catch (error) {
      console.error('Failed to retrieve token:', error);
      return null;
    }
  }

  /**
   * Delete stored token on logout
   */
  static async deleteToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error('Failed to delete token:', error);
      throw new Error('Failed to delete authentication token');
    }
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token: JWTToken): boolean {
    const now = Math.floor(Date.now() / 1000);
    const expirationTime = token.issuedAt + token.expiresIn;
    return now >= expirationTime;
  }

  /**
   * Get token expiration time in seconds
   */
  static getTokenExpirationTime(token: JWTToken): number {
    const now = Math.floor(Date.now() / 1000);
    const expirationTime = token.issuedAt + token.expiresIn;
    return Math.max(0, expirationTime - now);
  }

  /**
   * Check if token exists and is valid
   */
  static async isTokenValid(): Promise<boolean> {
    try {
      const token = await this.retrieveToken();
      if (!token) {
        return false;
      }
      return !this.isTokenExpired(token);
    } catch (error) {
      return false;
    }
  }
}
