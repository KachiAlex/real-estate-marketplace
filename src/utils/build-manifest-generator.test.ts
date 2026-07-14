import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { BuildManifestGenerator, createBuildManifestGenerator } from './build-manifest-generator';
import { BuildVariant, BuildType, BuildStageStatus } from '../types/android-build';

describe('BuildManifestGenerator', () => {
  let tempDir: string;
  let generator: BuildManifestGenerator;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'manifest-generator-test-'));
    generator = new BuildManifestGenerator(tempDir);
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('generateManifest', () => {
    it('should generate a valid manifest with all required fields', async () => {
      const buildId = 'build-123';
      const variant = BuildVariant.Debug;
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
          details: 'Compilation completed',
        },
      ];
      const buildDuration = 60;
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
        buildDuration,
        environmentInfo
      );

      expect(manifest).toBeDefined();
      expect(manifest.buildId).toBe(buildId);
      expect(manifest.variant).toBe(variant);
      expect(manifest.artifacts).toEqual(artifacts);
      expect(manifest.stages).toEqual(stages);
      expect(manifest.buildDuration).toBe(buildDuration);
      expect(manifest.environment).toEqual(environmentInfo);
      expect(manifest.timestamp).toBeInstanceOf(Date);
    });

    it('should include reproducibility metadata when provided', async () => {
      const buildId = 'build-123';
      const variant = BuildVariant.Release;
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
          details: 'Compilation completed',
        },
      ];
      const buildDuration = 120;
      const environmentInfo = {
        gradleVersion: '8.0',
        androidSdkVersion: 33,
        buildToolsVersion: '33.0.0',
      };
      const reproducibilityInfo = {
        reproducible: true,
        previousBuildId: 'build-122',
        checksumMatch: true,
      };

      const manifest = await generator.generateManifest(
        buildId,
        variant,
        artifacts,
        stages,
        buildDuration,
        environmentInfo,
        reproducibilityInfo
      );

      expect(manifest.reproducibilityInfo).toEqual(reproducibilityInfo);
    });

    it('should throw error if buildId is empty', async () => {
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

      await expect(
        generator.generateManifest('', BuildVariant.Debug, artifacts, stages, 60, {
          gradleVersion: '8.0',
          androidSdkVersion: 33,
          buildToolsVersion: '33.0.0',
        })
      ).rejects.toThrow('Build ID is required');
    });

    it('should throw error if artifacts array is empty', async () => {
      const stages = [
        {
          name: 'Compilation',
          status: BuildStageStatus.Success,
          duration: 30,
          startTime: new Date(),
          endTime: new Date(),
        },
      ];

      await expect(
        generator.generateManifest('build-123', BuildVariant.Debug, [], stages, 60, {
          gradleVersion: '8.0',
          androidSdkVersion: 33,
          buildToolsVersion: '33.0.0',
        })
      ).rejects.toThrow('At least one artifact is required');
    });

    it('should throw error if stages array is empty', async () => {
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

      await expect(
        generator.generateManifest('build-123', BuildVariant.Debug, artifacts, [], 60, {
          gradleVersion: '8.0',
          androidSdkVersion: 33,
          buildToolsVersion: '33.0.0',
        })
      ).rejects.toThrow('At least one build stage is required');
    });

    it('should throw error if buildDuration is negative', async () => {
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

      await expect(
        generator.generateManifest('build-123', BuildVariant.Debug, artifacts, stages, -1, {
          gradleVersion: '8.0',
          androidSdkVersion: 33,
          buildToolsVersion: '33.0.0',
        })
      ).rejects.toThrow('Build duration must be non-negative');
    });
  });

  describe('saveManifest', () => {
    it('should save manifest to file', async () => {
      const filePath = path.join(tempDir, 'build-manifest.json');
      const manifest = {
        buildId: 'build-123',
        timestamp: new Date(),
        profile: 'development',
        variant: BuildVariant.Debug,
        artifacts: [
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
        ],
        buildDuration: 60,
        stages: [
          {
            name: 'Compilation',
            status: BuildStageStatus.Success,
            duration: 30,
            startTime: new Date(),
            endTime: new Date(),
          },
        ],
        environment: {
          gradleVersion: '8.0',
          androidSdkVersion: 33,
          buildToolsVersion: '33.0.0',
        },
      };

      await generator.saveManifest(manifest, filePath);

      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed.buildId).toBe('build-123');
    });

    it('should create directory if it does not exist', async () => {
      const filePath = path.join(tempDir, 'subdir', 'build-manifest.json');
      const manifest = {
        buildId: 'build-123',
        timestamp: new Date(),
        profile: 'development',
        variant: BuildVariant.Debug,
        artifacts: [
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
        ],
        buildDuration: 60,
        stages: [
          {
            name: 'Compilation',
            status: BuildStageStatus.Success,
            duration: 30,
            startTime: new Date(),
            endTime: new Date(),
          },
        ],
        environment: {
          gradleVersion: '8.0',
          androidSdkVersion: 33,
          buildToolsVersion: '33.0.0',
        },
      };

      await generator.saveManifest(manifest, filePath);

      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should throw error if file path is empty', async () => {
      const manifest = {
        buildId: 'build-123',
        timestamp: new Date(),
        profile: 'development',
        variant: BuildVariant.Debug,
        artifacts: [],
        buildDuration: 60,
        stages: [],
        environment: {
          gradleVersion: '8.0',
          androidSdkVersion: 33,
          buildToolsVersion: '33.0.0',
        },
      };

      await expect(generator.saveManifest(manifest, '')).rejects.toThrow('File path is required');
    });
  });

  describe('loadManifest', () => {
    it('should load manifest from file', async () => {
      const filePath = path.join(tempDir, 'build-manifest.json');
      const manifestData = {
        buildId: 'build-123',
        timestamp: new Date().toISOString(),
        profile: 'development',
        variant: BuildVariant.Debug,
        artifacts: [
          {
            id: 'artifact-1',
            type: 'apk' as const,
            variant: BuildVariant.Debug,
            buildType: BuildType.Debug,
            filePath: '/path/to/app-debug.apk',
            fileName: 'app-debug.apk',
            fileSize: 45000000,
            checksum: 'abc123def456',
            timestamp: new Date().toISOString(),
            buildDuration: 60,
            signingInfo: {
              signed: false,
              certificateSubjectDN: '',
              certificateIssuerDN: '',
              certificateNotBefore: new Date().toISOString(),
              certificateNotAfter: new Date().toISOString(),
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
        ],
        buildDuration: 60,
        stages: [
          {
            name: 'Compilation',
            status: BuildStageStatus.Success,
            duration: 30,
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
          },
        ],
        environment: {
          gradleVersion: '8.0',
          androidSdkVersion: 33,
          buildToolsVersion: '33.0.0',
        },
      };

      fs.writeFileSync(filePath, JSON.stringify(manifestData, null, 2));

      const manifest = await generator.loadManifest(filePath);

      expect(manifest.buildId).toBe('build-123');
      expect(manifest.variant).toBe(BuildVariant.Debug);
      expect(manifest.artifacts.length).toBe(1);
    });

    it('should throw error if file does not exist', async () => {
      const filePath = path.join(tempDir, 'non-existent.json');

      await expect(generator.loadManifest(filePath)).rejects.toThrow('Manifest file not found');
    });

    it('should throw error if JSON is invalid', async () => {
      const filePath = path.join(tempDir, 'invalid.json');
      fs.writeFileSync(filePath, 'invalid json {');

      await expect(generator.loadManifest(filePath)).rejects.toThrow('Invalid manifest JSON');
    });

    it('should throw error if manifest is missing required fields', async () => {
      const filePath = path.join(tempDir, 'incomplete.json');
      const incompleteManifest = {
        buildId: 'build-123',
        // missing timestamp
      };

      fs.writeFileSync(filePath, JSON.stringify(incompleteManifest));

      await expect(generator.loadManifest(filePath)).rejects.toThrow(
        'Manifest missing required field: timestamp'
      );
    });
  });

  describe('getManifestPath', () => {
    it('should generate correct manifest path for debug variant', () => {
      const date = new Date('2024-01-15T10:30:45');
      const manifestPath = generator.getManifestPath(BuildVariant.Debug, date);

      expect(manifestPath).toContain('debug');
      expect(manifestPath).toContain('2024-01-15_10-30-45');
      expect(manifestPath).toContain('build-manifest.json');
    });

    it('should generate correct manifest path for release variant', () => {
      const date = new Date('2024-01-15T14:30:45');
      const manifestPath = generator.getManifestPath(BuildVariant.Release, date);

      expect(manifestPath).toContain('release');
      expect(manifestPath).toContain('2024-01-15_14-30-45');
      expect(manifestPath).toContain('build-manifest.json');
    });

    it('should generate correct manifest path for AAB variant', () => {
      const date = new Date('2024-01-15T14:30:45');
      const manifestPath = generator.getManifestPath(BuildVariant.AAB, date);

      expect(manifestPath).toContain('release');
      expect(manifestPath).toContain('2024-01-15_14-30-45');
      expect(manifestPath).toContain('build-manifest.json');
    });
  });

  describe('createBuildManifestGenerator', () => {
    it('should create a new BuildManifestGenerator instance', () => {
      const instance = createBuildManifestGenerator(tempDir);

      expect(instance).toBeInstanceOf(BuildManifestGenerator);
    });
  });
});
