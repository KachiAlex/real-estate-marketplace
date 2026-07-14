/**
 * Android SDK Validation Module
 *
 * This module provides functions to validate Android development environment setup,
 * including SDK installation, API level verification, build-tools version checking,
 * and local.properties file validation.
 *
 * @module utils/android-validator
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { ValidationResult, ValidationStatus, ValidationCategory, ValidationCheck, Platform } from '../types/mobile-config';

/**
 * Logger utility for debugging
 */
const logger = {
  debug: (message: string) => console.debug(`[android-validator] ${message}`),
  info: (message: string) => console.info(`[android-validator] ${message}`),
  warn: (message: string) => console.warn(`[android-validator] ${message}`),
  error: (message: string) => console.error(`[android-validator] ${message}`),
};

/**
 * Get common Android SDK installation paths based on operating system
 *
 * @returns Array of common Android SDK paths to check
 */
function getCommonAndroidSdkPaths(): string[] {
  const platform = process.platform;
  const home = process.env.HOME || process.env.USERPROFILE || '';

  if (platform === 'darwin') {
    // macOS paths
    return [
      path.join(home, 'Library/Android/sdk'),
      '/Library/Android/sdk',
      path.join(home, '.android/sdk'),
    ];
  } else if (platform === 'linux') {
    // Linux paths
    return [
      path.join(home, 'Android/Sdk'),
      path.join(home, '.android/sdk'),
      '/opt/android-sdk',
      '/usr/local/android-sdk',
    ];
  } else if (platform === 'win32') {
    // Windows paths
    return [
      path.join(home, 'AppData/Local/Android/Sdk'),
      'C:\\Android\\sdk',
      'C:\\Program Files\\Android\\sdk',
      'C:\\Program Files (x86)\\Android\\sdk',
    ];
  }

  return [];
}

/**
 * Detect Android SDK installation path from environment variables or common locations
 *
 * Checks ANDROID_SDK_ROOT and ANDROID_HOME environment variables first,
 * then searches common installation paths for the current operating system.
 *
 * @returns The path to the Android SDK, or null if not found
 * @throws Error if SDK path is found but not accessible
 *
 * @example
 * ```typescript
 * const sdkPath = detectAndroidSdkPath();
 * if (sdkPath) {
 *   console.log(`Android SDK found at: ${sdkPath}`);
 * } else {
 *   console.log('Android SDK not found');
 * }
 * ```
 */
export function detectAndroidSdkPath(): string | null {
  logger.debug('Detecting Android SDK path...');

  // Check environment variables first
  const envSdkRoot = process.env.ANDROID_SDK_ROOT;
  if (envSdkRoot && fs.existsSync(envSdkRoot)) {
    logger.info(`Android SDK found via ANDROID_SDK_ROOT: ${envSdkRoot}`);
    return envSdkRoot;
  }

  const envAndroidHome = process.env.ANDROID_HOME;
  if (envAndroidHome && fs.existsSync(envAndroidHome)) {
    logger.info(`Android SDK found via ANDROID_HOME: ${envAndroidHome}`);
    return envAndroidHome;
  }

  // Check common paths
  const commonPaths = getCommonAndroidSdkPaths();
  for (const sdkPath of commonPaths) {
    if (fs.existsSync(sdkPath)) {
      logger.info(`Android SDK found at common path: ${sdkPath}`);
      return sdkPath;
    }
  }

  logger.warn('Android SDK not found in environment variables or common paths');
  return null;
}

/**
 * Verify that Android SDK API level 34+ is installed
 *
 * Checks the platforms directory in the Android SDK to verify that
 * API level 34 or higher is installed.
 *
 * @param sdkPath - Path to the Android SDK (auto-detected if not provided)
 * @returns Object with verification status and details
 * @throws Error if SDK path is invalid or not accessible
 *
 * @example
 * ```typescript
 * const result = verifyAndroidSdkVersion();
 * if (result.isValid) {
 *   console.log(`Android SDK API level ${result.installedLevel} is valid`);
 * } else {
 *   console.log(`Error: ${result.message}`);
 * }
 * ```
 */
