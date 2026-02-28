const normalizeRoles = (user) => {
  if (!user) return [];
  const fromArray = Array.isArray(user.roles) ? user.roles : [];
  const inferred = [user.role, user.userType, user.activeRole].filter(Boolean);
  return Array.from(new Set([...fromArray, ...inferred])).map((r) => String(r).toLowerCase());
};

const hasRole = (user, role) => normalizeRoles(user).includes(String(role).toLowerCase());

export const getPostLoginRoute = (user) => {
  if (!user) return '/dashboard';

  if (hasRole(user, 'admin')) {
    return '/admin';
  }

  if (hasRole(user, 'vendor')) {
    return '/vendor/dashboard';
  }

  return '/dashboard';
};

export default getPostLoginRoute;
