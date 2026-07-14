/**
 * Property-Based Tests for Resource Shrinking Configurer
 *
 * Tests for resource shrinking properties:
 * - Property 70: Resource Shrinking - Unused resources must be removed
 *
 * @module utils/resource-shrinking-configurer.properties.test
 */

import fc from 'fast-check';
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

describe('ResourceShrinkingConfigurer - Property-Based Tests', () => {
  describe('Property 70: Resource Shrinking', () => {
    /**
     * **Validates: Requirements 17.1**
     *
     * For any resource shrinking configuration, the configuration must be
     * set up to remove unused resources through resource shrinking.
     */
    it('should configure resource shrinking for all configurations', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 5, maxLength: 100 }), {
            minLength: 0,
            maxLength: 5,
          }),
          (customRules) => {
            const config = buildResourceShrinkingConfiguration(customRules);

            // Resource shrinking must be enabled
            expect(config.shrinkResources).toBe(true);

            // Configuration must have keep rules to preserve required resources
            expect(config.keepRules.length).toBeGreaterThan(0);

            // Custom rules must be preserved
            expect(config.customRules).toEqual(customRules);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * For any generated resource shrinking gradle configuration, the
     * configuration must include the shrinkResources directive.
     */
    it('should generate shrinkResources directive in gradle config', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 5, maxLength: 100 }), {
            minLength: 0,
            maxLength: 5,
          }),
          (customRules) => {
            const config = buildResourceShrinkingConfiguration(customRules);
            const gradleConfig = generateResourceShrinkingGradleConfig(config);

            // Gradle config must include shrinkResources directive
            expect(gradleConfig).toContain('shrinkResources');

            // Gradle config must include buildTypes
            expect(gradleConfig).toContain('buildTypes');

            // Gradle config must include release build type
            expect(gradleConfig).toContain('release');

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * For any resource shrinking configuration with density filters,
     * the gradle configuration must include resConfigs directive.
     */
    it('should include resConfigs for density filters', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 2, maxLength: 10 }), {
            minLength: 1,
            maxLength: 5,
          }),
          (densities) => {
            let config = buildResourceShrinkingConfiguration();
            densities.forEach((density) => {
              config = addDensityFilter(config, density);
            });

            const gradleConfig = generateResourceShrinkingGradleConfig(config);

            // Gradle config must include resConfigs when filters are present
            expect(gradleConfig).toContain('resConfigs');

            // All densities must be in the config
            densities.forEach((density) => {
              expect(gradleConfig).toContain(density);
            });

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * For any resource shrinking configuration with language filters,
     * the gradle configuration must include resConfigs directive.
     */
    it('should include resConfigs for language filters', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 2, maxLength: 5 }), {
            minLength: 1,
            maxLength: 5,
          }),
          (languages) => {
            let config = buildResourceShrinkingConfiguration();
            languages.forEach((language) => {
              config = addLanguageFilter(config, language);
            });

            const gradleConfig = generateResourceShrinkingGradleConfig(config);

            // Gradle config must include resConfigs when filters are present
            expect(gradleConfig).toContain('resConfigs');

            // All languages must be in the config
            languages.forEach((language) => {
              expect(gradleConfig).toContain(language);
            });

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * For any resource shrinking configuration, all keep rules must be
     * included in the generated keep rules content.
     */
    it('should include all keep rules in generated content', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 5, maxLength: 100 }), {
            minLength: 1,
            maxLength: 10,
          }),
          (customRules) => {
            const config = buildResourceShrinkingConfiguration(customRules);
            const content = generateResourceKeepRulesContent(config);

            // All base keep rules must be in content
            config.keepRules.forEach((rule) => {
              expect(content).toContain(rule);
            });

            // All custom rules must be in content
            customRules.forEach((rule) => {
              expect(content).toContain(rule);
            });

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * For any resource shrinking configuration, adding custom keep rules
     * must not affect the base configuration properties.
     */
    it('should preserve base configuration when adding custom rules', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5, maxLength: 100 }),
          (customRule) => {
            const config = buildResourceShrinkingConfiguration();
            const originalShrinkResources = config.shrinkResources;
            const originalKeepRulesCount = config.keepRules.length;

            const updated = addCustomResourceKeepRule(config, customRule);

            // Base properties must not change
            expect(updated.shrinkResources).toBe(originalShrinkResources);
            expect(updated.keepRules.length).toBe(originalKeepRulesCount);

            // Custom rule must be added
            expect(updated.customRules).toContain(customRule);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * For any resource shrinking configuration, adding density filters
     * must not affect the base configuration properties.
     */
    it('should preserve base configuration when adding density filters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 2, maxLength: 10 }),
          (density) => {
            const config = buildResourceShrinkingConfiguration();
            const originalShrinkResources = config.shrinkResources;
            const originalKeepRulesCount = config.keepRules.length;

            const updated = addDensityFilter(config, density);

            // Base properties must not change
            expect(updated.shrinkResources).toBe(originalShrinkResources);
            expect(updated.keepRules.length).toBe(originalKeepRulesCount);

            // Density filter must be added
            expect(updated.densityFilters).toContain(density);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * For any resource shrinking configuration, adding language filters
     * must not affect the base configuration properties.
     */
    it('should preserve base configuration when adding language filters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 2, maxLength: 5 }),
          (language) => {
            const config = buildResourceShrinkingConfiguration();
            const originalShrinkResources = config.shrinkResources;
            const originalKeepRulesCount = config.keepRules.length;

            const updated = addLanguageFilter(config, language);

            // Base properties must not change
            expect(updated.shrinkResources).toBe(originalShrinkResources);
            expect(updated.keepRules.length).toBe(originalKeepRulesCount);

            // Language filter must be added
            expect(updated.languageFilters).toContain(language);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * For any size reduction estimation, the reduction must be non-negative
     * and not exceed the original size.
     */
    it('should estimate valid size reductions', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000000, max: 100000000 }),
          fc.integer({ min: 0, max: 10 }),
          fc.integer({ min: 0, max: 10 }),
          (originalSize, densityFilters, languageFilters) => {
            const reduction = estimateSizeReduction(originalSize, densityFilters, languageFilters);

            // Reduction must be non-negative
            expect(reduction).toBeGreaterThanOrEqual(0);

            // Reduction must not exceed original size
            expect(reduction).toBeLessThanOrEqual(originalSize);

            // Reduction must be an integer
            expect(Number.isInteger(reduction)).toBe(true);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * For any resource shrinking configuration, the generated content
     * must always be valid and non-empty.
     */
    it('should generate valid non-empty content for all configurations', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 5, maxLength: 100 }), {
            minLength: 0,
            maxLength: 5,
          }),
          (customRules) => {
            const config = buildResourceShrinkingConfiguration(customRules);
            const gradleConfig = generateResourceShrinkingGradleConfig(config);
            const keepRulesContent = generateResourceKeepRulesContent(config);

            // Gradle config must not be empty
            expect(gradleConfig.length).toBeGreaterThan(0);

            // Keep rules content must not be empty
            expect(keepRulesContent.length).toBeGreaterThan(0);

            // Gradle config must contain required directives
            expect(gradleConfig).toContain('buildTypes');
            expect(gradleConfig).toContain('shrinkResources');

            // Keep rules content must contain header
            expect(keepRulesContent).toContain('# Resource Keep Rules');

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Configuration Stability Properties', () => {
    /**
     * For any resource shrinking configuration, creating multiple
     * configurations with the same parameters must produce identical results.
     */
    it('should produce consistent configurations', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 5, maxLength: 100 }), {
            minLength: 0,
            maxLength: 5,
          }),
          (customRules) => {
            const config1 = buildResourceShrinkingConfiguration(customRules);
            const config2 = buildResourceShrinkingConfiguration(customRules);

            // Configurations must be identical
            expect(config1.enabled).toBe(config2.enabled);
            expect(config1.shrinkResources).toBe(config2.shrinkResources);
            expect(config1.keepRules).toEqual(config2.keepRules);
            expect(config1.customRules).toEqual(config2.customRules);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * For any resource shrinking configuration, multiple custom rules
     * must be added in the correct order.
     */
    it('should maintain order of custom rules', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 5, maxLength: 100 }), {
            minLength: 1,
            maxLength: 10,
          }),
          (customRules) => {
            const config = buildResourceShrinkingConfiguration(customRules);

            // Custom rules must be in the same order
            expect(config.customRules).toEqual(customRules);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
