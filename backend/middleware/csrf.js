/**
 * CSRF Protection Middleware Wrapper
 * 
 * Integrates csurf middleware with SPA support.
 * - Token stored in secure HTTP-only cookie
 * - Token sent via X-CSRF-Token header in requests
 * - GET requests are SAFE and don't need tokens
 * - State-changing requests (POST/PUT/DELETE/PATCH) require valid token
 * 
 * Usage:
 *   const { csrfProtection, csrfTokenEndpoint } = require('./middleware/csrf');
 *   
 *   // Add to server before routes
 *   app.use(cookieParser());
 *   app.use(csrfProtection);
 *   
 *   // Endpoint for frontend to get initial token
 *   app.get('/api/csrf-token', csrfTokenEndpoint);
 *   
 *   // Protected routes automatically use CSRF
 *   app.post('/api/users', csrfProtection, (req, res) => {...});
 */

const csurf = require('csurf');
const cookieParser = require('cookie-parser');

// ============================================================================
// CSRF Token Configuration
// ============================================================================

// Initialize csurf with cookie-based token storage
const csrfProtection = csurf({
  cookie: {
    httpOnly: true,           // Prevent access from JavaScript (XSS protection)
    secure: process.env.NODE_ENV === 'production', // HTTPS-only in production
    sameSite: 'strict',        // Prevent CSRF from cross-site cookies
    maxAge: 3600000            // Token valid for 1 hour
  }
});

// ============================================================================
// CSRF Token Endpoint
// ============================================================================

/**
 * GET /api/csrf-token
 * 
 * Returns CSRF token for SPA to use in requests.
 * Frontend should:
 * 1. Call this endpoint in app initialization
 * 2. Store returned token in memory (not localStorage/sessionStorage for security)
 * 3. Include token in X-CSRF-Token header for all state-changing requests
 * 
 * Response: { token: "..." }
 */
const csrfTokenEndpoint = (req, res) => {
  // Generate and send token
  res.status(200).json({
    token: req.csrfToken()
  });
};

// ============================================================================
// CSRF Error Handler (middleware)
// ============================================================================

/**
 * Express error handler for CSRF failures
 * 
 * If a CSRF token is missing or invalid, returns:
 * - Status: 403 Forbidden
 * - Body: { error: "CSRF token validation failed" }
 * 
 * Usage: app.use(this handler after all routes)
 */
const csrfErrorHandler = (err, req, res, next) => {
  // Check if error is CSRF-related
  if (err.code === 'EBADCSRFTOKEN') {
    // Token is missing or invalid
    res.status(403).json({
      error: 'CSRF token validation failed',
      message: 'Missing or invalid CSRF token. Please provide a valid X-CSRF-Token header.',
      details: {
        code: 'EBADCSRFTOKEN',
        method: req.method,
        path: req.path
      }
    });
    
    // Log CSRF violation for security audit
    console.warn(`🔒 [CSRF] Invalid token for ${req.method} ${req.path} from ${req.ip}`);
    return;
  }

  // If not CSRF error, pass to next handler
  next(err);
};

// ============================================================================
// Exception Handler for CSRF
// ============================================================================

/**
 * Determine which routes SHOULD NOT require CSRF protection
 * 
 * Safe exceptions:
 * - GET requests (query-only, no state change)
 * - OPTIONS requests (CORS preflight)
 * - Public endpoints (auth, health checks)
 * - File uploads (handled by separate middleware)
 */
const shouldSkipCsrf = (req) => {
  // Skip CSRF protection in test mode - tests shouldn't need to handle CSRF tokens
  if (process.env.NODE_ENV === 'test') {
    return true;
  }

  // OPTIONS and HEAD are safe - skip CSRF. 
  // GET must NOT be skipped: csurf needs to run on GET to attach req.csrfToken()
  // and set the CSRF cookie. csurf internally only validates state-changing methods.
  if (req.method === 'OPTIONS' || req.method === 'HEAD') {
    return true;
  }

  // Public endpoints that don't modify state
  const publicPaths = [
    '/api/auth/register',      // New user registration
    '/api/auth/login',         // User login
    '/api/auth/forgot-password', // Password reset request
    '/api/auth/reset-password', // Password reset confirmation
    '/api/health',             // Health check
    '/api/config',             // Static config
    '/uploads'                 // Serving static files
  ];

  // Check if path matches public list
  if (publicPaths.some(path => req.path.startsWith(path))) {
    return true;
  }

  return false;
};

// ============================================================================
// Conditional CSRF Protection Middleware
// ============================================================================

/**
 * Wrapper that applies CSRF protection only to routes that need it
 * 
 * Skips CSRF check for:
 * - GET, HEAD, OPTIONS requests
 * - Public authentication endpoints
 * - Health/config endpoints
 */
const csrfProtectionConditional = (req, res, next) => {
  if (shouldSkipCsrf(req)) {
    // Skip CSRF for this request
    return next();
  }

  // Debug: log CSRF-related headers and cookies for POST/PUT/DELETE/PATCH
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    console.log('🔒 [CSRF-DEBUG]', req.method, req.path, {
      hasXCsrfHeader: !!req.headers['x-csrf-token'],
      xCsrfToken: req.headers['x-csrf-token'] ? req.headers['x-csrf-token'].substring(0, 10) + '...' : 'MISSING',
      cookieHeader: req.headers.cookie ? req.headers.cookie.substring(0, 100) : 'MISSING',
      hasCsrfCookie: !!(req.cookies && req.cookies._csrf),
      csrfCookieValue: req.cookies && req.cookies._csrf ? req.cookies._csrf.substring(0, 10) + '...' : 'MISSING'
    });
  }

  // Apply CSRF protection
  csrfProtection(req, res, next);
};

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  csrfProtection,              // Middleware (applies CSRF check)
  csrfProtectionConditional,   // Conditional middleware (smart skip logic)
  csrfTokenEndpoint,           // Endpoint to get token
  csrfErrorHandler             // Error handler for CSRF failures
};
