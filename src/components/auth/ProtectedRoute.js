import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading, setAuthRedirect } = useAuth();
  const location = useLocation();

  if (loading) {
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
    try {
      // Remember where the user wanted to go
      setAuthRedirect(location.pathname + location.search);
    } catch {}
    return <Navigate to="/login" replace />;
  }

  const isAdmin = user?.role === 'admin' || user?.roles?.includes('admin');
  const isAdminRoute = location.pathname.startsWith('/admin');

  if (isAdmin && !isAdminRoute) {
    return <Navigate to="/admin" replace />;
  }

  if (!isAdmin && isAdminRoute) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;