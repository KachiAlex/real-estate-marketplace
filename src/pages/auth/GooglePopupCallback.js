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

      console.log('GooglePopupCallback: Extracted tokens', { hasIdToken: !!idToken, hasAccessToken: !!accessToken, state, targetOrigin });
      console.log('GooglePopupCallback: Has window.opener', !!window.opener);

      if (window.opener && (idToken || accessToken)) {
        const message = {
          type: 'google_oauth_result',
          idToken,
          accessToken,
          state
        };
        console.log('GooglePopupCallback: Sending message to opener', message);
        window.opener.postMessage(message, targetOrigin);
        console.log('GooglePopupCallback: Message sent successfully');

        // Give the message time to be delivered before closing
        setTimeout(() => {
          console.log('GooglePopupCallback: Closing popup');
          window.close();
        }, 100);
      } else {
        console.error('GooglePopupCallback: Missing window.opener or tokens', { hasOpener: !!window.opener, hasIdToken: !!idToken, hasAccessToken: !!accessToken });
        setTimeout(() => {
          window.close();
        }, 100);
      }
    } catch (e) {
      console.error('GooglePopupCallback: failed to notify opener', e);
      setTimeout(() => {
        window.close();
      }, 100);
    }

    // Prevent any navigation by clearing the document
    document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">Completing sign-in…</div>';
  }, []);

  return null;
};

export default GooglePopupCallback;
