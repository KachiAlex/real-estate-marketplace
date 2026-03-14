import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

/**
 * Custom hook to guard protected routes/actions
 * Checks if user is authenticated and redirects to login if not
 * 
 * @returns {function} checkAuthAndRedirect - Function that checks auth status
 * 
 * Usage:
 * const checkAuthAndRedirect = useAuthGuard();
 * if (!checkAuthAndRedirect('perform action')) {
 *   return;
 * }
 * // Continue with protected action
 */
export const useAuthGuard = () => {
  const { user, setAuthRedirect } = useAuth();
  const navigate = useNavigate();

  const checkAuthAndRedirect = useCallback((actionName) => {
    if (!user || !user.id) {
      // Save the current location as redirect URL
      setAuthRedirect(window.location.pathname + window.location.search);
      
      // Show message and redirect to login
      toast.error(`Please sign in to ${actionName}`);
      navigate('/auth/login', { 
        state: { from: window.location.pathname }
      });
      return false;
    }
    return true;
  }, [user, navigate, setAuthRedirect]);

  return checkAuthAndRedirect;
};

export default useAuthGuard;
