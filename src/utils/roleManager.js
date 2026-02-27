/**
 * Role Management Utility
 * Helper functions for managing user roles and dashboard routing
 */

/**
 * Get the primary role for dashboard routing
 * @param {Object} user - User object
 * @returns {string} - Primary role ('vendor', 'buyer', 'user', 'admin')
 */
export const getPrimaryRole = (user) => {
  if (!user) return 'user';
  
  // Use activeRole if set
  if (user.activeRole && user.activeRole !== 'user') {
    return user.activeRole;
  }
  
  // Use role if set and not 'user'
  if (user.role && user.role !== 'user') {
    return user.role;
  }
  
  // Check roles array for vendor first (highest priority)
  if (Array.isArray(user.roles) && user.roles.includes('vendor')) {
    return 'vendor';
  }
  
  // Check for buyer or user role
  if (Array.isArray(user.roles)) {
    if (user.roles.includes('buyer')) return 'buyer';
    if (user.roles.includes('user')) return 'user';
  }
  
  // Fallback to role field
  return user.role || 'user';
};

/**
 * Get the dashboard path for a given role
 * @param {string} role - Role name
 * @returns {string} - Dashboard path
 */
export const getDashboardPath = (role) => {
  switch (role) {
    case 'vendor':
      return '/vendor/dashboard';
    case 'buyer':
    case 'user':
      return '/dashboard';
    case 'admin':
      return '/admin';
    case 'investor':
      return '/investor-dashboard';
    case 'mortgage_bank':
      return '/mortgage-bank/dashboard';
    default:
      return '/dashboard';
  }
};

/**
 * Check if user can switch to a specific role
 * @param {Object} user - User object
 * @param {string} targetRole - Target role
 * @returns {boolean} - Whether user can switch to the role
 */
export const canSwitchToRole = (user, targetRole) => {
  if (!user || !Array.isArray(user.roles)) return false;
  
  // Map role aliases
  const roleMap = {
    'buyer': ['user', 'buyer'],
    'vendor': ['vendor'],
    'admin': ['admin'],
    'investor': ['investor'],
    'mortgage_bank': ['mortgage_bank']
  };
  
  const allowedRoles = roleMap[targetRole] || [targetRole];
  return user.roles.some(role => allowedRoles.includes(role));
};

/**
 * Get all available dashboard options for a user
 * @param {Object} user - User object
 * @returns {Array} - Array of available dashboard options
 */
export const getAvailableDashboards = (user) => {
  if (!user || !Array.isArray(user.roles)) return [];
  
  const dashboards = [];
  
  if (user.roles.includes('vendor')) {
    dashboards.push({
      role: 'vendor',
      name: 'Vendor Dashboard',
      path: '/vendor/dashboard',
      description: 'Manage your property listings',
      icon: 'store'
    });
  }
  
  if (user.roles.includes('buyer') || user.roles.includes('user')) {
    dashboards.push({
      role: 'buyer',
      name: 'Buyer Dashboard',
      path: '/dashboard',
      description: 'Browse and buy properties',
      icon: 'shopping-cart'
    });
  }
  
  if (user.roles.includes('admin')) {
    dashboards.push({
      role: 'admin',
      name: 'Admin Dashboard',
      path: '/admin',
      description: 'System administration',
      icon: 'cog'
    });
  }
  
  if (user.roles.includes('investor')) {
    dashboards.push({
      role: 'investor',
      name: 'Investor Dashboard',
      path: '/investor-dashboard',
      description: 'Investment portfolio',
      icon: 'chart-line'
    });
  }
  
  if (user.roles.includes('mortgage_bank')) {
    dashboards.push({
      role: 'mortgage_bank',
      name: 'Mortgage Bank Dashboard',
      path: '/mortgage-bank/dashboard',
      description: 'Mortgage services',
      icon: 'bank'
    });
  }
  
  return dashboards;
};

/**
 * Get role display name
 * @param {string} role - Role name
 * @returns {string} - Display name
 */
export const getRoleDisplayName = (role) => {
  const roleNames = {
    'vendor': 'Vendor',
    'buyer': 'Buyer',
    'user': 'User',
    'admin': 'Admin',
    'investor': 'Investor',
    'mortgage_bank': 'Mortgage Bank'
  };
  
  return roleNames[role] || role;
};

/**
 * Get role color theme
 * @param {string} role - Role name
 * @returns {Object} - Color theme object
 */
export const getRoleTheme = (role) => {
  const themes = {
    vendor: {
      primary: 'green',
      bg: 'bg-green-50',
      border: 'border-green-500',
      text: 'text-green-700',
      button: 'bg-green-500 hover:bg-green-600'
    },
    buyer: {
      primary: 'blue',
      bg: 'bg-blue-50',
      border: 'border-blue-500',
      text: 'text-blue-700',
      button: 'bg-blue-500 hover:bg-blue-600'
    },
    user: {
      primary: 'gray',
      bg: 'bg-gray-50',
      border: 'border-gray-500',
      text: 'text-gray-700',
      button: 'bg-gray-500 hover:bg-gray-600'
    },
    admin: {
      primary: 'red',
      bg: 'bg-red-50',
      border: 'border-red-500',
      text: 'text-red-700',
      button: 'bg-red-500 hover:bg-red-600'
    },
    investor: {
      primary: 'purple',
      bg: 'bg-purple-50',
      border: 'border-purple-500',
      text: 'text-purple-700',
      button: 'bg-purple-500 hover:bg-purple-600'
    },
    mortgage_bank: {
      primary: 'indigo',
      bg: 'bg-indigo-50',
      border: 'border-indigo-500',
      text: 'text-indigo-700',
      button: 'bg-indigo-500 hover:bg-indigo-600'
    }
  };
  
  return themes[role] || themes.user;
};
