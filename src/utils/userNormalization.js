/**
 * User Normalization Utility
 * Handles normalizing user data from various sources
 */

const normalizeUser = (u, preserveIdentity = null) => {
  if (!u) return u;
  const roles = u.roles || (u.role ? [u.role] : (u.userType ? [u.userType] : []));
  // Ensure roles is an array of lowercased, trimmed values
  let normRoles = Array.isArray(roles) ? roles.map(r => String(r).trim().toLowerCase()).filter(Boolean) : [];
  
  // Determine activeRole from incoming data
  let activeRole = u.activeRole ? String(u.activeRole).trim().toLowerCase() : null;
  
  
  // Only apply defaults if no activeRole was found anywhere
  if (!activeRole) {
    if (u.role) {
      activeRole = String(u.role).trim().toLowerCase();
    } else if (u.userType) {
      activeRole = String(u.userType).trim().toLowerCase();
    } else {
      activeRole = normRoles[0] || 'user';
    }
  }

  // Ensure activeRole is in roles array
  const finalRoles = [...new Set([...normRoles, activeRole].filter(Boolean))];
  
  // Convert lowercase firstname/lastname to camelCase firstName/lastName
  const normalized = { 
    ...u, 
    firstName: u.firstName || u.firstname,
    lastName: u.lastName || u.lastname,
    roles: finalRoles, 
    activeRole 
  };

  // If preserveIdentity is provided, merge the new data with the preserved identity
  // This ensures that core identity fields (id, email, firstName, lastName) are never overwritten
  if (preserveIdentity) {
    return {
      ...normalized,
      id: preserveIdentity.id,
      email: preserveIdentity.email,
      firstName: preserveIdentity.firstName,
      lastName: preserveIdentity.lastName
    };
  }

  return normalized;
};

module.exports = { normalizeUser };
