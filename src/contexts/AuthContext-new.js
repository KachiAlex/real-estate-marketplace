
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getApiUrl } from '../utils/apiConfig';

const defaultContextValue = {
  currentUser: null,
  loading: true,
  accessToken: null,
  refreshToken: null,
  register: async () => { throw new Error('Auth not initialized'); },
  login: async () => { throw new Error('Auth not initialized'); },
  logout: async () => { throw new Error('Auth not initialized'); },
  refreshAccessToken: async () => { throw new Error('Auth not initialized'); },
  updateUserProfile: async () => { throw new Error('Auth not initialized'); },
  registerAsVendor: async () => { throw new Error('Auth not initialized'); },
  setAuthRedirect: () => {},
  user: null,
  isBuyer: false,
  isVendor: false,
  isVendorOnboarded: false,
  isVendorSubscriptionActive: false
};

const AuthContext = createContext(defaultContextValue);

const normalizeUser = (u) => {
  if (!u) return u;
  const roles = u.roles || (u.role ? [u.role] : (u.userType ? [u.userType] : []));
  const activeRole = u.role || u.userType || (roles.length > 0 ? roles[0] : undefined);
  return { ...u, roles, activeRole };
};

function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedAccessToken = localStorage.getItem('accessToken');
        const storedRefreshToken = localStorage.getItem('refreshToken');
        const storedUser = localStorage.getItem('currentUser');
        if (storedAccessToken && storedRefreshToken && storedUser) {
          setAccessToken(storedAccessToken);
          setRefreshToken(storedRefreshToken);
          try {
            setCurrentUser(normalizeUser(JSON.parse(storedUser)));
          } catch (e) {
            setCurrentUser(null);
          }
        }
      } catch (error) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('currentUser');
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();

    // Listen for localStorage changes (when tokens are cleared by authenticatedFetch)
    const handleStorageChange = (e) => {
      if (e.key === 'accessToken' && !e.newValue) {
        // accessToken was removed, clear auth state
        setAccessToken(null);
        setRefreshToken(null);
        setCurrentUser(null);
      }
    };

    // Listen for custom logout event from authenticatedFetch
    const handleAuthLogout = () => {
      console.log('AuthContext: Received auth:logout event, clearing state');
      setAccessToken(null);
      setRefreshToken(null);
      setCurrentUser(null);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth:logout', handleAuthLogout);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth:logout', handleAuthLogout);
    };
  }, []);

  const register = useCallback(async (email, password, firstName, lastName, phone = '') => {
    setLoading(true);
    try {
      const response = await fetch(getApiUrl('/auth/jwt/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName, lastName, phone: phone || null, role: 'user' })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Registration failed');
      const normalized = normalizeUser(data.user);
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('currentUser', JSON.stringify(normalized));
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      setCurrentUser(normalized);
      toast.success('Registration successful!');
      return data.user;
    } catch (error) {
      toast.error(error.message || 'Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const response = await fetch(getApiUrl('/auth/jwt/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Login failed');
      const normalized = normalizeUser(data.user);
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('currentUser', JSON.stringify(normalized));
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      setCurrentUser(normalized);
      toast.success('Login successful!');
      return data.user;
    } catch (error) {
      toast.error(error.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      if (accessToken) {
        try {
          await fetch(getApiUrl('/auth/jwt/logout'), {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
          });
        } catch (error) {}
      }
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('currentUser');
      setAccessToken(null);
      setRefreshToken(null);
      setCurrentUser(null);
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Logout failed');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  const refreshAccessToken = useCallback(async () => {
    try {
      if (!refreshToken) {
        await logout();
        return null;
      }
      const response = await fetch(getApiUrl('/auth/jwt/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      const data = await response.json();
      if (!response.ok) {
        await logout();
        return null;
      }
      localStorage.setItem('accessToken', data.accessToken);
      setAccessToken(data.accessToken);
      return data.accessToken;
    } catch (error) {
      await logout();
      return null;
    }
  }, [refreshToken, logout]);

  const user = currentUser;
  const isBuyer = currentUser?.role === 'buyer' || currentUser?.userType === 'buyer';
  const isVendor = currentUser?.role === 'vendor' || currentUser?.userType === 'vendor';
  const isVendorOnboarded = !!(currentUser && currentUser.vendorData && currentUser.vendorData.onboardingComplete);
  const isVendorSubscriptionActive = !!(currentUser && currentUser.vendorData && currentUser.vendorData.subscriptionActive);

  const updateUserProfile = useCallback(async (updates) => {
    if (!currentUser) throw new Error('User must be logged in to update profile');
    const response = await fetch(getApiUrl('/auth/jwt/update-profile'), {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Profile update failed');
    const updatedUser = normalizeUser({ ...currentUser, ...updates });
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);
    toast.success('Profile updated successfully');
    return updatedUser;
  }, [accessToken, currentUser]);

  const setAuthRedirect = useCallback((url) => {
    if (url) sessionStorage.setItem('authRedirect', url);
  }, []);

  const registerAsVendor = useCallback(async (vendorInfo) => {
    // Implement vendor registration logic as needed
    return { success: true, user: currentUser, navigateTo: '/vendor/dashboard' };
  }, [currentUser]);

  const signInWithGooglePopup = useCallback(async () => {
    setLoading(true);
    try {
      let clientId = null;
      try {
        const cfgResp = await fetch(getApiUrl('/auth/jwt/google-config'));
        if (cfgResp.ok) {
          const cfg = await cfgResp.json();
          clientId = cfg.clientId || cfg.client_id || cfg.clientID || null;
        }
      } catch (e) {}
      if (!clientId) throw new Error('Google client ID is not configured');
      const redirectUri = `${window.location.origin}/auth/google-popup-callback`;
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'id_token token',
        scope: 'openid profile email',
        prompt: 'select_account'
      });
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      const width = 500;
      const height = 650;
      const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
      const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);
      const popup = window.open(authUrl, 'google_oauth', `width=${width},height=${height},left=${left},top=${top}`);
      if (!popup) throw new Error('Popup blocked by browser');
      const result = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          window.removeEventListener('message', handler);
          reject(new Error('Timed out waiting for Google authentication'));
        }, 2 * 60 * 1000);
        const handler = (e) => {
          if (e.origin !== window.location.origin) return;
          const data = e.data || {};
          if (data.type === 'google_oauth_result') {
            clearTimeout(timer);
            window.removeEventListener('message', handler);
            resolve(data);
          }
        };
        window.addEventListener('message', handler);
      });
      const idToken = result?.idToken || result?.id_token;
      if (!idToken) throw new Error('No ID token returned from Google');
      const resp = await fetch(getApiUrl('/auth/jwt/google'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleToken: idToken })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.message || 'Google sign-in failed');
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      setCurrentUser(data.user);
      toast.success('Signed in with Google');
      return data.user;
    } catch (error) {
      toast.error(error.message || 'Google sign-in failed');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    currentUser,
    loading,
    accessToken,
    refreshToken,
    register,
    login,
    logout,
    refreshAccessToken,
    updateUserProfile,
    registerAsVendor,
    signInWithGooglePopup,
    setAuthRedirect,
    user,
    isBuyer,
    isVendor,
    isVendorOnboarded,
    isVendorSubscriptionActive
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    console.warn('useAuth called outside AuthProvider. Using default values.');
    return defaultContextValue;
  }
  return context;
};

export { AuthProvider };
export default AuthProvider;
