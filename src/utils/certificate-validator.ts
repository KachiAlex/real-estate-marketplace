/**
 * Certificate Validator Module
 *
 * This module provides certificate validation functionality including:
 * - Certificate extraction from keystore
 * - Certificate validity verification
 * - Certificate expiration checking
 * - Certificate subject DN matching
 *
 * Requirements: 19.1, 19.2, 19.6
 *
 * @module utils/certificate-validator
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

/**
 * Logger utility for debugging
 */
const logger = {
  debug: (message: string) => console.debug(`[certificate-validator] ${message}`),
  info: (message: string) => console.info(`[certificate-validator] ${message}`),
  warn: (message: string) => console.warn(`[certificate-validator] ${message}`),
  error: (message: string) => console.error(`[certificate-validator] ${message}`),
};

/**
 * Certificate information
 */
export interface CertificateInfo {
  subjectDN: string;
  issuerDN: string;
  notBefore: Date;
  notAfter: Date;
  signatureAlgorithm: string;
  fingerprint: string;
  isExpired: boolean;
  daysUntilExpiration: number;
}

/**
 * Certificate validation result
 */
export interface CertificateValidationResult {
  isValid: boolean;
  certificate: CertificateInfo | null;
  message: string;
  details?: string;
}

/**
 * Extract certificate from keystore
 *
 * Extracts certificate information from a keystore using keytool.
 *
 * @param keystorePath - Path to the keystore file
 * @param keystorePassword - Password for the keystore
 * @param keyAlias - Alias of the key to extract certificate from
 * @returns Certificate information
 *
 * @example
 * ```typescript
 * const cert = extractCertificate(
 *   '~/.android/release.keystore',
 *   'keystorepass',
 *   'mykey'
 * );
 * if (cert.isValid) {
 *   console.log(`Certificate expires: ${cert.certificate?.notAfter}`);
 * }
 * ```
 */
export function extractCertificate(
  keystorePath: string,
  keystorePassword: string,
  keyAlias: string
): CertificateValidationResult {
  logger.debug(`Extracting certificate for alias: ${keyAlias}`);

  try {
    const expandedPath = keystorePath.startsWith('~')
      ? path.join(process.env.HOME || process.env.USERPROFILE || '', keystorePath.slice(1))
      : keystorePath;

    if (!fs.existsSync(expandedPath)) {
      return {
        isValid: false,
        certificate: null,
        message: `Keystore not found: ${expandedPath}`,
      };
    }

    // Use keytool to extract certificate details
    const output = execSync(
      `keytool -list -v -keystore "${expandedPath}" -storepass "${keystorePassword}" -alias "${keyAlias}" -noprompt`,
      {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      }
    );

    // Parse certificate information from keytool output
    const certificate = parseCertificateOutput(output);

    if (!certificate) {
      return {
        isValid: false,
        certificate: null,
        message: 'Failed to parse certificate information',
      };
    }

    logger.info(`Certificate extracted for alias: ${keyAlias}`);
    return {
      isValid: true,
      certificate,
      message: 'Certificate extracted successfully',
    };
  } catch (error) {
    const message = `Error extracting certificate: ${error instanceof Error ? error.message : String(error)}`;
    logger.error(message);
    return {
      isValid: false,
      certificate: null,
      message,
    };
  }
}

/**
 * Validate certificate validity
 *
 * Checks if a certificate is valid and not expired.
 *
 * @param keystorePath - Path to the keystore file
 * @param keystorePassword - Password for the keystore
 * @param keyAlias - Alias of the key to validate
 * @returns Validation result
 *
 * @example
 * ```typescript
 * const result = validateCertificateValidity(
 *   '~/.android/release.keystore',
 *   'keystorepass',
 *   'mykey'
 * );
 * if (result.isValid) {
 *   console.log('Certificate is valid');
 * }
 * ```
 */
