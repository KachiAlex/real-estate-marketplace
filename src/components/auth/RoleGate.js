import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * RoleGate - Enforces role-based access control for routes
 * @param {React.ReactNode} children - Component to render if access is granted
 * @param {string|string[]} requiredRoles - Role(s) required to access this route
 * @param {string} fallbackPath - Path to redirect to if access is denied (default: '/dashboard')
 */
const RoleGate = ({ children, requiredRoles = [], fallbackPath = '/dashboard' }) => {
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

  // Not authenticated
  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // No role requirements specified - allow access
  if (!requiredRoles || requiredRoles.length === 0) {
    return children;
  }

  // Normalize requiredRoles to array
  const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  // Get user roles (handle both single role and array of roles)
  const userRoles = Array.isArray(user.roles) ? user.roles : (user.role ? [user.role] : []);

  // Check if user has any of the required roles
  const hasRequiredRole = rolesArray.some(role => userRoles.includes(role));

  if (!hasRequiredRole) {
    console.warn(
      `Access denied: User with roles [${userRoles.join(', ')}] attempted to access route requiring [${rolesArray.join(', ')}]`,
      'Redirecting to:', fallbackPath
    );
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
};

export default RoleGate;
