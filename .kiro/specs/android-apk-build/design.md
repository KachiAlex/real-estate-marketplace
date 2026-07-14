# Android APK Build - Design Document

## Overview

The Android APK build system provides a complete, automated solution for compiling, signing, and packaging Android applications into production-ready APK and AAB (Android App Bundle) artifacts. Building on the mobile development preparation infrastructure, this system handles build execution, artifact management, build verification, and progress tracking for both debug and release builds.

The design ensures developers can:
- Build debug APKs quickly for rapid iteration with minimal overhead
- Build production-ready release APKs with automatic signing and optimization
- Generate Android App Bundles for Google Play distribution
- Verify build artifacts are valid and properly signed
- Track build progress and identify performance bottlenecks
- Manage build artifacts with clear organization and metadata
- Recover from build failures with actionable error messages

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Developer Workstation                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Build Invocation Layer                           │   │
│  │  - CLI Commands (debug, release, aab)                    │   │
│  │  - Build Profile Selection                               │   │
│  │  - Configuration Validation                              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           ↓                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Build Orchestration Layer                        │   │
│  │  - Build Stage Management                                │   │
│  │  - Progress Tracking                                     │   │
│  │  - Performance Monitoring                                │   │
│  │  - Error Handling & Recovery                             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           ↓                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Build Execution Layer                            │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │ Gradle Build System                                 │ │   │
│  │  │ - Dependency Resolution                             │ │   │
│  │  │ - Code Compilation                                  │ │   │
│  │  │ - Resource Processing                               │ │   │
│  │  │ - DEX Generation                                    │ │   │
│  │  │ - Packaging                                         │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  │                                                           │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │ Signing & Verification                              │ │   │
│  │  │ - Keystore Access                                   │ │   │
│  │  │ - APK/AAB Signing                                   │ │   │
│  │  │ - Signature Verification                            │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  │                                                           │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │ Optimization & Verification                         │ │   │
│  │  │ - Code Obfuscation (R8/ProGuard)                    │ │   │
│  │  │ - Resource Shrinking                                │ │   │
│  │  │ - Manifest Validation                               │ │   │
│  │  │ - Structure Verification                            │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           ↓                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Artifact Management Layer                        │   │
│  │  - Artifact Storage & Organization                       │   │
│  │  - Manifest Generation                                   │   │
│  │  - History Tracking                                      │   │
│  │  - Cleanup & Retention                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Build Execution Flow

#### Debug Build Flow
```
Developer Command: npm run build:android:debug
    ↓
Validate Environment (SDK, Gradle, Keystore)
    ↓
Load Configuration & Environment Variables
    ↓
Validate Build Configuration
    ↓
Resolve Dependencies (Gradle)
    ↓
Compile Source Code
    ↓
Process Resources
    ↓
Generate DEX Files
    ↓
Package APK
    ↓
Sign with Debug Keystore
    ↓
Verify Signature
    ↓
Collect Artifacts
    ↓
Generate Build Manifest
    ↓
Report Success & Artifact Location
```

#### Release Build Flow
```
Developer Command: npm run build:android:release
    ↓
Validate Environment (SDK, Gradle, Keystore)
    ↓
Load Configuration & Environment Variables
    ↓
Validate Release Configuration
    ↓
Verify Signing Certificate (not expired, valid)
    ↓
Resolve Dependencies (Gradle)
    ↓
Compile Source Code
    ↓
Process Resources
    ↓
Generate DEX Files
    ↓
Apply Code Obfuscation (R8)
    ↓
Apply Resource Shrinking
    ↓
Package APK
    ↓
Sign with Production Keystore
    ↓
Verify Signature
    ↓
Verify APK Structure & Manifest
    ↓
Collect Artifacts
    ↓
Generate Build Manifest
    ↓
Report Success & Artifact Location
```

#### AAB Build Flow
```
Developer Command: npm run build:android:aab
    ↓
Validate Environment (SDK, Gradle, Keystore)
    ↓
Load Configuration & Environment Variables
    ↓
Validate Release Configuration
    ↓
Verify Signing Certificate (not expired, valid)
    ↓
Resolve Dependencies (Gradle)
    ↓
Compile Source Code
    ↓
Process Resources
    ↓
Generate DEX Files
    ↓
Apply Code Obfuscation (R8)
    ↓
Apply Resource Shrinking
    ↓
Bundle Resources & Code
    ↓
Sign with Production Keystore
    ↓
Verify Bundle Signature
    ↓
Verify Bundle Structure & Manifest
    ↓
Collect Artifacts
    ↓
Generate Build Manifest
    ↓
Report Success & Artifact Location
```

### Build Stages and Timing

Each build is divided into measurable stages with timing information:

