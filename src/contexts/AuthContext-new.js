import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getApiUrl } from '../utils/apiConfig';
import { initializeGoogleOAuth } from '../config/googleOAuth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);

  // Initialize Google OAuth on mount
  useEffect(() => {
    const initGoogle = async () => {
      try {
        await initializeGoogleOAuth();
        console.log('✅ Google OAuth initialized');
      } catch (error) {
        console.warn('⚠️ Failed to initialize Google OAuth:', error.message);
      }
    };
    initGoogle();
  }, []);

  // Register new user
  const register = useCallback(async (email, password, firstName, lastName, phone = '') => {
    try {
      setLoading(true);
      const response = await fetch(`${getApiUrl()}/api/auth/jwt/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          phone: phone || null,
          role: 'user'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Store tokens and user info
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('currentUser', JSON.stringify(data.user));

      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      setCurrentUser(data.user);

      toast.success('Registration successful!');
      return data.user;
    } catch (error) {
      console.error('Register error:', error);
      toast.error(error.message || 'Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Login user
  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      const response = await fetch(`${getApiUrl()}/api/auth/jwt/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store tokens and user info
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('currentUser', JSON.stringify(data.user));

      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      setCurrentUser(data.user);

      toast.success('Login successful!');
      return data.user;
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout user
  const logout = useCallback(async () => {
    try {
      setLoading(true);

      // Call logout endpoint (optional, mainly for logging)
      if (accessToken) {
        try {
          await fetch(`${getApiUrl()}/api/auth/jwt/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          });
        } catch (error) {
          console.warn('Logout endpoint call failed:', error);
          // Continue with client-side logout even if endpoint fails
        }
      }

      // Clear tokens and user info from localStorage and state
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('currentUser');

      setAccessToken(null);
      setRefreshToken(null);
      setCurrentUser(null);

      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  // Sign in with Google
  const signInWithGoogle = useCallback(async (googleToken) => {
    try {
      setLoading(true);

      if (!googleToken) {
        throw new Error('No Google token provided');
      }

      const response = await fetch(`${getApiUrl()}/api/auth/jwt/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ googleToken })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Google authentication failed');
      }

      // Store tokens and user info
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('currentUser', JSON.stringify(data.user));

      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      setCurrentUser(data.user);

      toast.success('Signed in with Google!');
      return data.user;
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast.error(error.message || 'Google sign-in failed');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh access token
  const refreshAccessToken = useCallback(async () => {
    try {
      if (!refreshToken) {
        await logout();
        return null;
      }

      const response = await fetch(`${getApiUrl()}/api/auth/jwt/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });

      const data = await response.json();

      if (!response.ok) {
        // If refresh fails, logout user
        await logout();
        return null;
      }

      // Update access token
      localStorage.setItem('accessToken', data.accessToken);
      setAccessToken(data.accessToken);

      return data.accessToken;
    } catch (error) {
      console.error('Token refresh error:', error);
      await logout();
      return null;
    }
  }, [refreshToken, logout]);

  // Get current user profile
  const fetchCurrentUser = useCallback(async () => {
    try {
      if (!accessToken) return null;

      const response = await fetch(`${getApiUrl()}/api/auth/jwt/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        // If unauthorized, try to refresh token
        if (response.status === 401) {
          const newToken = await refreshAccessToken();
          if (!newToken) return null;
        }
        throw new Error(data.message || 'Failed to fetch user');
      }

      localStorage.setItem('currentUser', JSON.stringify(data.user));
      setCurrentUser(data.user);

      return data.user;
    } catch (error) {
      console.error('Fetch current user error:', error);
      return null;
    }
  }, [accessToken, refreshAccessToken]);

  const value = {
    currentUser,
    loading,
    accessToken,
    refreshToken,
    register,
    login,
    signInWithGoogle,
    logout,
    refreshAccessToken,
    fetchCurrentUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