export function validateCertificateValidity(
  keystorePath: string,
  keystorePassword: string,
  keyAlias: string
): CertificateValidationResult {
  logger.debug(`Validating certificate validity for alias: ${keyAlias}`);

  const extractResult = extractCertificate(keystorePath, keystorePassword, keyAlias);

  if (!extractResult.isValid || !extractResult.certificate) {
    return extractResult;
  }

  const cert = extractResult.certificate;
  const now = new Date();

  // Check if certificate is expired
  if (cert.isExpired) {
    return {
      isValid: false,
      certificate: cert,
      message: `Certificate has expired on ${cert.notAfter.toISOString()}`,
      details: `The certificate for key alias "${keyAlias}" expired on ${cert.notAfter.toDateString()}. Please renew the certificate.`,
    };
  }

  // Check if certificate is not yet valid
  if (now < cert.notBefore) {
    return {
      isValid: false,
      certificate: cert,
      message: `Certificate is not yet valid (valid from ${cert.notBefore.toISOString()})`,
      details: `The certificate for key alias "${keyAlias}" is not yet valid. It becomes valid on ${cert.notBefore.toDateString()}.`,
    };
  }

  logger.info(`Certificate is valid for alias: ${keyAlias}`);
  return {
    isValid: true,
    certificate: cert,
    message: 'Certificate is valid',
  };
}

/**
 * Check certificate expiration
 *
 * Checks if a certificate is expiring soon and returns warning information.
 *
 * @param keystorePath - Path to the keystore file
 * @param keystorePassword - Password for the keystore
 * @param keyAlias - Alias of the key to check
 * @param warningDays - Number of days before expiration to warn (default: 30)
 * @returns Expiration check result
 *
 * @example
 * ```typescript
 * const result = checkCertificateExpiration(
 *   '~/.android/release.keystore',
 *   'keystorepass',
 *   'mykey',
 *   30
 * );
 * if (result.certificate && result.certificate.daysUntilExpiration < 30) {
 *   console.log(`Warning: Certificate expires in ${result.certificate.daysUntilExpiration} days`);
 * }
 * ```
 */
export function checkCertificateExpiration(
  keystorePath: string,
  keystorePassword: string,
  keyAlias: string,
  warningDays: number = 30
): CertificateValidationResult {
  logger.debug(`Checking certificate expiration for alias: ${keyAlias}`);

  const extractResult = extractCertificate(keystorePath, keystorePassword, keyAlias);

  if (!extractResult.isValid || !extractResult.certificate) {
    return extractResult;
  }

  const cert = extractResult.certificate;

  if (cert.isExpired) {
    return {
      isValid: false,
      certificate: cert,
      message: `Certificate has expired`,
      details: `The certificate expired on ${cert.notAfter.toDateString()}. Please renew it immediately.`,
    };
  }

  if (cert.daysUntilExpiration < warningDays) {
    return {
      isValid: true,
      certificate: cert,
      message: `Certificate is expiring soon (${cert.daysUntilExpiration} days)`,
      details: `The certificate will expire on ${cert.notAfter.toDateString()} (${cert.daysUntilExpiration} days from now). Consider renewing it soon.`,
    };
  }

  logger.info(`Certificate is valid for ${cert.daysUntilExpiration} more days`);
  return {
    isValid: true,
    certificate: cert,
    message: `Certificate is valid for ${cert.daysUntilExpiration} more days`,
  };
}

/**
 * Validate certificate matches expected subject DN
 *
 * Verifies that a certificate's subject DN matches the expected value.
 *
 * @param keystorePath - Path to the keystore file
 * @param keystorePassword - Password for the keystore
 * @param keyAlias - Alias of the key to validate
 * @param expectedSubjectDN - Expected certificate subject DN
 * @returns Validation result
 *
 * @example
 * ```typescript
 * const result = validateCertificateSubjectDN(
 *   '~/.android/release.keystore',
 *   'keystorepass',
 *   'mykey',
 *   'CN=MyApp,O=MyCompany'
 * );
 * if (result.isValid) {
 *   console.log('Certificate subject DN matches');
 * }
 * ```
 */
