/**
 * Android APK Build System Data Models
 *
 * This module defines TypeScript interfaces and data classes for the Android APK build system,
 * including build profiles, configurations, execution results, artifact management, and
 * progress tracking. These models form the foundation for all build system components.
 *
 * @module types/android-build
 */

/**
 * Build types supported by the system
 */
export enum BuildType {
  Debug = 'debug',
  Release = 'release',
}

/**
 * Build variants (output formats)
 */
export enum BuildVariant {
  APK = 'apk',
  AAB = 'aab',
  Debug = 'debug',
  Release = 'release',
}

/**
 * Build stage names
 */
export enum BuildStage {
  Validation = 'validation',
  DependencyResolution = 'dependency-resolution',
  Compilation = 'compilation',
  Optimization = 'optimization',
  Packaging = 'packaging',
  Signing = 'signing',
  Verification = 'verification',
  ArtifactCollection = 'artifact-collection',
}

/**
 * Build stage status
 */
export enum BuildStageStatus {
  Success = 'success',
  Failed = 'failed',
  Skipped = 'skipped',
}

/**
 * Build execution status
 */
export enum BuildStatus {
  Queued = 'queued',
  InProgress = 'in-progress',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled',
}

/**
 * Build error codes
 */
export enum BuildErrorCode {
  BuildEnvInvalid = 'BUILD_ENV_INVALID',
  BuildConfigInvalid = 'BUILD_CONFIG_INVALID',
  BuildGradleFailed = 'BUILD_GRADLE_FAILED',
  BuildSigningFailed = 'BUILD_SIGNING_FAILED',
  BuildVerificationFailed = 'BUILD_VERIFICATION_FAILED',
  BuildDependencyConflict = 'BUILD_DEPENDENCY_CONFLICT',
  BuildResourceError = 'BUILD_RESOURCE_ERROR',
  BuildManifestError = 'BUILD_MANIFEST_ERROR',
  BuildCertificateExpired = 'BUILD_CERTIFICATE_EXPIRED',
  BuildKeystoreError = 'BUILD_KEYSTORE_ERROR',
}

/**
 * Signing configuration for Android builds
 *
 * Contains credentials and paths needed to sign APK/AAB files.
 * Passwords are stored securely and should not be logged.
 *
 * @interface SigningConfiguration
 */
export interface SigningConfiguration {
  /** Path to the keystore file */
  keystorePath: string;

  /** Password for the keystore (sensitive - do not log) */
  keystorePassword: string;

  /** Alias of the key within the keystore */
  keyAlias: string;

  /** Password for the key (sensitive - do not log) */
  keyPassword: string;

  /** Expected certificate subject DN for validation (optional) */
  certificateSubjectDN?: string;
}

/**
 * Build parameters that control compilation and optimization
 *
 * @interface BuildParameters
 */
export interface BuildParameters {
  /** Enable code minification/obfuscation */
  minifyEnabled: boolean;

  /** Enable resource shrinking */
  shrinkResources: boolean;

  /** Enable debuggable flag */
  debuggable: boolean;

  /** Version code for the build */
  versionCode: number;

  /** Version name for the build */
  versionName: string;

  /** Enable parallel compilation */
  parallelEnabled?: boolean;

  /** Enable build cache */
  cacheEnabled?: boolean;

  /** Custom Gradle properties */
  gradleProperties?: Record<string, string>;
}

/**
 * Build profile configuration
 *
 * Defines a named build configuration for a specific scenario (development, staging, production).
 * Profiles can be selected and applied to builds.
 *
 * @interface BuildProfile
 */
export interface BuildProfile {
  /** Profile name (e.g., 'development', 'staging', 'production') */
  name: string | 'development' | 'staging' | 'production';

  /** Build type (debug or release) */
  buildType: BuildType;

  /** Build variant (debug, release, or custom) */
  variant: string;

  /** Signing configuration for this profile */
  signingConfig: SigningConfiguration;

  /** Build parameters for this profile */
  buildParameters: BuildParameters;

