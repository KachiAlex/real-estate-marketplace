/**
 * Build Executor Interface and Base Implementation
 *
 * Defines the contract for build execution and provides base implementation
 * for managing build stages, progress tracking, and error handling.
 *
 * @module utils/build-executor
 */

import {
  BuildConfiguration,
  BuildResult,
  BuildProgress,
  BuildStageResult,
  BuildStage,
  BuildStageStatus,
  BuildError,
  BuildErrorCode,
  BuildStatus,
  BuildStatusInfo,
} from '../types/android-build';

/**
 * Build executor interface
 *
 * Defines the contract for executing builds with progress tracking and error handling.
 *
 * **Validates: Requirements 1.1, 2.1, 3.1, 7.1**
 */
export interface IBuildExecutor {
  /**
   * Execute a build with the specified configuration
   *
   * @param config - Build configuration
   * @returns Build result
   */
  executeBuild(config: BuildConfiguration): Promise<BuildResult>;

  /**
   * Get current build progress
   *
   * @returns Current progress information
   */
  getProgress(): BuildProgress;

  /**
   * Cancel ongoing build
   *
   * @returns Promise that resolves when build is cancelled
   */
  cancelBuild(): Promise<void>;

  /**
   * Get build logs
   *
   * @param stage - Optional stage name to filter logs
   * @returns Array of log lines
   */
  getLogs(stage?: string): string[];

  /**
   * Get current build status
   *
   * @returns Current build status
   */
  getStatus(): BuildStatusInfo;
}

/**
 * Base build executor implementation
 *
 * Provides common functionality for build execution including:
 * - Stage management and tracking
 * - Progress calculation
 * - Error handling
 * - Logging
 *
 * **Validates: Requirements 1.1, 2.1, 3.1, 7.1**
 */
export abstract class BaseBuildExecutor implements IBuildExecutor {
  protected buildId: string = '';
  protected config: BuildConfiguration | null = null;
  protected status: BuildStatus = BuildStatus.Queued;
  protected stages: BuildStageResult[] = [];
  protected currentStageIndex: number = -1;
  protected logs: string[] = [];
  protected errors: BuildError[] = [];
  protected startTime: Date | null = null;
  protected endTime: Date | null = null;
  protected cancelled: boolean = false;

  /**
   * Execute a build
   *
   * @param config - Build configuration
   * @returns Build result
   */
  async executeBuild(config: BuildConfiguration): Promise<BuildResult> {
    this.buildId = config.buildId;
    this.config = config;
    this.status = BuildStatus.InProgress;
    this.startTime = new Date();
    this.stages = [];
    this.logs = [];
    this.errors = [];
    this.currentStageIndex = -1;
    this.cancelled = false;

    this.log(`Starting build: ${config.buildId}`);
    this.log(`Profile: ${config.profile}`);
    this.log(`Variant: ${config.variant}`);

    try {
      // Execute build stages
      const result = await this.executeStages(config);

      this.status = result.success ? BuildStatus.Completed : BuildStatus.Failed;
      this.endTime = new Date();

      return result;
    } catch (error) {
      this.status = BuildStatus.Failed;
      this.endTime = new Date();

      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log(`Build failed: ${errorMessage}`);

      return {
        success: false,
        artifactPath: '',
        artifactSize: 0,
        checksum: '',
        duration: this.endTime.getTime() - this.startTime.getTime(),
        stages: this.stages,
        errors: this.errors,
        completedAt: this.endTime,
      };
    }
  }

  /**
   * Execute build stages
   *
   * @param config - Build configuration
   * @returns Build result
   */
  protected abstract executeStages(config: BuildConfiguration): Promise<BuildResult>;

