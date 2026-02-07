import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getApiUrl } from '../utils/apiConfig';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedAccessToken = localStorage.getItem('accessToken');
        const storedRefreshToken = localStorage.getItem('refreshToken');
        const storedUser = localStorage.getItem('currentUser');

        if (storedAccessToken && storedRefreshToken && storedUser) {
          setAccessToken(storedAccessToken);
          setRefreshToken(storedRefreshToken);
          setCurrentUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear corrupted data
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('currentUser');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
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

  // Computed properties for user roles
  const user = currentUser;
  const isBuyer = currentUser?.role === 'buyer' || currentUser?.userType === 'buyer';
  const isVendor = currentUser?.role === 'vendor' || currentUser?.userType === 'vendor';

  // Switch user role
  const switchRole = useCallback(async (newRole) => {
    try {
      if (!accessToken || !currentUser) {
        throw new Error('User must be logged in to switch roles');
      }

      const response = await fetch(`${getApiUrl()}/api/auth/jwt/switch-role`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Role switch failed');
      }

      // Update user data
      const updatedUser = { ...currentUser, ...data.user };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);

      toast.success(`Switched to ${newRole} role`);
      return updatedUser;
    } catch (error) {
      console.error('Role switch error:', error);
      toast.error(error.message || 'Role switch failed');
      throw error;
    }
  }, [accessToken, currentUser]);

  // Update user profile
  const updateUserProfile = useCallback(async (updates) => {
    try {
      if (!currentUser) {
        throw new Error('User must be logged in to update profile');
      }

      const response = await fetch(`${getApiUrl()}/api/auth/jwt/update-profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Profile update failed');
      }

      // Update user data locally
      const updatedUser = { ...currentUser, ...updates };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);

      toast.success('Profile updated successfully');
      return updatedUser;
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(error.message || 'Profile update failed');
      throw error;
    }
  }, [accessToken, currentUser]);

  // Set auth redirect URL (for future redirect after login)
  // This is a placeholder function - actual redirect handling is done in ProtectedRoute
  const setAuthRedirect = useCallback((url) => {
    // Store the redirect URL for after login
    if (url) {
      sessionStorage.setItem('authRedirect', url);
    }
  }, []);

  // Register as vendor
  const registerAsVendor = useCallback(async (vendorInfo) => {
    try {
      // Use switchRole to upgrade to vendor
      const result = await switchRole('vendor');
      return { success: true, user: result, navigateTo: '/vendor/dashboard' };
    } catch (error) {
      console.error('Vendor registration error:', error);
      return { success: false, error: error.message };
    }
  }, [switchRole]);

  const value = {
    currentUser,
    loading,
    accessToken,
    refreshToken,
    register,
    login,
    logout,
    refreshAccessToken,
    switchRole,
    updateUserProfile,
    registerAsVendor,
    setAuthRedirect,
    // Aliases and computed properties
    user: currentUser,
    isBuyer,
    isVendor
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