  /** Environment variables for this profile */
  environmentVariables: Record<string, string>;

  /** Output directory for build artifacts */
  outputDirectory: string;

  /** Optional description of the profile */
  description?: string;
}

/**
 * Build configuration for a specific build execution
 *
 * Contains all parameters needed to execute a build, derived from a profile
 * and potentially overridden by command-line arguments.
 *
 * @interface BuildConfiguration
 */
export interface BuildConfiguration {
  /** Unique build identifier */
  buildId: string;

  /** Selected build profile name */
  profile: string;

  /** Build variant (debug, release, or aab) */
  variant: 'debug' | 'release' | 'aab';

  /** Force clean build (clear cache) */
  clean: boolean;

  /** Enable parallel compilation */
  parallel: boolean;

  /** Enable build cache */
  cacheEnabled: boolean;

  /** Build type (debug or release) */
  buildType: BuildType;

  /** Build parameters */
  buildParameters: BuildParameters;

  /** Signing configuration */
  signingConfig: SigningConfiguration;

  /** Output directory */
  outputDirectory: string;

  /** Environment variables */
  environmentVariables: Record<string, string>;

  /** Timestamp when configuration was created */
  createdAt: Date;
}

/**
 * Result of a single build stage
 *
 * Tracks the execution of a build stage including timing, status, and details.
 *
 * @interface BuildStageResult
 */
export interface BuildStageResult {
  /** Name of the build stage */
  name: string;

  /** Status of the stage (success, failed, or skipped) */
  status: BuildStageStatus;

  /** Duration of the stage in milliseconds */
  duration: number;

  /** Start time of the stage */
  startTime: Date;

  /** End time of the stage */
  endTime: Date;

  /** Optional details about the stage execution */
  details?: string;

  /** Optional error message if stage failed */
  errorMessage?: string;

  /** Optional log output from the stage */
  logs?: string[];
}

/**
 * Build progress information
 *
 * Provides real-time progress information during build execution.
 *
 * @interface BuildProgress
 */
export interface BuildProgress {
  /** Name of the current build stage */
  currentStage: string;

  /** Index of the current stage (0-based) */
  stageIndex: number;

  /** Total number of stages */
  totalStages: number;

  /** Percentage of build completed (0-100) */
  percentComplete: number;

  /** Estimated time remaining in milliseconds */
  estimatedTimeRemaining: number;

  /** Elapsed time in milliseconds */
  elapsedTime: number;

  /** Optional message about current progress */
  message?: string;
}

/**
 * Build error information
 *
 * Represents a build failure with error code, message, and remediation steps.
 *
 * @interface BuildError
 */
export interface BuildError {
  /** Error code for categorization */
  code: BuildErrorCode;

  /** Build stage where error occurred */
  stage: string;

  /** Human-readable error message */
  message: string;

  /** Detailed error information */
  details: string;

  /** Suggested remediation steps */
  remediation: string;

  /** Optional link to documentation */
  documentationLink?: string;

  /** Optional stack trace */
  stackTrace?: string;

  /** Timestamp when error occurred */
  timestamp: Date;
}

/**
 * Signing information for a build artifact
 *
 * Contains certificate and signature details for verification.
 *
 * @interface SigningInfo
 */
export interface SigningInfo {
  /** Whether the artifact is signed */
  signed: boolean;

  /** Certificate subject DN */
  certificateSubjectDN: string;

  /** Certificate issuer DN */
  certificateIssuerDN: string;

  /** Certificate validity start date */
  certificateNotBefore: Date;

  /** Certificate expiration date */
  certificateNotAfter: Date;

  /** Signature algorithm used */
  signatureAlgorithm: string;

  /** Whether the certificate is expired */
  certificateExpired: boolean;

  /** Days until certificate expiration (negative if expired) */
  certificateExpiringIn: number;
}

/**
 * Manifest information extracted from APK/AAB
 *
 * Contains key metadata from AndroidManifest.xml.
 *
 * @interface ManifestInfo
 */
