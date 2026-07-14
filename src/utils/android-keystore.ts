/**
 * Android Keystore Management Module
 *
 * This module provides functions to manage Android keystores, including
 * checking keystore accessibility, validating passwords, extracting key aliases,
 * and verifying keystore configuration in build.gradle.
 *
 * Requirements: 4.1, 4.3, 4.4
 *
 * @module utils/android-keystore
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

/**
 * Logger utility for debugging
 */
const logger = {
  debug: (message: string) => console.debug(`[android-keystore] ${message}`),
  info: (message: string) => console.info(`[android-keystore] ${message}`),
  warn: (message: string) => console.warn(`[android-keystore] ${message}`),
  error: (message: string) => console.error(`[android-keystore] ${message}`),
};

/**
 * Check if keystore file exists and is accessible
 *
 * Verifies that the keystore file exists at the specified path and is readable.
 * Expands ~ to home directory if present.
 *
 * @param keystorePath - Path to the keystore file
 * @returns Object with accessibility status and details
 *
 * @example
 * ```typescript
 * const result = checkKeystoreAccessibility('~/.android/release.keystore');
 * if (result.isAccessible) {
 *   console.log('Keystore is accessible');
 * } else {
 *   console.log(`Error: ${result.message}`);
 * }
 * ```
 */
export function checkKeystoreAccessibility(keystorePath: string): {
  isAccessible: boolean;
  expandedPath: string | null;
  message: string;
} {
  logger.debug(`Checking keystore accessibility: ${keystorePath}`);

  if (!keystorePath) {
    const message = 'Keystore path is required';
    logger.error(message);
    return {
      isAccessible: false,
      expandedPath: null,
      message,
    };
  }

  // Expand ~ to home directory
  const expandedPath = keystorePath.startsWith('~')
    ? path.join(process.env.HOME || process.env.USERPROFILE || '', keystorePath.slice(1))
    : keystorePath;

  if (!fs.existsSync(expandedPath)) {
    const message = `Keystore file not found at: ${expandedPath}`;
    logger.error(message);
    return {
      isAccessible: false,
      expandedPath,
      message,
    };
  }

  try {
    // Check if file is readable
    fs.accessSync(expandedPath, fs.constants.R_OK);
    logger.info(`Keystore is accessible at: ${expandedPath}`);
    return {
      isAccessible: true,
      expandedPath,
      message: `Keystore file is accessible at: ${expandedPath}`,
    };
  } catch (error) {
    const message = `Keystore file is not readable: ${error instanceof Error ? error.message : String(error)}`;
    logger.error(message);
    return {
      isAccessible: false,
      expandedPath,
      message,
    };
  }
}

/**
 * Validate keystore password
 *
 * Attempts to list the keystore contents using the provided password.
 * This validates that the password is correct without modifying the keystore.
 *
 * Requires keytool to be available in PATH (part of Java JDK).
 *
 * @param keystorePath - Path to the keystore file
 * @param keystorePassword - Password for the keystore
 * @returns Object with validation status and details
 *
 * @example
 * ```typescript
 * const result = validateKeystorePassword('~/.android/release.keystore', 'mypassword');
 * if (result.isValid) {
 *   console.log('Keystore password is valid');
 * } else {
 *   console.log(`Error: ${result.message}`);
 * }
 * ```
 */
export function validateKeystorePassword(keystorePath: string, keystorePassword: string): {
  isValid: boolean;
  message: string;
} {
  logger.debug('Validating keystore password...');

  // First check if keystore is accessible
  const accessibilityCheck = checkKeystoreAccessibility(keystorePath);
  if (!accessibilityCheck.isAccessible) {
    return {
      isValid: false,
      message: accessibilityCheck.message,
    };
  }

  if (!keystorePassword) {
    const message = 'Keystore password is required';
    logger.error(message);
    return {
      isValid: false,
      message,
    };
  }

  try {
    // Use keytool to list keystore contents with the provided password
    // This validates the password without modifying the keystore
    const expandedPath = accessibilityCheck.expandedPath!;
    execSync(`keytool -list -v -keystore "${expandedPath}" -storepass "${keystorePassword}" -noprompt`, {
      stdio: 'pipe',
    });

    logger.info('Keystore password is valid');
    return {
      isValid: true,
      message: 'Keystore password is valid',
    };
  } catch (error) {
    const message = `Keystore password validation failed: ${error instanceof Error ? error.message : String(error)}`;
    logger.error(message);
    return {
      isValid: false,
      message,
    };
  }
}

/**
 * Extract key alias from keystore
 *
 * Lists all key aliases in the keystore and returns them.
 * Requires the keystore password to be valid.
 *
 * @param keystorePath - Path to the keystore file
 * @param keystorePassword - Password for the keystore
 * @returns Object with list of key aliases and details
 *
 * @example
 * ```typescript
 * const result = extractKeyAlias('~/.android/release.keystore', 'mypassword');
 * if (result.aliases.length > 0) {
 *   console.log(`Found aliases: ${result.aliases.join(', ')}`);
 * } else {
 *   console.log(`Error: ${result.message}`);
 * }
 * ```
 */
