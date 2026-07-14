/**
 * Build Configuration Loader
 *
 * Loads and parses build profiles from build-config.json configuration files.
 * Provides validation, error handling, and support for multiple configuration sources.
 *
 * @module utils/build-configuration-loader
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  BuildProfile,
  isBuildProfile,
  BuildType,
  SigningConfiguration,
  isSigningConfiguration,
  BuildParameters,
} from '../types/android-build';

/**
 * Configuration file structure
 */
interface BuildConfigFile {
  profiles: Record<string, unknown>;
  version?: string;
  description?: string;
}

/**
 * Error types for configuration loading
 */
export enum ConfigurationErrorType {
  FileNotFound = 'FILE_NOT_FOUND',
  FileReadError = 'FILE_READ_ERROR',
  InvalidJSON = 'INVALID_JSON',
  MissingProfile = 'MISSING_PROFILE',
  InvalidProfile = 'INVALID_PROFILE',
  MissingRequiredField = 'MISSING_REQUIRED_FIELD',
  InvalidFieldValue = 'INVALID_FIELD_VALUE',
  InvalidSigningConfig = 'INVALID_SIGNING_CONFIG',
  MissingSigningConfig = 'MISSING_SIGNING_CONFIG',
}

/**
 * Configuration loading error
 */
export class ConfigurationError extends Error {
  constructor(
    public type: ConfigurationErrorType,
    message: string,
    public details?: string,
    public remediation?: string,
  ) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

/**
 * Build Configuration Loader
 *
 * Loads build profiles from build-config.json files with comprehensive validation
 * and error handling. Supports loading from multiple configuration sources.
 *
 * **Validates: Requirements 9.1, 9.4**
 */
export class BuildConfigurationLoader {
  private configCache: Map<string, BuildConfigFile> = new Map();
  private profileCache: Map<string, BuildProfile> = new Map();

  /**
   * Load a build profile from a configuration file
   *
   * @param configPath - Path to the build-config.json file
   * @param profileName - Name of the profile to load
   * @returns The loaded and validated BuildProfile
   * @throws ConfigurationError if loading or validation fails
   */
  public loadProfile(configPath: string, profileName: string): BuildProfile {
    // Check cache first
    const cacheKey = `${configPath}:${profileName}`;
    if (this.profileCache.has(cacheKey)) {
      return this.profileCache.get(cacheKey)!;
    }

    // Load configuration file
    const config = this.loadConfigFile(configPath);

    // Get profile from configuration
    const profileData = config.profiles[profileName];
    if (!profileData) {
      throw new ConfigurationError(
        ConfigurationErrorType.MissingProfile,
        `Profile "${profileName}" not found in configuration file`,
        `Available profiles: ${Object.keys(config.profiles).join(', ')}`,
        `Specify a valid profile name from the available profiles`,
      );
    }

    // Validate and parse profile
    const profile = this.validateAndParseProfile(profileData, profileName);

    // Cache the profile
    this.profileCache.set(cacheKey, profile);

    return profile;
  }

  /**
   * Load all profiles from a configuration file
   *
   * @param configPath - Path to the build-config.json file
   * @returns Map of profile names to BuildProfile objects
   * @throws ConfigurationError if loading or validation fails
   */
  public loadAllProfiles(configPath: string): Map<string, BuildProfile> {
    const config = this.loadConfigFile(configPath);
    const profiles = new Map<string, BuildProfile>();

    for (const [profileName, profileData] of Object.entries(config.profiles)) {
      try {
        const profile = this.validateAndParseProfile(profileData, profileName);
        profiles.set(profileName, profile);
      } catch (error) {
        // Log error but continue loading other profiles
        console.warn(`Failed to load profile "${profileName}":`, error);
      }
    }

    if (profiles.size === 0) {
      throw new ConfigurationError(
        ConfigurationErrorType.InvalidProfile,
        'No valid profiles found in configuration file',
        'All profiles failed validation',
        'Check the configuration file for syntax errors and required fields',
      );
    }

    return profiles;
  }

