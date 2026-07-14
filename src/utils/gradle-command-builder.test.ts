/**
 * Gradle Command Builder Tests
 *
 * Unit tests for the GradleCommandBuilder class
 */

import { GradleCommandBuilder, createGradleCommandBuilder } from './gradle-command-builder';

describe('GradleCommandBuilder', () => {
  const gradlewPath = '/path/to/gradlew';
  const androidDir = '/path/to/android';

  describe('buildCommand', () => {
    it('should build a basic command', () => {
      const command = GradleCommandBuilder.buildCommand({
        gradlewPath,
        androidDir,
        task: 'assembleDebug',
      });

      expect(command).toContain(gradlewPath);
      expect(command).toContain('-p');
      expect(command).toContain(androidDir);
      expect(command).toContain('assembleDebug');
    });

    it('should include build cache flag when enabled', () => {
      const command = GradleCommandBuilder.buildCommand({
        gradlewPath,
        androidDir,
        task: 'assembleDebug',
        cacheEnabled: true,
      });

      expect(command).toContain('--build-cache');
    });

    it('should exclude build cache flag when disabled', () => {
      const command = GradleCommandBuilder.buildCommand({
        gradlewPath,
        androidDir,
        task: 'assembleDebug',
        cacheEnabled: false,
      });

      expect(command).not.toContain('--build-cache');
    });

    it('should include parallel flag when enabled', () => {
      const command = GradleCommandBuilder.buildCommand({
        gradlewPath,
        androidDir,
        task: 'assembleDebug',
        parallel: true,
      });

      expect(command).toContain('--parallel');
    });

    it('should include offline flag when enabled', () => {
      const command = GradleCommandBuilder.buildCommand({
        gradlewPath,
        androidDir,
        task: 'assembleDebug',
        offline: true,
      });

      expect(command).toContain('--offline');
    });

    it('should include custom properties', () => {
      const command = GradleCommandBuilder.buildCommand({
        gradlewPath,
        androidDir,
        task: 'assembleDebug',
        properties: {
          'org.gradle.parallel': 'true',
          'org.gradle.caching': 'true',
        },
      });

      expect(command).toContain('-Porg.gradle.parallel=true');
      expect(command).toContain('-Porg.gradle.caching=true');
    });

    it('should include additional arguments', () => {
      const command = GradleCommandBuilder.buildCommand({
        gradlewPath,
        androidDir,
        task: 'assembleDebug',
        additionalArgs: ['--info', '--stacktrace'],
      });

      expect(command).toContain('--info');
      expect(command).toContain('--stacktrace');
    });
  });

  describe('buildDebugCommand', () => {
    it('should build a debug command', () => {
      const command = GradleCommandBuilder.buildDebugCommand(gradlewPath, androidDir);

      expect(command).toContain('assembleDebug');
      expect(command).toContain('--build-cache');
      expect(command).toContain('--parallel');
    });
  });

  describe('buildReleaseCommand', () => {
    it('should build a release command', () => {
      const command = GradleCommandBuilder.buildReleaseCommand(gradlewPath, androidDir);

      expect(command).toContain('assembleRelease');
      expect(command).toContain('--build-cache');
      expect(command).toContain('--parallel');
    });
  });

  describe('buildAABCommand', () => {
    it('should build an AAB command', () => {
      const command = GradleCommandBuilder.buildAABCommand(gradlewPath, androidDir);

      expect(command).toContain('bundleRelease');
      expect(command).toContain('--build-cache');
      expect(command).toContain('--parallel');
    });
  });

  describe('buildDependencyCommand', () => {
    it('should build a dependency command', () => {
      const command = GradleCommandBuilder.buildDependencyCommand(
        gradlewPath,
        androidDir,
        'debugRuntimeClasspath',
      );

      expect(command).toContain('dependencies');
      expect(command).toContain('--configuration');
      expect(command).toContain('debugRuntimeClasspath');
    });
  });

  describe('buildCompileCommand', () => {
    it('should build a debug compile command', () => {
      const command = GradleCommandBuilder.buildCompileCommand(gradlewPath, androidDir, 'debug');

      expect(command).toContain('compileDebugSources');
      expect(command).toContain('--build-cache');
      expect(command).toContain('--parallel');
    });

    it('should build a release compile command', () => {
      const command = GradleCommandBuilder.buildCompileCommand(gradlewPath, androidDir, 'release');

      expect(command).toContain('compileReleaseSources');
      expect(command).toContain('--build-cache');
      expect(command).toContain('--parallel');
    });
  });

  describe('buildCleanCommand', () => {
    it('should build a clean command', () => {
      const command = GradleCommandBuilder.buildCleanCommand(gradlewPath, androidDir);

      expect(command).toContain('clean');
    });
  });

  describe('extractTask', () => {
    it('should extract task from command', () => {
      const command = `${gradlewPath} -p ${androidDir} assembleDebug --build-cache`;
      const task = GradleCommandBuilder.extractTask(command);

      expect(task).toBe('assembleDebug');
    });

    it('should extract task even with trailing flags', () => {
      const command = `${gradlewPath} -p ${androidDir} bundleRelease --build-cache --parallel`;
      const task = GradleCommandBuilder.extractTask(command);

      expect(task).toBe('bundleRelease');
    });
  });

  describe('hasCacheEnabled', () => {
    it('should detect cache enabled', () => {
      const command = `${gradlewPath} -p ${androidDir} assembleDebug --build-cache`;
      expect(GradleCommandBuilder.hasCacheEnabled(command)).toBe(true);
    });

    it('should detect cache disabled', () => {
      const command = `${gradlewPath} -p ${androidDir} assembleDebug`;
      expect(GradleCommandBuilder.hasCacheEnabled(command)).toBe(false);
    });
  });

  describe('hasParallel', () => {
    it('should detect parallel enabled', () => {
      const command = `${gradlewPath} -p ${androidDir} assembleDebug --parallel`;
      expect(GradleCommandBuilder.hasParallel(command)).toBe(true);
    });

    it('should detect parallel disabled', () => {
      const command = `${gradlewPath} -p ${androidDir} assembleDebug`;
      expect(GradleCommandBuilder.hasParallel(command)).toBe(false);
    });
  });

  describe('getCacheStatistics', () => {
    it('should get cache statistics', () => {
      const command = `${gradlewPath} -p ${androidDir} assembleDebug --build-cache --parallel`;
      const stats = GradleCommandBuilder.getCacheStatistics(command);

      expect(stats.cacheEnabled).toBe(true);
      expect(stats.parallelEnabled).toBe(true);
    });

    it('should get cache statistics with no flags', () => {
      const command = `${gradlewPath} -p ${androidDir} assembleDebug`;
      const stats = GradleCommandBuilder.getCacheStatistics(command);

      expect(stats.cacheEnabled).toBe(false);
      expect(stats.parallelEnabled).toBe(false);
    });
  });

  describe('createGradleCommandBuilder', () => {
    it('should return GradleCommandBuilder class', () => {
      const builder = createGradleCommandBuilder();
      expect(builder).toBe(GradleCommandBuilder);
    });
  });
});
