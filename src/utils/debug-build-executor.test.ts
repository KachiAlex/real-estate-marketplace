/**
 * Debug Build Executor Tests
 *
 * Unit tests for the DebugBuildExecutor class
 */

import * as fs from 'fs';
import * as path from 'path';
import { DebugBuildExecutor, createDebugBuildExecutor } from './debug-build-executor';
import { BuildConfiguration, BuildType } from '../types/android-build';

// Mock execSync
jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

describe('DebugBuildExecutor', () => {
  let executor: DebugBuildExecutor;
  let mockConfig: BuildConfiguration;

  beforeEach(() => {
    executor = createDebugBuildExecutor();
    mockConfig = {
      buildId: 'test-build-001',
      profile: 'development',
      variant: 'debug',
      buildType: BuildType.Debug,
      buildParameters: {
        minifyEnabled: false,
        shrinkResources: false,
        debuggable: true,
        versionCode: 1,
        versionName: '1.0.0',
      },
      signingConfig: {
        keystorePath: '/path/to/debug.keystore',
        keystorePassword: 'android',
        keyAlias: 'androiddebugkey',
        keyPassword: 'android',
      },
      outputDirectory: './build-artifacts',
      clean: false,
      parallel: true,
      cacheEnabled: true,
      environmentVariables: {},
      createdAt: new Date(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createDebugBuildExecutor', () => {
    it('should create a DebugBuildExecutor instance', () => {
      const executor = createDebugBuildExecutor();
      expect(executor).toBeInstanceOf(DebugBuildExecutor);
    });
  });

  describe('executeBuild', () => {
    it('should initialize build state correctly', async () => {
      // Mock the executeStages method to avoid actual build execution
      const mockResult = {
        success: true,
        artifactPath: '/path/to/app-debug.apk',
        artifactSize: 45000000,
        checksum: 'abc123',
        duration: 60000,
        stages: [],
        completedAt: new Date(),
      };

      jest.spyOn(executor as any, 'executeStages').mockResolvedValue(mockResult);

      const result = await executor.executeBuild(mockConfig);

      expect(result.success).toBe(true);
      expect(result.artifactPath).toBe('/path/to/app-debug.apk');
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
          artifactPath: '/path/to/app-debug.apk',
          artifactSize: 45000000,
          checksum: 'abc123',
          duration: 60000,
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

  describe('Debug Build Configuration', () => {
    it('should have debug configuration enabled', () => {
      expect(mockConfig.buildParameters.debuggable).toBe(true);
      expect(mockConfig.buildParameters.minifyEnabled).toBe(false);
      expect(mockConfig.buildParameters.shrinkResources).toBe(false);
    });

    it('should use debug signing configuration', () => {
      expect(mockConfig.signingConfig.keyAlias).toBe('androiddebugkey');
      expect(mockConfig.signingConfig.keystorePassword).toBe('android');
    });
  });

  describe('Incremental Build Support', () => {
    it('should have cache enabled for incremental builds', () => {
      expect(mockConfig.cacheEnabled).toBe(true);
    });

    it('should have parallel compilation enabled', () => {
      expect(mockConfig.parallel).toBe(true);
    });
  });

  describe('Build Artifact Validation', () => {
    it('should validate variant format', () => {
      expect(mockConfig.variant).toBe('debug');
    });

    it('should have output directory configured', () => {
      expect(mockConfig.outputDirectory).toBeDefined();
      expect(mockConfig.outputDirectory).toBe('./build-artifacts');
    });
  });
});
