/**
 * Gradle Command Builder
 *
 * Builds Gradle command lines with proper flags, handles variants and custom configurations,
 * and supports parallel compilation and caching options.
 *
 * **Validates: Requirements 1.5, 1.6, 8.1, 8.5**
 *
 * @module utils/gradle-command-builder
 */

import * as path from 'path';

/**
 * Gradle command builder configuration
 */
export interface GradleCommandConfig {
  /** Gradle wrapper path */
  gradlewPath: string;

  /** Android project directory */
  androidDir: string;

  /** Build task (e.g., assembleDebug, assembleRelease, bundleRelease) */
  task: string;

  /** Enable build cache */
  cacheEnabled?: boolean;

  /** Enable parallel compilation */
  parallel?: boolean;

  /** Enable offline mode */
  offline?: boolean;

  /** Custom Gradle properties */
  properties?: Record<string, string>;

  /** Additional Gradle arguments */
  additionalArgs?: string[];
}

/**
 * Gradle Command Builder
 *
 * Builds Gradle command lines with proper flags and options.
 *
 * **Validates: Requirements 1.5, 1.6, 8.1, 8.5**
 */
export class GradleCommandBuilder {
  /**
   * Build a Gradle command line
   *
   * @param config - Gradle command configuration
   * @returns Complete Gradle command line
   */
  static buildCommand(config: GradleCommandConfig): string {
    const parts: string[] = [];

    // Add Gradle wrapper path
    parts.push(config.gradlewPath);

    // Add project directory
    parts.push('-p', config.androidDir);

    // Add build cache flag
    if (config.cacheEnabled !== false) {
      parts.push('--build-cache');
    }

    // Add parallel compilation flag
    if (config.parallel) {
      parts.push('--parallel');
    }

    // Add offline flag
    if (config.offline) {
      parts.push('--offline');
    }

    // Add custom properties
    if (config.properties) {
      for (const [key, value] of Object.entries(config.properties)) {
        parts.push(`-P${key}=${value}`);
      }
    }

    // Add build task
    parts.push(config.task);

    // Add additional arguments
    if (config.additionalArgs && config.additionalArgs.length > 0) {
      parts.push(...config.additionalArgs);
    }

    return parts.join(' ');
  }

  /**
   * Build a debug build command
   *
   * @param gradlewPath - Path to Gradle wrapper
   * @param androidDir - Android project directory
   * @param options - Additional options
   * @returns Debug build command
   */
  static buildDebugCommand(
    gradlewPath: string,
    androidDir: string,
    options?: Partial<GradleCommandConfig>,
  ): string {
    return this.buildCommand({
      gradlewPath,
      androidDir,
      task: 'assembleDebug',
      cacheEnabled: true,
      parallel: true,
      ...options,
    });
  }

  /**
   * Build a release build command
   *
   * @param gradlewPath - Path to Gradle wrapper
   * @param androidDir - Android project directory
   * @param options - Additional options
   * @returns Release build command
   */
  static buildReleaseCommand(
    gradlewPath: string,
    androidDir: string,
    options?: Partial<GradleCommandConfig>,
  ): string {
    return this.buildCommand({
      gradlewPath,
      androidDir,
      task: 'assembleRelease',
      cacheEnabled: true,
      parallel: true,
      ...options,
    });
  }

  /**
   * Build an AAB build command
   *
   * @param gradlewPath - Path to Gradle wrapper
   * @param androidDir - Android project directory
   * @param options - Additional options
   * @returns AAB build command
   */
  static buildAABCommand(
    gradlewPath: string,
    androidDir: string,
    options?: Partial<GradleCommandConfig>,
  ): string {
    return this.buildCommand({
      gradlewPath,
      androidDir,
      task: 'bundleRelease',
      cacheEnabled: true,
      parallel: true,
      ...options,
    });
  }

  /**
   * Build a dependency resolution command
   *
   * @param gradlewPath - Path to Gradle wrapper
   * @param androidDir - Android project directory
   * @param configuration - Gradle configuration (e.g., debugRuntimeClasspath)
   * @returns Dependency resolution command
   */
  static buildDependencyCommand(
    gradlewPath: string,
    androidDir: string,
    configuration: string = 'debugRuntimeClasspath',
  ): string {
    return this.buildCommand({
      gradlewPath,
      androidDir,
      task: 'dependencies',
      additionalArgs: ['--configuration', configuration],
    });
  }

  /**
   * Build a compilation command
   *
   * @param gradlewPath - Path to Gradle wrapper
   * @param androidDir - Android project directory
   * @param variant - Build variant (debug or release)
   * @returns Compilation command
   */
  static buildCompileCommand(
    gradlewPath: string,
    androidDir: string,
    variant: 'debug' | 'release' = 'debug',
  ): string {
    const task = variant === 'debug' ? 'compileDebugSources' : 'compileReleaseSources';
    return this.buildCommand({
      gradlewPath,
      androidDir,
      task,
      cacheEnabled: true,
      parallel: true,
    });
  }

  /**
   * Build a clean command
   *
   * @param gradlewPath - Path to Gradle wrapper
   * @param androidDir - Android project directory
   * @returns Clean command
   */
  static buildCleanCommand(gradlewPath: string, androidDir: string): string {
    return this.buildCommand({
      gradlewPath,
      androidDir,
      task: 'clean',
    });
  }

  /**
   * Extract task from command
   *
   * @param command - Gradle command
   * @returns Task name
   */
  static extractTask(command: string): string {
    const parts = command.split(' ');
    // Find the task (last non-flag argument)
    for (let i = parts.length - 1; i >= 0; i--) {
      if (!parts[i].startsWith('-')) {
        return parts[i];
      }
    }
    return '';
  }

  /**
   * Check if command has cache enabled
   *
   * @param command - Gradle command
   * @returns True if cache is enabled
   */
  static hasCacheEnabled(command: string): boolean {
    return command.includes('--build-cache');
  }

  /**
   * Check if command has parallel enabled
   *
   * @param command - Gradle command
   * @returns True if parallel is enabled
   */
  static hasParallel(command: string): boolean {
    return command.includes('--parallel');
  }

  /**
   * Get cache statistics from command
   *
   * @param command - Gradle command
   * @returns Cache statistics
   */
  static getCacheStatistics(command: string): {
    cacheEnabled: boolean;
    parallelEnabled: boolean;
  } {
    return {
      cacheEnabled: this.hasCacheEnabled(command),
      parallelEnabled: this.hasParallel(command),
    };
  }
}

/**
 * Create a Gradle command builder instance
 *
 * @returns Gradle command builder instance
 */
export function createGradleCommandBuilder(): typeof GradleCommandBuilder {
  return GradleCommandBuilder;
}