  /**
   * Get list of available profile names from a configuration file
   *
   * @param configPath - Path to the build-config.json file
   * @returns Array of available profile names
   * @throws ConfigurationError if file cannot be loaded
   */
  public listProfiles(configPath: string): string[] {
    const config = this.loadConfigFile(configPath);
    return Object.keys(config.profiles);
  }

  /**
   * Validate that a profile exists in a configuration file
   *
   * @param configPath - Path to the build-config.json file
   * @param profileName - Name of the profile to check
   * @returns True if profile exists, false otherwise
   */
  public profileExists(configPath: string, profileName: string): boolean {
    try {
      const config = this.loadConfigFile(configPath);
      return profileName in config.profiles;
    } catch {
      return false;
    }
  }

  /**
   * Clear all caches
   */
  public clearCache(): void {
    this.configCache.clear();
    this.profileCache.clear();
  }

  /**
   * Load and parse a configuration file
   *
   * @param configPath - Path to the build-config.json file
   * @returns Parsed configuration file
   * @throws ConfigurationError if file cannot be loaded or parsed
   */
  private loadConfigFile(configPath: string): BuildConfigFile {
    // Check cache first
    if (this.configCache.has(configPath)) {
      return this.configCache.get(configPath)!;
    }

    // Resolve path
    const resolvedPath = path.resolve(configPath);

    // Check if file exists
    if (!fs.existsSync(resolvedPath)) {
      throw new ConfigurationError(
        ConfigurationErrorType.FileNotFound,
        `Configuration file not found: ${resolvedPath}`,
        `Expected file at: ${resolvedPath}`,
        `Create a build-config.json file with build profiles`,
      );
    }

    // Read file
    let fileContent: string;
    try {
      fileContent = fs.readFileSync(resolvedPath, 'utf-8');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new ConfigurationError(
        ConfigurationErrorType.FileReadError,
        `Failed to read configuration file: ${resolvedPath}`,
        errorMessage,
        `Check file permissions and ensure the file is readable`,
      );
    }

    // Parse JSON
    let config: unknown;
    try {
      config = JSON.parse(fileContent);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new ConfigurationError(
        ConfigurationErrorType.InvalidJSON,
        `Configuration file contains invalid JSON: ${resolvedPath}`,
        errorMessage,
        `Fix JSON syntax errors in the configuration file`,
      );
    }

    // Validate structure
    if (typeof config !== 'object' || config === null) {
      throw new ConfigurationError(
        ConfigurationErrorType.InvalidJSON,
        `Configuration file must contain a JSON object`,
        `Got: ${typeof config}`,
        `Ensure the configuration file contains a valid JSON object`,
      );
    }

    const configObj = config as Record<string, unknown>;
    if (!('profiles' in configObj) || typeof configObj.profiles !== 'object') {
      throw new ConfigurationError(
        ConfigurationErrorType.MissingRequiredField,
        `Configuration file must contain a "profiles" object`,
        `Current keys: ${Object.keys(configObj).join(', ')}`,
        `Add a "profiles" object to the configuration file`,
      );
    }

    const configFile: BuildConfigFile = {
      profiles: configObj.profiles as Record<string, unknown>,
      version: typeof configObj.version === 'string' ? configObj.version : undefined,
      description: typeof configObj.description === 'string' ? configObj.description : undefined,
    };

    // Cache the configuration
    this.configCache.set(configPath, configFile);

    return configFile;
  }

