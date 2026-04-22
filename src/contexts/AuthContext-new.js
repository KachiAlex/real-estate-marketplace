
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getApiUrl } from '../utils/apiConfig';

const DEFAULT_GOOGLE_CLIENT_ID = '363622331516-csuhmvdqv5cff2js8pe9oatd6259v6tb.apps.googleusercontent.com';
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID;
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_POPUP_TIMEOUT = 70000; // 70 seconds

const encodeStatePayload = (payload = {}) => {
  try {
    const json = JSON.stringify(payload);
    if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
      return window.btoa(json);
    }
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(json, 'utf-8').toString('base64');
    }
    return json;
  } catch (error) {
    console.warn('encodeStatePayload: failed to encode payload', error);
    return '';
  }
};

const createNonce = () => {
  try {
    if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch (e) {
    /* ignore */
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
};

const openCenteredPopup = (url, target = 'google_oauth_popup') => {
  if (typeof window === 'undefined') return null;
  const width = 480;
  const height = 640;
  const dualScreenLeft = window.screenLeft ?? window.screenX ?? 0;
  const dualScreenTop = window.screenTop ?? window.screenY ?? 0;
  const windowWidth = window.outerWidth ?? window.innerWidth ?? 0;
  const windowHeight = window.outerHeight ?? window.innerHeight ?? 0;
  const left = dualScreenLeft + Math.max(0, (windowWidth - width) / 2);
  const top = dualScreenTop + Math.max(0, (windowHeight - height) / 2);
  const features = `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no,location=no,resizable=yes,scrollbars=yes`;
  const popup = window.open(url, target, features);
  popup?.focus?.();
  return popup;
};

const waitForGoogleResult = (expectedState, popupRef, timeoutMs = GOOGLE_POPUP_TIMEOUT) => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google sign-in is only available in the browser.'));
  }

  return new Promise((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('message', messageHandler);
      }
      clearTimeout(timeoutId);
      // Removed polling for popup.closed to avoid COOP policy violations
    };

    const messageHandler = (event) => {
      if (settled) return;
      if (!event?.data || event.data.type !== 'google_oauth_result') return;
      if (event.origin !== window.location.origin) return;
      if (expectedState && event.data.state !== expectedState) return;
      settled = true;
      cleanup();
      resolve(event.data);
    };

    const timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('Timed out waiting for Google sign-in to complete.'));
    }, timeoutMs);

    // Removed polling interval - rely only on message events
    window.addEventListener('message', messageHandler);
  });
};
const defaultContextValue = {
  currentUser: null,
  loading: true,
  accessToken: null,
  refreshToken: null,
  register: async () => { throw new Error('Auth not initialized'); },
  login: async () => { throw new Error('Auth not initialized'); },
  logout: async () => { throw new Error('Auth not initialized'); },
  refreshAccessToken: async () => { throw new Error('Auth not initialized'); },
  refreshCurrentUser: async () => { throw new Error('Auth not initialized'); },
  switchRole: async () => { throw new Error('Auth not initialized'); },
  updateUserProfile: async () => { throw new Error('Auth not initialized'); },
  registerAsVendor: async () => { throw new Error('Auth not initialized'); },
  signInWithGoogle: async () => { throw new Error('Auth not initialized'); },
  setAuthRedirect: () => {},
  getAuthRedirect: () => null,
  clearAuthRedirect: () => {},
  user: null,
  isBuyer: false,
  isVendor: false
};

const AuthContext = createContext(defaultContextValue);

const storage = {
  get: (key) => {
    try {
      return window?.localStorage?.getItem(key);
    } catch (err) {
      try {
        return window?.sessionStorage?.getItem(key);
      } catch (err2) {
        console.warn('Storage get failed for key', key, err2);
        return null;
      }
    }
  },
  set: (key, value) => {
    try {
      window?.localStorage?.setItem(key, value);
    } catch (err) {
      try {
        window?.sessionStorage?.setItem(key, value);
      } catch (err2) {
        console.warn('Storage set failed for key', key, err2);
      }
    }
  },
  remove: (key) => {
    try {
      window?.localStorage?.removeItem(key);
    } catch (err) {
      // ignore
    }
    try {
      window?.sessionStorage?.removeItem(key);
    } catch (err2) {
      // ignore
    }
  }
};

const isMockToken = (token) => {
  if (!token || typeof token !== 'string') return false;
  return token.startsWith('mock-access-token-') || token.startsWith('mock-refresh-token-');
};

