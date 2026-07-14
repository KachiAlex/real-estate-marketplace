/**
 * Keystore Validator Module
 *
 * This module provides comprehensive keystore validation including:
 * - Keystore file existence and accessibility
 * - Keystore format and integrity validation
 * - Keystore password validity checking
 *
 * Requirements: 4.4, 4.5, 19.6
 *
 * @module utils/keystore-validator
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

/**
 * Logger utility for debugging
 */
const logger = {
  debug: (message: string) => console.debug(`[keystore-validator] ${message}`),
  info: (message: string) => console.info(`[keystore-validator] ${message}`),
  warn: (message: string) => console.warn(`[keystore-validator] ${message}`),
  error: (message: string) => console.error(`[keystore-validator] ${message}`),
};

/**
 * Keystore validation result
 */
export interface KeystoreValidationResult {
  isValid: boolean;
  keystorePath: string;
  expandedPath: string | null;
  fileExists: boolean;
  isAccessible: boolean;
  isValidFormat: boolean;
  passwordValid: boolean;
  checks: KeystoreValidationCheck[];
  message: string;
  details?: string;
}

/**
 * Individual keystore validation check
 */
export interface KeystoreValidationCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string;
}

/**
 * Validate keystore file
 *
 * Performs comprehensive validation of a keystore file including:
 * 1. File existence check
 * 2. File accessibility check
 * 3. File format validation (JCEKS or JKS)
 * 4. Keystore integrity check
 * 5. Password validity check
 *
 * @param keystorePath - Path to the keystore file
 * @param keystorePassword - Password for the keystore
 * @returns Comprehensive validation result
 *
 * @example
 * ```typescript
 * const result = validateKeystore('~/.android/release.keystore', 'mypassword');
 * if (result.isValid) {
 *   console.log('Keystore is valid');
 * } else {
 *   console.log(`Validation failed: ${result.message}`);
 *   result.checks.forEach(check => {
 *     if (check.status === 'fail') {
 *       console.log(`  - ${check.name}: ${check.message}`);
 *     }
 *   });
 * }
 * ```
 */
