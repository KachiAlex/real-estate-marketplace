/**
 * BuildLogger - Structured logging system for Android APK builds
 *
 * Provides comprehensive logging capabilities for build execution with:
 * - Structured logging with timestamps and log levels
 * - File-based logging with clear naming conventions
 * - Build stage information tracking
 * - Log rotation and management
 * - Sensitive data sanitization
 *
 * @module BuildLogger
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Log level enumeration
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
}

/**
 * Log entry structure
 */
export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  stage?: string;
  message: string;
  details?: string;
  metadata?: Record<string, any>;
}

/**
 * Build logger configuration
 */
export interface BuildLoggerConfig {
  logsDirectory: string;
  maxLogSize?: number; // MB
  maxLogFiles?: number;
  includeTimestamp?: boolean;
  includeLevelPrefix?: boolean;
  sanitizeSensitiveData?: boolean;
}

/**
 * BuildLogger - Structured logging system for build execution
 *
 * Provides comprehensive logging with:
 * - Timestamped log entries
 * - Multiple log levels (DEBUG, INFO, SUCCESS, WARNING, ERROR)
 * - Build stage tracking
 * - File-based log storage
 * - Sensitive data sanitization
 * - Log rotation and management
 */
export class BuildLogger {
  private config: Required<BuildLoggerConfig>;
  private logFile: string;
  private logEntries: LogEntry[] = [];
  private currentStage: string = '';
  private buildStartTime: Date;
  private sensitivePatterns: RegExp[] = [
    /password[:\s=]+[^\s]+/gi,
    /keystore[:\s=]+[^\s]+/gi,
    /key[:\s=]+[^\s]+/gi,
    /secret[:\s=]+[^\s]+/gi,
    /token[:\s=]+[^\s]+/gi,
    /api[_-]?key[:\s=]+[^\s]+/gi,
  ];

  /**
   * Create a new BuildLogger instance
   *
   * @param config - Logger configuration
   * @param buildId - Unique build identifier
   */
  constructor(config: BuildLoggerConfig, buildId: string) {
    this.config = {
      logsDirectory: config.logsDirectory,
      maxLogSize: config.maxLogSize ?? 50, // 50 MB default
      maxLogFiles: config.maxLogFiles ?? 10,
      includeTimestamp: config.includeTimestamp ?? true,
      includeLevelPrefix: config.includeLevelPrefix ?? true,
      sanitizeSensitiveData: config.sanitizeSensitiveData ?? true,
    };

    this.buildStartTime = new Date();
    this.logFile = this.createLogFile(buildId);
  }

  /**
   * Create log file with timestamp-based naming
   *
   * @param buildId - Build identifier
   * @returns Path to the log file
   */
  private createLogFile(buildId: string): string {
    // Ensure logs directory exists
    if (!fs.existsSync(this.config.logsDirectory)) {
      fs.mkdirSync(this.config.logsDirectory, { recursive: true });
    }

    // Create log filename with timestamp
    const timestamp = this.formatTimestamp(new Date());
    const logFileName = `build-${buildId}-${timestamp}.log`;
    const logPath = path.join(this.config.logsDirectory, logFileName);

    // Create empty log file
    if (!fs.existsSync(logPath)) {
      fs.writeFileSync(logPath, '');
    }

    return logPath;
  }

  /**
   * Format timestamp for logging
   *
   * @param date - Date to format
   * @returns Formatted timestamp string
   */
  private formatTimestamp(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
  }

  /**
   * Sanitize sensitive data from log message
   *
   * @param message - Message to sanitize
   * @returns Sanitized message
   */
  private sanitizeMessage(message: string): string {
    if (!this.config.sanitizeSensitiveData) {
      return message;
    }

    let sanitized = message;
    for (const pattern of this.sensitivePatterns) {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    }

    return sanitized;
  }

  /**
   * Format log entry for file output
   *
   * @param entry - Log entry to format
   * @returns Formatted log line
   */
  private formatLogEntry(entry: LogEntry): string {
    const parts: string[] = [];

    if (this.config.includeTimestamp) {
      const timestamp = entry.timestamp.toISOString();
      parts.push(`[${timestamp}]`);
    }

    if (this.config.includeLevelPrefix) {
      parts.push(`[${entry.level}]`);
    }

    if (entry.stage) {
      parts.push(`[${entry.stage}]`);
    }

    parts.push(entry.message);

    let line = parts.join(' ');

    if (entry.details) {
      line += `\n  Details: ${entry.details}`;
    }

    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      line += `\n  Metadata: ${JSON.stringify(entry.metadata)}`;
    }

