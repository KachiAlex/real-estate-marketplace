import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredRoles = null }) => {
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
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // If specific roles are required, check them
  if (requiredRoles) {
    const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    const userRoles = Array.isArray(user.roles) ? user.roles : (user.role ? [user.role] : []);
    const hasRequiredRole = rolesArray.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      console.warn(
        `Access denied: User with roles [${userRoles.join(', ')}] attempted to access route requiring [${rolesArray.join(', ')}]`,
        'Path:', location.pathname
      );
      return <Navigate to="/dashboard" replace />;
    }

    return children;
  }

  // Default behavior: enforce dashboard separation by role
  const path = location.pathname.toLowerCase();
  const userRoles = Array.isArray(user.roles) ? user.roles : (user.role ? [user.role] : []);
  const isAdmin = userRoles.includes('admin');
  const isVendor = userRoles.includes('vendor');
  const isBuyer = userRoles.includes('buyer') || userRoles.length === 0;

  const isAdminRoute = path === '/admin' || path.startsWith('/admin/');
  const buyerPrefixes = ['/buyer', '/my-inquiries', '/my-inspections', '/my-properties', '/saved-properties', '/property-alerts'];
  const buyerIncludes = ['inspection', 'alerts', 'saved-properties', 'escrow'];
  const isBuyerRoute = buyerPrefixes.some((prefix) => path.startsWith(prefix)) || buyerIncludes.some((segment) => path.includes(segment));
  const isVendorRoute = path.startsWith('/vendor') || path.startsWith('/add-property');

  // Admin route access control
  if (isAdminRoute) {
    if (!isAdmin) {
      console.warn('Access denied: Non-admin user attempted admin route:', path, 'Roles:', userRoles);
      return <Navigate to="/dashboard" replace />;
    }
    return children;
  }

  // Vendor route access control
  if (isVendorRoute) {
    if (!isVendor) {
      console.warn('Access denied: Non-vendor user attempted vendor route:', path, 'Roles:', userRoles);
      return <Navigate to="/dashboard" replace />;
    }
    return children;
  }

  // Buyer route access control
  if (isBuyerRoute) {
    if (!isBuyer && !isAdmin) {
      console.warn('Access denied: User without buyer role attempted buyer route:', path, 'Roles:', userRoles);
      return <Navigate to="/dashboard" replace />;
    }
    return children;
  }

  // Block admin from accessing buyer/vendor dashboards
  if (isAdmin && (isBuyerRoute || isVendorRoute)) {
    console.warn('Admin user blocked from buyer/vendor route:', path);
    return <Navigate to="/admin" replace />;
  }

  return children;
};

export default ProtectedRoute;