/**
 * Client-side logging utility
 * Replaces console.log with structured logging
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const CURRENT_LOG_LEVEL = process.env.NODE_ENV === 'production' 
  ? LOG_LEVELS.ERROR 
  : LOG_LEVELS.DEBUG;

/**
 * Log error messages
 * @param {Error} error - Error object
 * @param {object} context - Additional context data
 */
export const errorLogger = (error, context = {}) => {
  const logEntry = {
    level: 'ERROR',
    timestamp: new Date().toISOString(),
    message: error?.message || error,
    stack: error?.stack,
    ...context
  };

  if (CURRENT_LOG_LEVEL >= LOG_LEVELS.ERROR) {
    if (process.env.NODE_ENV === 'production') {
      // In production, send to error tracking service (Sentry, etc.)
      console.error(JSON.stringify(logEntry));
      // TODO: Send to error tracking service
      // sendToErrorTracker(logEntry);
    } else {
      console.error('❌ Error:', logEntry);
    }
  }
};

/**
 * Log warning messages
 * @param {string} message - Warning message
 * @param {object} data - Additional data
 */
export const warnLogger = (message, data = {}) => {
  const logEntry = {
    level: 'WARN',
    timestamp: new Date().toISOString(),
    message,
    ...data
  };

  if (CURRENT_LOG_LEVEL >= LOG_LEVELS.WARN) {
    if (process.env.NODE_ENV === 'production') {
      console.warn(JSON.stringify(logEntry));
    } else {
      console.warn('⚠️ Warning:', logEntry);
    }
  }
};

/**
 * Log info messages
 * @param {string} message - Info message
 * @param {object} data - Additional data
 */
export const infoLogger = (message, data = {}) => {
  const logEntry = {
    level: 'INFO',
    timestamp: new Date().toISOString(),
    message,
    ...data
  };

  if (CURRENT_LOG_LEVEL >= LOG_LEVELS.INFO) {
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(logEntry));
    } else {
      console.log('ℹ️ Info:', logEntry);
    }
  }
};

/**
 * Log debug messages
 * @param {string} message - Debug message
 * @param {object} data - Additional data
 */
export const debugLogger = (message, data = {}) => {
  const logEntry = {
    level: 'DEBUG',
    timestamp: new Date().toISOString(),
    message,
    ...data
  };

  if (CURRENT_LOG_LEVEL >= LOG_LEVELS.DEBUG) {
    if (process.env.NODE_ENV === 'production') {
      // Don't log debug messages in production
      return;
    } else {
      console.log('🔍 Debug:', logEntry);
    }
  }
};

/**
 * Log performance metrics
 * @param {string} name - Metric name
 * @param {number} duration - Duration in milliseconds
 * @param {object} context - Additional context
 */
export const performanceLogger = (name, duration, context = {}) => {
  const logEntry = {
    level: 'PERFORMANCE',
    timestamp: new Date().toISOString(),
    metric: name,
    duration,
    ...context
  };

  if (CURRENT_LOG_LEVEL >= LOG_LEVELS.DEBUG) {
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(logEntry));
      // Send to analytics
      if (window.gtag) {
        window.gtag('event', 'timing_complete', {
          name,
          value: duration
        });
      }
    } else {
      console.log('⏱️ Performance:', logEntry);
    }
  }
};

/**
 * Log security events
 * @param {string} action - Security action
 * @param {object} details - Event details
 */
export const securityLogger = (action, details = {}) => {
  const logEntry = {
    level: 'SECURITY',
    timestamp: new Date().toISOString(),
    action,
    ...details
  };

  // Always log security events
  if (process.env.NODE_ENV === 'production') {
    console.warn(JSON.stringify(logEntry));
    // Send to security monitoring service
    // sendToSecurityMonitoring(logEntry);
  } else {
    console.warn('🔒 Security:', logEntry);
  }
};

export default {
  error: errorLogger,
  warn: warnLogger,
  info: infoLogger,
  debug: debugLogger,
  performance: performanceLogger,
  security: securityLogger
};