export function extractKeyAlias(keystorePath: string, keystorePassword: string): {
  aliases: string[];
  message: string;
} {
  logger.debug('Extracting key aliases from keystore...');

  // First validate the password
  const passwordCheck = validateKeystorePassword(keystorePath, keystorePassword);
  if (!passwordCheck.isValid) {
    return {
      aliases: [],
      message: passwordCheck.message,
    };
  }

  try {
    const expandedPath = keystorePath.startsWith('~')
      ? path.join(process.env.HOME || process.env.USERPROFILE || '', keystorePath.slice(1))
      : keystorePath;

    // Use keytool to list all aliases in the keystore
    const output = execSync(`keytool -list -keystore "${expandedPath}" -storepass "${keystorePassword}" -noprompt`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Parse the output to extract aliases
    // keytool output format: "alias_name, <date>, PrivateKeyEntry, Certificate fingerprint"
    const lines = output.split('\n');
    const aliases: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      // Skip empty lines and header lines
      if (
        !trimmed ||
        trimmed.startsWith('Keystore type') ||
        trimmed.startsWith('Keystore provider') ||
        trimmed.startsWith('Your keystore contains') ||
        trimmed.startsWith('Entry type') ||
        trimmed.startsWith('Certificate fingerprint')
      ) {
        continue;
      }

      // Extract alias (first part before comma)
      const parts = trimmed.split(',');
      if (parts.length > 0) {
        const alias = parts[0].trim();
        // Only add if it looks like an alias (not a metadata line)
        // Aliases should have at least one character and not contain special patterns
        if (
          alias &&
          !alias.includes(':') &&
          !alias.includes('=') &&
          !alias.includes('PrivateKeyEntry') &&
          !alias.includes('Certificate')
        ) {
          aliases.push(alias);
        }
      }
    }

    if (aliases.length === 0) {
      const message = 'No key aliases found in keystore';
      logger.warn(message);
      return {
        aliases: [],
        message,
      };
    }

    logger.info(`Found ${aliases.length} key alias(es): ${aliases.join(', ')}`);
    return {
      aliases,
      message: `Found ${aliases.length} key alias(es): ${aliases.join(', ')}`,
    };
  } catch (error) {
    const message = `Error extracting key aliases: ${error instanceof Error ? error.message : String(error)}`;
    logger.error(message);
    return {
      aliases: [],
      message,
    };
  }
}

/**
 * Verify keystore is properly configured in build.gradle
 *
 * Checks that the build.gradle file contains proper keystore configuration
 * for both debug and release builds, including signing configurations.
 *
 * @param buildGradlePath - Path to build.gradle file (defaults to ./android/app/build.gradle)
 * @returns Object with configuration status and details
 *
 * @example
 * ```typescript
 * const result = verifyKeystoreInBuildGradle('./android/app/build.gradle');
 * if (result.isConfigured) {
 *   console.log('Keystore is properly configured in build.gradle');
 * } else {
 *   console.log(`Error: ${result.message}`);
 * }
 * ```
 */
export function verifyKeystoreInBuildGradle(buildGradlePath?: string): {
  isConfigured: boolean;
  hasDebugConfig: boolean;
  hasReleaseConfig: boolean;
  message: string;
} {
  logger.debug('Verifying keystore configuration in build.gradle...');

  const gradlePath = buildGradlePath || path.join(process.cwd(), 'android', 'app', 'build.gradle');

  if (!fs.existsSync(gradlePath)) {
    const message = `build.gradle file not found at: ${gradlePath}`;
    logger.error(message);
    return {
      isConfigured: false,
      hasDebugConfig: false,
      hasReleaseConfig: false,
      message,
    };
  }

  try {
    const content = fs.readFileSync(gradlePath, 'utf-8');

    // Check for signingConfigs block
    const hasSigningConfigs = content.includes('signingConfigs');
    if (!hasSigningConfigs) {
      const message = 'signingConfigs block not found in build.gradle';
      logger.error(message);
      return {
        isConfigured: false,
        hasDebugConfig: false,
        hasReleaseConfig: false,
        message,
      };
    }

    // Check for debug signing configuration
    const hasDebugConfig =
      content.includes('debug') &&
      (content.includes('storeFile') || content.includes('debug.keystore'));

    // Check for release signing configuration
    const hasReleaseConfig =
      content.includes('release') &&
      (content.includes('ANDROID_KEYSTORE_PATH') ||
        content.includes('keystorePath') ||
        content.includes('storeFile'));

    // Check for buildTypes with signing configurations
    const hasBuildTypes = content.includes('buildTypes');
    const debugBuildType = content.includes('debug {') && content.includes('signingConfig');
    const releaseBuildType = content.includes('release {') && content.includes('signingConfig');

    const isConfigured = hasSigningConfigs && hasBuildTypes && (debugBuildType || releaseBuildType);

    if (isConfigured) {
      logger.info('Keystore is properly configured in build.gradle');
      return {
        isConfigured: true,
        hasDebugConfig,
        hasReleaseConfig,
        message: 'Keystore is properly configured in build.gradle',
      };
    } else {
      const message = 'Keystore configuration is incomplete in build.gradle';
      logger.error(message);
      return {
        isConfigured: false,
        hasDebugConfig,
        hasReleaseConfig,
        message,
      };
    }
  } catch (error) {
    const message = `Error reading build.gradle: ${error instanceof Error ? error.message : String(error)}`;
    logger.error(message);
    return {
      isConfigured: false,
      hasDebugConfig: false,
      hasReleaseConfig: false,
      message,
    };
  }
}
