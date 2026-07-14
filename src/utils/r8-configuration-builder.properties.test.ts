/**
 * Property-Based Tests for R8 Configuration Builder
 *
 * Tests for R8 configuration properties:
 * - Property 71: Code Shrinking - R8 must remove unused code
 * - Property 72: Code Minification - R8 must obfuscate code
 *
 * @module utils/r8-configuration-builder.properties.test
 */

import fc from 'fast-check';
import {
  buildR8Configuration,
  generateR8ConfigurationContent,
  addCustomKeepRule,
  addCustomKeepRules,
  R8Configuration,
} from './r8-configuration-builder';

type OptimizationLevel = 'aggressive' | 'moderate' | 'conservative';

describe('R8ConfigurationBuilder - Property-Based Tests', () => {
  describe('Property 71: Code Shrinking', () => {
    /**
     * **Validates: Requirements 17.2**
     *
     * For any R8 configuration with minification enabled, the configuration
     * must be set up to remove unused code through code shrinking.
     */
    it('should configure code shrinking for all optimization levels', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('aggressive' as OptimizationLevel, 'moderate' as OptimizationLevel, 'conservative' as OptimizationLevel),
          (level) => {
            const config = buildR8Configuration(level);

            // Code shrinking is enabled when minification is enabled
            expect(config.minifyEnabled).toBe(true);

            // Configuration must have keep rules to preserve public APIs
            expect(config.keepRules.length).toBeGreaterThan(0);

            // Keep rules must include public class preservation
            const hasPublicClassRule = config.keepRules.some((rule) =>
              rule.includes('-keep public class')
            );
            expect(hasPublicClassRule).toBe(true);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * For any custom keep rules added to configuration, the configuration
     * must still maintain code shrinking capability.
     */
    it('should maintain code shrinking with custom keep rules', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 5, maxLength: 100 }), {
            minLength: 1,
            maxLength: 10,
          }),
          (customRules) => {
            const config = buildR8Configuration('moderate', customRules);

            // Code shrinking must still be enabled
            expect(config.minifyEnabled).toBe(true);

            // Custom rules must be preserved
            expect(config.customRules).toEqual(customRules);

            // Base keep rules must still be present
            expect(config.keepRules.length).toBeGreaterThan(0);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * For any generated R8 configuration content, the content must include
     * directives that enable code shrinking.
     */
    it('should generate code shrinking directives in configuration content', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('aggressive' as OptimizationLevel, 'moderate' as OptimizationLevel, 'conservative' as OptimizationLevel),
          (level) => {
            const config = buildR8Configuration(level);
            const content = generateR8ConfigurationContent(config);

            // Content must include optimization passes (enables shrinking)
            expect(content).toContain('-optimizationpasses');

            // Content must include keep rules
            expect(content).toContain('-keep');

            // For aggressive and moderate, must include optimization
            if (level !== 'conservative') {
              expect(content).toContain('-optimizations');
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * For any configuration with aggressive optimization, code shrinking
     * must be maximally enabled.
     */
    it('should maximize code shrinking for aggressive optimization', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 10 }), (seed) => {
          const config = buildR8Configuration('aggressive');

          // Aggressive must enable all shrinking features
          expect(config.minifyEnabled).toBe(true);
          expect(config.obfuscationEnabled).toBe(true);
          expect(config.optimizationEnabled).toBe(true);

          // Content must reflect aggressive shrinking
          const content = generateR8ConfigurationContent(config);
          expect(content).toContain('-optimizationpasses 5');
          expect(content).toContain('-obfuscate');
          expect(content).toContain('-optimizations');

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 72: Code Minification', () => {
    /**
     * **Validates: Requirements 17.3**
     *
     * For any R8 configuration with obfuscation enabled, the configuration
     * must be set up to obfuscate code through minification.
     */
    it('should configure code minification for aggressive and moderate levels', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('aggressive' as OptimizationLevel, 'moderate' as OptimizationLevel),
          (level) => {
            const config = buildR8Configuration(level);

            // Minification must be enabled
            expect(config.minifyEnabled).toBe(true);

            // Obfuscation must be enabled
            expect(config.obfuscationEnabled).toBe(true);

            // Configuration must have keep rules to preserve public APIs
            expect(config.keepRules.length).toBeGreaterThan(0);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * For any conservative configuration, minification must be disabled
     * to preserve code readability for debugging.
     */
    it('should disable minification for conservative optimization', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 10 }), (seed) => {
          const config = buildR8Configuration('conservative');

          // Conservative must disable obfuscation
          expect(config.obfuscationEnabled).toBe(false);

          // Content must reflect no obfuscation
          const content = generateR8ConfigurationContent(config);
          expect(content).toContain('-dontobfuscate');

          return true;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * For any generated R8 configuration content with minification enabled,
     * the content must include obfuscation directives.
     */
    it('should generate minification directives in configuration content', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('aggressive' as OptimizationLevel, 'moderate' as OptimizationLevel),
          (level) => {
            const config = buildR8Configuration(level);
            const content = generateR8ConfigurationContent(config);

            // Content must include obfuscation directive
            expect(content).toContain('-obfuscate');

            // Content must include keep rules to preserve public APIs
            expect(content).toContain('-keep');

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * For any configuration with custom keep rules, minification must
     * still be applied while preserving the specified classes.
     */
    it('should apply minification while preserving custom keep rules', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 5, maxLength: 100 }), {
            minLength: 1,
            maxLength: 10,
          }),
          (customRules) => {
            const config = buildR8Configuration('aggressive', customRules);

            // Minification must be enabled
            expect(config.minifyEnabled).toBe(true);
            expect(config.obfuscationEnabled).toBe(true);

            // Custom rules must be preserved
            expect(config.customRules).toEqual(customRules);

            // Content must include both obfuscation and custom rules
            const content = generateR8ConfigurationContent(config);
            expect(content).toContain('-obfuscate');
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
     * For any configuration, the minification level must be consistent
     * with the optimization level.
     */
    it('should maintain consistent minification across optimization levels', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('aggressive' as OptimizationLevel, 'moderate' as OptimizationLevel, 'conservative' as OptimizationLevel),
          (level) => {
            const config = buildR8Configuration(level);

            if (level === 'conservative') {
              // Conservative must not obfuscate
              expect(config.obfuscationEnabled).toBe(false);
            } else {
              // Aggressive and moderate must obfuscate
              expect(config.obfuscationEnabled).toBe(true);
            }

            // All levels must have minification enabled
            expect(config.minifyEnabled).toBe(true);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Configuration Stability Properties', () => {
    /**
     * For any configuration created, adding custom keep rules must not
     * affect the base configuration properties.
     */
    it('should preserve base configuration when adding custom rules', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('aggressive' as OptimizationLevel, 'moderate' as OptimizationLevel, 'conservative' as OptimizationLevel),
          fc.string({ minLength: 5, maxLength: 100 }),
          (level, customRule) => {
            const config = buildR8Configuration(level);
            const originalMinify = config.minifyEnabled;
            const originalObfuscation = config.obfuscationEnabled;
            const originalOptimization = config.optimizationEnabled;
            const originalKeepRulesCount = config.keepRules.length;

            const updated = addCustomKeepRule(config, customRule);

            // Base properties must not change
            expect(updated.minifyEnabled).toBe(originalMinify);
            expect(updated.obfuscationEnabled).toBe(originalObfuscation);
            expect(updated.optimizationEnabled).toBe(originalOptimization);
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
     * For any configuration, the generated content must always be valid
     * and non-empty.
     */
    it('should generate valid non-empty content for all configurations', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('aggressive' as OptimizationLevel, 'moderate' as OptimizationLevel, 'conservative' as OptimizationLevel),
          fc.array(fc.string({ minLength: 5, maxLength: 100 }), {
            minLength: 0,
            maxLength: 10,
          }),
          (level, customRules) => {
            const config = buildR8Configuration(level, customRules);
            const content = generateR8ConfigurationContent(config);

            // Content must not be empty
            expect(content.length).toBeGreaterThan(0);

            // Content must contain header
            expect(content).toContain('# R8 Configuration');

            // Content must contain optimization passes
            expect(content).toContain('-optimizationpasses');

            // Content must be properly formatted
            const lines = content.split('\n');
            expect(lines.length).toBeGreaterThan(5);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * For any configuration, all keep rules must be included in the
     * generated content.
     */
    it('should include all keep rules in generated content', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('aggressive' as OptimizationLevel, 'moderate' as OptimizationLevel, 'conservative' as OptimizationLevel),
          fc.array(fc.string({ minLength: 5, maxLength: 100 }), {
            minLength: 1,
            maxLength: 10,
          }),
          (level, customRules) => {
            const config = buildR8Configuration(level, customRules);
            const content = generateR8ConfigurationContent(config);

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
  });

  describe('Optimization Level Properties', () => {
    /**
     * For any optimization level, the configuration must have appropriate
     * optimization passes count.
     */
    it('should set correct optimization passes for each level', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('aggressive' as OptimizationLevel, 'moderate' as OptimizationLevel, 'conservative' as OptimizationLevel),
          (level) => {
            const config = buildR8Configuration(level);
            const content = generateR8ConfigurationContent(config);

            if (level === 'aggressive') {
              expect(content).toContain('-optimizationpasses 5');
            } else if (level === 'moderate') {
              expect(content).toContain('-optimizationpasses 3');
            } else {
              expect(content).toContain('-optimizationpasses 1');
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * For any optimization level, the configuration must have consistent
     * optimization settings.
     */
    it('should maintain consistent optimization settings per level', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('aggressive' as OptimizationLevel, 'moderate' as OptimizationLevel, 'conservative' as OptimizationLevel),
          (level) => {
            const config1 = buildR8Configuration(level);
            const config2 = buildR8Configuration(level);

            // Same level must produce same settings
            expect(config1.minifyEnabled).toBe(config2.minifyEnabled);
            expect(config1.obfuscationEnabled).toBe(config2.obfuscationEnabled);
            expect(config1.optimizationEnabled).toBe(config2.optimizationEnabled);
            expect(config1.keepRules).toEqual(config2.keepRules);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