export interface ManifestInfo {
  /** Application package name */
  packageName: string;

  /** Version code */
  versionCode: number;

  /** Version name */
  versionName: string;

  /** Minimum SDK API level */
  minSdkVersion: number;

  /** Target SDK API level */
  targetSdkVersion: number;

  /** List of declared permissions */
  permissions: string[];

  /** List of declared activities */
  activities: string[];

  /** List of declared services */
  services: string[];

  /** List of declared broadcast receivers */
  receivers: string[];

  /** List of declared content providers */
  providers: string[];
}

/**
 * Build artifact metadata
 *
 * Represents a compiled APK or AAB file with all associated metadata.
 *
 * @interface BuildArtifact
 */
export interface BuildArtifact {
  /** Unique artifact identifier */
  id: string;

  /** Artifact type (apk or aab) */
  type: 'apk' | 'aab';

  /** Build variant */
  variant: string;

  /** Build type (debug or release) */
  buildType: BuildType;

  /** Full file path to the artifact */
  filePath: string;

  /** File name only */
  fileName: string;

  /** File size in bytes */
  fileSize: number;

  /** SHA-256 checksum of the file */
  checksum: string;

  /** Timestamp when artifact was created */
  timestamp: Date;

  /** Build duration in milliseconds */
  buildDuration: number;

  /** Signing information */
  signingInfo: SigningInfo;

  /** Manifest information */
  manifestInfo: ManifestInfo;

  /** Additional metadata */
  metadata: Record<string, unknown>;
}

/**
 * Build manifest file content
 *
 * Contains comprehensive information about a build execution for logging and reproducibility.
 *
 * @interface BuildManifest
 */
export interface BuildManifest {
  /** Unique build identifier */
  buildId: string;

  /** Timestamp of the build */
  timestamp: Date;

  /** Build profile used */
  profile: string;

  /** Build variant */
  variant: string;

  /** Array of build artifacts generated */
  artifacts: BuildArtifact[];

  /** Total build duration in milliseconds */
  buildDuration: number;

  /** Results of each build stage */
  stages: BuildStageResult[];

  /** Environment information */
  environment: {
    /** Gradle version used */
    gradleVersion: string;

    /** Android SDK API level */
    androidSdkVersion: number;

    /** Android build-tools version */
    buildToolsVersion: string;
  };

  /** Reproducibility information (optional) */
  reproducibilityInfo?: {
    /** Whether this build is reproducible */
    reproducible: boolean;

    /** ID of previous build for comparison */
    previousBuildId?: string;

    /** Whether checksums match previous build */
    checksumMatch: boolean;
  };
}

/**
 * Complete build result
 *
 * Contains all information about a completed build execution.
 *
 * @interface BuildResult
 */
export interface BuildResult {
  /** Whether the build succeeded */
  success: boolean;

  /** Path to the primary artifact (APK or AAB) */
  artifactPath: string;

  /** Size of the primary artifact in bytes */
  artifactSize: number;

  /** SHA-256 checksum of the primary artifact */
  checksum: string;

  /** Total build duration in milliseconds */
  duration: number;

  /** Results of each build stage */
  stages: BuildStageResult[];

  /** Build errors (if any) */
  errors?: BuildError[];

  /** Build warnings (if any) */
  warnings?: string[];

  /** Build manifest with complete metadata */
  manifest?: BuildManifest;

  /** Timestamp when build completed */
  completedAt: Date;
}

/**
 * Build status information
 *
 * Tracks the current state of a build execution.
 *
 * @interface BuildStatusInfo
 */
export interface BuildStatusInfo {
  /** Unique build identifier */
  buildId: string;

  /** Current build status */
  status: BuildStatus;

  /** Build profile being used */
  profile: string;

  /** Build variant */
  variant: string;

  /** Build start time */
  startTime: Date;

  /** Build end time (if completed) */
  endTime?: Date;

  /** Current build stage */
  currentStage: string;

  /** Current progress information */
  progress: BuildProgress;

