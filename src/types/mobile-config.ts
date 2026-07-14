/**
 * Mobile Development Configuration Types
 *
 * This module defines TypeScript interfaces and types for the mobile development
 * configuration system, including build configurations, signing credentials,
 * validation results, environment configurations, and dependency compatibility tracking.
 *
 * @module types/mobile-config
 */

/**
 * Supported mobile platforms
 */
export enum Platform {
  Android = 'android',
  iOS = 'ios',
}

/**
 * Build variants (debug or release)
 */
export enum BuildVariant {
  Debug = 'debug',
  Release = 'release',
}

/**
 * Build types (local or cloud)
 */
export enum BuildType {
  Local = 'local',
  EAS = 'eas',
}

/**
 * Validation check categories
 */
export enum ValidationCategory {
  Environment = 'environment',
  Configuration = 'configuration',
  Dependency = 'dependency',
  Credential = 'credential',
}

/**
 * Validation status
 */
export enum ValidationStatus {
  Pass = 'pass',
  Fail = 'fail',
  Warning = 'warning',
}

/**
 * Environment types
 */
export enum EnvironmentType {
  Development = 'development',
  Staging = 'staging',
  Production = 'production',
}

/**
 * Signing configuration for Android and iOS
 *
 * Contains platform-specific signing credentials and paths.
 * For Android: keystorePath, keystorePassword, keyAlias
 * For iOS: certificateId, provisioningProfileId
 *
 * @interface SigningConfig
 */
export interface SigningConfig {
  /** The platform this signing config applies to */
  platform: Platform;

  /** Path to Android keystore file (Android only) */
  keystorePath?: string;

  /** Password for Android keystore (Android only) */
  keystorePassword?: string;

  /** Key alias within the keystore (Android only) */
  keyAlias?: string;

  /** iOS certificate identifier in keychain (iOS only) */
  certificateId?: string;

  /** iOS provisioning profile identifier (iOS only) */
  provisioningProfileId?: string;
}

/**
 * Build configuration model
 *
 * Defines all parameters needed to execute a build for a specific platform
 * and variant, including environment variables and signing configuration.
 *
 * @interface BuildConfig
 */
export interface BuildConfig {
  /** Target platform (Android or iOS) */
  platform: Platform;

  /** Build variant (debug or release) */
  variant: BuildVariant;

  /** Build type (local or cloud via EAS) */
  buildType: BuildType;

  /** EAS profile name (required if buildType is EAS) */
  profile?: string;

  /** Environment variables for the build */
  environmentVariables: Record<string, string>;

  /** Signing configuration for the build */
  signingConfig: SigningConfig;

  /** Output path for build artifacts */
  outputPath: string;
}

/**
 * Individual validation check result
 *
 * Represents the result of a single validation check with status,
 * message, and optional remediation steps.
 *
 * @interface ValidationCheck
 */
export interface ValidationCheck {
  /** Name of the validation check */
  name: string;

  /** Category of the check */
  category: ValidationCategory;

  /** Status of the check (pass, fail, or warning) */
  status: ValidationStatus;

  /** Detailed message about the check result */
  message: string;

  /** Optional remediation steps if check failed */
  remediation?: string;

  /** Optional link to documentation */
  documentationLink?: string;
}

/**
 * Complete validation result
 *
 * Contains the overall validation status and individual check results,
 * along with a summary of the validation run.
 *
 * @interface ValidationResult
 */
export interface ValidationResult {
  /** Timestamp when validation was performed */
  timestamp: Date;

  /** Overall validation status */
  overallStatus: ValidationStatus;

  /** Array of individual validation checks */
  checks: ValidationCheck[];

  /** Summary message of the validation result */
  summary: string;
}

/**
 * Environment-specific configuration
 *
 * Contains environment variables and secrets for a specific environment
 * (development, staging, or production).
 *
 * @interface EnvironmentConfig
 */
export interface EnvironmentConfig {
  /** Environment type */
  environment: EnvironmentType;

  /** Public environment variables */
  variables: {
    /** API endpoint URL */
    API_ENDPOINT: string;

    /** API key for authentication */
    API_KEY: string;

    /** Firebase configuration JSON */
    FIREBASE_CONFIG: string;

    /** Analytics token */
    ANALYTICS_TOKEN: string;

    /** Additional custom variables */
    [key: string]: string;
  };