export function validateCertificateSubjectDN(
  keystorePath: string,
  keystorePassword: string,
  keyAlias: string,
  expectedSubjectDN: string
): CertificateValidationResult {
  logger.debug(`Validating certificate subject DN for alias: ${keyAlias}`);

  const extractResult = extractCertificate(keystorePath, keystorePassword, keyAlias);

  if (!extractResult.isValid || !extractResult.certificate) {
    return extractResult;
  }

  const cert = extractResult.certificate;

  // Normalize DNs for comparison (remove spaces around =)
  const actualDN = cert.subjectDN.replace(/\s*=\s*/g, '=').replace(/\s*,\s*/g, ',');
  const expectedDN = expectedSubjectDN.replace(/\s*=\s*/g, '=').replace(/\s*,\s*/g, ',');

  if (actualDN !== expectedDN) {
    return {
      isValid: false,
      certificate: cert,
      message: `Certificate subject DN does not match`,
      details: `Expected: ${expectedSubjectDN}\nActual: ${cert.subjectDN}`,
    };
  }

  logger.info(`Certificate subject DN matches for alias: ${keyAlias}`);
  return {
    isValid: true,
    certificate: cert,
    message: 'Certificate subject DN matches',
  };
}

/**
 * Parse certificate information from keytool output
 *
 * @param output - Output from keytool -list -v command
 * @returns Parsed certificate information or null if parsing fails
 */
function parseCertificateOutput(output: string): CertificateInfo | null {
  try {
    const lines = output.split('\n');
    const cert: Partial<CertificateInfo> = {};

    for (const line of lines) {
      const trimmed = line.trim();

      // Extract Owner (Subject DN)
      if (trimmed.startsWith('Owner:')) {
        cert.subjectDN = trimmed.substring('Owner:'.length).trim();
      }

      // Extract Issuer
      if (trimmed.startsWith('Issuer:')) {
        cert.issuerDN = trimmed.substring('Issuer:'.length).trim();
      }

      // Extract Serial number (not used but could be)
      if (trimmed.startsWith('Serial number:')) {
        // Serial number extracted but not stored
      }

      // Extract Valid from
      if (trimmed.startsWith('Valid from:')) {
        const dateStr = trimmed.substring('Valid from:'.length).trim();
        const parts = dateStr.split('until:');
        if (parts.length === 2) {
          cert.notBefore = new Date(parts[0].trim());
          cert.notAfter = new Date(parts[1].trim());
        }
      }

      // Extract Signature algorithm
      if (trimmed.startsWith('Signature algorithm name:')) {
        cert.signatureAlgorithm = trimmed.substring('Signature algorithm name:'.length).trim();
      }

      // Extract fingerprint (SHA-256)
      if (trimmed.startsWith('SHA-256 fingerprint:')) {
        cert.fingerprint = trimmed.substring('SHA-256 fingerprint:'.length).trim();
      }
    }

    // Validate required fields
    if (!cert.subjectDN || !cert.issuerDN || !cert.notBefore || !cert.notAfter) {
      logger.error('Failed to parse all required certificate fields');
      return null;
    }

    // Calculate expiration info
    const now = new Date();
    const daysUntilExpiration = Math.floor(
      (cert.notAfter.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      subjectDN: cert.subjectDN,
      issuerDN: cert.issuerDN,
      notBefore: cert.notBefore,
      notAfter: cert.notAfter,
      signatureAlgorithm: cert.signatureAlgorithm || 'Unknown',
      fingerprint: cert.fingerprint || 'Unknown',
      isExpired: now > cert.notAfter,
      daysUntilExpiration: Math.max(0, daysUntilExpiration),
    };
  } catch (error) {
    logger.error(
      `Error parsing certificate output: ${error instanceof Error ? error.message : String(error)}`
    );
    return null;
  }
}
