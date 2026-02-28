import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
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
    // Redirect to the sign-in modal route so header/menu remain visible
    return <Navigate to="/auth/login" replace />;
  }

  const path = location.pathname.toLowerCase();
  const isAdmin = user?.role === 'admin' || user?.roles?.includes('admin');
  const isAdminRoute = path === '/admin' || path.startsWith('/admin/');
  const buyerPrefixes = ['/buyer', '/my-inquiries', '/my-inspections', '/my-properties'];
  const buyerIncludes = ['inspection', 'alerts', 'saved-properties'];
  const isBuyerRoute = buyerPrefixes.some((prefix) => path.startsWith(prefix)) || buyerIncludes.some((segment) => path.includes(segment));
  const isVendorRoute = path.startsWith('/vendor');

  // Block non-admin users from admin pages
  if (isAdminRoute && !isAdmin) {
    console.warn('Access denied: Non-admin user attempted to access admin route:', location.pathname, 'User role:', user?.role);
    return <Navigate to="/dashboard" replace />;
  }

  // Block admin users from buyer/vendor areas
  if (isAdmin && (isBuyerRoute || isVendorRoute)) {
    console.warn('Admin user blocked from buyer/vendor route:', location.pathname);
    return <Navigate to="/admin" replace />;
  }

  return children;
};

export default ProtectedRoute;