  /** Build result (if completed) */
  result?: BuildResult;

  /** Build error (if failed) */
  error?: BuildError;
}

/**
 * Build cache information
 *
 * Tracks build cache configuration and statistics.
 *
 * @interface BuildCache
 */
export interface BuildCache {
  /** Whether caching is enabled */
  enabled: boolean;

  /** Cache directory path */
  directory: string;

  /** Maximum cache size in MB */
  maxSize: number;

  /** Cache retention period in days */
  retentionDays: number;

  /** Last time cache was cleared */
  lastCleared: Date;

  /** Current cache size in MB */
  currentSize: number;

  /** Cache hit rate (0-100) */
  hitRate?: number;

  /** Number of cache hits */
  hits?: number;

  /** Number of cache misses */
  misses?: number;
}

/**
 * Build performance metrics
 *
 * Tracks performance information for a build execution.
 *
 * @interface BuildPerformanceMetrics
 */
export interface BuildPerformanceMetrics {
  /** Build identifier */
  buildId: string;

  /** Total build duration in milliseconds */
  totalDuration: number;

  /** Per-stage timing information */
  stages: Record<
    string,
    {
      /** Stage duration in milliseconds */
      duration: number;

      /** Stage start time */
      startTime: Date;

      /** Stage end time */
      endTime: Date;

      /** Whether this stage used cache */
      cached: boolean;
    }
  >;

  /** Cache hit rate (0-100) */
  cacheHitRate: number;

  /** Parallelization factor */
  parallelizationFactor: number;

  /** Historical average build time in milliseconds */
  averageBuildTime: number;

  /** Build time regression percentage */
  buildTimeRegression: number;
}

/**
 * Verification check result
 *
 * Represents a single verification check performed on a build artifact.
 *
 * @interface VerificationCheck
 */
export interface VerificationCheck {
  /** Name of the verification check */
  name: string;

  /** Category of the check */
  category: 'structure' | 'signature' | 'manifest' | 'resources' | 'code';

  /** Check status (pass, fail, or warning) */
  status: 'pass' | 'fail' | 'warning';

  /** Check result message */
  message: string;

  /** Optional detailed information */
  details?: string;
}

/**
 * Build artifact verification result
 *
 * Contains results of all verification checks performed on a build artifact.
 *
 * @interface VerificationResult
 */
export interface VerificationResult {
  /** Path to the artifact being verified */
  artifactPath: string;

  /** Overall verification status */
  overallStatus: 'pass' | 'fail' | 'warning';

  /** Array of individual verification checks */
  checks: VerificationCheck[];

  /** Timestamp of verification */
  timestamp: Date;

