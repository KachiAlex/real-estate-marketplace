import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getApiUrl } from '../utils/apiConfig';

// Default context value for fallback
const defaultContextValue = {
  currentUser: null,
  loading: true,
  accessToken: null,
  refreshToken: null,
  register: async () => { throw new Error('Auth not initialized'); },
  login: async () => { throw new Error('Auth not initialized'); },
  logout: async () => { throw new Error('Auth not initialized'); },
  refreshAccessToken: async () => { throw new Error('Auth not initialized'); },
  switchRole: async () => { throw new Error('Auth not initialized'); },
  updateUserProfile: async () => { throw new Error('Auth not initialized'); },
  registerAsVendor: async () => { throw new Error('Auth not initialized'); },
  setAuthRedirect: () => {},
  user: null,
  isBuyer: false,
  isVendor: false
};

const AuthContext = createContext(defaultContextValue);

// Ensure user object has a consistent shape (always include `roles` array)
const normalizeUser = (u) => {
  if (!u) return u;
  const roles = u.roles || (u.role ? [u.role] : (u.userType ? [u.userType] : []));
  const activeRole = u.role || u.userType || (roles.length > 0 ? roles[0] : undefined);
  return { ...u, roles, activeRole };
};

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
          try {
            setCurrentUser(normalizeUser(JSON.parse(storedUser)));
          } catch (e) {
            setCurrentUser(null);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('currentUser');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Helper: try `/auth/jwt/*` first then fall back to `/auth/*` when 404 or network error
  const tryFetchAuth = async (path, options = {}) => {
    try {
      const resp = await fetch(getApiUrl(path), options);
      if (resp && resp.status !== 404) return resp;
    } catch (e) {
      // network failed, try fallback
    }

    try {
      const alt = path.replace('/auth/jwt', '/auth');
      return await fetch(getApiUrl(alt), options);
    } catch (e) {
      return null;
    }
  };

  // Register new user
  const register = useCallback(async (email, password, firstName, lastName, phone = '', options = {}) => {
    try {
      setLoading(true);
      const response = await tryFetchAuth('/auth/jwt/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName, lastName, phone: phone || null, roles: options.roles || ['user'], vendorKycDocs: options.vendorKycDocs || undefined })
      });

      const data = response ? await response.json().catch(() => ({})) : {};
      if (!response || !response.ok) throw new Error(data.message || 'Registration failed');

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
      let response = null;
      try {
        response = await tryFetchAuth('/auth/jwt/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      } catch (e) {
        response = null;
      }

      const data = response ? await response.json().catch(() => ({})) : {};

      if (response && response.ok) {
        const normalized = normalizeUser(data.user);
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('currentUser', JSON.stringify(normalized));
        setAccessToken(data.accessToken);
        setRefreshToken(data.refreshToken);
        setCurrentUser(normalized);
        try { window.dispatchEvent(new CustomEvent('auth:login', { detail: normalized })); } catch (e) {}
        toast.success('Login successful!');
        return data.user;
      }

      const backendFailed = !response || (response.status >= 500 && response.status < 600);
      if (backendFailed) {
        if (process.env.NODE_ENV !== 'production') {
          try {
            const onboarded = JSON.parse(localStorage.getItem('onboardedVendor') || 'null');
            if (onboarded && onboarded.contactInfo && String(onboarded.contactInfo.email || '').toLowerCase() === String(email || '').toLowerCase()) {
              const localUser = normalizeUser({ id: onboarded.id || `vendor-anon-${Date.now()}`, email: onboarded.contactInfo.email || '', displayName: onboarded.businessName || onboarded.contactInfo.email || 'Vendor (local)', role: 'vendor', vendorData: onboarded });
              localStorage.setItem('accessToken', 'mock-access-token');
              localStorage.setItem('refreshToken', 'mock-refresh-token');
              localStorage.setItem('currentUser', JSON.stringify(localUser));
              setAccessToken('mock-access-token');
              setRefreshToken('mock-refresh-token');
              setCurrentUser(localUser);
              toast.success('Logged in locally (backend auth unavailable)');
              return localUser;
            }
          } catch (e) {}

          try {
            const stored = JSON.parse(localStorage.getItem('currentUser') || 'null');
            if (stored && String(stored.email || '').toLowerCase() === String(email || '').toLowerCase()) {
              const restored = normalizeUser(stored);
              localStorage.setItem('accessToken', localStorage.getItem('accessToken') || 'mock-access-token');
              localStorage.setItem('refreshToken', localStorage.getItem('refreshToken') || 'mock-refresh-token');
              setAccessToken(localStorage.getItem('accessToken'));
              setRefreshToken(localStorage.getItem('refreshToken'));
              setCurrentUser(restored);
              toast.success('Restored local session (backend unavailable)');
              return restored;
            }
          } catch (e) {}
        }

        throw new Error(data?.message || 'Login failed (backend unavailable)');
      }

      throw new Error(data.message || 'Login failed');
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
      if (accessToken) {
        try {
          await tryFetchAuth('/auth/jwt/logout', { method: 'POST', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' } });
        } catch (e) { console.warn('Logout endpoint call failed:', e); }
      }
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('currentUser');
      setAccessToken(null); setRefreshToken(null); setCurrentUser(null);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error); toast.error('Logout failed');
    } finally { setLoading(false); }
  }, [accessToken]);

  // Refresh access token
  const refreshAccessToken = useCallback(async () => {
    try {
      if (!refreshToken) { await logout(); return null; }
      const base = getApiUrl('').replace(/\/$/, '');
      const jwtUrl = `${base}/auth/jwt/refresh`;
      const altUrl = `${base}/auth/refresh`;
      let resp = null;
      try {
        resp = await fetch(jwtUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }) });
      } catch (e) { resp = null; }
      if ((!resp || resp.status === 404) && !resp?.ok) {
        try { resp = await fetch(altUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }) }); } catch (e) { resp = null; }
      }
      const data = resp ? await resp.json().catch(() => ({})) : {};
      if (!resp || !resp.ok) { await logout(); return null; }
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
      if (!accessToken || !currentUser) throw new Error('User must be logged in to switch roles');
      if (String(accessToken).startsWith('mock')) {
        const updatedUser = normalizeUser({ ...currentUser, role: newRole, roles: Array.from(new Set([...(currentUser.roles || []), newRole])), activeRole: newRole });
        localStorage.setItem('currentUser', JSON.stringify(updatedUser)); setCurrentUser(updatedUser); toast.success(`Switched to ${newRole} (mock)`); return updatedUser;
      }

      const resp = await tryFetchAuth('/auth/jwt/switch-role', { method: 'POST', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ role: newRole }) });
      const data = resp ? await resp.json().catch(() => ({})) : {};
      if (!resp || !resp.ok) throw new Error(data.message || 'Role switch failed');

      if (data.requiresVendorRegistration) return { requiresVendorRegistration: true };

      let serverUser = data.user || null;
      if (!serverUser) {
        try {
          const meResp = await tryFetchAuth('/auth/jwt/me', { method: 'GET', headers: { 'Authorization': `Bearer ${accessToken}` } });
          if (meResp && meResp.ok) { const meData = await meResp.json().catch(() => ({})); serverUser = meData.user || meData; }
        } catch (e) {}
      }

      let updatedUser = serverUser ? normalizeUser(serverUser) : normalizeUser({ ...currentUser, ...data.user });
      updatedUser.roles = Array.isArray(updatedUser.roles) ? [...new Set(updatedUser.roles)] : [];
      if (newRole && !updatedUser.roles.includes(newRole)) updatedUser.roles.push(newRole);
      if (!updatedUser.activeRole && newRole) updatedUser.activeRole = newRole;
      localStorage.setItem('currentUser', JSON.stringify(updatedUser)); setCurrentUser(updatedUser);
      toast.success(`Switched to ${updatedUser.activeRole || newRole} role`);
      return updatedUser;
    } catch (error) {
      console.error('Role switch error:', error); toast.error(error.message || 'Role switch failed'); throw error;
    }
  }, [accessToken, currentUser]);

  // Update user profile
  const updateUserProfile = useCallback(async (updates) => {
    try {
      if (!currentUser) throw new Error('User must be logged in to update profile');
      const response = await tryFetchAuth('/auth/jwt/update-profile', { method: 'PUT', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
      const data = response ? await response.json().catch(() => ({})) : {};
      if (!response || !response.ok) throw new Error(data.message || 'Profile update failed');
      const updatedUser = normalizeUser({ ...currentUser, ...updates });
      localStorage.setItem('currentUser', JSON.stringify(updatedUser)); setCurrentUser(updatedUser); toast.success('Profile updated successfully'); return updatedUser;
    } catch (error) { console.error('Profile update error:', error); toast.error(error.message || 'Profile update failed'); throw error; }
  }, [accessToken, currentUser]);

  // Placeholder redirect setter
  const setAuthRedirect = useCallback((url) => { if (url) sessionStorage.setItem('authRedirect', url); }, []);

  // Register as vendor
  const registerAsVendor = useCallback(async (vendorInfo) => { try { const result = await switchRole('vendor'); return { success: true, user: result, navigateTo: '/vendor/dashboard' }; } catch (error) { console.error('Vendor registration error:', error); return { success: false, error: error.message }; } }, [switchRole]);

  // Sign in with Google (popup)
  const signInWithGooglePopup = useCallback(async () => {
    try {
      setLoading(true);
      let clientId = null;
      try { const cfgResp = await tryFetchAuth('/auth/jwt/google-config'); if (cfgResp && cfgResp.ok) { const cfg = await cfgResp.json(); clientId = cfg.clientId || cfg.client_id || cfg.clientID || null; } } catch (e) {}
      if (!clientId) throw new Error('Google client ID is not configured');
      const redirectUri = `${window.location.origin}/auth/google-popup-callback`;
      const params = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, response_type: 'id_token token', scope: 'openid profile email', prompt: 'select_account' });
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      const width = 500, height = 650;
      const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
      const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);
      const popup = window.open(authUrl, 'google_oauth', `width=${width},height=${height},left=${left},top=${top}`);
      if (!popup) throw new Error('Popup blocked by browser');
      const result = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => { window.removeEventListener('message', handler); reject(new Error('Timed out waiting for Google authentication')); }, 2 * 60 * 1000);
        const handler = (e) => { if (e.origin !== window.location.origin) return; const data = e.data || {}; if (data.type === 'google_oauth_result') { window.removeEventListener('message', handler); clearTimeout(timer); resolve(data); } };
        window.addEventListener('message', handler);
      });
      const idToken = result?.idToken || result?.id_token; if (!idToken) throw new Error('No ID token returned from Google');
      const resp = await tryFetchAuth('/auth/jwt/google', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ googleToken: idToken }) });
      const data = resp ? await resp.json().catch(() => ({})) : {};
      if (!resp || !resp.ok) throw new Error(data.message || 'Google sign-in failed');
      localStorage.setItem('accessToken', data.accessToken); localStorage.setItem('refreshToken', data.refreshToken); localStorage.setItem('currentUser', JSON.stringify(normalizeUser(data.user)));
      setAccessToken(data.accessToken); setRefreshToken(data.refreshToken); setCurrentUser(normalizeUser(data.user)); toast.success('Signed in with Google'); return data.user;
    } catch (error) { console.error('Google sign-in error:', error); toast.error(error.message || 'Google sign-in failed'); throw error; } finally { setLoading(false); }
  }, [switchRole]);

  // Developer helper: create a temporary local session
  const loginLocally = useCallback((userObj) => { const normalized = normalizeUser(userObj); localStorage.setItem('accessToken', 'mock-access-token'); localStorage.setItem('refreshToken', 'mock-refresh-token'); localStorage.setItem('currentUser', JSON.stringify(normalized)); setAccessToken('mock-access-token'); setRefreshToken('mock-refresh-token'); setCurrentUser(normalized); toast.success('Signed in locally'); return normalized; }, []);

  const setUserLocally = useCallback((partialUser) => { try { const merged = normalizeUser({ ...(currentUser || {}), ...(partialUser || {}) }); merged.roles = Array.isArray(merged.roles) ? Array.from(new Set(merged.roles)) : merged.roles || []; if (!merged.activeRole && merged.roles && merged.roles.length > 0) merged.activeRole = merged.roles[0]; localStorage.setItem('currentUser', JSON.stringify(merged)); setCurrentUser(merged); return merged; } catch (e) { console.warn('setUserLocally failed', e); return null; } }, [currentUser]);

  const value = { currentUser, loading, accessToken, refreshToken, register, login, loginLocally, setUserLocally, logout, refreshAccessToken, switchRole, updateUserProfile, registerAsVendor, signInWithGooglePopup, setAuthRedirect, user, isBuyer, isVendor };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) { console.warn('useAuth called outside AuthProvider. Using default values.'); return defaultContextValue; }
  return context;
};
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getApiUrl } from '../utils/apiConfig';

