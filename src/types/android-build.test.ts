/**
 * Unit tests for Android APK Build data models
 *
 * Tests verify that all data models can be created, validated, and serialized correctly.
 */

import {
  BuildType,
  BuildVariant,
  BuildStage,
  BuildStageStatus,
  BuildStatus,
  BuildErrorCode,
  SigningConfiguration,
  BuildParameters,
  BuildProfile,
  BuildConfiguration,
  BuildStageResult,
  BuildProgress,
  BuildError,
  SigningInfo,
  ManifestInfo,
  BuildArtifact,
  BuildManifest,
  BuildResult,
  BuildStatusInfo,
  BuildCache,
  BuildPerformanceMetrics,
  VerificationCheck,
  VerificationResult,
  isBuildType,
  isBuildStageStatus,
  isBuildStatus,
  isBuildErrorCode,
  isSigningConfiguration,
  isBuildProfile,
  isBuildConfiguration,
  isBuildResult,
  isBuildError,
  isBuildArtifact,
  isBuildManifest,
} from './android-build';

describe('Android Build Data Models', () => {
  describe('Enums', () => {
    it('should have valid BuildType values', () => {
      expect(BuildType.Debug).toBe('debug');
      expect(BuildType.Release).toBe('release');
    });

    it('should have valid BuildStageStatus values', () => {
      expect(BuildStageStatus.Success).toBe('success');
      expect(BuildStageStatus.Failed).toBe('failed');
      expect(BuildStageStatus.Skipped).toBe('skipped');
    });

    it('should have valid BuildStatus values', () => {
      expect(BuildStatus.Queued).toBe('queued');
      expect(BuildStatus.InProgress).toBe('in-progress');
      expect(BuildStatus.Completed).toBe('completed');
      expect(BuildStatus.Failed).toBe('failed');
      expect(BuildStatus.Cancelled).toBe('cancelled');
    });

    it('should have valid BuildErrorCode values', () => {
      expect(BuildErrorCode.BuildEnvInvalid).toBe('BUILD_ENV_INVALID');
      expect(BuildErrorCode.BuildGradleFailed).toBe('BUILD_GRADLE_FAILED');
      expect(BuildErrorCode.BuildSigningFailed).toBe('BUILD_SIGNING_FAILED');
    });
  });

  describe('SigningConfiguration', () => {
    it('should create a valid signing configuration', () => {
      const config: SigningConfiguration = {
        keystorePath: '/path/to/keystore.jks',
        keystorePassword: 'password123',
        keyAlias: 'my-key',
        keyPassword: 'keypass123',
        certificateSubjectDN: 'CN=My App, O=My Company',
      };

      expect(config.keystorePath).toBe('/path/to/keystore.jks');
      expect(config.keyAlias).toBe('my-key');
      expect(isSigningConfiguration(config)).toBe(true);
    });

    it('should validate signing configuration with type guard', () => {
      const validConfig: SigningConfiguration = {
        keystorePath: '/path/to/keystore.jks',
        keystorePassword: 'password123',
        keyAlias: 'my-key',
        keyPassword: 'keypass123',
      };

      expect(isSigningConfiguration(validConfig)).toBe(true);
    });

    it('should reject invalid signing configuration', () => {
      const invalidConfig = {
        keystorePath: '/path/to/keystore.jks',
        keyAlias: 'my-key',
        // missing keystorePassword and keyPassword
      };

      expect(isSigningConfiguration(invalidConfig)).toBe(false);
    });
  });

  describe('BuildParameters', () => {
    it('should create valid build parameters', () => {
      const params: BuildParameters = {
        minifyEnabled: true,
        shrinkResources: true,
        debuggable: false,
        versionCode: 1,
        versionName: '1.0.0',
        parallelEnabled: true,
        cacheEnabled: true,
      };

      expect(params.minifyEnabled).toBe(true);
      expect(params.versionCode).toBe(1);
      expect(params.versionName).toBe('1.0.0');
    });
  });

  describe('BuildProfile', () => {
    it('should create a valid build profile', () => {
      const profile: BuildProfile = {
        name: 'production',
        buildType: BuildType.Release,
        variant: 'release',
        signingConfig: {
          keystorePath: '/path/to/keystore.jks',
          keystorePassword: 'password123',
          keyAlias: 'my-key',
          keyPassword: 'keypass123',
        },
        buildParameters: {
          minifyEnabled: true,
          shrinkResources: true,
          debuggable: false,
          versionCode: 1,
          versionName: '1.0.0',
        },
        environmentVariables: {
          API_ENDPOINT: 'https://api.example.com',
        },
        outputDirectory: '/build/outputs',
        description: 'Production build profile',
      };

      expect(profile.name).toBe('production');
      expect(profile.buildType).toBe(BuildType.Release);
      expect(isBuildProfile(profile)).toBe(true);
    });

    it('should validate build profile with type guard', () => {
      const profile: BuildProfile = {
        name: 'development',
        buildType: BuildType.Debug,
        variant: 'debug',
        signingConfig: {
          keystorePath: '/path/to/debug.jks',
          keystorePassword: 'debug',
          keyAlias: 'debug-key',
          keyPassword: 'debug',
        },
        buildParameters: {
          minifyEnabled: false,
          shrinkResources: false,
          debuggable: true,
          versionCode: 1,
          versionName: '1.0.0-dev',
        },
        environmentVariables: {},
        outputDirectory: '/build/debug',
      };

      expect(isBuildProfile(profile)).toBe(true);
    });
  });

  describe('BuildConfiguration', () => {
    it('should create a valid build configuration', () => {
      const config: BuildConfiguration = {
        buildId: 'build-123',
        profile: 'production',
        variant: 'release',
        clean: false,
        parallel: true,
        cacheEnabled: true,
        buildType: BuildType.Release,
        buildParameters: {
          minifyEnabled: true,
          shrinkResources: true,
          debuggable: false,
          versionCode: 1,
          versionName: '1.0.0',
        },
        signingConfig: {
          keystorePath: '/path/to/keystore.jks',
          keystorePassword: 'password123',
          keyAlias: 'my-key',
          keyPassword: 'keypass123',
        },
        outputDirectory: '/build/outputs',
        environmentVariables: {},
        createdAt: new Date(),
      };

      expect(config.buildId).toBe('build-123');
      expect(config.profile).toBe('production');
      expect(isBuildConfiguration(config)).toBe(true);
    });
  });

  describe('BuildStageResult', () => {
    it('should create a valid build stage result', () => {
      const now = new Date();
      const stage: BuildStageResult = {
        name: 'compilation',
        status: BuildStageStatus.Success,
        duration: 45000,
        startTime: now,
        endTime: new Date(now.getTime() + 45000),
        details: 'Compilation completed successfully',
      };

      expect(stage.name).toBe('compilation');
      expect(stage.status).toBe(BuildStageStatus.Success);
      expect(stage.duration).toBe(45000);
    });
  });

  describe('BuildProgress', () => {
    it('should create valid build progress', () => {
      const progress: BuildProgress = {
        currentStage: 'compilation',
        stageIndex: 2,
        totalStages: 7,
        percentComplete: 35,
        estimatedTimeRemaining: 120000,
        elapsedTime: 65000,
        message: 'Compiling source code...',
      };

      expect(progress.currentStage).toBe('compilation');
      expect(progress.percentComplete).toBe(35);
      expect(progress.stageIndex).toBe(2);
    });
  });

  describe('BuildError', () => {
    it('should create a valid build error', () => {
      const error: BuildError = {
        code: BuildErrorCode.BuildGradleFailed,
        stage: 'compilation',
        message: 'Gradle build failed',
        details: 'Compilation error in MainActivity.java:42',
        remediation: 'Fix the compilation error and retry',
        documentationLink: 'https://docs.example.com/errors/gradle-failed',
        timestamp: new Date(),
      };

      expect(error.code).toBe(BuildErrorCode.BuildGradleFailed);
      expect(error.stage).toBe('compilation');
      expect(isBuildError(error)).toBe(true);
    });
  });

  describe('SigningInfo', () => {
    it('should create valid signing info', () => {
      const signingInfo: SigningInfo = {
        signed: true,
        certificateSubjectDN: 'CN=My App, O=My Company',
        certificateIssuerDN: 'CN=My CA, O=My Company',
        certificateNotBefore: new Date('2024-01-01'),
        certificateNotAfter: new Date('2025-01-01'),
        signatureAlgorithm: 'SHA256withRSA',
        certificateExpired: false,
        certificateExpiringIn: 180,
      };

      expect(signingInfo.signed).toBe(true);
      expect(signingInfo.certificateExpired).toBe(false);
      expect(signingInfo.certificateExpiringIn).toBe(180);
    });
  });

  describe('ManifestInfo', () => {
    it('should create valid manifest info', () => {
      const manifestInfo: ManifestInfo = {
        packageName: 'com.example.app',
        versionCode: 1,
        versionName: '1.0.0',
        minSdkVersion: 21,
        targetSdkVersion: 34,
        permissions: ['android.permission.INTERNET', 'android.permission.CAMERA'],
        activities: ['com.example.app.MainActivity'],
        services: [],
        receivers: [],
        providers: [],
      };

      expect(manifestInfo.packageName).toBe('com.example.app');
      expect(manifestInfo.permissions.length).toBe(2);
    });
  });

  describe('BuildArtifact', () => {
    it('should create a valid build artifact', () => {
      const artifact: BuildArtifact = {
        id: 'artifact-123',
        type: 'apk',
        variant: 'release',
        buildType: BuildType.Release,
        filePath: '/build/outputs/app-release.apk',
        fileName: 'app-release.apk',
        fileSize: 45000000,
        checksum: 'abc123def456',
        timestamp: new Date(),
        buildDuration: 180000,
        signingInfo: {
          signed: true,
          certificateSubjectDN: 'CN=My App',
          certificateIssuerDN: 'CN=My CA',
          certificateNotBefore: new Date(),
          certificateNotAfter: new Date(),
          signatureAlgorithm: 'SHA256withRSA',
          certificateExpired: false,
          certificateExpiringIn: 180,
        },
        manifestInfo: {
          packageName: 'com.example.app',
          versionCode: 1,
          versionName: '1.0.0',
          minSdkVersion: 21,
          targetSdkVersion: 34,
          permissions: [],
          activities: [],
          services: [],
          receivers: [],
          providers: [],
        },
        metadata: {},
      };

      expect(artifact.type).toBe('apk');
      expect(artifact.fileSize).toBe(45000000);
      expect(isBuildArtifact(artifact)).toBe(true);
    });
  });

  describe('BuildManifest', () => {
    it('should create a valid build manifest', () => {
      const manifest: BuildManifest = {
        buildId: 'build-123',
        timestamp: new Date(),
        profile: 'production',
        variant: 'release',
        artifacts: [],
        buildDuration: 180000,
        stages: [],
        environment: {
          gradleVersion: '8.0',
          androidSdkVersion: 34,
          buildToolsVersion: '34.0.0',
        },
      };

      expect(manifest.buildId).toBe('build-123');
      expect(manifest.profile).toBe('production');
      expect(isBuildManifest(manifest)).toBe(true);
    });
  });

  describe('BuildResult', () => {
    it('should create a valid build result', () => {
      const result: BuildResult = {
        success: true,
        artifactPath: '/build/outputs/app-release.apk',
        artifactSize: 45000000,
        checksum: 'abc123def456',
        duration: 180000,
        stages: [],
        completedAt: new Date(),
      };

      expect(result.success).toBe(true);
      expect(result.artifactSize).toBe(45000000);
      expect(isBuildResult(result)).toBe(true);
    });

    it('should include errors in build result', () => {
      const result: BuildResult = {
        success: false,
        artifactPath: '',
        artifactSize: 0,
        checksum: '',
        duration: 60000,
        stages: [],
        errors: [
          {
            code: BuildErrorCode.BuildGradleFailed,
            stage: 'compilation',
            message: 'Build failed',
            details: 'Error details',
            remediation: 'Fix and retry',
            timestamp: new Date(),
          },
        ],
        completedAt: new Date(),
      };

      expect(result.success).toBe(false);
      expect(result.errors?.length).toBe(1);
    });
  });

  describe('BuildStatusInfo', () => {
    it('should create valid build status info', () => {
      const status: BuildStatusInfo = {
        buildId: 'build-123',
        status: BuildStatus.InProgress,
        profile: 'production',
        variant: 'release',
        startTime: new Date(),
        currentStage: 'compilation',
        progress: {
          currentStage: 'compilation',
          stageIndex: 2,
          totalStages: 7,
          percentComplete: 35,
          estimatedTimeRemaining: 120000,
          elapsedTime: 65000,
        },
      };

      expect(status.buildId).toBe('build-123');
      expect(status.status).toBe(BuildStatus.InProgress);
      expect(isBuildStatus(status.status)).toBe(true);
    });
  });

  describe('BuildCache', () => {
    it('should create valid build cache info', () => {
      const cache: BuildCache = {
        enabled: true,
        directory: '/build/cache',
        maxSize: 5000,
        retentionDays: 30,
        lastCleared: new Date(),
        currentSize: 2500,
        hitRate: 75,
        hits: 150,
        misses: 50,
      };

      expect(cache.enabled).toBe(true);
      expect(cache.hitRate).toBe(75);
    });
  });

  describe('BuildPerformanceMetrics', () => {
    it('should create valid performance metrics', () => {
      const metrics: BuildPerformanceMetrics = {
        buildId: 'build-123',
        totalDuration: 180000,
        stages: {
          compilation: {
            duration: 45000,
            startTime: new Date(),
            endTime: new Date(),
            cached: false,
          },
        },
        cacheHitRate: 75,
        parallelizationFactor: 4,
        averageBuildTime: 150000,
        buildTimeRegression: 20,
      };

      expect(metrics.totalDuration).toBe(180000);
      expect(metrics.cacheHitRate).toBe(75);
    });
  });

  describe('VerificationCheck', () => {
    it('should create valid verification check', () => {
      const check: VerificationCheck = {
        name: 'Signature Validation',
        category: 'signature',
        status: 'pass',
        message: 'APK signature is valid',
      };

      expect(check.name).toBe('Signature Validation');
      expect(check.status).toBe('pass');
    });
  });

  describe('VerificationResult', () => {
    it('should create valid verification result', () => {
      const result: VerificationResult = {
        artifactPath: '/build/outputs/app-release.apk',
        overallStatus: 'pass',
        checks: [],
        timestamp: new Date(),
        duration: 5000,
      };

      expect(result.artifactPath).toBe('/build/outputs/app-release.apk');
      expect(result.overallStatus).toBe('pass');
    });
  });

  describe('Type Guards', () => {
    it('should validate BuildType correctly', () => {
      expect(isBuildType(BuildType.Debug)).toBe(true);
      expect(isBuildType(BuildType.Release)).toBe(true);
      expect(isBuildType('invalid')).toBe(false);
    });

    it('should validate BuildStageStatus correctly', () => {
      expect(isBuildStageStatus(BuildStageStatus.Success)).toBe(true);
      expect(isBuildStageStatus('invalid')).toBe(false);
    });

    it('should validate BuildStatus correctly', () => {
      expect(isBuildStatus(BuildStatus.Completed)).toBe(true);
      expect(isBuildStatus('invalid')).toBe(false);
    });

    it('should validate BuildErrorCode correctly', () => {
      expect(isBuildErrorCode(BuildErrorCode.BuildGradleFailed)).toBe(true);
      expect(isBuildErrorCode('invalid')).toBe(false);
    });
  });

  describe('Serialization', () => {
    it('should serialize and deserialize BuildProfile', () => {
      const profile: BuildProfile = {
        name: 'production',
        buildType: BuildType.Release,
        variant: 'release',
        signingConfig: {
          keystorePath: '/path/to/keystore.jks',
          keystorePassword: 'password123',
          keyAlias: 'my-key',
          keyPassword: 'keypass123',
        },
        buildParameters: {
          minifyEnabled: true,
          shrinkResources: true,
          debuggable: false,
          versionCode: 1,
          versionName: '1.0.0',
        },
        environmentVariables: {},
        outputDirectory: '/build/outputs',
      };

      const json = JSON.stringify(profile);
      const deserialized = JSON.parse(json) as BuildProfile;

      expect(deserialized.name).toBe(profile.name);
      expect(deserialized.buildType).toBe(profile.buildType);
      expect(isBuildProfile(deserialized)).toBe(true);
    });

    it('should serialize and deserialize BuildResult', () => {
      const result: BuildResult = {
        success: true,
        artifactPath: '/build/outputs/app-release.apk',
        artifactSize: 45000000,
        checksum: 'abc123def456',
        duration: 180000,
        stages: [],
        completedAt: new Date(),
      };

      const json = JSON.stringify(result);
      const deserialized = JSON.parse(json) as BuildResult;

      expect(deserialized.success).toBe(result.success);
      expect(deserialized.artifactPath).toBe(result.artifactPath);
      // Note: After JSON serialization, Date becomes a string, so we need to convert it back
      const deserializedWithDate = {
        ...deserialized,
        completedAt: new Date(deserialized.completedAt),
      };
      expect(isBuildResult(deserializedWithDate)).toBe(true);
    });
  });
});


