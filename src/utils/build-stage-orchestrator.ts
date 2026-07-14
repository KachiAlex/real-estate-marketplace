/**
 * Build Stage Orchestrator
 *
 * Manages sequential build stages, tracks timing and duration, and handles
 * stage transitions and error states.
 *
 * @module utils/build-stage-orchestrator
 */

import {
  BuildStageResult,
  BuildStage,
  BuildStageStatus,
  BuildConfiguration,
} from '../types/android-build';

/**
 * Stage execution context
 */
export interface StageContext {
  /** Stage name */
  name: string;

  /** Stage index (0-based) */
  index: number;

  /** Total number of stages */
  total: number;

  /** Build configuration */
  config: BuildConfiguration;

  /** Previous stage result (if any) */
  previousStage?: BuildStageResult;
}

/**
 * Stage executor function
 */
export type StageExecutor = (context: StageContext) => Promise<void>;

/**
 * Build Stage Orchestrator
 *
 * Manages the execution of build stages in sequence, tracking timing,
 * duration, and handling transitions between stages.
 *
 * **Validates: Requirements 7.1, 7.3, 14.1**
 */
export class BuildStageOrchestrator {
  private stages: Array<{ name: string; executor: StageExecutor }> = [];
  private results: BuildStageResult[] = [];
  private cancelled: boolean = false;

  /**
   * Add a stage to the orchestrator
   *
   * @param name - Stage name
   * @param executor - Stage executor function
   */
  addStage(name: string, executor: StageExecutor): void {
    this.stages.push({ name, executor });
  }

  /**
   * Execute all stages in sequence
   *
   * @param config - Build configuration
   * @returns Array of stage results
   */
  async executeStages(config: BuildConfiguration): Promise<BuildStageResult[]> {
    this.results = [];
    this.cancelled = false;

    for (let i = 0; i < this.stages.length; i++) {
      if (this.cancelled) {
        break;
      }

      const stage = this.stages[i];
      const context: StageContext = {
        name: stage.name,
        index: i,
        total: this.stages.length,
        config,
        previousStage: this.results[i - 1],
      };

      const result = await this.executeStage(stage.name, stage.executor, context);
      this.results.push(result);

      // Stop on failure
      if (result.status === BuildStageStatus.Failed) {
        break;
      }
    }

    return this.results;
  }

  /**
   * Execute a single stage
   *
   * @param stageName - Stage name
   * @param executor - Stage executor function
   * @param context - Stage context
   * @returns Stage result
   */
  private async executeStage(
    stageName: string,
    executor: StageExecutor,
    context: StageContext,
  ): Promise<BuildStageResult> {
    const startTime = new Date();

    try {
      await executor(context);

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      return {
        name: stageName,
        status: BuildStageStatus.Success,
        duration,
        startTime,
        endTime,
        details: `${stageName} completed successfully in ${duration}ms`,
      };
    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      const errorMessage = error instanceof Error ? error.message : String(error);

      return {
        name: stageName,
        status: BuildStageStatus.Failed,
        duration,
        startTime,
        endTime,
        errorMessage,
        details: `${stageName} failed after ${duration}ms: ${errorMessage}`,
      };
    }
  }

  /**
   * Cancel stage execution
   */
  cancel(): void {
    this.cancelled = true;
  }

  /**
   * Get stage results
   *
   * @returns Array of stage results
   */
  getResults(): BuildStageResult[] {
    return this.results;
  }

  /**
   * Get total duration of all stages
   *
   * @returns Total duration in milliseconds
   */
  getTotalDuration(): number {
    return this.results.reduce((total, stage) => total + stage.duration, 0);
  }

  /**
   * Get stage by name
   *
   * @param name - Stage name
   * @returns Stage result or undefined
   */
  getStage(name: string): BuildStageResult | undefined {
    return this.results.find((stage) => stage.name === name);
  }

  /**
   * Get all successful stages
   *
   * @returns Array of successful stage results
   */
  getSuccessfulStages(): BuildStageResult[] {
    return this.results.filter((stage) => stage.status === BuildStageStatus.Success);
  }

  /**
   * Get all failed stages
   *
   * @returns Array of failed stage results
   */
  getFailedStages(): BuildStageResult[] {
    return this.results.filter((stage) => stage.status === BuildStageStatus.Failed);
  }

  /**
   * Check if all stages succeeded
   *
   * @returns True if all stages succeeded
   */
  allSucceeded(): boolean {
    return this.results.length > 0 && this.results.every((stage) => stage.status === BuildStageStatus.Success);
  }

  /**
   * Get stage timing summary
   *
   * @returns Object with stage names and durations
   */
  getTimingSummary(): Record<string, number> {
    const summary: Record<string, number> = {};

    for (const stage of this.results) {
      summary[stage.name] = stage.duration;
    }

    return summary;
  }

  /**
   * Get slowest stage
   *
   * @returns Slowest stage result or undefined
   */
  getSlowestStage(): BuildStageResult | undefined {
    if (this.results.length === 0) {
      return undefined;
    }

    return this.results.reduce((slowest, current) =>
      current.duration > slowest.duration ? current : slowest,
    );
  }

  /**
   * Get fastest stage
   *
   * @returns Fastest stage result or undefined
   */
  getFastestStage(): BuildStageResult | undefined {
    if (this.results.length === 0) {
      return undefined;
    }

    return this.results.reduce((fastest, current) =>
      current.duration < fastest.duration ? current : fastest,
    );
  }

  /**
   * Get average stage duration
   *
   * @returns Average duration in milliseconds
   */
  getAverageStageDuration(): number {
    if (this.results.length === 0) {
      return 0;
    }

    return this.getTotalDuration() / this.results.length;
  }

  /**
   * Reset orchestrator state
   */
  reset(): void {
    this.results = [];
    this.cancelled = false;
  }

  /**
   * Clear all stages
   */
  clearStages(): void {
    this.stages = [];
    this.results = [];
    this.cancelled = false;
  }
}

/**
 * Create a build stage orchestrator instance
 *
 * @returns BuildStageOrchestrator instance
 */
export function createBuildStageOrchestrator(): BuildStageOrchestrator {
  return new BuildStageOrchestrator();
}
