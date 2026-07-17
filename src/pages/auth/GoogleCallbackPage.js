import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext-new';
import { getApiUrl } from '../../utils/apiConfig';
import getPostLoginRoute from '../../utils/getPostLoginRoute';
import toast from 'react-hot-toast';

const GoogleCallbackPage = () => {
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const errorParam = params.get('error');

    if (errorParam) {
      setError(`Google authentication error: ${errorParam}`);
      setTimeout(() => navigate('/auth/login', { replace: true }), 3000);
      return;
    }

    if (!code) {
      setError('No authorization code received from Google.');
      setTimeout(() => navigate('/auth/login', { replace: true }), 3000);
      return;
    }

    const savedState = sessionStorage.getItem('google_oauth_state');
    if (savedState && state !== savedState) {
      setError('State mismatch. Possible CSRF attack detected.');
      setTimeout(() => navigate('/auth/login', { replace: true }), 3000);
      return;
    }

    sessionStorage.removeItem('google_oauth_state');

    (async () => {
      try {
        const resp = await fetch(getApiUrl('/auth/jwt/google'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, redirectUri: `${window.location.origin}/auth/google-callback` })
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp || !resp.ok) {
          throw new Error(data.message || 'Google sign-in failed on server');
        }

        const tokenVal = data.accessToken || data.token || null;
        if (tokenVal) {
          localStorage.setItem('accessToken', tokenVal);
          if (data.refreshToken) {
            localStorage.setItem('refreshToken', data.refreshToken);
          }
        }

        let user = data.user;
        if (tokenVal) {
          try {
            const meResp = await fetch(getApiUrl('/auth/jwt/me'), {
              method: 'GET',
              headers: { Authorization: `Bearer ${tokenVal}` }
            });
            if (meResp && meResp.ok) {
              const meData = await meResp.json().catch(() => ({}));
              if (meData.user || meData) user = meData.user || meData;
            }
          } catch (e) {
            console.warn('Google callback: failed to fetch /me', e);
          }
        }

        toast.success('Google sign-in successful!');
        const redirect = sessionStorage.getItem('authRedirect');
        if (redirect) {
          sessionStorage.removeItem('authRedirect');
          navigate(redirect, { replace: true });
        } else {
          navigate(getPostLoginRoute(user), { replace: true });
        }
      } catch (err) {
        console.error('Google callback error:', err);
        setError(err.message || 'Google sign-in failed.');
        setTimeout(() => navigate('/auth/login', { replace: true }), 3000);
      }
    })();
  }, [navigate, signInWithGoogle]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <div className="text-center">
        {error ? (
          <div className="space-y-3">
            <div className="text-red-400 text-lg font-medium">{error}</div>
            <div className="text-slate-400 text-sm">Redirecting back to login...</div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="inline-block w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <div className="text-white text-lg font-medium">Completing Google sign-in...</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleCallbackPage;