const normalizeUser = (u) => {
  if (!u) return u;
  const roles = u.roles || (u.role ? [u.role] : (u.userType ? [u.userType] : []));
  // Ensure roles is an array of lowercased, trimmed values
  let normRoles = Array.isArray(roles) ? roles.map(r => String(r).trim().toLowerCase()).filter(Boolean) : [];
  
  // Determine activeRole from incoming data
  let activeRole = u.activeRole ? String(u.activeRole).trim().toLowerCase() : null;
  
  
  // Only apply defaults if no activeRole was found anywhere
  if (!activeRole) {
    if (u.role) {
      activeRole = String(u.role).trim().toLowerCase();
    } else if (u.userType) {
      activeRole = String(u.userType).trim().toLowerCase();
    } else {
      activeRole = normRoles[0] || 'user';
    }
  }

  // Ensure activeRole is in roles array
  const finalRoles = [...new Set([...normRoles, activeRole].filter(Boolean))];
  
  // Convert lowercase firstname/lastname to camelCase firstName/lastName
  return { 
    ...u, 
    firstName: u.firstName || u.firstname,
    lastName: u.lastName || u.lastname,
    roles: finalRoles, 
    activeRole 
  };
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessTokenState] = useState(null);
  const [refreshToken, setRefreshTokenState] = useState(null);

  const updateAccessToken = useCallback((tokenValue) => {
    if (tokenValue) {
      storage.set('accessToken', tokenValue);
      setAccessTokenState(tokenValue);
    } else {
      storage.remove('accessToken');
      setAccessTokenState(null);
    }
  }, []);

  const updateRefreshToken = useCallback((tokenValue) => {
    if (tokenValue) {
      storage.set('refreshToken', tokenValue);
      setRefreshTokenState(tokenValue);
    } else {
      storage.remove('refreshToken');
      setRefreshTokenState(null);
    }
  }, []);

  const updateUserState = useCallback((userData) => {
    const normalized = userData ? normalizeUser(userData) : null;
    setCurrentUser(normalized);
    return normalized;
  }, []);

  useEffect(() => {
    let isMounted = true;

    const hydrateAuth = async () => {
      try {
        const storedAccess = storage.get('accessToken');
        const storedRefresh = storage.get('refreshToken');

        if (storedAccess) setAccessTokenState(storedAccess);
        if (storedRefresh) setRefreshTokenState(storedRefresh);

        const storedUserRaw = storage.get('currentUser');
        let storedUser = null;
        if (storedUserRaw) {
          try {
            storedUser = JSON.parse(storedUserRaw);
          } catch (err) {
            console.warn('Failed to parse stored currentUser', err);
          }
        }

        const mockAuthDetected = isMockToken(storedAccess) || isMockToken(storedRefresh);
        if (mockAuthDetected) {
          console.log('⚙️ HYDRATE: Mock auth detected', { hasStoredUser: !!storedUser });
        }
        if (mockAuthDetected && storedUser) {
          const normalizedMockUser = normalizeUser(storedUser);
          if (isMounted && normalizedMockUser) {
            console.log('⚙️ HYDRATE: Using stored mock user', { roles: normalizedMockUser.roles, activeRole: normalizedMockUser.activeRole });
            setCurrentUser(normalizedMockUser);
            setLoading(false);
            return;
          }
        }

        // ALWAYS fetch user data from server (never use cached currentUser)
        // This ensures roles are always fresh and consistent after logout/login
        if (storedAccess) {
          try {
            const resp = await fetch(getApiUrl('/auth/me'), {
              method: 'GET',
              headers: { Authorization: `Bearer ${storedAccess}` }
            }).catch(() => null);
            
            if (resp && resp.ok) {
              const data = await resp.json().catch(() => ({}));
              console.log('✅ HYDRATE: /me response -', { roles: data.user?.roles, role: data.user?.role });
              const normalized = normalizeUser(data.user || data);
              console.log('✅ HYDRATE: After normalize -', { roles: normalized.roles, activeRole: normalized.activeRole });
              if (normalized) {
                if (isMounted) setCurrentUser(normalized);
              }
            } else if (resp && (resp.status === 401 || resp.status === 403)) {
              // Token is invalid or expired - clear it
              console.warn('⚠️ Invalid token detected, clearing auth state');
              storage.remove('accessToken');
              storage.remove('refreshToken');
              if (isMounted) {
                setAccessTokenState(null);
                setRefreshTokenState(null);
                setCurrentUser(null);
              }
            }
          } catch (err) {
            console.warn('Failed to hydrate user from token', err);
            // Clear potentially invalid tokens
            storage.remove('accessToken');
            storage.remove('refreshToken');
            if (isMounted) {
              setAccessTokenState(null);
              setRefreshTokenState(null);
              setCurrentUser(null);
            }
          }
        }
      } catch (e) {
        console.error('Auth init error', e);
        storage.remove('accessToken'); storage.remove('refreshToken');
        if (isMounted) {
          setAccessTokenState(null);
          setRefreshTokenState(null);
          setCurrentUser(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    hydrateAuth();

    return () => { isMounted = false; };
  }, []);


  const persistAuthResult = useCallback((data) => {
    if (!data) return null;
    const normalizedUser = data.user ? normalizeUser(data.user) : null;
    const tokenVal = data.accessToken || data.token || null;

    updateAccessToken(tokenVal);
    updateRefreshToken(data.refreshToken || null);

    return updateUserState(normalizedUser);
  }, [updateAccessToken, updateRefreshToken, updateUserState]);

  const tryFetchAuth = async (path, options = {}) => {
      // Prefer the canonical /auth/* endpoints first to avoid noisy 404s,
      // but fall back to /auth/jwt/* for environments that still expose them.
      try {
        const alt = path.replace('/auth/jwt', '/auth');
        const resAlt = await fetch(getApiUrl(alt), options);
        if (resAlt && resAlt.status !== 404) return resAlt;
      } catch (e) {
        // ignore and try jwt path
      }

      try {
        const res = await fetch(getApiUrl(path), options);
        if (res && res.status !== 404) return res;
      } catch (e) {
        // ignore
      }

      return null;
  };

  const register = useCallback(async (payload) => {
    setLoading(true);
    try {
      const resp = await tryFetchAuth('/auth/jwt/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = resp ? await resp.json().catch(() => ({})) : {};
      if (!resp || !resp.ok) {
        const error = new Error(data.message || 'Registration failed');
        error.details = data.errors || data.error || data.details || null;
        throw error;
      }
      const tokenVal = data.accessToken || data.token || null;
      updateAccessToken(tokenVal);
      updateRefreshToken(data.refreshToken || null);
      let resolvedUser = normalizeUser(data.user);
      if (tokenVal) {
        try {
          const meResp = await tryFetchAuth('/auth/jwt/me', { method: 'GET', headers: { Authorization: `Bearer ${tokenVal}` } });
          if (meResp && meResp.ok) {
            const meData = await meResp.json().catch(() => ({}));
            resolvedUser = normalizeUser(meData.user || meData);
          }
        } catch (e) {
          console.warn('register: failed to refresh /me, using register payload', e);
        }
      }
      updateUserState(resolvedUser);
      toast.success('Registration successful');
      return resolvedUser;
    } catch (e) { toast.error(e.message || 'Registration failed'); throw e; } finally { setLoading(false); }
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      // Clear ALL previous user data before login - COMPREHENSIVE CLEANUP
      // Clear localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('userRole');
      localStorage.removeItem('activeRole');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('authToken');
      
      // Clear sessionStorage
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('refreshToken');
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('userRole');
        sessionStorage.removeItem('activeRole');
      }
      
      // Clear React state
      setCurrentUser(null);
      updateAccessToken(null);
      updateRefreshToken(null);
      
      const resp = await tryFetchAuth('/auth/jwt/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const data = resp ? await resp.json().catch(() => ({})) : {};
      console.log('✅ LOGIN: Backend response -', { hasUser: !!data.user, userRoles: data.user?.roles, userRole: data.user?.role });
      if (!resp || !resp.ok) throw new Error(data.message || 'Login failed');
      const tokenVal = data.accessToken || data.token || null;
      updateAccessToken(tokenVal);
      updateRefreshToken(data.refreshToken || null);
      let resolvedUser = normalizeUser(data.user);
      if (tokenVal) {
        try {
          const meResp = await tryFetchAuth('/auth/jwt/me', { method: 'GET', headers: { Authorization: `Bearer ${tokenVal}` } });
          if (meResp && meResp.ok) {
            const meData = await meResp.json().catch(() => ({}));
            resolvedUser = normalizeUser(meData.user || meData);
          }
        } catch (e) {
          console.warn('login: failed to refresh /me, using login payload', e);
        }
      }
      console.log('✅ LOGIN: After normalizeUser -', { roles: resolvedUser?.roles, activeRole: resolvedUser?.activeRole });
      if (resolvedUser) { 
        console.log('✅ LOGIN: User data NOT persisted to localStorage - will be fetched fresh');
        updateUserState(resolvedUser); 
      } else { updateUserState(null); }
      toast.success('Login successful');
      return resolvedUser;
    } catch (e) { toast.error(e.message || 'Login failed'); throw e; } finally { setLoading(false); }
  }, []);

  const setAuthRedirect = useCallback((url) => {
    if (!url) return;
    sessionStorage.setItem('authRedirect', url);
  }, []);

  const getAuthRedirect = useCallback(() => {
    return sessionStorage.getItem('authRedirect') || null;
  }, []);

  const clearAuthRedirect = useCallback(() => {
    sessionStorage.removeItem('authRedirect');
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (typeof window === 'undefined') {
      const error = new Error('Google sign-in is only available in a browser environment.');
      toast.error(error.message);
      throw error;
    }

    setLoading(true);
    try {
      const origin = window.location.origin;
      const nonce = createNonce();
      const redirectUri = `${origin}/auth/google/callback`;
      const state = encodeStatePayload({ parentOrigin: origin, redirect: getAuthRedirect?.() || null, nonce, ts: Date.now() });

      console.log('Google OAuth: Starting redirect flow', { origin, redirectUri, GOOGLE_CLIENT_ID });
      console.log('Google OAuth: IMPORTANT - Ensure this redirect URI is configured in Google Cloud Console:', redirectUri);

      // Save the current redirect in sessionStorage for the callback
      if (getAuthRedirect?.()) {
        sessionStorage.setItem('authRedirect', getAuthRedirect());
      }

      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: 'token id_token',
        scope: 'openid email profile',
        include_granted_scopes: 'true',
        prompt: 'select_account',
        state,
        nonce
      });

      const authUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;
      console.log('Google OAuth: Redirecting to', authUrl);

      // Redirect to Google OAuth (full page redirect instead of popup)
      window.location.href = authUrl;

      // This will never execute since we're redirecting
      return null;
    } catch (error) {
      console.error('signInWithGoogle error', error);
      toast.error(error.message || 'Google sign-in failed');
      setLoading(false);
      throw error;
    }
  }, [getAuthRedirect]);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      // Call logout endpoint to invalidate session on server
      if (accessToken) {
        try { 
          await fetch(getApiUrl('/auth/logout'), { 
            method: 'POST', 
            headers: { 'Authorization': `Bearer ${accessToken}` } 
          }); 
        } catch (e) { 
          console.warn('Server logout failed, clearing client data anyway', e); 
        }
      }
      
      // Clear ALL auth-related data from localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('activeRole');
      
      // Clear all state
      updateAccessToken(null);
      updateRefreshToken(null);
      setCurrentUser(null);
      
      // Clear any other auth-related session storage
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('currentUser');
      }
      
      toast.success('Logged out successfully');
    } catch (e) { 
      console.error('Logout error:', e);
      toast.error('Logout failed'); 
    } finally { 
      setLoading(false); 
    }
  }, [accessToken]);

  const refreshAccessToken = useCallback(async () => {
    try {
      if (!refreshToken) { await logout(); return null; }
      const base = getApiUrl('').replace(/\/$/, '');
      const jwtUrl = `${base}/auth/jwt/refresh`;
      const altUrl = `${base}/auth/refresh`;
      let resp = null;
      try { resp = await fetch(jwtUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }) }); } catch (e) { resp = null; }
      if ((!resp || resp.status === 404) && !resp?.ok) { try { resp = await fetch(altUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }) }); } catch (e) { resp = null; } }
      const data = resp ? await resp.json().catch(() => ({})) : {};
      if (!resp || !resp.ok) { await logout(); return null; }
      const tokenVal = data.accessToken || data.token || null;
      if (tokenVal) { localStorage.setItem('accessToken', tokenVal); setAccessTokenState(tokenVal); return tokenVal; }
      localStorage.removeItem('accessToken'); setAccessTokenState(null); return null;
    } catch (e) { console.error(e); await logout(); return null; }
  }, [refreshToken, logout]);

  const refreshCurrentUser = useCallback(async () => {
    if (!accessToken) throw new Error('Not authenticated');
    try {
      const resp = await tryFetchAuth('/auth/jwt/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      const data = resp ? await resp.json().catch(() => ({})) : {};
      if (!resp || !resp.ok) {
        throw new Error(data.message || 'Failed to refresh user');
      }
      const normalized = normalizeUser(data.user || data);
      setCurrentUser(normalized);
      return normalized;
    } catch (error) {
      console.error('refreshCurrentUser error', error);
      throw error;
    }
  }, [accessToken]);

  const switchRole = useCallback(async (newRole, options = {}) => {
    const { silent = false } = options || {};
    try {
      if (!accessToken || !currentUser) throw new Error('User not logged in');
      
      // GUARD 1: Verify that the role being switched to is actually in the user's roles array
      const normalizedNewRole = String(newRole).trim().toLowerCase();
      const userRoles = Array.isArray(currentUser.roles) ? currentUser.roles.map(r => String(r).trim().toLowerCase()) : [];
      
      if (!userRoles.includes(normalizedNewRole)) {
        console.warn('🚫 switchRole: Role not in user roles array', { newRole: normalizedNewRole, userRoles });
        throw new Error(`User does not have the ${newRole} role`);
      }
      
      console.log('🔄 switchRole: Before switch -', { 
        userId: currentUser.id, 
        userEmail: currentUser.email, 
        firstName: currentUser.firstName, 
        lastName: currentUser.lastName,
        currentActiveRole: currentUser.activeRole,
        targetRole: normalizedNewRole
      });
      
      if (String(accessToken).startsWith('mock')) {
        const mergedRoles = Array.from(new Set([...(currentUser.roles || []), newRole].filter(Boolean)));
        const updated = normalizeUser({ ...currentUser, role: newRole, roles: mergedRoles, activeRole: newRole }, {
          id: currentUser.id,
          email: currentUser.email,
          firstName: currentUser.firstName,
          lastName: currentUser.lastName
        });
        // User data NOT persisted to localStorage
        setCurrentUser(updated);
        console.log('🔄 switchRole: After switch (mock) -', { 
          userId: updated.id, 
          userEmail: updated.email, 
          firstName: updated.firstName, 
          lastName: updated.lastName,
          activeRole: updated.activeRole
        });
        return updated;
      }
      
      let resp = await fetch(getApiUrl('/api/users/switch-role'), { method: 'POST', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ role: newRole }) });
      let data = resp ? await resp.json().catch(() => ({})) : {};

      if (!resp || resp.status === 404) {
        throw new Error('Role switch endpoint not available');
      }

      if (!resp.ok) throw new Error(data.message || 'Role switch failed');
      
      let serverUser = data.user || null;
      console.log('🔄 switchRole: Response from /api/users/switch-role:', { 
        hasUser: !!serverUser, 
        userId: serverUser?.id,
        userEmail: serverUser?.email,
        firstName: serverUser?.firstName
      });
      
      if (!serverUser) {
        try { const me = await tryFetchAuth('/auth/jwt/me', { method: 'GET', headers: { 'Authorization': `Bearer ${accessToken}` } }); if (me && me.ok) { const md = await me.json().catch(() => ({})); serverUser = md.user || md; } } catch (e) {}
      }
      
      // CRITICAL FIX: Preserve user identity when normalizing the response
      // Pass the current user's identity to ensure it's never overwritten
      const updated = normalizeUser(serverUser || { ...currentUser, ...data.user }, {
        id: currentUser.id,
        email: currentUser.email,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName
      });
      
      console.log('🔄 switchRole: After normalizeUser (with identity preservation):', { 
        userId: updated.id, 
        userEmail: updated.email, 
        firstName: updated.firstName, 
        lastName: updated.lastName,
        roles: updated.roles,
        activeRole: updated.activeRole
      });
      
      // CRITICAL: Ensure roles array is always preserved and merged
      updated.roles = Array.isArray(updated.roles) ? [...new Set(updated.roles)].filter(Boolean) : [];
      if (newRole && !updated.roles.includes(newRole.toLowerCase())) {
        updated.roles.push(newRole.toLowerCase());
      }
      if (!updated.activeRole && newRole) {
        updated.activeRole = newRole.toLowerCase();
      }
      
      // User data NOT persisted to localStorage
      setCurrentUser(updated);
      
      console.log('🔄 switchRole: Final state -', { 
        userId: updated.id, 
        userEmail: updated.email, 
        firstName: updated.firstName, 
        lastName: updated.lastName,
        activeRole: updated.activeRole
      });
      
      if (!silent) toast.success('Role switched');
      return updated;
    } catch (e) {
      if (!silent) {
        toast.error(e.message || 'Role switch failed');
      } else {
        console.warn('Silent role switch failed', e && e.message ? e.message : e);
      }
      throw e;
    }
  }, [accessToken, currentUser]);

  const updateUserProfile = useCallback(async (updates) => {
    try {
      if (!currentUser) throw new Error('Not logged in');
      const resp = await tryFetchAuth('/api/auth/jwt/update-profile', { method: 'PUT', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
      const data = resp ? await resp.json().catch(() => ({})) : {};
      console.log('updateUserProfile response', resp && resp.status, data);
      if (!resp || !resp.ok) {
        const serverMsg = data && (data.message || data.error || JSON.stringify(data));
        throw new Error(serverMsg || 'Update failed');
      }
      const merged = normalizeUser({ ...currentUser, ...updates });
      // CRITICAL: User data NOT persisted to localStorage - always fetch fresh from server
      setCurrentUser(merged);
      toast.success('Profile updated');
      return merged;
    } catch (e) { toast.error(e.message || 'Profile update failed'); throw e; }
  }, [accessToken, currentUser]);

  const loginLocally = useCallback((userObj) => {
    const normalized = normalizeUser(userObj);
    const roleSegment = normalized?.activeRole || normalized?.role || 'user';
    const accessTokenValue = `mock-access-token-${roleSegment}`;
    const refreshTokenValue = `mock-refresh-token-${roleSegment}`;
    localStorage.setItem('accessToken', accessTokenValue);
    localStorage.setItem('refreshToken', refreshTokenValue);
    localStorage.setItem('currentUser', JSON.stringify(normalized));
    updateAccessToken(accessTokenValue);
    updateRefreshToken(refreshTokenValue);
    updateUserState(normalized);
    toast.success('Signed in locally');
    return normalized;
  }, []);

  const setUserLocally = useCallback((partialUser) => {
    try {
      const merged = normalizeUser({ ...(currentUser || {}), ...(partialUser || {}) });
      merged.roles = Array.isArray(merged.roles) ? Array.from(new Set(merged.roles)) : merged.roles || [];
      if (!merged.activeRole && merged.roles && merged.roles.length > 0) merged.activeRole = merged.roles[0];
      // CRITICAL: DO NOT save user data to localStorage - always fetch fresh from server
      // localStorage.setItem('currentUser', JSON.stringify(merged));
      setCurrentUser(merged);
      return merged;
    } catch (e) { console.warn('setUserLocally failed', e); return null; }
  }, [currentUser]);

  const registerAsVendor = useCallback(async (vendorInfo) => { try { return await switchRole('vendor'); } catch (e) { throw e; } }, [switchRole]);

  const manageRole = useCallback(async ({ action, role, setActive = false, targetId = null }) => {
    if (!accessToken) throw new Error('Not authenticated');
    const id = targetId || currentUser?.id;
    if (!id) throw new Error('User ID missing');
    try {
      const resp = await fetch(getApiUrl(`/api/users/switch-role`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({ role, action, setActive })
      });
      const data = resp ? await resp.json().catch(() => ({})) : {};
      if (!resp || !resp.ok) throw new Error(data.message || 'Role update failed');
      const updatedUser = normalizeUser(data.user || data);
      // CRITICAL: User data NOT persisted to localStorage - always fetch fresh from server
      setCurrentUser(updatedUser);
      toast.success('Roles updated');
      return updatedUser;
    } catch (e) {
      toast.error(e.message || 'Role update failed');
      throw e;
    }
  }, [accessToken, currentUser]);

  const addRole = useCallback(async (role, setActive = false, targetId = null) => {
    return await manageRole({ action: 'add', role, setActive, targetId });
  }, [manageRole]);

  const removeRole = useCallback(async (role, targetId = null) => {
    return await manageRole({ action: 'remove', role, setActive: false, targetId });
  }, [manageRole]);

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
    refreshCurrentUser,
    switchRole,
    addRole,
    removeRole,
    updateUserProfile,
    registerAsVendor,
    signInWithGoogle,
    setUser: updateUserState,
    setAccessToken: updateAccessToken,
    setRefreshToken: updateRefreshToken,
    setAuthRedirect,
    getAuthRedirect,
    clearAuthRedirect,
    user: currentUser,
    isBuyer: currentUser?.role === 'buyer' || currentUser?.userType === 'buyer',
    isVendor: currentUser?.role === 'vendor' || currentUser?.userType === 'vendor'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) { console.warn('useAuth called outside AuthProvider. Using default values.'); return defaultContextValue; }
  return context;
};
