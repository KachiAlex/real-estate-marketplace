/**
 * Authentication Manager
 * Manages JWT token lifecycle, login/logout, and token refresh
 */

import { JWTToken, LoginCredentials, AuthError, AuthState } from './types';
import { TokenStorage } from './TokenStorage';

export class AuthenticationManager {
  private static instance: AuthenticationManager;
  private state: AuthState = {
    isAuthenticated: false,
    user: null,
    token: null,
    loading: false,
    error: null,
  };

  private listeners: Array<(state: AuthState) => void> = [];

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): AuthenticationManager {
    if (!AuthenticationManager.instance) {
      AuthenticationManager.instance = new AuthenticationManager();
    }
    return AuthenticationManager.instance;
  }

  /**
   * Initialize authentication state from stored token
   */
  async initialize(): Promise<void> {
    try {
      this.state.loading = true;
      const token = await TokenStorage.retrieveToken();

      if (token && !TokenStorage.isTokenExpired(token)) {
        this.state.token = token;
        this.state.isAuthenticated = true;
      } else if (token) {
        // Token expired, try to refresh
        await this.refreshToken();
      }
    } catch (error) {
      console.error('Failed to initialize authentication:', error);
      this.state.error = 'Failed to initialize authentication';
    } finally {
      this.state.loading = false;
      this.notifyListeners();
    }
  }

  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<void> {
    try {
      this.state.loading = true;
      this.state.error = null;

      // Call backend API to authenticate
      const response = await fetch('https://propertyark-backend.onrender.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      const token: JWTToken = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn,
        tokenType: data.tokenType || 'Bearer',
        issuedAt: Math.floor(Date.now() / 1000),
      };

      // Store token securely
      await TokenStorage.storeToken(token);

      this.state.token = token;
      this.state.isAuthenticated = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      this.state.error = message;
      this.state.isAuthenticated = false;
      throw new Error(message);
    } finally {
      this.state.loading = false;
      this.notifyListeners();
    }
  }

  /**
   * Logout and clear stored token
   */
  async logout(): Promise<void> {
    try {
      this.state.loading = true;

      // Call backend API to logout
      if (this.state.token) {
        await fetch('https://propertyark-backend.onrender.com/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.state.token.accessToken}`,
          },
        }).catch(() => {
          // Ignore logout API errors
        });
      }

      // Clear stored token
      await TokenStorage.deleteToken();

      this.state.token = null;
      this.state.isAuthenticated = false;
      this.state.user = null;
      this.state.error = null;
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.state.loading = false;
      this.notifyListeners();
    }
  }

  /**
   * Refresh JWT token
   */
  async refreshToken(): Promise<boolean> {
    try {
      if (!this.state.token) {
        return false;
      }

      const response = await fetch('https://propertyark-backend.onrender.com/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: this.state.token.refreshToken,
        }),
      });

      if (!response.ok) {
        // Refresh failed, logout user
        await this.logout();
        return false;
      }

      const data = await response.json();
      const newToken: JWTToken = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn,
        tokenType: data.tokenType || 'Bearer',
        issuedAt: Math.floor(Date.now() / 1000),
      };

      // Store new token
      await TokenStorage.storeToken(newToken);
      this.state.token = newToken;
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      await this.logout();
      return false;
    }
  }

  /**
   * Get current token
   */
  getToken(): JWTToken | null {
    return this.state.token;
  }

  /**
   * Set token manually
   */
  async setToken(token: JWTToken): Promise<void> {
    await TokenStorage.storeToken(token);
    this.state.token = token;
    this.state.isAuthenticated = true;
    this.notifyListeners();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (!this.state.token) {
      return false;
    }
    return !TokenStorage.isTokenExpired(this.state.token);
  }

  /**
   * Get current authentication state
   */
  getState(): AuthState {
    return { ...this.state };
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.getState()));
  }
}

export default AuthenticationManager.getInstance();