export function verifyAndroidSdkVersion(sdkPath?: string): {
  isValid: boolean;
  installedLevel: number | null;
  message: string;
} {
  logger.debug('Verifying Android SDK version...');

  const sdk = sdkPath || detectAndroidSdkPath();
  if (!sdk) {
    const message = 'Android SDK not found. Please install Android SDK or set ANDROID_SDK_ROOT environment variable.';
    logger.error(message);
    return {
      isValid: false,
      installedLevel: null,
      message,
    };
  }

  if (!fs.existsSync(sdk)) {
    const message = `Android SDK path does not exist: ${sdk}`;
    logger.error(message);
    return {
      isValid: false,
      installedLevel: null,
      message,
    };
  }

  const platformsDir = path.join(sdk, 'platforms');
  if (!fs.existsSync(platformsDir)) {
    const message = `Android SDK platforms directory not found at: ${platformsDir}`;
    logger.error(message);
    return {
      isValid: false,
      installedLevel: null,
      message,
    };
  }

  try {
    const platforms = fs.readdirSync(platformsDir);
    const apiLevels = platforms
      .filter((dir) => dir.startsWith('android-'))
      .map((dir) => parseInt(dir.replace('android-', ''), 10))
      .filter((level) => !isNaN(level))
      .sort((a, b) => b - a);

    if (apiLevels.length === 0) {
      const message = 'No Android SDK platforms found. Please install at least API level 34.';
      logger.error(message);
      return {
        isValid: false,
        installedLevel: null,
        message,
      };
    }

    const highestLevel = apiLevels[0];
    const isValid = highestLevel >= 34;

    if (isValid) {
      logger.info(`Android SDK API level ${highestLevel} is valid (>= 34)`);
      return {
        isValid: true,
        installedLevel: highestLevel,
        message: `Android SDK API level ${highestLevel} is installed and meets requirement (>= 34)`,
      };
    } else {
      const message = `Android SDK API level ${highestLevel} is too low. Minimum required: 34`;
      logger.error(message);
      return {
        isValid: false,
        installedLevel: highestLevel,
        message,
      };
    }
  } catch (error) {
    const message = `Error reading Android SDK platforms: ${error instanceof Error ? error.message : String(error)}`;
    logger.error(message);
    return {
      isValid: false,
      installedLevel: null,
      message,
    };
  }
}

/**
 * Verify that build-tools version 34.0.0+ is installed
 *
 * Checks the build-tools directory in the Android SDK to verify that
 * build-tools version 34.0.0 or higher is installed.
 *
 * @param sdkPath - Path to the Android SDK (auto-detected if not provided)
 * @returns Object with verification status and details
 * @throws Error if SDK path is invalid or not accessible
 *
 * @example
 * ```typescript
 * const result = verifyBuildToolsVersion();
 * if (result.isValid) {
 *   console.log(`Build-tools version ${result.installedVersion} is valid`);
 * } else {
 *   console.log(`Error: ${result.message}`);
 * }
 * ```
 */
