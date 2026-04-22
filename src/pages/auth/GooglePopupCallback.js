import React, { useEffect } from 'react';

const decodeState = (encoded) => {
  if (!encoded) return null;
  try {
    const json = atob(encoded);
    return JSON.parse(json);
  } catch (error) {
    console.warn('GooglePopupCallback: unable to decode state payload', error);
    return null;
  }
};

const GooglePopupCallback = () => {
  useEffect(() => {
    try {
      const hash = window.location.hash || '';
      const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
      const searchParams = new URLSearchParams(window.location.search || '');
      const idToken = hashParams.get('id_token') || searchParams.get('id_token') || null;
      const accessToken = hashParams.get('access_token') || searchParams.get('access_token') || null;
      const state = hashParams.get('state') || searchParams.get('state') || null;
      const decodedState = decodeState(state);
      const targetOrigin = decodedState?.parentOrigin || window.location.origin;

      if (window.opener && (idToken || accessToken)) {
        window.opener.postMessage({
          type: 'google_oauth_result',
          idToken,
          accessToken,
          state
        }, targetOrigin);
      }
    } catch (e) {
      console.warn('GooglePopupCallback: failed to notify opener', e);
    }

    // Prevent any navigation by clearing the document and closing immediately
    document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">Completing sign-in…</div>';
    window.close();
  }, []);

  return null;
};

export default GooglePopupCallback;
