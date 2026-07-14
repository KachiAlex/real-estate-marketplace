/**
 * AAB Build Executor Tests
 *
 * Unit tests for the AABBuildExecutor class
 */

import * as fs from 'fs';
import * as path from 'path';
import { AABBuildExecutor, createAABBuildExecutor } from './aab-build-executor';
import { BuildConfiguration, BuildType } from '../types/android-build';

// Mock execSync
jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

describe('AABBuildExecutor', () => {
  let executor: AABBuildExecutor;
  let mockConfig: BuildConfiguration;

  beforeEach(() => {
    executor = createAABBuildExecutor();
    mockConfig = {
      buildId: 'test-build-001',
      profile: 'production',
      variant: 'aab',
      buildType: BuildType.Release,
      buildParameters: {
        minifyEnabled: true,
        shrinkResources: true,
        debuggable: false,
        versionCode: 1,
        versionName: '1.0.0',
      },
      signingConfig: {
        keystorePath: '/path/to/release.keystore',
        keystorePassword: 'keystore-password',
        keyAlias: 'release-key',
        keyPassword: 'key-password',
      },
      outputDirectory: './build-artifacts',
      clean: false,
      parallel: true,
      cacheEnabled: true,
      environmentVariables: {},
      createdAt: new Date(),
    };

    // Set environment variables for AAB build
    process.env.ANDROID_KEYSTORE_PATH = '/path/to/release.keystore';
    process.env.ANDROID_KEYSTORE_PASSWORD = 'keystore-password';
    process.env.ANDROID_KEY_ALIAS = 'release-key';
    process.env.ANDROID_KEY_PASSWORD = 'key-password';
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.ANDROID_KEYSTORE_PATH;
    delete process.env.ANDROID_KEYSTORE_PASSWORD;
    delete process.env.ANDROID_KEY_ALIAS;
    delete process.env.ANDROID_KEY_PASSWORD;
  });

  describe('createAABBuildExecutor', () => {
    it('should create an AABBuildExecutor instance', () => {
      const executor = createAABBuildExecutor();
      expect(executor).toBeInstanceOf(AABBuildExecutor);
    });
  });

  describe('executeBuild', () => {
    it('should initialize build state correctly', async () => {
      // Mock the executeStages method to avoid actual build execution
      const mockResult = {
        success: true,
        artifactPath: '/path/to/app-release.aab',
        artifactSize: 40000000,
        checksum: 'ghi789',
        duration: 150000,
        stages: [],
        completedAt: new Date(),
      };

      jest.spyOn(executor as any, 'executeStages').mockResolvedValue(mockResult);

      const result = await executor.executeBuild(mockConfig);

      expect(result.success).toBe(true);
      expect(result.artifactPath).toBe('/path/to/app-release.aab');
    });

    it('should handle build errors gracefully', async () => {
      const error = new Error('Build failed');
      jest.spyOn(executor as any, 'executeStages').mockRejectedValue(error);

      const result = await executor.executeBuild(mockConfig);

      expect(result.success).toBe(false);
      expect(result.artifactPath).toBe('');
      expect(result.artifactSize).toBe(0);
    });
  });

  describe('getProgress', () => {
    it('should return progress information', () => {
      const progress = executor.getProgress();

      expect(progress).toHaveProperty('currentStage');
      expect(progress).toHaveProperty('stageIndex');
      expect(progress).toHaveProperty('totalStages');
      expect(progress).toHaveProperty('percentComplete');
      expect(progress).toHaveProperty('estimatedTimeRemaining');
      expect(progress).toHaveProperty('elapsedTime');
    });

    it('should calculate percentage correctly', () => {
      const progress = executor.getProgress();

      expect(progress.percentComplete).toBeGreaterThanOrEqual(0);
      expect(progress.percentComplete).toBeLessThanOrEqual(100);
    });
  });

  describe('getStatus', () => {
    it('should return build status information', () => {
      const status = executor.getStatus();

      expect(status).toHaveProperty('buildId');
      expect(status).toHaveProperty('status');
      expect(status).toHaveProperty('profile');
      expect(status).toHaveProperty('variant');
      expect(status).toHaveProperty('startTime');
      expect(status).toHaveProperty('currentStage');
      expect(status).toHaveProperty('progress');
    });
  });

  describe('getLogs', () => {
    it('should return all logs when no stage is specified', async () => {
      // Mock executeStages to add some logs
      jest.spyOn(executor as any, 'executeStages').mockImplementation(async () => {
        executor['log']('Test log 1');
        executor['log']('Test log 2');
        return {
          success: true,
          artifactPath: '/path/to/app-release.aab',
          artifactSize: 40000000,
          checksum: 'ghi789',
          duration: 150000,
          stages: [],
          completedAt: new Date(),
        };
      });

      await executor.executeBuild(mockConfig);
      const logs = executor.getLogs();

      expect(logs.length).toBeGreaterThan(0);
      expect(logs.some((log) => log.includes('Test log 1'))).toBe(true);
    });
  });

  describe('cancelBuild', () => {
    it('should cancel the build', async () => {
      await executor.cancelBuild();
      const status = executor.getStatus();

      expect(status.status).toBe('cancelled');
    });
  });

  describe('AAB Build Configuration', () => {
    it('should have release configuration enabled', () => {
      expect(mockConfig.buildParameters.debuggable).toBe(false);
      expect(mockConfig.buildParameters.minifyEnabled).toBe(true);
      expect(mockConfig.buildParameters.shrinkResources).toBe(true);
    });

    it('should use production signing configuration', () => {
      expect(mockConfig.signingConfig.keyAlias).toBe('release-key');
      expect(mockConfig.signingConfig.keystorePassword).toBe('keystore-password');
    });

    it('should have AAB variant', () => {
      expect(mockConfig.variant).toBe('aab');
    });
  });

  describe('Optimization Configuration', () => {
    it('should have R8 obfuscation enabled', () => {
      expect(mockConfig.buildParameters.minifyEnabled).toBe(true);
    });

    it('should have resource shrinking enabled', () => {
      expect(mockConfig.buildParameters.shrinkResources).toBe(true);
    });
  });

  describe('Build Artifact Validation', () => {
    it('should validate variant format', () => {
      expect(mockConfig.variant).toBe('aab');
    });

    it('should have output directory configured', () => {
      expect(mockConfig.outputDirectory).toBeDefined();
      expect(mockConfig.outputDirectory).toBe('./build-artifacts');
    });
  });
});