  /** Verification duration in milliseconds */
  duration: number;
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
 * Type guard to check if a value is a valid BuildStageStatus
 *
 * @param value - Value to check
 * @returns True if value is a valid BuildStageStatus
 */
export function isBuildStageStatus(value: unknown): value is BuildStageStatus {
  return Object.values(BuildStageStatus).includes(value as BuildStageStatus);
}

/**
 * Type guard to check if a value is a valid BuildStatus
 *
 * @param value - Value to check
 * @returns True if value is a valid BuildStatus
 */
export function isBuildStatus(value: unknown): value is BuildStatus {
  return Object.values(BuildStatus).includes(value as BuildStatus);
}

/**
 * Type guard to check if a value is a valid BuildErrorCode
 *
 * @param value - Value to check
 * @returns True if value is a valid BuildErrorCode
 */
export function isBuildErrorCode(value: unknown): value is BuildErrorCode {
  return Object.values(BuildErrorCode).includes(value as BuildErrorCode);
}

/**
 * Type guard to check if a value is a valid SigningConfiguration
 *
 * @param value - Value to check
 * @returns True if value is a valid SigningConfiguration
 */
export function isSigningConfiguration(value: unknown): value is SigningConfiguration {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const config = value as Record<string, unknown>;
  return (
    typeof config.keystorePath === 'string' &&
    typeof config.keystorePassword === 'string' &&
    typeof config.keyAlias === 'string' &&
    typeof config.keyPassword === 'string'
  );
}

/**
 * Type guard to check if a value is a valid BuildProfile
 *
 * @param value - Value to check
 * @returns True if value is a valid BuildProfile
 */
export function isBuildProfile(value: unknown): value is BuildProfile {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const profile = value as Record<string, unknown>;
  return (
    typeof profile.name === 'string' &&
    isBuildType(profile.buildType) &&
    typeof profile.variant === 'string' &&
    isSigningConfiguration(profile.signingConfig) &&
    typeof profile.buildParameters === 'object' &&
    typeof profile.environmentVariables === 'object' &&
    typeof profile.outputDirectory === 'string'
  );
}

/**
 * Type guard to check if a value is a valid BuildConfiguration
 *
 * @param value - Value to check
 * @returns True if value is a valid BuildConfiguration
 */
export function isBuildConfiguration(value: unknown): value is BuildConfiguration {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const config = value as Record<string, unknown>;
  return (
    typeof config.buildId === 'string' &&
    typeof config.profile === 'string' &&
    (config.variant === 'debug' || config.variant === 'release' || config.variant === 'aab') &&
    typeof config.clean === 'boolean' &&
    typeof config.parallel === 'boolean' &&
    typeof config.cacheEnabled === 'boolean' &&
    isBuildType(config.buildType) &&
    isSigningConfiguration(config.signingConfig)
  );
}

/**
 * Type guard to check if a value is a valid BuildResult
 *
 * @param value - Value to check
 * @returns True if value is a valid BuildResult
 */
export function isBuildResult(value: unknown): value is BuildResult {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const result = value as Record<string, unknown>;
  return (
    typeof result.success === 'boolean' &&
    typeof result.artifactPath === 'string' &&
    typeof result.artifactSize === 'number' &&
    typeof result.checksum === 'string' &&
    typeof result.duration === 'number' &&
    Array.isArray(result.stages) &&
    result.completedAt instanceof Date
  );
}

/**
 * Type guard to check if a value is a valid BuildError
 *
 * @param value - Value to check
 * @returns True if value is a valid BuildError
 */
export function isBuildError(value: unknown): value is BuildError {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const error = value as Record<string, unknown>;
  return (
    isBuildErrorCode(error.code) &&
    typeof error.stage === 'string' &&
    typeof error.message === 'string' &&
    typeof error.details === 'string' &&
    typeof error.remediation === 'string' &&
    error.timestamp instanceof Date
  );
}

/**
 * Type guard to check if a value is a valid BuildArtifact
 *
 * @param value - Value to check
 * @returns True if value is a valid BuildArtifact
 */
export function isBuildArtifact(value: unknown): value is BuildArtifact {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const artifact = value as Record<string, unknown>;
  return (
    typeof artifact.id === 'string' &&
    (artifact.type === 'apk' || artifact.type === 'aab') &&
    typeof artifact.variant === 'string' &&
    isBuildType(artifact.buildType) &&
    typeof artifact.filePath === 'string' &&
    typeof artifact.fileName === 'string' &&
    typeof artifact.fileSize === 'number' &&
    typeof artifact.checksum === 'string' &&
    artifact.timestamp instanceof Date &&
    typeof artifact.buildDuration === 'number'
  );
}

/**
 * Type guard to check if a value is a valid BuildManifest
 *
 * @param value - Value to check
 * @returns True if value is a valid BuildManifest
 */
export function isBuildManifest(value: unknown): value is BuildManifest {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const manifest = value as Record<string, unknown>;
  return (
    typeof manifest.buildId === 'string' &&
    manifest.timestamp instanceof Date &&
    typeof manifest.profile === 'string' &&
    typeof manifest.variant === 'string' &&
    Array.isArray(manifest.artifacts) &&
    typeof manifest.buildDuration === 'number' &&
    Array.isArray(manifest.stages) &&
    typeof manifest.environment === 'object'
  );
}