  /** Sensitive secrets (not exposed in logs) */
  secrets: {
    /** Android keystore password */
    ANDROID_KEYSTORE_PASSWORD: string;

    /** Android key password */
    ANDROID_KEY_PASSWORD: string;

    /** iOS certificate password (optional) */
    IOS_CERTIFICATE_PASSWORD?: string;

    /** Additional custom secrets */
    [key: string]: string | undefined;
  };
}

/**
 * Capacitor version compatibility information
 *
 * Specifies minimum version requirements for Capacitor and its dependencies.
 *
 * @interface CapacitorCompatibility
 */
export interface CapacitorCompatibility {
  /** Capacitor version */
  version: string;

  /** Minimum Android SDK API level required */
  minAndroidSdk: number;

  /** Minimum iOS SDK version required */
  minIosSdk: string;

  /** Minimum Gradle version required */
  minGradleVersion: string;

  /** Minimum CocoaPods version required */
  minCocoaPodsVersion: string;
}

/**
 * Android dependency compatibility information
 *
 * Specifies Android SDK, build-tools, and Gradle versions.
 *
 * @interface AndroidCompatibility
 */
export interface AndroidCompatibility {
  /** Android SDK API level */
  sdkVersion: number;

  /** Android build-tools version */
  buildToolsVersion: string;

  /** Gradle version */
  gradleVersion: string;
}

/**
 * iOS dependency compatibility information
 *
 * Specifies iOS SDK, Xcode, and CocoaPods versions.
 *
 * @interface IosCompatibility
 */
export interface IosCompatibility {
  /** iOS SDK version */
  sdkVersion: string;

  /** Xcode version */
  xcodeVersion: string;

  /** CocoaPods version */
  cocoaPodsVersion: string;
}

/**
 * Dependency compatibility matrix
 *
 * Tracks version compatibility between Capacitor, Android, and iOS dependencies.
 * Used to verify that all installed versions are compatible with each other.
 *
 * @interface DependencyMatrix
 */
export interface DependencyMatrix {
  /** Capacitor compatibility information */
  capacitor: CapacitorCompatibility;

  /** Android dependency versions */
  android: AndroidCompatibility;

  /** iOS dependency versions */
  ios: IosCompatibility;
}

/**
 * Capacitor configuration
 *
 * Represents the capacitor.config.ts configuration structure.
 *
 * @interface CapacitorConfig
 */
export interface CapacitorConfig {
  /** Unique app identifier (e.g., com.realestate.marketplace) */
  appId: string;

  /** Display name of the app */
  appName: string;

  /** Semantic version of the app */
  version: string;

  /** Path to compiled web assets directory */
  webDir: string;

  /** Capacitor plugins configuration */
  plugins?: Record<string, unknown>;

  /** Android-specific settings */
  android?: {
    minSdkVersion?: number;
    targetSdkVersion?: number;
  };

  /** iOS-specific settings */
  ios?: {
    deploymentTarget?: string;
    scheme?: string;
  };
}

/**
 * EAS build profile configuration
 *
 * Represents a single build profile in eas.json.
 *
 * @interface EASBuildProfile
 */
export interface EASBuildProfile {
  /** Build profile name */
  name?: string;

  /** Android build configuration */
  android?: {
    buildType?: 'apk' | 'aab';
    gradleCommand?: string;
  };

  /** iOS build configuration */
  ios?: {
    buildConfiguration?: 'Debug' | 'Release';
  };

  /** Environment variables for this profile */
  env?: Record<string, string>;
}

/**
 * EAS configuration
 *
 * Represents the eas.json configuration structure.
 *
 * @interface EASConfig
 */
export interface EASConfig {
  /** Build profiles */
  build?: {
    development?: EASBuildProfile;
    staging?: EASBuildProfile;
    production?: EASBuildProfile;
    [key: string]: EASBuildProfile | undefined;
  };

  /** Submit configuration for app stores */
  submit?: Record<string, unknown>;
}

/**
 * Type guard to check if a value is a valid Platform
 *
 * @param value - Value to check
 * @returns True if value is a valid Platform
 */
