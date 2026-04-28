
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
  refreshCurrentUser: async () => { throw new Error('Auth not initialized'); },
  switchRole: async () => { throw new Error('Auth not initialized'); },
  updateUserProfile: async () => { throw new Error('Auth not initialized'); },
  registerAsVendor: async () => { throw new Error('Auth not initialized'); },
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

const createAuthDebugId = () => {
  try {
    if (typeof crypto !== 'undefined' && crypto && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch (err) {
    // ignore
  }

  return `auth-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
};

const maskEmail = (value) => {
  if (!value || typeof value !== 'string') return value || '';
  const [local, domain] = value.split('@');
  if (!domain) return `${value.slice(0, 2)}***`;
  return `${local.slice(0, 2)}***@${domain}`;
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
        // Startup connectivity check
        try {
          const healthUrl = getApiUrl('/health');
          console.log('🔍 [AUTH DEBUG] startup health ping', { healthUrl, origin: window.location?.origin });
          const healthResp = await fetch(healthUrl, { method: 'GET' }).catch((e) => {
            logFetchError('health ping failed', e);
            return null;
          });
          console.log('🔍 [AUTH DEBUG] health ping result', {
            status: healthResp?.status ?? null,
            ok: !!healthResp?.ok,
            url: healthUrl
          });
        } catch (healthErr) {
          logFetchError('health ping unexpected error', healthErr);
        }

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

  const logFetchError = (label, e) => {
    try {
      console.error(`🔴 [AUTH DEBUG] ${label}`, {
        errorType: e?.name || 'unknown',
        errorMessage: e?.message || String(e),
        errorCode: e?.code || null,
        errorStack: e?.stack || null,
        rawError: JSON.stringify(e, Object.getOwnPropertyNames(e))
      });
    } catch (serializeErr) {
      console.error(`🔴 [AUTH DEBUG] ${label} (serialize failed)`, { raw: String(e) });
    }
  };

  const xhrFetch = (url, options = {}) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(options.method || 'GET', url, true);
      if (options.headers) {
        Object.entries(options.headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
      }
      xhr.onload = () => {
        resolve({
          ok: xhr.status >= 200 && xhr.status < 300,
          status: xhr.status,
          statusText: xhr.statusText,
          headers: new Headers(),
          json: async () => {
            try { return JSON.parse(xhr.responseText); } catch { return {}; }
          },
          text: async () => xhr.responseText,
          _source: 'xhr'
        });
      };
      xhr.onerror = () => reject(new Error(`XHR network error: ${url}`));
      xhr.ontimeout = () => reject(new Error(`XHR timeout: ${url}`));
      xhr.onabort = () => reject(new Error(`XHR aborted: ${url}`));
      xhr.send(options.body || null);
    });
  };

  const nativeHttpRequest = async (url, options = {}) => {
    try {
      if (typeof window === 'undefined' || !window.Capacitor || !window.Capacitor.Plugins || !window.Capacitor.Plugins.Http) {
        throw new Error('CapacitorHttp plugin not available');
      }
      const headers = options.headers || {};
      const response = await window.Capacitor.Plugins.Http.request({
        method: options.method || 'GET',
        url,
        headers,
        data: options.body || undefined,
        connectTimeout: 15000,
        readTimeout: 15000
      });
      return {
        ok: response.status >= 200 && response.status < 300,
        status: response.status,
        statusText: '',
        headers: new Headers(response.headers || {}),
        json: async () => {
          try { return JSON.parse(response.data); } catch { return {}; }
        },
        text: async () => (typeof response.data === 'string' ? response.data : JSON.stringify(response.data)),
        _source: 'nativeHttp'
      };
    } catch (e) {
      logFetchError('nativeHttp request failed', e);
      throw e;
    }
  };

  const fetchWithTimeout = async (url, options = {}, timeoutMs = 15000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const resp = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      return resp;
    } catch (e) {
      clearTimeout(id);
      if (e.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeoutMs}ms: ${url}`);
      }
      throw e;
    }
  };

  const tryFetchAuth = async (path, options = {}, debugMeta = {}) => {
      const requestId = debugMeta.requestId || options.headers?.['X-Debug-Request-Id'] || options.headers?.['x-debug-request-id'] || null;
      const alt = path.replace('/auth/jwt', '/auth');
      const altUrl = getApiUrl(alt);
      const primaryUrl = getApiUrl(path);

      console.log('🔍 [AUTH DEBUG] fetch starting', {
        requestId,
        path,
        altUrl,
        primaryUrl,
        method: options.method || 'GET',
        origin: typeof window !== 'undefined' ? window.location?.origin : 'no-window',
        hostname: typeof window !== 'undefined' ? window.location?.hostname : 'no-window',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'no-navigator',
        hasCapacitorHttp: !!(typeof window !== 'undefined' && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Http)
      });

      // Try 1: fetch with timeout
      try {
        const resAlt = await fetchWithTimeout(altUrl, options, 15000);
        console.log('🔍 [AUTH DEBUG] fetch alt attempt', {
          requestId,
          altUrl,
          status: resAlt?.status ?? null,
          ok: !!resAlt?.ok,
          source: 'fetch'
        });
        if (resAlt && resAlt.status !== 404) return resAlt;
      } catch (e) {
        logFetchError(`fetch alt failed ${altUrl}`, e);
      }

      // Try 2: fetch primary with timeout
      try {
        const res = await fetchWithTimeout(primaryUrl, options, 15000);
        console.log('🔍 [AUTH DEBUG] fetch primary attempt', {
          requestId,
          primaryUrl,
          status: res?.status ?? null,
          ok: !!res?.ok,
          source: 'fetch'
        });
        if (res && res.status !== 404) return res;
      } catch (e) {
        logFetchError(`fetch primary failed ${primaryUrl}`, e);
      }

      // Try 3: XMLHttpRequest fallback
      try {
        console.log('🔍 [AUTH DEBUG] trying XHR fallback', { requestId, altUrl });
        const resAltXhr = await xhrFetch(altUrl, options);
        console.log('🔍 [AUTH DEBUG] XHR alt attempt', {
          requestId,
          altUrl,
          status: resAltXhr?.status ?? null,
          ok: !!resAltXhr?.ok,
          source: 'xhr'
        });
        if (resAltXhr && resAltXhr.status !== 404) return resAltXhr;
      } catch (e) {
        logFetchError(`XHR alt failed ${altUrl}`, e);
      }

      try {
        console.log('🔍 [AUTH DEBUG] trying XHR fallback primary', { requestId, primaryUrl });
        const resXhr = await xhrFetch(primaryUrl, options);
        console.log('🔍 [AUTH DEBUG] XHR primary attempt', {
          requestId,
          primaryUrl,
          status: resXhr?.status ?? null,
          ok: !!resXhr?.ok,
          source: 'xhr'
        });
        if (resXhr && resXhr.status !== 404) return resXhr;
      } catch (e) {
        logFetchError(`XHR primary failed ${primaryUrl}`, e);
      }

      // Try 4: Native CapacitorHttp fallback
      try {
        console.log('🔍 [AUTH DEBUG] trying native HTTP fallback', { requestId, altUrl });
        const resAltNative = await nativeHttpRequest(altUrl, options);
        console.log('🔍 [AUTH DEBUG] native alt attempt', {
          requestId,
          altUrl,
          status: resAltNative?.status ?? null,
          ok: !!resAltNative?.ok,
          source: 'native'
        });
        if (resAltNative && resAltNative.status !== 404) return resAltNative;
      } catch (e) {
        logFetchError(`native alt failed ${altUrl}`, e);
      }

      try {
        console.log('🔍 [AUTH DEBUG] trying native HTTP fallback primary', { requestId, primaryUrl });
        const resNative = await nativeHttpRequest(primaryUrl, options);
        console.log('🔍 [AUTH DEBUG] native primary attempt', {
          requestId,
          primaryUrl,
          status: resNative?.status ?? null,
          ok: !!resNative?.ok,
          source: 'native'
        });
        if (resNative && resNative.status !== 404) return resNative;
      } catch (e) {
        logFetchError(`native primary failed ${primaryUrl}`, e);
      }

      console.warn('🔍 [AUTH DEBUG] ALL transports exhausted', { requestId, path, altUrl, primaryUrl });
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
      
      const requestId = createAuthDebugId();
      const loginUrl = getApiUrl('/auth/jwt/login');
      console.log('🔍 [AUTH DEBUG] login request starting', {
        requestId,
        email: maskEmail(email),
        loginUrl
      });
      toast('Sending login request...', { icon: '📡', duration: 4000 });

      const resp = await tryFetchAuth(
        '/auth/jwt/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Debug-Request-Id': requestId },
          body: JSON.stringify({ email, password })
        },
        { requestId }
      );
      const data = resp ? await resp.json().catch(() => ({})) : {};
      console.log('🔍 [AUTH DEBUG] login response', {
        requestId,
        status: resp?.status ?? null,
        ok: !!resp?.ok,
        message: data.message || null,
        error: data.error || null,
        errors: data.errors || null,
        hasUser: !!data.user,
        userRoles: data.user?.roles,
        userRole: data.user?.role,
        responseKeys: data ? Object.keys(data) : []
      });
      if (!resp || !resp.ok) {
        const msg = data.message || (resp ? `Login failed (HTTP ${resp.status})` : 'Login failed (no response)');
        toast.error(`Server error: ${msg}`, { duration: 5000 });
        const error = new Error(msg);
        error.status = resp?.status ?? null;
        error.responseData = data;
        error.requestId = requestId;
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
    } catch (e) {
      console.error('❌ [AUTH DEBUG] login failed', {
        message: e && e.message ? e.message : String(e),
        status: e?.status ?? null,
        requestId: e?.requestId || null,
        responseData: e?.responseData || null
      });
      const errMsg = e && e.message ? e.message : 'Login failed';
      toast.error(errMsg, { duration: 6000 });
      // Also show a native alert for critical "no response" errors so user sees it even if toast container fails
      if (errMsg.includes('no response') && typeof window !== 'undefined' && window.alert) {
        window.alert(`Login failed: ${errMsg}\n\nPlease check your internet connection.`);
      }
      throw e;
    } finally { setLoading(false); }
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
