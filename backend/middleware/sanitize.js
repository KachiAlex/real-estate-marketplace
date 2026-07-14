const { sanitizeObject } = require('../config/security');

/**
 * Middleware to sanitize all user input
 * Protects against XSS, SQL injection, and path traversal attacks
 */
const sanitizeMiddleware = (req, res, next) => {
  try {
    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }

    // Sanitize URL parameters
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params);
    }

    next();
  } catch (error) {
    console.error('Error in sanitize middleware:', error);
    // Don't block the request if sanitization fails, but log it
    next();
  }
};

module.exports = sanitizeMiddleware;

