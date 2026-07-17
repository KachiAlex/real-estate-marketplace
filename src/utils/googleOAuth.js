const getGoogleClientId = () => {
  return (
    process.env.REACT_APP_GOOGLE_CLIENT_ID ||
    process.env.REACT_APP_GOOGLE_OAUTH_CLIENT_ID ||
    '989525174178-ts9qr3cag46dd3t6v8521puacj0u8dvi.apps.googleusercontent.com'
  );
};

const getRedirectUri = () => {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  return `${origin}/auth/google-callback`;
};

export const initiateGoogleOAuth = () => {
  const clientId = getGoogleClientId();
  const redirectUri = encodeURIComponent(getRedirectUri());
  const scope = encodeURIComponent('openid email profile');
  const state = `google_oauth_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('google_oauth_state', state);
  }

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${redirectUri}` +
    `&response_type=code` +
    `&scope=${scope}` +
    `&state=${state}` +
    `&prompt=consent` +
    `&access_type=offline`;

  if (typeof window !== 'undefined') {
    window.location.href = authUrl;
  }
};

export const getGoogleClientIdValue = getGoogleClientId;
