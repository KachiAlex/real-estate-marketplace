/**
 * Unit Tests for Capacitor Configuration Validator Module
 *
 * Tests for parsing capacitor.config.ts, validating required fields,
 * verifying project paths, and validating plugin configurations.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  parseCapacitorConfig,
  validateRequiredFields,
  verifyProjectPaths,
  validatePluginConfigurations,
  validateCapacitorConfiguration,
} from './capacitor-validator';
import { CapacitorConfig } from '../types/mobile-config';

// Mock fs module
jest.mock('fs');

describe('Capacitor Configuration Validator Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseCapacitorConfig', () => {
    it('should parse valid Capacitor configuration', () => {
      const configContent = `import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.realestate.marketplace',
  appName: 'Real Estate Marketplace',
  version: '1.0.0',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
  },
};

export default config;`;

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(configContent);

      const result = parseCapacitorConfig();

      expect(result.config).toBeDefined();
      expect(result.config?.appId).toBe('com.realestate.marketplace');
      expect(result.config?.appName).toBe('Real Estate Marketplace');
      expect(result.config?.version).toBe('1.0.0');
      expect(result.config?.webDir).toBe('dist');
    });

    it('should fail when config file does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = parseCapacitorConfig();

      expect(result.config).toBeNull();
      expect(result.message).toContain('not found');
    });

    it('should fail when config object is not found', () => {
      const configContent = `// Invalid config file
export default {};`;

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(configContent);

      const result = parseCapacitorConfig();

      expect(result.config).toBeNull();
      expect(result.message).toContain('Could not find');
    });

    it('should use default config path when not provided', () => {
      const configContent = `const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'Example',
  version: '1.0.0',
  webDir: 'dist',
};`;

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(configContent);

      const result = parseCapacitorConfig();

      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.readFileSync).toHaveBeenCalled();
    });
  });

  describe('validateRequiredFields', () => {
    it('should validate all required fields', () => {
      const config: CapacitorConfig = {
        appId: 'com.realestate.marketplace',
        appName: 'Real Estate Marketplace',
        version: '1.0.0',
        webDir: 'dist',
      };

      const result = validateRequiredFields(config);

      expect(result.isValid).toBe(true);
      expect(result.missingFields).toEqual([]);
      expect(result.invalidFields).toEqual([]);
    });

    it('should detect missing appId', () => {
      const config: CapacitorConfig = {
        appId: '',
        appName: 'Real Estate Marketplace',
        version: '1.0.0',
        webDir: 'dist',
      };

      const result = validateRequiredFields(config);

      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('appId');
    });

    it('should detect invalid appId format', () => {
      const config: CapacitorConfig = {
        appId: 'invalid-app-id',
        appName: 'Real Estate Marketplace',
        version: '1.0.0',
        webDir: 'dist',
      };

      const result = validateRequiredFields(config);

      expect(result.isValid).toBe(false);
      expect(result.invalidFields.some((field) => field.includes('appId'))).toBe(true);
    });

    it('should detect missing appName', () => {
      const config: CapacitorConfig = {
        appId: 'com.realestate.marketplace',
        appName: '',
        version: '1.0.0',
        webDir: 'dist',
      };

      const result = validateRequiredFields(config);

      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('appName');
    });

    it('should detect invalid version format', () => {
      const config: CapacitorConfig = {
        appId: 'com.realestate.marketplace',
        appName: 'Real Estate Marketplace',
        version: 'invalid',
        webDir: 'dist',
      };

      const result = validateRequiredFields(config);

      expect(result.isValid).toBe(false);
      expect(result.invalidFields.some((field) => field.includes('version'))).toBe(true);
    });

    it('should detect missing webDir', () => {
      const config: CapacitorConfig = {
        appId: 'com.realestate.marketplace',
        appName: 'Real Estate Marketplace',
        version: '1.0.0',
        webDir: '',
      };

      const result = validateRequiredFields(config);

      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('webDir');
    });
  });

  describe('verifyProjectPaths', () => {
    it('should verify Android and iOS project paths exist', () => {
      const config: CapacitorConfig = {
        appId: 'com.realestate.marketplace',
        appName: 'Real Estate Marketplace',
        version: '1.0.0',
        webDir: 'dist',
      };

      (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
        return (
          filePath.includes('android') ||
          filePath.includes('ios') ||
          filePath.includes('build.gradle') ||
          filePath.includes('App')
        );
      });

      const result = verifyProjectPaths(config);

      expect(result.isValid).toBe(true);
      expect(result.androidPath).toBeDefined();
      expect(result.iosPath).toBeDefined();
    });

    it('should fail when Android project is missing', () => {
      const config: CapacitorConfig = {
        appId: 'com.realestate.marketplace',
        appName: 'Real Estate Marketplace',
        version: '1.0.0',
        webDir: 'dist',
      };

      (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
        return filePath.includes('ios');
      });

      const result = verifyProjectPaths(config);

      expect(result.isValid).toBe(false);
      expect(result.androidPath).toBeNull();
    });

    it('should fail when iOS project is missing', () => {
      const config: CapacitorConfig = {
        appId: 'com.realestate.marketplace',
        appName: 'Real Estate Marketplace',
        version: '1.0.0',
        webDir: 'dist',
      };

      (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
        return filePath.includes('android');
      });

      const result = verifyProjectPaths(config);

      expect(result.isValid).toBe(false);
      expect(result.iosPath).toBeNull();
    });

    it('should use custom base path', () => {
      const config: CapacitorConfig = {
        appId: 'com.realestate.marketplace',
        appName: 'Real Estate Marketplace',
        version: '1.0.0',
        webDir: 'dist',
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const result = verifyProjectPaths(config, '/custom/path');

      expect(fs.existsSync).toHaveBeenCalled();
    });
  });

  describe('validatePluginConfigurations', () => {
    it('should validate configured plugins', () => {
      const config: CapacitorConfig = {
        appId: 'com.realestate.marketplace',
        appName: 'Real Estate Marketplace',
        version: '1.0.0',
        webDir: 'dist',
        plugins: {
          SplashScreen: {},
          Geolocation: {},
        },
      };

      const packageJsonContent = JSON.stringify({
        dependencies: {
          SplashScreen: '^5.0.0',
          Geolocation: '^5.0.0',
        },
      });

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(packageJsonContent);

      const result = validatePluginConfigurations(config);

      expect(result.isValid).toBe(true);
      expect(result.pluginCount).toBe(2);
    });

    it('should handle no plugins configured', () => {
      const config: CapacitorConfig = {
        appId: 'com.realestate.marketplace',
        appName: 'Real Estate Marketplace',
        version: '1.0.0',
        webDir: 'dist',
      };

      const result = validatePluginConfigurations(config);

      expect(result.isValid).toBe(true);
      expect(result.pluginCount).toBe(0);
    });

    it('should detect missing plugin in package.json', () => {
      const config: CapacitorConfig = {
        appId: 'com.realestate.marketplace',
        appName: 'Real Estate Marketplace',
        version: '1.0.0',
        webDir: 'dist',
        plugins: {
          SplashScreen: {},
          MissingPlugin: {},
        },
      };

      const packageJsonContent = JSON.stringify({
        dependencies: {
          '@capacitor/splash-screen': '^5.0.0',
        },
      });

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(packageJsonContent);

      const result = validatePluginConfigurations(config);

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('not found');
    });
  });

  describe('validateCapacitorConfiguration', () => {
    it('should validate complete Capacitor configuration', () => {
      const configContent = `const config: CapacitorConfig = {
  appId: 'com.realestate.marketplace',
  appName: 'Real Estate Marketplace',
  version: '1.0.0',
  webDir: 'dist',
};`;

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(configContent);

      const result = validateCapacitorConfiguration();

      expect(result.isValid).toBe(true);
      expect(result.configParsed).toBe(true);
      expect(result.requiredFieldsValid).toBe(true);
      expect(result.projectPathsValid).toBe(true);
      expect(result.pluginsValid).toBe(true);
    });

    it('should report configuration parsing failure', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = validateCapacitorConfiguration();

      expect(result.isValid).toBe(false);
      expect(result.configParsed).toBe(false);
    });

    it('should report required fields validation failure', () => {
      const configContent = `const config: CapacitorConfig = {
  appId: 'invalid',
  appName: 'Real Estate Marketplace',
  version: '1.0.0',
  webDir: 'dist',
};`;

      (fs.existsSync as jest.Mock).mockReturnValue(false); // Prevent path checks
      (fs.readFileSync as jest.Mock).mockReturnValue(configContent);

      const result = validateCapacitorConfiguration();

      // The config will parse but appId is invalid format
      expect(result.requiredFieldsValid).toBe(false);
    });
  });
});
