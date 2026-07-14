/**
 * Tests for BuildConfigurationLoader
 *
 * Tests loading, parsing, and validation of build profiles from configuration files.
 * Covers success cases, error handling, and edge cases.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  BuildConfigurationLoader,
  ConfigurationError,
  ConfigurationErrorType,
  createBuildConfigurationLoader,
} from './build-configuration-loader';
import { BuildType } from '../types/android-build';

describe('BuildConfigurationLoader', () => {
  let loader: BuildConfigurationLoader;
  let tempDir: string;

  beforeEach(() => {
    loader = new BuildConfigurationLoader();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'build-config-test-'));
  });

  afterEach(() => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    loader.clearCache();
  });

  describe('loadProfile', () => {
    it('should load a valid profile from configuration file', () => {
      const configPath = path.join(tempDir, 'build-config.json');
      const config = {
        profiles: {
          development: {
            name: 'development',
            buildType: 'debug',
            variant: 'debug',
            signingConfig: {
              keystorePath: '.android/debug.keystore',
              keystorePassword: 'android',
              keyAlias: 'androiddebugkey',
              keyPassword: 'android',
            },
            buildParameters: {
              minifyEnabled: false,
              shrinkResources: false,
              debuggable: true,
              versionCode: 1,
              versionName: '1.0.0',
            },
            environmentVariables: {
              API_ENDPOINT: 'https://dev-api.example.com',
            },
            outputDirectory: 'build-artifacts/debug',
          },
        },
      };

      fs.writeFileSync(configPath, JSON.stringify(config));

      const profile = loader.loadProfile(configPath, 'development');

      expect(profile.name).toBe('development');
      expect(profile.buildType).toBe(BuildType.Debug);
      expect(profile.variant).toBe('debug');
      expect(profile.signingConfig.keystorePath).toBe('.android/debug.keystore');
      expect(profile.buildParameters.minifyEnabled).toBe(false);
      expect(profile.environmentVariables.API_ENDPOINT).toBe('https://dev-api.example.com');
    });

    it('should throw error when profile does not exist', () => {
      const configPath = path.join(tempDir, 'build-config.json');
      const config = {
        profiles: {
          development: {
            name: 'development',
            buildType: 'debug',
            variant: 'debug',
            signingConfig: {
              keystorePath: '.android/debug.keystore',
              keystorePassword: 'android',
              keyAlias: 'androiddebugkey',
              keyPassword: 'android',
            },
            buildParameters: {
              minifyEnabled: false,
              shrinkResources: false,
              debuggable: true,
              versionCode: 1,
              versionName: '1.0.0',
            },
            environmentVariables: {},
            outputDirectory: 'build-artifacts/debug',
          },
        },
      };

      fs.writeFileSync(configPath, JSON.stringify(config));

      expect(() => loader.loadProfile(configPath, 'nonexistent')).toThrow(ConfigurationError);
      expect(() => loader.loadProfile(configPath, 'nonexistent')).toThrow(
        /Profile "nonexistent" not found/,
      );
    });

    it('should throw error when configuration file does not exist', () => {
      const configPath = path.join(tempDir, 'nonexistent.json');

      expect(() => loader.loadProfile(configPath, 'development')).toThrow(ConfigurationError);
      expect(() => loader.loadProfile(configPath, 'development')).toThrow(
        /Configuration file not found/,
      );
    });

    it('should throw error when configuration file contains invalid JSON', () => {
      const configPath = path.join(tempDir, 'build-config.json');
      fs.writeFileSync(configPath, 'invalid json {');

      expect(() => loader.loadProfile(configPath, 'development')).toThrow(ConfigurationError);
      expect(() => loader.loadProfile(configPath, 'development')).toThrow(/invalid JSON/);
    });

    it('should throw error when profile is missing required field', () => {
      const configPath = path.join(tempDir, 'build-config.json');
      const config = {
        profiles: {
          development: {
            name: 'development',
            buildType: 'debug',
            variant: 'debug',
            // Missing signingConfig
            buildParameters: {
              minifyEnabled: false,
              shrinkResources: false,
              debuggable: true,
              versionCode: 1,
              versionName: '1.0.0',
            },
            environmentVariables: {},
            outputDirectory: 'build-artifacts/debug',
          },
        },
      };

      fs.writeFileSync(configPath, JSON.stringify(config));

      expect(() => loader.loadProfile(configPath, 'development')).toThrow(ConfigurationError);
      expect(() => loader.loadProfile(configPath, 'development')).toThrow(
        /missing required field.*signingConfig/,
      );
    });

    it('should throw error when buildType is invalid', () => {
      const configPath = path.join(tempDir, 'build-config.json');
      const config = {
        profiles: {
          development: {
            name: 'development',
            buildType: 'invalid',
            variant: 'debug',
            signingConfig: {
              keystorePath: '.android/debug.keystore',
              keystorePassword: 'android',
              keyAlias: 'androiddebugkey',
              keyPassword: 'android',
            },
            buildParameters: {
              minifyEnabled: false,
              shrinkResources: false,
              debuggable: true,
              versionCode: 1,
              versionName: '1.0.0',
            },
            environmentVariables: {},
            outputDirectory: 'build-artifacts/debug',
          },
        },
      };

      fs.writeFileSync(configPath, JSON.stringify(config));

      expect(() => loader.loadProfile(configPath, 'development')).toThrow(ConfigurationError);
      expect(() => loader.loadProfile(configPath, 'development')).toThrow(/invalid buildType/);
    });

    it('should throw error when signing configuration is invalid', () => {
      const configPath = path.join(tempDir, 'build-config.json');
      const config = {
        profiles: {
          development: {
            name: 'development',
            buildType: 'debug',
            variant: 'debug',
            signingConfig: {
              keystorePath: '.android/debug.keystore',
              // Missing keystorePassword
              keyAlias: 'androiddebugkey',
              keyPassword: 'android',
            },
            buildParameters: {
              minifyEnabled: false,
              shrinkResources: false,
              debuggable: true,
              versionCode: 1,
              versionName: '1.0.0',
            },
            environmentVariables: {},
            outputDirectory: 'build-artifacts/debug',
          },
        },
      };

      fs.writeFileSync(configPath, JSON.stringify(config));

      expect(() => loader.loadProfile(configPath, 'development')).toThrow(ConfigurationError);
      expect(() => loader.loadProfile(configPath, 'development')).toThrow(/invalid signingConfig/);
    });

    it('should throw error when build parameters are invalid', () => {
      const configPath = path.join(tempDir, 'build-config.json');
      const config = {
        profiles: {
          development: {
            name: 'development',
            buildType: 'debug',
            variant: 'debug',
            signingConfig: {
              keystorePath: '.android/debug.keystore',
              keystorePassword: 'android',
              keyAlias: 'androiddebugkey',
              keyPassword: 'android',
            },
            buildParameters: {
              minifyEnabled: 'not-a-boolean',
              shrinkResources: false,
              debuggable: true,
              versionCode: 1,
              versionName: '1.0.0',
            },
            environmentVariables: {},
            outputDirectory: 'build-artifacts/debug',
          },
        },
      };

      fs.writeFileSync(configPath, JSON.stringify(config));

      expect(() => loader.loadProfile(configPath, 'development')).toThrow(ConfigurationError);
      expect(() => loader.loadProfile(configPath, 'development')).toThrow(/minifyEnabled must be boolean/);
    });

    it('should throw error when versionCode is invalid', () => {
      const configPath = path.join(tempDir, 'build-config.json');
      const config = {
        profiles: {
          development: {
            name: 'development',
            buildType: 'debug',
            variant: 'debug',
            signingConfig: {
              keystorePath: '.android/debug.keystore',
              keystorePassword: 'android',
              keyAlias: 'androiddebugkey',
              keyPassword: 'android',
            },
            buildParameters: {
              minifyEnabled: false,
              shrinkResources: false,
              debuggable: true,
              versionCode: 0,
              versionName: '1.0.0',
            },
            environmentVariables: {},
            outputDirectory: 'build-artifacts/debug',
          },
        },
      };

      fs.writeFileSync(configPath, JSON.stringify(config));

      expect(() => loader.loadProfile(configPath, 'development')).toThrow(ConfigurationError);
      expect(() => loader.loadProfile(configPath, 'development')).toThrow(/versionCode must be a positive number/);
    });

    it('should throw error when versionName is empty', () => {
      const configPath = path.join(tempDir, 'build-config.json');
      const config = {
        profiles: {
          development: {
            name: 'development',
            buildType: 'debug',
            variant: 'debug',
            signingConfig: {
              keystorePath: '.android/debug.keystore',
              keystorePassword: 'android',
              keyAlias: 'androiddebugkey',
              keyPassword: 'android',
            },
            buildParameters: {
              minifyEnabled: false,
              shrinkResources: false,
              debuggable: true,
              versionCode: 1,
              versionName: '',
            },
            environmentVariables: {},
            outputDirectory: 'build-artifacts/debug',
          },
        },
      };

      fs.writeFileSync(configPath, JSON.stringify(config));

      expect(() => loader.loadProfile(configPath, 'development')).toThrow(ConfigurationError);
      expect(() => loader.loadProfile(configPath, 'development')).toThrow(/versionName must be a non-empty string/);
    });

    it('should cache loaded profiles', () => {
      const configPath = path.join(tempDir, 'build-config.json');
      const config = {
        profiles: {
          development: {
            name: 'development',
            buildType: 'debug',
            variant: 'debug',
            signingConfig: {
              keystorePath: '.android/debug.keystore',
              keystorePassword: 'android',
              keyAlias: 'androiddebugkey',
              keyPassword: 'android',
            },
            buildParameters: {
              minifyEnabled: false,
              shrinkResources: false,
              debuggable: true,
              versionCode: 1,
              versionName: '1.0.0',
            },
            environmentVariables: {},
            outputDirectory: 'build-artifacts/debug',
          },
        },
      };

      fs.writeFileSync(configPath, JSON.stringify(config));

      const profile1 = loader.loadProfile(configPath, 'development');
      const profile2 = loader.loadProfile(configPath, 'development');

      expect(profile1).toBe(profile2); // Same object reference (cached)
    });
  });

  describe('loadAllProfiles', () => {
    it('should load all profiles from configuration file', () => {
      const configPath = path.join(tempDir, 'build-config.json');
      const config = {
        profiles: {
          development: {
            name: 'development',
            buildType: 'debug',
            variant: 'debug',
            signingConfig: {
              keystorePath: '.android/debug.keystore',
              keystorePassword: 'android',
              keyAlias: 'androiddebugkey',
              keyPassword: 'android',
            },
            buildParameters: {
              minifyEnabled: false,
              shrinkResources: false,
              debuggable: true,
              versionCode: 1,
              versionName: '1.0.0',
            },
            environmentVariables: {},
            outputDirectory: 'build-artifacts/debug',
          },
          production: {
            name: 'production',
            buildType: 'release',
            variant: 'release',
            signingConfig: {
              keystorePath: '.android/production.keystore',
              keystorePassword: 'prod-password',
              keyAlias: 'prod-key',
              keyPassword: 'prod-key-password',
            },
            buildParameters: {
              minifyEnabled: true,
              shrinkResources: true,
              debuggable: false,
              versionCode: 100,
              versionName: '1.0.0',
            },
            environmentVariables: {},
            outputDirectory: 'build-artifacts/release',
          },
        },
      };

      fs.writeFileSync(configPath, JSON.stringify(config));

      const profiles = loader.loadAllProfiles(configPath);

      expect(profiles.size).toBe(2);
      expect(profiles.has('development')).toBe(true);
      expect(profiles.has('production')).toBe(true);
      expect(profiles.get('development')?.buildType).toBe(BuildType.Debug);
      expect(profiles.get('production')?.buildType).toBe(BuildType.Release);
    });

    it('should skip invalid profiles and continue loading others', () => {
      const configPath = path.join(tempDir, 'build-config.json');
      const config = {
        profiles: {
          development: {
            name: 'development',
            buildType: 'debug',
            variant: 'debug',
            signingConfig: {
              keystorePath: '.android/debug.keystore',
              keystorePassword: 'android',
              keyAlias: 'androiddebugkey',
              keyPassword: 'android',
            },
            buildParameters: {
              minifyEnabled: false,
              shrinkResources: false,
              debuggable: true,
              versionCode: 1,
              versionName: '1.0.0',
            },
            environmentVariables: {},
            outputDirectory: 'build-artifacts/debug',
          },
          invalid: {
            name: 'invalid',
            buildType: 'invalid-type',
            variant: 'debug',
            signingConfig: {
              keystorePath: '.android/debug.keystore',
              keystorePassword: 'android',
              keyAlias: 'androiddebugkey',
              keyPassword: 'android',
            },
            buildParameters: {
              minifyEnabled: false,
              shrinkResources: false,
              debuggable: true,
              versionCode: 1,
              versionName: '1.0.0',
            },
            environmentVariables: {},
            outputDirectory: 'build-artifacts/debug',
          },
        },
      };

      fs.writeFileSync(configPath, JSON.stringify(config));

      const profiles = loader.loadAllProfiles(configPath);

      expect(profiles.size).toBe(1);
      expect(profiles.has('development')).toBe(true);
      expect(profiles.has('invalid')).toBe(false);
    });

    it('should throw error when no valid profiles found', () => {
      const configPath = path.join(tempDir, 'build-config.json');
      const config = {
        profiles: {
          invalid1: {
            name: 'invalid1',
            buildType: 'invalid-type',
            variant: 'debug',
            signingConfig: {
              keystorePath: '.android/debug.keystore',
              keystorePassword: 'android',
              keyAlias: 'androiddebugkey',
              keyPassword: 'android',
            },
            buildParameters: {
              minifyEnabled: false,
              shrinkResources: false,
              debuggable: true,
              versionCode: 1,
              versionName: '1.0.0',
            },
            environmentVariables: {},
            outputDirectory: 'build-artifacts/debug',
          },
        },
      };

      fs.writeFileSync(configPath, JSON.stringify(config));

      expect(() => loader.loadAllProfiles(configPath)).toThrow(ConfigurationError);
      expect(() => loader.loadAllProfiles(configPath)).toThrow(/No valid profiles found/);
    });
  });

  describe('listProfiles', () => {
    it('should return list of available profile names', () => {
      const configPath = path.join(tempDir, 'build-config.json');
      const config = {
        profiles: {
          development: {
            name: 'development',
            buildType: 'debug',
            variant: 'debug',
            signingConfig: {
              keystorePath: '.android/debug.keystore',
              keystorePassword: 'android',
              keyAlias: 'androiddebugkey',
              keyPassword: 'android',
            },
            buildParameters: {
              minifyEnabled: false,
              shrinkResources: false,
              debuggable: true,
              versionCode: 1,
              versionName: '1.0.0',
            },
            environmentVariables: {},
            outputDirectory: 'build-artifacts/debug',
          },
          production: {
            name: 'production',
            buildType: 'release',
            variant: 'release',
            signingConfig: {
              keystorePath: '.android/production.keystore',
              keystorePassword: 'prod-password',
              keyAlias: 'prod-key',
              keyPassword: 'prod-key-password',
            },
            buildParameters: {
              minifyEnabled: true,
              shrinkResources: true,
              debuggable: false,
              versionCode: 100,
              versionName: '1.0.0',
            },
            environmentVariables: {},
            outputDirectory: 'build-artifacts/release',
          },
        },
      };

      fs.writeFileSync(configPath, JSON.stringify(config));

      const profiles = loader.listProfiles(configPath);

      expect(profiles).toContain('development');
      expect(profiles).toContain('production');
      expect(profiles.length).toBe(2);
    });

    it('should throw error when configuration file does not exist', () => {
      const configPath = path.join(tempDir, 'nonexistent.json');

      expect(() => loader.listProfiles(configPath)).toThrow(ConfigurationError);
    });
  });

  describe('profileExists', () => {
    it('should return true when profile exists', () => {
      const configPath = path.join(tempDir, 'build-config.json');
      const config = {
        profiles: {
          development: {
            name: 'development',
            buildType: 'debug',
            variant: 'debug',
            signingConfig: {
              keystorePath: '.android/debug.keystore',
              keystorePassword: 'android',
              keyAlias: 'androiddebugkey',
              keyPassword: 'android',
            },
            buildParameters: {
              minifyEnabled: false,
              shrinkResources: false,
              debuggable: true,
              versionCode: 1,
              versionName: '1.0.0',
            },
            environmentVariables: {},
            outputDirectory: 'build-artifacts/debug',
          },
        },
      };

      fs.writeFileSync(configPath, JSON.stringify(config));

      expect(loader.profileExists(configPath, 'development')).toBe(true);
    });

    it('should return false when profile does not exist', () => {
      const configPath = path.join(tempDir, 'build-config.json');
      const config = {
        profiles: {
          development: {
            name: 'development',
            buildType: 'debug',
            variant: 'debug',
            signingConfig: {
              keystorePath: '.android/debug.keystore',
              keystorePassword: 'android',
              keyAlias: 'androiddebugkey',
              keyPassword: 'android',
            },
            buildParameters: {
              minifyEnabled: false,
              shrinkResources: false,
              debuggable: true,
              versionCode: 1,
              versionName: '1.0.0',
            },
            environmentVariables: {},
            outputDirectory: 'build-artifacts/debug',
          },
        },
      };

      fs.writeFileSync(configPath, JSON.stringify(config));

      expect(loader.profileExists(configPath, 'nonexistent')).toBe(false);
    });

    it('should return false when configuration file does not exist', () => {
      const configPath = path.join(tempDir, 'nonexistent.json');

      expect(loader.profileExists(configPath, 'development')).toBe(false);
    });
  });

  describe('clearCache', () => {
    it('should clear all caches', () => {
      const configPath = path.join(tempDir, 'build-config.json');
      const config = {
        profiles: {
          development: {
            name: 'development',
            buildType: 'debug',
            variant: 'debug',
            signingConfig: {
              keystorePath: '.android/debug.keystore',
              keystorePassword: 'android',
              keyAlias: 'androiddebugkey',
              keyPassword: 'android',
            },
            buildParameters: {
              minifyEnabled: false,
              shrinkResources: false,
              debuggable: true,
              versionCode: 1,
              versionName: '1.0.0',
            },
            environmentVariables: {},
            outputDirectory: 'build-artifacts/debug',
          },
        },
      };

      fs.writeFileSync(configPath, JSON.stringify(config));

      const profile1 = loader.loadProfile(configPath, 'development');
      loader.clearCache();
      const profile2 = loader.loadProfile(configPath, 'development');

      expect(profile1).not.toBe(profile2); // Different object references after cache clear
    });
  });

  describe('createBuildConfigurationLoader', () => {
    it('should create a new BuildConfigurationLoader instance', () => {
      const loader1 = createBuildConfigurationLoader();
      const loader2 = createBuildConfigurationLoader();

      expect(loader1).toBeInstanceOf(BuildConfigurationLoader);
      expect(loader2).toBeInstanceOf(BuildConfigurationLoader);
      expect(loader1).not.toBe(loader2);
    });
  });

  describe('ConfigurationError', () => {
    it('should have correct error type and message', () => {
      const error = new ConfigurationError(
        ConfigurationErrorType.FileNotFound,
        'Test message',
        'Test details',
        'Test remediation',
      );

      expect(error.type).toBe(ConfigurationErrorType.FileNotFound);
      expect(error.message).toBe('Test message');
      expect(error.details).toBe('Test details');
      expect(error.remediation).toBe('Test remediation');
      expect(error.name).toBe('ConfigurationError');
    });
  });

  describe('Error handling', () => {
    it('should provide helpful error message when configuration file is empty', () => {
      const configPath = path.join(tempDir, 'build-config.json');
      fs.writeFileSync(configPath, '{}');

      expect(() => loader.loadProfile(configPath, 'development')).toThrow(ConfigurationError);
      expect(() => loader.loadProfile(configPath, 'development')).toThrow(/must contain a "profiles" object/);
    });

    it('should provide helpful error message when profile is not an object', () => {
      const configPath = path.join(tempDir, 'build-config.json');
      const config = {
        profiles: {
          development: 'not-an-object',
        },
      };

      fs.writeFileSync(configPath, JSON.stringify(config));

      expect(() => loader.loadProfile(configPath, 'development')).toThrow(ConfigurationError);
      expect(() => loader.loadProfile(configPath, 'development')).toThrow(/must be an object/);
    });

    it('should provide helpful error message when field has wrong type', () => {
      const configPath = path.join(tempDir, 'build-config.json');
      const config = {
        profiles: {
          development: {
            name: 'development',
            buildType: 123,
            variant: 'debug',
            signingConfig: {
              keystorePath: '.android/debug.keystore',
              keystorePassword: 'android',
              keyAlias: 'androiddebugkey',
              keyPassword: 'android',
            },
            buildParameters: {
              minifyEnabled: false,
              shrinkResources: false,
              debuggable: true,
              versionCode: 1,
              versionName: '1.0.0',
            },
            environmentVariables: {},
            outputDirectory: 'build-artifacts/debug',
          },
        },
      };

      fs.writeFileSync(configPath, JSON.stringify(config));

      expect(() => loader.loadProfile(configPath, 'development')).toThrow(ConfigurationError);
      expect(() => loader.loadProfile(configPath, 'development')).toThrow(/wrong type/);
    });
  });

  describe('Release build profile', () => {
    it('should load release profile with correct configuration', () => {
      const configPath = path.join(tempDir, 'build-config.json');
      const config = {
        profiles: {
          production: {
            name: 'production',
            buildType: 'release',
            variant: 'release',
            signingConfig: {
              keystorePath: '.android/production.keystore',
              keystorePassword: 'prod-password',
              keyAlias: 'prod-key',
              keyPassword: 'prod-key-password',
              certificateSubjectDN: 'CN=Example Inc, O=Example Inc, C=US',
            },
            buildParameters: {
              minifyEnabled: true,
              shrinkResources: true,
              debuggable: false,
              versionCode: 100,
              versionName: '1.0.0',
            },
            environmentVariables: {
              API_ENDPOINT: 'https://api.example.com',
            },
            outputDirectory: 'build-artifacts/release',
          },
        },
      };

      fs.writeFileSync(configPath, JSON.stringify(config));

      const profile = loader.loadProfile(configPath, 'production');

      expect(profile.buildType).toBe(BuildType.Release);
      expect(profile.buildParameters.minifyEnabled).toBe(true);
      expect(profile.buildParameters.shrinkResources).toBe(true);
      expect(profile.buildParameters.debuggable).toBe(false);
      expect(profile.signingConfig.certificateSubjectDN).toBe('CN=Example Inc, O=Example Inc, C=US');
    });
  });
});
