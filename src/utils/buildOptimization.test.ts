/**
 * Build Optimization Tests
 */

import {
  getBuildConfig,
  getBundleRecommendations,
  getMobileOptimizationRecommendations,
  checkPerformanceBudget,
  getBuildOptimizationTips,
  DEFAULT_BUILD_CONFIG,
  DEFAULT_MOBILE_PERFORMANCE_BUDGET,
} from './buildOptimization';

describe('Build Optimization', () => {
  describe('getBuildConfig', () => {
    it('should return build configuration', () => {
      const config = getBuildConfig();

      expect(config).toBeDefined();
      expect(config.enableCodeSplitting).toBe(true);
      expect(config.enableTreeShaking).toBe(true);
      expect(config.enableMinification).toBe(true);
    });

    it('should have target bundle size', () => {
      const config = getBuildConfig();

      expect(config.targetBundleSize).toBeGreaterThan(0);
    });
  });

  describe('getBundleRecommendations', () => {
    it('should recommend optimization for large bundles', () => {
      const analysis = {
        totalSize: 1000,
        mainSize: 500,
        vendorSize: 500,
        chunks: [],
        optimizationScore: 50,
      };

      const recommendations = getBundleRecommendations(analysis);

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0]).toContain('exceeds target');
    });

    it('should recommend vendor optimization', () => {
      const analysis = {
        totalSize: 500,
        mainSize: 100,
        vendorSize: 400,
        chunks: [],
        optimizationScore: 70,
      };

      const recommendations = getBundleRecommendations(analysis);

      expect(recommendations.some((r) => r.includes('Vendor'))).toBe(true);
    });

    it('should not recommend optimization for good bundles', () => {
      const analysis = {
        totalSize: 300,
        mainSize: 200,
        vendorSize: 100,
        chunks: [],
        optimizationScore: 90,
      };

      const recommendations = getBundleRecommendations(analysis);

      expect(recommendations.length).toBe(0);
    });
  });

  describe('getMobileOptimizationRecommendations', () => {
    it('should return mobile optimization recommendations', () => {
      const recommendations = getMobileOptimizationRecommendations();

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations).toContain('Enable code splitting for faster initial load');
    });

    it('should include lazy loading recommendation', () => {
      const recommendations = getMobileOptimizationRecommendations();

      expect(recommendations.some((r) => r.includes('lazy loading'))).toBe(true);
    });
  });

  describe('checkPerformanceBudget', () => {
    it('should pass for bundles within budget', () => {
      const actual = {
        javascript: 150,
        css: 40,
        images: 150,
        fonts: 40,
        total: 380,
      };

      const result = checkPerformanceBudget(actual);

      expect(result.passed).toBe(true);
      expect(result.violations.length).toBe(0);
    });

    it('should fail for bundles exceeding budget', () => {
      const actual = {
        javascript: 300,
        css: 100,
        images: 300,
        fonts: 100,
        total: 800,
      };

      const result = checkPerformanceBudget(actual);

      expect(result.passed).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });

    it('should identify specific violations', () => {
      const actual = {
        javascript: 300,
        css: 40,
        images: 150,
        fonts: 40,
        total: 530,
      };

      const result = checkPerformanceBudget(actual);

      expect(result.violations.some((v) => v.includes('JavaScript'))).toBe(true);
    });

    it('should use custom budget', () => {
      const actual = {
        javascript: 150,
        css: 40,
        images: 150,
        fonts: 40,
        total: 380,
      };

      const customBudget = {
        javascript: 100,
        css: 30,
        images: 100,
        fonts: 30,
        total: 260,
      };

      const result = checkPerformanceBudget(actual, customBudget);

      expect(result.passed).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });
  });

  describe('getBuildOptimizationTips', () => {
    it('should return optimization tips', () => {
      const tips = getBuildOptimizationTips();

      expect(tips.length).toBeGreaterThan(0);
      expect(tips).toContain('Use dynamic imports for route-based code splitting');
    });

    it('should include tree-shaking tip', () => {
      const tips = getBuildOptimizationTips();

      expect(tips.some((t) => t.includes('tree-shaking'))).toBe(true);
    });

    it('should include image optimization tip', () => {
      const tips = getBuildOptimizationTips();

      expect(tips.some((t) => t.includes('Optimize images'))).toBe(true);
    });
  });

  describe('Default configurations', () => {
    it('should have default build config', () => {
      expect(DEFAULT_BUILD_CONFIG).toBeDefined();
      expect(DEFAULT_BUILD_CONFIG.targetBundleSize).toBeGreaterThan(0);
    });

    it('should have default mobile performance budget', () => {
      expect(DEFAULT_MOBILE_PERFORMANCE_BUDGET).toBeDefined();
      expect(DEFAULT_MOBILE_PERFORMANCE_BUDGET.total).toBeGreaterThan(0);
    });

    it('should have reasonable default values', () => {
      expect(DEFAULT_BUILD_CONFIG.enableCodeSplitting).toBe(true);
      expect(DEFAULT_BUILD_CONFIG.enableTreeShaking).toBe(true);
      expect(DEFAULT_BUILD_CONFIG.enableMinification).toBe(true);
    });
  });
});
