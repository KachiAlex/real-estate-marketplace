const morgan = require('morgan');

// Custom token for user ID
morgan.token('user-id', (req) => {
  return req.user ? req.user.id : 'anonymous';
});

// Custom token for request body (sanitized)
morgan.token('body', (req) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const sanitizedBody = { ...req.body };
    // Remove sensitive fields
    delete sanitizedBody.password;
    delete sanitizedBody.token;
    delete sanitizedBody.apiKey;
    return JSON.stringify(sanitizedBody).substring(0, 200);
  }
  return '-';
});

// Development format - detailed
const devFormat = ':method :url :status :response-time ms - :res[content-length] - User: :user-id';

// Production format - JSON for log aggregation
const prodFormat = JSON.stringify({
  method: ':method',
  url: ':url',
  status: ':status',
  responseTime: ':response-time',
  contentLength: ':res[content-length]',
  userId: ':user-id',
  userAgent: ':user-agent',
  remoteAddr: ':remote-addr',
  timestamp: ':date[iso]'
});

// Create logger middleware based on environment
const createLogger = () => {
  if (process.env.NODE_ENV === 'production') {
    // In production, log to console in JSON format (for log aggregation services)
    return morgan(prodFormat);
  } else {
    // In development, use colorized output
    return morgan(devFormat);
  }
};

// Security logger for sensitive operations
const securityLogger = (action, userId, details = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: 'SECURITY',
    action,
    userId,
    details,
    environment: process.env.NODE_ENV
  };

  if (process.env.NODE_ENV === 'production') {
    // In production, log as JSON
    console.log(JSON.stringify(logEntry));
  } else {
    // In development, log with formatting
    console.log(`[SECURITY] ${action} - User: ${userId}`, details);
  }
};

// Error logger
const errorLogger = (error, req = null, additionalInfo = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: 'ERROR',
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    url: req ? req.originalUrl : undefined,
    method: req ? req.method : undefined,
    userId: req?.user?.id,
    ...additionalInfo
  };

  if (process.env.NODE_ENV === 'production') {
    // In production, don't log stack traces
    delete logEntry.stack;
    console.error(JSON.stringify(logEntry));
  } else {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    if (Object.keys(additionalInfo).length > 0) {
      console.error('Additional Info:', additionalInfo);
    }
  }
};

// Info logger
const infoLogger = (message, data = {}) => {
  if (process.env.NODE_ENV === 'production') {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message,
      ...data
    }));
  } else {
    console.log(`ℹ️ ${message}`, Object.keys(data).length > 0 ? data : '');
  }
};

// Warn logger
const warnLogger = (message, data = {}) => {
  if (process.env.NODE_ENV === 'production') {
    console.warn(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'WARN',
      message,
      ...data
    }));
  } else {
    console.warn(`⚠️ ${message}`, Object.keys(data).length > 0 ? data : '');
  }
};

module.exports = {
  createLogger,
  securityLogger,
  errorLogger,
  infoLogger,
  warnLogger
};

