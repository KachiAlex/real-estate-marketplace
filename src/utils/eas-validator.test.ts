/**
 * Unit tests for EAS configuration validation module
 *
 * Tests cover:
 * - EAS config parsing and validation
 * - Build profile validation
 * - Platform-specific build parameters
 * - Environment variable validation
 * - Comprehensive EAS configuration validation
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  parseEASConfig,
  validateBuildProfiles,
  verifyPlatformBuildParameters,
  validateEnvironmentVariables,
  validateEASConfiguration,
} from './eas-validator';
import { ValidationStatus } from '../types/mobile-config';

describe('EAS Validator', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'eas-validator-test-'));

  afterAll(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('parseEASConfig', () => {
    it('should parse valid eas.json file', () => {
      const easConfigPath = path.join(tempDir, 'eas-valid.json');
      const config: any = {
        build: {
          development: {
            android: { buildType: 'apk' },
            ios: { buildConfiguration: 'Debug' },
          },
          production: {
            android: { buildType: 'aab' },
            ios: { buildConfiguration: 'Release' },
          },
        },
      };

      fs.writeFileSync(easConfigPath, JSON.stringify(config, null, 2));

      const result = parseEASConfig(easConfigPath);
      expect(result.success).toBe(true);
      expect(result.config).toBeDefined();
      expect(result.config?.build).toBeDefined();
    });

    it('should return error for non-existent file', () => {
      const result = parseEASConfig('/non/existent/eas.json');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.config).toBeUndefined();
    });

    it('should return error for invalid JSON', () => {
      const easConfigPath = path.join(tempDir, 'eas-invalid.json');
      fs.writeFileSync(easConfigPath, '{ invalid json }');

      const result = parseEASConfig(easConfigPath);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should use default eas.json path when not provided', () => {
      const projectDir = path.join(tempDir, 'eas-default-path');
      fs.mkdirSync(projectDir, { recursive: true });

      const config: any = {
        build: {
          development: {
            android: { buildType: 'apk' },
            ios: { buildConfiguration: 'Debug' },
          },
        },
      };

      const easConfigPath = path.join(projectDir, 'eas.json');
      fs.writeFileSync(easConfigPath, JSON.stringify(config, null, 2));

      const result = parseEASConfig(easConfigPath);
      expect(result.success).toBe(true);
    });

    it('should handle empty build object', () => {
      const easConfigPath = path.join(tempDir, 'eas-empty-build.json');
      const config: any = { build: {} };

      fs.writeFileSync(easConfigPath, JSON.stringify(config, null, 2));

      const result = parseEASConfig(easConfigPath);
      expect(result.success).toBe(true);
      expect(result.config?.build).toBeDefined();
    });
  });

  describe('validateBuildProfiles', () => {
    it('should validate presence of development profile', () => {
      const config: any = {
        build: {
          development: {
            android: { buildType: 'apk' },
            ios: { buildConfiguration: 'Debug' },
          },
        },
      };

      const result = validateBuildProfiles(config);
      expect(result.success).toBe(false); // Missing staging and production
      expect(result.missingProfiles).toContain('staging');
      expect(result.missingProfiles).toContain('production');
    });

    it('should return invalid when no profiles are defined', () => {
      const config: any = { build: {} };

      const result = validateBuildProfiles(config);
      expect(result.success).toBe(false);
      expect(result.missingProfiles.length).toBeGreaterThan(0);
    });

    it('should validate all three profiles when present', () => {
      const config: any = {
        build: {
          development: {
            android: { buildType: 'apk' },
            ios: { buildConfiguration: 'Debug' },
          },
          staging: {
            android: { buildType: 'apk' },
            ios: { buildConfiguration: 'Debug' },
          },
          production: {
            android: { buildType: 'aab' },
            ios: { buildConfiguration: 'Release' },
          },
        },
      };

      const result = validateBuildProfiles(config);
      expect(result.success).toBe(true);
      expect(result.missingProfiles.length).toBe(0);
    });

    it('should detect invalid profiles with missing platform configs', () => {
      const config: any = {
        build: {
          development: {
            // Missing both android and ios
          },
          staging: {
            android: { buildType: 'apk' },
            ios: { buildConfiguration: 'Debug' },
          },
          production: {
            android: { buildType: 'aab' },
            ios: { buildConfiguration: 'Release' },
          },
        },
      };

      const result = validateBuildProfiles(config);
      expect(result.invalidProfiles).toContain('development');
    });

    it('should detect missing buildType in android config', () => {
      const config: any = {
        build: {
          development: {
            android: {
              // Missing buildType
            },
            ios: { buildConfiguration: 'Debug' },
          },
          staging: {
            android: { buildType: 'apk' },
            ios: { buildConfiguration: 'Debug' },
          },
          production: {
            android: { buildType: 'aab' },
            ios: { buildConfiguration: 'Release' },
          },
        },
      };

      const result = validateBuildProfiles(config);
      expect(result.invalidProfiles).toContain('development');
    });
  });

  describe('verifyPlatformBuildParameters', () => {
    it('should verify Android build parameters', () => {
      const config: any = {
        build: {
          development: {
            android: {
              buildType: 'apk',
            },
            ios: { buildConfiguration: 'Debug' },
          },
          staging: {
            android: { buildType: 'apk' },
            ios: { buildConfiguration: 'Debug' },
          },
          production: {
            android: { buildType: 'aab' },
            ios: { buildConfiguration: 'Release' },
          },
        },
      };

      const result = verifyPlatformBuildParameters(config);
      expect(result.success).toBe(true);
      expect(result.missingAndroid.length).toBe(0);
    });

    it('should verify iOS build parameters', () => {
      const config: any = {
        build: {
          development: {
            android: { buildType: 'apk' },
            ios: {
              buildConfiguration: 'Debug',
            },
          },
          staging: {
            android: { buildType: 'apk' },
            ios: { buildConfiguration: 'Debug' },
          },
          production: {
            android: { buildType: 'aab' },
            ios: { buildConfiguration: 'Release' },
          },
        },
      };

      const result = verifyPlatformBuildParameters(config);
      expect(result.success).toBe(true);
      expect(result.missingIos.length).toBe(0);
    });

    it('should return invalid when Android buildType is missing', () => {
      const config: any = {
        build: {
          development: {
            android: {
              // Missing buildType
            },
            ios: { buildConfiguration: 'Debug' },
          },
          staging: {
            android: { buildType: 'apk' },
            ios: { buildConfiguration: 'Debug' },
          },
          production: {
            android: { buildType: 'aab' },
            ios: { buildConfiguration: 'Release' },
          },
        },
      };

      const result = verifyPlatformBuildParameters(config);
      expect(result.success).toBe(false);
      expect(result.missingAndroid.length).toBeGreaterThan(0);
    });

    it('should return invalid when iOS buildConfiguration is missing', () => {
      const config: any = {
        build: {
          development: {
            android: { buildType: 'apk' },
            ios: {
              // Missing buildConfiguration
            },
          },
          staging: {
            android: { buildType: 'apk' },
            ios: { buildConfiguration: 'Debug' },
          },
          production: {
            android: { buildType: 'aab' },
            ios: { buildConfiguration: 'Release' },
          },
        },
      };

      const result = verifyPlatformBuildParameters(config);
      expect(result.success).toBe(false);
      expect(result.missingIos.length).toBeGreaterThan(0);
    });
  });

  describe('validateEnvironmentVariables', () => {
    it('should validate environment variables in config', () => {
      const config: any = {
        build: {
          development: {
            android: { buildType: 'apk' },
            ios: { buildConfiguration: 'Debug' },
            env: {
              API_ENDPOINT: 'https://api.dev.example.com',
              API_KEY: 'dev-key-123',
            },
          },
          staging: {
            android: { buildType: 'apk' },
            ios: { buildConfiguration: 'Debug' },
          },
          production: {
            android: { buildType: 'aab' },
            ios: { buildConfiguration: 'Release' },
          },
        },
      };

      const result = validateEnvironmentVariables(config);
      expect(result.success).toBe(true);
      expect(result.missingVariables.length).toBe(0);
    });

    it('should return valid when no environment variables are defined', () => {
      const config: any = {
        build: {
          development: {
            android: { buildType: 'apk' },
            ios: { buildConfiguration: 'Debug' },
          },
          staging: {
            android: { buildType: 'apk' },
            ios: { buildConfiguration: 'Debug' },
          },
          production: {
            android: { buildType: 'aab' },
            ios: { buildConfiguration: 'Release' },
          },
        },
      };

      const result = validateEnvironmentVariables(config);
      expect(result.success).toBe(true);
    });

    it('should handle multiple profiles with different variables', () => {
      const config: any = {
        build: {
          development: {
            android: { buildType: 'apk' },
            ios: { buildConfiguration: 'Debug' },
            env: {
              API_ENDPOINT: 'https://api.dev.example.com',
            },
          },
          staging: {
            android: { buildType: 'apk' },
            ios: { buildConfiguration: 'Debug' },
          },
          production: {
            android: { buildType: 'aab' },
            ios: { buildConfiguration: 'Release' },
            env: {
              API_ENDPOINT: 'https://api.prod.example.com',
              ANALYTICS_TOKEN: 'prod-token-123',
            },
          },
        },
      };

      const result = validateEnvironmentVariables(config);
      expect(result.success).toBe(true);
    });
  });

  describe('validateEASConfiguration', () => {
    it('should return comprehensive validation result', () => {
      const easConfigPath = path.join(tempDir, 'eas-comprehensive.json');
      const config: any = {
        build: {
          development: {
            android: { buildType: 'apk' },
            ios: { buildConfiguration: 'Debug' },
            env: {
              API_ENDPOINT: 'https://api.dev.example.com',
            },
          },
          staging: {
            android: { buildType: 'apk' },
            ios: { buildConfiguration: 'Debug' },
          },
          production: {
            android: { buildType: 'aab' },
            ios: { buildConfiguration: 'Release' },
            env: {
              API_ENDPOINT: 'https://api.prod.example.com',
            },
          },
        },
      };

      fs.writeFileSync(easConfigPath, JSON.stringify(config, null, 2));

      const result = validateEASConfiguration(easConfigPath);

      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.checks).toBeInstanceOf(Array);
      expect(result.checks.length).toBeGreaterThan(0);
      expect(result.summary).toBeDefined();
      expect(typeof result.overallStatus).toBe('string');
    });

    it('should include all required validation checks', () => {
      const easConfigPath = path.join(tempDir, 'eas-all-checks.json');
      const config: any = {
        build: {
          development: {
            android: { buildType: 'apk' },
            ios: { buildConfiguration: 'Debug' },
          },
          staging: {
            android: { buildType: 'apk' },
            ios: { buildConfiguration: 'Debug' },
          },
          production: {
            android: { buildType: 'aab' },
            ios: { buildConfiguration: 'Release' },
          },
        },
      };

      fs.writeFileSync(easConfigPath, JSON.stringify(config, null, 2));

      const result = validateEASConfiguration(easConfigPath);

      const checkNames = result.checks.map((check) => check.name);
      expect(checkNames).toContain('EAS Configuration File');
      expect(checkNames).toContain('Build Profiles');
      expect(checkNames).toContain('Platform Build Parameters');
    });

    it('should return pass status when all checks pass', () => {
      const easConfigPath = path.join(tempDir, 'eas-all-pass.json');
      const config: any = {
        build: {
          development: {
            android: { buildType: 'apk' },
            ios: { buildConfiguration: 'Debug' },
          },
          staging: {
            android: { buildType: 'apk' },
            ios: { buildConfiguration: 'Debug' },
          },
          production: {
            android: { buildType: 'aab' },
            ios: { buildConfiguration: 'Release' },
          },
        },
      };

      fs.writeFileSync(easConfigPath, JSON.stringify(config, null, 2));

      const result = validateEASConfiguration(easConfigPath);

      expect(result.overallStatus).toBe(ValidationStatus.Pass);
      expect(result.summary).toContain('properly configured');
    });

    it('should return fail status when config file is missing', () => {
      const result = validateEASConfiguration('/non/existent/eas.json');

      expect(result.overallStatus).toBe(ValidationStatus.Fail);
      const failedChecks = result.checks.filter((check) => check.status === ValidationStatus.Fail);
      expect(failedChecks.length).toBeGreaterThan(0);
    });

    it('should include remediation steps for failed checks', () => {
      const easConfigPath = path.join(tempDir, 'eas-remediation.json');
      const config: any = {
        build: {
          // Missing required profiles
        },
      };

      fs.writeFileSync(easConfigPath, JSON.stringify(config, null, 2));

      const result = validateEASConfiguration(easConfigPath);

      const failedChecks = result.checks.filter((check) => check.status === ValidationStatus.Fail);
      failedChecks.forEach((check) => {
        expect(check.remediation).toBeDefined();
      });
    });

    it('should include documentation links for all checks', () => {
      const easConfigPath = path.join(tempDir, 'eas-docs.json');
      const config: any = {
        build: {
          development: {
            android: { buildType: 'apk' },
            ios: { buildConfiguration: 'Debug' },
          },
          staging: {
            android: { buildType: 'apk' },
            ios: { buildConfiguration: 'Debug' },
          },
          production: {
            android: { buildType: 'aab' },
            ios: { buildConfiguration: 'Release' },
          },
        },
      };

      fs.writeFileSync(easConfigPath, JSON.stringify(config, null, 2));

      const result = validateEASConfiguration(easConfigPath);

      result.checks.forEach((check) => {
        expect(check.documentationLink).toBeDefined();
        expect(check.documentationLink).toMatch(/^https?:\/\//);
      });
    });

    it('should validate multiple profiles correctly', () => {
      const easConfigPath = path.join(tempDir, 'eas-multi-profile.json');
      const config: any = {
        build: {
          development: {
            android: { buildType: 'apk' },
            ios: { buildConfiguration: 'Debug' },
          },
          staging: {
            android: { buildType: 'apk' },
            ios: { buildConfiguration: 'Debug' },
          },
          production: {
            android: { buildType: 'aab' },
            ios: { buildConfiguration: 'Release' },
          },
        },
      };

      fs.writeFileSync(easConfigPath, JSON.stringify(config, null, 2));

      const result = validateEASConfiguration(easConfigPath);

      expect(result.overallStatus).toBe(ValidationStatus.Pass);
      const profileCheck = result.checks.find((check) => check.name === 'Build Profiles');
      expect(profileCheck?.status).toBe(ValidationStatus.Pass);
    });
  });
});

