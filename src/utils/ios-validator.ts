/**
 * iOS SDK and Xcode Validation Module
 *
 * This module provides functions to validate iOS development environment setup,
 * including Xcode installation and version verification, iOS SDK detection,
 * and SDK version validation.
 *
 * Requirements: 2.1, 2.2
 *
 * @module utils/ios-validator
 */

import { execSync } from 'child_process';
import { ValidationResult, ValidationStatus, ValidationCategory, ValidationCheck } from '../types/mobile-config';

/**
 * Logger utility for debugging
 */
const logger = {
  debug: (message: string) => console.debug(`[ios-validator] ${message}`),
  info: (message: string) => console.info(`[ios-validator] ${message}`),
  warn: (message: string) => console.warn(`[ios-validator] ${message}`),
  error: (message: string) => console.error(`[ios-validator] ${message}`),
};

/**
 * Detect Xcode installation and version
 *
 * Uses xcode-select to find the Xcode installation path and extracts
 * the version from the Xcode bundle.
 *
 * @returns Object with Xcode installation status and version
 *
 * @example
 * ```typescript
 * const result = detectXcodeInstallation();
 * if (result.isInstalled) {
 *   console.log(`Xcode ${result.version} is installed at ${result.path}`);
 * } else {
 *   console.log(`Error: ${result.message}`);
 * }
 * ```
 */