  /**
   * Execute a single build stage
   *
   * @param stageName - Name of the stage
   * @param stageExecutor - Function to execute the stage
   * @returns Stage result
   */
  protected async executeStage(
    stageName: string,
    stageExecutor: () => Promise<void>,
  ): Promise<BuildStageResult> {
    if (this.cancelled) {
      return {
        name: stageName,
        status: BuildStageStatus.Skipped,
        duration: 0,
        startTime: new Date(),
        endTime: new Date(),
        details: 'Build was cancelled',
      };
    }

    this.currentStageIndex++;
    const startTime = new Date();
    this.log(`Stage ${this.currentStageIndex + 1}: ${stageName}`);

    try {
      // Check for cancellation before executing
      if (this.cancelled) {
        throw new Error('Build was cancelled');
      }

      await stageExecutor();

      // Check for cancellation after executing
      if (this.cancelled) {
        throw new Error('Build was cancelled');
      }

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      const result: BuildStageResult = {
        name: stageName,
        status: BuildStageStatus.Success,
        duration,
        startTime,
        endTime,
        details: `${stageName} completed successfully`,
      };

      this.stages.push(result);
      this.log(`Stage ${stageName} completed in ${duration}ms`);

      return result;
    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      const errorMessage = error instanceof Error ? error.message : String(error);

      const result: BuildStageResult = {
        name: stageName,
        status: BuildStageStatus.Failed,
        duration,
        startTime,
        endTime,
        errorMessage,
        details: `${stageName} failed: ${errorMessage}`,
      };

      this.stages.push(result);
      this.log(`Stage ${stageName} failed: ${errorMessage}`);

      throw error;
    }
  }

  /**
   * Get current build progress
   *
   * @returns Progress information
   */
  getProgress(): BuildProgress {
    const totalStages = 7; // Default number of stages
    const currentStageIndex = Math.max(0, this.currentStageIndex);
    const percentComplete = (currentStageIndex / totalStages) * 100;

    const elapsedTime = this.startTime ? new Date().getTime() - this.startTime.getTime() : 0;
    const estimatedTotalTime = elapsedTime / (percentComplete / 100 || 1);
    const estimatedTimeRemaining = Math.max(0, estimatedTotalTime - elapsedTime);

    return {
      currentStage: this.stages[currentStageIndex]?.name || 'initialization',
      stageIndex: currentStageIndex,
      totalStages,
      percentComplete: Math.min(100, percentComplete),
      estimatedTimeRemaining,
      elapsedTime,
      message: `Building ${this.config?.variant || 'unknown'}...`,
    };
  }

  /**
   * Cancel ongoing build
   *
   * @returns Promise that resolves when build is cancelled
   */
  async cancelBuild(): Promise<void> {
    this.cancelled = true;
    this.status = BuildStatus.Cancelled;
    this.log('Build cancelled by user');
  }

  /**
   * Get build logs
   *
   * @param stage - Optional stage name to filter logs
   * @returns Array of log lines
   */
  getLogs(stage?: string): string[] {
    if (!stage) {
      return this.logs;
    }

    // Filter logs by stage
    const stageIndex = this.stages.findIndex((s) => s.name === stage);
    if (stageIndex === -1) {
      return [];
    }

    // Find logs between this stage and the next
    const stageStartMarker = `Stage ${stageIndex + 1}: ${stage}`;
    const nextStageMarker = stageIndex + 1 < this.stages.length ? `Stage ${stageIndex + 2}:` : null;

    let inStage = false;
    const stageLogs: string[] = [];

    for (const log of this.logs) {
      if (log.includes(stageStartMarker)) {
        inStage = true;
      }

      if (inStage) {
        if (nextStageMarker && log.includes(nextStageMarker)) {
          break;
        }
        stageLogs.push(log);
      }
    }

    return stageLogs;
  }

  /**
   * Get current build status
   *
   * @returns Build status information
   */
  getStatus(): BuildStatusInfo {
    return {
      buildId: this.buildId,
      status: this.status,
      profile: this.config?.profile || '',
      variant: this.config?.variant || '',
      startTime: this.startTime || new Date(),
      endTime: this.endTime,
      currentStage: this.stages[this.currentStageIndex]?.name || '',
      progress: this.getProgress(),
    };
  }

  /**
   * Log a message
   *
   * @param message - Message to log
   */
  protected log(message: string): void {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] ${message}`;
    this.logs.push(logLine);
    console.log(logLine);
  }

  /**
   * Add an error
   *
   * @param error - Error to add
   */
  protected addError(error: BuildError): void {
    this.errors.push(error);
  }

  /**
   * Create a build error
   *
   * @param code - Error code
   * @param stage - Stage where error occurred
   * @param message - Error message
   * @param details - Error details
   * @param remediation - Remediation steps
   * @returns Build error
   */
  protected createError(
    code: BuildErrorCode,
    stage: string,
    message: string,
    details: string,
    remediation: string,
  ): BuildError {
    return {
      code,
      stage,
      message,
      details,
      remediation,
      timestamp: new Date(),
    };
  }
}

/**
 * Create a base build executor instance
 *
 * @returns Base build executor instance
 */
export function createBaseBuildExecutor(): BaseBuildExecutor {
  throw new Error('BaseBuildExecutor is abstract and cannot be instantiated directly');
}
