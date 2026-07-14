/**
 * APK Signer Module
 *
 * This module provides APK signing functionality including:
 * - APK signing using jarsigner or apksigner
 * - Signature verification
 * - Error handling with clear messages
 *
 * Requirements: 2.3, 4.6, 20.3
 *
 * @module utils/apk-signer
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

/**
 * Logger utility for debugging
 */
const logger = {
  debug: (message: string) => console.debug(`[apk-signer] ${message}`),
  info: (message: string) => console.info(`[apk-signer] ${message}`),
  warn: (message: string) => console.warn(`[apk-signer] ${message}`),
  error: (message: string) => console.error(`[apk-signer] ${message}`),
};

/**
 * APK signing result
 */
export interface APKSigningResult {
  success: boolean;
  apkPath: string;
  message: string;
  details?: string;
  signatureVerified?: boolean;
}

/**
 * Sign APK file
 *
 * Signs an APK file using jarsigner with the provided keystore and key credentials.
 *
 * @param apkPath - Path to the APK file to sign
 * @param keystorePath - Path to the keystore file
 * @param keystorePassword - Password for the keystore
 * @param keyAlias - Alias of the key to use for signing
 * @param keyPassword - Password for the key
 * @returns Signing result
 *
 * @example
 * ```typescript
 * const result = signAPK(
 *   'app-release-unsigned.apk',
 *   '~/.android/release.keystore',
 *   'keystorepass',
 *   'mykey',
 *   'keypass'
 * );
 * if (result.success) {
 *   console.log(`APK signed successfully: ${result.apkPath}`);
 * }
 * ```
 */
