/**
 * Centralized Authentication Flow Service
 * Handles all sign-in flows consistently across the application
 */

import toast from 'react-hot-toast';

/**
 * Handle post-authentication flow
 * Centralizes role selection, redirects, and navigation logic
 */
export const handlePostAuth = (result, navigate, setLoggedInUser, setShowRoleSelection) => {
  if (!result || !result.success) {
    return { handled: false, error: result?.message || 'Authentication failed' };
  }

  const { user, redirectUrl } = result;

  // Check if user is admin - redirect directly to admin dashboard
  if (user && user.role === 'admin') {
    const next = redirectUrl || '/admin';
    navigate(next, { replace: true });
    return { handled: true, redirect: next };
  }

  // Check if user is mortgage bank - redirect directly to mortgage bank dashboard
  if (user && user.role === 'mortgage_bank') {
    const next = redirectUrl || '/mortgage-bank/dashboard';
    navigate(next, { replace: true });
    return { handled: true, redirect: next };
  }

  // Check if user has multiple roles (but not admin) - show role selection
  if (user && user.roles && user.roles.length > 1) {
    if (setLoggedInUser && setShowRoleSelection) {
      setLoggedInUser(user);
      setShowRoleSelection(true);
      return { handled: true, showRoleSelection: true };
    }
  }

  // Single role or no roles, proceed with normal redirect
  const defaultPath = redirectUrl || '/dashboard';
  navigate(defaultPath, { replace: true });
  return { handled: true, redirect: defaultPath };
};

/**
 * Handle role selection after authentication
 * Centralizes role switching and navigation
 */
export const handleRoleSelection = async (
  selectedRole,
  loggedInUser,
  setUser,
  switchRole,
  navigate,
  setShowRoleSelection
) => {
  try {
    // Update the user's active role locally first
    const updatedUser = { ...loggedInUser, activeRole: selectedRole };

    // Update localStorage
    localStorage.setItem('activeRole', selectedRole);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));

    // Update AuthContext state
    if (setUser) {
      setUser(updatedUser);
    }

    // Use switchRole if available for additional processing
    if (switchRole) {
      await switchRole(selectedRole);
    }

    // Show success message
    toast.success(`Switched to ${selectedRole} dashboard`);

    // Close the modal if callback provided
    if (setShowRoleSelection) {
      setShowRoleSelection(false);
    }

    // Navigate to appropriate dashboard
    let dashboardPath;
    switch (selectedRole) {
      case 'admin':
        dashboardPath = '/admin';
        break;
      case 'mortgage_bank':
        dashboardPath = '/mortgage-bank/dashboard';
        break;
      case 'vendor':
        dashboardPath = '/vendor/dashboard';
        break;
      case 'buyer':
      default:
        dashboardPath = '/dashboard';
        break;
    }

    // Use setTimeout to ensure state updates are processed
    setTimeout(() => {
      navigate(dashboardPath, { replace: true });
    }, 100);

    return { success: true, dashboardPath };
  } catch (error) {
    console.error('Error in role selection:', error);
    toast.error('Failed to switch role');
    return { success: false, error: error.message };
  }
};

/**
 * Handle email/password authentication
 * Centralizes validation and authentication flow
 */
export const handleEmailPasswordAuth = async (
  email,
  password,
  login,
  navigate,
  setLoggedInUser,
  setShowRoleSelection,
  validateForm
) => {
  // Note: validateForm should be called before this function
  // This is just a safety check, but validation should happen in the component
  if (validateForm && !validateForm()) {
    return { handled: false, success: false, error: 'Validation failed' };
  }

  try {
    const result = await login(email, password);
    const postAuthResult = handlePostAuth(result, navigate, setLoggedInUser, setShowRoleSelection);
    return {
      ...postAuthResult,
      success: postAuthResult.handled
    };
  } catch (error) {
    console.error('Email/password authentication error:', error);
    return { handled: false, success: false, error: error.message || 'Authentication failed' };
  }
};

/**
 * Handle Google authentication
 * Centralizes Google sign-in flow
 */
export const handleGoogleAuth = async (
  signInWithGoogle,
  navigate,
  setLoggedInUser,
  setShowRoleSelection
) => {
  try {
    const result = await signInWithGoogle();
    
    // Check if redirect is in progress (popup was blocked, using redirect flow)
    if (result.redirecting) {
      // The redirect flow will handle the rest
      return { handled: true, success: true, redirecting: true };
    }

    const postAuthResult = handlePostAuth(result, navigate, setLoggedInUser, setShowRoleSelection);
    return {
      ...postAuthResult,
      success: postAuthResult.handled
    };
  } catch (error) {
    console.error('Google authentication error:', error);
    
    // Handle specific Google auth errors
    if (error.code === 'auth/popup-blocked') {
      toast.error('Popup was blocked. Please allow popups and try again.');
    } else if (error.code === 'auth/popup-closed-by-user') {
      // User closed popup, don't show error
      return { handled: false, success: false, cancelled: true };
    } else {
      toast.error(error.message || 'Failed to sign in with Google');
    }
    
    return { handled: false, success: false, error: error.message || 'Google authentication failed' };
  }
};

/**
 * Get default redirect path based on user role
 */
export const getDefaultRedirectPath = (user, redirectUrl) => {
  if (redirectUrl) {
    return redirectUrl;
  }

  if (!user) {
    return '/dashboard';
  }

  if (user.role === 'admin') {
    return '/admin';
  }

  if (user.role === 'mortgage_bank') {
    return '/mortgage-bank/dashboard';
  }

  if (user.activeRole === 'vendor') {
    return '/vendor/dashboard';
  }

  if (user.activeRole === 'buyer') {
    return '/dashboard';
  }

  // Default fallback
  return '/dashboard';
};

