/**
 * Unit tests for Signing Configuration Loader
 *
 * Tests signing configuration loading functionality including:
 * - Debug signing configuration loading
 * - Release signing configuration loading
 * - Key alias extraction
 * - Key password validation
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import {
  loadDebugSigningConfiguration,
  loadReleaseSigningConfiguration,
  extractKeyAliases,
  validateKeyPassword,
  getSigningConfiguration,
} from './signing-configuration-loader';

jest.mock('fs');
jest.mock('child_process');

describe('SigningConfigurationLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.ANDROID_DEBUG_KEYSTORE_PATH;
    delete process.env.ANDROID_DEBUG_KEYSTORE_PASSWORD;
    delete process.env.ANDROID_DEBUG_KEY_ALIAS;
    delete process.env.ANDROID_DEBUG_KEY_PASSWORD;
    delete process.env.ANDROID_KEYSTORE_PATH;
    delete process.env.ANDROID_KEYSTORE_PASSWORD;
    delete process.env.ANDROID_KEY_ALIAS;
    delete process.env.ANDROID_KEY_PASSWORD;
  });

  describe('loadDebugSigningConfiguration', () => {
    it('should load debug configuration with defaults', () => {
      const homeDir = process.env.HOME || process.env.USERPROFILE || '';
      const debugKeystorePath = path.join(homeDir, '.android', 'debug.keystore');
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const result = loadDebugSigningConfiguration();

      expect(result.isValid).toBe(true);
      expect(result.configuration).toBeDefined();
      expect(result.configuration?.keystorePath).toBe(debugKeystorePath);
      expect(result.configuration?.keystorePassword).toBe('android');
      expect(result.configuration?.keyAlias).toBe('androiddebugkey');
      expect(result.configuration?.keyPassword).toBe('android');
    });

    it('should load debug configuration from environment variables', () => {
      process.env.ANDROID_DEBUG_KEYSTORE_PATH = '/custom/debug.keystore';
      process.env.ANDROID_DEBUG_KEYSTORE_PASSWORD = 'custompass';
      process.env.ANDROID_DEBUG_KEY_ALIAS = 'customalias';
      process.env.ANDROID_DEBUG_KEY_PASSWORD = 'customkeypass';

      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const result = loadDebugSigningConfiguration();

      expect(result.isValid).toBe(true);
      expect(result.configuration?.keystorePath).toBe('/custom/debug.keystore');
      expect(result.configuration?.keystorePassword).toBe('custompass');
      expect(result.configuration?.keyAlias).toBe('customalias');
      expect(result.configuration?.keyPassword).toBe('customkeypass');
    });

    it('should fail when debug keystore does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = loadDebugSigningConfiguration();

      expect(result.isValid).toBe(false);
      expect(result.configuration).toBeNull();
      expect(result.message).toContain('not found');
    });

    it('should expand tilde in debug keystore path', () => {
      process.env.ANDROID_DEBUG_KEYSTORE_PATH = '~/.android/debug.keystore';
      const homeDir = process.env.HOME || process.env.USERPROFILE || '';
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const result = loadDebugSigningConfiguration();

      expect(result.isValid).toBe(true);
      expect(result.configuration?.keystorePath).toBe('~/.android/debug.keystore');
    });
  });

  describe('loadReleaseSigningConfiguration', () => {
    it('should load release configuration from environment variables', () => {
      process.env.ANDROID_KEYSTORE_PATH = '/path/to/release.keystore';
      process.env.ANDROID_KEYSTORE_PASSWORD = 'releasepass';
      process.env.ANDROID_KEY_ALIAS = 'releasealias';
      process.env.ANDROID_KEY_PASSWORD = 'releasekeypass';

      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const result = loadReleaseSigningConfiguration();

      expect(result.isValid).toBe(true);
      expect(result.configuration?.keystorePath).toBe('/path/to/release.keystore');
      expect(result.configuration?.keystorePassword).toBe('releasepass');
      expect(result.configuration?.keyAlias).toBe('releasealias');
      expect(result.configuration?.keyPassword).toBe('releasekeypass');
    });

    it('should fail when required environment variables are missing', () => {
      process.env.ANDROID_KEYSTORE_PATH = '/path/to/release.keystore';
      // Missing other required variables

      const result = loadReleaseSigningConfiguration();

      expect(result.isValid).toBe(false);
      expect(result.configuration).toBeNull();
      expect(result.message).toContain('Missing required environment variables');
    });

    it('should fail when keystore file does not exist', () => {
      process.env.ANDROID_KEYSTORE_PATH = '/path/to/release.keystore';
      process.env.ANDROID_KEYSTORE_PASSWORD = 'releasepass';
      process.env.ANDROID_KEY_ALIAS = 'releasealias';
      process.env.ANDROID_KEY_PASSWORD = 'releasekeypass';

      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = loadReleaseSigningConfiguration();

      expect(result.isValid).toBe(false);
      expect(result.configuration).toBeNull();
      expect(result.message).toContain('not found');
    });

    it('should include optional certificate subject DN', () => {
      process.env.ANDROID_KEYSTORE_PATH = '/path/to/release.keystore';
      process.env.ANDROID_KEYSTORE_PASSWORD = 'releasepass';
      process.env.ANDROID_KEY_ALIAS = 'releasealias';
      process.env.ANDROID_KEY_PASSWORD = 'releasekeypass';
      process.env.ANDROID_CERTIFICATE_SUBJECT_DN = 'CN=MyApp,O=MyCompany';

      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const result = loadReleaseSigningConfiguration();

      expect(result.isValid).toBe(true);
      expect(result.configuration?.certificateSubjectDN).toBe('CN=MyApp,O=MyCompany');
    });
  });

  describe('extractKeyAliases', () => {
    it('should extract key aliases from keystore', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (execSync as jest.Mock).mockReturnValue(
        `Keystore type: JCEKS
Keystore provider: SunJCEKS

Your keystore contains 2 entries

mykey, Jan 1, 2024, PrivateKeyEntry, Certificate fingerprint
anotherkey, Jan 1, 2024, PrivateKeyEntry, Certificate fingerprint`
      );

      const aliases = extractKeyAliases('/path/to/keystore.keystore', 'password');

      expect(aliases).toContain('mykey');
      expect(aliases).toContain('anotherkey');
      expect(aliases.length).toBe(2);
    });

    it('should return empty array when keystore does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const aliases = extractKeyAliases('/path/to/nonexistent.keystore', 'password');

      expect(aliases).toEqual([]);
    });

    it('should handle keytool errors gracefully', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (execSync as jest.Mock).mockImplementation(() => {
        throw new Error('Keystore was tampered with');
      });

      const aliases = extractKeyAliases('/path/to/keystore.keystore', 'wrongpassword');

      expect(aliases).toEqual([]);
    });

    it('should expand tilde in keystore path', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (execSync as jest.Mock).mockReturnValue('');

      extractKeyAliases('~/.android/release.keystore', 'password');

      expect(fs.existsSync).toHaveBeenCalled();
    });
  });

  describe('validateKeyPassword', () => {
    it('should validate correct key password', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (execSync as jest.Mock).mockReturnValue('');

      const isValid = validateKeyPassword(
        '/path/to/keystore.keystore',
        'keystorepass',
        'mykey',
        'keypass'
      );

      expect(isValid).toBe(true);
    });

    it('should fail for incorrect key password', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (execSync as jest.Mock).mockImplementation(() => {
        throw new Error('Keystore was tampered with, or password was incorrect');
      });

      const isValid = validateKeyPassword(
        '/path/to/keystore.keystore',
        'keystorepass',
        'mykey',
        'wrongpass'
      );

      expect(isValid).toBe(false);
    });

    it('should fail when keystore does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const isValid = validateKeyPassword(
        '/path/to/nonexistent.keystore',
        'keystorepass',
        'mykey',
        'keypass'
      );

      expect(isValid).toBe(false);
    });
  });

  describe('getSigningConfiguration', () => {
    it('should load debug configuration for debug variant', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const result = getSigningConfiguration('debug');

      expect(result.isValid).toBe(true);
      expect(result.configuration?.keyAlias).toBe('androiddebugkey');
    });

    it('should load release configuration for release variant', () => {
      process.env.ANDROID_KEYSTORE_PATH = '/path/to/release.keystore';
      process.env.ANDROID_KEYSTORE_PASSWORD = 'releasepass';
      process.env.ANDROID_KEY_ALIAS = 'releasealias';
      process.env.ANDROID_KEY_PASSWORD = 'releasekeypass';

      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const result = getSigningConfiguration('release');

      expect(result.isValid).toBe(true);
      expect(result.configuration?.keyAlias).toBe('releasealias');
    });

    it('should fail for unknown variant', () => {
      const result = getSigningConfiguration('unknown' as any);

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Unknown build variant');
    });
  });
});
