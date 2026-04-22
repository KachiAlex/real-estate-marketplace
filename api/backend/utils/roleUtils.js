const DEFAULT_PRECEDENCE = ['vendor', 'agent', 'user'];

function normalizeRoles(input) {
  let roles = [];
  if (!input) return ['user'];
  if (Array.isArray(input)) roles = input.slice(); else roles = [String(input)];
  roles = roles.map(r => String(r).trim().toLowerCase()).filter(Boolean);
  // always include user
  if (!roles.includes('user')) roles.push('user');
  // dedupe preserving order
  roles = Array.from(new Set(roles));
  return roles;
}

function chooseActiveRole(existingActive, requestedRole, roles = [], precedence = DEFAULT_PRECEDENCE) {
  // If requestedRole provided and is in roles, prefer it
  if (requestedRole) {
    const rr = String(requestedRole).trim().toLowerCase();
    if (roles.includes(rr)) return rr;
  }
  // If existingActive still present in roles, keep it
  if (existingActive && roles.includes(String(existingActive).trim().toLowerCase())) return existingActive;
  // Otherwise pick highest-precedence role present
  for (const p of precedence) {
    if (roles.includes(p)) return p;
  }
  // fallback to first role
  return roles[0] || 'user';
}

module.exports = {
  normalizeRoles,
  chooseActiveRole,
  DEFAULT_PRECEDENCE
};
