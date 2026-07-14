/**
 * Unit Tests for Optimization Reporter
 *
 * Tests for optimization metrics calculation, reporting, and recommendations.
 *
 * @module utils/optimization-reporter.test
 */

import {
  calculateOptimizationMetrics,
  identifyOptimizationOpportunities,
  generateOptimizationReport,
  formatBytes,
  compareOptimizationReports,
  generateOptimizationRecommendations,
  OptimizationMetrics,
  OptimizationReport,
} from './optimization-reporter';

describe('OptimizationReporter', () => {
  describe('calculateOptimizationMetrics', () => {
    it('should calculate metrics with no reduction', () => {
      const metrics = calculateOptimizationMetrics(10000000, 10000000);

      expect(metrics.originalSize).toBe(10000000);
      expect(metrics.optimizedSize).toBe(10000000);
      expect(metrics.sizeReduction).toBe(0);
      expect(metrics.reductionPercentage).toBe(0);
    });

    it('should calculate metrics with size reduction', () => {
      const metrics = calculateOptimizationMetrics(10000000, 8000000);

      expect(metrics.originalSize).toBe(10000000);
      expect(metrics.optimizedSize).toBe(8000000);
      expect(metrics.sizeReduction).toBe(2000000);
      expect(metrics.reductionPercentage).toBe(20);
    });

    it('should calculate metrics with code shrinking reduction', () => {
      const metrics = calculateOptimizationMetrics(10000000, 8000000, 1000000);

      expect(metrics.codeShrinkingReduction).toBe(1000000);
      expect(metrics.sizeReduction).toBe(2000000);
    });

    it('should calculate metrics with resource shrinking reduction', () => {
      const metrics = calculateOptimizationMetrics(10000000, 8000000, 0, 1000000);

      expect(metrics.resourceShrinkingReduction).toBe(1000000);
      expect(metrics.sizeReduction).toBe(2000000);
    });

    it('should calculate metrics with all reduction types', () => {
      const metrics = calculateOptimizationMetrics(10000000, 7000000, 1500000, 1000000);

      expect(metrics.codeShrinkingReduction).toBe(1500000);
      expect(metrics.resourceShrinkingReduction).toBe(1000000);
      expect(metrics.minificationReduction).toBe(500000);
      expect(metrics.sizeReduction).toBe(3000000);
    });

    it('should handle zero original size', () => {
      const metrics = calculateOptimizationMetrics(0, 0);

      expect(metrics.reductionPercentage).toBe(0);
    });

    it('should round percentage to 2 decimal places', () => {
      const metrics = calculateOptimizationMetrics(10000000, 9999999);

      expect(metrics.reductionPercentage).toBeLessThan(0.01);
    });
  });

  describe('identifyOptimizationOpportunities', () => {
    it('should identify no opportunities for well-optimized build', () => {
      const metrics = calculateOptimizationMetrics(10000000, 7000000, 2000000, 1000000);
      const opportunities = identifyOptimizationOpportunities(metrics);

      expect(opportunities.length).toBe(0);
    });

    it('should identify code shrinking opportunity', () => {
      const metrics = calculateOptimizationMetrics(10000000, 9500000, 100000);
      const opportunities = identifyOptimizationOpportunities(metrics);

      const codeOpportunity = opportunities.find((o) => o.type === 'code');
      expect(codeOpportunity).toBeDefined();
    });

    it('should identify resource shrinking opportunity', () => {
      const metrics = calculateOptimizationMetrics(10000000, 9500000, 0, 100000);
      const opportunities = identifyOptimizationOpportunities(metrics);

      const resourceOpportunity = opportunities.find((o) => o.type === 'resource');
      expect(resourceOpportunity).toBeDefined();
    });

    it('should identify configuration opportunity for low reduction', () => {
      const metrics = calculateOptimizationMetrics(10000000, 9500000);
      const opportunities = identifyOptimizationOpportunities(metrics);

      const configOpportunity = opportunities.find((o) => o.type === 'configuration');
      expect(configOpportunity).toBeDefined();
    });

    it('should identify opportunity for large APK', () => {
      const metrics = calculateOptimizationMetrics(60000000, 50000000);
      const opportunities = identifyOptimizationOpportunities(metrics);

      expect(opportunities.length).toBeGreaterThan(0);
    });

    it('should set priority levels correctly', () => {
      const metrics = calculateOptimizationMetrics(10000000, 9500000);
      const opportunities = identifyOptimizationOpportunities(metrics);

      opportunities.forEach((opportunity) => {
        expect(['high', 'medium', 'low']).toContain(opportunity.priority);
      });
    });

    it('should provide recommendations for each opportunity', () => {
      const metrics = calculateOptimizationMetrics(10000000, 9500000);
      const opportunities = identifyOptimizationOpportunities(metrics);

      opportunities.forEach((opportunity) => {
        expect(opportunity.recommendation).toBeTruthy();
        expect(opportunity.recommendation.length).toBeGreaterThan(0);
      });
    });
  });

  describe('generateOptimizationReport', () => {
    it('should generate valid optimization report', () => {
      const metrics = calculateOptimizationMetrics(10000000, 8000000);
      const report = generateOptimizationReport('build-123', metrics);

      expect(report.buildId).toBe('build-123');
      expect(report.timestamp).toBeInstanceOf(Date);
      expect(report.metrics).toEqual(metrics);
      expect(report.summary).toBeTruthy();
    });

    it('should include metrics in summary', () => {
      const metrics = calculateOptimizationMetrics(10000000, 8000000);
      const report = generateOptimizationReport('build-123', metrics);

      expect(report.summary).toContain('build-123');
      expect(report.summary).toContain('20');
    });

    it('should include opportunities in report', () => {
      const metrics = calculateOptimizationMetrics(10000000, 9500000);
      const report = generateOptimizationReport('build-123', metrics);

      expect(report.opportunities).toBeDefined();
      expect(Array.isArray(report.opportunities)).toBe(true);
    });

    it('should format summary properly', () => {
      const metrics = calculateOptimizationMetrics(10000000, 8000000);
      const report = generateOptimizationReport('build-123', metrics);

      expect(report.summary).toContain('Original Size');
      expect(report.summary).toContain('Optimized Size');
      expect(report.summary).toContain('Size Reduction');
    });
  });

  describe('formatBytes', () => {
    it('should format zero bytes', () => {
      expect(formatBytes(0)).toBe('0 B');
    });

    it('should format bytes', () => {
      expect(formatBytes(512)).toContain('B');
    });

    it('should format kilobytes', () => {
      expect(formatBytes(1024)).toContain('KB');
    });

    it('should format megabytes', () => {
      expect(formatBytes(1024 * 1024)).toContain('MB');
    });

    it('should format gigabytes', () => {
      expect(formatBytes(1024 * 1024 * 1024)).toContain('GB');
    });

    it('should round to 2 decimal places', () => {
      const formatted = formatBytes(1536);
      const parts = formatted.split(' ');
      const number = parseFloat(parts[0]);

      expect(number).toBeLessThanOrEqual(1.5);
    });

    it('should handle large numbers', () => {
      const formatted = formatBytes(50000000);
      expect(formatted).toContain('MB');
    });
  });

  describe('compareOptimizationReports', () => {
    it('should identify improvement', () => {
      const metrics1 = calculateOptimizationMetrics(10000000, 8000000);
      const metrics2 = calculateOptimizationMetrics(10000000, 7000000);
      const report1 = generateOptimizationReport('build-1', metrics1);
      const report2 = generateOptimizationReport('build-2', metrics2);

      const comparison = compareOptimizationReports(report1, report2);

      expect(comparison).toContain('IMPROVED');
    });

    it('should identify regression', () => {
      const metrics1 = calculateOptimizationMetrics(10000000, 7000000);
      const metrics2 = calculateOptimizationMetrics(10000000, 8000000);
      const report1 = generateOptimizationReport('build-1', metrics1);
      const report2 = generateOptimizationReport('build-2', metrics2);

      const comparison = compareOptimizationReports(report1, report2);

      expect(comparison).toContain('REGRESSED');
    });

    it('should identify no change', () => {
      const metrics1 = calculateOptimizationMetrics(10000000, 8000000);
      const metrics2 = calculateOptimizationMetrics(10000000, 8000000);
      const report1 = generateOptimizationReport('build-1', metrics1);
      const report2 = generateOptimizationReport('build-2', metrics2);

      const comparison = compareOptimizationReports(report1, report2);

      expect(comparison).toContain('UNCHANGED');
    });

    it('should calculate size difference', () => {
      const metrics1 = calculateOptimizationMetrics(10000000, 8000000);
      const metrics2 = calculateOptimizationMetrics(10000000, 7000000);
      const report1 = generateOptimizationReport('build-1', metrics1);
      const report2 = generateOptimizationReport('build-2', metrics2);

      const comparison = compareOptimizationReports(report1, report2);

      expect(comparison).toContain('1');
    });

    it('should include warning for regression', () => {
      const metrics1 = calculateOptimizationMetrics(10000000, 7000000);
      const metrics2 = calculateOptimizationMetrics(10000000, 8000000);
      const report1 = generateOptimizationReport('build-1', metrics1);
      const report2 = generateOptimizationReport('build-2', metrics2);

      const comparison = compareOptimizationReports(report1, report2);

      expect(comparison).toContain('WARNING');
    });
  });

  describe('generateOptimizationRecommendations', () => {
    it('should generate recommendations for poorly optimized build', () => {
      const metrics = calculateOptimizationMetrics(10000000, 9500000);
      const recommendations = generateOptimizationRecommendations(metrics);

      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should recommend code shrinking improvements', () => {
      const metrics = calculateOptimizationMetrics(10000000, 9500000, 100000);
      const recommendations = generateOptimizationRecommendations(metrics);

      const codeRecommendation = recommendations.find((r) =>
        r.toLowerCase().includes('code')
      );
      expect(codeRecommendation).toBeDefined();
    });

    it('should recommend resource shrinking improvements', () => {
      const metrics = calculateOptimizationMetrics(10000000, 9500000, 0, 100000);
      const recommendations = generateOptimizationRecommendations(metrics);

      const resourceRecommendation = recommendations.find((r) =>
        r.toLowerCase().includes('resource')
      );
      expect(resourceRecommendation).toBeDefined();
    });

    it('should recommend APK splitting for large builds', () => {
      const metrics = calculateOptimizationMetrics(150000000, 110000000);
      const recommendations = generateOptimizationRecommendations(metrics);

      const splitRecommendation = recommendations.find((r) =>
        r.toLowerCase().includes('split') || r.toLowerCase().includes('bundle')
      );
      expect(splitRecommendation).toBeDefined();
    });

    it('should provide positive feedback for well-optimized builds', () => {
      const metrics = calculateOptimizationMetrics(10000000, 7000000, 2000000, 1000000);
      const recommendations = generateOptimizationRecommendations(metrics);

      expect(recommendations.length).toBeGreaterThan(0);
      const positiveRecommendation = recommendations.find((r) =>
        r.toLowerCase().includes('well')
      );
      expect(positiveRecommendation).toBeDefined();
    });

    it('should always provide at least one recommendation', () => {
      const metrics = calculateOptimizationMetrics(10000000, 7000000, 2000000, 1000000);
      const recommendations = generateOptimizationRecommendations(metrics);

      expect(recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Metrics consistency', () => {
    it('should maintain consistent metrics across calculations', () => {
      const metrics1 = calculateOptimizationMetrics(10000000, 8000000);
      const metrics2 = calculateOptimizationMetrics(10000000, 8000000);

      expect(metrics1).toEqual(metrics2);
    });

    it('should handle edge cases', () => {
      const metrics = calculateOptimizationMetrics(1, 0);

      expect(metrics.sizeReduction).toBe(1);
      expect(metrics.reductionPercentage).toBe(100);
    });
  });
});
