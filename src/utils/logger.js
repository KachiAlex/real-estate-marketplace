// Simple logger utility for error tracking and debugging

const isDevelopment = process.env.NODE_ENV === 'development';

export const errorLogger = (error, additionalInfo = {}) => {
  if (isDevelopment) {
    console.error(`[ERROR]`, error, additionalInfo);
  }
  // In production, could send to error tracking service
};

export const warnLogger = (message, data) => {
  if (isDevelopment) {
    console.warn(`[WARN] ${message}`, data);
  }
};

export const infoLogger = (message, data) => {
  if (isDevelopment) {
    console.info(`[INFO] ${message}`, data);
  }
};

export const debugLogger = (message, data) => {
  if (isDevelopment) {
    console.debug(`[DEBUG] ${message}`, data);
  }
};

const logger = {
  error: errorLogger,
  warn: warnLogger,
  info: infoLogger,
  debug: debugLogger,
};

export default logger;
