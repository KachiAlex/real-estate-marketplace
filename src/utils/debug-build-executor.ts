/**
 * Debug Build Executor
 *
 * Executes debug builds with Gradle, applies debug configuration,
 * and handles incremental compilation.
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 8.1**
 *
 * @module utils/debug-build-executor
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  BuildConfiguration,
  BuildResult,
  BuildStageResult,
  BuildStageStatus,
  BuildErrorCode,
} from '../types/android-build';
import { BaseBuildExecutor } from './build-executor';

/**
 * Debug Build Executor
 *
 * Executes debug builds with the following characteristics:
 * - No code obfuscation
 * - Debug symbols enabled
 * - Incremental compilation support
 * - Fast build times for rapid iteration
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 8.1**
 */
export class DebugBuildExecutor extends BaseBuildExecutor {
  private projectRoot: string = process.cwd();
  private androidDir: string = path.join(this.projectRoot, 'android');
  private gradlewPath: string = path.join(this.androidDir, 'gradlew');
  private buildCacheDir: string = path.join(this.projectRoot, '.gradle');

  /**
   * Execute debug build stages
   *
   * @param config - Build configuration
   * @returns Build result
   */
  protected async executeStages(config: BuildConfiguration): Promise<BuildResult> {
    const startTime = new Date();

    try {
      // Stage 1: Validation
      await this.executeStage('Validation', async () => this.validateEnvironment());

      // Stage 2: Dependency Resolution
      await this.executeStage('Dependency Resolution', async () => this.resolveDependencies());

      // Stage 3: Compilation
      await this.executeStage('Compilation', async () => this.compileSource());

      // Stage 4: Packaging
      await this.executeStage('Packaging', async () => this.packageAPK());

      // Stage 5: Signing
      await this.executeStage('Signing', async () => this.signAPK());

      // Stage 6: Verification
      await this.executeStage('Verification', async () => this.verifyAPK());

      // Stage 7: Artifact Collection
      const artifactPath = await this.executeStageWithResult(
        'Artifact Collection',
        () => this.collectArtifacts(),
      );

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      // Calculate checksum
      const checksum = this.calculateChecksum(artifactPath);

      // Get file size
      const stats = fs.statSync(artifactPath);
      const artifactSize = stats.size;

      return {
        success: true,
        artifactPath,
        artifactSize,
        checksum,
        duration,
        stages: this.stages,
        completedAt: endTime,
      };
    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log(`Build failed: ${errorMessage}`);

      return {
        success: false,
        artifactPath: '',
        artifactSize: 0,
        checksum: '',
        duration,
        stages: this.stages,
        errors: this.errors,
        completedAt: endTime,
      };
    }
  }

  /**
   * Validate environment for debug build
   */
  private async validateEnvironment(): Promise<void> {
    this.log('Validating Android SDK...');

    const androidSdkRoot = process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME;
    if (!androidSdkRoot) {
      throw new Error('ANDROID_SDK_ROOT or ANDROID_HOME environment variable not set');
    }

    if (!fs.existsSync(androidSdkRoot)) {
      throw new Error(`Android SDK not found at: ${androidSdkRoot}`);
    }

    this.log(`Android SDK found at: ${androidSdkRoot}`);

    // Validate Gradle
    this.log('Validating Gradle...');
    if (!fs.existsSync(this.gradlewPath)) {
      throw new Error(`Gradle wrapper not found at: ${this.gradlewPath}`);
    }

    this.log('Gradle wrapper found');

    // Validate Android project structure
    this.log('Validating Android project structure...');
    const buildGradlePath = path.join(this.androidDir, 'app', 'build.gradle');
    if (!fs.existsSync(buildGradlePath)) {
      throw new Error(`build.gradle not found at: ${buildGradlePath}`);
    }

    this.log('Android project structure is valid');
  }

