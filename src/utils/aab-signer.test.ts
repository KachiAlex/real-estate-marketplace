/**
 * Unit tests for AAB Signer
 */

import * as fs from 'fs';
import { execSync } from 'child_process';
import { signAAB, verifyAABSignature, getAABSigningInfo } from './aab-signer';

jest.mock('fs');
jest.mock('child_process');

describe('AABSigner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signAAB', () => {
    it('should sign AAB successfully', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (execSync as jest.Mock).mockReturnValue('');

      const result = signAAB(
        'app-release.aab',
        '~/.android/release.keystore',
        'keystorepass',
        'mykey',
        'keypass'
      );

      expect(result.success).toBe(true);
      expect(result.aabPath).toBe('app-release.aab');
    });

    it('should fail when AAB file does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = signAAB(
        'nonexistent.aab',
        '~/.android/release.keystore',
        'keystorepass',
        'mykey',
        'keypass'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });
  });

  describe('verifyAABSignature', () => {
    it('should verify valid AAB signature', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (execSync as jest.Mock).mockReturnValue('');

      const result = verifyAABSignature('app-release.aab');

      expect(result.verified).toBe(true);
    });

    it('should fail for invalid AAB signature', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (execSync as jest.Mock).mockImplementation(() => {
        throw new Error('Signature verification failed');
      });

      const result = verifyAABSignature('app-release.aab');

      expect(result.verified).toBe(false);
    });
  });

  describe('getAABSigningInfo', () => {
    it('should get signing information from signed AAB', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (execSync as jest.Mock).mockReturnValue('Owner: CN=MyApp, O=MyCompany, C=US');

      const result = getAABSigningInfo('app-release.aab');

      expect(result.signed).toBe(true);
      expect(result.signerDN).toContain('CN=MyApp');
    });
  });
});
