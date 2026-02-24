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
  switchRole: async () => { throw new Error('Auth not initialized'); },
  updateUserProfile: async () => { throw new Error('Auth not initialized'); },
  registerAsVendor: async () => { throw new Error('Auth not initialized'); },
  setAuthRedirect: () => {},
  user: null,
  isBuyer: false,
  isVendor: false
};

const AuthContext = createContext(defaultContextValue);

const normalizeUser = (u) => {
  if (!u) return u;
  const roles = u.roles || (u.role ? [u.role] : (u.userType ? [u.userType] : []));
  // Ensure roles is an array of lowercased, trimmed values
  const normRoles = Array.isArray(roles) ? roles.map(r => String(r).trim().toLowerCase()) : [];

  // Default active role logic:
  // - If an explicit activeRole is provided, respect it.
  // - If the user has both 'user' and 'vendor' roles and no explicit activeRole, default to 'user'.
  // - Otherwise prefer explicit `role` or `userType`, then fall back to first role.
  let activeRole = u.activeRole || null;
  if (!activeRole) {
    if (normRoles.includes('user') && normRoles.includes('vendor')) {
      activeRole = 'user';
    } else if (u.role) {
      activeRole = u.role;
    } else if (u.userType) {
      activeRole = u.userType;
    } else {
      activeRole = normRoles[0] || undefined;
    }
  }

  return { ...u, roles: normRoles, activeRole };
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);

  useEffect(() => {
    try {
      const a = localStorage.getItem('accessToken');
      const r = localStorage.getItem('refreshToken');
      const u = localStorage.getItem('currentUser');
      if (a && r && u) {
        setAccessToken(a);
        setRefreshToken(r);
        try { setCurrentUser(normalizeUser(JSON.parse(u))); } catch (e) { setCurrentUser(null); }
      }
    } catch (e) {
      console.error('Auth init error', e);
      localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); localStorage.removeItem('currentUser');
    } finally { setLoading(false); }
  }, []);

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
      if (!resp || !resp.ok) throw new Error(data.message || 'Registration failed');
      const u = normalizeUser(data.user);
      const tokenVal = data.accessToken || data.token || null;
      if (tokenVal) { localStorage.setItem('accessToken', tokenVal); setAccessToken(tokenVal); } else { localStorage.removeItem('accessToken'); setAccessToken(null); }
      if (data.refreshToken) { localStorage.setItem('refreshToken', data.refreshToken); setRefreshToken(data.refreshToken); } else { localStorage.removeItem('refreshToken'); setRefreshToken(null); }
      if (u) { localStorage.setItem('currentUser', JSON.stringify(u)); setCurrentUser(u); } else { localStorage.removeItem('currentUser'); setCurrentUser(null); }
      toast.success('Registration successful');
      return u;
    } catch (e) { toast.error(e.message || 'Registration failed'); throw e; } finally { setLoading(false); }
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const resp = await tryFetchAuth('/auth/jwt/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const data = resp ? await resp.json().catch(() => ({})) : {};
      if (!resp || !resp.ok) throw new Error(data.message || 'Login failed');
      const u = normalizeUser(data.user);
      const tokenVal = data.accessToken || data.token || null;
      if (tokenVal) { localStorage.setItem('accessToken', tokenVal); setAccessToken(tokenVal); } else { localStorage.removeItem('accessToken'); setAccessToken(null); }
      if (data.refreshToken) { localStorage.setItem('refreshToken', data.refreshToken); setRefreshToken(data.refreshToken); } else { localStorage.removeItem('refreshToken'); setRefreshToken(null); }
      if (u) { localStorage.setItem('currentUser', JSON.stringify(u)); setCurrentUser(u); } else { localStorage.removeItem('currentUser'); setCurrentUser(null); }
      toast.success('Login successful');
      return u;
    } catch (e) { toast.error(e.message || 'Login failed'); throw e; } finally { setLoading(false); }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      if (accessToken) {
        try { await tryFetchAuth('/auth/jwt/logout', { method: 'POST', headers: { 'Authorization': `Bearer ${accessToken}` } }); } catch (e) { /* ignore */ }
      }
      localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); localStorage.removeItem('currentUser');
      setAccessToken(null); setRefreshToken(null); setCurrentUser(null);
      toast.success('Logged out');
    } catch (e) { toast.error('Logout failed'); } finally { setLoading(false); }
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
      if (tokenVal) { localStorage.setItem('accessToken', tokenVal); setAccessToken(tokenVal); return tokenVal; }
      localStorage.removeItem('accessToken'); setAccessToken(null); return null;
    } catch (e) { console.error(e); await logout(); return null; }
  }, [refreshToken, logout]);

  const switchRole = useCallback(async (newRole) => {
    try {
      if (!accessToken || !currentUser) throw new Error('User not logged in');
      if (String(accessToken).startsWith('mock')) {
        const updated = normalizeUser({ ...currentUser, role: newRole, roles: Array.from(new Set([...(currentUser.roles || []), newRole])), activeRole: newRole });
        localStorage.setItem('currentUser', JSON.stringify(updated)); setCurrentUser(updated); return updated;
      }
      const resp = await tryFetchAuth('/auth/jwt/switch-role', { method: 'POST', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ role: newRole }) });
      const data = resp ? await resp.json().catch(() => ({})) : {};
      if (!resp || !resp.ok) throw new Error(data.message || 'Role switch failed');
      let serverUser = data.user || null;
      if (!serverUser) {
        try { const me = await tryFetchAuth('/auth/jwt/me', { method: 'GET', headers: { 'Authorization': `Bearer ${accessToken}` } }); if (me && me.ok) { const md = await me.json().catch(() => ({})); serverUser = md.user || md; } } catch (e) {}
      }
      const updated = normalizeUser(serverUser || { ...currentUser, ...data.user });
      updated.roles = Array.isArray(updated.roles) ? [...new Set(updated.roles)] : [];
      if (newRole && !updated.roles.includes(newRole)) updated.roles.push(newRole);
      if (!updated.activeRole && newRole) updated.activeRole = newRole;
      localStorage.setItem('currentUser', JSON.stringify(updated)); setCurrentUser(updated);
      toast.success('Role switched');
      return updated;
    } catch (e) { toast.error(e.message || 'Role switch failed'); throw e; }
  }, [accessToken, currentUser]);

  const updateUserProfile = useCallback(async (updates) => {
    try {
      if (!currentUser) throw new Error('Not logged in');
      const resp = await tryFetchAuth('/auth/jwt/update-profile', { method: 'PUT', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
      const data = resp ? await resp.json().catch(() => ({})) : {};
      if (!resp || !resp.ok) throw new Error(data.message || 'Update failed');
      const merged = normalizeUser({ ...currentUser, ...updates });
      localStorage.setItem('currentUser', JSON.stringify(merged)); setCurrentUser(merged);
      toast.success('Profile updated');
      return merged;
    } catch (e) { toast.error(e.message || 'Profile update failed'); throw e; }
  }, [accessToken, currentUser]);

  const signInWithGooglePopup = useCallback(async () => {
    try {
      setLoading(true);
      const cfgResp = await tryFetchAuth('/auth/jwt/google-config');
      const cfg = cfgResp && cfgResp.ok ? await cfgResp.json().catch(() => ({})) : {};
      const clientId = cfg.clientId || cfg.client_id || cfg.clientID || null;
      if (!clientId) throw new Error('Google client ID missing');
      const redirectUri = `${window.location.origin}/auth/google-popup-callback`;
      const params = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, response_type: 'id_token token', scope: 'openid profile email', prompt: 'select_account' });
      const popup = window.open(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`, 'google_oauth', 'width=500,height=650');
      if (!popup) throw new Error('Popup blocked');
      const result = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => { window.removeEventListener('message', handler); reject(new Error('Timed out')); }, 2 * 60 * 1000);
        const handler = (e) => { if (e.origin !== window.location.origin) return; if (e.data && e.data.type === 'google_oauth_result') { window.removeEventListener('message', handler); clearTimeout(timer); resolve(e.data); } };
        window.addEventListener('message', handler);
      });
      const idToken = result?.idToken || result?.id_token; if (!idToken) throw new Error('No id token');
      const resp = await tryFetchAuth('/auth/jwt/google', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ googleToken: idToken }) });
      const data = resp ? await resp.json().catch(() => ({})) : {};
      if (!resp || !resp.ok) throw new Error(data.message || 'Google sign-in failed');
      const u = normalizeUser(data.user);
      const tokenVal = data.accessToken || data.token || null;
      if (tokenVal) { localStorage.setItem('accessToken', tokenVal); setAccessToken(tokenVal); } else { localStorage.removeItem('accessToken'); setAccessToken(null); }
      if (data.refreshToken) { localStorage.setItem('refreshToken', data.refreshToken); setRefreshToken(data.refreshToken); } else { localStorage.removeItem('refreshToken'); setRefreshToken(null); }
      if (u) { localStorage.setItem('currentUser', JSON.stringify(u)); setCurrentUser(u); } else { localStorage.removeItem('currentUser'); setCurrentUser(null); }
      toast.success('Signed in with Google');
      return u;
    } catch (e) { toast.error(e.message || 'Google sign-in failed'); throw e; } finally { setLoading(false); }
  }, []);

  const loginLocally = useCallback((userObj) => {
    const normalized = normalizeUser(userObj);
    localStorage.setItem('accessToken','mock-access-token');
    localStorage.setItem('refreshToken','mock-refresh-token');
    localStorage.setItem('currentUser', JSON.stringify(normalized));
    setAccessToken('mock-access-token'); setRefreshToken('mock-refresh-token'); setCurrentUser(normalized);
    toast.success('Signed in locally');
    return normalized;
  }, []);

  const setUserLocally = useCallback((partialUser) => {
    try {
      const merged = normalizeUser({ ...(currentUser || {}), ...(partialUser || {}) });
      merged.roles = Array.isArray(merged.roles) ? Array.from(new Set(merged.roles)) : merged.roles || [];
      if (!merged.activeRole && merged.roles && merged.roles.length > 0) merged.activeRole = merged.roles[0];
      localStorage.setItem('currentUser', JSON.stringify(merged)); setCurrentUser(merged);
      return merged;
    } catch (e) { console.warn('setUserLocally failed', e); return null; }
  }, [currentUser]);

  const setAuthRedirect = useCallback((url) => { if (url) sessionStorage.setItem('authRedirect', url); }, []);

  const registerAsVendor = useCallback(async (vendorInfo) => { try { return await switchRole('vendor'); } catch (e) { throw e; } }, [switchRole]);

  const manageRole = useCallback(async ({ action, role, setActive = false, targetId = null }) => {
    if (!accessToken) throw new Error('Not authenticated');
    const id = targetId || currentUser?.id;
    if (!id) throw new Error('User ID missing');
    try {
      const resp = await fetch(getApiUrl(`/users/${id}/roles`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({ action, role, setActive })
      });
      const data = resp ? await resp.json().catch(() => ({})) : {};
      if (!resp || !resp.ok) throw new Error(data.message || 'Role update failed');
      const updatedUser = normalizeUser(data.user || data);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
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
    switchRole,
    addRole,
    removeRole,
    updateUserProfile,
    registerAsVendor,
    signInWithGooglePopup,
    setAuthRedirect,
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