export function detectXcodeInstallation(): {
  isInstalled: boolean;
  path: string | null;
  version: string | null;
  message: string;
} {
  logger.debug('Detecting Xcode installation...');

  try {
    // Get Xcode path using xcode-select
    const xcodeSelectPath = execSync('xcode-select -p', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();

    if (!xcodeSelectPath) {
      const message = 'Xcode path not found. Please install Xcode or run: xcode-select --install';
      logger.error(message);
      return {
        isInstalled: false,
        path: null,
        version: null,
        message,
      };
    }

    logger.info(`Xcode found at: ${xcodeSelectPath}`);

    // Get Xcode version
    try {
      const versionOutput = execSync('xcodebuild -version', {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // Parse version from output (format: "Xcode 15.0\nBuild 15A240d")
      const versionMatch = versionOutput.match(/Xcode\s+([\d.]+)/);
      const version = versionMatch ? versionMatch[1] : null;

      if (version) {
        logger.info(`Xcode version: ${version}`);
        return {
          isInstalled: true,
          path: xcodeSelectPath,
          version,
          message: `Xcode ${version} is installed at ${xcodeSelectPath}`,
        };
      } else {
        const message = 'Could not determine Xcode version';
        logger.warn(message);
        return {
          isInstalled: true,
          path: xcodeSelectPath,
          version: null,
          message,
        };
      }
    } catch (error) {
      const message = `Error getting Xcode version: ${error instanceof Error ? error.message : String(error)}`;
      logger.error(message);
      return {
        isInstalled: true,
        path: xcodeSelectPath,
        version: null,
        message,
      };
    }
  } catch (error) {
    const message = `Xcode not found: ${error instanceof Error ? error.message : String(error)}`;
    logger.error(message);
    return {
      isInstalled: false,
      path: null,
      version: null,
      message,
    };
  }
}

/**
 * Verify Xcode version is 15.0 or higher
 *
 * Checks that the installed Xcode version meets the minimum requirement.
 *
 * @returns Object with version verification status
 *
 * @example
 * ```typescript
 * const result = verifyXcodeVersion();
 * if (result.isValid) {
 *   console.log(`Xcode version ${result.installedVersion} is valid`);
 * } else {
 *   console.log(`Error: ${result.message}`);
 * }
 * ```
 */
export function verifyXcodeVersion(): {
  isValid: boolean;
  installedVersion: string | null;
  message: string;
} {
  logger.debug('Verifying Xcode version...');

  const xcodeInfo = detectXcodeInstallation();

  if (!xcodeInfo.isInstalled) {
    return {
      isValid: false,
      installedVersion: null,
      message: xcodeInfo.message,
    };
  }

  if (!xcodeInfo.version) {
    const message = 'Could not determine Xcode version';
    logger.error(message);
    return {
      isValid: false,
      installedVersion: null,
      message,
    };
  }

  // Parse version string (e.g., "15.0" or "15.0.1")
  const versionParts = xcodeInfo.version.split('.').map((part) => parseInt(part, 10));
  const majorVersion = versionParts[0] || 0;
  const minorVersion = versionParts[1] || 0;

  // Check if version is 15.0 or higher
  const isValid = majorVersion > 15 || (majorVersion === 15 && minorVersion >= 0);

  if (isValid) {
    logger.info(`Xcode version ${xcodeInfo.version} is valid (>= 15.0)`);
    return {
      isValid: true,
      installedVersion: xcodeInfo.version,
      message: `Xcode version ${xcodeInfo.version} is valid (>= 15.0)`,
    };
  } else {
    const message = `Xcode version ${xcodeInfo.version} is too low. Minimum required: 15.0`;
    logger.error(message);
    return {
      isValid: false,
      installedVersion: xcodeInfo.version,
      message,
    };
  }
}

/**
 * Detect available iOS SDKs
 *
 * Lists all iOS SDKs available in the Xcode installation.
 *
 * @returns Object with list of available iOS SDKs
 *
 * @example
 * ```typescript
 * const result = detectAvailableIosSdks();
 * if (result.sdks.length > 0) {
 *   console.log(`Available iOS SDKs: ${result.sdks.join(', ')}`);
 * } else {
 *   console.log(`Error: ${result.message}`);
 * }
 * ```
 */
export function detectAvailableIosSdks(): {
  sdks: string[];
  message: string;
} {
  logger.debug('Detecting available iOS SDKs...');

  try {
    // Get list of iOS SDKs using xcodebuild
    const output = execSync('xcodebuild -showsdks', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Parse output to extract iOS SDK versions
    // Format: "iOS SDKs:\n\t-sdk iphoneos14.0\n\t-sdk iphoneos15.0"
    const lines = output.split('\n');
    const sdks: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      // Look for lines containing "iphoneos" (iOS SDK indicator)
      if (trimmed.includes('iphoneos')) {
        // Extract version number from "-sdk iphoneos14.0" format
        const match = trimmed.match(/iphoneos([\d.]+)/);
        if (match && match[1]) {
          sdks.push(match[1]);
        }
      }
    }

    if (sdks.length === 0) {
      const message = 'No iOS SDKs found. Please install Xcode with iOS SDK support.';
      logger.warn(message);
      return {
        sdks: [],
        message,
      };
    }

    // Sort versions in descending order
    sdks.sort((a, b) => {
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

    logger.info(`Found ${sdks.length} iOS SDK(s): ${sdks.join(', ')}`);
    return {
      sdks,
      message: `Found ${sdks.length} iOS SDK(s): ${sdks.join(', ')}`,
    };
  } catch (error) {
    const message = `Error detecting iOS SDKs: ${error instanceof Error ? error.message : String(error)}`;
    logger.error(message);
    return {
      sdks: [],
      message,
    };
  }
}

/**
 * Verify iOS SDK 14.0+ is available
 *
 * Checks that at least one iOS SDK version 14.0 or higher is installed.
 *
 * @returns Object with iOS SDK verification status
 *
 * @example
 * ```typescript
 * const result = verifyIosSdkVersion();
 * if (result.isValid) {
 *   console.log(`iOS SDK ${result.installedVersion} is available`);
 * } else {
 *   console.log(`Error: ${result.message}`);
 * }
 * ```
 */
export function verifyIosSdkVersion(): {
  isValid: boolean;
  installedVersion: string | null;
  message: string;
} {
  logger.debug('Verifying iOS SDK version...');

  const sdksInfo = detectAvailableIosSdks();

  if (sdksInfo.sdks.length === 0) {
    return {
      isValid: false,
      installedVersion: null,
      message: sdksInfo.message,
    };
  }

  // Find the highest version that meets the requirement
  let validSdk: string | null = null;

  for (const sdk of sdksInfo.sdks) {
    const versionParts = sdk.split('.').map((part) => parseInt(part, 10));
    const majorVersion = versionParts[0] || 0;
    const minorVersion = versionParts[1] || 0;

    // Check if version is 14.0 or higher
    if (majorVersion > 14 || (majorVersion === 14 && minorVersion >= 0)) {
      validSdk = sdk;
      break;
    }
  }

  if (validSdk) {
    logger.info(`iOS SDK ${validSdk} is valid (>= 14.0)`);
    return {
      isValid: true,
      installedVersion: validSdk,
      message: `iOS SDK ${validSdk} is available and meets requirement (>= 14.0)`,
    };
  } else {
    const message = `No iOS SDK version 14.0 or higher found. Available: ${sdksInfo.sdks.join(', ')}`;
    logger.error(message);
    return {
      isValid: false,
      installedVersion: sdksInfo.sdks[0] || null,
      message,
    };
  }
}

/**
 * Comprehensive validation of iOS development environment
 *
 * Runs all iOS validation checks and returns a complete validation result
 * with status for each check and overall validation status.
 *
 * @returns Complete validation result with all checks
 *
 * @example
 * ```typescript
 * const result = validateIosEnvironment();
 * console.log(`Overall status: ${result.overallStatus}`);
 * result.checks.forEach(check => {
 *   console.log(`${check.name}: ${check.status}`);
 * });
 * ```
 */
export function validateIosEnvironment(): ValidationResult {
  logger.info('Starting comprehensive iOS environment validation...');

  const checks: ValidationCheck[] = [];

  // Check 1: Xcode Installation
  const xcodeInfo = detectXcodeInstallation();
  checks.push({
    name: 'Xcode Installation',
    category: ValidationCategory.Environment,
    status: xcodeInfo.isInstalled ? ValidationStatus.Pass : ValidationStatus.Fail,
    message: xcodeInfo.message,
    remediation: !xcodeInfo.isInstalled
      ? 'Install Xcode from App Store or run: xcode-select --install'
      : undefined,
    documentationLink: 'https://developer.apple.com/xcode/',
  });

  // Check 2: Xcode Version
  const xcodeVersionResult = verifyXcodeVersion();
  checks.push({
    name: 'Xcode Version 15.0+',
    category: ValidationCategory.Environment,
    status: xcodeVersionResult.isValid ? ValidationStatus.Pass : ValidationStatus.Fail,
    message: xcodeVersionResult.message,
    remediation: !xcodeVersionResult.isValid
      ? 'Update Xcode to version 15.0 or higher from App Store'
      : undefined,
    documentationLink: 'https://developer.apple.com/download/all/',
  });

  // Check 3: iOS SDK Detection
  const iosSdksInfo = detectAvailableIosSdks();
  checks.push({
    name: 'iOS SDK Detection',
    category: ValidationCategory.Environment,
    status: iosSdksInfo.sdks.length > 0 ? ValidationStatus.Pass : ValidationStatus.Fail,
    message: iosSdksInfo.message,
    remediation:
      iosSdksInfo.sdks.length === 0
        ? 'Install iOS SDK through Xcode: Xcode > Preferences > Platforms > iOS'
        : undefined,
    documentationLink: 'https://developer.apple.com/download/all/',
  });

  // Check 4: iOS SDK Version
  const iosSdkVersionResult = verifyIosSdkVersion();
  checks.push({
    name: 'iOS SDK 14.0+',
    category: ValidationCategory.Environment,
    status: iosSdkVersionResult.isValid ? ValidationStatus.Pass : ValidationStatus.Fail,
    message: iosSdkVersionResult.message,
    remediation: !iosSdkVersionResult.isValid
      ? 'Install iOS SDK version 14.0 or higher through Xcode'
      : undefined,
    documentationLink: 'https://developer.apple.com/download/all/',
  });

  // Determine overall status
  const failedChecks = checks.filter((check) => check.status === ValidationStatus.Fail);
  const overallStatus = failedChecks.length === 0 ? ValidationStatus.Pass : ValidationStatus.Fail;

  const summary =
    failedChecks.length === 0
      ? 'iOS development environment is properly configured'
      : `iOS development environment validation failed: ${failedChecks.length} check(s) failed`;

  logger.info(`Validation complete. Overall status: ${overallStatus}`);

  return {
    timestamp: new Date(),
    overallStatus,
    checks,
    summary,
  };
}
