/**
 * Property-Based Tests for Keystore Validator
 *
 * Tests correctness properties for keystore validation:
 * - Property 13: Keystore Validation Before Build
 *
 * **Validates: Requirements 4.4, 4.5**
 */

import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { validateKeystore, quickKeystoreCheck } from './keystore-validator';

jest.mock('fs');
jest.mock('child_process');

describe('KeystoreValidator - Property-Based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 13: Keystore Validation Before Build
   *
   * For any build invocation, the build system must verify that the keystore file
   * exists and is accessible before attempting to build, and must report a clear
   * error with remediation steps if the keystore is missing or inaccessible.
   *
   * **Validates: Requirements 4.4, 4.5**
   */
  describe('Property 13: Keystore Validation Before Build', () => {
    it('should validate keystore before build for any valid keystore path', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 255 }).filter((s) => !s.includes('\0')),
          fc.string({ minLength: 1, maxLength: 100 }),
          (keystorePath, password) => {
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.accessSync as jest.Mock).mockReturnValue(undefined);
            (fs.openSync as jest.Mock).mockReturnValue(1);
            (fs.readSync as jest.Mock).mockImplementation((fd, buffer) => {
              buffer.writeUInt32BE(0xFEEDFEED, 0);
            });
            (fs.closeSync as jest.Mock).mockReturnValue(undefined);
            (execSync as jest.Mock).mockReturnValue('');

            const result = validateKeystore(keystorePath, password);

            // Keystore validation must be performed
            expect(result).toBeDefined();
            expect(result.keystorePath).toBe(keystorePath);
            expect(result.checks).toBeDefined();
            expect(Array.isArray(result.checks)).toBe(true);
            expect(result.checks.length).toBeGreaterThan(0);

            // Result must include validation status
            expect(result.isValid).toBeDefined();
            expect(typeof result.isValid).toBe('boolean');

            // Result must include message
            expect(result.message).toBeDefined();
            expect(typeof result.message).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should report clear error when keystore is missing', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 255 }).filter((s) => !s.includes('\0')),
          fc.string({ minLength: 1, maxLength: 100 }),
          (keystorePath, password) => {
            (fs.existsSync as jest.Mock).mockReturnValue(false);

            const result = validateKeystore(keystorePath, password);

            // Must report failure
            expect(result.isValid).toBe(false);
            expect(result.fileExists).toBe(false);

            // Must include error message
            expect(result.message).toBeDefined();
            expect(result.message.length).toBeGreaterThan(0);

            // Must include remediation in checks
            const failedChecks = result.checks.filter((c) => c.status === 'fail');
            expect(failedChecks.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should report clear error when keystore is not accessible', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 255 }).filter((s) => !s.includes('\0')),
          fc.string({ minLength: 1, maxLength: 100 }),
          (keystorePath, password) => {
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.accessSync as jest.Mock).mockImplementation(() => {
              throw new Error('Permission denied');
            });

            const result = validateKeystore(keystorePath, password);

            // Must report failure
            expect(result.isValid).toBe(false);
            expect(result.isAccessible).toBe(false);

            // Must include error message
            expect(result.message).toBeDefined();
            expect(result.message.length).toBeGreaterThan(0);

            // Must include remediation in checks
            const failedChecks = result.checks.filter((c) => c.status === 'fail');
            expect(failedChecks.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate password for accessible keystores', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 255 }).filter((s) => !s.includes('\0')),
          fc.string({ minLength: 1, maxLength: 100 }),
          (keystorePath, password) => {
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.accessSync as jest.Mock).mockReturnValue(undefined);
            (fs.openSync as jest.Mock).mockReturnValue(1);
            (fs.readSync as jest.Mock).mockImplementation((fd, buffer) => {
              buffer.writeUInt32BE(0xFEEDFEED, 0);
            });
            (fs.closeSync as jest.Mock).mockReturnValue(undefined);
            (execSync as jest.Mock).mockReturnValue('');

            const result = validateKeystore(keystorePath, password);

            // Must check password
            expect(result.passwordValid).toBeDefined();
            expect(typeof result.passwordValid).toBe('boolean');

            // Must include password check in checks
            const passwordChecks = result.checks.filter((c) =>
              c.name.toLowerCase().includes('password')
            );
            expect(passwordChecks.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should provide consistent validation results for same input', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 255 }).filter((s) => !s.includes('\0')),
          fc.string({ minLength: 1, maxLength: 100 }),
          (keystorePath, password) => {
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.accessSync as jest.Mock).mockReturnValue(undefined);
            (fs.openSync as jest.Mock).mockReturnValue(1);
            (fs.readSync as jest.Mock).mockImplementation((fd, buffer) => {
              buffer.writeUInt32BE(0xFEEDFEED, 0);
            });
            (fs.closeSync as jest.Mock).mockReturnValue(undefined);
            (execSync as jest.Mock).mockReturnValue('');

            const result1 = validateKeystore(keystorePath, password);
            const result2 = validateKeystore(keystorePath, password);

            // Results must be consistent
            expect(result1.isValid).toBe(result2.isValid);
            expect(result1.fileExists).toBe(result2.fileExists);
            expect(result1.isAccessible).toBe(result2.isAccessible);
            expect(result1.passwordValid).toBe(result2.passwordValid);
            expect(result1.checks.length).toBe(result2.checks.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle tilde expansion consistently', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }).filter((s) => !s.includes('\0')),
          fc.string({ minLength: 1, maxLength: 100 }),
          (relativePath, password) => {
            const keystorePath = `~/${relativePath}`;
            const homeDir = process.env.HOME || process.env.USERPROFILE || '';

            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.accessSync as jest.Mock).mockReturnValue(undefined);
            (fs.openSync as jest.Mock).mockReturnValue(1);
            (fs.readSync as jest.Mock).mockImplementation((fd, buffer) => {
              buffer.writeUInt32BE(0xFEEDFEED, 0);
            });
            (fs.closeSync as jest.Mock).mockReturnValue(undefined);
            (execSync as jest.Mock).mockReturnValue('');

            const result = validateKeystore(keystorePath, password);

            // Must expand tilde
            expect(result.expandedPath).toBeDefined();
            expect(result.expandedPath).toContain(homeDir);
            expect(result.expandedPath).not.toContain('~');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should recognize both JKS and JCEKS formats', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 255 }).filter((s) => !s.includes('\0')),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.boolean(),
          (keystorePath, password, isJCEKS) => {
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.accessSync as jest.Mock).mockReturnValue(undefined);
            (fs.openSync as jest.Mock).mockReturnValue(1);
            (fs.readSync as jest.Mock).mockImplementation((fd, buffer) => {
              const magic = isJCEKS ? 0xCECECECE : 0xFEEDFEED;
              buffer.writeUInt32BE(magic, 0);
            });
            (fs.closeSync as jest.Mock).mockReturnValue(undefined);
            (execSync as jest.Mock).mockReturnValue('');

            const result = validateKeystore(keystorePath, password);

            // Must recognize format
            expect(result.isValidFormat).toBe(true);

            // Must include format check
            const formatChecks = result.checks.filter((c) =>
              c.name.toLowerCase().includes('format')
            );
            expect(formatChecks.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include all required checks in validation result', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 255 }).filter((s) => !s.includes('\0')),
          fc.string({ minLength: 1, maxLength: 100 }),
          (keystorePath, password) => {
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.accessSync as jest.Mock).mockReturnValue(undefined);
            (fs.openSync as jest.Mock).mockReturnValue(1);
            (fs.readSync as jest.Mock).mockImplementation((fd, buffer) => {
              buffer.writeUInt32BE(0xFEEDFEED, 0);
            });
            (fs.closeSync as jest.Mock).mockReturnValue(undefined);
            (execSync as jest.Mock).mockReturnValue('');

            const result = validateKeystore(keystorePath, password);

            // Must include all required checks
            const checkNames = result.checks.map((c) => c.name);
            expect(checkNames).toContain('File Exists');
            expect(checkNames).toContain('File Accessible');
            expect(checkNames).toContain('Password Valid');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should provide remediation details for failures', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 255 }).filter((s) => !s.includes('\0')),
          fc.string({ minLength: 1, maxLength: 100 }),
          (keystorePath, password) => {
            (fs.existsSync as jest.Mock).mockReturnValue(false);

            const result = validateKeystore(keystorePath, password);

            // Must include details for failures
            if (!result.isValid) {
              expect(result.details).toBeDefined();
              expect(result.details).toBeTruthy();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate keystore integrity when password is valid', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 255 }).filter((s) => !s.includes('\0')),
          fc.string({ minLength: 1, maxLength: 100 }),
          (keystorePath, password) => {
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.accessSync as jest.Mock).mockReturnValue(undefined);
            (fs.openSync as jest.Mock).mockReturnValue(1);
            (fs.readSync as jest.Mock).mockImplementation((fd, buffer) => {
              buffer.writeUInt32BE(0xFEEDFEED, 0);
            });
            (fs.closeSync as jest.Mock).mockReturnValue(undefined);
            (execSync as jest.Mock).mockReturnValue('');

            const result = validateKeystore(keystorePath, password);

            // Must check integrity
            const integrityChecks = result.checks.filter((c) =>
              c.name.toLowerCase().includes('integrity')
            );
            expect(integrityChecks.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
