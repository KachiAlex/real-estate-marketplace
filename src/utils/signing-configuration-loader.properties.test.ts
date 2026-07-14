/**
 * Property-Based Tests for Signing Configuration Loader
 *
 * Tests correctness properties for signing configuration:
 * - Property 10: Secure Credential Loading
 * - Property 11: Debug Build Automatic Signing
 * - Property 12: Release Build Automatic Signing
 *
 * **Validates: Requirements 4.1, 4.2, 4.3**
 */

import * as fc from 'fast-check';
import * as fs from 'fs';
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

describe('SigningConfigurationLoader - Property-Based Tests', () => {
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

  /**
   * Property 10: Secure Credential Loading
   *
   * For any build execution, signing credentials must be loaded from the keystore
   * without appearing in build logs or output.
   *
   * **Validates: Requirements 4.1, 11.6**
   */
  describe('Property 10: Secure Credential Loading', () => {
    it('should not expose credentials in configuration result', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          (keystorePath, password) => {
            (fs.existsSync as jest.Mock).mockReturnValue(true);

            const result = loadDebugSigningConfiguration();

            // Configuration should be returned
            expect(result.configuration).toBeDefined();

            // But credentials should not appear in message
            if (result.configuration) {
              expect(result.message).not.toContain(result.configuration.keystorePassword);
              expect(result.message).not.toContain(result.configuration.keyPassword);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should load credentials without logging them', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          (keystorePath, password) => {
            (fs.existsSync as jest.Mock).mockReturnValue(true);

            const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();

            loadDebugSigningConfiguration();

            // Debug logs should not contain passwords
            const debugCalls = consoleSpy.mock.calls.map((c) => c[0]);
            debugCalls.forEach((call) => {
              expect(call).not.toContain('android'); // Default password
              expect(call).not.toContain(password);
            });

            consoleSpy.mockRestore();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 11: Debug Build Automatic Signing
   *
   * For any debug build, the build system must automatically use debug signing
   * credentials without requiring manual configuration.
   *
   * **Validates: Requirements 4.2**
   */
  describe('Property 11: Debug Build Automatic Signing', () => {
    it('should automatically load debug credentials', () => {
      fc.assert(
        fc.property(fc.anything(), () => {
          (fs.existsSync as jest.Mock).mockReturnValue(true);

          const result = loadDebugSigningConfiguration();

          // Must load successfully
          expect(result.isValid).toBe(true);
          expect(result.configuration).toBeDefined();

          // Must have all required fields
          expect(result.configuration?.keystorePath).toBeDefined();
          expect(result.configuration?.keystorePassword).toBeDefined();
          expect(result.configuration?.keyAlias).toBeDefined();
          expect(result.configuration?.keyPassword).toBeDefined();
        }),
        { numRuns: 100 }
      );
    });

    it('should use default debug credentials when not configured', () => {
      fc.assert(
        fc.property(fc.anything(), () => {
          // Clear environment variables
          delete process.env.ANDROID_DEBUG_KEYSTORE_PATH;
          delete process.env.ANDROID_DEBUG_KEYSTORE_PASSWORD;
          delete process.env.ANDROID_DEBUG_KEY_ALIAS;
          delete process.env.ANDROID_DEBUG_KEY_PASSWORD;

          (fs.existsSync as jest.Mock).mockReturnValue(true);

          const result = loadDebugSigningConfiguration();

          // Must use defaults
          expect(result.configuration?.keystorePassword).toBe('android');
          expect(result.configuration?.keyAlias).toBe('androiddebugkey');
          expect(result.configuration?.keyPassword).toBe('android');
        }),
        { numRuns: 100 }
      );
    });

    it('should respect custom debug credentials from environment', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          (path, storepass, alias, keypass) => {
            process.env.ANDROID_DEBUG_KEYSTORE_PATH = path;
            process.env.ANDROID_DEBUG_KEYSTORE_PASSWORD = storepass;
            process.env.ANDROID_DEBUG_KEY_ALIAS = alias;
            process.env.ANDROID_DEBUG_KEY_PASSWORD = keypass;

            (fs.existsSync as jest.Mock).mockReturnValue(true);

            const result = loadDebugSigningConfiguration();

            // Must use environment values
            expect(result.configuration?.keystorePath).toBe(path);
            expect(result.configuration?.keystorePassword).toBe(storepass);
            expect(result.configuration?.keyAlias).toBe(alias);
            expect(result.configuration?.keyPassword).toBe(keypass);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 12: Release Build Automatic Signing
   *
   * For any release build or AAB build, the build system must automatically use
   * production keystore credentials without requiring manual configuration.
   *
   * **Validates: Requirements 4.3**
   */
  describe('Property 12: Release Build Automatic Signing', () => {
    it('should load release credentials from environment', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          (path, storepass, alias, keypass) => {
            process.env.ANDROID_KEYSTORE_PATH = path;
            process.env.ANDROID_KEYSTORE_PASSWORD = storepass;
            process.env.ANDROID_KEY_ALIAS = alias;
            process.env.ANDROID_KEY_PASSWORD = keypass;

            (fs.existsSync as jest.Mock).mockReturnValue(true);

            const result = loadReleaseSigningConfiguration();

            // Must load successfully
            expect(result.isValid).toBe(true);
            expect(result.configuration).toBeDefined();

            // Must use environment values
            expect(result.configuration?.keystorePath).toBe(path);
            expect(result.configuration?.keystorePassword).toBe(storepass);
            expect(result.configuration?.keyAlias).toBe(alias);
            expect(result.configuration?.keyPassword).toBe(keypass);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should fail when release credentials are missing', () => {
      fc.assert(
        fc.property(fc.anything(), () => {
          // Clear environment variables
          delete process.env.ANDROID_KEYSTORE_PATH;
          delete process.env.ANDROID_KEYSTORE_PASSWORD;
          delete process.env.ANDROID_KEY_ALIAS;
          delete process.env.ANDROID_KEY_PASSWORD;

          const result = loadReleaseSigningConfiguration();

          // Must fail
          expect(result.isValid).toBe(false);
          expect(result.configuration).toBeNull();
          expect(result.message).toContain('Missing required environment variables');
        }),
        { numRuns: 100 }
      );
    });

    it('should support variant-based configuration selection', () => {
      fc.assert(
        fc.property(fc.anything(), () => {
          (fs.existsSync as jest.Mock).mockReturnValue(true);

          // Debug variant
          const debugResult = getSigningConfiguration('debug');
          expect(debugResult.isValid).toBe(true);
          expect(debugResult.configuration?.keyAlias).toBe('androiddebugkey');

          // Release variant
          process.env.ANDROID_KEYSTORE_PATH = '/path/to/release.keystore';
          process.env.ANDROID_KEYSTORE_PASSWORD = 'releasepass';
          process.env.ANDROID_KEY_ALIAS = 'releasealias';
          process.env.ANDROID_KEY_PASSWORD = 'releasekeypass';

          const releaseResult = getSigningConfiguration('release');
          expect(releaseResult.isValid).toBe(true);
          expect(releaseResult.configuration?.keyAlias).toBe('releasealias');
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional property tests for robustness
   */
  describe('Additional Robustness Properties', () => {
    it('should handle various keystore path formats', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant('/absolute/path/keystore.keystore'),
            fc.constant('relative/path/keystore.keystore'),
            fc.constant('~/.android/keystore.keystore'),
            fc.constant('~/keystore.keystore')
          ),
          (keystorePath) => {
            (fs.existsSync as jest.Mock).mockReturnValue(true);

            process.env.ANDROID_KEYSTORE_PATH = keystorePath;
            process.env.ANDROID_KEYSTORE_PASSWORD = 'pass';
            process.env.ANDROID_KEY_ALIAS = 'alias';
            process.env.ANDROID_KEY_PASSWORD = 'keypass';

            const result = loadReleaseSigningConfiguration();

            // Must handle all path formats
            expect(result.configuration?.keystorePath).toBe(keystorePath);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should provide consistent results for same input', () => {
      fc.assert(
        fc.property(fc.anything(), () => {
          (fs.existsSync as jest.Mock).mockReturnValue(true);

          const result1 = loadDebugSigningConfiguration();
          const result2 = loadDebugSigningConfiguration();

          // Results must be consistent
          expect(result1.isValid).toBe(result2.isValid);
          expect(result1.configuration?.keystorePath).toBe(result2.configuration?.keystorePath);
          expect(result1.configuration?.keyAlias).toBe(result2.configuration?.keyAlias);
        }),
        { numRuns: 100 }
      );
    });

    it('should extract key aliases consistently', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          (keystorePath, password) => {
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (execSync as jest.Mock).mockReturnValue(
              `Keystore type: JCEKS
Your keystore contains 1 entries
mykey, Jan 1, 2024, PrivateKeyEntry`
            );

            const aliases1 = extractKeyAliases(keystorePath, password);
            const aliases2 = extractKeyAliases(keystorePath, password);

            // Results must be consistent
            expect(aliases1).toEqual(aliases2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate key passwords consistently', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          (keystorePath, storepass, alias, keypass) => {
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (execSync as jest.Mock).mockReturnValue('');

            const result1 = validateKeyPassword(keystorePath, storepass, alias, keypass);
            const result2 = validateKeyPassword(keystorePath, storepass, alias, keypass);

            // Results must be consistent
            expect(result1).toBe(result2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
