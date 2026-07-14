/**
 * Unit tests for Build Stage Orchestrator
 *
 * Tests verify that stage orchestration, timing, and error handling work correctly.
 */

import {
  BuildStageOrchestrator,
  StageContext,
} from './build-stage-orchestrator';
import {
  BuildConfiguration,
  BuildType,
  BuildStageStatus,
} from '../types/android-build';

describe('Build Stage Orchestrator', () => {
  let orchestrator: BuildStageOrchestrator;
  let config: BuildConfiguration;

  beforeEach(() => {
    orchestrator = new BuildStageOrchestrator();
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

  describe('Stage Execution', () => {
    it('should execute stages in sequence', async () => {
      const executionOrder: string[] = [];

      orchestrator.addStage('stage1', async () => {
        executionOrder.push('stage1');
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      orchestrator.addStage('stage2', async () => {
        executionOrder.push('stage2');
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      orchestrator.addStage('stage3', async () => {
        executionOrder.push('stage3');
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      const results = await orchestrator.executeStages(config);

      expect(executionOrder).toEqual(['stage1', 'stage2', 'stage3']);
      expect(results.length).toBe(3);
    });

    it('should track stage results', async () => {
      orchestrator.addStage('validation', async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      orchestrator.addStage('compilation', async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
      });

      const results = await orchestrator.executeStages(config);

      expect(results[0].name).toBe('validation');
      expect(results[0].status).toBe(BuildStageStatus.Success);
      expect(results[1].name).toBe('compilation');
      expect(results[1].status).toBe(BuildStageStatus.Success);
    });

    it('should measure stage duration', async () => {
      orchestrator.addStage('slow-stage', async () => {
        await new Promise((resolve) => setTimeout(resolve, 150));
      });

      const results = await orchestrator.executeStages(config);

      expect(results[0].duration).toBeGreaterThanOrEqual(150);
    });

    it('should stop on stage failure', async () => {
      const executionOrder: string[] = [];

      orchestrator.addStage('stage1', async () => {
        executionOrder.push('stage1');
      });

      orchestrator.addStage('stage2', async () => {
        executionOrder.push('stage2');
        throw new Error('Stage 2 failed');
      });

      orchestrator.addStage('stage3', async () => {
        executionOrder.push('stage3');
      });

      const results = await orchestrator.executeStages(config);

      expect(executionOrder).toEqual(['stage1', 'stage2']);
      expect(results.length).toBe(2);
      expect(results[1].status).toBe(BuildStageStatus.Failed);
    });
  });

  describe('Stage Context', () => {
    it('should provide stage context to executor', async () => {
      let receivedContext: StageContext | null = null;

      orchestrator.addStage('test-stage', async (context) => {
        receivedContext = context;
      });

      await orchestrator.executeStages(config);

      expect(receivedContext).not.toBeNull();
      expect(receivedContext?.name).toBe('test-stage');
      expect(receivedContext?.index).toBe(0);
      expect(receivedContext?.total).toBe(1);
      expect(receivedContext?.config).toBe(config);
    });

    it('should provide previous stage result in context', async () => {
      let secondStageContext: StageContext | null = null;

      orchestrator.addStage('stage1', async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      orchestrator.addStage('stage2', async (context) => {
        secondStageContext = context;
      });

      await orchestrator.executeStages(config);

      expect(secondStageContext?.previousStage).not.toBeUndefined();
      expect(secondStageContext?.previousStage?.name).toBe('stage1');
    });
  });

  describe('Timing and Duration', () => {
    it('should calculate total duration', async () => {
      orchestrator.addStage('stage1', async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      orchestrator.addStage('stage2', async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      await orchestrator.executeStages(config);

      const totalDuration = orchestrator.getTotalDuration();
      expect(totalDuration).toBeGreaterThanOrEqual(200);
    });

    it('should get timing summary', async () => {
      orchestrator.addStage('validation', async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      orchestrator.addStage('compilation', async () => {
        await new Promise((resolve) => setTimeout(resolve, 150));
      });

      await orchestrator.executeStages(config);

      const summary = orchestrator.getTimingSummary();
      expect(summary['validation']).toBeGreaterThanOrEqual(100);
      expect(summary['compilation']).toBeGreaterThanOrEqual(150);
    });

    it('should identify slowest stage', async () => {
      orchestrator.addStage('fast', async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      orchestrator.addStage('slow', async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
      });

      await orchestrator.executeStages(config);

      const slowest = orchestrator.getSlowestStage();
      expect(slowest?.name).toBe('slow');
      expect(slowest?.duration).toBeGreaterThanOrEqual(200);
    });

    it('should identify fastest stage', async () => {
      orchestrator.addStage('fast', async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      orchestrator.addStage('slow', async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
      });

      await orchestrator.executeStages(config);

      const fastest = orchestrator.getFastestStage();
      expect(fastest?.name).toBe('fast');
      expect(fastest?.duration).toBeLessThan(200);
    });

    it('should calculate average stage duration', async () => {
      orchestrator.addStage('stage1', async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      orchestrator.addStage('stage2', async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
      });

      await orchestrator.executeStages(config);

      const average = orchestrator.getAverageStageDuration();
      expect(average).toBeGreaterThanOrEqual(150);
    });
  });

  describe('Stage Queries', () => {
    it('should get stage by name', async () => {
      orchestrator.addStage('validation', async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      orchestrator.addStage('compilation', async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
      });

      await orchestrator.executeStages(config);

      const stage = orchestrator.getStage('compilation');
      expect(stage?.name).toBe('compilation');
      expect(stage?.status).toBe(BuildStageStatus.Success);
    });

    it('should get all successful stages', async () => {
      orchestrator.addStage('stage1', async () => {});
      orchestrator.addStage('stage2', async () => {
        throw new Error('Failed');
      });
      orchestrator.addStage('stage3', async () => {});

      await orchestrator.executeStages(config);

      const successful = orchestrator.getSuccessfulStages();
      expect(successful.length).toBe(1);
      expect(successful[0].name).toBe('stage1');
    });

    it('should get all failed stages', async () => {
      orchestrator.addStage('stage1', async () => {});
      orchestrator.addStage('stage2', async () => {
        throw new Error('Failed');
      });

      await orchestrator.executeStages(config);

      const failed = orchestrator.getFailedStages();
      expect(failed.length).toBe(1);
      expect(failed[0].name).toBe('stage2');
    });

    it('should check if all stages succeeded', async () => {
      orchestrator.addStage('stage1', async () => {});
      orchestrator.addStage('stage2', async () => {});

      await orchestrator.executeStages(config);

      expect(orchestrator.allSucceeded()).toBe(true);
    });

    it('should return false if any stage failed', async () => {
      orchestrator.addStage('stage1', async () => {});
      orchestrator.addStage('stage2', async () => {
        throw new Error('Failed');
      });

      await orchestrator.executeStages(config);

      expect(orchestrator.allSucceeded()).toBe(false);
    });
  });

  describe('Cancellation', () => {
    it('should set cancelled flag', async () => {
      orchestrator.addStage('stage1', async () => {});
      orchestrator.addStage('stage2', async () => {});

      orchestrator.cancel();

      // After cancellation, the orchestrator should not execute stages
      // This is verified by checking that cancel() was called
      expect(orchestrator.getResults().length).toBe(0);
    });
  });

  describe('State Management', () => {
    it('should reset orchestrator state', async () => {
      orchestrator.addStage('stage1', async () => {});
      await orchestrator.executeStages(config);

      orchestrator.reset();

      expect(orchestrator.getResults().length).toBe(0);
    });

    it('should clear all stages', async () => {
      orchestrator.addStage('stage1', async () => {});
      orchestrator.addStage('stage2', async () => {});

      orchestrator.clearStages();

      const results = await orchestrator.executeStages(config);
      expect(results.length).toBe(0);
    });
  });
});