export function verifyBuildToolsVersion(sdkPath?: string): {
  isValid: boolean;
  installedVersion: string | null;
  message: string;
} {
  logger.debug('Verifying build-tools version...');

  const sdk = sdkPath || detectAndroidSdkPath();
  if (!sdk) {
    const message = 'Android SDK not found. Please install Android SDK or set ANDROID_SDK_ROOT environment variable.';
    logger.error(message);
    return {
      isValid: false,
      installedVersion: null,
      message,
    };
  }

  if (!fs.existsSync(sdk)) {
    const message = `Android SDK path does not exist: ${sdk}`;
    logger.error(message);
    return {
      isValid: false,
      installedVersion: null,
      message,
    };
  }

  const buildToolsDir = path.join(sdk, 'build-tools');
  if (!fs.existsSync(buildToolsDir)) {
    const message = `Android SDK build-tools directory not found at: ${buildToolsDir}`;
    logger.error(message);
    return {
      isValid: false,
      installedVersion: null,
      message,
    };
  }

  try {
    const versions = fs.readdirSync(buildToolsDir);
    if (versions.length === 0) {
      const message = 'No build-tools versions found. Please install build-tools version 34.0.0 or higher.';
      logger.error(message);
      return {
        isValid: false,
        installedVersion: null,
        message,
      };
    }

    // Sort versions to find the highest one
    const sortedVersions = versions.sort((a, b) => {
      const aParts = a.split('.').map((p) => parseInt(p, 10));
      const bParts = b.split('.').map((p) => parseInt(p, 10));

      for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const aPart = aParts[i] || 0;
        const bPart = bParts[i] || 0;
        if (aPart !== bPart) {
          return bPart - aPart;
        }
      }
      return 0;
    });

    const highestVersion = sortedVersions[0];
    const versionParts = highestVersion.split('.').map((p) => parseInt(p, 10));
    const majorVersion = versionParts[0] || 0;

    const isValid = majorVersion >= 34;

    if (isValid) {
      logger.info(`Build-tools version ${highestVersion} is valid (>= 34.0.0)`);
      return {
        isValid: true,
        installedVersion: highestVersion,
        message: `Build-tools version ${highestVersion} is installed and meets requirement (>= 34.0.0)`,
      };
    } else {
      const message = `Build-tools version ${highestVersion} is too low. Minimum required: 34.0.0`;
      logger.error(message);
      return {
        isValid: false,
        installedVersion: highestVersion,
        message,
      };
    }
  } catch (error) {
    const message = `Error reading build-tools versions: ${error instanceof Error ? error.message : String(error)}`;
    logger.error(message);
    return {
      isValid: false,
      installedVersion: null,
      message,
    };
  }
}

/**
 * Validate local.properties file with correct SDK paths
 *
 * Checks that the local.properties file exists in the Android project directory,
 * contains the sdk.dir property, and that the path points to a valid Android SDK.
 *
 * @param projectPath - Path to the Android project (defaults to ./android)
 * @returns Object with validation status and details
 *
 * @example
 * ```typescript
 * const result = validateLocalProperties('./android');
 * if (result.isValid) {
 *   console.log(`local.properties is valid`);
 * } else {
 *   console.log(`Error: ${result.message}`);
 * }
 * ```
 */
export function validateLocalProperties(projectPath?: string): {
  isValid: boolean;
  sdkPath: string | null;
  message: string;
} {
  logger.debug('Validating local.properties file...');

  const androidProjectPath = projectPath || path.join(process.cwd(), 'android');
  const localPropertiesPath = path.join(androidProjectPath, 'local.properties');

  if (!fs.existsSync(localPropertiesPath)) {
    const message = `local.properties file not found at: ${localPropertiesPath}`;
    logger.error(message);
    return {
      isValid: false,
      sdkPath: null,
      message,
    };
  }

  try {
    const content = fs.readFileSync(localPropertiesPath, 'utf-8');
    const lines = content.split('\n');
    let sdkPath: string | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      // Handle both "sdk.dir=path" and "sdk.dir = path" formats
      if (trimmed.startsWith('sdk.dir')) {
        const parts = trimmed.split('=');
        if (parts.length >= 2) {
          sdkPath = parts.slice(1).join('=').trim();
          break;
        }
      }
    }

    if (!sdkPath) {
      const message = 'sdk.dir property not found in local.properties';
      logger.error(message);
      return {
        isValid: false,
        sdkPath: null,
        message,
      };
    }

    // Expand ~ to home directory if present
    const expandedSdkPath = sdkPath.startsWith('~')
      ? path.join(process.env.HOME || process.env.USERPROFILE || '', sdkPath.slice(1))
      : sdkPath;

    if (!fs.existsSync(expandedSdkPath)) {
      const message = `SDK path in local.properties does not exist: ${expandedSdkPath}`;
      logger.error(message);
      return {
        isValid: false,
        sdkPath,
        message,
      };
    }

    // Verify it's a valid Android SDK by checking for platforms directory
    const platformsDir = path.join(expandedSdkPath, 'platforms');
    if (!fs.existsSync(platformsDir)) {
      const message = `SDK path does not contain platforms directory: ${expandedSdkPath}`;
      logger.error(message);
      return {
        isValid: false,
        sdkPath,
        message,
      };
    }

    logger.info(`local.properties is valid with SDK path: ${expandedSdkPath}`);
    return {
      isValid: true,
      sdkPath: expandedSdkPath,
      message: `local.properties is valid with SDK path: ${expandedSdkPath}`,
    };
  } catch (error) {
    const message = `Error reading local.properties: ${error instanceof Error ? error.message : String(error)}`;
    logger.error(message);
    return {
      isValid: false,
      sdkPath: null,
      message,
    };
  }
}

