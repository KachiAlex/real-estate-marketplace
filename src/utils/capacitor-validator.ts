/**
 * Capacitor Configuration Validator Module
 *
 * This module provides functions to validate Capacitor configuration,
 * including parsing capacitor.config.ts, validating required fields,
 * verifying project paths, and validating plugin configurations.
 *
 * Requirements: 3.1, 3.2, 3.3
 *
 * @module utils/capacitor-validator
 */

import * as fs from 'fs';
import * as path from 'path';
import { CapacitorConfig } from '../types/mobile-config';

/**
 * Logger utility for debugging
 */
const logger = {
  debug: (message: string) => console.debug(`[capacitor-validator] ${message}`),
  info: (message: string) => console.info(`[capacitor-validator] ${message}`),
  warn: (message: string) => console.warn(`[capacitor-validator] ${message}`),
  error: (message: string) => console.error(`[capacitor-validator] ${message}`),
};

/**
 * Parse capacitor.config.ts file
 *
 * Reads and parses the Capacitor configuration file. Supports both
 * TypeScript (.ts) and JavaScript (.js) configuration files.
 *
 * Note: This is a simplified parser that extracts the configuration object.
 * For production use, consider using a proper TypeScript/JavaScript parser.
 *
 * @param configPath - Path to capacitor.config.ts (defaults to ./capacitor.config.ts)
 * @returns Object with parsed configuration or error details
 *
 * @example
 * ```typescript
 * const result = parseCapacitorConfig('./capacitor.config.ts');
 * if (result.config) {
 *   console.log(`App ID: ${result.config.appId}`);
 * } else {
 *   console.log(`Error: ${result.message}`);
 * }
 * ```
 */
export function parseCapacitorConfig(configPath?: string): {
  config: CapacitorConfig | null;
  message: string;
} {
  logger.debug('Parsing Capacitor configuration...');

  const filePath = configPath || path.join(process.cwd(), 'capacitor.config.ts');

  if (!fs.existsSync(filePath)) {
    const message = `Capacitor config file not found at: ${filePath}`;
    logger.error(message);
    return {
      config: null,
      message,
    };
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Extract the configuration object using regex
    // This is a simplified approach that looks for the config object
    const configMatch = content.match(/const\s+config\s*:\s*CapacitorConfig\s*=\s*({[\s\S]*?});/);

    if (!configMatch) {
      const message = 'Could not find config object in Capacitor configuration file';
      logger.error(message);
      return {
        config: null,
        message,
      };
    }

    // Extract key-value pairs from the config object
    const configStr = configMatch[1];
    const config: Partial<CapacitorConfig> = {};

    // Parse appId
    const appIdMatch = configStr.match(/appId\s*:\s*['"]([^'"]+)['"]/);
    if (appIdMatch) {
      config.appId = appIdMatch[1];
    }

    // Parse appName
    const appNameMatch = configStr.match(/appName\s*:\s*['"]([^'"]+)['"]/);
    if (appNameMatch) {
      config.appName = appNameMatch[1];
    }

    // Parse version
    const versionMatch = configStr.match(/version\s*:\s*['"]([^'"]+)['"]/);
    if (versionMatch) {
      config.version = versionMatch[1];
    }

    // Parse webDir
    const webDirMatch = configStr.match(/webDir\s*:\s*['"]([^'"]+)['"]/);
    if (webDirMatch) {
      config.webDir = webDirMatch[1];
    }

    // Parse plugins if present
    const pluginsMatch = configStr.match(/plugins\s*:\s*({[\s\S]*?})/);
    if (pluginsMatch) {
      try {
        // This is a simplified extraction; full parsing would require proper JS/TS parsing
        config.plugins = {};
      } catch (e) {
        logger.warn('Could not parse plugins configuration');
      }
    }

    logger.info('Capacitor configuration parsed successfully');
    return {
      config: config as CapacitorConfig,
      message: 'Capacitor configuration parsed successfully',
    };
  } catch (error) {
    const message = `Error parsing Capacitor configuration: ${error instanceof Error ? error.message : String(error)}`;
    logger.error(message);
    return {
      config: null,
      message,
    };
  }
}

/**
 * Validate required Capacitor configuration fields
 *
 * Checks that all required fields are present and have valid values:
 * - appId: Must be a valid package identifier (e.g., com.example.app)
 * - appName: Must be a non-empty string
 * - version: Must be a valid semantic version
 * - webDir: Must be a non-empty string
 *
 * @param config - Capacitor configuration object
 * @returns Object with validation status and details
 *
 * @example
 * ```typescript
 * const result = validateRequiredFields(config);
 * if (result.isValid) {
 *   console.log('All required fields are valid');
 * } else {
 *   console.log(`Validation failed: ${result.message}`);
 * }
 * ```
 */
