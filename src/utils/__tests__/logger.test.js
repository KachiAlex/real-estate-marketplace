import logger, { errorLogger, warnLogger, infoLogger, debugLogger, performanceLogger, securityLogger } from '../logger';

describe('logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  describe('errorLogger', () => {
    it('should log error messages', () => {
      const error = new Error('Test error');
      errorLogger(error);
      expect(console.error).toHaveBeenCalled();
    });

    it('should log error with context', () => {
      const error = new Error('Test error');
      errorLogger(error, { userId: '123', action: 'login' });
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('warnLogger', () => {
    it('should log warning messages', () => {
      warnLogger('Test warning message');
      expect(console.warn).toHaveBeenCalled();
    });

    it('should log warning with data', () => {
      warnLogger('Test warning', { key: 'value' });
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('infoLogger', () => {
    it('should log info messages', () => {
      infoLogger('Test info message');
      expect(console.log).toHaveBeenCalled();
    });

    it('should log info with data', () => {
      infoLogger('Test info', { key: 'value' });
      expect(console.log).toHaveBeenCalled();
    });
  });

  describe('debugLogger', () => {
    it('should log debug messages in development', () => {
      debugLogger('Test debug message');
      // In test environment (NODE_ENV !== 'production'), debug should log
      expect(console.log).toHaveBeenCalled();
    });
  });

  describe('performanceLogger', () => {
    it('should log performance metrics', () => {
      performanceLogger('test-metric', 100);
      expect(console.log).toHaveBeenCalled();
    });
  });

  describe('securityLogger', () => {
    it('should log security events', () => {
      securityLogger('login_attempt', { userId: '123' });
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('default logger object', () => {
    it('should have all logger methods', () => {
      expect(logger.error).toBe(errorLogger);
      expect(logger.warn).toBe(warnLogger);
      expect(logger.info).toBe(infoLogger);
      expect(logger.debug).toBe(debugLogger);
      expect(logger.performance).toBe(performanceLogger);
      expect(logger.security).toBe(securityLogger);
    });
  });
});