1. **Validation** (5-10 seconds)
   - Environment checks
   - Configuration validation
   - Dependency verification

2. **Dependency Resolution** (10-30 seconds)
   - Gradle dependency download
   - Dependency conflict resolution
   - Cache utilization

3. **Compilation** (30-60 seconds)
   - Source code compilation
   - Resource processing
   - DEX generation

4. **Optimization** (10-20 seconds, release only)
   - Code obfuscation
   - Resource shrinking
   - Minification

5. **Packaging** (10-20 seconds)
   - APK/AAB assembly
   - Manifest processing
   - Resource packaging

6. **Signing** (5-10 seconds)
   - Keystore access
   - Signature generation
   - Signature verification

7. **Verification** (5-10 seconds)
   - Structure validation
   - Manifest validation
   - Integrity checks

## Components and Interfaces

### 1. Build Configuration System

#### Build Profile Configuration
```typescript
interface BuildProfile {
  name: 'development' | 'staging' | 'production' | string;
  buildType: 'debug' | 'release';
  variant: string; // e.g., 'debug', 'release', 'staging'
  signingConfig: SigningConfiguration;
  buildParameters: {
    minifyEnabled: boolean;
    shrinkResources: boolean;
    debuggable: boolean;
    versionCode: number;
    versionName: string;
  };
  environmentVariables: Record<string, string>;
  outputDirectory: string;
}

interface SigningConfiguration {
  keystorePath: string;
  keystorePassword: string;
  keyAlias: string;
  keyPassword: string;
  certificateSubjectDN?: string; // For validation
}
```

#### Build Configuration File (`build-config.json`)
```json
{
  "profiles": {
    "development": {
      "buildType": "debug",
      "variant": "debug",
      "signingConfig": "debug",
      "buildParameters": {
        "minifyEnabled": false,
        "shrinkResources": false,
        "debuggable": true
      }
    },
    "staging": {
      "buildType": "release",
      "variant": "staging",
      "signingConfig": "staging",
      "buildParameters": {
        "minifyEnabled": true,
        "shrinkResources": true,
        "debuggable": false
      }
    },
    "production": {
      "buildType": "release",
      "variant": "release",
      "signingConfig": "production",
      "buildParameters": {
        "minifyEnabled": true,
        "shrinkResources": true,
        "debuggable": false
      }
    }
  }
}
```

### 2. Build Execution Engine

#### Build Executor Interface
```typescript
interface BuildExecutor {
  // Execute a build with specified configuration
  executeBuild(config: BuildConfiguration): Promise<BuildResult>;
  
  // Get current build progress
  getProgress(): BuildProgress;
  
  // Cancel ongoing build
  cancelBuild(): Promise<void>;
  
  // Get build logs
  getLogs(stage?: string): string[];
}

interface BuildConfiguration {
  profile: string;
  variant: 'debug' | 'release' | 'aab';
  clean: boolean; // Force clean build
  parallel: boolean; // Enable parallel compilation
  cacheEnabled: boolean;
}

interface BuildResult {
  success: boolean;
  artifactPath: string;
  artifactSize: number;
  checksum: string;
  duration: number;
  stages: BuildStageResult[];
  errors?: BuildError[];
  warnings?: string[];
}

interface BuildStageResult {
  name: string;
  status: 'success' | 'failed' | 'skipped';
  duration: number;
  startTime: Date;
  endTime: Date;
  details?: string;
}

interface BuildProgress {
  currentStage: string;
  stageIndex: number;
  totalStages: number;
  percentComplete: number;
  estimatedTimeRemaining: number;
  elapsedTime: number;
}
```

### 3. Artifact Management System

#### Build Artifact Structure
```typescript
interface BuildArtifact {
  id: string; // Unique identifier
  type: 'apk' | 'aab';
  variant: string;
  buildType: 'debug' | 'release';
  filePath: string;
  fileName: string;
  fileSize: number;
  checksum: string;
  timestamp: Date;
  buildDuration: number;
  signingInfo: SigningInfo;
  manifestInfo: ManifestInfo;
  metadata: Record<string, any>;
}

interface SigningInfo {
  signed: boolean;
  certificateSubjectDN: string;
  certificateIssuerDN: string;
  certificateNotBefore: Date;
  certificateNotAfter: Date;
  signatureAlgorithm: string;
  certificateExpired: boolean;
  certificateExpiringIn: number; // days
}

interface ManifestInfo {
  packageName: string;
  versionCode: number;
  versionName: string;
  minSdkVersion: number;
  targetSdkVersion: number;
  permissions: string[];
  activities: string[];
  services: string[];
  receivers: string[];
  providers: string[];
}

interface BuildManifest {
  buildId: string;
  timestamp: Date;
  profile: string;
  variant: string;
  artifacts: BuildArtifact[];
  buildDuration: number;
  stages: BuildStageResult[];
  environment: {
    gradleVersion: string;
    androidSdkVersion: number;
    buildToolsVersion: string;
  };
  reproducibilityInfo?: {
    reproducible: boolean;
    previousBuildId?: string;
    checksumMatch: boolean;
  };
}
```

