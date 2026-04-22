import React from 'react';
import { useAuth } from '../../contexts/AuthContext-new';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import getPostLoginRoute from '../../utils/getPostLoginRoute';
import GoogleAuthButton from './GoogleAuthButton';

/**
 * GoogleSignInButton Component
 * Handles Google OAuth sign-in flow using AuthContext-new
 */
const GoogleSignInButton = ({ onClose, disabled = false }) => {
  const { signInWithGoogle, loading } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      const user = await signInWithGoogle();

      // Navigate to appropriate dashboard
      const redirect = sessionStorage.getItem('authRedirect');
      if (redirect) {
        sessionStorage.removeItem('authRedirect');
        navigate(redirect, { replace: true });
      } else {
        navigate(getPostLoginRoute(user), { replace: true });
      }

      if (onClose) onClose();
    } catch (error) {
      console.error('Google sign-in error:', error);
      // Error is already handled by signInWithGoogle with toast
    }
  };

  return (
    <GoogleAuthButton
      label="Continue with Google"
      onClick={handleGoogleSignIn}
      disabled={disabled || loading}
    />
  );
};

export default GoogleSignInButton;
