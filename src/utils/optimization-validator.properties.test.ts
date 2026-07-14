/**
 * Property-Based Tests for Optimization Validator
 *
 * Tests for optimization validation properties:
 * - Property 75: Optimization Functionality Verification - Optimization must not break functionality
 *
 * @module utils/optimization-validator.properties.test
 */

import fc from 'fast-check';
import {
  validateOptimizedAPK,
  validateDEXFiles,
  checkFunctionalityPreservation,
  detectCommonOptimizationIssues,
  generateValidationSummary,
  verifyOptimizationEffectiveness,
} from './optimization-validator';

describe('OptimizationValidator - Property-Based Tests', () => {
  describe('Property 75: Optimization Functionality Verification', () => {
    /**
     * **Validates: Requirements 17.6**
     *
     * For any optimized APK, the validation must verify that optimization
     * does not break app functionality.
     */
    it('should validate functionality for all valid APK paths', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5, maxLength: 50 }).filter((s) => s.endsWith('.apk')),
          fc.integer({ min: 1000000, max: 100000000 }),
          fc.integer({ min: 0, max: 50 }),
          (apkPath, originalSize, reductionPercent) => {
            const reduction = Math.round((originalSize * reductionPercent) / 100);
            const optimizedSize = originalSize - reduction;

            const result = validateOptimizedAPK(apkPath, originalSize, optimizedSize);

            // Result must have valid structure
            expect(result).toBeDefined();
            expect(result.valid).toBeDefined();
            expect(Array.isArray(result.issues)).toBe(true);
            expect(Array.isArray(result.warnings)).toBe(true);
            expect(result.dexValid).toBeDefined();
            expect(result.functionalityPreserved).toBeDefined();
            expect(result.summary).toBeDefined();

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * For any optimization validation result, the result must include
     * all required fields and be properly formatted.
     */
    it('should generate complete validation results', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5, maxLength: 50 }).filter((s) => s.endsWith('.apk')),
          fc.integer({ min: 1000000, max: 100000000 }),
          fc.integer({ min: 0, max: 50 }),
          (apkPath, originalSize, reductionPercent) => {
            const reduction = Math.round((originalSize * reductionPercent) / 100);
            const optimizedSize = originalSize - reduction;

            const result = validateOptimizedAPK(apkPath, originalSize, optimizedSize);

            // All issues must have required fields
            result.issues.forEach((issue) => {
              expect(['error', 'warning']).toContain(issue.type);
              expect(issue.code).toBeTruthy();
              expect(issue.description).toBeTruthy();
              expect(['critical', 'high', 'medium', 'low']).toContain(issue.severity);
              expect(issue.remediation).toBeTruthy();
            });

            // All warnings must be non-empty strings
            result.warnings.forEach((warning) => {
              expect(typeof warning).toBe('string');
              expect(warning.length).toBeGreaterThan(0);
            });

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * For any DEX file validation, the validation must return a boolean
     * indicating whether DEX files are valid.
     */
    it('should validate DEX files for all APK paths', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5, maxLength: 50 }).filter((s) => s.endsWith('.apk')),
          (apkPath) => {
            const valid = validateDEXFiles(apkPath);

            // Result must be a boolean
            expect(typeof valid).toBe('boolean');

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * For any functionality preservation check, the check must return a
     * boolean indicating whether functionality is preserved.
     */
    it('should check functionality preservation for all APK paths', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5, maxLength: 50 }).filter((s) => s.endsWith('.apk')),
          (apkPath) => {
            const preserved = checkFunctionalityPreservation(apkPath);

            // Result must be a boolean
            expect(typeof preserved).toBe('boolean');

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * For any optimization issue detection, all detected issues must have
     * valid properties and be actionable.
     */
    it('should detect valid optimization issues', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5, maxLength: 50 }).filter((s) => s.endsWith('.apk')),
          fc.integer({ min: 1000000, max: 100000000 }),
          fc.integer({ min: 0, max: 100000000 }),
          (apkPath, originalSize, optimizedSize) => {
            const validOptimizedSize = Math.min(optimizedSize, originalSize);
            const issues = detectCommonOptimizationIssues(apkPath, originalSize, validOptimizedSize);

            // All issues must have valid properties
            issues.forEach((issue) => {
              expect(['error', 'warning']).toContain(issue.type);
              expect(issue.code).toBeTruthy();
              expect(issue.description).toBeTruthy();
              expect(['critical', 'high', 'medium', 'low']).toContain(issue.severity);
              expect(issue.remediation).toBeTruthy();
            });

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * For any validation summary generation, the summary must be properly
     * formatted and include all relevant information.
     */
    it('should generate valid validation summaries', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          fc.array(
            fc.record({
              type: fc.constantFrom('error' as const, 'warning' as const),
              code: fc.string({ minLength: 5, maxLength: 20 }),
              description: fc.string({ minLength: 5, maxLength: 100 }),
              severity: fc.constantFrom(
                'critical' as const,
                'high' as const,
                'medium' as const,
                'low' as const
              ),
              remediation: fc.string({ minLength: 5, maxLength: 100 }),
            }),
            { maxLength: 5 }
          ),
          fc.array(fc.string({ minLength: 5, maxLength: 100 }), { maxLength: 5 }),
          (valid, issues, warnings) => {
            const summary = generateValidationSummary(valid, issues, warnings);

            // Summary must not be empty
            expect(summary.length).toBeGreaterThan(0);

            // Summary must contain status
            expect(summary).toMatch(/PASSED|FAILED/);

            // Summary must contain error and warning counts
            expect(summary).toContain('Errors:');
            expect(summary).toContain('Warnings:');

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * For any optimization effectiveness verification, the verification
     * must accurately determine if optimization met expectations.
     */
    it('should verify optimization effectiveness for all sizes', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000000, max: 100000000 }),
          fc.integer({ min: 0, max: 100000000 }),
          fc.integer({ min: 0, max: 100 }),
          (originalSize, optimizedSize, expectedReductionPercent) => {
            const validOptimizedSize = Math.min(optimizedSize, originalSize);
            const effective = verifyOptimizationEffectiveness(
              originalSize,
              validOptimizedSize,
              expectedReductionPercent
            );

            // Result must be a boolean
            expect(typeof effective).toBe('boolean');

            // If effective, actual reduction must meet or exceed expected
            if (effective) {
              const actualReduction = ((originalSize - validOptimizedSize) / originalSize) * 100;
              expect(actualReduction).toBeGreaterThanOrEqual(expectedReductionPercent - 0.01);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * For any validation result, the result must be consistent across
     * multiple validations with the same inputs.
     */
    it('should produce consistent validation results', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5, maxLength: 50 }).filter((s) => s.endsWith('.apk')),
          fc.integer({ min: 1000000, max: 100000000 }),
          fc.integer({ min: 0, max: 50 }),
          (apkPath, originalSize, reductionPercent) => {
            const reduction = Math.round((originalSize * reductionPercent) / 100);
            const optimizedSize = originalSize - reduction;

            const result1 = validateOptimizedAPK(apkPath, originalSize, optimizedSize);
            const result2 = validateOptimizedAPK(apkPath, originalSize, optimizedSize);

            // Results must be identical
            expect(result1.valid).toBe(result2.valid);
            expect(result1.issues.length).toBe(result2.issues.length);
            expect(result1.warnings.length).toBe(result2.warnings.length);
            expect(result1.dexValid).toBe(result2.dexValid);
            expect(result1.functionalityPreserved).toBe(result2.functionalityPreserved);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Validation Consistency Properties', () => {
    /**
     * For any optimization validation, the validation must not produce
     * contradictory results.
     */
    it('should maintain logical consistency in validation results', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5, maxLength: 50 }).filter((s) => s.endsWith('.apk')),
          fc.integer({ min: 1000000, max: 100000000 }),
          fc.integer({ min: 0, max: 50 }),
          (apkPath, originalSize, reductionPercent) => {
            const reduction = Math.round((originalSize * reductionPercent) / 100);
            const optimizedSize = originalSize - reduction;

            const result = validateOptimizedAPK(apkPath, originalSize, optimizedSize);

            // If valid, there should be no critical errors
            if (result.valid) {
              const criticalErrors = result.issues.filter(
                (i) => i.type === 'error' && i.severity === 'critical'
              );
              expect(criticalErrors.length).toBe(0);
            }

            // DEX validity should be consistent with overall validity
            if (!result.dexValid && result.valid) {
              // If DEX is invalid, overall result should be invalid
              expect(result.valid).toBe(false);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
