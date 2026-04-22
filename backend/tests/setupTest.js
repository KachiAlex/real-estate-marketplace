// Test bootstrap: override auth middleware with test-friendly mocks and
// set environment flags to disable background services that create open handles.

// SET TEST ENVIRONMENT FIRST - Before any modules load
process.env.NODE_ENV = 'test';
process.env.ALLOW_MOCK_AUTH = 'true';
process.env.DISABLE_SCHEDULER = 'true';
process.env.DISABLE_EMAIL = 'true';
process.env.DISABLE_SOCKETS = 'true';
process.env.SKIP_DB_INIT = 'true';
process.env.SKIP_SEQUELIZE_INIT = 'true';

const path = require('path');

const TEST_USER_ID_BY_EMAIL = {
  'admin@propertyark.com': '00000000-0000-4000-8000-000000000001',
  'vendor1@example.com': '00000000-0000-4000-8000-000000000002',
  'onyedika.akoma@gmail.com': '00000000-0000-4000-8000-000000000003',
};

const DEFAULT_TEST_USER_ID = '00000000-0000-4000-8000-000000000001';

function withStableTestUser(user, fallbackEmail = 'admin@propertyark.com') {
  const safeUser = { ...(user || {}) };
  const email = (safeUser.email || fallbackEmail || '').toLowerCase();
  const stableId = TEST_USER_ID_BY_EMAIL[email] || DEFAULT_TEST_USER_ID;
  safeUser.id = stableId;
  safeUser._id = stableId;
  return safeUser;
}

try {
  const authModulePath = path.resolve(__dirname, '..', 'middleware', 'auth.js');
  // Ensure module is not cached (we will replace/patch it before server loads)
  try { delete require.cache[require.resolve(authModulePath)]; } catch (e) {}

  // Create mock implementations used during tests
  const mockAuth = {
    protect: (req, res, next) => {
      try {
        const mockUsers = require('../data/mockUsers');
        const headerEmail = (req.headers && (req.headers['x-mock-user-email'] || req.headers['x-mock-user'])) || 'admin@propertyark.com';
        const user = mockUsers.find(u => u.email && u.email.toLowerCase() === headerEmail.toLowerCase()) || mockUsers[0];
        const sanitized = withStableTestUser(user, headerEmail);
        delete sanitized.password;
        req.user = sanitized;
      } catch (err) {
        req.user = { id: DEFAULT_TEST_USER_ID, _id: DEFAULT_TEST_USER_ID, email: 'admin@propertyark.com', role: 'admin', roles: ['admin'] };
      }
      return next();
    },
    authorize: (...roles) => (req, res, next) => next(),
    optionalAuth: (req, res, next) => {
      try {
        const mockUsers = require('../data/mockUsers');
        const headerEmail = (req.headers && (req.headers['x-mock-user-email'] || req.headers['x-mock-user'])) || 'admin@propertyark.com';
        const user = mockUsers.find(u => u.email && u.email.toLowerCase() === headerEmail.toLowerCase()) || mockUsers[0];
        req.user = withStableTestUser(user, headerEmail);
      } catch (err) {
        req.user = null;
      }
      return next();
    },
    authenticateJWT: (req, res, next) => { req.user = { id: DEFAULT_TEST_USER_ID, _id: DEFAULT_TEST_USER_ID, email: 'admin@propertyark.com', role: 'admin', roles: ['admin'] }; return next(); },
    authorizeRole: (...roles) => (req, res, next) => next(),
    // compatibility aliases
    authenticateToken: (req, res, next) => {
      try {
        const mockUsers = require('../data/mockUsers');
        const headerEmail = (req.headers && (req.headers['x-mock-user-email'] || req.headers['x-mock-user'])) || 'admin@propertyark.com';
        const user = mockUsers.find(u => u.email && u.email.toLowerCase() === headerEmail.toLowerCase()) || mockUsers[0];
        const sanitized = withStableTestUser(user, headerEmail);
        delete sanitized.password;
        req.user = sanitized;
      } catch (err) {
        req.user = { id: DEFAULT_TEST_USER_ID, _id: DEFAULT_TEST_USER_ID, email: 'admin@propertyark.com', role: 'admin', roles: ['admin'] };
      }
      return next();
    },
    requireAdmin: (req, res, next) => next()
  };

  // Load (or create) the auth module in cache and patch its exports
  let authModule;
  try {
    authModule = require(authModulePath);
    Object.assign(authModule, mockAuth);
  } catch (e) {
    // If the real module can't be required for some reason, register a fake module in cache
    const Module = require('module');
    const m = new Module(authModulePath, module.parent);
    m.filename = authModulePath;
    m.paths = Module._nodeModulePaths(path.dirname(authModulePath));
    m._compile('module.exports = {}', authModulePath);
    m.exports = mockAuth;
    require.cache[authModulePath] = m;
  }
} catch (err) {
  // If anything fails here, log and continue so tests can still run and fail clearly
  // but we don't want to crash the test runner during bootstrap.
  // eslint-disable-next-line no-console
  console.warn('setupTest bootstrap warning:', err && err.message ? err.message : err);
}