export function validateKeystore(
  keystorePath: string,
  keystorePassword: string
): KeystoreValidationResult {
  logger.debug(`Validating keystore: ${keystorePath}`);

  const checks: KeystoreValidationCheck[] = [];
  let expandedPath: string | null = null;

  // Check 1: Keystore path is provided
  if (!keystorePath) {
    checks.push({
      name: 'Keystore Path Provided',
      status: 'fail',
      message: 'Keystore path is required',
    });
    return {
      isValid: false,
      keystorePath,
      expandedPath: null,
      fileExists: false,
      isAccessible: false,
      isValidFormat: false,
      passwordValid: false,
      checks,
      message: 'Keystore path is required',
    };
  }

  // Expand ~ to home directory
  expandedPath = keystorePath.startsWith('~')
    ? path.join(process.env.HOME || process.env.USERPROFILE || '', keystorePath.slice(1))
    : keystorePath;

  // Check 2: File exists
  const fileExists = fs.existsSync(expandedPath);
  checks.push({
    name: 'File Exists',
    status: fileExists ? 'pass' : 'fail',
    message: fileExists
      ? `Keystore file exists at: ${expandedPath}`
      : `Keystore file not found at: ${expandedPath}`,
  });

  if (!fileExists) {
    return {
      isValid: false,
      keystorePath,
      expandedPath,
      fileExists: false,
      isAccessible: false,
      isValidFormat: false,
      passwordValid: false,
      checks,
      message: `Keystore file not found at: ${expandedPath}`,
    };
  }

  // Check 3: File is accessible
  let isAccessible = false;
  try {
    fs.accessSync(expandedPath, fs.constants.R_OK);
    isAccessible = true;
    checks.push({
      name: 'File Accessible',
      status: 'pass',
      message: 'Keystore file is readable',
    });
  } catch (error) {
    checks.push({
      name: 'File Accessible',
      status: 'fail',
      message: `Keystore file is not readable: ${error instanceof Error ? error.message : String(error)}`,
    });
    return {
      isValid: false,
      keystorePath,
      expandedPath,
      fileExists: true,
      isAccessible: false,
      isValidFormat: false,
      passwordValid: false,
      checks,
      message: `Keystore file is not readable: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  // Check 4: File format validation (check for JCEKS/JKS magic bytes)
  let isValidFormat = false;
  try {
    const buffer = Buffer.alloc(4);
    const fd = fs.openSync(expandedPath, 'r');
    fs.readSync(fd, buffer, 0, 4, 0);
    fs.closeSync(fd);

    // JCEKS magic: 0xCECECECE, JKS magic: 0xFEEDFEED
    const magic = buffer.readUInt32BE(0);
    isValidFormat = magic === 0xCECECECE || magic === 0xFEEDFEED;

    if (isValidFormat) {
      const format = magic === 0xCECECECE ? 'JCEKS' : 'JKS';
      checks.push({
        name: 'File Format Valid',
        status: 'pass',
        message: `Keystore format is valid (${format})`,
      });
    } else {
      checks.push({
        name: 'File Format Valid',
        status: 'fail',
        message: `Invalid keystore format (magic: 0x${magic.toString(16)})`,
      });
    }
  } catch (error) {
    checks.push({
      name: 'File Format Valid',
      status: 'warning',
      message: `Could not verify keystore format: ${error instanceof Error ? error.message : String(error)}`,
      details: 'Proceeding with password validation',
    });
    // Don't fail on format check - keytool will validate
  }

  // Check 5: Password validity
  let passwordValid = false;
  if (!keystorePassword) {
    checks.push({
      name: 'Password Provided',
      status: 'fail',
      message: 'Keystore password is required',
    });
  } else {
    try {
      // Use keytool to validate password
      execSync(
        `keytool -list -v -keystore "${expandedPath}" -storepass "${keystorePassword}" -noprompt`,
        {
          stdio: 'pipe',
        }
      );
      passwordValid = true;
      checks.push({
        name: 'Password Valid',
        status: 'pass',
        message: 'Keystore password is valid',
      });
    } catch (error) {
      checks.push({
        name: 'Password Valid',
        status: 'fail',
        message: `Keystore password validation failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  // Check 6: Keystore integrity
  let integrityValid = false;
  if (passwordValid) {
    try {
      // Use keytool to verify keystore integrity
      execSync(
        `keytool -list -keystore "${expandedPath}" -storepass "${keystorePassword}" -noprompt`,
        {
          stdio: 'pipe',
        }
      );
      integrityValid = true;
      checks.push({
        name: 'Keystore Integrity',
        status: 'pass',
        message: 'Keystore integrity verified',
      });
    } catch (error) {
      checks.push({
        name: 'Keystore Integrity',
        status: 'fail',
        message: `Keystore integrity check failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  } else {
    checks.push({
      name: 'Keystore Integrity',
      status: 'warning',
      message: 'Keystore integrity check skipped (password validation failed)',
    });
  }

  // Determine overall validity
  const isValid = fileExists && isAccessible && passwordValid && integrityValid;

  logger.info(`Keystore validation ${isValid ? 'passed' : 'failed'}`);

  return {
    isValid,
    keystorePath,
    expandedPath,
    fileExists,
    isAccessible,
    isValidFormat,
    passwordValid,
    checks,
    message: isValid
      ? 'Keystore validation passed'
      : 'Keystore validation failed',
    details: checks
      .filter((c) => c.status === 'fail')
      .map((c) => `${c.name}: ${c.message}`)
      .join('; '),
  };
}

/**
 * Quick keystore accessibility check
 *
 * Performs a quick check to see if keystore file exists and is accessible.
 * Does not validate password or format.
 *
 * @param keystorePath - Path to the keystore file
 * @returns Quick validation result
 */
export function quickKeystoreCheck(keystorePath: string): {
  isAccessible: boolean;
  expandedPath: string | null;
  message: string;
} {
  logger.debug(`Quick keystore check: ${keystorePath}`);

  if (!keystorePath) {
    return {
      isAccessible: false,
      expandedPath: null,
      message: 'Keystore path is required',
    };
  }

  const expandedPath = keystorePath.startsWith('~')
    ? path.join(process.env.HOME || process.env.USERPROFILE || '', keystorePath.slice(1))
    : keystorePath;

  if (!fs.existsSync(expandedPath)) {
    return {
      isAccessible: false,
      expandedPath,
      message: `Keystore file not found at: ${expandedPath}`,
    };
  }

  try {
    fs.accessSync(expandedPath, fs.constants.R_OK);
    return {
      isAccessible: true,
      expandedPath,
      message: `Keystore file is accessible at: ${expandedPath}`,
    };
  } catch (error) {
    return {
      isAccessible: false,
      expandedPath,
      message: `Keystore file is not readable: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