export function signAPK(
  apkPath: string,
  keystorePath: string,
  keystorePassword: string,
  keyAlias: string,
  keyPassword: string
): APKSigningResult {
  logger.debug(`Signing APK: ${apkPath}`);

  // Validate APK file exists
  if (!fs.existsSync(apkPath)) {
    const message = `APK file not found: ${apkPath}`;
    logger.error(message);
    return {
      success: false,
      apkPath,
      message,
      details: `The APK file does not exist at: ${apkPath}`,
    };
  }

  // Expand keystore path
  const expandedKeystorePath = keystorePath.startsWith('~')
    ? path.join(process.env.HOME || process.env.USERPROFILE || '', keystorePath.slice(1))
    : keystorePath;

  if (!fs.existsSync(expandedKeystorePath)) {
    const message = `Keystore file not found: ${expandedKeystorePath}`;
    logger.error(message);
    return {
      success: false,
      apkPath,
      message,
      details: `The keystore file does not exist at: ${expandedKeystorePath}`,
    };
  }

  try {
    // Use jarsigner to sign the APK
    // Note: jarsigner modifies the APK in-place
    execSync(
      `jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore "${expandedKeystorePath}" -storepass "${keystorePassword}" -keypass "${keyPassword}" "${apkPath}" "${keyAlias}"`,
      {
        stdio: 'pipe',
      }
    );

    logger.info(`APK signed successfully: ${apkPath}`);

    // Verify the signature
    const verifyResult = verifyAPKSignature(apkPath, keystorePath, keystorePassword);

    return {
      success: true,
      apkPath,
      message: 'APK signed successfully',
      signatureVerified: verifyResult.verified,
      details: verifyResult.verified
        ? 'Signature verified successfully'
        : 'Warning: Signature verification failed',
    };
  } catch (error) {
    const message = `APK signing failed: ${error instanceof Error ? error.message : String(error)}`;
    logger.error(message);
    return {
      success: false,
      apkPath,
      message,
      details: `Error during signing: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Verify APK signature
 *
 * Verifies that an APK file is properly signed.
 *
 * @param apkPath - Path to the APK file to verify
 * @param keystorePath - Path to the keystore file (optional, for certificate verification)
 * @param keystorePassword - Password for the keystore (optional)
 * @returns Verification result
 *
 * @example
 * ```typescript
 * const result = verifyAPKSignature('app-release.apk');
 * if (result.verified) {
 *   console.log('APK signature is valid');
 * }
 * ```
 */
export function verifyAPKSignature(
  apkPath: string,
  keystorePath?: string,
  keystorePassword?: string
): {
  verified: boolean;
  message: string;
  details?: string;
} {
  logger.debug(`Verifying APK signature: ${apkPath}`);

  if (!fs.existsSync(apkPath)) {
    return {
      verified: false,
      message: `APK file not found: ${apkPath}`,
    };
  }

  try {
    // Use jarsigner to verify the signature
    execSync(`jarsigner -verify -verbose "${apkPath}"`, {
      stdio: 'pipe',
    });

    logger.info(`APK signature verified: ${apkPath}`);
    return {
      verified: true,
      message: 'APK signature is valid',
    };
  } catch (error) {
    const message = `APK signature verification failed: ${error instanceof Error ? error.message : String(error)}`;
    logger.error(message);
    return {
      verified: false,
      message,
      details: `The APK signature could not be verified. The APK may not be properly signed.`,
    };
  }
}

/**
 * Align APK file
 *
 * Aligns the APK file using zipalign for optimal performance.
 * This should be done after signing.
 *
 * @param apkPath - Path to the APK file to align
 * @param alignedApkPath - Path where the aligned APK will be saved
 * @returns Alignment result
 *
 * @example
 * ```typescript
 * const result = alignAPK('app-release.apk', 'app-release-aligned.apk');
 * if (result.success) {
 *   console.log(`APK aligned: ${result.alignedPath}`);
 * }
 * ```
 */
export function alignAPK(
  apkPath: string,
  alignedApkPath: string
): {
  success: boolean;
  apkPath: string;
  alignedPath: string;
  message: string;
  details?: string;
} {
  logger.debug(`Aligning APK: ${apkPath}`);

  if (!fs.existsSync(apkPath)) {
    return {
      success: false,
      apkPath,
      alignedPath: alignedApkPath,
      message: `APK file not found: ${apkPath}`,
    };
  }

  try {
    // Use zipalign to align the APK
    // 4-byte alignment is standard for APKs
    execSync(`zipalign -v 4 "${apkPath}" "${alignedApkPath}"`, {
      stdio: 'pipe',
    });

    logger.info(`APK aligned successfully: ${alignedApkPath}`);
    return {
      success: true,
      apkPath,
      alignedPath: alignedApkPath,
      message: 'APK aligned successfully',
    };
  } catch (error) {
    const message = `APK alignment failed: ${error instanceof Error ? error.message : String(error)}`;
    logger.error(message);
    return {
      success: false,
      apkPath,
      alignedPath: alignedApkPath,
      message,
      details: `Error during alignment: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Get APK signing information
 *
 * Extracts signing information from a signed APK.
 *
 * @param apkPath - Path to the APK file
 * @returns Signing information
 *
 * @example
 * ```typescript
 * const info = getAPKSigningInfo('app-release.apk');
 * console.log(`Signed by: ${info.signerDN}`);
 * ```
 */
export function getAPKSigningInfo(apkPath: string): {
  signed: boolean;
  signerDN?: string;
  message: string;
} {
  logger.debug(`Getting APK signing info: ${apkPath}`);

  if (!fs.existsSync(apkPath)) {
    return {
      signed: false,
      message: `APK file not found: ${apkPath}`,
    };
  }

  try {
    // Use jarsigner to get certificate information
    const output = execSync(`jarsigner -verify -verbose -certs "${apkPath}"`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Parse output to extract signer DN
    const lines = output.split('\n');
    let signerDN: string | undefined;

    for (const line of lines) {
      if (line.includes('Owner:')) {
        signerDN = line.substring(line.indexOf('Owner:') + 'Owner:'.length).trim();
        break;
      }
    }

    logger.info(`APK signing info retrieved: ${apkPath}`);
    return {
      signed: true,
      signerDN,
      message: 'APK signing information retrieved',
    };
  } catch (error) {
    logger.error(
      `Error getting APK signing info: ${error instanceof Error ? error.message : String(error)}`
    );
    return {
      signed: false,
      message: `Could not retrieve signing information: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
