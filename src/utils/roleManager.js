/**
 * Role Management Utility
 * Helper functions for managing user roles and dashboard routing
 */

const ROLE_ALIAS = {
  buyer: 'buyer',
  user: 'buyer',
  vendor: 'vendor',
  admin: 'admin',
  investor: 'investor',
  mortgage_bank: 'mortgage_bank'
};

const ROLE_SWITCH_VALUE = {
  buyer: 'user',
  vendor: 'vendor',
  admin: 'admin',
  investor: 'investor',
  mortgage_bank: 'mortgage_bank'
};

const normalizeRoleKey = (role) => {
  if (!role) return null;
  const normalized = String(role).trim().toLowerCase();
  return ROLE_ALIAS[normalized] || normalized;
};

const getCanonicalRoles = (user) => {
  if (!user) return [];
  const baseRoles = Array.isArray(user.roles) ? user.roles : [];
  const extras = [user.role, user.activeRole, user.userType].filter(Boolean);
  return Array.from(new Set([...baseRoles, ...extras]
    .map(normalizeRoleKey)
    .filter(Boolean)));
};

export const getSwitchRoleValue = (role) => ROLE_SWITCH_VALUE[role] || role;

/**
 * Get the primary role for dashboard routing
 * @param {Object} user - User object
 * @returns {string} - Primary canonical role ('vendor', 'buyer', 'admin', ...)
 */
export const getPrimaryRole = (user) => {
  if (!user) return 'buyer';

  const prioritySources = [user.activeRole, user.role, user.userType];
  for (const source of prioritySources) {
    const canonical = normalizeRoleKey(source);
    if (canonical) return canonical;
  }

  const roles = getCanonicalRoles(user);
  if (roles.includes('vendor')) return 'vendor';
  if (roles.includes('buyer')) return 'buyer';

  return roles[0] || 'buyer';
};

/**
 * Get the dashboard path for a given role
 * @param {string} role - Role name
 * @returns {string} - Dashboard path
 */
export const getDashboardPath = (role) => {
  const canonicalRole = normalizeRoleKey(role) || 'buyer';
  switch (canonicalRole) {
    case 'vendor':
      return '/vendor/dashboard';
    case 'buyer':
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
  const canonical = normalizeRoleKey(targetRole);
  if (!user || !canonical) return false;
  const userRoles = getCanonicalRoles(user);
  return userRoles.includes(canonical);
};

/**
 * Get all available dashboard options for a user
 * @param {Object} user - User object
 * @returns {Array} - Array of available dashboard options
 */
export const getAvailableDashboards = (user) => {
  const roles = getCanonicalRoles(user);
  if (!roles.length) return [];

  const dashboards = [];

  if (roles.includes('buyer')) {
    dashboards.push({
      role: 'buyer',
      name: 'Buyer Dashboard',
      path: '/dashboard',
      description: 'Browse and buy properties',
      icon: 'shopping-cart',
      switchValue: getSwitchRoleValue('buyer')
    });
  }

  if (roles.includes('vendor')) {
    dashboards.push({
      role: 'vendor',
      name: 'Vendor Dashboard',
      path: '/vendor/dashboard',
      description: 'Manage your property listings',
      icon: 'store',
      switchValue: getSwitchRoleValue('vendor')
    });
  }

  if (roles.includes('admin')) {
    dashboards.push({
      role: 'admin',
      name: 'Admin Dashboard',
      path: '/admin',
      description: 'System administration',
      icon: 'cog',
      switchValue: getSwitchRoleValue('admin')
    });
  }

  if (roles.includes('investor')) {
    dashboards.push({
      role: 'investor',
      name: 'Investor Dashboard',
      path: '/investor-dashboard',
      description: 'Investment portfolio',
      icon: 'chart-line',
      switchValue: getSwitchRoleValue('investor')
    });
  }

  if (roles.includes('mortgage_bank')) {
    dashboards.push({
      role: 'mortgage_bank',
      name: 'Mortgage Bank Dashboard',
      path: '/mortgage-bank/dashboard',
      description: 'Mortgage services',
      icon: 'bank',
      switchValue: getSwitchRoleValue('mortgage_bank')
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
  const canonical = normalizeRoleKey(role);
  const roleNames = {
    vendor: 'Vendor',
    buyer: 'Buyer',
    admin: 'Admin',
    investor: 'Investor',
    mortgage_bank: 'Mortgage Bank'
  };
  return roleNames[canonical] || (canonical || role);
};

/**
 * Get role color theme
 * @param {string} role - Role name
 * @returns {Object} - Color theme object
 */
export const getRoleTheme = (role) => {
  const canonical = normalizeRoleKey(role) || 'buyer';
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
  
  return themes[canonical] || themes.buyer;
};
