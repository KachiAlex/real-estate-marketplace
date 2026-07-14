/**
 * Signing Configuration Loader Module
 *
 * This module provides functionality to load and manage signing configurations
 * for Android builds, including:
 * - Loading signing credentials from environment and keystore
 * - Parsing keystore to extract key aliases
 * - Validating key passwords
 * - Managing debug and release signing configurations
 *
 * Requirements: 4.1, 4.2, 4.3
 *
 * @module utils/signing-configuration-loader
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

/**
 * Logger utility for debugging
 */
const logger = {
  debug: (message: string) => console.debug(`[signing-config-loader] ${message}`),
  info: (message: string) => console.info(`[signing-config-loader] ${message}`),
  warn: (message: string) => console.warn(`[signing-config-loader] ${message}`),
  error: (message: string) => console.error(`[signing-config-loader] ${message}`),
};

/**
 * Signing configuration for a build
 */
export interface SigningConfiguration {
  keystorePath: string;
  keystorePassword: string;
  keyAlias: string;
  keyPassword: string;
  certificateSubjectDN?: string;
}

/**
 * Signing configuration result
 */
export interface SigningConfigurationResult {
  isValid: boolean;
  configuration: SigningConfiguration | null;
  message: string;
  details?: string;
}

/**
 * Load signing configuration for debug builds
 *
 * Loads debug signing configuration from environment variables or defaults.
 * Debug builds typically use the Android SDK's default debug keystore.
 *
 * Environment variables:
 * - ANDROID_DEBUG_KEYSTORE_PATH: Path to debug keystore (defaults to ~/.android/debug.keystore)
 * - ANDROID_DEBUG_KEYSTORE_PASSWORD: Debug keystore password (defaults to 'android')
 * - ANDROID_DEBUG_KEY_ALIAS: Debug key alias (defaults to 'androiddebugkey')
 * - ANDROID_DEBUG_KEY_PASSWORD: Debug key password (defaults to 'android')
 *
 * @returns Signing configuration for debug builds
 *
 * @example
 * ```typescript
 * const config = loadDebugSigningConfiguration();
 * if (config.isValid) {
 *   console.log(`Debug keystore: ${config.configuration?.keystorePath}`);
 * }
 * ```
 */
export function loadDebugSigningConfiguration(): SigningConfigurationResult {
  logger.debug('Loading debug signing configuration...');

  try {
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    const keystorePath =
      process.env.ANDROID_DEBUG_KEYSTORE_PATH || path.join(homeDir, '.android', 'debug.keystore');
    const keystorePassword = process.env.ANDROID_DEBUG_KEYSTORE_PASSWORD || 'android';
    const keyAlias = process.env.ANDROID_DEBUG_KEY_ALIAS || 'androiddebugkey';
    const keyPassword = process.env.ANDROID_DEBUG_KEY_PASSWORD || 'android';

    // Verify keystore exists
    const expandedPath = keystorePath.startsWith('~')
      ? path.join(homeDir, keystorePath.slice(1))
      : keystorePath;

    if (!fs.existsSync(expandedPath)) {
      const message = `Debug keystore not found at: ${expandedPath}`;
      logger.warn(message);
      return {
        isValid: false,
        configuration: null,
        message,
        details: `Expected debug keystore at: ${expandedPath}. Create it with: keytool -genkey -v -keystore ${expandedPath} -keyalg RSA -keysize 2048 -validity 10000 -alias androiddebugkey -storepass android -keypass android`,
      };
    }

    const configuration: SigningConfiguration = {
      keystorePath,
      keystorePassword,
      keyAlias,
      keyPassword,
    };

    logger.info('Debug signing configuration loaded successfully');
    return {
      isValid: true,
      configuration,
      message: 'Debug signing configuration loaded successfully',
    };
  } catch (error) {
    const message = `Error loading debug signing configuration: ${error instanceof Error ? error.message : String(error)}`;
    logger.error(message);
    return {
      isValid: false,
      configuration: null,
      message,
    };
  }
}

/**
 * Load signing configuration for release builds
 *
 * Loads release signing configuration from environment variables.
 * Release builds require explicit configuration of the production keystore.
 *
 * Environment variables:
 * - ANDROID_KEYSTORE_PATH: Path to release keystore (required)
 * - ANDROID_KEYSTORE_PASSWORD: Release keystore password (required)
 * - ANDROID_KEY_ALIAS: Release key alias (required)
 * - ANDROID_KEY_PASSWORD: Release key password (required)
 * - ANDROID_CERTIFICATE_SUBJECT_DN: Expected certificate subject DN (optional)
 *
 * @returns Signing configuration for release builds
 *
 * @example
 * ```typescript
 * const config = loadReleaseSigningConfiguration();
 * if (config.isValid) {
 *   console.log(`Release keystore: ${config.configuration?.keystorePath}`);
 * } else {
 *   console.log(`Error: ${config.message}`);
 * }
 * ```
 */
