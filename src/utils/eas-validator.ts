import * as fs from 'fs';
import * as path from 'path';
import { EASConfig, EASBuildProfile, ValidationResult, ValidationStatus, ValidationCategory } from '../types/mobile-config';

/**
 * Parses eas.json configuration file
 * @param configPath - Path to eas.json (defaults to project root)
 * @returns Parsed EAS configuration or error details
 */
export function parseEASConfig(configPath?: string): { success: boolean; config?: EASConfig; error?: string } {
  try {
    const resolvedPath = configPath || path.join(process.cwd(), 'eas.json');

    if (!fs.existsSync(resolvedPath)) {
      return {
        success: false,
        error: `EAS configuration file not found at ${resolvedPath}`,
      };
    }

    const content = fs.readFileSync(resolvedPath, 'utf-8');
    const config = JSON.parse(content) as EASConfig;

    return {
      success: true,
      config,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to parse EAS configuration: ${errorMessage}`,
    };
  }
}

/**
 * Validates that all required build profiles are defined
 * @param config - EAS configuration
 * @returns Validation result with details
 */
export function validateBuildProfiles(config: EASConfig): {
  success: boolean;
  missingProfiles: string[];
  invalidProfiles: string[];
  details: string[];
} {
  const requiredProfiles = ['development', 'staging', 'production'];
  const missingProfiles: string[] = [];
  const invalidProfiles: string[] = [];
  const details: string[] = [];

  if (!config.build) {
    return {
      success: false,
      missingProfiles: requiredProfiles,
      invalidProfiles: [],
      details: ['No build section found in EAS configuration'],
    };
  }

  for (const profile of requiredProfiles) {
    if (!config.build[profile as keyof typeof config.build]) {
      missingProfiles.push(profile);
      details.push(`Missing build profile: ${profile}`);
    } else {
      const buildProfile = config.build[profile as keyof typeof config.build] as EASBuildProfile;

      // Validate profile structure
      if (!buildProfile.android && !buildProfile.ios) {
        invalidProfiles.push(profile);
        details.push(`Build profile "${profile}" must specify at least android or ios configuration`);
      }

      if (buildProfile.android) {
        if (!buildProfile.android.buildType) {
          invalidProfiles.push(profile);
          details.push(`Build profile "${profile}" android configuration missing buildType`);
        }
      }

      if (buildProfile.ios) {
        if (!buildProfile.ios.buildConfiguration) {
          invalidProfiles.push(profile);
          details.push(`Build profile "${profile}" ios configuration missing buildConfiguration`);
        }
      }
    }
  }

  return {
    success: missingProfiles.length === 0 && invalidProfiles.length === 0,
    missingProfiles,
    invalidProfiles,
    details,
  };
}

/**
 * Verifies that Android and iOS build parameters are specified
 * @param config - EAS configuration
 * @returns Validation result with details
 */
export function verifyPlatformBuildParameters(config: EASConfig): {
  success: boolean;
  missingAndroid: string[];
  missingIos: string[];
  details: string[];
} {
  const missingAndroid: string[] = [];
  const missingIos: string[] = [];
  const details: string[] = [];

  if (!config.build) {
    return {
      success: false,
      missingAndroid: ['development', 'staging', 'production'],
      missingIos: ['development', 'staging', 'production'],
      details: ['No build section found in EAS configuration'],
    };
  }

  const profiles = Object.entries(config.build);

  for (const [profileName, profile] of profiles) {
    const buildProfile = profile as EASBuildProfile;

    // Check Android parameters
    if (!buildProfile.android) {
      missingAndroid.push(profileName);
      details.push(`Profile "${profileName}" missing Android build parameters`);
    } else {
      const requiredAndroidFields = ['buildType'];
      for (const field of requiredAndroidFields) {
        if (!(field in buildProfile.android)) {
          missingAndroid.push(`${profileName}.android.${field}`);
          details.push(`Profile "${profileName}" Android configuration missing ${field}`);
        }
      }
    }

    // Check iOS parameters
    if (!buildProfile.ios) {
      missingIos.push(profileName);
      details.push(`Profile "${profileName}" missing iOS build parameters`);
    } else {
      const requiredIosFields = ['buildType'];
      for (const field of requiredIosFields) {
        if (!(field in buildProfile.ios)) {
          missingIos.push(`${profileName}.ios.${field}`);
          details.push(`Profile "${profileName}" iOS configuration missing ${field}`);
        }
      }
    }
  }

  return {
    success: missingAndroid.length === 0 && missingIos.length === 0,
    missingAndroid,
    missingIos,
    details,
  };
}

/**
 * Validates that environment variables are defined in EAS config
 * @param config - EAS configuration
 * @returns Validation result with details
 */
export function validateEnvironmentVariables(config: EASConfig): {
  success: boolean;
  missingVariables: string[];
  details: string[];
} {
  const missingVariables: string[] = [];
  const details: string[] = [];

  // Required environment variables for mobile builds
  const requiredVariables = [
    'API_ENDPOINT',
    'API_KEY',
    'FIREBASE_CONFIG',
    'ANALYTICS_TOKEN',
  ];

  if (!config.build) {
    return {
      success: false,
      missingVariables: requiredVariables,
      details: ['No build section found in EAS configuration'],
    };
  }

  const profiles = Object.entries(config.build);

  for (const [profileName, profile] of profiles) {
    const buildProfile = profile as EASBuildProfile;
    const profileEnv = buildProfile.env || {};

    for (const variable of requiredVariables) {
      if (!(variable in profileEnv)) {
        missingVariables.push(`${profileName}.${variable}`);
        details.push(`Profile "${profileName}" missing environment variable: ${variable}`);
      }
    }
  }

  return {
    success: missingVariables.length === 0,
    missingVariables,
    details,
  };
}

/**
 * Comprehensive EAS configuration validation
 * @param configPath - Path to eas.json (defaults to project root)
 * @returns Complete validation result
 */
export function validateEASConfiguration(configPath?: string): ValidationResult {
  const timestamp = new Date();
  const checks = [];

  // Parse configuration
  const parseResult = parseEASConfig(configPath);
  if (!parseResult.success) {
    return {
      timestamp,
      overallStatus: ValidationStatus.Fail,
      checks: [
        {
          name: 'EAS Configuration File',
          category: ValidationCategory.Configuration,
          status: ValidationStatus.Fail,
          message: parseResult.error || 'Failed to parse EAS configuration',
          remediation: 'Ensure eas.json exists in the project root and contains valid JSON',
          documentationLink: 'https://docs.expo.dev/build/setup/',
        },
      ],
      summary: 'EAS configuration validation failed: configuration file not found or invalid',
    };
  }

  const config = parseResult.config!;

  // Validate build profiles
  const profilesResult = validateBuildProfiles(config);
  checks.push({
    name: 'Build Profiles',
    category: ValidationCategory.Configuration,
    status: profilesResult.success ? ValidationStatus.Pass : ValidationStatus.Fail,
    message: profilesResult.success
      ? 'All required build profiles (development, staging, production) are defined'
      : `Missing or invalid build profiles: ${profilesResult.details.join('; ')}`,
    remediation: profilesResult.success
      ? undefined
      : 'Add development, staging, and production build profiles to eas.json',
    documentationLink: 'https://docs.expo.dev/build/eas-json/',
  });

  // Verify platform build parameters
  const platformResult = verifyPlatformBuildParameters(config);
  checks.push({
    name: 'Platform Build Parameters',
    category: ValidationCategory.Configuration,
    status: platformResult.success ? ValidationStatus.Pass : ValidationStatus.Fail,
    message: platformResult.success
      ? 'All build profiles have Android and iOS parameters specified'
      : `Missing platform parameters: ${platformResult.details.join('; ')}`,
    remediation: platformResult.success
      ? undefined
      : 'Ensure each build profile specifies both android and ios build configurations',
    documentationLink: 'https://docs.expo.dev/build/eas-json/',
  });

  // Validate environment variables
  const envResult = validateEnvironmentVariables(config);
  checks.push({
    name: 'Environment Variables',
    category: ValidationCategory.Configuration,
    status: envResult.success ? ValidationStatus.Pass : ValidationStatus.Fail,
    message: envResult.success
      ? 'All required environment variables are defined in EAS configuration'
      : `Missing environment variables: ${envResult.details.join('; ')}`,
    remediation: envResult.success
      ? undefined
      : 'Add required environment variables to each build profile in eas.json',
    documentationLink: 'https://docs.expo.dev/build/variables/',
  });

  // Determine overall status
  const overallStatus = checks.every((check) => check.status === ValidationStatus.Pass)
    ? ValidationStatus.Pass
    : ValidationStatus.Fail;

  return {
    timestamp,
    overallStatus,
    checks,
    summary:
      overallStatus === ValidationStatus.Pass
        ? 'EAS configuration is valid and complete'
        : `EAS configuration validation failed: ${checks.filter((c) => c.status === ValidationStatus.Fail).length} check(s) failed`,
  };
}
