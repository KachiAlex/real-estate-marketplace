import * as fs from 'fs';
import * as path from 'path';
import { grepSearch } from '../tools/grepSearch';
import { ValidationResult, ValidationStatus, ValidationCategory } from '../types/mobile-config';

/**
 * Patterns that indicate exposed secrets
 */
const SECRET_PATTERNS = [
  /api[_-]?key\s*[:=]\s*['"](.*?)['"]/gi,
  /secret[_-]?key\s*[:=]\s*['"](.*?)['"]/gi,
  /password\s*[:=]\s*['"](.*?)['"]/gi,
  /token\s*[:=]\s*['"](.*?)['"]/gi,
  /firebase[_-]?config\s*[:=]\s*['"](.*?)['"]/gi,
  /aws[_-]?secret\s*[:=]\s*['"](.*?)['"]/gi,
  /private[_-]?key\s*[:=]\s*['"](.*?)['"]/gi,
  /authorization\s*[:=]\s*['"](.*?)['"]/gi,
];

/**
 * Verifies secrets are not hardcoded in source files
 * @param sourceDir - Directory to scan (defaults to src/)
 * @returns Scan result with found secrets
 */
export function verifyScretsNotHardcoded(sourceDir?: string): {
  success: boolean;
  foundSecrets: Array<{
    file: string;
    line: number;
    pattern: string;
    value: string;
  }>;
  error?: string;
} {
  try {
    const resolvedDir = sourceDir || path.join(process.cwd(), 'src');

    if (!fs.existsSync(resolvedDir)) {
      return {
        success: false,
        foundSecrets: [],
        error: `Source directory not found: ${resolvedDir}`,
      };
    }

    const foundSecrets: Array<{
      file: string;
      line: number;
      pattern: string;
      value: string;
    }> = [];

    // Scan files for hardcoded secrets
    const scanDirectory = (dir: string) => {
      const files = fs.readdirSync(dir);

      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        // Skip node_modules and other common directories
        if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'build') {
          continue;
        }

        if (stat.isDirectory()) {
          scanDirectory(filePath);
        } else if (
          file.endsWith('.ts') ||
          file.endsWith('.tsx') ||
          file.endsWith('.js') ||
          file.endsWith('.jsx')
        ) {
          try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.split('\n');

            for (let lineNum = 0; lineNum < lines.length; lineNum++) {
              const line = lines[lineNum];

              for (const pattern of SECRET_PATTERNS) {
                const match = pattern.exec(line);
                if (match) {
                  foundSecrets.push({
                    file: path.relative(process.cwd(), filePath),
                    line: lineNum + 1,
                    pattern: pattern.source,
                    value: match[1] || match[0],
                  });
                }
              }
            }
          } catch {
            // Skip files that can't be read
          }
        }
      }
    };

    scanDirectory(resolvedDir);

    return {
      success: foundSecrets.length === 0,
      foundSecrets,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      foundSecrets: [],
      error: `Failed to scan for hardcoded secrets: ${errorMessage}`,
    };
  }
}

/**
 * Scans codebase for exposed API keys and credentials
 * @param sourceDir - Directory to scan
 * @returns Scan result with found credentials
 */
export function scanForExposedCredentials(sourceDir?: string): {
  success: boolean;
  exposedCredentials: Array<{
    file: string;
    line: number;
    type: string;
    severity: 'high' | 'medium' | 'low';
  }>;
  error?: string;
} {
  try {
    const resolvedDir = sourceDir || path.join(process.cwd(), 'src');

    if (!fs.existsSync(resolvedDir)) {
      return {
        success: false,
        exposedCredentials: [],
        error: `Source directory not found: ${resolvedDir}`,
      };
    }

    const exposedCredentials: Array<{
      file: string;
      line: number;
      type: string;
      severity: 'high' | 'medium' | 'low';
    }> = [];

    // Patterns for different credential types
    const credentialPatterns = [
      { pattern: /sk_live_[a-zA-Z0-9]{24}/g, type: 'Stripe Live Key', severity: 'high' as const },
      { pattern: /sk_test_[a-zA-Z0-9]{24}/g, type: 'Stripe Test Key', severity: 'medium' as const },
      { pattern: /AIza[0-9A-Za-z\-_]{35}/g, type: 'Google API Key', severity: 'high' as const },
      { pattern: /AKIA[0-9A-Z]{16}/g, type: 'AWS Access Key', severity: 'high' as const },
      { pattern: /ghp_[0-9a-zA-Z]{36}/g, type: 'GitHub Personal Token', severity: 'high' as const },
      { pattern: /-----BEGIN RSA PRIVATE KEY-----/g, type: 'RSA Private Key', severity: 'high' as const },
      { pattern: /-----BEGIN PRIVATE KEY-----/g, type: 'Private Key', severity: 'high' as const },
    ];

    // Scan files
    const scanDirectory = (dir: string) => {
      const files = fs.readdirSync(dir);

      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        // Skip node_modules and other common directories
        if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'build') {
          continue;
        }

        if (stat.isDirectory()) {
          scanDirectory(filePath);
        } else if (
          file.endsWith('.ts') ||
          file.endsWith('.tsx') ||
          file.endsWith('.js') ||
          file.endsWith('.jsx') ||
          file.endsWith('.json')
        ) {
          try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.split('\n');

            for (let lineNum = 0; lineNum < lines.length; lineNum++) {
              const line = lines[lineNum];

              for (const { pattern, type, severity } of credentialPatterns) {
                if (pattern.test(line)) {
                  exposedCredentials.push({
                    file: path.relative(process.cwd(), filePath),
                    line: lineNum + 1,
                    type,
                    severity,
                  });
                }
              }
            }
          } catch {
            // Skip files that can't be read
          }
        }
      }
    };

    scanDirectory(resolvedDir);

    return {
      success: exposedCredentials.length === 0,
      exposedCredentials,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      exposedCredentials: [],
      error: `Failed to scan for exposed credentials: ${errorMessage}`,
    };
  }
}

/**
 * Validates secrets file permissions (readable only by owner)
 * @param secretsFilePath - Path to secrets file
 * @returns Validation result with permission details
 */
export function validateSecretsFilePermissions(secretsFilePath: string): {
  success: boolean;
  permissions?: string;
  isSecure?: boolean;
  details: string[];
} {
  try {
    if (!fs.existsSync(secretsFilePath)) {
      return {
        success: false,
        details: [`Secrets file not found: ${secretsFilePath}`],
      };
    }

    const stats = fs.statSync(secretsFilePath);
    const mode = stats.mode;

    // Extract permission bits
    const permissions = (mode & parseInt('777', 8)).toString(8);

    // Check if file is readable only by owner (600 or 400)
    const isSecure = permissions === '600' || permissions === '400';

    const details: string[] = [];
    details.push(`File permissions: ${permissions}`);

    if (!isSecure) {
      details.push(`Warning: File is readable by others. Recommended permissions: 600`);
    }

    return {
      success: isSecure,
      permissions,
      isSecure,
      details,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      details: [`Failed to validate file permissions: ${errorMessage}`],
    };
  }
}

/**
 * Encrypts sensitive data at rest (basic implementation)
 * @param data - Data to encrypt
 * @param encryptionKey - Encryption key
 * @returns Encrypted data
 */
export function encryptSensitiveData(data: string, encryptionKey: string): {
  success: boolean;
  encrypted?: string;
  error?: string;
} {
  try {
    const crypto = require('crypto');

    // Create cipher
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(data, 'utf-8', 'hex');
    encrypted += cipher.final('hex');

    // Combine IV and encrypted data
    const result = iv.toString('hex') + ':' + encrypted;

    return {
      success: true,
      encrypted: result,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to encrypt data: ${errorMessage}`,
    };
  }
}

/**
 * Decrypts sensitive data at rest
 * @param encrypted - Encrypted data
 * @param encryptionKey - Encryption key
 * @returns Decrypted data
 */
export function decryptSensitiveData(encrypted: string, encryptionKey: string): {
  success: boolean;
  decrypted?: string;
  error?: string;
} {
  try {
    const crypto = require('crypto');

    // Extract IV and encrypted data
    const parts = encrypted.split(':');
    if (parts.length !== 2) {
      return {
        success: false,
        error: 'Invalid encrypted data format',
      };
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encryptedData = parts[1];

    // Create decipher
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(encryptionKey, 'salt', 32);

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');

    return {
      success: true,
      decrypted,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to decrypt data: ${errorMessage}`,
    };
  }
}

/**
 * Comprehensive secrets validation
 * @param sourceDir - Directory to scan
 * @param secretsFilePath - Path to secrets file
 * @returns Complete validation result
 */
export function validateSecretsManagement(sourceDir?: string, secretsFilePath?: string): ValidationResult {
  const timestamp = new Date();
  const checks = [];

  // Check for hardcoded secrets
  const hardcodedResult = verifyScretsNotHardcoded(sourceDir);
  checks.push({
    name: 'Hardcoded Secrets',
    category: ValidationCategory.CREDENTIAL,
    status: hardcodedResult.success ? ValidationStatus.PASS : ValidationStatus.FAIL,
    message: hardcodedResult.success
      ? 'No hardcoded secrets found in source code'
      : `Found ${hardcodedResult.foundSecrets.length} potential hardcoded secret(s)`,
    remediation: hardcodedResult.success
      ? undefined
      : 'Move secrets to .env.local or EAS secrets configuration',
    documentationLink: 'https://docs.expo.dev/build/variables/',
  });

  // Scan for exposed credentials
  const credentialsResult = scanForExposedCredentials(sourceDir);
  checks.push({
    name: 'Exposed Credentials',
    category: ValidationCategory.CREDENTIAL,
    status: credentialsResult.success ? ValidationStatus.PASS : ValidationStatus.FAIL,
    message: credentialsResult.success
      ? 'No exposed credentials found'
      : `Found ${credentialsResult.exposedCredentials.length} exposed credential(s)`,
    remediation: credentialsResult.success
      ? undefined
      : 'Remove exposed credentials and rotate affected keys',
    documentationLink: 'https://docs.expo.dev/build/variables/',
  });

  // Check secrets file permissions if provided
  if (secretsFilePath) {
    const permissionsResult = validateSecretsFilePermissions(secretsFilePath);
    checks.push({
      name: 'Secrets File Permissions',
      category: ValidationCategory.CREDENTIAL,
      status: permissionsResult.success ? ValidationStatus.PASS : ValidationStatus.FAIL,
      message: permissionsResult.success
        ? `Secrets file has secure permissions (${permissionsResult.permissions})`
        : `Secrets file has insecure permissions (${permissionsResult.permissions})`,
      remediation: permissionsResult.success ? undefined : 'Run: chmod 600 <secrets-file>',
      documentationLink: 'https://docs.expo.dev/build/variables/',
    });
  }

  const overallStatus = checks.every((check) => check.status === ValidationStatus.PASS)
    ? ValidationStatus.PASS
    : ValidationStatus.FAIL;

  return {
    timestamp,
    overallStatus,
    checks,
    summary:
      overallStatus === ValidationStatus.PASS
        ? 'Secrets management is properly configured'
        : 'Secrets management validation failed',
  };
}