export function isPlatform(value: unknown): value is Platform {
  return Object.values(Platform).includes(value as Platform);
}

/**
 * Type guard to check if a value is a valid BuildVariant
 *
 * @param value - Value to check
 * @returns True if value is a valid BuildVariant
 */
export function isBuildVariant(value: unknown): value is BuildVariant {
  return Object.values(BuildVariant).includes(value as BuildVariant);
}

/**
 * Type guard to check if a value is a valid BuildType
 *
 * @param value - Value to check
 * @returns True if value is a valid BuildType
 */
export function isBuildType(value: unknown): value is BuildType {
  return Object.values(BuildType).includes(value as BuildType);
}

/**
 * Type guard to check if a value is a valid ValidationStatus
 *
 * @param value - Value to check
 * @returns True if value is a valid ValidationStatus
 */
export function isValidationStatus(value: unknown): value is ValidationStatus {
  return Object.values(ValidationStatus).includes(value as ValidationStatus);
}

/**
 * Type guard to check if a value is a valid EnvironmentType
 *
 * @param value - Value to check
 * @returns True if value is a valid EnvironmentType
 */
export function isEnvironmentType(value: unknown): value is EnvironmentType {
  return Object.values(EnvironmentType).includes(value as EnvironmentType);
}

/**
 * Type guard to check if a value is a valid SigningConfig
 *
 * @param value - Value to check
 * @returns True if value is a valid SigningConfig
 */
export function isSigningConfig(value: unknown): value is SigningConfig {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const config = value as Record<string, unknown>;
  return isPlatform(config.platform);
}

/**
 * Type guard to check if a value is a valid BuildConfig
 *
 * @param value - Value to check
 * @returns True if value is a valid BuildConfig
 */
export function isBuildConfig(value: unknown): value is BuildConfig {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const config = value as Record<string, unknown>;
  return (
    isPlatform(config.platform) &&
    isBuildVariant(config.variant) &&
    isBuildType(config.buildType) &&
    typeof config.environmentVariables === 'object' &&
    isSigningConfig(config.signingConfig) &&
    typeof config.outputPath === 'string'
  );
}

/**
 * Type guard to check if a value is a valid ValidationResult
 *
 * @param value - Value to check
 * @returns True if value is a valid ValidationResult
 */
export function isValidationResult(value: unknown): value is ValidationResult {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const result = value as Record<string, unknown>;
  return (
    result.timestamp instanceof Date &&
    isValidationStatus(result.overallStatus) &&
    Array.isArray(result.checks) &&
    typeof result.summary === 'string'
  );
}

/**
 * Type guard to check if a value is a valid EnvironmentConfig
 *
 * @param value - Value to check
 * @returns True if value is a valid EnvironmentConfig
 */
export function isEnvironmentConfig(value: unknown): value is EnvironmentConfig {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const config = value as Record<string, unknown>;
  return (
    isEnvironmentType(config.environment) &&
    typeof config.variables === 'object' &&
    typeof config.secrets === 'object'
  );
}

/**
 * Type guard to check if a value is a valid DependencyMatrix
 *
 * @param value - Value to check
 * @returns True if value is a valid DependencyMatrix
 */
export function isDependencyMatrix(value: unknown): value is DependencyMatrix {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const matrix = value as Record<string, unknown>;
  return (
    typeof matrix.capacitor === 'object' &&
    typeof matrix.android === 'object' &&
    typeof matrix.ios === 'object'
  );
}

/**
 * Utility type for extracting platform-specific signing config
 *
 * @template T - The platform type
 */
export type PlatformSigningConfig<T extends Platform> = T extends Platform.Android
  ? Required<Pick<SigningConfig, 'keystorePath' | 'keystorePassword' | 'keyAlias'>>
  : T extends Platform.iOS
    ? Required<Pick<SigningConfig, 'certificateId' | 'provisioningProfileId'>>
    : never;

/**
 * Utility type for build config with specific platform
 *
 * @template T - The platform type
 */
export type PlatformBuildConfig<T extends Platform> = Omit<BuildConfig, 'platform' | 'signingConfig'> & {
  platform: T;
  signingConfig: SigningConfig & { platform: T };
};
