import React, { useEffect } from 'react';

const GooglePopupCallback = () => {
  useEffect(() => {
    // Parse id_token from URL fragment (#id_token=...&access_token=...)
    try {
      const hash = window.location.hash || '';
      const params = new URLSearchParams(hash.replace(/^#/, ''));
      const idToken = params.get('id_token') || null;
      const accessToken = params.get('access_token') || null;

      if (window.opener && (idToken || accessToken)) {
        window.opener.postMessage({
          type: 'google_oauth_result',
          idToken,
          accessToken
        }, window.location.origin);
      }
    } catch (e) {
      // ignore
    }

    // Close popup shortly after posting message
    setTimeout(() => {
      window.close();
    }, 600);
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
