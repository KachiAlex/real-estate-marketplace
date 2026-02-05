/**
 * Google OAuth 2.0 Configuration
 * No Firebase dependency - pure Google OAuth 2.0
 */

// Your Google OAuth 2.0 Client ID (get from Google Cloud Console)
// https://console.cloud.google.com/apis/credentials
export const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

// Validate that client ID is set
if (!GOOGLE_CLIENT_ID) {
  console.warn('⚠️ REACT_APP_GOOGLE_CLIENT_ID is not set in .env file');
  console.warn('Google Sign-In will not work until you add it');
  console.warn('Get your Client ID from: https://console.cloud.google.com/apis/credentials');
}

/**
 * Initialize Google OAuth 2.0 Script
 * Dynamically loads Google's OAuth library
 */
export const initializeGoogleOAuth = () => {
  return new Promise((resolve, reject) => {
    // Check if script already loaded
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    // Load Google's OAuth script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      // Initialize Google Sign-In
      if (window.google?.accounts?.id) {
        resolve();
      } else {
        reject(new Error('Google OAuth library failed to load'));
      }
    };

    script.onerror = () => {
      reject(new Error('Failed to load Google OAuth script'));
    };

    document.head.appendChild(script);
  });
};

/**
 * Render Google Sign-In Button
 * @param {string} elementId - ID of the element where button should be rendered
 * @param {Function} onSuccess - Callback when user signs in
 * @param {Function} onError - Callback on error
 */
export const renderGoogleSignInButton = (elementId, onSuccess, onError) => {
  if (!window.google?.accounts?.id) {
    console.error('Google OAuth not initialized');
    onError(new Error('Google OAuth not initialized'));
    return;
  }

  try {
    window.google.accounts.id.renderButton(
      document.getElementById(elementId),
      {
        type: 'standard',
        size: 'large',
        text: 'continue_with',
        locale: 'en_US',
        theme: 'outline',
        width: '100%'
      }
    );

    // Set up one-tap sign-in
    window.google.accounts.id.prompt(
      (notification) => {
        console.log('Google One-tap notification:', notification);
      }
    );

    // Listen for sign-in response
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        if (response.credential) {
          onSuccess(response.credential);
        } else if (!response.clientId) {
          onError(new Error('Google Sign-In popup closed'));
        }
      }
    });
  } catch (error) {
    console.error('Error rendering Google Sign-In button:', error);
    onError(error);
  }
};

/**
 * Sign in with Google using Popup
 * @returns {Promise<string>} Google ID token
 */
export const signInWithGooglePopup = () => {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.id) {
      reject(new Error('Google OAuth not initialized'));
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (response.credential) {
            resolve(response.credential);
          } else {
            reject(new Error('No credential received from Google'));
          }
        },
        error_callback: () => {
          reject(new Error('Google Sign-In popup closed or failed'));
        }
      });

      // Trigger the popup
      window.google.accounts.id.prompt(
        (notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Fallback to button click - user will click button instead
            reject(new Error('Prompt not displayed'));
          }
        }
      );
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Decode Google ID Token (without verification, for reference)
 * In production, verification should happen on backend
 * @param {string} token - Google ID token
 * @returns {object} Decoded token claims
 */
export const decodeGoogleToken = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    // Decode payload (second part)
    const payload = parts[1];
    const decoded = JSON.parse(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    );

    return decoded;
  } catch (error) {
    console.error('Error decoding Google token:', error);
    return null;
  }
};

/**
 * Get Google User Info from Token
 * @param {string} token - Google ID token
 * @returns {object} User info
 */
export const getGoogleUserInfo = (token) => {
  const decoded = decodeGoogleToken(token);
  
  if (!decoded) {
    return null;
  }

  return {
    id: decoded.sub, // Subject (user ID)
    email: decoded.email,
    firstName: decoded.given_name,
    lastName: decoded.family_name,
    picture: decoded.picture,
    emailVerified: decoded.email_verified,
    locale: decoded.locale
  };
};

export default {
  GOOGLE_CLIENT_ID,
  initializeGoogleOAuth,
  renderGoogleSignInButton,
  signInWithGooglePopup,
  decodeGoogleToken,
  getGoogleUserInfo
};
