import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import getPostLoginRoute from '../../utils/getPostLoginRoute';
import { getApiUrl } from '../../utils/apiConfig';

/**
 * GoogleSignInButton Component
 * Handles Google OAuth sign-in flow
 */
const GoogleSignInButton = ({ onClose, disabled = false }) => {
  const { setUser, setAccessToken, setRefreshToken } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const { credential } = credentialResponse;

      // Send authorization code to backend
      const response = await fetch(getApiUrl('/api/auth/google'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: credential
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Google authentication failed');
      }

      const data = await response.json();

      if (data.success && data.data) {
        const { user, accessToken, refreshToken } = data.data;

        // Store tokens
        localStorage.setItem('accessToken', accessToken);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }

        // Update auth context
        setUser(user);
        setAccessToken(accessToken);
        if (refreshToken) {
          setRefreshToken(refreshToken);
        }

        toast.success('Welcome!');

        // Navigate to appropriate dashboard
        const redirect = sessionStorage.getItem('authRedirect');
        if (redirect) {
          sessionStorage.removeItem('authRedirect');
          navigate(redirect, { replace: true });
        } else {
          navigate(getPostLoginRoute(user), { replace: true });
        }

        if (onClose) onClose();
      } else {
        throw new Error(data.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast.error(error.message || 'Failed to sign in with Google');
    }
  };

  const handleGoogleError = () => {
    toast.error('Failed to sign in with Google');
  };

  return (
    <div className="w-full">
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        disabled={disabled}
        theme="dark"
        size="large"
        width="100%"
      />
    </div>
  );
};

export default GoogleSignInButton;
