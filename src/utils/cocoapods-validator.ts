/**
 * CocoaPods Validation and Installation Module
 *
 * This module provides functions to validate CocoaPods installation,
 * verify version compatibility, parse and validate Podfile,
 * and execute pod install with output capture.
 *
 * Requirements: 2.3, 2.4, 2.5
 *
 * @module utils/cocoapods-validator
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

/**
 * Logger utility for debugging
 */
const logger = {
  debug: (message: string) => console.debug(`[cocoapods-validator] ${message}`),
  info: (message: string) => console.info(`[cocoapods-validator] ${message}`),
  warn: (message: string) => console.warn(`[cocoapods-validator] ${message}`),
  error: (message: string) => console.error(`[cocoapods-validator] ${message}`),
};

/**
 * Detect CocoaPods installation
 *
 * Checks if CocoaPods is installed and accessible in the system PATH.
 * Returns the version if found.
 *
 * @returns Object with CocoaPods installation status and version
 *
 * @example
 * ```typescript
 * const result = detectCocoaPodsInstallation();
 * if (result.isInstalled) {
 *   console.log(`CocoaPods ${result.version} is installed`);
 * } else {
 *   console.log(`Error: ${result.message}`);
 * }
 * ```
 */
export function detectCocoaPodsInstallation(): {
  isInstalled: boolean;
  version: string | null;
  message: string;
} {
  logger.debug('Detecting CocoaPods installation...');

  try {
    // Get CocoaPods version
    const output = execSync('pod --version', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();

    if (!output) {
      const message = 'CocoaPods version could not be determined';
      logger.warn(message);
      return {
        isInstalled: true,
        version: null,
        message,
      };
    }

    logger.info(`CocoaPods ${output} is installed`);
    return {
      isInstalled: true,
      version: output,
      message: `CocoaPods ${output} is installed`,
    };
  } catch (error) {
    const message = `CocoaPods not found: ${error instanceof Error ? error.message : String(error)}. Install with: sudo gem install cocoapods`;
    logger.error(message);
    return {
      isInstalled: false,
      version: null,
      message,
    };
  }
}

/**
 * Verify CocoaPods version compatibility
 *
 * Checks that the installed CocoaPods version meets minimum requirements.
 * Minimum required version is 1.11.0 for Capacitor compatibility.
 *
 * @returns Object with version compatibility status
 *
 * @example
 * ```typescript
 * const result = verifyCocoaPodsVersion();
 * if (result.isCompatible) {
 *   console.log(`CocoaPods version ${result.installedVersion} is compatible`);
 * } else {
 *   console.log(`Error: ${result.message}`);
 * }
 * ```
 */
export function verifyCocoaPodsVersion(): {
  isCompatible: boolean;
  installedVersion: string | null;
  message: string;
} {
  logger.debug('Verifying CocoaPods version compatibility...');

  const cocoaPodsInfo = detectCocoaPodsInstallation();

  if (!cocoaPodsInfo.isInstalled) {
    return {
      isCompatible: false,
      installedVersion: null,
      message: cocoaPodsInfo.message,
    };
  }

  if (!cocoaPodsInfo.version) {
    const message = 'Could not determine CocoaPods version';
    logger.error(message);
    return {
      isCompatible: false,
      installedVersion: null,
      message,
    };
  }

  // Parse version string (e.g., "1.11.0" or "1.12.1")
  const versionParts = cocoaPodsInfo.version.split('.').map((part) => parseInt(part, 10));
  const majorVersion = versionParts[0] || 0;
  const minorVersion = versionParts[1] || 0;
  const patchVersion = versionParts[2] || 0;

  // Check if version is 1.11.0 or higher
  const isCompatible =
    majorVersion > 1 || (majorVersion === 1 && minorVersion > 11) || (majorVersion === 1 && minorVersion === 11 && patchVersion >= 0);

  if (isCompatible) {
    logger.info(`CocoaPods version ${cocoaPodsInfo.version} is compatible (>= 1.11.0)`);
    return {
      isCompatible: true,
      installedVersion: cocoaPodsInfo.version,
      message: `CocoaPods version ${cocoaPodsInfo.version} is compatible (>= 1.11.0)`,
    };
  } else {
    const message = `CocoaPods version ${cocoaPodsInfo.version} is too low. Minimum required: 1.11.0. Update with: sudo gem install cocoapods`;
    logger.error(message);
    return {
      isCompatible: false,
      installedVersion: cocoaPodsInfo.version,
      message,
    };
  }
}

/**
 * Parse and validate Podfile
 *
 * Reads and validates the Podfile structure, checking for required elements
 * like platform specification and pod dependencies.
 *
 * @param podfilePath - Path to Podfile (defaults to ./ios/Podfile)
 * @returns Object with Podfile validation status and details
 *
 * @example
 * ```typescript
 * const result = parseAndValidatePodfile('./ios/Podfile');
 * if (result.isValid) {
 *   console.log(`Podfile is valid with ${result.podCount} pods`);
 * } else {
 *   console.log(`Error: ${result.message}`);
 * }
 * ```
 */
export function parseAndValidatePodfile(podfilePath?: string): {
  isValid: boolean;
  podCount: number;
  platform: string | null;
  pods: string[];
  message: string;
} {
  logger.debug('Parsing and validating Podfile...');

  const filePath = podfilePath || path.join(process.cwd(), 'ios', 'Podfile');

  if (!fs.existsSync(filePath)) {
    const message = `Podfile not found at: ${filePath}`;
    logger.error(message);
    return {
      isValid: false,
      podCount: 0,
      platform: null,
      pods: [],
      message,
    };
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    let platform: string | null = null;
    const pods: string[] = [];
    let hasPlatform = false;
    let hasPods = false;

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip comments and empty lines
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      // Look for platform specification
      if (trimmed.startsWith('platform')) {
        hasPlatform = true;
        // Extract platform and version (e.g., "platform :ios, '14.0'")
        const match = trimmed.match(/platform\s*:\s*(\w+)\s*,\s*['"]([^'"]+)['"]/);
        if (match) {
          platform = `${match[1]} ${match[2]}`;
        }
      }

      // Look for pod dependencies
      if (trimmed.startsWith('pod')) {
        hasPods = true;
        // Extract pod name (e.g., "pod 'Capacitor'" or "pod 'Firebase/Core'")
        const match = trimmed.match(/pod\s+['"]([^'"]+)['"]/);
        if (match) {
          pods.push(match[1]);
        }
      }
    }

    const isValid = hasPlatform && hasPods;

    if (isValid) {
      logger.info(`Podfile is valid with platform ${platform} and ${pods.length} pod(s)`);
      return {
        isValid: true,
        podCount: pods.length,
        platform,
        pods,
        message: `Podfile is valid with platform ${platform} and ${pods.length} pod(s)`,
      };
    } else {
      const message = `Podfile is incomplete: ${!hasPlatform ? 'missing platform specification' : ''} ${!hasPods ? 'missing pod dependencies' : ''}`;
      logger.error(message);
      return {
        isValid: false,
        podCount: pods.length,
        platform,
        pods,
        message,
      };
    }
  } catch (error) {
    const message = `Error parsing Podfile: ${error instanceof Error ? error.message : String(error)}`;
    logger.error(message);
    return {
      isValid: false,
      podCount: 0,
      platform: null,
      pods: [],
      message,
    };
  }
}