#### Artifact Storage Organization
```
build-artifacts/
├── debug/
│   ├── 2024-01-15_10-30-45/
│   │   ├── app-debug.apk
│   │   ├── build-manifest.json
│   │   └── build.log
│   └── 2024-01-15_11-00-00/
│       ├── app-debug.apk
│       ├── build-manifest.json
│       └── build.log
├── release/
│   ├── 2024-01-15_14-30-45/
│   │   ├── app-release.apk
│   │   ├── app-release.aab
│   │   ├── build-manifest.json
│   │   └── build.log
│   └── 2024-01-15_15-00-00/
│       ├── app-release.apk
│       ├── app-release.aab
│       ├── build-manifest.json
│       └── build.log
└── history.json
```

### 4. Build Verification System

#### Verification Checks
```typescript
interface VerificationCheck {
  name: string;
  category: 'structure' | 'signature' | 'manifest' | 'resources' | 'code';
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string;
}

interface VerificationResult {
  artifactPath: string;
  overallStatus: 'pass' | 'fail' | 'warning';
  checks: VerificationCheck[];
  timestamp: Date;
  duration: number;
}

// Verification checks performed:
// 1. File Integrity: APK/AAB file exists and is not empty
// 2. Signature Validity: APK/AAB is properly signed
// 3. Certificate Validity: Signing certificate is valid and not expired
// 4. Manifest Validity: AndroidManifest.xml is well-formed
// 5. Resource Integrity: All resources are present and valid
// 6. Code Integrity: DEX files are valid
// 7. Structure Validation: APK/AAB structure conforms to Android standards
// 8. Permissions Validation: All declared permissions are valid
// 9. Component Validation: All declared components exist
// 10. Compatibility Check: Target SDK and min SDK are valid
```

### 5. Build Status and Progress Tracking

#### Build Status Model
```typescript
interface BuildStatus {
  buildId: string;
  status: 'queued' | 'in-progress' | 'completed' | 'failed' | 'cancelled';
  profile: string;
  variant: string;
  startTime: Date;
  endTime?: Date;
  currentStage: string;
  progress: BuildProgress;
  result?: BuildResult;
  error?: BuildError;
}

interface BuildError {
  code: string;
  stage: string;
  message: string;
  details: string;
  remediation: string;
  documentationLink?: string;
}

// Build error codes:
// BUILD_ENV_INVALID: Environment validation failed
// BUILD_CONFIG_INVALID: Configuration validation failed
// BUILD_GRADLE_FAILED: Gradle build failed
// BUILD_SIGNING_FAILED: Signing failed
// BUILD_VERIFICATION_FAILED: Artifact verification failed
// BUILD_DEPENDENCY_CONFLICT: Dependency conflict detected
// BUILD_RESOURCE_ERROR: Resource processing error
// BUILD_MANIFEST_ERROR: Manifest validation error
// BUILD_CERTIFICATE_EXPIRED: Signing certificate expired
// BUILD_KEYSTORE_ERROR: Keystore access error
```

### 6. Build Logging and Diagnostics

#### Build Log Structure
```
[2024-01-15 10:30:45] [INFO] Starting Android debug build
[2024-01-15 10:30:45] [INFO] Build profile: development
[2024-01-15 10:30:45] [INFO] Build variant: debug
[2024-01-15 10:30:46] [INFO] Stage 1/7: Validation
[2024-01-15 10:30:46] [INFO] Validating Android SDK...
[2024-01-15 10:30:46] [SUCCESS] Android SDK found at /Users/dev/Library/Android/sdk
[2024-01-15 10:30:47] [INFO] Validating Gradle...
[2024-01-15 10:30:47] [SUCCESS] Gradle 8.0 found
[2024-01-15 10:30:48] [INFO] Validating build configuration...
[2024-01-15 10:30:48] [SUCCESS] Build configuration valid
[2024-01-15 10:30:49] [INFO] Stage 2/7: Dependency Resolution
[2024-01-15 10:30:49] [INFO] Resolving Gradle dependencies...
[2024-01-15 10:31:05] [SUCCESS] Dependencies resolved (16 seconds)
[2024-01-15 10:31:05] [INFO] Stage 3/7: Compilation
[2024-01-15 10:31:05] [INFO] Compiling source code...
[2024-01-15 10:31:45] [SUCCESS] Compilation completed (40 seconds)
[2024-01-15 10:31:45] [INFO] Stage 4/7: Packaging
[2024-01-15 10:31:45] [INFO] Packaging APK...
[2024-01-15 10:31:55] [SUCCESS] APK packaged (10 seconds)
[2024-01-15 10:31:55] [INFO] Stage 5/7: Signing
[2024-01-15 10:31:55] [INFO] Signing APK with debug keystore...
[2024-01-15 10:32:00] [SUCCESS] APK signed (5 seconds)
[2024-01-15 10:32:00] [INFO] Stage 6/7: Verification
[2024-01-15 10:32:00] [INFO] Verifying APK...
[2024-01-15 10:32:05] [SUCCESS] APK verification passed (5 seconds)
[2024-01-15 10:32:05] [INFO] Stage 7/7: Artifact Collection
[2024-01-15 10:32:05] [INFO] Collecting build artifacts...
[2024-01-15 10:32:06] [SUCCESS] Artifacts collected
[2024-01-15 10:32:06] [SUCCESS] Build completed successfully
[2024-01-15 10:32:06] [INFO] Total duration: 81 seconds
[2024-01-15 10:32:06] [INFO] APK location: build-artifacts/debug/2024-01-15_10-30-45/app-debug.apk
[2024-01-15 10:32:06] [INFO] APK size: 45.2 MB
```