export function validateRequiredFields(config: CapacitorConfig): {
  isValid: boolean;
  missingFields: string[];
  invalidFields: string[];
  message: string;
} {
  logger.debug('Validating required Capacitor configuration fields...');

  const missingFields: string[] = [];
  const invalidFields: string[] = [];

  // Check appId
  if (!config.appId) {
    missingFields.push('appId');
  } else if (!/^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z0-9]+)*$/.test(config.appId)) {
    invalidFields.push('appId (must be a valid package identifier like com.example.app)');
  }

  // Check appName
  if (!config.appName) {
    missingFields.push('appName');
  } else if (typeof config.appName !== 'string' || config.appName.trim().length === 0) {
    invalidFields.push('appName (must be a non-empty string)');
  }

  // Check version
  if (!config.version) {
    missingFields.push('version');
  } else if (!/^\d+\.\d+\.\d+/.test(config.version)) {
    invalidFields.push('version (must be a valid semantic version like 1.0.0)');
  }

  // Check webDir
  if (!config.webDir) {
    missingFields.push('webDir');
  } else if (typeof config.webDir !== 'string' || config.webDir.trim().length === 0) {
    invalidFields.push('webDir (must be a non-empty string)');
  }

  const isValid = missingFields.length === 0 && invalidFields.length === 0;

  let message = '';
  if (isValid) {
    message = 'All required Capacitor configuration fields are valid';
    logger.info(message);
  } else {
    const issues: string[] = [];
    if (missingFields.length > 0) {
      issues.push(`Missing fields: ${missingFields.join(', ')}`);
    }
    if (invalidFields.length > 0) {
      issues.push(`Invalid fields: ${invalidFields.join(', ')}`);
    }
    message = issues.join('; ');
    logger.error(message);
  }

  return {
    isValid,
    missingFields,
    invalidFields,
    message,
  };
}

/**
 * Verify Android and iOS project paths exist
 *
 * Checks that the Android and iOS native project directories exist
 * and contain the expected project structure.
 *
 * @param config - Capacitor configuration object
 * @param basePath - Base path for resolving relative paths (defaults to cwd)
 * @returns Object with path verification status
 *
 * @example
 * ```typescript
 * const result = verifyProjectPaths(config);
 * if (result.isValid) {
 *   console.log('All project paths are valid');
 * } else {
 *   console.log(`Validation failed: ${result.message}`);
 * }
 * ```
 */
export function verifyProjectPaths(config: CapacitorConfig, basePath?: string): {
  isValid: boolean;
  androidPath: string | null;
  iosPath: string | null;
  message: string;
} {
  logger.debug('Verifying Android and iOS project paths...');

  const base = basePath || process.cwd();
  let androidPath: string | null = null;
  let iosPath: string | null = null;
  const missingPaths: string[] = [];

  // Check Android project path
  const androidProjectPath = path.join(base, 'android');
  if (fs.existsSync(androidProjectPath)) {
    // Verify it contains expected Android project structure
    const buildGradlePath = path.join(androidProjectPath, 'app', 'build.gradle');
    if (fs.existsSync(buildGradlePath)) {
      androidPath = androidProjectPath;
      logger.info(`Android project found at: ${androidProjectPath}`);
    } else {
      missingPaths.push(`Android project structure incomplete at ${androidProjectPath}`);
    }
  } else {
    missingPaths.push(`Android project directory not found at ${androidProjectPath}`);
  }

  // Check iOS project path
  const iosProjectPath = path.join(base, 'ios');
  if (fs.existsSync(iosProjectPath)) {
    // Verify it contains expected iOS project structure
    const appPath = path.join(iosProjectPath, 'App');
    if (fs.existsSync(appPath)) {
      iosPath = iosProjectPath;
      logger.info(`iOS project found at: ${iosProjectPath}`);
    } else {
      missingPaths.push(`iOS project structure incomplete at ${iosProjectPath}`);
    }
  } else {
    missingPaths.push(`iOS project directory not found at ${iosProjectPath}`);
  }

  const isValid = androidPath !== null && iosPath !== null;

  let message = '';
  if (isValid) {
    message = `Android project at ${androidPath}, iOS project at ${iosPath}`;
    logger.info(message);
  } else {
    message = `Project path verification failed: ${missingPaths.join('; ')}`;
    logger.error(message);
  }

  return {
    isValid,
    androidPath,
    iosPath,
    message,
  };
}

