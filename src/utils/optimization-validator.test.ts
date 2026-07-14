/**
 * Unit Tests for Optimization Validator
 *
 * Tests for optimization validation, DEX validation, and functionality checks.
 *
 * @module utils/optimization-validator.test
 */

import {
  validateOptimizedAPK,
  validateDEXFiles,
  checkFunctionalityPreservation,
  detectCommonOptimizationIssues,
  generateValidationSummary,
  verifyOptimizationEffectiveness,
  OptimizationValidationResult,
} from './optimization-validator';

describe('OptimizationValidator', () => {
  describe('validateOptimizedAPK', () => {
    it('should validate a properly optimized APK', () => {
      const result = validateOptimizedAPK('app-release.apk', 10000000, 8000000);

      expect(result.valid).toBe(true);
      expect(result.issues.length).toBe(0);
      expect(result.dexValid).toBe(true);
    });

    it('should detect invalid APK path', () => {
      const result = validateOptimizedAPK('', 10000000, 8000000);

      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should detect excessive size reduction', () => {
      const result = validateOptimizedAPK('app-release.apk', 10000000, 1000000);

      expect(result.issues.length).toBeGreaterThan(0);
      const excessiveReductionIssue = result.issues.find(
        (i) => i.code === 'EXCESSIVE_SIZE_REDUCTION'
      );
      expect(excessiveReductionIssue).toBeDefined();
    });

    it('should detect suspiciously small APK', () => {
      const result = validateOptimizedAPK('app-release.apk', 10000000, 500000);

      expect(result.issues.length).toBeGreaterThan(0);
      const smallAPKIssue = result.issues.find((i) => i.code === 'APK_TOO_SMALL');
      expect(smallAPKIssue).toBeDefined();
    });

    it('should warn about low size reduction', () => {
      const result = validateOptimizedAPK('app-release.apk', 10000000, 9900000);

      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should include summary in result', () => {
      const result = validateOptimizedAPK('app-release.apk', 10000000, 8000000);

      expect(result.summary).toBeTruthy();
      expect(result.summary.length).toBeGreaterThan(0);
    });

    it('should validate DEX files', () => {
      const result = validateOptimizedAPK('app-release.apk', 10000000, 8000000);

      expect(result.dexValid).toBe(true);
    });

    it('should check functionality preservation', () => {
      const result = validateOptimizedAPK('app-release.apk', 10000000, 8000000);

      expect(result.functionalityPreserved).toBe(true);
    });
  });

  describe('validateDEXFiles', () => {
    it('should validate valid APK path', () => {
      const valid = validateDEXFiles('app-release.apk');

      expect(valid).toBe(true);
    });

    it('should reject empty path', () => {
      const valid = validateDEXFiles('');

      expect(valid).toBe(false);
    });

    it('should reject non-APK file', () => {
      const valid = validateDEXFiles('app-release.jar');

      expect(valid).toBe(false);
    });

    it('should handle null path', () => {
      const valid = validateDEXFiles(null as any);

      expect(valid).toBe(false);
    });
  });

  describe('checkFunctionalityPreservation', () => {
    it('should confirm functionality for valid APK', () => {
      const preserved = checkFunctionalityPreservation('app-release.apk');

      expect(preserved).toBe(true);
    });

    it('should reject empty path', () => {
      const preserved = checkFunctionalityPreservation('');

      expect(preserved).toBe(false);
    });

    it('should handle null path', () => {
      const preserved = checkFunctionalityPreservation(null as any);

      expect(preserved).toBe(false);
    });
  });

  describe('detectCommonOptimizationIssues', () => {
    it('should detect no issues for normal optimization', () => {
      const issues = detectCommonOptimizationIssues('app-release.apk', 10000000, 8000000);

      expect(issues.length).toBe(0);
    });

    it('should detect missing resources', () => {
      const issues = detectCommonOptimizationIssues('app-release.apk', 10000000, 1500000);

      const missingResourcesIssue = issues.find((i) => i.code === 'MISSING_RESOURCES');
      expect(missingResourcesIssue).toBeDefined();
    });

    it('should detect missing code', () => {
      const issues = detectCommonOptimizationIssues('app-release.apk', 10000000, 2000000);

      const missingCodeIssue = issues.find((i) => i.code === 'MISSING_CODE');
      expect(missingCodeIssue).toBeDefined();
    });

    it('should detect invalid APK format', () => {
      const issues = detectCommonOptimizationIssues('app-release.jar', 10000000, 8000000);

      const invalidFormatIssue = issues.find((i) => i.code === 'INVALID_APK_FORMAT');
      expect(invalidFormatIssue).toBeDefined();
    });

    it('should provide remediation for each issue', () => {
      const issues = detectCommonOptimizationIssues('app-release.apk', 10000000, 1500000);

      issues.forEach((issue) => {
        expect(issue.remediation).toBeTruthy();
        expect(issue.remediation.length).toBeGreaterThan(0);
      });
    });
  });

  describe('generateValidationSummary', () => {
    it('should generate summary for valid result', () => {
      const summary = generateValidationSummary(true, [], []);

      expect(summary).toContain('PASSED');
      expect(summary).toContain('Errors: 0');
    });

    it('should generate summary for invalid result', () => {
      const issues = [
        {
          type: 'error' as const,
          code: 'TEST_ERROR',
          description: 'Test error',
          severity: 'high' as const,
          remediation: 'Fix it',
        },
      ];
      const summary = generateValidationSummary(false, issues, []);

      expect(summary).toContain('FAILED');
      expect(summary).toContain('Errors: 1');
    });

    it('should include warnings in summary', () => {
      const warnings = ['Warning 1', 'Warning 2'];
      const summary = generateValidationSummary(true, [], warnings);

      expect(summary).toContain('Warnings: 2');
      expect(summary).toContain('Warning 1');
    });

    it('should include issue details', () => {
      const issues = [
        {
          type: 'error' as const,
          code: 'TEST_ERROR',
          description: 'Test error description',
          severity: 'high' as const,
          remediation: 'Fix it',
        },
      ];
      const summary = generateValidationSummary(false, issues, []);

      expect(summary).toContain('TEST_ERROR');
      expect(summary).toContain('Test error description');
    });
  });

  describe('verifyOptimizationEffectiveness', () => {
    it('should verify effective optimization', () => {
      const effective = verifyOptimizationEffectiveness(10000000, 8000000, 20);

      expect(effective).toBe(true);
    });

    it('should detect ineffective optimization', () => {
      const effective = verifyOptimizationEffectiveness(10000000, 9900000, 20);

      expect(effective).toBe(false);
    });

    it('should use default expected reduction', () => {
      const effective = verifyOptimizationEffectiveness(10000000, 8000000);

      expect(effective).toBe(true);
    });

    it('should handle zero expected reduction', () => {
      const effective = verifyOptimizationEffectiveness(10000000, 9900000, 0);

      expect(effective).toBe(true);
    });

    it('should handle high expected reduction', () => {
      const effective = verifyOptimizationEffectiveness(10000000, 8000000, 50);

      expect(effective).toBe(false);
    });
  });

  describe('Validation consistency', () => {
    it('should maintain consistent validation results', () => {
      const result1 = validateOptimizedAPK('app-release.apk', 10000000, 8000000);
      const result2 = validateOptimizedAPK('app-release.apk', 10000000, 8000000);

      expect(result1.valid).toBe(result2.valid);
      expect(result1.issues.length).toBe(result2.issues.length);
    });

    it('should handle edge cases', () => {
      const result = validateOptimizedAPK('app-release.apk', 1, 0);

      expect(result.valid).toBe(true);
    });
  });
});
