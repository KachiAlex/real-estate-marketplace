import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext-new';
import getPostLoginRoute from '../../utils/getPostLoginRoute';
import toast from 'react-hot-toast';

const GoogleCallbackPage = () => {
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const errorParam = params.get('error');

    if (errorParam) {
      toast.error(`Google authentication error: ${errorParam}`, { duration: 5000 });
      setTimeout(() => navigate('/auth/login', { replace: true }), 3000);
      return;
    }

    if (!code) {
      toast.error('No authorization code received from Google.', { duration: 5000 });
      setTimeout(() => navigate('/auth/login', { replace: true }), 3000);
      return;
    }

    const savedState = sessionStorage.getItem('google_oauth_state');
    if (savedState && state !== savedState) {
      toast.error('State mismatch. Possible CSRF attack detected.', { duration: 5000 });
      setTimeout(() => navigate('/auth/login', { replace: true }), 3000);
      return;
    }

    sessionStorage.removeItem('google_oauth_state');

    (async () => {
      try {
        const user = await signInWithGoogle({
          code,
          redirectUri: `${window.location.origin}/auth/google-callback`
        });

        const redirect = sessionStorage.getItem('authRedirect');
        if (redirect) {
          sessionStorage.removeItem('authRedirect');
          navigate(redirect, { replace: true });
        } else {
          navigate(getPostLoginRoute(user), { replace: true });
        }
      } catch (err) {
        console.error('Google callback error:', err);
        toast.error(err.message || 'Google sign-in failed.', { duration: 5000 });
        setTimeout(() => navigate('/auth/login', { replace: true }), 3000);
      }
    })();
  }, [navigate, signInWithGoogle]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <div className="text-center">
        <div className="space-y-3">
          <div className="inline-block w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <div className="text-white text-lg font-medium">Completing Google sign-in...</div>
        </div>
      </div>
    </div>
  );
};

export default GoogleCallbackPage;
