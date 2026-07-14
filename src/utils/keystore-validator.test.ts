/**
 * Unit tests for Keystore Validator
 *
 * Tests keystore validation functionality including:
 * - File existence and accessibility checks
 * - Format validation
 * - Password validation
 * - Integrity checks
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { validateKeystore, quickKeystoreCheck } from './keystore-validator';

// Mock fs and execSync
jest.mock('fs');
jest.mock('child_process');

describe('KeystoreValidator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateKeystore', () => {
    it('should fail when keystore path is empty', () => {
      const result = validateKeystore('', 'password');
      expect(result.isValid).toBe(false);
      expect(result.fileExists).toBe(false);
      expect(result.checks).toContainEqual(
        expect.objectContaining({
          name: 'Keystore Path Provided',
          status: 'fail',
        })
      );
    });

    it('should fail when keystore file does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = validateKeystore('/path/to/nonexistent.keystore', 'password');
      expect(result.isValid).toBe(false);
      expect(result.fileExists).toBe(false);
      expect(result.checks).toContainEqual(
        expect.objectContaining({
          name: 'File Exists',
          status: 'fail',
        })
      );
    });

    it('should fail when keystore file is not accessible', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.accessSync as jest.Mock).mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = validateKeystore('/path/to/keystore.keystore', 'password');
      expect(result.isValid).toBe(false);
      expect(result.isAccessible).toBe(false);
      expect(result.checks).toContainEqual(
        expect.objectContaining({
          name: 'File Accessible',
          status: 'fail',
        })
      );
    });

    it('should pass file existence and accessibility checks', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.accessSync as jest.Mock).mockReturnValue(undefined);
      (fs.openSync as jest.Mock).mockReturnValue(1);
      (fs.readSync as jest.Mock).mockImplementation((fd, buffer) => {
        // Write JKS magic bytes (0xFEEDFEED)
        buffer.writeUInt32BE(0xFEEDFEED, 0);
      });
      (fs.closeSync as jest.Mock).mockReturnValue(undefined);
      (execSync as jest.Mock).mockReturnValue('');

      const result = validateKeystore('/path/to/keystore.keystore', 'password');
      expect(result.fileExists).toBe(true);
      expect(result.isAccessible).toBe(true);
      expect(result.isValidFormat).toBe(true);
    });

    it('should fail when password is invalid', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.accessSync as jest.Mock).mockReturnValue(undefined);
      (fs.openSync as jest.Mock).mockReturnValue(1);
      (fs.readSync as jest.Mock).mockImplementation((fd, buffer) => {
        buffer.writeUInt32BE(0xFEEDFEED, 0);
      });
      (fs.closeSync as jest.Mock).mockReturnValue(undefined);
      (execSync as jest.Mock).mockImplementation(() => {
        throw new Error('Keystore was tampered with, or password was incorrect');
      });

      const result = validateKeystore('/path/to/keystore.keystore', 'wrongpassword');
      expect(result.passwordValid).toBe(false);
      expect(result.isValid).toBe(false);
      expect(result.checks).toContainEqual(
        expect.objectContaining({
          name: 'Password Valid',
          status: 'fail',
        })
      );
    });

    it('should fail when password is not provided', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.accessSync as jest.Mock).mockReturnValue(undefined);

      const result = validateKeystore('/path/to/keystore.keystore', '');
      expect(result.passwordValid).toBe(false);
      expect(result.checks).toContainEqual(
        expect.objectContaining({
          name: 'Password Provided',
          status: 'fail',
        })
      );
    });

    it('should expand tilde in keystore path', () => {
      const homeDir = process.env.HOME || process.env.USERPROFILE || '';
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.accessSync as jest.Mock).mockReturnValue(undefined);
      (fs.openSync as jest.Mock).mockReturnValue(1);
      (fs.readSync as jest.Mock).mockImplementation((fd, buffer) => {
        buffer.writeUInt32BE(0xFEEDFEED, 0);
      });
      (fs.closeSync as jest.Mock).mockReturnValue(undefined);
      (execSync as jest.Mock).mockReturnValue('');

      const result = validateKeystore('~/.android/release.keystore', 'password');
      expect(result.expandedPath).toBe(path.join(homeDir, '.android/release.keystore'));
    });

    it('should recognize JCEKS format', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.accessSync as jest.Mock).mockReturnValue(undefined);
      (fs.openSync as jest.Mock).mockReturnValue(1);
      (fs.readSync as jest.Mock).mockImplementation((fd, buffer) => {
        // Write JCEKS magic bytes (0xCECECECE)
        buffer.writeUInt32BE(0xCECECECE, 0);
      });
      (fs.closeSync as jest.Mock).mockReturnValue(undefined);
      (execSync as jest.Mock).mockReturnValue('');

      const result = validateKeystore('/path/to/keystore.keystore', 'password');
      expect(result.isValidFormat).toBe(true);
      expect(result.checks).toContainEqual(
        expect.objectContaining({
          name: 'File Format Valid',
          status: 'pass',
          message: expect.stringContaining('JCEKS'),
        })
      );
    });

    it('should return all checks in result', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.accessSync as jest.Mock).mockReturnValue(undefined);
      (fs.openSync as jest.Mock).mockReturnValue(1);
      (fs.readSync as jest.Mock).mockImplementation((fd, buffer) => {
        buffer.writeUInt32BE(0xFEEDFEED, 0);
      });
      (fs.closeSync as jest.Mock).mockReturnValue(undefined);
      (execSync as jest.Mock).mockReturnValue('');

      const result = validateKeystore('/path/to/keystore.keystore', 'password');
      expect(result.checks.length).toBeGreaterThan(0);
      expect(result.checks).toContainEqual(
        expect.objectContaining({
          name: expect.any(String),
          status: expect.stringMatching(/pass|fail|warning/),
          message: expect.any(String),
        })
      );
    });

    it('should include details for failed checks', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.accessSync as jest.Mock).mockReturnValue(undefined);
      (fs.openSync as jest.Mock).mockReturnValue(1);
      (fs.readSync as jest.Mock).mockImplementation((fd, buffer) => {
        buffer.writeUInt32BE(0xFEEDFEED, 0);
      });
      (fs.closeSync as jest.Mock).mockReturnValue(undefined);
      (execSync as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid password');
      });

      const result = validateKeystore('/path/to/keystore.keystore', 'wrongpassword');
      expect(result.details).toBeDefined();
      expect(result.details).toContain('Password Valid');
    });
  });

  describe('quickKeystoreCheck', () => {
    it('should return false when path is empty', () => {
      const result = quickKeystoreCheck('');
      expect(result.isAccessible).toBe(false);
      expect(result.expandedPath).toBeNull();
    });

    it('should return false when file does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = quickKeystoreCheck('/path/to/nonexistent.keystore');
      expect(result.isAccessible).toBe(false);
    });

    it('should return false when file is not accessible', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.accessSync as jest.Mock).mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = quickKeystoreCheck('/path/to/keystore.keystore');
      expect(result.isAccessible).toBe(false);
    });

    it('should return true when file exists and is accessible', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.accessSync as jest.Mock).mockReturnValue(undefined);

      const result = quickKeystoreCheck('/path/to/keystore.keystore');
      expect(result.isAccessible).toBe(true);
    });

    it('should expand tilde in path', () => {
      const homeDir = process.env.HOME || process.env.USERPROFILE || '';
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.accessSync as jest.Mock).mockReturnValue(undefined);

      const result = quickKeystoreCheck('~/.android/release.keystore');
      expect(result.expandedPath).toBe(path.join(homeDir, '.android/release.keystore'));
    });
  });
});