  /**
   * Validate and parse a profile object
   *
   * @param profileData - Raw profile data from configuration
   * @param profileName - Name of the profile (for error messages)
   * @returns Validated BuildProfile
   * @throws ConfigurationError if validation fails
   */
  private validateAndParseProfile(profileData: unknown, profileName: string): BuildProfile {
    // Check if profile is an object
    if (typeof profileData !== 'object' || profileData === null) {
      throw new ConfigurationError(
        ConfigurationErrorType.InvalidProfile,
        `Profile "${profileName}" must be an object`,
        `Got: ${typeof profileData}`,
        `Ensure the profile is defined as a JSON object`,
      );
    }

    const profile = profileData as Record<string, unknown>;

    // Validate required fields
    this.validateRequiredField(profile, 'name', 'string', profileName);
    this.validateRequiredField(profile, 'buildType', 'string', profileName);
    this.validateRequiredField(profile, 'variant', 'string', profileName);
    this.validateRequiredField(profile, 'signingConfig', 'object', profileName);
    this.validateRequiredField(profile, 'buildParameters', 'object', profileName);
    this.validateRequiredField(profile, 'environmentVariables', 'object', profileName);
    this.validateRequiredField(profile, 'outputDirectory', 'string', profileName);

    // Validate buildType
    const buildType = profile.buildType as string;
    if (!Object.values(BuildType).includes(buildType as BuildType)) {
      throw new ConfigurationError(
        ConfigurationErrorType.InvalidFieldValue,
        `Profile "${profileName}" has invalid buildType: "${buildType}"`,
        `Valid values: ${Object.values(BuildType).join(', ')}`,
        `Set buildType to either "debug" or "release"`,
      );
    }

    // Validate signing configuration
    const signingConfig = profile.signingConfig as Record<string, unknown>;
    if (!isSigningConfiguration(signingConfig)) {
      throw new ConfigurationError(
        ConfigurationErrorType.InvalidSigningConfig,
        `Profile "${profileName}" has invalid signingConfig`,
        this.getSigningConfigValidationDetails(signingConfig),
        `Ensure signingConfig contains keystorePath, keystorePassword, keyAlias, and keyPassword`,
      );
    }

    // Validate build parameters
    const buildParams = profile.buildParameters as Record<string, unknown>;
    this.validateBuildParameters(buildParams, profileName);

    // Create BuildProfile object
    const buildProfile: BuildProfile = {
      name: profile.name as string,
      buildType: buildType as BuildType,
      variant: profile.variant as string,
      signingConfig: signingConfig as SigningConfiguration,
      buildParameters: buildParams as BuildParameters,
      environmentVariables: profile.environmentVariables as Record<string, string>,
      outputDirectory: profile.outputDirectory as string,
      description: typeof profile.description === 'string' ? profile.description : undefined,
    };

    // Validate the complete profile using type guard
    if (!isBuildProfile(buildProfile)) {
      throw new ConfigurationError(
        ConfigurationErrorType.InvalidProfile,
        `Profile "${profileName}" failed validation`,
        `Profile does not match BuildProfile interface`,
        `Check all required fields are present and have correct types`,
      );
    }

    return buildProfile;
  }

  /**
   * Validate a required field in a profile
   *
   * @param profile - Profile object
   * @param fieldName - Name of the field
   * @param expectedType - Expected type of the field
   * @param profileName - Name of the profile (for error messages)
   * @throws ConfigurationError if field is missing or has wrong type
   */
  private validateRequiredField(
    profile: Record<string, unknown>,
    fieldName: string,
    expectedType: string,
    profileName: string,
  ): void {
    if (!(fieldName in profile)) {
      throw new ConfigurationError(
        ConfigurationErrorType.MissingRequiredField,
        `Profile "${profileName}" is missing required field: "${fieldName}"`,
        `Expected type: ${expectedType}`,
        `Add the "${fieldName}" field to the profile`,
      );
    }

    const value = profile[fieldName];
    const actualType = Array.isArray(value) ? 'array' : typeof value;

    if (actualType !== expectedType) {
      throw new ConfigurationError(
        ConfigurationErrorType.InvalidFieldValue,
        `Profile "${profileName}" field "${fieldName}" has wrong type`,
        `Expected: ${expectedType}, Got: ${actualType}`,
        `Ensure "${fieldName}" is of type ${expectedType}`,
      );
    }
  }

