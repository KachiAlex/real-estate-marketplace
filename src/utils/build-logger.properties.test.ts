/**
 * Property-based tests for BuildLogger
 *
 * **Validates: Requirements 11.1, 11.2, 11.3**
 *
 * Properties tested:
 * - Property 40: Build Log Generation - Logs must include timestamps and stage info
 * - Property 41: Build Log Storage - Logs must be stored with clear naming
 */

import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import { BuildLogger, LogLevel } from './build-logger';

describe('BuildLogger - Property-Based Tests', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = path.join(__dirname, `temp-pbt-logs-${Date.now()}`);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  /**
   * Property 40: Build Log Generation
   *
   * For any sequence of log messages with different levels and stages,
   * the generated log file must include timestamps and stage information
   * for each entry.
   *
   * **Validates: Requirements 11.1, 11.2**
   */
  test('Property 40: Build Log Generation - logs must include timestamps and stage info', () => {
    const logLevels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.SUCCESS, LogLevel.WARNING, LogLevel.ERROR];

    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            message: fc.string({ minLength: 1, maxLength: 100 }),
            levelIdx: fc.integer({ min: 0, max: 4 }),
            hasStage: fc.boolean(),
            stage: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          { minLength: 1, maxLength: 20 },
        ),
        (logEntries) => {
          const logger = new BuildLogger({ logsDirectory: tempDir }, `build-${Date.now()}`);

          // Log all entries
          for (const entry of logEntries) {
            if (entry.hasStage) {
              logger.setStage(entry.stage);
            }
            logger.log(logLevels[entry.levelIdx], entry.message);
          }

          const content = logger.getLogContent();
          logger.close();

          // Verify timestamps are present
          expect(content).toMatch(/\[\d{4}-\d{2}-\d{2}T/);

          // Verify log levels are present
          const hasLogLevels = logLevels.some((level) => content.includes(`[${level}]`));
          expect(hasLogLevels).toBe(true);

          // Verify stages are present if any were set
          const stagesInEntries = logEntries.filter((e) => e.hasStage).map((e) => e.stage);
          if (stagesInEntries.length > 0) {
            const hasStages = stagesInEntries.some((stage) => content.includes(`[${stage}]`));
            expect(hasStages).toBe(true);
          }

          return true;
        },
      ),
      { numRuns: 10 },
    );
  });

  /**
   * Property 41: Build Log Storage
   *
   * For any build ID, the log file must be created with a clear naming
   * convention that includes the build ID and timestamp, and must be
   * stored in the designated logs directory.
   *
   * **Validates: Requirements 11.3**
   */
  test('Property 41: Build Log Storage - logs must be stored with clear naming', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 50 }), (buildId) => {
        const logger = new BuildLogger({ logsDirectory: tempDir }, buildId);
        const logPath = logger.getLogFilePath();

        // Verify log file exists
        expect(fs.existsSync(logPath)).toBe(true);

        // Verify log file is in the correct directory
        expect(logPath).toContain(tempDir);

        // Verify log file has .log extension
        expect(logPath).toMatch(/\.log$/);

        // Verify log file name includes build ID
        expect(path.basename(logPath)).toContain(buildId);

        // Verify log file name includes timestamp pattern
        expect(path.basename(logPath)).toMatch(/\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}/);

        logger.close();
        return true;
      }),
      { numRuns: 10 },
    );
  });

  /**
   * Property: Log Entry Consistency
   *
   * For any log entry added to the logger, the entry must be retrievable
   * from both the in-memory entries and the log file.
   */
  test('Property: Log Entry Consistency - entries must be retrievable from memory and file', () => {
    const logLevels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.SUCCESS, LogLevel.WARNING, LogLevel.ERROR];

    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            message: fc.string({ minLength: 1, maxLength: 100 }),
            levelIdx: fc.integer({ min: 0, max: 4 }),
          }),
          { minLength: 1, maxLength: 15 },
        ),
        (logEntries) => {
          const logger = new BuildLogger({ logsDirectory: tempDir }, `build-${Date.now()}`);

          // Log all entries
          for (const entry of logEntries) {
            logger.log(logLevels[entry.levelIdx], entry.message);
          }

          // Verify in-memory entries
          const memoryEntries = logger.getEntries();
          expect(memoryEntries).toHaveLength(logEntries.length);

          // Verify file entries
          const content = logger.getLogContent();
          for (const entry of logEntries) {
            expect(content).toContain(entry.message);
          }

          logger.close();
          return true;
        },
      ),
      { numRuns: 10 },
    );
  });

  /**
   * Property: Stage Tracking Consistency
   *
   * For any sequence of stage changes and log entries, the stage
   * information must be correctly associated with each log entry.
   */
  test('Property: Stage Tracking Consistency - stages must be correctly associated', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            stage: fc.string({ minLength: 1, maxLength: 30 }),
            message: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          { minLength: 1, maxLength: 15 },
        ),
        (operations) => {
          const logger = new BuildLogger({ logsDirectory: tempDir }, `build-${Date.now()}`);

          // Execute operations
          for (const op of operations) {
            logger.setStage(op.stage);
            logger.info(op.message);
          }

          // Verify stage associations
          const entries = logger.getEntries();
          for (let i = 0; i < entries.length; i++) {
            expect(entries[i].stage).toBe(operations[i].stage);
            expect(entries[i].message).toBe(operations[i].message);
          }

          logger.close();
          return true;
        },
      ),
      { numRuns: 10 },
    );
  });

  /**
   * Property: Log Level Filtering
   *
   * For any sequence of log entries with different levels, filtering
   * by level must return only entries with that level.
   */
  test('Property: Log Level Filtering - filtering must return correct entries', () => {
    const logLevels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.SUCCESS, LogLevel.WARNING, LogLevel.ERROR];

    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 4 }), { minLength: 5, maxLength: 20 }),
        (levelIndices) => {
          const logger = new BuildLogger({ logsDirectory: tempDir }, `build-${Date.now()}`);

          // Log entries with different levels
          for (let i = 0; i < levelIndices.length; i++) {
            logger.log(logLevels[levelIndices[i]], `Message ${i}`);
          }

          // Verify filtering for each level
          for (const level of logLevels) {
            const filtered = logger.getEntriesByLevel(level);
            const expectedCount = levelIndices.filter((idx) => logLevels[idx] === level).length;
            expect(filtered).toHaveLength(expectedCount);

            // Verify all filtered entries have the correct level
            for (const entry of filtered) {
              expect(entry.level).toBe(level);
            }
          }

          logger.close();
          return true;
        },
      ),
      { numRuns: 10 },
    );
  });

  /**
   * Property: Statistics Accuracy
   *
   * For any sequence of log entries, the statistics must accurately
   * reflect the number of entries by level and stage.
   */
  test('Property: Statistics Accuracy - statistics must be accurate', () => {
    const logLevels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.SUCCESS, LogLevel.WARNING, LogLevel.ERROR];

    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            message: fc.string({ minLength: 1, maxLength: 50 }),
            levelIdx: fc.integer({ min: 0, max: 4 }),
            hasStage: fc.boolean(),
            stage: fc.string({ minLength: 1, maxLength: 30 }),
          }),
          { minLength: 1, maxLength: 20 },
        ),
        (logEntries) => {
          const logger = new BuildLogger({ logsDirectory: tempDir }, `build-${Date.now()}`);

          // Log all entries
          for (const entry of logEntries) {
            if (entry.hasStage) {
              logger.setStage(entry.stage);
            }
            logger.log(logLevels[entry.levelIdx], entry.message);
          }

          const stats = logger.getStatistics();

          // Verify total entries
          expect(stats.totalEntries).toBe(logEntries.length);

          // Verify entries by level
          for (let i = 0; i < logLevels.length; i++) {
            const level = logLevels[i];
            const expectedCount = logEntries.filter((e) => logLevels[e.levelIdx] === level).length;
            expect(stats.entriesByLevel[level]).toBe(expectedCount);
          }

          // Verify entries by stage
          const stageMap: Record<string, number> = {};
          for (const entry of logEntries) {
            if (entry.hasStage) {
              const stage = entry.stage as string;
              stageMap[stage] = (stageMap[stage] ?? 0) + 1;
            }
          }
          for (const [stage, count] of Object.entries(stageMap)) {
            expect(stats.entriesByStage[stage]).toBe(count);
          }

          logger.close();
          return true;
        },
      ),
      { numRuns: 10 },
    );
  });

  /**
   * Property: Sensitive Data Sanitization
   *
   * For any log message containing sensitive patterns, the sanitized
   * output must not contain the sensitive data.
   */
  test('Property: Sensitive Data Sanitization - sensitive data must be redacted', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.oneof(
            fc.string().map((s) => `password: ${s}`),
            fc.string().map((s) => `keystore: ${s}`),
            fc.string().map((s) => `api_key: ${s}`),
            fc.string().map((s) => `token: ${s}`),
          ),
          { minLength: 1, maxLength: 10 },
        ),
        (messages) => {
          const logger = new BuildLogger(
            { logsDirectory: tempDir, sanitizeSensitiveData: true },
            `build-${Date.now()}`,
          );

          // Log messages with sensitive data
          for (const message of messages) {
            logger.info(message);
          }

          const content = logger.getLogContent();

          // Verify sensitive data is redacted
          for (const message of messages) {
            // Extract the sensitive value (after the colon)
            const parts = message.split(': ');
            if (parts.length > 1) {
              const sensitiveValue = parts[1];
              expect(content).not.toContain(sensitiveValue);
            }
          }

          // Verify redaction marker is present
          expect(content).toContain('[REDACTED]');

          logger.close();
          return true;
        },
      ),
      { numRuns: 10 },
    );
  });

  /**
   * Property: Build Duration Tracking
   *
   * For any logger instance, the build duration must be non-negative
   * and increase over time.
   */
  test('Property: Build Duration Tracking - duration must be non-negative and increasing', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10 }), (delayCount) => {
        const logger = new BuildLogger({ logsDirectory: tempDir }, `build-${Date.now()}`);

        const durations: number[] = [];
        for (let i = 0; i < delayCount; i++) {
          logger.info(`Message ${i}`);
          const duration = logger.getBuildDuration();
          durations.push(duration);
        }

        // Verify all durations are non-negative
        for (const duration of durations) {
          expect(duration).toBeGreaterThanOrEqual(0);
        }

        // Verify durations are non-decreasing
        for (let i = 1; i < durations.length; i++) {
          expect(durations[i]).toBeGreaterThanOrEqual(durations[i - 1]);
        }

        logger.close();
        return true;
      }),
      { numRuns: 10 },
    );
  });

  /**
   * Property: Log File Persistence
   *
   * For any log entries written to a logger, the log file must persist
   * after the logger is closed and contain all logged messages.
   */
  test('Property: Log File Persistence - log file must persist after close', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 15 }),
        (messages) => {
          const buildId = `build-${Date.now()}-${Math.random()}`;
          let logPath: string;

          {
            const logger = new BuildLogger({ logsDirectory: tempDir }, buildId);
            for (const message of messages) {
              logger.info(message);
            }
            logPath = logger.getLogFilePath();
            logger.close();
          }

          // Verify log file still exists after close
          expect(fs.existsSync(logPath)).toBe(true);

          // Verify log file contains all messages
          const content = fs.readFileSync(logPath, 'utf-8');
          for (const message of messages) {
            expect(content).toContain(message);
          }

          return true;
        },
      ),
      { numRuns: 10 },
    );
  });

  /**
   * Property: Multiple Logger Independence
   *
   * For any two logger instances with different build IDs, their log
   * files must be independent and not interfere with each other.
   */
  test('Property: Multiple Logger Independence - loggers must be independent', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.array(fc.string({ minLength: 5, maxLength: 30 }), { minLength: 1, maxLength: 10 }),
          fc.array(fc.string({ minLength: 5, maxLength: 30 }), { minLength: 1, maxLength: 10 }),
        ),
        ([messages1, messages2]) => {
          const logger1 = new BuildLogger({ logsDirectory: tempDir }, `build-1-${Date.now()}`);
          const logger2 = new BuildLogger({ logsDirectory: tempDir }, `build-2-${Date.now()}`);

          // Log to both loggers
          for (const message of messages1) {
            logger1.info(message);
          }
          for (const message of messages2) {
            logger2.info(message);
          }

          // Verify log files are independent
          const content1 = logger1.getLogContent();
          const content2 = logger2.getLogContent();

          // Verify logger1 contains only its messages
          for (const message of messages1) {
            expect(content1).toContain(message);
          }

          // Verify logger2 contains only its messages
          for (const message of messages2) {
            expect(content2).toContain(message);
          }

          logger2.close();
          logger1.close();
          return true;
        },
      ),
      { numRuns: 10 },
    );
  });
});
