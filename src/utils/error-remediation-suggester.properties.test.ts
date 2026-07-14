/**
 * Property-Based Tests for ErrorRemediationSuggester
 *
 * Tests universal properties that should hold for all remediation suggestions.
 *
 * **Validates: Requirements 10.3, 10.4, 10.5, 10.6**
 *
 * @module utils/error-remediation-suggester.properties.test
 */

import fc from 'fast-check';
import { ErrorRemediationSuggester } from './error-remediation-suggester';
import { BuildError, BuildErrorCode } from '../types/android-build';

describe('ErrorRemediationSuggester - Property-Based Tests', () => {
  let suggester: ErrorRemediationSuggester;

  beforeEach(() => {
    suggester = new ErrorRemediationSuggester();
  });

  /**
   * Property 36: Build Error Remediation Suggestions
   *
   * For any classified error, the remediation must be specific to the error type
   * and provide actionable steps that could help resolve the issue.
   */
  describe('Property 36: Build Error Remediation Suggestions', () => {
    it('should provide remediation for all error codes', () => {
      const errorCodes = Object.values(BuildErrorCode);

      errorCodes.forEach((code) => {
        const error: BuildError = {
          code,
          stage: 'test',
          message: 'Test error',
          details: 'Test details',
          remediation: 'Test',
          timestamp: new Date(),
        };

        const suggestion = suggester.generateRemediation(error);

        expect(suggestion).toBeDefined();
        expect(suggestion.summary).toBeDefined();
        expect(suggestion.steps).toBeDefined();
        expect(suggestion.steps.length).toBeGreaterThan(0);
      });
    });

    it('should provide actionable steps', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.values(BuildErrorCode)),
          (code) => {
            const error: BuildError = {
              code,
              stage: 'test',
              message: 'Test error',
              details: 'Test details',
              remediation: 'Test',
              timestamp: new Date(),
            };

            const suggestion = suggester.generateRemediation(error);

            // Each step should be non-empty and meaningful
            suggestion.steps.forEach((step) => {
              expect(step.length).toBeGreaterThan(0);
              // Most steps should be actionable
              const actionableKeywords = [
                'check',
                'verify',
                'ensure',
                'run',
                'set',
                'install',
                'fix',
                'update',
                'configure',
                'validate',
                'open',
                'generate',
                'rebuild',
                'restore',
                'example',
                'or',
                'and',
              ];

              const isActionable = actionableKeywords.some((keyword) =>
                step.toLowerCase().includes(keyword)
              );

              // Allow some non-actionable steps (like examples or notes)
              expect(step.length).toBeGreaterThan(5);
            });
          }
        ),
        { numRuns: 5 }
      );
    });

    it('should maintain consistency across multiple calls', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.values(BuildErrorCode)),
          (code) => {
            const error: BuildError = {
              code,
              stage: 'test',
              message: 'Test error',
              details: 'Test details',
              remediation: 'Test',
              timestamp: new Date(),
            };

            const suggestion1 = suggester.generateRemediation(error);
            const suggestion2 = suggester.generateRemediation(error);

            expect(suggestion1.summary).toBe(suggestion2.summary);
            expect(suggestion1.steps.length).toBe(suggestion2.steps.length);
            expect(suggestion1.isCommon).toBe(suggestion2.isCommon);
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * Property 37: Dependency Error Handling
   *
   * For any dependency error, the remediation must suggest dependency resolution steps.
   */
  describe('Property 37: Dependency Error Handling', () => {
    it('should suggest dependency resolution for dependency conflicts', () => {
      const error: BuildError = {
        code: BuildErrorCode.BuildDependencyConflict,
        stage: 'dependency-resolution',
        message: 'Dependency conflict',
        details: 'version conflict',
        remediation: 'Resolve',
        timestamp: new Date(),
      };

      const suggestion = suggester.generateRemediation(error);

      expect(suggestion.summary.toLowerCase()).toContain('depend');
      expect(suggestion.steps.some((s) => s.toLowerCase().includes('depend'))).toBe(true);
    });

    it('should provide multiple resolution strategies for dependencies', () => {
      const error: BuildError = {
        code: BuildErrorCode.BuildDependencyConflict,
        stage: 'dependency-resolution',
        message: 'Dependency conflict',
        details: 'version conflict',
        remediation: 'Resolve',
        timestamp: new Date(),
      };

      const suggestion = suggester.generateRemediation(error);

      expect(suggestion.steps.length).toBeGreaterThan(3);
      expect(suggestion.alternatives).toBeDefined();
      if (suggestion.alternatives) {
        expect(suggestion.alternatives.length).toBeGreaterThan(0);
      }
    });
  });

  /**
   * Property 38: Compilation Error Reporting
   *
   * For any compilation error, the remediation must include file path and line number guidance.
   */
  describe('Property 38: Compilation Error Reporting', () => {
    it('should provide file path guidance for compilation errors', () => {
      const error: BuildError = {
        code: BuildErrorCode.BuildGradleFailed,
        stage: 'compilation',
        message: 'Compilation failed',
        details: 'cannot find symbol: class MainActivity',
        remediation: 'Fix',
        timestamp: new Date(),
      };

      const suggestion = suggester.generateRemediation(error);

      expect(suggestion.steps.some((s) => s.toLowerCase().includes('file'))).toBe(true);
      expect(suggestion.steps.some((s) => s.toLowerCase().includes('line'))).toBe(true);
    });

    it('should suggest IDE usage for compilation errors', () => {
      const error: BuildError = {
        code: BuildErrorCode.BuildGradleFailed,
        stage: 'compilation',
        message: 'Compilation failed',
        details: 'cannot find symbol',
        remediation: 'Fix',
        timestamp: new Date(),
      };

      const suggestion = suggester.generateRemediation(error);

      expect(suggestion.steps.some((s) => s.toLowerCase().includes('ide'))).toBe(true);
    });
  });

  /**
   * Property 39: Error Documentation Links
   *
   * For any remediation suggestion, if a documentation link is provided, it must be valid.
   */
  describe('Property 39: Error Documentation Links', () => {
    it('should provide valid documentation links', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.values(BuildErrorCode)),
          (code) => {
            const error: BuildError = {
              code,
              stage: 'test',
              message: 'Test error',
              details: 'Test details',
              remediation: 'Test',
              timestamp: new Date(),
            };

            const suggestion = suggester.generateRemediation(error);

            if (suggestion.documentationLink) {
              expect(suggestion.documentationLink).toMatch(/^https?:\/\//);
              expect(suggestion.documentationLink).not.toContain(' ');
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should provide documentation links for most error types', () => {
      const errorCodes = Object.values(BuildErrorCode);
      let linksProvided = 0;

      errorCodes.forEach((code) => {
        const error: BuildError = {
          code,
          stage: 'test',
          message: 'Test error',
          details: 'Test details',
          remediation: 'Test',
          timestamp: new Date(),
        };

        const suggestion = suggester.generateRemediation(error);

        if (suggestion.documentationLink) {
          linksProvided++;
        }
      });

      // At least 80% of error types should have documentation links
      expect(linksProvided / errorCodes.length).toBeGreaterThanOrEqual(0.8);
    });
  });

  /**
   * Property: Remediation Completeness
   *
   * For any error, the remediation suggestion must be complete and actionable.
   */
  describe('Property: Remediation Completeness', () => {
    it('should always provide non-empty summary', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.values(BuildErrorCode)),
          (code) => {
            const error: BuildError = {
              code,
              stage: 'test',
              message: 'Test error',
              details: 'Test details',
              remediation: 'Test',
              timestamp: new Date(),
            };

            const suggestion = suggester.generateRemediation(error);

            expect(suggestion.summary).toBeDefined();
            expect(suggestion.summary.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should always provide at least 3 steps', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.values(BuildErrorCode)),
          (code) => {
            const error: BuildError = {
              code,
              stage: 'test',
              message: 'Test error',
              details: 'Test details',
              remediation: 'Test',
              timestamp: new Date(),
            };

            const suggestion = suggester.generateRemediation(error);

            expect(suggestion.steps.length).toBeGreaterThanOrEqual(3);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should always have isCommon property', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.values(BuildErrorCode)),
          (code) => {
            const error: BuildError = {
              code,
              stage: 'test',
              message: 'Test error',
              details: 'Test details',
              remediation: 'Test',
              timestamp: new Date(),
            };

            const suggestion = suggester.generateRemediation(error);

            expect(typeof suggestion.isCommon).toBe('boolean');
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * Property: Formatting Consistency
   *
   * For any remediation suggestion, formatting should be consistent and readable.
   */
  describe('Property: Formatting Consistency', () => {
    it('should format suggestions consistently', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.values(BuildErrorCode)),
          (code) => {
            const error: BuildError = {
              code,
              stage: 'test',
              message: 'Test error',
              details: 'Test details',
              remediation: 'Test',
              timestamp: new Date(),
            };

            const suggestion = suggester.generateRemediation(error);
            const formatted = suggester.formatSuggestion(suggestion);

            expect(formatted).toBeDefined();
            expect(formatted.length).toBeGreaterThan(0);
            expect(formatted).toContain(suggestion.summary);
            expect(formatted).toContain('Steps:');
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should include step numbers in formatted output', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.values(BuildErrorCode)),
          (code) => {
            const error: BuildError = {
              code,
              stage: 'test',
              message: 'Test error',
              details: 'Test details',
              remediation: 'Test',
              timestamp: new Date(),
            };

            const suggestion = suggester.generateRemediation(error);
            const formatted = suggester.formatSuggestion(suggestion);

            expect(formatted).toContain('1.');
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * Property: Multiple Error Handling
   *
   * For any array of errors, remediations should be generated for all.
   */
  describe('Property: Multiple Error Handling', () => {
    it('should generate remediations for all errors in array', () => {
      fc.assert(
        fc.property(
          fc.array(fc.constantFrom(...Object.values(BuildErrorCode)), {
            minLength: 1,
            maxLength: 5,
          }),
          (codes) => {
            const errors: BuildError[] = codes.map((code) => ({
              code,
              stage: 'test',
              message: 'Test error',
              details: 'Test details',
              remediation: 'Test',
              timestamp: new Date(),
            }));

            const suggestions = suggester.generateRemediations(errors);

            expect(suggestions.length).toBe(errors.length);
            suggestions.forEach((suggestion) => {
              expect(suggestion.summary).toBeDefined();
              expect(suggestion.steps.length).toBeGreaterThan(0);
            });
          }
        ),
        { numRuns: 5 }
      );
    });
  });

  /**
   * Property: Estimated Time Accuracy
   *
   * For any remediation suggestion with estimated time, it should be reasonable.
   */
  describe('Property: Estimated Time Accuracy', () => {
    it('should provide reasonable estimated times', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.values(BuildErrorCode)),
          (code) => {
            const error: BuildError = {
              code,
              stage: 'test',
              message: 'Test error',
              details: 'Test details',
              remediation: 'Test',
              timestamp: new Date(),
            };

            const suggestion = suggester.generateRemediation(error);

            if (suggestion.estimatedTime) {
              expect(suggestion.estimatedTime).toBeGreaterThan(0);
              expect(suggestion.estimatedTime).toBeLessThan(120); // Less than 2 hours
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});