  /**
   * Validate build parameters
   *
   * @param buildParams - Build parameters object
   * @param profileName - Name of the profile (for error messages)
   * @throws ConfigurationError if validation fails
   */
  private validateBuildParameters(
    buildParams: Record<string, unknown>,
    profileName: string,
  ): void {
    const requiredFields = ['minifyEnabled', 'shrinkResources', 'debuggable', 'versionCode', 'versionName'];

    for (const field of requiredFields) {
      if (!(field in buildParams)) {
        throw new ConfigurationError(
          ConfigurationErrorType.MissingRequiredField,
          `Profile "${profileName}" buildParameters is missing required field: "${field}"`,
          `Required fields: ${requiredFields.join(', ')}`,
          `Add the "${field}" field to buildParameters`,
        );
      }
    }

    // Validate boolean fields
    if (typeof buildParams.minifyEnabled !== 'boolean') {
      throw new ConfigurationError(
        ConfigurationErrorType.InvalidFieldValue,
        `Profile "${profileName}" buildParameters.minifyEnabled must be boolean`,
        `Got: ${typeof buildParams.minifyEnabled}`,
        `Set minifyEnabled to true or false`,
      );
    }

    if (typeof buildParams.shrinkResources !== 'boolean') {
      throw new ConfigurationError(
        ConfigurationErrorType.InvalidFieldValue,
        `Profile "${profileName}" buildParameters.shrinkResources must be boolean`,
        `Got: ${typeof buildParams.shrinkResources}`,
        `Set shrinkResources to true or false`,
      );
    }

    if (typeof buildParams.debuggable !== 'boolean') {
      throw new ConfigurationError(
        ConfigurationErrorType.InvalidFieldValue,
        `Profile "${profileName}" buildParameters.debuggable must be boolean`,
        `Got: ${typeof buildParams.debuggable}`,
        `Set debuggable to true or false`,
      );
    }

    // Validate version code
    if (typeof buildParams.versionCode !== 'number' || buildParams.versionCode < 1) {
      throw new ConfigurationError(
        ConfigurationErrorType.InvalidFieldValue,
        `Profile "${profileName}" buildParameters.versionCode must be a positive number`,
        `Got: ${buildParams.versionCode}`,
        `Set versionCode to a positive integer`,
      );
    }

    // Validate version name
    if (typeof buildParams.versionName !== 'string' || buildParams.versionName.trim() === '') {
      throw new ConfigurationError(
        ConfigurationErrorType.InvalidFieldValue,
        `Profile "${profileName}" buildParameters.versionName must be a non-empty string`,
        `Got: ${buildParams.versionName}`,
        `Set versionName to a valid version string (e.g., "1.0.0")`,
      );
    }
  }

  /**
   * Get validation details for signing configuration
   *
   * @param signingConfig - Signing configuration object
   * @returns Validation details string
   */
  private getSigningConfigValidationDetails(signingConfig: Record<string, unknown>): string {
    const requiredFields = ['keystorePath', 'keystorePassword', 'keyAlias', 'keyPassword'];
    const missingFields = requiredFields.filter((field) => !(field in signingConfig));
    const wrongTypeFields = requiredFields.filter(
      (field) => field in signingConfig && typeof signingConfig[field] !== 'string',
    );

    let details = '';
    if (missingFields.length > 0) {
      details += `Missing fields: ${missingFields.join(', ')}. `;
    }
    if (wrongTypeFields.length > 0) {
      details += `Wrong type fields: ${wrongTypeFields.join(', ')}. `;
    }
    if (details === '') {
      details = `Invalid signing configuration structure`;
    }

    return details;
  }
}

/**
 * Create a default BuildConfigurationLoader instance
 *
 * @returns BuildConfigurationLoader instance
 */
export function createBuildConfigurationLoader(): BuildConfigurationLoader {
  return new BuildConfigurationLoader();
}