/**
 * Execute pod install and capture output
 *
 * Runs the `pod install` command in the specified directory and captures
 * the output for analysis. This installs all CocoaPods dependencies.
 *
 * @param iosProjectPath - Path to iOS project directory (defaults to ./ios)
 * @returns Object with pod install execution status and output
 *
 * @example
 * ```typescript
 * const result = executePodInstall('./ios');
 * if (result.success) {
 *   console.log('Pod install completed successfully');
 *   console.log(result.output);
 * } else {
 *   console.log(`Error: ${result.message}`);
 *   console.log(result.output);
 * }
 * ```
 */
export function executePodInstall(iosProjectPath?: string): {
  success: boolean;
  output: string;
  message: string;
} {
  logger.debug('Executing pod install...');

  const projectPath = iosProjectPath || path.join(process.cwd(), 'ios');

  // Check if Podfile exists
  const podfilePath = path.join(projectPath, 'Podfile');
  if (!fs.existsSync(podfilePath)) {
    const message = `Podfile not found at: ${podfilePath}`;
    logger.error(message);
    return {
      success: false,
      output: '',
      message,
    };
  }

  try {
    logger.info(`Running pod install in ${projectPath}...`);

    // Execute pod install in the iOS project directory
    const output = execSync('pod install', {
      cwd: projectPath,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    logger.info('Pod install completed successfully');
    return {
      success: true,
      output,
      message: 'Pod install completed successfully',
    };
  } catch (error) {
    const errorOutput = error instanceof Error ? error.message : String(error);
    const message = `Pod install failed: ${errorOutput}`;
    logger.error(message);

    return {
      success: false,
      output: errorOutput,
      message,
    };
  }
}

/**
 * Comprehensive validation of CocoaPods setup
 *
 * Runs all CocoaPods validation checks including installation,
 * version compatibility, and Podfile validation.
 *
 * @param iosProjectPath - Path to iOS project directory (defaults to ./ios)
 * @returns Object with comprehensive validation results
 *
 * @example
 * ```typescript
 * const result = validateCocoaPodsSetup('./ios');
 * if (result.isValid) {
 *   console.log('CocoaPods setup is valid');
 * } else {
 *   console.log(`Validation failed: ${result.message}`);
 * }
 * ```
 */
export function validateCocoaPodsSetup(iosProjectPath?: string): {
  isValid: boolean;
  isInstalled: boolean;
  isCompatible: boolean;
  podfileValid: boolean;
  message: string;
} {
  logger.debug('Validating CocoaPods setup...');

  const projectPath = iosProjectPath || path.join(process.cwd(), 'ios');

  // Check 1: CocoaPods Installation
  const cocoaPodsInfo = detectCocoaPodsInstallation();
  const isInstalled = cocoaPodsInfo.isInstalled;

  // Check 2: Version Compatibility
  const versionInfo = verifyCocoaPodsVersion();
  const isCompatible = versionInfo.isCompatible;

  // Check 3: Podfile Validation
  const podfileInfo = parseAndValidatePodfile(path.join(projectPath, 'Podfile'));
  const podfileValid = podfileInfo.isValid;

  const isValid = isInstalled && isCompatible && podfileValid;

  let message = '';
  if (isValid) {
    message = 'CocoaPods setup is valid and ready for pod install';
  } else {
    const issues: string[] = [];
    if (!isInstalled) issues.push('CocoaPods not installed');
    if (!isCompatible) issues.push('CocoaPods version incompatible');
    if (!podfileValid) issues.push('Podfile invalid');
    message = `CocoaPods setup validation failed: ${issues.join(', ')}`;
  }

  logger.info(message);

  return {
    isValid,
    isInstalled,
    isCompatible,
    podfileValid,
    message,
  };
}
