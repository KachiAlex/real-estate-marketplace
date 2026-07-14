import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { BuildManifestGenerator } from './build-manifest-generator';
import { BuildVariant, BuildType, BuildStageStatus } from '../types/android-build';

describe('BuildManifestGenerator - Property-Based Tests', () => {
  let tempDir: string;
  let generator: BuildManifestGenerator;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'manifest-pbt-'));
    generator = new BuildManifestGenerator(tempDir);
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Property 15: Build Manifest Generation', () => {
    it('should generate manifests with all required metadata', () => {
      fc.assert(
        fc.asyncProperty(
          fc.stringMatching(/^build-[a-zA-Z0-9]{8}$/),
          fc.integer({ min: 1, max: 1000 }),
          fc.integer({ min: 1, max: 100 }),
          async (buildId, buildDuration, numStages) => {
            // Create test artifacts
            const artifacts = [
              {
                id: 'artifact-1',
                type: 'apk' as const,
                variant: BuildVariant.Debug,
                buildType: BuildType.Debug,
                filePath: '/path/to/app-debug.apk',
                fileName: 'app-debug.apk',
                fileSize: 45000000,
                checksum: 'abc123def456',
                timestamp: new Date(),
                buildDuration: buildDuration,
                signingInfo: {
                  signed: false,
                  certificateSubjectDN: '',
                  certificateIssuerDN: '',
                  certificateNotBefore: new Date(),
                  certificateNotAfter: new Date(),
                  signatureAlgorithm: '',
                  certificateExpired: false,
                  certificateExpiringIn: 0,
                },
                manifestInfo: {
                  packageName: 'com.example.app',
                  versionCode: 1,
                  versionName: '1.0.0',
                  minSdkVersion: 21,
                  targetSdkVersion: 33,
                  permissions: [],
                  activities: [],
                  services: [],
                  receivers: [],
                  providers: [],
                },
                metadata: {},
              },
            ];

            // Create test stages
            const stages = Array.from({ length: numStages }, (_, i) => ({
              name: `Stage${i + 1}`,
              status: BuildStageStatus.Success,
              duration: 10 + i * 5,
              startTime: new Date(),
              endTime: new Date(),
              details: `Stage ${i + 1} completed`,
            }));

            const environmentInfo = {
              gradleVersion: '8.0',
              androidSdkVersion: 33,
              buildToolsVersion: '33.0.0',
            };

            const manifest = await generator.generateManifest(
              buildId,
              BuildVariant.Debug,
              artifacts,
              stages,
              buildDuration,
              environmentInfo
            );

            // Verify all required metadata is present
            expect(manifest.buildId).toBe(buildId);
            expect(manifest.timestamp).toBeInstanceOf(Date);
            expect(manifest.variant).toBe(BuildVariant.Debug);
            expect(manifest.artifacts).toEqual(artifacts);
            expect(manifest.buildDuration).toBe(buildDuration);
            expect(manifest.stages).toEqual(stages);
            expect(manifest.environment).toEqual(environmentInfo);
            expect(manifest.profile).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate manifests for all build variants', () => {
      fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.constant(BuildVariant.Debug),
            fc.constant(BuildVariant.Release),
            fc.constant(BuildVariant.AAB)
          ),
          async (variant) => {
            const buildId = 'build-test-123';
            const artifacts = [
              {
                id: 'artifact-1',
                type: variant === BuildVariant.AAB ? ('aab' as const) : ('apk' as const),
                variant: variant,
                buildType: variant === BuildVariant.Debug ? BuildType.Debug : BuildType.Release,
                filePath: '/path/to/app.apk',
                fileName: 'app.apk',
                fileSize: 45000000,
                checksum: 'abc123def456',
                timestamp: new Date(),
                buildDuration: 60,
                signingInfo: {
                  signed: variant !== BuildVariant.Debug,
                  certificateSubjectDN: '',
                  certificateIssuerDN: '',
                  certificateNotBefore: new Date(),
                  certificateNotAfter: new Date(),
                  signatureAlgorithm: '',
                  certificateExpired: false,
                  certificateExpiringIn: 0,
                },
                manifestInfo: {
                  packageName: 'com.example.app',
                  versionCode: 1,
                  versionName: '1.0.0',
                  minSdkVersion: 21,
                  targetSdkVersion: 33,
                  permissions: [],
                  activities: [],
                  services: [],
                  receivers: [],
                  providers: [],
                },
                metadata: {},
              },
            ];

            const stages = [
              {
                name: 'Compilation',
                status: BuildStageStatus.Success,
                duration: 30,
                startTime: new Date(),
                endTime: new Date(),
              },
            ];

            const environmentInfo = {
              gradleVersion: '8.0',
              androidSdkVersion: 33,
              buildToolsVersion: '33.0.0',
            };

            const manifest = await generator.generateManifest(
              buildId,
              variant,
              artifacts,
              stages,
              60,
              environmentInfo
            );

            // Verify manifest is generated for all variants
            expect(manifest.variant).toBe(variant);
            expect(manifest.artifacts[0].variant).toBe(variant);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include environment information in all manifests', () => {
      fc.assert(
        fc.asyncProperty(
          fc.stringMatching(/^\d+\.\d+$/),
          fc.integer({ min: 21, max: 34 }),
          fc.stringMatching(/^\d+\.\d+\.\d+$/),
          async (gradleVersion, sdkVersion, buildToolsVersion) => {
            const buildId = 'build-test-123';
            const artifacts = [
              {
                id: 'artifact-1',
                type: 'apk' as const,
                variant: BuildVariant.Debug,
                buildType: BuildType.Debug,
                filePath: '/path/to/app-debug.apk',
                fileName: 'app-debug.apk',
                fileSize: 45000000,
                checksum: 'abc123def456',
                timestamp: new Date(),
                buildDuration: 60,
                signingInfo: {
                  signed: false,
                  certificateSubjectDN: '',
                  certificateIssuerDN: '',
                  certificateNotBefore: new Date(),
                  certificateNotAfter: new Date(),
                  signatureAlgorithm: '',
                  certificateExpired: false,
                  certificateExpiringIn: 0,
                },
                manifestInfo: {
                  packageName: 'com.example.app',
                  versionCode: 1,
                  versionName: '1.0.0',
                  minSdkVersion: 21,
                  targetSdkVersion: 33,
                  permissions: [],
                  activities: [],
                  services: [],
                  receivers: [],
                  providers: [],
                },
                metadata: {},
              },
            ];

            const stages = [
              {
                name: 'Compilation',
                status: BuildStageStatus.Success,
                duration: 30,
                startTime: new Date(),
                endTime: new Date(),
              },
            ];

            const environmentInfo = {
              gradleVersion: gradleVersion,
              androidSdkVersion: sdkVersion,
              buildToolsVersion: buildToolsVersion,
            };

            const manifest = await generator.generateManifest(
              buildId,
              BuildVariant.Debug,
              artifacts,
              stages,
              60,
              environmentInfo
            );

            // Verify environment information is included
            expect(manifest.environment.gradleVersion).toBe(gradleVersion);
            expect(manifest.environment.androidSdkVersion).toBe(sdkVersion);
            expect(manifest.environment.buildToolsVersion).toBe(buildToolsVersion);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 52: Reproducibility Metadata', () => {
    it('should include reproducibility metadata when provided', () => {
      fc.assert(
        fc.asyncProperty(
          fc.boolean(),
          fc.stringMatching(/^build-[a-zA-Z0-9]{8}$/),
          async (reproducible, previousBuildId) => {
            const buildId = 'build-test-123';
            const artifacts = [
              {
                id: 'artifact-1',
                type: 'apk' as const,
                variant: BuildVariant.Release,
                buildType: BuildType.Release,
                filePath: '/path/to/app-release.apk',
                fileName: 'app-release.apk',
                fileSize: 45000000,
                checksum: 'abc123def456',
                timestamp: new Date(),
                buildDuration: 120,
                signingInfo: {
                  signed: true,
                  certificateSubjectDN: 'CN=Example',
                  certificateIssuerDN: 'CN=Example',
                  certificateNotBefore: new Date(),
                  certificateNotAfter: new Date(),
                  signatureAlgorithm: 'SHA256withRSA',
                  certificateExpired: false,
                  certificateExpiringIn: 365,
                },
                manifestInfo: {
                  packageName: 'com.example.app',
                  versionCode: 1,
                  versionName: '1.0.0',
                  minSdkVersion: 21,
                  targetSdkVersion: 33,
                  permissions: [],
                  activities: [],
                  services: [],
                  receivers: [],
                  providers: [],
                },
                metadata: {},
              },
            ];

            const stages = [
              {
                name: 'Compilation',
                status: BuildStageStatus.Success,
                duration: 60,
                startTime: new Date(),
                endTime: new Date(),
              },
            ];

            const environmentInfo = {
              gradleVersion: '8.0',
              androidSdkVersion: 33,
              buildToolsVersion: '33.0.0',
            };

            const reproducibilityInfo = {
              reproducible: reproducible,
              previousBuildId: previousBuildId,
              checksumMatch: reproducible,
            };

            const manifest = await generator.generateManifest(
              buildId,
              BuildVariant.Release,
              artifacts,
              stages,
              120,
              environmentInfo,
              reproducibilityInfo
            );

            // Verify reproducibility metadata is included
            expect(manifest.reproducibilityInfo).toBeDefined();
            expect(manifest.reproducibilityInfo?.reproducible).toBe(reproducible);
            expect(manifest.reproducibilityInfo?.previousBuildId).toBe(previousBuildId);
            expect(manifest.reproducibilityInfo?.checksumMatch).toBe(reproducible);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should enable reproducibility verification through metadata', () => {
      fc.assert(
        fc.asyncProperty(
          fc.stringMatching(/^[a-f0-9]{64}$/),
          async (checksum) => {
            const buildId = 'build-test-123';
            const artifacts = [
              {
                id: 'artifact-1',
                type: 'apk' as const,
                variant: BuildVariant.Release,
                buildType: BuildType.Release,
                filePath: '/path/to/app-release.apk',
                fileName: 'app-release.apk',
                fileSize: 45000000,
                checksum: checksum,
                timestamp: new Date(),
                buildDuration: 120,
                signingInfo: {
                  signed: true,
                  certificateSubjectDN: 'CN=Example',
                  certificateIssuerDN: 'CN=Example',
                  certificateNotBefore: new Date(),
                  certificateNotAfter: new Date(),
                  signatureAlgorithm: 'SHA256withRSA',
                  certificateExpired: false,
                  certificateExpiringIn: 365,
                },
                manifestInfo: {
                  packageName: 'com.example.app',
                  versionCode: 1,
                  versionName: '1.0.0',
                  minSdkVersion: 21,
                  targetSdkVersion: 33,
                  permissions: [],
                  activities: [],
                  services: [],
                  receivers: [],
                  providers: [],
                },
                metadata: {},
              },
            ];

            const stages = [
              {
                name: 'Compilation',
                status: BuildStageStatus.Success,
                duration: 60,
                startTime: new Date(),
                endTime: new Date(),
              },
            ];

            const environmentInfo = {
              gradleVersion: '8.0',
              androidSdkVersion: 33,
              buildToolsVersion: '33.0.0',
            };

            const reproducibilityInfo = {
              reproducible: true,
              previousBuildId: 'build-previous-123',
              checksumMatch: true,
            };

            const manifest = await generator.generateManifest(
              buildId,
              BuildVariant.Release,
              artifacts,
              stages,
              120,
              environmentInfo,
              reproducibilityInfo
            );

            // Verify metadata enables reproducibility verification
            expect(manifest.artifacts[0].checksum).toBe(checksum);
            expect(manifest.reproducibilityInfo?.checksumMatch).toBe(true);
            expect(manifest.environment).toBeDefined();
            expect(manifest.buildDuration).toBe(120);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve all metadata through save and load cycle', () => {
      fc.assert(
        fc.asyncProperty(
          fc.stringMatching(/^build-[a-zA-Z0-9]{8}$/),
          async (buildId) => {
            const filePath = path.join(tempDir, 'manifest-test.json');
            const artifacts = [
              {
                id: 'artifact-1',
                type: 'apk' as const,
                variant: BuildVariant.Release,
                buildType: BuildType.Release,
                filePath: '/path/to/app-release.apk',
                fileName: 'app-release.apk',
                fileSize: 45000000,
                checksum: 'abc123def456',
                timestamp: new Date(),
                buildDuration: 120,
                signingInfo: {
                  signed: true,
                  certificateSubjectDN: 'CN=Example',
                  certificateIssuerDN: 'CN=Example',
                  certificateNotBefore: new Date(),
                  certificateNotAfter: new Date(),
                  signatureAlgorithm: 'SHA256withRSA',
                  certificateExpired: false,
                  certificateExpiringIn: 365,
                },
                manifestInfo: {
                  packageName: 'com.example.app',
                  versionCode: 1,
                  versionName: '1.0.0',
                  minSdkVersion: 21,
                  targetSdkVersion: 33,
                  permissions: [],
                  activities: [],
                  services: [],
                  receivers: [],
                  providers: [],
                },
                metadata: {},
              },
            ];

            const stages = [
              {
                name: 'Compilation',
                status: BuildStageStatus.Success,
                duration: 60,
                startTime: new Date(),
                endTime: new Date(),
              },
            ];

            const environmentInfo = {
              gradleVersion: '8.0',
              androidSdkVersion: 33,
              buildToolsVersion: '33.0.0',
            };

            const reproducibilityInfo = {
              reproducible: true,
              previousBuildId: 'build-previous-123',
              checksumMatch: true,
            };

            const manifest = await generator.generateManifest(
              buildId,
              BuildVariant.Release,
              artifacts,
              stages,
              120,
              environmentInfo,
              reproducibilityInfo
            );

            // Save and load
            await generator.saveManifest(manifest, filePath);
            const loadedManifest = await generator.loadManifest(filePath);

            // Verify all metadata is preserved
            expect(loadedManifest.buildId).toBe(buildId);
            expect(loadedManifest.reproducibilityInfo?.reproducible).toBe(true);
            expect(loadedManifest.reproducibilityInfo?.checksumMatch).toBe(true);
            expect(loadedManifest.environment.gradleVersion).toBe('8.0');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Manifest Persistence', () => {
    it('should save and load manifests consistently', () => {
      fc.assert(
        fc.asyncProperty(
          fc.stringMatching(/^build-[a-zA-Z0-9]{8}$/),
          async (buildId) => {
            const filePath = path.join(tempDir, `manifest-${buildId}.json`);
            const artifacts = [
              {
                id: 'artifact-1',
                type: 'apk' as const,
                variant: BuildVariant.Debug,
                buildType: BuildType.Debug,
                filePath: '/path/to/app-debug.apk',
                fileName: 'app-debug.apk',
                fileSize: 45000000,
                checksum: 'abc123def456',
                timestamp: new Date(),
                buildDuration: 60,
                signingInfo: {
                  signed: false,
                  certificateSubjectDN: '',
                  certificateIssuerDN: '',
                  certificateNotBefore: new Date(),
                  certificateNotAfter: new Date(),
                  signatureAlgorithm: '',
                  certificateExpired: false,
                  certificateExpiringIn: 0,
                },
                manifestInfo: {
                  packageName: 'com.example.app',
                  versionCode: 1,
                  versionName: '1.0.0',
                  minSdkVersion: 21,
                  targetSdkVersion: 33,
                  permissions: [],
                  activities: [],
                  services: [],
                  receivers: [],
                  providers: [],
                },
                metadata: {},
              },
            ];

            const stages = [
              {
                name: 'Compilation',
                status: BuildStageStatus.Success,
                duration: 30,
                startTime: new Date(),
                endTime: new Date(),
              },
            ];

            const environmentInfo = {
              gradleVersion: '8.0',
              androidSdkVersion: 33,
              buildToolsVersion: '33.0.0',
            };

            const manifest = await generator.generateManifest(
              buildId,
              BuildVariant.Debug,
              artifacts,
              stages,
              60,
              environmentInfo
            );

            // Save manifest
            await generator.saveManifest(manifest, filePath);

            // Load manifest
            const loadedManifest = await generator.loadManifest(filePath);

            // Verify consistency
            expect(loadedManifest.buildId).toBe(manifest.buildId);
            expect(loadedManifest.variant).toBe(manifest.variant);
            expect(loadedManifest.buildDuration).toBe(manifest.buildDuration);
            expect(loadedManifest.artifacts.length).toBe(manifest.artifacts.length);
            expect(loadedManifest.stages.length).toBe(manifest.stages.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