export function loadReleaseSigningConfiguration(): SigningConfigurationResult {
  logger.debug('Loading release signing configuration...');

  try {
    const keystorePath = process.env.ANDROID_KEYSTORE_PATH;
    const keystorePassword = process.env.ANDROID_KEYSTORE_PASSWORD;
    const keyAlias = process.env.ANDROID_KEY_ALIAS;
    const keyPassword = process.env.ANDROID_KEY_PASSWORD;
    const certificateSubjectDN = process.env.ANDROID_CERTIFICATE_SUBJECT_DN;

    // Validate required environment variables
    const missingVars: string[] = [];
    if (!keystorePath) missingVars.push('ANDROID_KEYSTORE_PATH');
    if (!keystorePassword) missingVars.push('ANDROID_KEYSTORE_PASSWORD');
    if (!keyAlias) missingVars.push('ANDROID_KEY_ALIAS');
    if (!keyPassword) missingVars.push('ANDROID_KEY_PASSWORD');

    if (missingVars.length > 0) {
      const message = `Missing required environment variables: ${missingVars.join(', ')}`;
      logger.error(message);
      return {
        isValid: false,
        configuration: null,
        message,
        details: `Set the following environment variables: ${missingVars.join(', ')}`,
      };
    }

    // Verify keystore exists
    const expandedPath = keystorePath!.startsWith('~')
      ? path.join(process.env.HOME || process.env.USERPROFILE || '', keystorePath!.slice(1))
      : keystorePath!;

    if (!fs.existsSync(expandedPath)) {
      const message = `Release keystore not found at: ${expandedPath}`;
      logger.error(message);
      return {
        isValid: false,
        configuration: null,
        message,
        details: `Keystore file does not exist at: ${expandedPath}`,
      };
    }

    const configuration: SigningConfiguration = {
      keystorePath: keystorePath!,
      keystorePassword: keystorePassword!,
      keyAlias: keyAlias!,
      keyPassword: keyPassword!,
      certificateSubjectDN,
    };

    logger.info('Release signing configuration loaded successfully');
    return {
      isValid: true,
      configuration,
      message: 'Release signing configuration loaded successfully',
    };
  } catch (error) {
    const message = `Error loading release signing configuration: ${error instanceof Error ? error.message : String(error)}`;
    logger.error(message);
    return {
      isValid: false,
      configuration: null,
      message,
    };
  }
}

/**
 * Extract key aliases from keystore
 *
 * Lists all key aliases available in a keystore.
 *
 * @param keystorePath - Path to the keystore file
 * @param keystorePassword - Password for the keystore
 * @returns List of key aliases
 *
 * @example
 * ```typescript
 * const aliases = extractKeyAliases('~/.android/release.keystore', 'mypassword');
 * console.log(`Available aliases: ${aliases.join(', ')}`);
 * ```
 */
export function extractKeyAliases(keystorePath: string, keystorePassword: string): string[] {
  logger.debug(`Extracting key aliases from: ${keystorePath}`);

  try {
    const expandedPath = keystorePath.startsWith('~')
      ? path.join(process.env.HOME || process.env.USERPROFILE || '', keystorePath.slice(1))
      : keystorePath;

    if (!fs.existsSync(expandedPath)) {
      logger.error(`Keystore not found: ${expandedPath}`);
      return [];
    }

    // Use keytool to list aliases
    const output = execSync(
      `keytool -list -keystore "${expandedPath}" -storepass "${keystorePassword}" -noprompt`,
      {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      }
    );

    // Parse output to extract aliases
    const lines = output.split('\n');
    const aliases: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines and metadata lines
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

    logger.info(`Found ${aliases.length} key alias(es): ${aliases.join(', ')}`);
    return aliases;
  } catch (error) {
    logger.error(
      `Error extracting key aliases: ${error instanceof Error ? error.message : String(error)}`
    );
    return [];
  }
}

/**
 * Validate key password
 *
 * Verifies that a key password is correct by attempting to access the key.
 *
 * @param keystorePath - Path to the keystore file
 * @param keystorePassword - Password for the keystore
 * @param keyAlias - Alias of the key to validate
 * @param keyPassword - Password for the key
 * @returns Validation result
 *
 * @example
 * ```typescript
 * const isValid = validateKeyPassword(
 *   '~/.android/release.keystore',
 *   'keystorepass',
 *   'mykey',
 *   'keypass'
 * );
 * console.log(`Key password is ${isValid ? 'valid' : 'invalid'}`);
 * ```
 */
export function validateKeyPassword(
  keystorePath: string,
  keystorePassword: string,
  keyAlias: string,
  keyPassword: string
): boolean {
  logger.debug(`Validating key password for alias: ${keyAlias}`);

  try {
    const expandedPath = keystorePath.startsWith('~')
      ? path.join(process.env.HOME || process.env.USERPROFILE || '', keystorePath.slice(1))
      : keystorePath;

    if (!fs.existsSync(expandedPath)) {
      logger.error(`Keystore not found: ${expandedPath}`);
      return false;
    }

    // Use keytool to verify key password
    execSync(
      `keytool -list -v -keystore "${expandedPath}" -storepass "${keystorePassword}" -alias "${keyAlias}" -keypass "${keyPassword}" -noprompt`,
      {
        stdio: 'pipe',
      }
    );

    logger.info(`Key password is valid for alias: ${keyAlias}`);
    return true;
  } catch (error) {
    logger.error(
      `Key password validation failed: ${error instanceof Error ? error.message : String(error)}`
    );
    return false;
  }
}

/**
 * Get signing configuration for a build variant
 *
 * Loads the appropriate signing configuration based on build variant.
 *
 * @param variant - Build variant ('debug' or 'release')
 * @returns Signing configuration result
 *
 * @example
 * ```typescript
 * const config = getSigningConfiguration('release');
 * if (config.isValid) {
 *   console.log(`Using keystore: ${config.configuration?.keystorePath}`);
 * }
 * ```
 */
export function getSigningConfiguration(variant: 'debug' | 'release'): SigningConfigurationResult {
  logger.debug(`Getting signing configuration for variant: ${variant}`);

  if (variant === 'debug') {
    return loadDebugSigningConfiguration();
  } else if (variant === 'release') {
    return loadReleaseSigningConfiguration();
  } else {
    return {
      isValid: false,
      configuration: null,
      message: `Unknown build variant: ${variant}`,
    };
  }
}