    return line;
  }

  /**
   * Write log entry to file
   *
   * @param entry - Log entry to write
   */
  private writeToFile(entry: LogEntry): void {
    try {
      const formattedEntry = this.formatLogEntry(entry);
      const sanitized = this.sanitizeMessage(formattedEntry);
      fs.appendFileSync(this.logFile, sanitized + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * Check if log file needs rotation
   */
  private checkLogRotation(): void {
    try {
      const stats = fs.statSync(this.logFile);
      const fileSizeMB = stats.size / (1024 * 1024);

      if (fileSizeMB > this.config.maxLogSize) {
        this.rotateLogFile();
      }
    } catch (error) {
      // File doesn't exist yet, no rotation needed
    }
  }

  /**
   * Rotate log file when it exceeds max size
   */
  private rotateLogFile(): void {
    try {
      const dir = path.dirname(this.logFile);
      const ext = path.extname(this.logFile);
      const base = path.basename(this.logFile, ext);
      const timestamp = this.formatTimestamp(new Date());
      const rotatedFile = path.join(dir, `${base}-${timestamp}${ext}`);

      fs.renameSync(this.logFile, rotatedFile);
      fs.writeFileSync(this.logFile, '');

      // Clean up old log files
      this.cleanupOldLogs();
    } catch (error) {
      console.error('Failed to rotate log file:', error);
    }
  }

  /**
   * Clean up old log files exceeding max count
   */
  private cleanupOldLogs(): void {
    try {
      const dir = path.dirname(this.logFile);
      const files = fs.readdirSync(dir)
        .filter(f => f.endsWith('.log'))
        .map(f => ({
          name: f,
          path: path.join(dir, f),
          time: fs.statSync(path.join(dir, f)).mtime.getTime(),
        }))
        .sort((a, b) => b.time - a.time);

      // Delete files exceeding max count
      for (let i = this.config.maxLogFiles; i < files.length; i++) {
        fs.unlinkSync(files[i].path);
      }
    } catch (error) {
      console.error('Failed to cleanup old logs:', error);
    }
  }

  /**
   * Set current build stage
   *
   * @param stage - Stage name
   */
  public setStage(stage: string): void {
    this.currentStage = stage;
  }

  /**
   * Log debug message
   *
   * @param message - Message to log
   * @param details - Optional detailed information
   * @param metadata - Optional metadata
   */
  public debug(message: string, details?: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, details, metadata);
  }

  /**
   * Log info message
   *
   * @param message - Message to log
   * @param details - Optional detailed information
   * @param metadata - Optional metadata
   */
  public info(message: string, details?: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, details, metadata);
  }

  /**
   * Log success message
   *
   * @param message - Message to log
   * @param details - Optional detailed information
   * @param metadata - Optional metadata
   */
  public success(message: string, details?: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.SUCCESS, message, details, metadata);
  }

  /**
   * Log warning message
   *
   * @param message - Message to log
   * @param details - Optional detailed information
   * @param metadata - Optional metadata
   */
  public warning(message: string, details?: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARNING, message, details, metadata);
  }

  /**
   * Log error message
   *
   * @param message - Message to log
   * @param details - Optional detailed information
   * @param metadata - Optional metadata
   */
  public error(message: string, details?: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, details, metadata);
  }

  /**
   * Log message with specified level
   *
   * @param level - Log level
   * @param message - Message to log
   * @param details - Optional detailed information
   * @param metadata - Optional metadata
   */
  public log(
    level: LogLevel,
    message: string,
    details?: string,
    metadata?: Record<string, any>,
  ): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      stage: this.currentStage || undefined,
      message,
      details,
      metadata,
    };

    this.logEntries.push(entry);
    this.writeToFile(entry);
    this.checkLogRotation();
  }

  /**
   * Get all log entries
   *
   * @returns Array of log entries
   */
  public getEntries(): LogEntry[] {
    return [...this.logEntries];
  }

  /**
   * Get log entries for specific stage
   *
   * @param stage - Stage name
   * @returns Array of log entries for the stage
   */
  public getEntriesByStage(stage: string): LogEntry[] {
    return this.logEntries.filter(entry => entry.stage === stage);
  }

  /**
   * Get log entries with specific level
   *
   * @param level - Log level
   * @returns Array of log entries with the level
   */
  public getEntriesByLevel(level: LogLevel): LogEntry[] {
    return this.logEntries.filter(entry => entry.level === level);
  }

  /**
   * Get log file path
   *
   * @returns Path to the log file
   */
  public getLogFilePath(): string {
    return this.logFile;
  }

  /**
   * Get log file content
   *
   * @returns Content of the log file
   */
  public getLogContent(): string {
    try {
      return fs.readFileSync(this.logFile, 'utf-8');
    } catch (error) {
      return '';
    }
  }

  /**
   * Get build duration in seconds
   *
   * @returns Duration in seconds
   */
  public getBuildDuration(): number {
    const now = new Date();
    return (now.getTime() - this.buildStartTime.getTime()) / 1000;
  }

  /**
   * Get log statistics
   *
   * @returns Statistics about the logs
   */
  public getStatistics(): {
    totalEntries: number;
    entriesByLevel: Record<LogLevel, number>;
    entriesByStage: Record<string, number>;
    buildDuration: number;
  } {
    const entriesByLevel: Record<LogLevel, number> = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 0,
      [LogLevel.SUCCESS]: 0,
      [LogLevel.WARNING]: 0,
      [LogLevel.ERROR]: 0,
    };

    const entriesByStage: Record<string, number> = {};

    for (const entry of this.logEntries) {
      entriesByLevel[entry.level]++;
      if (entry.stage) {
        entriesByStage[entry.stage] = (entriesByStage[entry.stage] ?? 0) + 1;
      }
    }

    return {
      totalEntries: this.logEntries.length,
      entriesByLevel,
      entriesByStage,
      buildDuration: this.getBuildDuration(),
    };
  }

  /**
   * Clear all log entries (in-memory only)
   */
  public clear(): void {
    this.logEntries = [];
  }

  /**
   * Close logger and finalize log file
   */
  public close(): void {
    try {
      // Write final summary only if file still exists
      if (fs.existsSync(this.logFile)) {
        const stats = this.getStatistics();
        const summary = `\n\n=== BUILD LOG SUMMARY ===\nTotal Entries: ${stats.totalEntries}\nBuild Duration: ${stats.buildDuration.toFixed(2)}s\nErrors: ${stats.entriesByLevel[LogLevel.ERROR]}\nWarnings: ${stats.entriesByLevel[LogLevel.WARNING]}\n`;
        fs.appendFileSync(this.logFile, summary);
      }
    } catch (error) {
      // Silently ignore errors during close (file may have been deleted)
    }
  }
}