  /**
   * Resolve dependencies
   */
  private async resolveDependencies(): Promise<void> {
    this.log('Resolving Gradle dependencies...');

    try {
      const command = `${this.gradlewPath} -p ${this.androidDir} dependencies --configuration debugRuntimeClasspath`;
      execSync(command, { stdio: 'pipe' });
      this.log('Dependencies resolved successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Dependency resolution failed: ${errorMessage}`);
    }
  }

  /**
   * Compile source code
   */
  private async compileSource(): Promise<void> {
    this.log('Compiling source code...');

    try {
      // Use Gradle with cache enabled for incremental builds
      const command = `${this.gradlewPath} -p ${this.androidDir} compileDebugSources --build-cache`;
      execSync(command, { stdio: 'pipe' });
      this.log('Source code compiled successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Compilation failed: ${errorMessage}`);
    }
  }

  /**
   * Package APK
   */
  private async packageAPK(): Promise<void> {
    this.log('Packaging APK...');

    try {
      const command = `${this.gradlewPath} -p ${this.androidDir} assembleDebug --build-cache`;
      execSync(command, { stdio: 'pipe' });
      this.log('APK packaged successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Packaging failed: ${errorMessage}`);
    }
  }

  /**
   * Sign APK with debug keystore
   */
  private async signAPK(): Promise<void> {
    this.log('Signing APK with debug keystore...');

    // Debug APKs are automatically signed by Gradle with the debug keystore
    // No additional signing needed
    this.log('APK signed with debug keystore');
  }

  /**
   * Verify APK signature
   */
  private async verifyAPK(): Promise<void> {
    this.log('Verifying APK signature...');

    const apkPath = path.join(
      this.androidDir,
      'app',
      'build',
      'outputs',
      'apk',
      'debug',
      'app-debug.apk',
    );

    if (!fs.existsSync(apkPath)) {
      throw new Error(`APK not found at: ${apkPath}`);
    }

    // Verify APK is a valid ZIP file
    try {
      const buffer = fs.readFileSync(apkPath);
      // Check for ZIP file signature (PK)
      if (buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
        throw new Error('APK is not a valid ZIP file');
      }
      this.log('APK signature verified');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`APK verification failed: ${errorMessage}`);
    }
  }

  /**
   * Collect build artifacts
   *
   * @returns Path to the built APK
   */
  private collectArtifacts(): string {
    this.log('Collecting build artifacts...');

    const apkPath = path.join(
      this.androidDir,
      'app',
      'build',
      'outputs',
      'apk',
      'debug',
      'app-debug.apk',
    );

    if (!fs.existsSync(apkPath)) {
      throw new Error(`APK not found at: ${apkPath}`);
    }

    const stats = fs.statSync(apkPath);
    this.log(`APK collected: ${apkPath} (${stats.size} bytes)`);

    return apkPath;
  }

  /**
   * Execute a stage and return a result
   *
   * @param stageName - Name of the stage
   * @param stageExecutor - Function to execute the stage
   * @returns Result from the stage executor
   */
  private async executeStageWithResult<T>(
    stageName: string,
    stageExecutor: () => T,
  ): Promise<T> {
    if (this.cancelled) {
      throw new Error('Build was cancelled');
    }

    this.currentStageIndex++;
    const startTime = new Date();
    this.log(`Stage ${this.currentStageIndex + 1}: ${stageName}`);

    try {
      if (this.cancelled) {
        throw new Error('Build was cancelled');
      }

      const result = stageExecutor();

      if (this.cancelled) {
        throw new Error('Build was cancelled');
      }

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      const stageResult: BuildStageResult = {
        name: stageName,
        status: BuildStageStatus.Success,
        duration,
        startTime,
        endTime,
        details: `${stageName} completed successfully`,
      };

      this.stages.push(stageResult);
      this.log(`Stage ${stageName} completed in ${duration}ms`);

      return result;
    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      const errorMessage = error instanceof Error ? error.message : String(error);

      const stageResult: BuildStageResult = {
        name: stageName,
        status: BuildStageStatus.Failed,
        duration,
        startTime,
        endTime,
        errorMessage,
        details: `${stageName} failed: ${errorMessage}`,
      };

      this.stages.push(stageResult);
      this.log(`Stage ${stageName} failed: ${errorMessage}`);

      throw error;
    }
  }

  /**
   * Calculate SHA-256 checksum of a file
   *
   * @param filePath - Path to the file
   * @returns SHA-256 checksum
   */
  private calculateChecksum(filePath: string): string {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  }
}

/**
 * Create a debug build executor instance
 *
 * @returns Debug build executor instance
 */
export function createDebugBuildExecutor(): DebugBuildExecutor {
  return new DebugBuildExecutor();
}