// Default context value for fallback
const defaultContextValue = {
  currentUser: null,
  loading: true,
  accessToken: null,
  refreshToken: null,
  register: async () => { throw new Error('Auth not initialized'); },
  login: async () => { throw new Error('Auth not initialized'); },
  logout: async () => { throw new Error('Auth not initialized'); },
  refreshAccessToken: async () => { throw new Error('Auth not initialized'); },
  switchRole: async () => { throw new Error('Auth not initialized'); },
  updateUserProfile: async () => { throw new Error('Auth not initialized'); },
  registerAsVendor: async () => { throw new Error('Auth not initialized'); },
  setAuthRedirect: () => {},
  user: null,
  isBuyer: false,
  isVendor: false
};

const AuthContext = createContext(defaultContextValue);

// Ensure user object has a consistent shape (always include `roles` array)
const normalizeUser = (u) => {
  if (!u) return u;
  const roles = u.roles || (u.role ? [u.role] : (u.userType ? [u.userType] : []));
  // Always set activeRole to the current role
  const activeRole = u.role || u.userType || (roles.length > 0 ? roles[0] : undefined);
  return { ...u, roles, activeRole };
};
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
          try {
            setCurrentUser(normalizeUser(JSON.parse(storedUser)));
          } catch (e) {
            setCurrentUser(null);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('currentUser');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // This is a placeholder function - actual redirect handling is done in ProtectedRoute
  const setAuthRedirect = useCallback((url) => {
    if (url) sessionStorage.setItem('authRedirect', url);
  }, []);

  // Register as vendor (uses switchRole)
  const registerAsVendor = useCallback(async (vendorInfo) => {
    try {
      const result = await switchRole('vendor');
      return { success: true, user: result, navigateTo: '/vendor/dashboard' };
    } catch (error) {
      console.error('Vendor registration error:', error);
      return { success: false, error: error.message };
    }
  }, [switchRole]);

  // Sign in with Google via popup and exchange id_token for JWT
  const signInWithGooglePopup = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch client ID from backend config endpoint
      let clientId = null;
      try {
        const cfgResp = await tryFetchAuth('/auth/jwt/google-config');
        if (cfgResp && cfgResp.ok) {
          const cfg = await cfgResp.json();
          clientId = cfg.clientId || cfg.client_id || cfg.clientID || null;
        }
      } catch (e) {
        // ignore
      }

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
            window.removeEventListener('message', handler);
            clearTimeout(timer);
            resolve(data);
          }
        };

        window.addEventListener('message', handler);
      });

      const idToken = result?.idToken || result?.id_token;
      if (!idToken) throw new Error('No ID token returned from Google');

      const resp = await tryFetchAuth('/auth/jwt/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleToken: idToken })
      });

      const data = resp ? await resp.json().catch(() => ({})) : {};
      if (!resp || !resp.ok) throw new Error(data.message || 'Google sign-in failed');

      // Persist tokens and user
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('currentUser', JSON.stringify(normalizeUser(data.user)));

      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      setCurrentUser(normalizeUser(data.user));

      toast.success('Signed in with Google');
      return data.user;
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast.error(error.message || 'Google sign-in failed');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [switchRole]);

  // Developer helper: allow other contexts to create a temporary local session
  const loginLocally = useCallback((userObj) => {
    const normalized = normalizeUser(userObj);
    localStorage.setItem('accessToken', 'mock-access-token');
    localStorage.setItem('refreshToken', 'mock-refresh-token');
    localStorage.setItem('currentUser', JSON.stringify(normalized));
    setAccessToken('mock-access-token');
    setRefreshToken('mock-refresh-token');
    setCurrentUser(normalized);
    toast.success('Signed in locally');
    return normalized;
  }, []);

  // Update the stored/current user object in-memory and in localStorage without altering tokens
  const setUserLocally = useCallback((partialUser) => {
    try {
      const merged = normalizeUser({ ...(currentUser || {}), ...(partialUser || {}) });
      merged.roles = Array.isArray(merged.roles) ? Array.from(new Set(merged.roles)) : merged.roles || [];
      if (!merged.activeRole && merged.roles && merged.roles.length > 0) merged.activeRole = merged.roles[0];
      localStorage.setItem('currentUser', JSON.stringify(merged));
      setCurrentUser(merged);
      return merged;
    } catch (e) {
      console.warn('setUserLocally failed', e);
      return null;
    }
  }, [currentUser]);

  const value = {
    currentUser,
    loading,
    accessToken,
    refreshToken,
    register,
    login,
    loginLocally,
    setUserLocally,
    logout,
    refreshAccessToken,
    switchRole,
    updateUserProfile,
    registerAsVendor,
    signInWithGooglePopup,
    setAuthRedirect,
    user: currentUser,
    isBuyer,
    isVendor
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    console.warn('useAuth called outside AuthProvider. Using default values.');
    return defaultContextValue;
  }
  return context;
};


  // Logout user
  const logout = useCallback(async () => {
    try {
      setLoading(true);

      // Call logout endpoint (optional, mainly for logging)
      if (accessToken) {
        try {
          await tryFetchAuth('/auth/jwt/logout', {
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

      const response = await tryFetchAuth('/auth/jwt/refresh', {
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

      // Short-circuit for local/mock authentication used in E2E tests
      if (accessToken && String(accessToken).startsWith('mock')) {
        const updatedUser = normalizeUser({ ...currentUser, role: newRole, roles: Array.from(new Set([...(currentUser.roles || []), newRole])), activeRole: newRole });
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);
        toast.success(`Switched to ${newRole} (mock)`);
        return updatedUser;
      }

      const response = await tryFetchAuth('/auth/jwt/switch-role', {
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

      // If server indicates vendor registration is required, propagate that
      if (data.requiresVendorRegistration) {
        return { requiresVendorRegistration: true };
      }

      // Prefer authoritative user object from server when available
      let serverUser = null;
      if (data.user) {
        serverUser = data.user;
      } else {
        // If server didn't include user in response, attempt to fetch the current profile
        try {
          const meResp = await fetch(getApiUrl('/auth/jwt/me'), {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });
          if (meResp.ok) {
            const meData = await meResp.json();
            serverUser = meData.user || meData;
          }
        } catch (e) {
          // ignore — we'll fallback to merging
        }
      }

      let updatedUser;
      if (serverUser) {
        updatedUser = normalizeUser(serverUser);
      } else {
        // Fallback: merge returned data into currentUser
        updatedUser = normalizeUser({ ...currentUser, ...data.user });
      }

      // Ensure roles array contains the requested role and set activeRole when server didn't
      updatedUser.roles = Array.isArray(updatedUser.roles) ? [...new Set(updatedUser.roles)] : [];
      if (newRole && !updatedUser.roles.includes(newRole)) {
        updatedUser.roles.push(newRole);
      }

      if (!updatedUser.activeRole && newRole) {
        // If server didn't explicitly set an active role, assume the requested role
        updatedUser.activeRole = newRole;
      }

      // Persist authoritative user to localStorage and state
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);

      console.debug('switchRole: updatedUser after switch', { newRole, updatedUser, serverData: data });

      toast.success(`Switched to ${updatedUser.activeRole || newRole} role`);
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

      const response = await fetch(getApiUrl('/auth/jwt/update-profile'), {
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

      // Update and normalize user data locally
      const updatedUser = normalizeUser({ ...currentUser, ...updates });
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

        const response = await tryFetchAuth('/auth/jwt/update-profile', {
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

  // Sign in with Google via popup and exchange id_token for JWT
  const signInWithGooglePopup = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch client ID from backend config endpoint (avoid inlining secrets at build time)
      let clientId = null;
      try {
        const cfgResp = await fetch(getApiUrl('/auth/jwt/google-config'));
        if (cfgResp.ok) {
          const cfg = await cfgResp.json();
          clientId = cfg.clientId || cfg.client_id || cfg.clientID || null;
        }
      } catch (e) {
        // ignore
      }

      if (!clientId) {
        throw new Error('Google client ID is not configured');
      }

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
        const cfgResp = await tryFetchAuth('/auth/jwt/google-config');
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

      // Persist tokens and user
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('currentUser', JSON.stringify(data.user));

      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      setCurrentUser(data.user);

      toast.success('Signed in with Google');
      return data.user;
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast.error(error.message || 'Google sign-in failed');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Developer helper: allow other contexts to create a temporary local session
  const loginLocally = useCallback((userObj) => {
    const normalized = normalizeUser(userObj);
      const resp = await tryFetchAuth('/auth/jwt/google', {
    localStorage.setItem('refreshToken', 'mock-refresh-token');
    localStorage.setItem('currentUser', JSON.stringify(normalized));
    setAccessToken('mock-access-token');
    setRefreshToken('mock-refresh-token');
    setCurrentUser(normalized);
    toast.success('Signed in locally');
    return normalized;
  }, []);

  // Update the stored/current user object in-memory and in localStorage without altering tokens
  const setUserLocally = useCallback((partialUser) => {
    try {
      const merged = normalizeUser({ ...(currentUser || {}), ...(partialUser || {}) });
      // Ensure roles array uniqueness
      merged.roles = Array.isArray(merged.roles) ? Array.from(new Set(merged.roles)) : merged.roles || [];
      if (!merged.activeRole && merged.roles && merged.roles.length > 0) merged.activeRole = merged.roles[0];
      localStorage.setItem('currentUser', JSON.stringify(merged));
      setCurrentUser(merged);
      return merged;
    } catch (e) {
      console.warn('setUserLocally failed', e);
      return null;
    }
  }, [currentUser]);

  const value = {
    currentUser,
    loading,
    accessToken,
    refreshToken,
    register,
    login,
    loginLocally,
    setUserLocally,
    logout,
    refreshAccessToken,
    switchRole,
    updateUserProfile,
    registerAsVendor,
    signInWithGooglePopup,
    setAuthRedirect,
          await tryFetchAuth('/auth/jwt/logout', {
    user: currentUser,
    isBuyer,
    isVendor
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  // Return context even if not in provider (with fallback default values)
  // This allows components to work even if accidentally used outside AuthProvider
  if (!context) {
    console.warn('useAuth called outside AuthProvider. Using default values.');
    return defaultContextValue;
  }
  return context;
};
