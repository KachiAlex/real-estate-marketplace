/**
 * Property-Based Tests for Optimization Reporter
 *
 * Tests for optimization reporting properties:
 * - Property 73: Optimization Size Reporting - Size reduction must be reported
 *
 * @module utils/optimization-reporter.properties.test
 */

import fc from 'fast-check';
import {
  calculateOptimizationMetrics,
  identifyOptimizationOpportunities,
  generateOptimizationReport,
  formatBytes,
  compareOptimizationReports,
  generateOptimizationRecommendations,
  OptimizationMetrics,
} from './optimization-reporter';

describe('OptimizationReporter - Property-Based Tests', () => {
  describe('Property 73: Optimization Size Reporting', () => {
    /**
     * **Validates: Requirements 17.4**
     *
     * For any optimization metrics, the size reduction must be accurately
     * calculated and reported.
     */
    it('should accurately calculate size reduction for all valid sizes', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000000, max: 100000000 }),
          fc.integer({ min: 0, max: 50 }),
          (originalSize, reductionPercent) => {
            const reduction = Math.round((originalSize * reductionPercent) / 100);
            const optimizedSize = originalSize - reduction;

            const metrics = calculateOptimizationMetrics(originalSize, optimizedSize);

            // Size reduction must be calculated correctly
            expect(metrics.sizeReduction).toBe(reduction);

            // Reduction percentage must be calculated correctly
            const expectedPercentage = (reduction / originalSize) * 100;
            expect(Math.abs(metrics.reductionPercentage - expectedPercentage)).toBeLessThan(0.01);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * For any optimization metrics, the size reduction must be non-negative
     * and not exceed the original size.
     */
    it('should ensure size reduction is valid', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000000, max: 100000000 }),
          fc.integer({ min: 0, max: 100000000 }),
          (originalSize, optimizedSize) => {
            // Ensure optimized size doesn't exceed original
            const validOptimizedSize = Math.min(optimizedSize, originalSize);

            const metrics = calculateOptimizationMetrics(originalSize, validOptimizedSize);

            // Size reduction must be non-negative
            expect(metrics.sizeReduction).toBeGreaterThanOrEqual(0);

            // Size reduction must not exceed original size
            expect(metrics.sizeReduction).toBeLessThanOrEqual(originalSize);

            // Reduction percentage must be between 0 and 100
            expect(metrics.reductionPercentage).toBeGreaterThanOrEqual(0);
            expect(metrics.reductionPercentage).toBeLessThanOrEqual(100);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * For any optimization metrics with code shrinking, the code shrinking
     * reduction must be included in the total size reduction.
     */
    it('should include code shrinking in total reduction', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000000, max: 100000000 }),
          fc.integer({ min: 0, max: 50000000 }),
          (originalSize, codeShrinkingReduction) => {
            const validCodeReduction = Math.min(codeShrinkingReduction, originalSize);
            const optimizedSize = originalSize - validCodeReduction;

            const metrics = calculateOptimizationMetrics(
              originalSize,
              optimizedSize,
              validCodeReduction
            );

            // Code shrinking reduction must be included
            expect(metrics.codeShrinkingReduction).toBe(validCodeReduction);

            // Total reduction must include code shrinking
            expect(metrics.sizeReduction).toBeGreaterThanOrEqual(validCodeReduction);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * For any optimization metrics with resource shrinking, the resource
     * shrinking reduction must be included in the total size reduction.
     */
    it('should include resource shrinking in total reduction', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000000, max: 100000000 }),
          fc.integer({ min: 0, max: 50000000 }),
          (originalSize, resourceShrinkingReduction) => {
            const validResourceReduction = Math.min(resourceShrinkingReduction, originalSize);
            const optimizedSize = originalSize - validResourceReduction;

            const metrics = calculateOptimizationMetrics(
              originalSize,
              optimizedSize,
              0,
              validResourceReduction
            );

            // Resource shrinking reduction must be included
            expect(metrics.resourceShrinkingReduction).toBe(validResourceReduction);

            // Total reduction must include resource shrinking
            expect(metrics.sizeReduction).toBeGreaterThanOrEqual(validResourceReduction);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * For any optimization report, the report must include accurate metrics
     * and be properly formatted.
     */
    it('should generate valid optimization reports', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5, maxLength: 50 }),
          fc.integer({ min: 1000000, max: 100000000 }),
          fc.integer({ min: 0, max: 50 }),
          (buildId, originalSize, reductionPercent) => {
            const reduction = Math.round((originalSize * reductionPercent) / 100);
            const optimizedSize = originalSize - reduction;

            const metrics = calculateOptimizationMetrics(originalSize, optimizedSize);
            const report = generateOptimizationReport(buildId, metrics);

            // Report must include build ID
            expect(report.buildId).toBe(buildId);

            // Report must include timestamp
            expect(report.timestamp).toBeInstanceOf(Date);

            // Report must include metrics
            expect(report.metrics).toEqual(metrics);

            // Report must include summary
            expect(report.summary).toBeTruthy();
            expect(report.summary.length).toBeGreaterThan(0);

            // Report must include opportunities array
            expect(Array.isArray(report.opportunities)).toBe(true);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * For any size value, the formatBytes function must produce a valid
     * human-readable format.
     */
    it('should format bytes correctly for all sizes', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000000000 }),
          (bytes) => {
            const formatted = formatBytes(bytes);

            // Formatted string must not be empty
            expect(formatted.length).toBeGreaterThan(0);

            // Formatted string must contain a unit
            expect(formatted).toMatch(/[KMGB]/);

            // Formatted string must be parseable
            const parts = formatted.split(' ');
            expect(parts.length).toBe(2);

            const number = parseFloat(parts[0]);
            expect(Number.isNaN(number)).toBe(false);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * For any two optimization reports, the comparison must accurately
     * identify improvements, regressions, or no change.
     */
    it('should accurately compare optimization reports', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000000, max: 100000000 }),
          fc.integer({ min: 0, max: 50 }),
          fc.integer({ min: -50, max: 50 }),
          (originalSize, firstReductionPercent, secondReductionDelta) => {
            const firstReduction = Math.round((originalSize * firstReductionPercent) / 100);
            const firstOptimizedSize = originalSize - firstReduction;

            const secondReductionPercent = Math.max(
              0,
              Math.min(50, firstReductionPercent + secondReductionDelta)
            );
            const secondReduction = Math.round((originalSize * secondReductionPercent) / 100);
            const secondOptimizedSize = originalSize - secondReduction;

            const metrics1 = calculateOptimizationMetrics(originalSize, firstOptimizedSize);
            const metrics2 = calculateOptimizationMetrics(originalSize, secondOptimizedSize);

            const report1 = generateOptimizationReport('build-1', metrics1);
            const report2 = generateOptimizationReport('build-2', metrics2);

            const comparison = compareOptimizationReports(report1, report2);

            // Comparison must not be empty
            expect(comparison.length).toBeGreaterThan(0);

            // Comparison must contain status
            expect(comparison).toMatch(/IMPROVED|REGRESSED|UNCHANGED/);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * For any optimization metrics, recommendations must be generated
     * and must be actionable.
     */
    it('should generate valid recommendations for all metrics', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000000, max: 100000000 }),
          fc.integer({ min: 0, max: 50 }),
          (originalSize, reductionPercent) => {
            const reduction = Math.round((originalSize * reductionPercent) / 100);
            const optimizedSize = originalSize - reduction;

            const metrics = calculateOptimizationMetrics(originalSize, optimizedSize);
            const recommendations = generateOptimizationRecommendations(metrics);

            // Must generate at least one recommendation
            expect(recommendations.length).toBeGreaterThan(0);

            // All recommendations must be non-empty strings
            recommendations.forEach((recommendation) => {
              expect(typeof recommendation).toBe('string');
              expect(recommendation.length).toBeGreaterThan(0);
            });

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * For any optimization opportunities, each opportunity must have
     * valid properties and be actionable.
     */
    it('should identify valid optimization opportunities', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000000, max: 100000000 }),
          fc.integer({ min: 0, max: 50 }),
          (originalSize, reductionPercent) => {
            const reduction = Math.round((originalSize * reductionPercent) / 100);
            const optimizedSize = originalSize - reduction;

            const metrics = calculateOptimizationMetrics(originalSize, optimizedSize);
            const opportunities = identifyOptimizationOpportunities(metrics);

            // All opportunities must have valid properties
            opportunities.forEach((opportunity) => {
              expect(['code', 'resource', 'configuration']).toContain(opportunity.type);
              expect(opportunity.description.length).toBeGreaterThan(0);
              expect(opportunity.estimatedSavings).toBeGreaterThanOrEqual(0);
              expect(['high', 'medium', 'low']).toContain(opportunity.priority);
              expect(opportunity.recommendation.length).toBeGreaterThan(0);
            });

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Metrics Consistency Properties', () => {
    /**
     * For any optimization metrics, the sum of reduction components must
     * not exceed the total size reduction.
     */
    it('should maintain consistent reduction components', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000000, max: 100000000 }),
          fc.integer({ min: 0, max: 50000000 }),
          fc.integer({ min: 0, max: 50000000 }),
          (originalSize, codeShrinking, resourceShrinking) => {
            const totalReduction = Math.min(
              codeShrinking + resourceShrinking,
              originalSize
            );
            const optimizedSize = originalSize - totalReduction;

            const metrics = calculateOptimizationMetrics(
              originalSize,
              optimizedSize,
              Math.min(codeShrinking, totalReduction),
              Math.min(resourceShrinking, totalReduction - Math.min(codeShrinking, totalReduction))
            );

            // Sum of components must not exceed total reduction
            const componentSum =
              metrics.codeShrinkingReduction +
              metrics.resourceShrinkingReduction +
              metrics.minificationReduction;
            expect(componentSum).toBeLessThanOrEqual(metrics.sizeReduction + 1); // +1 for rounding

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