## Data Models

### Build Configuration Data Model
```typescript
interface AndroidBuildConfig {
  // Build identification
  buildId: string;
  profile: string;
  variant: 'debug' | 'release' | 'aab';
  
  // Build parameters
  buildType: 'debug' | 'release';
  minifyEnabled: boolean;
  shrinkResources: boolean;
  debuggable: boolean;
  
  // Version information
  versionCode: number;
  versionName: string;
  
  // Signing configuration
  signingConfig: {
    keystorePath: string;
    keystorePassword: string;
    keyAlias: string;
    keyPassword: string;
  };
  
  // Output configuration
  outputDirectory: string;
  artifactName: string;
  
  // Build options
  clean: boolean;
  parallel: boolean;
  cacheEnabled: boolean;
  
  // Environment
  environmentVariables: Record<string, string>;
  gradleProperties: Record<string, string>;
}

interface BuildCache {
  enabled: boolean;
  directory: string;
  maxSize: number; // MB
  retentionDays: number;
  lastCleared: Date;
  currentSize: number; // MB
}

interface BuildPerformanceMetrics {
  buildId: string;
  totalDuration: number;
  stages: {
    [stageName: string]: {
      duration: number;
      startTime: Date;
      endTime: Date;
      cached: boolean;
    };
  };
  cacheHitRate: number; // percentage
  parallelizationFactor: number;
  averageBuildTime: number; // historical average
  buildTimeRegression: number; // percentage change from average
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Before writing the correctness properties, I need to analyze the acceptance criteria for testability using the prework tool.


### Property 1: Debug Build Configuration Applied

*For any* debug build invocation with valid configuration, the resulting APK must have debug configuration enabled, include debug symbols, and not have code obfuscation applied.

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Debug Build Artifact Reporting

*For any* successful debug build, the build system must report the APK file path and size in the build output.

**Validates: Requirements 1.4**

### Property 3: Debug Build Performance

*For any* incremental debug build where source code has not changed, the build must complete within 120 seconds.

**Validates: Requirements 1.5, 1.6**

### Property 4: Release Build Configuration Applied

*For any* release build invocation with valid configuration, the resulting APK must have release configuration enabled, include code obfuscation using R8/ProGuard, and be optimized for size and performance.

**Validates: Requirements 2.1, 2.2, 2.6**

### Property 5: Release Build Signing

*For any* release build, the resulting APK must be signed with the production keystore and the signature must be verifiable using standard Android tools (jarsigner, apksigner).

**Validates: Requirements 2.3, 2.4, 4.6**

### Property 6: Release Build Performance

*For any* full release build, the build must complete within 180 seconds.

**Validates: Requirements 2.5**

### Property 7: AAB Generation

*For any* AAB build invocation with valid configuration, the build system must generate an Android App Bundle file that contains all app resources and code in a format optimized for Google Play.

**Validates: Requirements 3.1, 3.2**

### Property 8: AAB Signing and Verification

*For any* AAB build, the resulting bundle must be signed with the production keystore, the signature must be verifiable, and the bundle structure must conform to Android standards.

**Validates: Requirements 3.3, 3.4, 3.6**

### Property 9: AAB Build Performance

*For any* AAB build, the build must complete within 180 seconds.

**Validates: Requirements 3.5**

### Property 10: Secure Credential Loading

*For any* build execution, signing credentials must be loaded from the keystore without appearing in build logs or output.

**Validates: Requirements 4.1, 11.6**

### Property 11: Debug Build Automatic Signing

*For any* debug build, the build system must automatically use debug signing credentials without requiring manual configuration.

**Validates: Requirements 4.2**

### Property 12: Release Build Automatic Signing

*For any* release build or AAB build, the build system must automatically use production keystore credentials without requiring manual configuration.

**Validates: Requirements 4.3**

### Property 13: Keystore Validation Before Build

*For any* build invocation, the build system must verify that the keystore file exists and is accessible before attempting to build, and must report a clear error with remediation steps if the keystore is missing or inaccessible.

**Validates: Requirements 4.4, 4.5**

### Property 14: Artifact Storage Organization

*For any* successful build, all build artifacts must be stored in a designated output directory with clear naming conventions organized by build variant and timestamp.

**Validates: Requirements 5.1, 5.6**

### Property 15: Build Manifest Generation

*For any* successful build, the build system must create a build manifest file containing artifact name, size, build timestamp, build variant, and signing information.

**Validates: Requirements 5.2, 5.3**

### Property 16: Build History Maintenance

*For any* build execution, the build system must maintain a history of recent builds that is accessible for easy reference.

**Validates: Requirements 5.4**

### Property 17: Artifact Information Availability

*For any* build artifact, the build system must provide file path, size, and checksum when requested.

**Validates: Requirements 5.5**

### Property 18: Build Artifact Verification

*For any* completed build, the build system must verify the APK/AAB structure and integrity, verify proper signing with the correct certificate, validate the manifest, and check that all required resources and code are present.

**Validates: Requirements 6.1, 6.2, 6.3, 6.5, 6.6**

### Property 19: Verification Error Reporting

*For any* failed verification, the build system must report specific validation errors with remediation steps.

**Validates: Requirements 6.4**

### Property 20: Build Progress Reporting

*For any* in-progress build, the build system must report the current build stage, percentage completion or estimated time remaining, and provide a build summary upon completion including total duration and artifact details.

**Validates: Requirements 7.1, 7.2, 7.4**

### Property 21: Build Stage Logging

*For any* build execution, the build system must log the stage name and duration when each build stage completes.

**Validates: Requirements 7.3**

### Property 22: Build Failure Reporting

*For any* failed build, the build system must report the failure stage and error details.

**Validates: Requirements 7.5**

### Property 23: Build Status Accessibility

*For any* build execution, build status information must be accessible via CLI output and optionally via a status file.

**Validates: Requirements 7.6**

### Property 24: Build Cache Usage

*For any* incremental build where source code has not changed, the build system must use cached build outputs to skip compilation.

**Validates: Requirements 8.1**

### Property 25: Incremental Resource Compilation

*For any* incremental build where only resources have changed, the build system must recompile only resources without recompiling code.

**Validates: Requirements 8.2**

### Property 26: Incremental Code Compilation

*For any* incremental build where only code has changed, the build system must recompile code without reprocessing resources.

**Validates: Requirements 8.3**

### Property 27: Build Cache Invalidation

*For any* build where the build configuration has changed, the build cache must be invalidated and a full rebuild must be performed.

**Validates: Requirements 8.4**

### Property 28: Build Cache Statistics

*For any* build execution, the build system must provide cache statistics showing what was cached and what was rebuilt.

**Validates: Requirements 8.5**

### Property 29: Clean Build Execution

*For any* clean build request, the build system must clear the cache and perform a full rebuild.

**Validates: Requirements 8.6**

### Property 30: Build Profile Support

*For any* build profile selection, the build system must support named profiles (development, staging, production) and apply the corresponding build configuration.

**Validates: Requirements 9.1, 9.2**

### Property 31: Build Profile Configuration

*For any* build profile, the profile must define specific build parameters including API endpoints, feature flags, and signing configuration.

**Validates: Requirements 9.3**

### Property 32: Build Profile Definition

*For any* build profile, the profile must be defined in a configuration file and be easily modifiable.

**Validates: Requirements 9.4**

### Property 33: Build Profile Validation

*For any* profile selection, the build system must validate that all required configuration is present before proceeding with the build.

**Validates: Requirements 9.5**

### Property 34: Build Profile Listing

*For any* build profile query, the build system must provide a list of available profiles and their descriptions.

**Validates: Requirements 9.6**

### Property 35: Build Error Message Quality

*For any* build failure, the build system must capture the error and provide a clear, actionable error message including the failure stage, error code, and specific details about what failed.

**Validates: Requirements 10.1, 10.2**

### Property 36: Build Error Remediation Suggestions

*For any* build error, the build system must suggest remediation steps based on the error type.

**Validates: Requirements 10.3**

### Property 37: Dependency Error Handling

*For any* build failure due to missing dependencies, the build system must suggest running dependency resolution.

**Validates: Requirements 10.4**

### Property 38: Compilation Error Reporting

*For any* build failure due to compilation errors, the build system must report file paths and line numbers.

**Validates: Requirements 10.5**

### Property 39: Error Documentation Links

*For any* build error, the build system must provide links to documentation for common error scenarios.

**Validates: Requirements 10.6**

### Property 40: Build Log Generation

*For any* build execution, the build system must generate detailed logs including timestamps, build stage information, and diagnostic details.

**Validates: Requirements 11.1, 11.2**

### Property 41: Build Log Storage

*For any* build execution, build logs must be stored in a designated logs directory with clear naming conventions.

**Validates: Requirements 11.3**

### Property 42: Build Failure Logging

*For any* failed build, the build system must include full error stack traces in the logs.

**Validates: Requirements 11.4**

### Property 43: Build Log Summary

*For any* build execution, the build system must provide a log summary showing key events and timings.

**Validates: Requirements 11.5**

### Property 44: Artifact Cleanup Command

*For any* cleanup request, the build system must provide a cleanup command to remove old build artifacts older than a configurable retention period.

**Validates: Requirements 12.1, 12.2**

### Property 45: Recent Build Preservation

*For any* cleanup execution, the build system must preserve the most recent builds for each variant.

**Validates: Requirements 12.3**

### Property 46: Cleanup Reporting

*For any* cleanup execution, the build system must report how much disk space was freed.

**Validates: Requirements 12.4**

### Property 47: Cleanup Dry-Run

*For any* cleanup operation, the build system must provide a dry-run option to preview what would be deleted.

**Validates: Requirements 12.5**

### Property 48: In-Use Artifact Protection

*For any* cleanup execution, the build system must not delete artifacts that are currently in use or referenced.

**Validates: Requirements 12.6**

### Property 49: Build Reproducibility

*For any* identical source code and configuration, building twice must produce APKs with identical content.

**Validates: Requirements 13.1, 13.2**

### Property 50: Reproducibility Documentation

*For any* build system, all build parameters that affect reproducibility must be documented.

**Validates: Requirements 13.3**

### Property 51: Reproducibility Verification

*For any* reproduced build, the build system must verify that the output matches the original build.

**Validates: Requirements 13.4, 13.5**

### Property 52: Reproducibility Metadata

*For any* build artifact, the artifact must include metadata that enables reproducibility verification.

**Validates: Requirements 13.6**

### Property 53: Build Stage Timing Measurement

*For any* build execution, the build system must measure and report the duration of each build stage.

**Validates: Requirements 14.1**

### Property 54: Build Performance Report

*For any* completed build, the build system must provide a performance report showing stage timings.

**Validates: Requirements 14.2**

### Property 55: Slow Stage Identification

*For any* build execution, the build system must identify stages that take longer than expected and flag them for optimization.

**Validates: Requirements 14.3**

### Property 56: Build Performance Tracking

*For any* build system, build performance must be tracked over time to identify regressions.

**Validates: Requirements 14.4**

### Property 57: Performance Regression Detection

*For any* build that is slower than previous builds, the build system must alert the developer.

**Validates: Requirements 14.5**

### Property 58: Performance Recommendations

*For any* build execution, the build system must provide recommendations for improving build performance.

**Validates: Requirements 14.6**

### Property 59: Dependency Resolution

*For any* build invocation, the build system must resolve all Gradle dependencies.

**Validates: Requirements 15.1**

### Property 60: Dependency Conflict Detection

*For any* build with dependency conflicts, the build system must detect and report the conflicts.

**Validates: Requirements 15.2**

### Property 61: Dependency Conflict Resolution

*For any* detected dependency conflict, the build system must suggest resolution strategies.

**Validates: Requirements 15.3**

### Property 62: Dependency Caching

*For any* build execution, the build system must cache downloaded dependencies to speed up subsequent builds.

**Validates: Requirements 15.4**

### Property 63: Dependency Update Notification

*For any* available dependency update, the build system must report it to the developer.

**Validates: Requirements 15.5**

### Property 64: Dependency Compatibility Validation

*For any* build, the build system must validate that all dependencies are compatible with the target Android API level.

**Validates: Requirements 15.6**

### Property 65: Build Variant Support

*For any* build variant specification, the build system must support multiple build variants (debug, release, and custom variants) and apply the corresponding build configuration.

**Validates: Requirements 16.1, 16.2**

### Property 66: Build Variant Configuration

*For any* build variant, the variant must have its own signing configuration and build parameters.

**Validates: Requirements 16.3**

### Property 67: Custom Variant Definition

*For any* custom variant definition, the build system must allow defining custom variants with specific features and configurations.

**Validates: Requirements 16.4**

### Property 68: Variant Artifact Naming

*For any* build variant, the build system must generate appropriately named artifacts.

**Validates: Requirements 16.5**

### Property 69: Variant Resource Validation

*For any* build variant, the build system must validate that all required resources and code are available for the selected variant.

**Validates: Requirements 16.6**

### Property 70: Resource Shrinking

*For any* release build, the build system must apply resource shrinking to remove unused resources.

**Validates: Requirements 17.1**

### Property 71: Code Shrinking

*For any* release build, the build system must apply code shrinking using R8 to remove unused code.

**Validates: Requirements 17.2**

### Property 72: Code Minification

*For any* release build, the build system must apply minification to obfuscate code.

**Validates: Requirements 17.3**

### Property 73: Optimization Size Reporting

*For any* release build with optimization applied, the build system must report the size reduction achieved.

**Validates: Requirements 17.4**

### Property 74: Optimization Configuration

*For any* build system, configuration options must be available to control optimization levels.

**Validates: Requirements 17.5**

### Property 75: Optimization Functionality Verification

*For any* optimized build, the build system must verify that optimization does not break app functionality.

**Validates: Requirements 17.6**

### Property 76: Manifest Validation

*For any* build invocation, the build system must validate the AndroidManifest.xml file.

**Validates: Requirements 18.1**

### Property 77: Component Declaration Verification

*For any* build, the build system must verify that all declared components are defined in the codebase.

**Validates: Requirements 18.2**

### Property 78: Required Permissions Verification

*For any* build, the build system must verify that all required permissions are declared.

**Validates: Requirements 18.3**

### Property 79: Manifest Error Reporting

*For any* manifest validation failure, the build system must report specific errors with line numbers.

**Validates: Requirements 18.4**

### Property 80: Common Manifest Mistake Detection

*For any* build, the build system must check for common manifest configuration mistakes.

**Validates: Requirements 18.5**

### Property 81: Manifest Error Suggestions

*For any* manifest validation failure, the build system must provide suggestions for fixing the errors.

**Validates: Requirements 18.6**

### Property 82: Certificate Validity Validation

*For any* release build, the build system must validate that the signing certificate is valid and not expired before building.

**Validates: Requirements 19.1**

### Property 83: Certificate Matching Verification

*For any* release build, the build system must verify that the certificate matches the expected certificate for the build variant.

**Validates: Requirements 19.2**

### Property 84: Certificate Expiration Warning

*For any* certificate about to expire, the build system must warn the developer.

**Validates: Requirements 19.3**

### Property 85: Invalid Certificate Prevention

*For any* invalid or expired certificate, the build system must prevent the build from completing.

**Validates: Requirements 19.4**

### Property 86: Certificate Renewal Instructions

*For any* certificate issue, the build system must provide instructions for renewing or updating certificates.

**Validates: Requirements 19.5**

### Property 87: Certificate Storage Verification

*For any* build, the build system must verify that the certificate is properly stored in the keystore.

**Validates: Requirements 19.6**

### Property 88: Build Output Existence Verification

*For any* completed build, the build system must verify that the APK/AAB file exists and is not empty.

**Validates: Requirements 20.1**

### Property 89: Build Output Content Verification

*For any* completed build, the build system must verify that the APK/AAB contains the expected resources and code.

**Validates: Requirements 20.2**

### Property 90: Build Output Signature Verification

*For any* completed build, the build system must verify that the APK/AAB is properly signed and the signature is valid.

**Validates: Requirements 20.3**

### Property 91: Build Output Manifest Verification

*For any* completed build, the build system must verify that the APK/AAB manifest is correct and complete.

**Validates: Requirements 20.4**

### Property 92: Verification Error Reporting

*For any* failed verification, the build system must report specific verification errors.

**Validates: Requirements 20.5**

### Property 93: Verification Report Generation

*For any* build verification, the build system must provide a verification report showing all checks performed and their results.

**Validates: Requirements 20.6**

## Error Handling

### Build Failure Scenarios

1. **Environment Validation Failures**
   - Detection: Android SDK not found, Gradle not available, Keystore missing
   - Response: Report specific missing component and path
   - Recovery: Provide installation instructions and documentation links

2. **Configuration Errors**
   - Detection: Invalid build.gradle, missing capacitor.config.ts, malformed build profile
   - Response: Report file path and specific configuration error
   - Recovery: Provide corrected configuration example

3. **Signing Errors**
   - Detection: Keystore password incorrect, key alias not found, certificate expired
   - Response: Report which credential is invalid
   - Recovery: Provide instructions to verify or regenerate credentials

4. **Compilation Errors**
   - Detection: Source code compilation failure, resource processing error
   - Response: Report file path, line number, and error message
   - Recovery: Provide suggestions based on error type

5. **Dependency Errors**
   - Detection: Unresolved dependencies, version conflicts, incompatible versions
   - Response: Report conflicting dependencies and versions
   - Recovery: Suggest compatible version combinations

6. **Verification Errors**
   - Detection: APK/AAB structure invalid, manifest errors, missing resources
   - Response: Report specific verification failure
   - Recovery: Provide remediation steps

### Error Message Format

All error messages must include:
- Clear description of what failed
- Current state vs. expected state
- Step-by-step remediation instructions
- Link to relevant documentation
- Error code for reference

### Build Artifact Validation

All build artifacts must be validated:
- APK/AAB: Verify signature, manifest, and structure
- Artifacts must be scannable for integrity issues
- Verification must complete before artifact is considered ready

## Testing Strategy

### Unit Testing Approach

Unit tests validate specific examples and edge cases:

1. **Build Configuration Tests**
   - Parse valid build profiles
   - Parse valid build configurations
   - Handle malformed configurations gracefully
   - Validate profile selection

2. **Signing Configuration Tests**
   - Verify keystore file accessibility
   - Verify keystore password validation
   - Verify key alias extraction
   - Handle missing keystores with clear errors

3. **Artifact Management Tests**
   - Verify artifact storage organization
   - Verify manifest generation
   - Verify artifact metadata collection
   - Test artifact cleanup logic

4. **Build Verification Tests**
   - Verify APK/AAB structure validation
   - Verify signature validation
   - Verify manifest validation
   - Test verification error reporting

5. **Build Progress Tests**
   - Test stage tracking
   - Test progress calculation
   - Test timing measurement
   - Test log generation

6. **Error Handling Tests**
   - Test error message generation
   - Test remediation suggestion logic
   - Test error code assignment
   - Test documentation link generation

### Property-Based Testing Approach

Property-based tests validate universal properties across generated inputs:

1. **Build Configuration Properties**
   - For any valid build profile, parsing must succeed
   - For any valid build configuration, it must be serializable and deserializable
   - For any build variant, configuration must be applicable

2. **Build Execution Properties**
   - For any valid configuration, build must complete or fail with clear error
   - For any build failure, error message must be actionable
   - For any successful build, artifacts must be valid and signed

3. **Artifact Management Properties**
   - For any build artifact, it must be stored with clear naming
   - For any artifact, metadata must be complete and accurate
   - For any artifact, it must be retrievable by variant and timestamp

4. **Build Verification Properties**
   - For any APK/AAB, structure must be valid
   - For any signed artifact, signature must be verifiable
   - For any manifest, it must be well-formed and complete

5. **Build Performance Properties**
   - For any incremental build, it must be faster than full build
   - For any build stage, timing must be measurable and reportable
   - For any build, performance must be trackable over time

6. **Signing Properties**
   - For any debug build, it must use debug signing credentials
   - For any release build, it must use production signing credentials
   - For any signed artifact, signature must be verifiable with standard tools

7. **Caching Properties**
   - For any unchanged source code, build cache must be used
   - For any configuration change, cache must be invalidated
   - For any cache hit, build must be faster than cache miss

8. **Error Handling Properties**
   - For any build error, error message must include stage and details
   - For any error, remediation steps must be provided
   - For any error, documentation link must be available

### Property Test Configuration

- **Minimum iterations**: 100 per property test
- **Test framework**: Jest with fast-check for JavaScript/TypeScript
- **Tag format**: `Feature: android-apk-build, Property {number}: {property_text}`
- **Coverage target**: All 93 correctness properties must have corresponding property-based tests

### Integration Testing

Integration tests verify end-to-end workflows:

1. **Debug Build Workflow**
   - Validate environment
   - Execute debug build
   - Verify artifacts
   - Check build logs

2. **Release Build Workflow**
   - Validate environment
   - Verify signing certificate
   - Execute release build
   - Verify artifacts and signatures

3. **AAB Build Workflow**
   - Validate environment
   - Verify signing certificate
   - Execute AAB build
   - Verify bundle structure

4. **Build Profile Workflow**
   - Select profile
   - Validate profile configuration
   - Execute build with profile
   - Verify profile was applied

5. **Incremental Build Workflow**
   - Execute full build
   - Modify source code
   - Execute incremental build
   - Verify cache was used

6. **Error Recovery Workflow**
   - Simulate build error
   - Verify error message
   - Apply remediation
   - Retry build

### Test Execution Strategy

```bash
# Unit tests
npm run test:unit

# Property-based tests
npm run test:properties

# Integration tests
npm run test:integration

# Full build validation
npm run build:android:debug
npm run build:android:release
npm run build:android:aab
```

### Continuous Validation

- Build validation runs on every commit
- Build validation runs before each build
- Build validation results are reported to developer
- Failed validations block builds with clear remediation steps

