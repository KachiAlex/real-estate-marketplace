/**
 * Unit Tests for Resource Shrinking Configurer
 *
 * Tests for resource shrinking configuration, keep rules, and density/language filters.
 *
 * @module utils/resource-shrinking-configurer.test
 */

import {
  buildResourceShrinkingConfiguration,
  generateResourceShrinkingGradleConfig,
  generateResourceKeepRulesContent,
  addCustomResourceKeepRule,
  addCustomResourceKeepRules,
  addDensityFilter,
  addLanguageFilter,
  estimateSizeReduction,
  ResourceShrinkingConfiguration,
} from './resource-shrinking-configurer';

describe('ResourceShrinkingConfigurer', () => {
  describe('buildResourceShrinkingConfiguration', () => {
    it('should create default resource shrinking configuration', () => {
      const config = buildResourceShrinkingConfiguration();

      expect(config.enabled).toBe(true);
      expect(config.shrinkResources).toBe(true);
      expect(config.keepRules.length).toBeGreaterThan(0);
      expect(config.customRules.length).toBe(0);
      expect(config.densityFilters.length).toBe(0);
      expect(config.languageFilters.length).toBe(0);
    });

    it('should include base keep rules for drawable resources', () => {
      const config = buildResourceShrinkingConfiguration();

      const hasDrawableRule = config.keepRules.some((rule) =>
        rule.includes('drawable')
      );
      expect(hasDrawableRule).toBe(true);
    });

    it('should include base keep rules for layout resources', () => {
      const config = buildResourceShrinkingConfiguration();

      const hasLayoutRule = config.keepRules.some((rule) =>
        rule.includes('layout')
      );
      expect(hasLayoutRule).toBe(true);
    });

    it('should include base keep rules for values resources', () => {
      const config = buildResourceShrinkingConfiguration();

      const hasValuesRule = config.keepRules.some((rule) =>
        rule.includes('values')
      );
      expect(hasValuesRule).toBe(true);
    });

    it('should accept custom keep rules', () => {
      const customRules = ['keep res/custom/**'];
      const config = buildResourceShrinkingConfiguration(customRules);

      expect(config.customRules).toEqual(customRules);
    });

    it('should accept multiple custom keep rules', () => {
      const customRules = ['keep res/custom1/**', 'keep res/custom2/**'];
      const config = buildResourceShrinkingConfiguration(customRules);

      expect(config.customRules).toEqual(customRules);
    });
  });

  describe('generateResourceShrinkingGradleConfig', () => {
    it('should generate valid gradle configuration', () => {
      const config = buildResourceShrinkingConfiguration();
      const gradleConfig = generateResourceShrinkingGradleConfig(config);

      expect(gradleConfig).toContain('buildTypes');
      expect(gradleConfig).toContain('release');
      expect(gradleConfig).toContain('shrinkResources');
    });

    it('should include shrinkResources directive', () => {
      const config = buildResourceShrinkingConfiguration();
      const gradleConfig = generateResourceShrinkingGradleConfig(config);

      expect(gradleConfig).toContain('shrinkResources true');
    });

    it('should include density filters when present', () => {
      const config = buildResourceShrinkingConfiguration();
      const updatedConfig = addDensityFilter(config, 'hdpi');
      const gradleConfig = generateResourceShrinkingGradleConfig(updatedConfig);

      expect(gradleConfig).toContain('resConfigs');
      expect(gradleConfig).toContain('hdpi');
    });

    it('should include language filters when present', () => {
      const config = buildResourceShrinkingConfiguration();
      const updatedConfig = addLanguageFilter(config, 'en');
      const gradleConfig = generateResourceShrinkingGradleConfig(updatedConfig);

      expect(gradleConfig).toContain('resConfigs');
      expect(gradleConfig).toContain('en');
    });

    it('should have proper formatting', () => {
      const config = buildResourceShrinkingConfiguration();
      const gradleConfig = generateResourceShrinkingGradleConfig(config);
      const lines = gradleConfig.split('\n');

      expect(lines.length).toBeGreaterThan(3);
      expect(lines[0]).toContain('//');
    });
  });

  describe('generateResourceKeepRulesContent', () => {
    it('should generate valid keep rules file content', () => {
      const config = buildResourceShrinkingConfiguration();
      const content = generateResourceKeepRulesContent(config);

      expect(content).toContain('# Resource Keep Rules');
      expect(content).toContain('# Generated automatically');
      expect(content).toContain('# Base keep rules');
    });

    it('should include all base keep rules', () => {
      const config = buildResourceShrinkingConfiguration();
      const content = generateResourceKeepRulesContent(config);

      config.keepRules.forEach((rule) => {
        expect(content).toContain(rule);
      });
    });

    it('should include custom rules in content', () => {
      const customRules = ['keep res/custom/**'];
      const config = buildResourceShrinkingConfiguration(customRules);
      const content = generateResourceKeepRulesContent(config);

      expect(content).toContain('# Custom keep rules');
      customRules.forEach((rule) => {
        expect(content).toContain(rule);
      });
    });

    it('should have proper line breaks and formatting', () => {
      const config = buildResourceShrinkingConfiguration();
      const content = generateResourceKeepRulesContent(config);
      const lines = content.split('\n');

      expect(lines.length).toBeGreaterThan(5);
      expect(lines[0]).toContain('#');
    });
  });

  describe('addCustomResourceKeepRule', () => {
    it('should add a single custom keep rule', () => {
      const config = buildResourceShrinkingConfiguration();
      const rule = 'keep res/custom/**';
      const updated = addCustomResourceKeepRule(config, rule);

      expect(updated.customRules).toContain(rule);
      expect(updated.customRules.length).toBe(1);
    });

    it('should not modify original configuration', () => {
      const config = buildResourceShrinkingConfiguration();
      const rule = 'keep res/custom/**';
      const updated = addCustomResourceKeepRule(config, rule);

      expect(config.customRules.length).toBe(0);
      expect(updated.customRules.length).toBe(1);
    });

    it('should preserve existing custom rules', () => {
      const config = buildResourceShrinkingConfiguration(['keep res/first/**']);
      const rule = 'keep res/second/**';
      const updated = addCustomResourceKeepRule(config, rule);

      expect(updated.customRules.length).toBe(2);
      expect(updated.customRules).toContain('keep res/first/**');
      expect(updated.customRules).toContain(rule);
    });

    it('should preserve all other configuration properties', () => {
      const config = buildResourceShrinkingConfiguration();
      const rule = 'keep res/custom/**';
      const updated = addCustomResourceKeepRule(config, rule);

      expect(updated.enabled).toBe(config.enabled);
      expect(updated.shrinkResources).toBe(config.shrinkResources);
      expect(updated.keepRules).toEqual(config.keepRules);
    });
  });

  describe('addCustomResourceKeepRules', () => {
    it('should add multiple custom keep rules', () => {
      const config = buildResourceShrinkingConfiguration();
      const rules = ['keep res/first/**', 'keep res/second/**'];
      const updated = addCustomResourceKeepRules(config, rules);

      expect(updated.customRules).toEqual(rules);
      expect(updated.customRules.length).toBe(2);
    });

    it('should handle empty rules array', () => {
      const config = buildResourceShrinkingConfiguration();
      const updated = addCustomResourceKeepRules(config, []);

      expect(updated.customRules.length).toBe(0);
    });

    it('should preserve existing custom rules', () => {
      const config = buildResourceShrinkingConfiguration(['keep res/existing/**']);
      const newRules = ['keep res/first/**', 'keep res/second/**'];
      const updated = addCustomResourceKeepRules(config, newRules);

      expect(updated.customRules.length).toBe(3);
      expect(updated.customRules).toContain('keep res/existing/**');
      expect(updated.customRules).toContain('keep res/first/**');
      expect(updated.customRules).toContain('keep res/second/**');
    });

    it('should not modify original configuration', () => {
      const config = buildResourceShrinkingConfiguration();
      const rules = ['keep res/first/**', 'keep res/second/**'];
      const updated = addCustomResourceKeepRules(config, rules);

      expect(config.customRules.length).toBe(0);
      expect(updated.customRules.length).toBe(2);
    });
  });

  describe('addDensityFilter', () => {
    it('should add a single density filter', () => {
      const config = buildResourceShrinkingConfiguration();
      const updated = addDensityFilter(config, 'hdpi');

      expect(updated.densityFilters).toContain('hdpi');
      expect(updated.densityFilters.length).toBe(1);
    });

    it('should add multiple density filters', () => {
      const config = buildResourceShrinkingConfiguration();
      let updated = addDensityFilter(config, 'hdpi');
      updated = addDensityFilter(updated, 'xhdpi');

      expect(updated.densityFilters.length).toBe(2);
      expect(updated.densityFilters).toContain('hdpi');
      expect(updated.densityFilters).toContain('xhdpi');
    });

    it('should not modify original configuration', () => {
      const config = buildResourceShrinkingConfiguration();
      const updated = addDensityFilter(config, 'hdpi');

      expect(config.densityFilters.length).toBe(0);
      expect(updated.densityFilters.length).toBe(1);
    });

    it('should preserve all other configuration properties', () => {
      const config = buildResourceShrinkingConfiguration();
      const updated = addDensityFilter(config, 'hdpi');

      expect(updated.enabled).toBe(config.enabled);
      expect(updated.shrinkResources).toBe(config.shrinkResources);
      expect(updated.keepRules).toEqual(config.keepRules);
    });
  });

  describe('addLanguageFilter', () => {
    it('should add a single language filter', () => {
      const config = buildResourceShrinkingConfiguration();
      const updated = addLanguageFilter(config, 'en');

      expect(updated.languageFilters).toContain('en');
      expect(updated.languageFilters.length).toBe(1);
    });

    it('should add multiple language filters', () => {
      const config = buildResourceShrinkingConfiguration();
      let updated = addLanguageFilter(config, 'en');
      updated = addLanguageFilter(updated, 'es');

      expect(updated.languageFilters.length).toBe(2);
      expect(updated.languageFilters).toContain('en');
      expect(updated.languageFilters).toContain('es');
    });

    it('should not modify original configuration', () => {
      const config = buildResourceShrinkingConfiguration();
      const updated = addLanguageFilter(config, 'en');

      expect(config.languageFilters.length).toBe(0);
      expect(updated.languageFilters.length).toBe(1);
    });

    it('should preserve all other configuration properties', () => {
      const config = buildResourceShrinkingConfiguration();
      const updated = addLanguageFilter(config, 'en');

      expect(updated.enabled).toBe(config.enabled);
      expect(updated.shrinkResources).toBe(config.shrinkResources);
      expect(updated.keepRules).toEqual(config.keepRules);
    });
  });

  describe('estimateSizeReduction', () => {
    it('should estimate size reduction with no filters', () => {
      const reduction = estimateSizeReduction(10000000, 0, 0);

      expect(reduction).toBe(0);
    });

    it('should estimate size reduction with density filters', () => {
      const originalSize = 10000000;
      const reduction = estimateSizeReduction(originalSize, 2, 0);

      expect(reduction).toBeGreaterThan(0);
      expect(reduction).toBeLessThan(originalSize);
    });

    it('should estimate size reduction with language filters', () => {
      const originalSize = 10000000;
      const reduction = estimateSizeReduction(originalSize, 0, 3);

      expect(reduction).toBeGreaterThan(0);
      expect(reduction).toBeLessThan(originalSize);
    });

    it('should estimate size reduction with both filters', () => {
      const originalSize = 10000000;
      const reduction = estimateSizeReduction(originalSize, 2, 3);

      expect(reduction).toBeGreaterThan(0);
      expect(reduction).toBeLessThan(originalSize);
    });

    it('should cap reduction at 50%', () => {
      const originalSize = 10000000;
      const reduction = estimateSizeReduction(originalSize, 10, 10);

      expect(reduction).toBeLessThanOrEqual(originalSize * 0.5);
    });

    it('should return integer value', () => {
      const originalSize = 10000000;
      const reduction = estimateSizeReduction(originalSize, 2, 3);

      expect(Number.isInteger(reduction)).toBe(true);
    });
  });

  describe('Configuration consistency', () => {
    it('should maintain consistent state', () => {
      const config1 = buildResourceShrinkingConfiguration();
      const config2 = buildResourceShrinkingConfiguration();

      expect(config1.enabled).toBe(config2.enabled);
      expect(config1.shrinkResources).toBe(config2.shrinkResources);
      expect(config1.keepRules).toEqual(config2.keepRules);
    });

    it('should generate valid content for all configurations', () => {
      const config = buildResourceShrinkingConfiguration(['keep res/custom/**']);
      const gradleConfig = generateResourceShrinkingGradleConfig(config);
      const keepRulesContent = generateResourceKeepRulesContent(config);

      expect(gradleConfig.length).toBeGreaterThan(0);
      expect(keepRulesContent.length).toBeGreaterThan(0);
    });
  });
});