/**
 * Comprehensive validation of Android development environment
 *
 * Runs all Android validation checks and returns a complete validation result
 * with status for each check and overall validation status.
 *
 * @param projectPath - Path to the Android project (defaults to ./android)
 * @returns Complete validation result with all checks
 *
 * @example
 * ```typescript
 * const result = validateAndroidEnvironment('./android');
 * console.log(`Overall status: ${result.overallStatus}`);
 * result.checks.forEach(check => {
 *   console.log(`${check.name}: ${check.status}`);
 * });
 * ```
 */
export function validateAndroidEnvironment(projectPath?: string): ValidationResult {
  logger.info('Starting comprehensive Android environment validation...');

  const checks: ValidationCheck[] = [];
  const androidProjectPath = projectPath || path.join(process.cwd(), 'android');

  // Check 1: Android SDK Detection
  const sdkPath = detectAndroidSdkPath();
  checks.push({
    name: 'Android SDK Detection',
    category: ValidationCategory.Environment,
    status: sdkPath ? ValidationStatus.Pass : ValidationStatus.Fail,
    message: sdkPath
      ? `Android SDK found at: ${sdkPath}`
      : 'Android SDK not found. Please install Android SDK or set ANDROID_SDK_ROOT environment variable.',
    remediation: !sdkPath
      ? 'Install Android SDK from https://developer.android.com/studio or set ANDROID_SDK_ROOT environment variable'
      : undefined,
    documentationLink: 'https://developer.android.com/studio/install',
  });

  // Check 2: Android SDK API Level
  const sdkVersionResult = verifyAndroidSdkVersion(sdkPath || undefined);
  checks.push({
    name: 'Android SDK API Level 34+',
    category: ValidationCategory.Environment,
    status: sdkVersionResult.isValid ? ValidationStatus.Pass : ValidationStatus.Fail,
    message: sdkVersionResult.message,
    remediation: !sdkVersionResult.isValid
      ? 'Install Android SDK API level 34 or higher using Android SDK Manager'
      : undefined,
    documentationLink: 'https://developer.android.com/studio/releases/platforms',
  });

  // Check 3: Build-tools Version
  const buildToolsResult = verifyBuildToolsVersion(sdkPath || undefined);
  checks.push({
    name: 'Build-tools Version 34.0.0+',
    category: ValidationCategory.Environment,
    status: buildToolsResult.isValid ? ValidationStatus.Pass : ValidationStatus.Fail,
    message: buildToolsResult.message,
    remediation: !buildToolsResult.isValid
      ? 'Install build-tools version 34.0.0 or higher using Android SDK Manager'
      : undefined,
    documentationLink: 'https://developer.android.com/studio/releases/build-tools',
  });

  // Check 4: local.properties Validation
  const localPropertiesResult = validateLocalProperties(androidProjectPath);
  checks.push({
    name: 'local.properties Configuration',
    category: ValidationCategory.Configuration,
    status: localPropertiesResult.isValid ? ValidationStatus.Pass : ValidationStatus.Fail,
    message: localPropertiesResult.message,
    remediation: !localPropertiesResult.isValid
      ? `Create or update local.properties in ${androidProjectPath} with: sdk.dir=${sdkPath || '/path/to/android/sdk'}`
      : undefined,
    documentationLink: 'https://developer.android.com/studio/command-line/variables',
  });

  // Determine overall status
  const failedChecks = checks.filter((check) => check.status === ValidationStatus.Fail);
  const overallStatus = failedChecks.length === 0 ? ValidationStatus.Pass : ValidationStatus.Fail;

  const summary =
    failedChecks.length === 0
      ? 'Android development environment is properly configured'
      : `Android development environment validation failed: ${failedChecks.length} check(s) failed`;

  logger.info(`Validation complete. Overall status: ${overallStatus}`);

  return {
    timestamp: new Date(),
    overallStatus,
    checks,
    summary,
  };
}
