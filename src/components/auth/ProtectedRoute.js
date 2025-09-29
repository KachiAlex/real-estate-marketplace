import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading, setAuthRedirect } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute: Loading:', loading, 'User:', user);

  if (loading) {
    console.log('ProtectedRoute: Still loading, showing loading screen');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('ProtectedRoute: No user found, saving intended path and redirecting to login');
    try {
      // Remember where the user wanted to go
      setAuthRedirect(location.pathname + location.search);
    } catch {}
    return <Navigate to="/login" replace />;
  }

  console.log('ProtectedRoute: User authenticated, rendering children');
  return children;
};

export default ProtectedRoute; 