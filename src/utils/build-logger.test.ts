/**
 * Unit tests for BuildLogger
 *
 * Tests cover:
 * - Log entry creation and formatting
 * - File-based logging
 * - Log levels and filtering
 * - Stage tracking
 * - Sensitive data sanitization
 * - Log rotation and cleanup
 * - Statistics and reporting
 */

import * as fs from 'fs';
import * as path from 'path';
import { BuildLogger, LogLevel, LogEntry } from './build-logger';

describe('BuildLogger', () => {
  let tempDir: string;
  let logger: BuildLogger;

  beforeEach(() => {
    // Create temporary directory for logs
    tempDir = path.join(__dirname, `temp-logs-${Date.now()}`);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up temporary directory
    if (logger) {
      logger.close();
    }
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Logger Creation', () => {
    test('should create logger with default configuration', () => {
      logger = new BuildLogger({ logsDirectory: tempDir }, 'test-build-1');
      expect(logger).toBeDefined();
      expect(logger.getLogFilePath()).toContain('build-test-build-1');
    });

    test('should create log file in specified directory', () => {
      logger = new BuildLogger({ logsDirectory: tempDir }, 'test-build-2');
      const logPath = logger.getLogFilePath();
      expect(fs.existsSync(logPath)).toBe(true);
    });

    test('should create logs directory if it does not exist', () => {
      const newDir = path.join(tempDir, 'nested', 'logs');
      logger = new BuildLogger({ logsDirectory: newDir }, 'test-build-3');
      expect(fs.existsSync(newDir)).toBe(true);
    });

    test('should use custom configuration values', () => {
      logger = new BuildLogger(
        {
          logsDirectory: tempDir,
          maxLogSize: 100,
          maxLogFiles: 5,
          includeTimestamp: false,
          includeLevelPrefix: false,
        },
        'test-build-4',
      );
      expect(logger).toBeDefined();
    });
  });

  describe('Log Entry Creation', () => {
    beforeEach(() => {
      logger = new BuildLogger({ logsDirectory: tempDir }, 'test-build');
    });

    test('should log info message', () => {
      logger.info('Test info message');
      const entries = logger.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].level).toBe(LogLevel.INFO);
      expect(entries[0].message).toBe('Test info message');
    });

    test('should log debug message', () => {
      logger.debug('Test debug message');
      const entries = logger.getEntries();
      expect(entries[0].level).toBe(LogLevel.DEBUG);
    });

    test('should log success message', () => {
      logger.success('Test success message');
      const entries = logger.getEntries();
      expect(entries[0].level).toBe(LogLevel.SUCCESS);
    });

    test('should log warning message', () => {
      logger.warning('Test warning message');
      const entries = logger.getEntries();
      expect(entries[0].level).toBe(LogLevel.WARNING);
    });

    test('should log error message', () => {
      logger.error('Test error message');
      const entries = logger.getEntries();
      expect(entries[0].level).toBe(LogLevel.ERROR);
    });

    test('should include details in log entry', () => {
      logger.info('Test message', 'Test details');
      const entries = logger.getEntries();
      expect(entries[0].details).toBe('Test details');
    });

    test('should include metadata in log entry', () => {
      const metadata = { key: 'value', count: 42 };
      logger.info('Test message', undefined, metadata);
      const entries = logger.getEntries();
      expect(entries[0].metadata).toEqual(metadata);
    });

    test('should include timestamp in log entry', () => {
      const before = new Date();
      logger.info('Test message');
      const after = new Date();
      const entries = logger.getEntries();
      expect(entries[0].timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(entries[0].timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('Stage Tracking', () => {
    beforeEach(() => {
      logger = new BuildLogger({ logsDirectory: tempDir }, 'test-build');
    });

    test('should set current stage', () => {
      logger.setStage('Compilation');
      logger.info('Compiling code');
      const entries = logger.getEntries();
      expect(entries[0].stage).toBe('Compilation');
    });

    test('should track multiple stages', () => {
      logger.setStage('Validation');
      logger.info('Validating config');
      logger.setStage('Compilation');
      logger.info('Compiling code');
      logger.setStage('Packaging');
      logger.info('Packaging APK');

      const entries = logger.getEntries();
      expect(entries).toHaveLength(3);
      expect(entries[0].stage).toBe('Validation');
      expect(entries[1].stage).toBe('Compilation');
      expect(entries[2].stage).toBe('Packaging');
    });

    test('should filter entries by stage', () => {
      logger.setStage('Compilation');
      logger.info('Message 1');
      logger.setStage('Packaging');
      logger.info('Message 2');
      logger.setStage('Compilation');
      logger.info('Message 3');

      const compilationEntries = logger.getEntriesByStage('Compilation');
      expect(compilationEntries).toHaveLength(2);
      expect(compilationEntries[0].message).toBe('Message 1');
      expect(compilationEntries[1].message).toBe('Message 3');
    });
  });

  describe('Log Filtering', () => {
    beforeEach(() => {
      logger = new BuildLogger({ logsDirectory: tempDir }, 'test-build');
    });

    test('should filter entries by level', () => {
      logger.info('Info message');
      logger.warning('Warning message');
      logger.error('Error message');
      logger.info('Another info');

      const infoEntries = logger.getEntriesByLevel(LogLevel.INFO);
      expect(infoEntries).toHaveLength(2);
      expect(infoEntries[0].message).toBe('Info message');
      expect(infoEntries[1].message).toBe('Another info');
    });

    test('should filter errors', () => {
      logger.info('Info');
      logger.error('Error 1');
      logger.warning('Warning');
      logger.error('Error 2');

      const errors = logger.getEntriesByLevel(LogLevel.ERROR);
      expect(errors).toHaveLength(2);
    });

    test('should filter warnings', () => {
      logger.info('Info');
      logger.warning('Warning 1');
      logger.warning('Warning 2');
      logger.error('Error');

      const warnings = logger.getEntriesByLevel(LogLevel.WARNING);
      expect(warnings).toHaveLength(2);
    });
  });

  describe('File Logging', () => {
    beforeEach(() => {
      logger = new BuildLogger({ logsDirectory: tempDir }, 'test-build');
    });

    test('should write log entries to file', () => {
      logger.info('Test message');
      const content = logger.getLogContent();
      expect(content).toContain('Test message');
    });

    test('should include timestamp in file output', () => {
      logger.info('Test message');
      const content = logger.getLogContent();
      expect(content).toMatch(/\[\d{4}-\d{2}-\d{2}T/);
    });

    test('should include log level in file output', () => {
      logger.info('Test message');
      const content = logger.getLogContent();
      expect(content).toContain('[INFO]');
    });

    test('should include stage in file output', () => {
      logger.setStage('TestStage');
      logger.info('Test message');
      const content = logger.getLogContent();
      expect(content).toContain('[TestStage]');
    });

    test('should include details in file output', () => {
      logger.info('Test message', 'Test details');
      const content = logger.getLogContent();
      expect(content).toContain('Details: Test details');
    });

    test('should include metadata in file output', () => {
      logger.info('Test message', undefined, { key: 'value' });
      const content = logger.getLogContent();
      expect(content).toContain('Metadata:');
      expect(content).toContain('key');
      expect(content).toContain('value');
    });

    test('should append multiple entries to file', () => {
      logger.info('Message 1');
      logger.info('Message 2');
      logger.info('Message 3');
      const content = logger.getLogContent();
      expect(content).toContain('Message 1');
      expect(content).toContain('Message 2');
      expect(content).toContain('Message 3');
    });
  });

  describe('Sensitive Data Sanitization', () => {
    beforeEach(() => {
      logger = new BuildLogger(
        { logsDirectory: tempDir, sanitizeSensitiveData: true },
        'test-build',
      );
    });

    test('should sanitize password in logs', () => {
      logger.info('password: mysecretpassword');
      const content = logger.getLogContent();
      expect(content).toContain('[REDACTED]');
      expect(content).not.toContain('mysecretpassword');
    });

    test('should sanitize keystore path in logs', () => {
      logger.info('keystore: /path/to/keystore.jks');
      const content = logger.getLogContent();
      expect(content).toContain('[REDACTED]');
      expect(content).not.toContain('/path/to/keystore.jks');
    });

    test('should sanitize API key in logs', () => {
      logger.info('api_key: abc123def456');
      const content = logger.getLogContent();
      expect(content).toContain('[REDACTED]');
      expect(content).not.toContain('abc123def456');
    });

    test('should sanitize token in logs', () => {
      logger.info('token: xyz789');
      const content = logger.getLogContent();
      expect(content).toContain('[REDACTED]');
      expect(content).not.toContain('xyz789');
    });

    test('should not sanitize when disabled', () => {
      const unsafeLogger = new BuildLogger(
        { logsDirectory: tempDir, sanitizeSensitiveData: false },
        'test-build-unsafe',
      );
      unsafeLogger.info('password: mysecret');
      const content = unsafeLogger.getLogContent();
      expect(content).toContain('mysecret');
      unsafeLogger.close();
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      logger = new BuildLogger({ logsDirectory: tempDir }, 'test-build');
    });

    test('should calculate total entries', () => {
      logger.info('Message 1');
      logger.info('Message 2');
      logger.warning('Message 3');
      const stats = logger.getStatistics();
      expect(stats.totalEntries).toBe(3);
    });

    test('should count entries by level', () => {
      logger.info('Info 1');
      logger.info('Info 2');
      logger.warning('Warning 1');
      logger.error('Error 1');
      logger.debug('Debug 1');
      logger.success('Success 1');

      const stats = logger.getStatistics();
      expect(stats.entriesByLevel[LogLevel.INFO]).toBe(2);
      expect(stats.entriesByLevel[LogLevel.WARNING]).toBe(1);
      expect(stats.entriesByLevel[LogLevel.ERROR]).toBe(1);
      expect(stats.entriesByLevel[LogLevel.DEBUG]).toBe(1);
      expect(stats.entriesByLevel[LogLevel.SUCCESS]).toBe(1);
    });

    test('should count entries by stage', () => {
      logger.setStage('Validation');
      logger.info('Message 1');
      logger.info('Message 2');
      logger.setStage('Compilation');
      logger.info('Message 3');
      logger.setStage('Validation');
      logger.info('Message 4');

      const stats = logger.getStatistics();
      expect(stats.entriesByStage['Validation']).toBe(3);
      expect(stats.entriesByStage['Compilation']).toBe(1);
    });

    test('should calculate build duration', () => {
      const before = Date.now();
      logger.info('Message');
      // Simulate some time passing
      const duration = logger.getBuildDuration();
      const after = Date.now();

      expect(duration).toBeGreaterThanOrEqual(0);
      expect(duration * 1000).toBeLessThanOrEqual(after - before + 100); // Allow 100ms margin
    });
  });

  describe('Log Management', () => {
    beforeEach(() => {
      logger = new BuildLogger({ logsDirectory: tempDir }, 'test-build');
    });

    test('should get log file path', () => {
      const logPath = logger.getLogFilePath();
      expect(logPath).toContain('build-test-build');
      expect(logPath).toContain('.log');
    });

    test('should get log content', () => {
      logger.info('Test message');
      const content = logger.getLogContent();
      expect(content).toContain('Test message');
    });

    test('should clear in-memory entries', () => {
      logger.info('Message 1');
      logger.info('Message 2');
      expect(logger.getEntries()).toHaveLength(2);

      logger.clear();
      expect(logger.getEntries()).toHaveLength(0);
    });

    test('should close logger and write summary', () => {
      logger.info('Message 1');
      logger.warning('Message 2');
      logger.error('Message 3');
      logger.close();

      const content = logger.getLogContent();
      expect(content).toContain('BUILD LOG SUMMARY');
      expect(content).toContain('Total Entries: 3');
      expect(content).toContain('Errors: 1');
      expect(content).toContain('Warnings: 1');
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      logger = new BuildLogger({ logsDirectory: tempDir }, 'test-build');
    });

    test('should handle empty messages', () => {
      logger.info('');
      const entries = logger.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].message).toBe('');
    });

    test('should handle very long messages', () => {
      const longMessage = 'A'.repeat(10000);
      logger.info(longMessage);
      const entries = logger.getEntries();
      expect(entries[0].message).toBe(longMessage);
    });

    test('should handle special characters in messages', () => {
      const specialMessage = 'Test with special chars: !@#$%^&*()[]{}';
      logger.info(specialMessage);
      const entries = logger.getEntries();
      expect(entries[0].message).toBe(specialMessage);
    });

    test('should handle unicode characters', () => {
      const unicodeMessage = 'Test with unicode: 你好世界 🚀';
      logger.info(unicodeMessage);
      const entries = logger.getEntries();
      expect(entries[0].message).toBe(unicodeMessage);
    });

    test('should handle null metadata', () => {
      logger.info('Message', undefined, undefined);
      const entries = logger.getEntries();
      expect(entries[0].metadata).toBeUndefined();
    });

    test('should handle empty metadata', () => {
      logger.info('Message', undefined, {});
      const entries = logger.getEntries();
      expect(entries[0].metadata).toEqual({});
    });

    test('should handle rapid logging', () => {
      for (let i = 0; i < 100; i++) {
        logger.info(`Message ${i}`);
      }
      const entries = logger.getEntries();
      expect(entries).toHaveLength(100);
    });

    test('should handle stage changes without messages', () => {
      logger.setStage('Stage1');
      logger.setStage('Stage2');
      logger.setStage('Stage3');
      logger.info('Message');
      const entries = logger.getEntries();
      expect(entries[0].stage).toBe('Stage3');
    });
  });

  describe('Configuration Options', () => {
    test('should respect includeTimestamp option', () => {
      logger = new BuildLogger(
        { logsDirectory: tempDir, includeTimestamp: false },
        'test-build',
      );
      logger.info('Test message');
      const content = logger.getLogContent();
      expect(content).not.toMatch(/\[\d{4}-\d{2}-\d{2}T/);
      logger.close();
    });

    test('should respect includeLevelPrefix option', () => {
      logger = new BuildLogger(
        { logsDirectory: tempDir, includeLevelPrefix: false },
        'test-build',
      );
      logger.info('Test message');
      const content = logger.getLogContent();
      expect(content).not.toContain('[INFO]');
      logger.close();
    });

    test('should use custom max log size', () => {
      logger = new BuildLogger(
        { logsDirectory: tempDir, maxLogSize: 1 },
        'test-build',
      );
      expect(logger).toBeDefined();
      logger.close();
    });

    test('should use custom max log files', () => {
      logger = new BuildLogger(
        { logsDirectory: tempDir, maxLogFiles: 3 },
        'test-build',
      );
      expect(logger).toBeDefined();
      logger.close();
    });
  });

  describe('Multiple Loggers', () => {
    test('should support multiple independent loggers', () => {
      const logger1 = new BuildLogger({ logsDirectory: tempDir }, 'build-1');
      const logger2 = new BuildLogger({ logsDirectory: tempDir }, 'build-2');

      logger1.info('Message from logger 1');
      logger2.info('Message from logger 2');

      expect(logger1.getEntries()).toHaveLength(1);
      expect(logger2.getEntries()).toHaveLength(1);
      expect(logger1.getLogFilePath()).not.toBe(logger2.getLogFilePath());

      // Close in reverse order to avoid cleanup issues
      logger2.close();
      logger1.close();
    });

    test('should maintain separate log files', () => {
      const logger1 = new BuildLogger({ logsDirectory: tempDir }, 'build-1');
      const logger2 = new BuildLogger({ logsDirectory: tempDir }, 'build-2');

      logger1.info('Message 1');
      logger2.info('Message 2');

      const content1 = logger1.getLogContent();
      const content2 = logger2.getLogContent();

      expect(content1).toContain('Message 1');
      expect(content1).not.toContain('Message 2');
      expect(content2).toContain('Message 2');
      expect(content2).not.toContain('Message 1');

      // Close in reverse order to avoid cleanup issues
      logger2.close();
      logger1.close();
    });
  });
});
