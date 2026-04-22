/**
 * Phase 2.5: Comprehensive request logging middleware
 * Logs all API requests with:
 * - Timestamp
 * - HTTP method and path
 * - Authenticated user ID (if available)
 * - Response status code
 * - Response time
 * - Request/response sizes
 * 
 * Special handling for:
 * - Authentication events (login, register, password reset, etc.)
 * - Payment operations (initialize, verify, refund)
 * - Sensitive operations (password changes, email updates)
 */

const fs = require('fs');
const path = require('path');

/**
 * List of endpoints to exclude from request logging
 * (typically health checks, status endpoints, static files)
 */
const EXCLUDED_PATHS = [
  /^\/health$/,
  /^\/status$/,
  /^\/favicon\.ico$/,
  /^\/\.well-known/,
  /^\/static\//,
  /^\/uploads\//
];

/**
 * Check if a path should be excluded from logging
 */
const shouldExcludePath = (path) => {
  return EXCLUDED_PATHS.some(pattern => pattern.test(path));
};

/**
 * Determine if a request is for an authentication operation
 */
const isAuthOperation = (method, path) => {
  const authPaths = [
    '/api/auth/register',
    '/api/auth/login',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/verify-email',
    '/api/auth/password',
    '/api/auth/sync-password',
    '/api/auth/logout'
  ];
  
  return method && authPaths.some(p => path && path.includes(p));
};

/**
 * Determine if a request is for a payment operation
 */
const isPaymentOperation = (method, path) => {
  const paymentPaths = [
    '/api/payments/initialize',
    '/api/payments/',  // Catch all payment paths
    '/api/escrow'
  ];
  
  return method && paymentPaths.some(p => path && path.includes(p));
};

/**
 * Sanitize request body for logging (remove sensitive fields)
 */
const sanitizeBody = (body) => {
  if (!body || typeof body !== 'object') return body;
  
  const sanitized = { ...body };
  const sensitiveFields = [
    'password',
    'token',
    'refreshToken',
    'apiKey',
    'secret',
    'creditCard',
    'cardNumber',
    'cvv',
    'ssn',
    'bankAccount'
  ];
  
  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

/**
 * Create the request logging middleware
 */
const createRequestLogger = () => {
  return (req, res, next) => {
    // Skip excluded paths
    if (shouldExcludePath(req.path)) {
      return next();
    }

    // Record start time for response time calculation
    const startTime = process.hrtime.bigint();
    const startDate = new Date();

    // Store the original json method to capture response body later
    const originalJson = res.json;
    let responseBody = null;

    // Override res.json to capture response data
    res.json = function(data) {
      responseBody = data;
      return originalJson.call(this, data);
    };

    // Hook into res.on('finish') to log after response is sent
    res.on('finish', () => {
      // Calculate response time in milliseconds
      const endTime = process.hrtime.bigint();
      const responseTimeMs = Number(endTime - startTime) / 1_000_000;

      // Build log entry
      const logEntry = {
        timestamp: startDate.toISOString(),
        method: req.method,
        path: req.path,
        url: req.originalUrl,
        statusCode: res.statusCode,
        responseTime: `${responseTimeMs.toFixed(2)}ms`,
        userId: req.user?.id || null,
        userEmail: req.user?.email || null,
        userRole: req.user?.role || null,
        userAgent: req.get('user-agent'),
        remoteAddr: req.ip || req.connection.remoteAddress,
        requestSize: req.get('content-length') || 0,
        responseSize: res.get('content-length') || 0
      };

      // Add special logging for authentication operations
      if (isAuthOperation(req.method, req.path)) {
        logEntry.operationType = 'AUTH';
        logEntry.authAction = req.path.split('/').pop();
        logEntry.email = req.body?.email || null;
        
        // Log success/failure for auth operations
        if (res.statusCode >= 200 && res.statusCode < 300) {
          logEntry.result = 'SUCCESS';
        } else if (res.statusCode === 401 || res.statusCode === 403) {
          logEntry.result = 'UNAUTHORIZED';
        } else if (res.statusCode === 400) {
          logEntry.result = 'INVALID_INPUT';
        } else {
          logEntry.result = 'FAILED';
        }
      }

      // Add special logging for payment operations
      if (isPaymentOperation(req.method, req.path)) {
        logEntry.operationType = 'PAYMENT';
        logEntry.paymentAction = req.path.split('/').pop();
        logEntry.paymentAmount = req.body?.amount || null;
        logEntry.transactionId = req.body?.reference || responseBody?.transactionId || null;
        
        // Log payment operation results
        if (res.statusCode >= 200 && res.statusCode < 300) {
          logEntry.paymentStatus = 'SUCCESS';
        } else {
          logEntry.paymentStatus = 'FAILED';
          logEntry.errorMessage = responseBody?.message || 'Payment processing failed';
        }
      }

      // Log password-sensitive operations
      if (req.path.includes('/password') || req.path.includes('/email')) {
        logEntry.sensitiveOperation = true;
      }

      // Write to console (will be captured by log aggregation services in production)
      if (process.env.NODE_ENV === 'production') {
        // In production, log as JSON for machine parsing
        console.log(JSON.stringify(logEntry));
      } else {
        // In development, use formatted output for readability
        const statusEmoji = res.statusCode >= 400 ? '❌' : '✅';
        console.log(
          `${statusEmoji} [${logEntry.timestamp}] ${logEntry.method} ${logEntry.path} - ` +
          `Status: ${logEntry.statusCode} - Time: ${logEntry.responseTime} - ` +
          `User: ${logEntry.userId || 'anonymous'}`
        );
      }

      // Write to request.log file in development and production
      try {
        const logPath = path.resolve(__dirname, '..', 'request.log');
        
        // Write CSV format for easy analysis
        const csvLine = [
          logEntry.timestamp,
          logEntry.method,
          logEntry.path,
          logEntry.statusCode,
          logEntry.responseTime,
          logEntry.userId || 'anonymous',
          logEntry.operationType || 'API',
          logEntry.remoteAddr
        ].join('|') + '\n';

        fs.appendFileSync(logPath, csvLine, { encoding: 'utf8' });
      } catch (fsErr) {
        // Silently fail if file write fails (don't break request handling)
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Failed to write to request.log:', fsErr.message);
        }
      }
    });

    // Continue to next middleware
    next();
  };
};

module.exports = {
  createRequestLogger
};
