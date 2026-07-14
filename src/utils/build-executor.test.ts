/**
 * Unit tests for Build Executor
 *
 * Tests verify that build execution, progress tracking, and error handling work correctly.
 */

import {
  BaseBuildExecutor,
  IBuildExecutor,
} from './build-executor';
import {
  BuildConfiguration,
  BuildResult,
  BuildType,
  BuildStatus,
  BuildStageStatus,
  BuildErrorCode,
} from '../types/android-build';

/**
 * Mock build executor for testing
 */
class MockBuildExecutor extends BaseBuildExecutor {
  protected async executeStages(config: BuildConfiguration): Promise<BuildResult> {
    // Execute mock stages
    await this.executeStage('validation', async () => {
      this.log('Validating build configuration');
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    await this.executeStage('compilation', async () => {
      this.log('Compiling source code');
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    await this.executeStage('packaging', async () => {
      this.log('Packaging APK');
      await new Promise((resolve) => setTimeout(resolve, 150));
    });

    return {
      success: true,
      artifactPath: '/build/outputs/app.apk',
      artifactSize: 45000000,
      checksum: 'abc123def456',
      duration: 450,
      stages: this.stages,
      completedAt: new Date(),
    };
  }
}

/**
 * Mock build executor that fails
 */
class FailingMockBuildExecutor extends BaseBuildExecutor {
  protected async executeStages(config: BuildConfiguration): Promise<BuildResult> {
    await this.executeStage('validation', async () => {
      this.log('Validating build configuration');
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    await this.executeStage('compilation', async () => {
      this.log('Compiling source code');
      throw new Error('Compilation failed');
    });

    return {
      success: false,
      artifactPath: '',
      artifactSize: 0,
      checksum: '',
      duration: 100,
      stages: this.stages,
      errors: this.errors,
      completedAt: new Date(),
    };
  }
}

describe('Build Executor', () => {
  let executor: MockBuildExecutor;
  let config: BuildConfiguration;

  beforeEach(() => {
    executor = new MockBuildExecutor();
    config = {
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
  });

  describe('Build Execution', () => {
    it('should execute a successful build', async () => {
      const result = await executor.executeBuild(config);

      expect(result.success).toBe(true);
      expect(result.artifactPath).toBe('/build/outputs/app.apk');
      expect(result.artifactSize).toBe(45000000);
      expect(result.stages.length).toBe(3);
    });

    it('should track build stages', async () => {
      const result = await executor.executeBuild(config);

      expect(result.stages[0].name).toBe('validation');
      expect(result.stages[0].status).toBe(BuildStageStatus.Success);
      expect(result.stages[1].name).toBe('compilation');
      expect(result.stages[2].name).toBe('packaging');
    });

    it('should measure stage duration', async () => {
      const result = await executor.executeBuild(config);

      expect(result.stages[0].duration).toBeGreaterThanOrEqual(100);
      expect(result.stages[1].duration).toBeGreaterThanOrEqual(200);
      expect(result.stages[2].duration).toBeGreaterThanOrEqual(150);
    });

    it('should handle build failure', async () => {
      const failingExecutor = new FailingMockBuildExecutor();
      const result = await failingExecutor.executeBuild(config);

      expect(result.success).toBe(false);
      expect(result.stages.length).toBeGreaterThan(0);
      expect(result.stages.some((s) => s.status === BuildStageStatus.Failed)).toBe(true);
    });
  });

  describe('Progress Tracking', () => {
    it('should provide progress information', async () => {
      const progressPromise = (async () => {
        const progress = executor.getProgress();
        expect(progress.currentStage).toBeDefined();
        expect(progress.stageIndex).toBeGreaterThanOrEqual(0);
        expect(progress.totalStages).toBeGreaterThan(0);
        expect(progress.percentComplete).toBeGreaterThanOrEqual(0);
        expect(progress.percentComplete).toBeLessThanOrEqual(100);
        expect(progress.elapsedTime).toBeGreaterThanOrEqual(0);
        expect(progress.estimatedTimeRemaining).toBeGreaterThanOrEqual(0);
      })();

      await executor.executeBuild(config);
      await progressPromise;
    });

    it('should calculate percentage complete', async () => {
      const buildPromise = executor.executeBuild(config);

      // Check progress during build
      await new Promise((resolve) => setTimeout(resolve, 50));
      const progress = executor.getProgress();

      expect(progress.percentComplete).toBeGreaterThanOrEqual(0);
      expect(progress.percentComplete).toBeLessThanOrEqual(100);

      await buildPromise;
    });
  });

  describe('Logging', () => {
    it('should capture build logs', async () => {
      await executor.executeBuild(config);

      const logs = executor.getLogs();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs.some((log) => log.includes('Starting build'))).toBe(true);
      expect(logs.some((log) => log.includes('validation'))).toBe(true);
    });

    it('should filter logs by stage', async () => {
      await executor.executeBuild(config);

      const compilationLogs = executor.getLogs('compilation');
      expect(compilationLogs.length).toBeGreaterThan(0);
      expect(compilationLogs.some((log) => log.includes('compilation'))).toBe(true);
    });

    it('should return empty logs for non-existent stage', async () => {
      await executor.executeBuild(config);

      const logs = executor.getLogs('non-existent-stage');
      expect(logs.length).toBe(0);
    });
  });

  describe('Build Status', () => {
    it('should provide build status information', async () => {
      const statusPromise = executor.executeBuild(config);

      const status = executor.getStatus();
      expect(status.buildId).toBe('build-123');
      expect(status.profile).toBe('production');
      expect(status.variant).toBe('release');
      expect(status.status).toBe(BuildStatus.InProgress);

      await statusPromise;

      const finalStatus = executor.getStatus();
      expect(finalStatus.status).toBe(BuildStatus.Completed);
    });

    it('should track build start and end times', async () => {
      const beforeBuild = new Date();
      await executor.executeBuild(config);
      const afterBuild = new Date();

      const status = executor.getStatus();
      expect(status.startTime.getTime()).toBeGreaterThanOrEqual(beforeBuild.getTime());
      expect(status.endTime?.getTime()).toBeLessThanOrEqual(afterBuild.getTime());
    });
  });

  describe('Build Cancellation', () => {
    it('should set cancelled flag when cancel is called', async () => {
      await executor.cancelBuild();
      const status = executor.getStatus();
      expect(status.status).toBe(BuildStatus.Cancelled);
    });
  });

  describe('Error Handling', () => {
    it('should handle stage failures gracefully', async () => {
      const failingExecutor = new FailingMockBuildExecutor();
      const result = await failingExecutor.executeBuild(config);

      expect(result.success).toBe(false);
      expect(result.stages.length).toBeGreaterThan(0);
    });

    it('should stop execution on stage failure', async () => {
      const failingExecutor = new FailingMockBuildExecutor();
      const result = await failingExecutor.executeBuild(config);

      // Should have validation and compilation stages, but not packaging
      expect(result.stages.length).toBe(2);
      expect(result.stages[1].status).toBe(BuildStageStatus.Failed);
    });
  });
});
