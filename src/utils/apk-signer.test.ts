/**
 * Unit tests for APK Signer
 *
 * Tests APK signing functionality including:
 * - APK signing
 * - Signature verification
 * - APK alignment
 * - Signing information extraction
 */

import * as fs from 'fs';
import { execSync } from 'child_process';
import { signAPK, verifyAPKSignature, alignAPK, getAPKSigningInfo } from './apk-signer';

jest.mock('fs');
jest.mock('child_process');

describe('APKSigner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signAPK', () => {
    it('should sign APK successfully', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (execSync as jest.Mock).mockReturnValue('');

      const result = signAPK(
        'app-release-unsigned.apk',
        '~/.android/release.keystore',
        'keystorepass',
        'mykey',
        'keypass'
      );

      expect(result.success).toBe(true);
      expect(result.apkPath).toBe('app-release-unsigned.apk');
      expect(result.message).toContain('signed successfully');
    });

    it('should fail when APK file does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = signAPK(
        'nonexistent.apk',
        '~/.android/release.keystore',
        'keystorepass',
        'mykey',
        'keypass'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('should fail when keystore file does not exist', () => {
      (fs.existsSync as jest.Mock)
        .mockReturnValueOnce(true) // APK exists
        .mockReturnValueOnce(false); // Keystore doesn't exist

      const result = signAPK(
        'app-release-unsigned.apk',
        '~/.android/release.keystore',
        'keystorepass',
        'mykey',
        'keypass'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Keystore file not found');
    });

    it('should handle jarsigner errors', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (execSync as jest.Mock).mockImplementation(() => {
        throw new Error('jarsigner error');
      });

      const result = signAPK(
        'app-release-unsigned.apk',
        '~/.android/release.keystore',
        'keystorepass',
        'mykey',
        'keypass'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('signing failed');
    });

    it('should verify signature after signing', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (execSync as jest.Mock).mockReturnValue('');

      const result = signAPK(
        'app-release-unsigned.apk',
        '~/.android/release.keystore',
        'keystorepass',
        'mykey',
        'keypass'
      );

      expect(result.signatureVerified).toBeDefined();
    });
  });

  describe('verifyAPKSignature', () => {
    it('should verify valid APK signature', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (execSync as jest.Mock).mockReturnValue('');

      const result = verifyAPKSignature('app-release.apk');

      expect(result.verified).toBe(true);
      expect(result.message).toContain('valid');
    });

    it('should fail for invalid APK signature', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (execSync as jest.Mock).mockImplementation(() => {
        throw new Error('Signature verification failed');
      });

      const result = verifyAPKSignature('app-release.apk');

      expect(result.verified).toBe(false);
      expect(result.message).toContain('verification failed');
    });

    it('should fail when APK file does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = verifyAPKSignature('nonexistent.apk');

      expect(result.verified).toBe(false);
      expect(result.message).toContain('not found');
    });
  });

  describe('alignAPK', () => {
    it('should align APK successfully', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (execSync as jest.Mock).mockReturnValue('');

      const result = alignAPK('app-release.apk', 'app-release-aligned.apk');

      expect(result.success).toBe(true);
      expect(result.alignedPath).toBe('app-release-aligned.apk');
      expect(result.message).toContain('aligned successfully');
    });

    it('should fail when APK file does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = alignAPK('nonexistent.apk', 'app-release-aligned.apk');

      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('should handle zipalign errors', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (execSync as jest.Mock).mockImplementation(() => {
        throw new Error('zipalign error');
      });

      const result = alignAPK('app-release.apk', 'app-release-aligned.apk');

      expect(result.success).toBe(false);
      expect(result.message).toContain('alignment failed');
    });
  });

  describe('getAPKSigningInfo', () => {
    it('should get signing information from signed APK', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (execSync as jest.Mock).mockReturnValue(
        `Owner: CN=MyApp, O=MyCompany, C=US
Issuer: CN=MyApp, O=MyCompany, C=US`
      );

      const result = getAPKSigningInfo('app-release.apk');

      expect(result.signed).toBe(true);
      expect(result.signerDN).toContain('CN=MyApp');
    });

    it('should fail when APK file does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = getAPKSigningInfo('nonexistent.apk');

      expect(result.signed).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('should handle jarsigner errors', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (execSync as jest.Mock).mockImplementation(() => {
        throw new Error('jarsigner error');
      });

      const result = getAPKSigningInfo('app-release.apk');

      expect(result.signed).toBe(false);
      expect(result.message).toContain('Could not retrieve');
    });
  });
});
