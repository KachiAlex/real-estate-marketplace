/**
 * Unit Tests for Android Keystore Management Module
 *
 * Tests for keystore accessibility, password validation, key alias extraction,
 * and build.gradle configuration verification.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import {
  checkKeystoreAccessibility,
  validateKeystorePassword,
  extractKeyAlias,
  verifyKeystoreInBuildGradle,
} from './android-keystore';

// Mock dependencies
jest.mock('fs');
jest.mock('child_process');

describe('Android Keystore Management Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkKeystoreAccessibility', () => {
    it('should return accessible when keystore file exists and is readable', () => {
      const keystorePath = '/home/user/.android/release.keystore';
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.accessSync as jest.Mock).mockImplementation(() => {});

      const result = checkKeystoreAccessibility(keystorePath);

      expect(result.isAccessible).toBe(true);
      expect(result.expandedPath).toBe(keystorePath);
      expect(result.message).toContain('accessible');
    });

    it('should expand tilde in keystore path', () => {
      const keystorePath = '~/.android/release.keystore';
      const expandedPath = path.join(process.env.HOME || '', '.android/release.keystore');

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.accessSync as jest.Mock).mockImplementation(() => {});

      const result = checkKeystoreAccessibility(keystorePath);

      expect(result.expandedPath).toBe(expandedPath);
    });

    it('should return not accessible when keystore file does not exist', () => {
      const keystorePath = '/home/user/.android/release.keystore';
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = checkKeystoreAccessibility(keystorePath);

      expect(result.isAccessible).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('should return not accessible when keystore file is not readable', () => {
      const keystorePath = '/home/user/.android/release.keystore';
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.accessSync as jest.Mock).mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = checkKeystoreAccessibility(keystorePath);

      expect(result.isAccessible).toBe(false);
      expect(result.message).toContain('not readable');
    });

    it('should return error when keystore path is empty', () => {
      const result = checkKeystoreAccessibility('');

      expect(result.isAccessible).toBe(false);
      expect(result.message).toContain('required');
    });
  });

  describe('validateKeystorePassword', () => {
    it('should validate keystore password successfully', () => {
      const keystorePath = '/home/user/.android/release.keystore';
      const keystorePassword = 'mypassword';

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.accessSync as jest.Mock).mockImplementation(() => {});
      (execSync as jest.Mock).mockReturnValue('');

      const result = validateKeystorePassword(keystorePath, keystorePassword);

      expect(result.isValid).toBe(true);
      expect(result.message).toContain('valid');
    });

    it('should fail validation when keystore is not accessible', () => {
      const keystorePath = '/home/user/.android/release.keystore';
      const keystorePassword = 'mypassword';

      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = validateKeystorePassword(keystorePath, keystorePassword);

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('should fail validation when password is incorrect', () => {
      const keystorePath = '/home/user/.android/release.keystore';
      const keystorePassword = 'wrongpassword';

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.accessSync as jest.Mock).mockImplementation(() => {});
      (execSync as jest.Mock).mockImplementation(() => {
        throw new Error('keytool error: java.io.IOException: Keystore was tampered with, or password was incorrect');
      });

      const result = validateKeystorePassword(keystorePath, keystorePassword);

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('failed');
    });

    it('should fail validation when password is empty', () => {
      const keystorePath = '/home/user/.android/release.keystore';
      const keystorePassword = '';

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.accessSync as jest.Mock).mockImplementation(() => {});

      const result = validateKeystorePassword(keystorePath, keystorePassword);

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('required');
    });
  });

  describe('extractKeyAlias', () => {
    it('should extract key aliases from keystore', () => {
      const keystorePath = '/home/user/.android/release.keystore';
      const keystorePassword = 'mypassword';
      const keytoolOutput = `Keystore type: PKCS12
Keystore provider: SUN

Your keystore contains 1 entry

release_key, Jan 1, 2024, PrivateKeyEntry, Certificate fingerprint (SHA-256): ...`;

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.accessSync as jest.Mock).mockImplementation(() => {});
      (execSync as jest.Mock)
        .mockReturnValueOnce('') // First call for password validation
        .mockReturnValueOnce(keytoolOutput); // Second call for alias extraction

      const result = extractKeyAlias(keystorePath, keystorePassword);

      expect(result.aliases).toContain('release_key');
      expect(result.aliases.length).toBeGreaterThan(0);
    });

    it('should fail extraction when password is invalid', () => {
      const keystorePath = '/home/user/.android/release.keystore';
      const keystorePassword = 'wrongpassword';

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.accessSync as jest.Mock).mockImplementation(() => {});
      (execSync as jest.Mock).mockImplementation(() => {
        throw new Error('Keystore password incorrect');
      });

      const result = extractKeyAlias(keystorePath, keystorePassword);

      expect(result.aliases).toEqual([]);
      expect(result.message).toContain('failed');
    });

    it('should return empty aliases when keystore has no keys', () => {
      const keystorePath = '/home/user/.android/release.keystore';
      const keystorePassword = 'mypassword';
      const keytoolOutput = `Keystore type: PKCS12
Keystore provider: SUN

Your keystore contains 0 entries`;

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.accessSync as jest.Mock).mockImplementation(() => {});
      (execSync as jest.Mock)
        .mockReturnValueOnce('') // First call for password validation
        .mockReturnValueOnce(keytoolOutput); // Second call for alias extraction

      const result = extractKeyAlias(keystorePath, keystorePassword);

      expect(result.aliases).toEqual([]);
      expect(result.message).toContain('No key aliases');
    });
  });

  describe('verifyKeystoreInBuildGradle', () => {
    it('should verify keystore configuration in build.gradle', () => {
      const buildGradlePath = '/android/app/build.gradle';
      const buildGradleContent = `
signingConfigs {
  debug {
    storeFile file("debug.keystore")
    storePassword "android"
    keyAlias "androiddebugkey"
    keyPassword "android"
  }
  release {
    storeFile file(System.getenv("ANDROID_KEYSTORE_PATH"))
    storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
    keyAlias System.getenv("ANDROID_KEY_ALIAS")
    keyPassword System.getenv("ANDROID_KEY_PASSWORD")
  }
}

buildTypes {
  debug {
    signingConfig signingConfigs.debug
  }
  release {
    signingConfig signingConfigs.release
  }
}`;

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(buildGradleContent);

      const result = verifyKeystoreInBuildGradle(buildGradlePath);

      expect(result.isConfigured).toBe(true);
      expect(result.hasDebugConfig).toBe(true);
      expect(result.hasReleaseConfig).toBe(true);
    });

    it('should fail verification when signingConfigs block is missing', () => {
      const buildGradlePath = '/android/app/build.gradle';
      const buildGradleContent = `
android {
  compileSdk 34
}`;

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(buildGradleContent);

      const result = verifyKeystoreInBuildGradle(buildGradlePath);

      expect(result.isConfigured).toBe(false);
      expect(result.message).toContain('signingConfigs');
    });

    it('should fail verification when build.gradle file does not exist', () => {
      const buildGradlePath = '/android/app/build.gradle';

      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = verifyKeystoreInBuildGradle(buildGradlePath);

      expect(result.isConfigured).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('should use default path when not provided', () => {
      const buildGradleContent = `
signingConfigs {
  debug {
    storeFile file("debug.keystore")
  }
}`;

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(buildGradleContent);

      const result = verifyKeystoreInBuildGradle();

      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.readFileSync).toHaveBeenCalled();
    });
  });
});
