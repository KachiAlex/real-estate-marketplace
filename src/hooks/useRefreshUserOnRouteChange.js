import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook to refresh user data whenever the route changes
 * This prevents stale user data from being displayed when navigating between pages
 * Fixes issue where user profile changes when visiting different dashboards
 */
export const useRefreshUserOnRouteChange = () => {
  const location = useLocation();
  const { refreshCurrentUser, user, accessToken } = useAuth();
  const lastPathRef = useRef(null);

  useEffect(() => {
    // Only refresh if user is authenticated and path actually changed
    if (!user || !accessToken) return;
    if (lastPathRef.current === location.pathname) return;

    lastPathRef.current = location.pathname;

    // Refresh user data on route change
    const refreshUser = async () => {
      try {
        console.log('🔄 Refreshing user data on route change:', location.pathname);
        await refreshCurrentUser();
      } catch (error) {
        console.warn('Failed to refresh user on route change:', error);
      }
    };

    refreshUser();
  }, [location.pathname, user, accessToken, refreshCurrentUser]);
};

export default useRefreshUserOnRouteChange;