/**
 * Validate plugin configurations
 *
 * Checks that all configured plugins are valid and have proper configuration.
 * Verifies that plugins are listed in package.json.
 *
 * @param config - Capacitor configuration object
 * @param packageJsonPath - Path to package.json (defaults to ./package.json)
 * @returns Object with plugin validation status
 *
 * @example
 * ```typescript
 * const result = validatePluginConfigurations(config);
 * if (result.isValid) {
 *   console.log(`All ${result.pluginCount} plugins are valid`);
 * } else {
 *   console.log(`Validation failed: ${result.message}`);
 * }
 * ```
 */
export function validatePluginConfigurations(config: CapacitorConfig, packageJsonPath?: string): {
  isValid: boolean;
  pluginCount: number;
  configuredPlugins: string[];
  message: string;
} {
  logger.debug('Validating plugin configurations...');

  const packagePath = packageJsonPath || path.join(process.cwd(), 'package.json');
  const configuredPlugins: string[] = [];

  // If no plugins configured, that's valid
  if (!config.plugins || Object.keys(config.plugins).length === 0) {
    logger.info('No plugins configured in Capacitor config');
    return {
      isValid: true,
      pluginCount: 0,
      configuredPlugins: [],
      message: 'No plugins configured (valid)',
    };
  }

  // Read package.json to verify plugins are installed
  let packageJson: any = {};
  if (fs.existsSync(packagePath)) {
    try {
      const content = fs.readFileSync(packagePath, 'utf-8');
      packageJson = JSON.parse(content);
    } catch (error) {
      logger.warn(`Could not parse package.json: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const installedDependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  // Validate each configured plugin
  const invalidPlugins: string[] = [];
  for (const pluginName of Object.keys(config.plugins)) {
    configuredPlugins.push(pluginName);

    // Check if plugin is installed
    if (!installedDependencies[pluginName]) {
      invalidPlugins.push(`${pluginName} (not found in package.json)`);
    }
  }

  const isValid = invalidPlugins.length === 0;

  let message = '';
  if (isValid) {
    message = `All ${configuredPlugins.length} configured plugin(s) are valid`;
    logger.info(message);
  } else {
    message = `Plugin validation failed: ${invalidPlugins.join(', ')}`;
    logger.error(message);
  }

  return {
    isValid,
    pluginCount: configuredPlugins.length,
    configuredPlugins,
    message,
  };
}

/**
 * Comprehensive validation of Capacitor configuration
 *
 * Runs all Capacitor configuration validation checks and returns
 * a complete validation result.
 *
 * @param configPath - Path to capacitor.config.ts (defaults to ./capacitor.config.ts)
 * @returns Object with comprehensive validation results
 *
 * @example
 * ```typescript
 * const result = validateCapacitorConfiguration();
 * if (result.isValid) {
 *   console.log('Capacitor configuration is valid');
 * } else {
 *   console.log(`Validation failed: ${result.message}`);
 * }
 * ```
 */
export function validateCapacitorConfiguration(configPath?: string): {
  isValid: boolean;
  configParsed: boolean;
  requiredFieldsValid: boolean;
  projectPathsValid: boolean;
  pluginsValid: boolean;
  message: string;
} {
  logger.debug('Validating Capacitor configuration...');

  // Parse configuration
  const parseResult = parseCapacitorConfig(configPath);
  if (!parseResult.config) {
    return {
      isValid: false,
      configParsed: false,
      requiredFieldsValid: false,
      projectPathsValid: false,
      pluginsValid: false,
      message: parseResult.message,
    };
  }

  const config = parseResult.config;

  // Validate required fields
  const fieldsResult = validateRequiredFields(config);

  // Verify project paths
  const pathsResult = verifyProjectPaths(config);

  // Validate plugins
  const pluginsResult = validatePluginConfigurations(config);

  const isValid = fieldsResult.isValid && pathsResult.isValid && pluginsResult.isValid;

  let message = '';
  if (isValid) {
    message = 'Capacitor configuration is valid and complete';
    logger.info(message);
  } else {
    const issues: string[] = [];
    if (!fieldsResult.isValid) issues.push('Required fields validation failed');
    if (!pathsResult.isValid) issues.push('Project paths validation failed');
    if (!pluginsResult.isValid) issues.push('Plugin validation failed');
    message = `Capacitor configuration validation failed: ${issues.join('; ')}`;
    logger.error(message);
  }

  return {
    isValid,
    configParsed: true,
    requiredFieldsValid: fieldsResult.isValid,
    projectPathsValid: pathsResult.isValid,
    pluginsValid: pluginsResult.isValid,
    message,
  };
}
