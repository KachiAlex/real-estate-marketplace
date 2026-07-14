/**
 * AAB Signer Module
 *
 * This module provides Android App Bundle signing functionality including:
 * - AAB signing using jarsigner
 * - Bundle signature verification
 * - Error handling with clear messages
 *
 * Requirements: 3.3, 3.4
 *
 * @module utils/aab-signer
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

/**
 * Logger utility for debugging
 */
const logger = {
  debug: (message: string) => console.debug(`[aab-signer] ${message}`),
  info: (message: string) => console.info(`[aab-signer] ${message}`),
  warn: (message: string) => console.warn(`[aab-signer] ${message}`),
  error: (message: string) => console.error(`[aab-signer] ${message}`),
};

/**
 * AAB signing result
 */
export interface AABSigningResult {
  success: boolean;
  aabPath: string;
  message: string;
  details?: string;
  signatureVerified?: boolean;
}

/**
 * Sign AAB file
 *
 * Signs an Android App Bundle file using jarsigner with the provided keystore and key credentials.
 *
 * @param aabPath - Path to the AAB file to sign
 * @param keystorePath - Path to the keystore file
 * @param keystorePassword - Password for the keystore
 * @param keyAlias - Alias of the key to use for signing
 * @param keyPassword - Password for the key
 * @returns Signing result
 *
 * @example
 * ```typescript
 * const result = signAAB(
 *   'app-release.aab',
 *   '~/.android/release.keystore',
 *   'keystorepass',
 *   'mykey',
 *   'keypass'
 * );
 * if (result.success) {
 *   console.log(`AAB signed successfully: ${result.aabPath}`);
 * }
 * ```
 */
export function signAAB(
  aabPath: string,
  keystorePath: string,
  keystorePassword: string,
  keyAlias: string,
  keyPassword: string
): AABSigningResult {
  logger.debug(`Signing AAB: ${aabPath}`);

  // Validate AAB file exists
  if (!fs.existsSync(aabPath)) {
    const message = `AAB file not found: ${aabPath}`;
    logger.error(message);
    return {
      success: false,
      aabPath,
      message,
      details: `The AAB file does not exist at: ${aabPath}`,
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
      aabPath,
      message,
      details: `The keystore file does not exist at: ${expandedKeystorePath}`,
    };
  }

  try {
    // Use jarsigner to sign the AAB
    execSync(
      `jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore "${expandedKeystorePath}" -storepass "${keystorePassword}" -keypass "${keyPassword}" "${aabPath}" "${keyAlias}"`,
      {
        stdio: 'pipe',
      }
    );

    logger.info(`AAB signed successfully: ${aabPath}`);

    // Verify the signature
    const verifyResult = verifyAABSignature(aabPath);

    return {
      success: true,
      aabPath,
      message: 'AAB signed successfully',
      signatureVerified: verifyResult.verified,
      details: verifyResult.verified
        ? 'Signature verified successfully'
        : 'Warning: Signature verification failed',
    };
  } catch (error) {
    const message = `AAB signing failed: ${error instanceof Error ? error.message : String(error)}`;
    logger.error(message);
    return {
      success: false,
      aabPath,
      message,
      details: `Error during signing: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Verify AAB signature
 *
 * Verifies that an AAB file is properly signed.
 *
 * @param aabPath - Path to the AAB file to verify
 * @returns Verification result
 *
 * @example
 * ```typescript
 * const result = verifyAABSignature('app-release.aab');
 * if (result.verified) {
 *   console.log('AAB signature is valid');
 * }
 * ```
 */
export function verifyAABSignature(aabPath: string): {
  verified: boolean;
  message: string;
  details?: string;
} {
  logger.debug(`Verifying AAB signature: ${aabPath}`);

  if (!fs.existsSync(aabPath)) {
    return {
      verified: false,
      message: `AAB file not found: ${aabPath}`,
    };
  }

  try {
    // Use jarsigner to verify the signature
    execSync(`jarsigner -verify -verbose "${aabPath}"`, {
      stdio: 'pipe',
    });

    logger.info(`AAB signature verified: ${aabPath}`);
    return {
      verified: true,
      message: 'AAB signature is valid',
    };
  } catch (error) {
    const message = `AAB signature verification failed: ${error instanceof Error ? error.message : String(error)}`;
    logger.error(message);
    return {
      verified: false,
      message,
      details: `The AAB signature could not be verified. The bundle may not be properly signed.`,
    };
  }
}

/**
 * Get AAB signing information
 *
 * Extracts signing information from a signed AAB.
 *
 * @param aabPath - Path to the AAB file
 * @returns Signing information
 *
 * @example
 * ```typescript
 * const info = getAABSigningInfo('app-release.aab');
 * console.log(`Signed by: ${info.signerDN}`);
 * ```
 */
export function getAABSigningInfo(aabPath: string): {
  signed: boolean;
  signerDN?: string;
  message: string;
} {
  logger.debug(`Getting AAB signing info: ${aabPath}`);

  if (!fs.existsSync(aabPath)) {
    return {
      signed: false,
      message: `AAB file not found: ${aabPath}`,
    };
  }

  try {
    // Use jarsigner to get certificate information
    const output = execSync(`jarsigner -verify -verbose -certs "${aabPath}"`, {
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

    logger.info(`AAB signing info retrieved: ${aabPath}`);
    return {
      signed: true,
      signerDN,
      message: 'AAB signing information retrieved',
    };
  } catch (error) {
    logger.error(
      `Error getting AAB signing info: ${error instanceof Error ? error.message : String(error)}`
    );
    return {
      signed: false,
      message: `Could not retrieve signing information: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
