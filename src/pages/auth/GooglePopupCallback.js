import React, { useEffect } from 'react';

const decodeState = (encoded) => {
  if (!encoded) return null;
  try {
    const json = atob(encoded);
    return JSON.parse(json);
  } catch (error) {
    console.warn('GoogleCallback: unable to decode state payload', error);
    return null;
  }
};

const GoogleCallback = () => {
  useEffect(() => {
    const processGoogleAuth = async () => {
      console.log('GoogleCallback: Component mounted');
      console.log('GoogleCallback: Current URL', window.location.href);
      console.log('GoogleCallback: Hash', window.location.hash);
      console.log('GoogleCallback: Search', window.location.search);

      try {
        const hash = window.location.hash || '';
        const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
        const searchParams = new URLSearchParams(window.location.search || '');
        const code = searchParams.get('code') || hashParams.get('code') || null;
        const state = searchParams.get('state') || hashParams.get('state') || null;
        const decodedState = decodeState(state);

        console.log('GoogleCallback: Extracted params', { hasCode: !!code, state, decodedState });

        if (!code) {
          console.error('GoogleCallback: No authorization code found in URL');
          console.error('GoogleCallback: All URL params', Object.fromEntries(hashParams));
          console.error('GoogleCallback: All search params', Object.fromEntries(searchParams));
          window.location.href = '/auth/login?error=no_code';
          return;
        }

        console.log('GoogleCallback: Sending authorization code to backend');
        // Send authorization code to backend (backend will exchange it for tokens)
        const resp = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        });

        const data = await resp.json();
        console.log('GoogleCallback: Backend response', { ok: resp.ok, data });

        if (!resp.ok) {
          console.error('GoogleCallback: Backend error', data);
          window.location.href = '/auth/login?error=auth_failed';
          return;
        }

        // Store auth data
        if (data.accessToken) localStorage.setItem('accessToken', data.accessToken);
        if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
        if (data.user) localStorage.setItem('user', JSON.stringify(data.user));

        // Get redirect from state or sessionStorage
        const redirect = decodedState?.redirect || sessionStorage.getItem('authRedirect');

        // Clear redirect from sessionStorage
        sessionStorage.removeItem('authRedirect');

        console.log('GoogleCallback: Redirecting to', redirect || 'default dashboard');

        // Redirect to appropriate page
        if (redirect) {
          window.location.href = redirect;
        } else {
          // Default redirect based on user role
          const user = data.user;
          if (user?.role === 'vendor' || user?.roles?.includes('vendor')) {
            window.location.href = '/vendor/dashboard';
          } else {
            window.location.href = '/dashboard';
          }
        }
      } catch (e) {
        console.error('GoogleCallback: Error processing auth', e);
        window.location.href = '/auth/login?error=processing_error';
      }
    };

    processGoogleAuth();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="p-6 bg-white rounded-lg shadow">
        <p className="text-sm text-gray-700">Completing sign-in…</p>
      </div>
    </div>
  );
};

export default GooglePopupCallback;