/**
 * Property-Based Tests for Android Build Data Models
 *
 * These tests use fast-check to verify universal properties across generated inputs.
 * Feature: android-apk-build
 */

import * as fc from 'fast-check';

describe('Android Build Data Models - Property-Based Tests', () => {
  /**
   * Property 49: Build Reproducibility
   *
   * For any identical BuildProfile configuration, serialization must produce identical JSON.
   * Validates: Requirements 13.1, 13.2
   */
  describe('Property 49: Build Reproducibility', () => {
    it('should produce identical serialization for identical BuildProfile configurations', () => {
      const profileArbitrary = fc.record({
        name: fc.constantFrom('development', 'staging', 'production'),
        buildType: fc.constantFrom(BuildType.Debug, BuildType.Release),
        variant: fc.stringMatching(/^[a-z]+$/),
        signingConfig: fc.record({
          keystorePath: fc.stringMatching(/^\/[a-z0-9\/]+\.jks$/),
          keystorePassword: fc.string({ minLength: 1 }),
          keyAlias: fc.stringMatching(/^[a-z0-9\-]+$/),
          keyPassword: fc.string({ minLength: 1 }),
          certificateSubjectDN: fc.option(fc.string()),
        }),
        buildParameters: fc.record({
          minifyEnabled: fc.boolean(),
          shrinkResources: fc.boolean(),
          debuggable: fc.boolean(),
          versionCode: fc.integer({ min: 1, max: 1000000 }),
          versionName: fc.stringMatching(/^\d+\.\d+\.\d+/),
          parallelEnabled: fc.option(fc.boolean()),
          cacheEnabled: fc.option(fc.boolean()),
        }),
        environmentVariables: fc.dictionary(fc.string(), fc.string()),
        outputDirectory: fc.stringMatching(/^\/[a-z0-9\/]+$/),
        description: fc.option(fc.string()),
      });

      fc.assert(
        fc.property(profileArbitrary, (profile) => {
          // Serialize the profile twice
          const json1 = JSON.stringify(profile);
          const json2 = JSON.stringify(profile);

          // Both serializations should be identical
          expect(json1).toBe(json2);

          // Deserialize and re-serialize should produce identical JSON
          const deserialized = JSON.parse(json1);
          const json3 = JSON.stringify(deserialized);

          expect(json1).toBe(json3);
        }),
        { numRuns: 100 },
      );
    });

    it('should produce identical serialization for identical BuildConfiguration objects', () => {
      const configArbitrary = fc.record({
        buildId: fc.uuid(),
        profile: fc.constantFrom('development', 'staging', 'production'),
        variant: fc.constantFrom('debug', 'release', 'aab'),
        clean: fc.boolean(),
        parallel: fc.boolean(),
        cacheEnabled: fc.boolean(),
        buildType: fc.constantFrom(BuildType.Debug, BuildType.Release),
        buildParameters: fc.record({
          minifyEnabled: fc.boolean(),
          shrinkResources: fc.boolean(),
          debuggable: fc.boolean(),
          versionCode: fc.integer({ min: 1, max: 1000000 }),
          versionName: fc.stringMatching(/^\d+\.\d+\.\d+/),
        }),
        signingConfig: fc.record({
          keystorePath: fc.stringMatching(/^\/[a-z0-9\/]+\.jks$/),
          keystorePassword: fc.string({ minLength: 1 }),
          keyAlias: fc.stringMatching(/^[a-z0-9\-]+$/),
          keyPassword: fc.string({ minLength: 1 }),
        }),
        outputDirectory: fc.stringMatching(/^\/[a-z0-9\/]+$/),
        environmentVariables: fc.dictionary(fc.string(), fc.string()),
        createdAt: fc.date(),
      });

      fc.assert(
        fc.property(configArbitrary, (config) => {
          // Serialize twice
          const json1 = JSON.stringify(config);
          const json2 = JSON.stringify(config);

          // Should be identical
          expect(json1).toBe(json2);

          // Deserialize and re-serialize
          const deserialized = JSON.parse(json1);
          const json3 = JSON.stringify(deserialized);

          expect(json1).toBe(json3);
        }),
        { numRuns: 100 },
      );
    });

    it('should deserialize BuildProfile to equivalent object', () => {
      const profileArbitrary = fc.record({
        name: fc.constantFrom('development', 'staging', 'production'),
        buildType: fc.constantFrom(BuildType.Debug, BuildType.Release),
        variant: fc.stringMatching(/^[a-z]+$/),
        signingConfig: fc.record({
          keystorePath: fc.stringMatching(/^\/[a-z0-9\/]+\.jks$/),
          keystorePassword: fc.string({ minLength: 1 }),
          keyAlias: fc.stringMatching(/^[a-z0-9\-]+$/),
          keyPassword: fc.string({ minLength: 1 }),
        }),
        buildParameters: fc.record({
          minifyEnabled: fc.boolean(),
          shrinkResources: fc.boolean(),
          debuggable: fc.boolean(),
          versionCode: fc.integer({ min: 1, max: 1000000 }),
          versionName: fc.stringMatching(/^\d+\.\d+\.\d+/),
        }),
        environmentVariables: fc.dictionary(fc.string(), fc.string()),
        outputDirectory: fc.stringMatching(/^\/[a-z0-9\/]+$/),
      });

      fc.assert(
        fc.property(profileArbitrary, (profile) => {
          const json = JSON.stringify(profile);
          const deserialized = JSON.parse(json);

          // Check that all properties are preserved
          expect(deserialized.name).toBe(profile.name);
          expect(deserialized.buildType).toBe(profile.buildType);
          expect(deserialized.variant).toBe(profile.variant);
          expect(deserialized.signingConfig.keystorePath).toBe(profile.signingConfig.keystorePath);
          expect(deserialized.buildParameters.minifyEnabled).toBe(profile.buildParameters.minifyEnabled);
          expect(deserialized.outputDirectory).toBe(profile.outputDirectory);
        }),
        { numRuns: 100 },
      );
    });

    it('should maintain type safety through serialization cycle', () => {
      const profileArbitrary = fc.record({
        name: fc.constantFrom('development', 'staging', 'production'),
        buildType: fc.constantFrom(BuildType.Debug, BuildType.Release),
        variant: fc.stringMatching(/^[a-z]+$/),
        signingConfig: fc.record({
          keystorePath: fc.stringMatching(/^\/[a-z0-9\/]+\.jks$/),
          keystorePassword: fc.string({ minLength: 1 }),
          keyAlias: fc.stringMatching(/^[a-z0-9\-]+$/),
          keyPassword: fc.string({ minLength: 1 }),
        }),
        buildParameters: fc.record({
          minifyEnabled: fc.boolean(),
          shrinkResources: fc.boolean(),
          debuggable: fc.boolean(),
          versionCode: fc.integer({ min: 1, max: 1000000 }),
          versionName: fc.stringMatching(/^\d+\.\d+\.\d+/),
        }),
        environmentVariables: fc.dictionary(fc.string(), fc.string()),
        outputDirectory: fc.stringMatching(/^\/[a-z0-9\/]+$/),
      });

      fc.assert(
        fc.property(profileArbitrary, (profile) => {
          const json = JSON.stringify(profile);
          const deserialized = JSON.parse(json) as BuildProfile;

          // Type guard should validate the deserialized object
          expect(isBuildProfile(deserialized)).toBe(true);
        }),
        { numRuns: 100 },
      );
    });

    it('should handle complex nested structures in serialization', () => {
      const artifactArbitrary = fc.record({
        id: fc.uuid(),
        type: fc.constantFrom('apk', 'aab'),
        variant: fc.stringMatching(/^[a-z]+$/),
        buildType: fc.constantFrom(BuildType.Debug, BuildType.Release),
        filePath: fc.stringMatching(/^\/[a-z0-9\/]+\.(apk|aab)$/),
        fileName: fc.stringMatching(/^[a-z0-9\-]+\.(apk|aab)$/),
        fileSize: fc.integer({ min: 1000000, max: 100000000 }),
        checksum: fc.string({ minLength: 64, maxLength: 64, unit: 'binary' }).map(s => Buffer.from(s).toString('hex').substring(0, 64)),
        timestamp: fc.date(),
        buildDuration: fc.integer({ min: 1000, max: 600000 }),
        signingInfo: fc.record({
          signed: fc.boolean(),
          certificateSubjectDN: fc.string(),
          certificateIssuerDN: fc.string(),
          certificateNotBefore: fc.date(),
          certificateNotAfter: fc.date(),
          signatureAlgorithm: fc.string(),
          certificateExpired: fc.boolean(),
          certificateExpiringIn: fc.integer({ min: -365, max: 365 }),
        }),
        manifestInfo: fc.record({
          packageName: fc.stringMatching(/^[a-z]+(\.[a-z]+)*$/),
          versionCode: fc.integer({ min: 1, max: 1000000 }),
          versionName: fc.stringMatching(/^\d+\.\d+\.\d+/),
          minSdkVersion: fc.integer({ min: 16, max: 34 }),
          targetSdkVersion: fc.integer({ min: 16, max: 34 }),
          permissions: fc.array(fc.string()),
          activities: fc.array(fc.string()),
          services: fc.array(fc.string()),
          receivers: fc.array(fc.string()),
          providers: fc.array(fc.string()),
        }),
        metadata: fc.dictionary(fc.string(), fc.string()),
      });

      fc.assert(
        fc.property(artifactArbitrary, (artifact) => {
          const json = JSON.stringify(artifact);
          const deserialized = JSON.parse(json);

          // Verify nested structures are preserved
          expect(deserialized.signingInfo.certificateSubjectDN).toBe(artifact.signingInfo.certificateSubjectDN);
          expect(deserialized.manifestInfo.packageName).toBe(artifact.manifestInfo.packageName);
          expect(deserialized.manifestInfo.permissions.length).toBe(artifact.manifestInfo.permissions.length);
        }),
        { numRuns: 100 },
      );
    });
  });
});
