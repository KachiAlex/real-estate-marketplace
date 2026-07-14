/**
 * Property-Based Tests for BuildErrorClassifier
 *
 * Tests universal properties that should hold for all valid error classifications.
 * These tests verify that the error classifier maintains correctness properties
 * across a wide range of inputs.
 *
 * **Validates: Requirements 10.1, 10.2**
 *
 * @module utils/build-error-classifier.properties.test
 */

import fc from 'fast-check';
import { BuildErrorClassifier } from './build-error-classifier';
import { BuildErrorCode } from '../types/android-build';

describe('BuildErrorClassifier - Property-Based Tests', () => {
  let classifier: BuildErrorClassifier;

  beforeEach(() => {
    classifier = new BuildErrorClassifier();
  });

  /**
   * Property 35: Build Error Message Quality
   *
   * For any error output, the classified error must include:
   * - A valid error code
   * - The build stage where the error occurred
   * - Detailed error information
   * - Remediation steps
   *
   * This ensures errors provide sufficient information for developers to understand
   * and fix issues.
   */
  describe('Property 35: Build Error Message Quality', () => {
    it('should always include error code, stage, and details', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 1000 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          (output, stage) => {
            const error = classifier.classifyError(output, stage);

            // Error code must be valid
            expect(Object.values(BuildErrorCode)).toContain(error.code);

            // Stage must match input
            expect(error.stage).toBe(stage);

            // Message must be non-empty
            expect(error.message).toBeDefined();
            expect(error.message.length).toBeGreaterThan(0);

            // Details must be non-empty
            expect(error.details).toBeDefined();
            expect(error.details.length).toBeGreaterThan(0);

            // Remediation must be non-empty
            expect(error.remediation).toBeDefined();
            expect(error.remediation.length).toBeGreaterThan(0);

            // Timestamp must be set
            expect(error.timestamp).toBeInstanceOf(Date);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should always provide actionable remediation', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 500 }),
          fc.string({ minLength: 1, maxLength: 30 }),
          (output, stage) => {
            const error = classifier.classifyError(output, stage);

            // Remediation should be actionable (contain verbs or specific instructions)
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
              'must',
              'should',
            ];

            const isActionable = actionableKeywords.some((keyword) =>
              error.remediation.toLowerCase().includes(keyword)
            );

            // Either contains actionable keywords or is a generic fallback
            expect(
              isActionable || error.remediation.includes('Check the build output')
            ).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should maintain consistency across multiple classifications', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 500 }),
          fc.string({ minLength: 1, maxLength: 30 }),
          (output, stage) => {
            const error1 = classifier.classifyError(output, stage);
            const error2 = classifier.classifyError(output, stage);

            // Same input should produce same error code
            expect(error1.code).toBe(error2.code);

            // Same input should produce same message
            expect(error1.message).toBe(error2.message);

            // Same input should produce same remediation
            expect(error1.remediation).toBe(error2.remediation);
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * Property 36: Build Error Remediation Suggestions
   *
   * For any classified error, the remediation must be specific to the error type
   * and provide actionable steps that could help resolve the issue.
   *
   * This ensures developers get targeted help for their specific problems.
   */
  describe('Property 36: Build Error Remediation Suggestions', () => {
    it('should provide error-specific remediation', () => {
      const testCases = [
        {
          output: 'ANDROID_SDK_ROOT not set',
          shouldContain: ['ANDROID_SDK_ROOT', 'environment'],
        },
        {
          output: 'Dependency conflict detected',
          shouldContain: ['dependencies', 'conflict'],
        },
        {
          output: 'Compilation failed',
          shouldContain: ['source code', 'error'],
        },
        {
          output: 'Signing failed',
          shouldContain: ['keystore', 'signing'],
        },
        {
          output: 'Certificate expired',
          shouldContain: ['certificate', 'expired'],
        },
      ];

      testCases.forEach(({ output, shouldContain }) => {
        const error = classifier.classifyError(output, 'test');
        const remediationLower = error.remediation.toLowerCase();

        const hasRelevantContent = shouldContain.some((keyword) =>
          remediationLower.includes(keyword.toLowerCase())
        );

        expect(hasRelevantContent).toBe(true);
      });
    });

    it('should never provide empty remediation', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 500 }),
          fc.string({ minLength: 1, maxLength: 30 }),
          (output, stage) => {
            const error = classifier.classifyError(output, stage);
            expect(error.remediation.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * Property 37: Dependency Error Handling
   *
   * For any output containing dependency-related keywords, the classifier must
   * identify it as a dependency error and suggest dependency resolution steps.
   *
   * This ensures dependency issues are properly categorized and handled.
   */
  describe('Property 37: Dependency Error Handling', () => {
    it('should classify dependency-related errors correctly', () => {
      const dependencyKeywords = [
        'dependency conflict',
        'cannot resolve',
        'unresolved dependency',
        'version conflict',
      ];

      dependencyKeywords.forEach((keyword) => {
        const output = `Error: ${keyword} detected`;
        const error = classifier.classifyError(output, 'dependency-resolution');

        expect(error.code).toBe(BuildErrorCode.BuildDependencyConflict);
        expect(error.remediation.toLowerCase()).toContain('depend');
      });
    });

    it('should suggest dependency resolution for all dependency errors', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'dependency conflict',
            'cannot resolve',
            'unresolved dependency',
            'version conflict'
          ),
          (keyword) => {
            const output = `Error: ${keyword}`;
            const error = classifier.classifyError(output, 'dependency-resolution');

            expect(error.code).toBe(BuildErrorCode.BuildDependencyConflict);
            expect(error.remediation.toLowerCase()).toContain('depend');
          }
        ),
        { numRuns: 5 }
      );
    });
  });

  /**
   * Property 38: Compilation Error Reporting
   *
   * For any output containing compilation error keywords, the classifier must
   * identify it as a compilation error and include relevant details.
   *
   * This ensures compilation issues are properly identified and reported.
   */
  describe('Property 38: Compilation Error Reporting', () => {
    it('should classify compilation errors correctly', () => {
      const testCases = [
        'cannot find symbol',
        'incompatible types',
        'compilation failed',
      ];

      testCases.forEach((keyword) => {
        const output = `error: ${keyword}`;
        const error = classifier.classifyError(output, 'compilation');

        expect(error.code).toBe(BuildErrorCode.BuildGradleFailed);
        expect(error.remediation).toBeDefined();
        expect(error.remediation.length).toBeGreaterThan(0);
      });
    });

    it('should include error details in compilation errors', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'cannot find symbol',
            'incompatible types',
            'compilation failed'
          ),
          (keyword) => {
            const output = `Error: ${keyword}`;
            const error = classifier.classifyError(output, 'compilation');

            expect(error.details).toBeDefined();
            expect(error.details.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 5 }
      );
    });
  });

  /**
   * Property 39: Error Documentation Links
   *
   * For any classified error, if a documentation link is available, it must be
   * a valid URL that could help developers understand and fix the issue.
   *
   * This ensures developers have access to relevant documentation.
   */
  describe('Property 39: Error Documentation Links', () => {
    it('should provide valid documentation links when available', () => {
      const testCases = [
        'ANDROID_SDK_ROOT not set',
        'Dependency conflict',
        'Signing failed',
        'Certificate expired',
      ];

      testCases.forEach((output) => {
        const error = classifier.classifyError(output, 'test');

        if (error.documentationLink) {
          // Link should be a valid URL
          expect(error.documentationLink).toMatch(/^https?:\/\//);
        }
      });
    });

    it('should maintain URL format for all documentation links', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 500 }),
          fc.string({ minLength: 1, maxLength: 30 }),
          (output, stage) => {
            const error = classifier.classifyError(output, stage);

            if (error.documentationLink) {
              // Must be a valid URL
              expect(error.documentationLink).toMatch(/^https?:\/\//);
              // Must not contain spaces
              expect(error.documentationLink).not.toContain(' ');
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * Property: Error Code Validity
   *
   * For any classified error, the error code must be one of the defined BuildErrorCode values.
   *
   * This ensures type safety and consistency.
   */
  describe('Property: Error Code Validity', () => {
    it('should always assign valid error codes', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 500 }),
          fc.string({ minLength: 1, maxLength: 30 }),
          (output, stage) => {
            const error = classifier.classifyError(output, stage);
            expect(Object.values(BuildErrorCode)).toContain(error.code);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should assign valid codes in multiple error classification', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 500 }),
          fc.string({ minLength: 1, maxLength: 30 }),
          (output, stage) => {
            const errors = classifier.classifyMultipleErrors(output, stage);

            errors.forEach((error) => {
              expect(Object.values(BuildErrorCode)).toContain(error.code);
            });
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * Property: Error Detection Consistency
   *
   * For any output, hasErrors() should be consistent with classifyError() results.
   * If hasErrors() returns true, classifyError() should return a valid error.
   *
   * This ensures consistency across error detection methods.
   */
  describe('Property: Error Detection Consistency', () => {
    it('should maintain consistency between hasErrors and classifyError', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 500 }),
          fc.string({ minLength: 1, maxLength: 30 }),
          (output, stage) => {
            const hasErrors = classifier.hasErrors(output);
            const error = classifier.classifyError(output, stage);

            // If hasErrors is true, error should be valid
            if (hasErrors) {
              expect(error).toBeDefined();
              expect(error.code).toBeDefined();
            }

            // Error should always be defined
            expect(error).toBeDefined();
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * Property: Error Summary Extraction
   *
   * For any output, extractErrorSummary() should return a non-empty string
   * that represents the most relevant error information.
   *
   * This ensures error summaries are always available and meaningful.
   */
  describe('Property: Error Summary Extraction', () => {
    it('should always extract a non-empty error summary', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1, maxLength: 500 }), (output) => {
          const summary = classifier.extractErrorSummary(output);

          expect(summary).toBeDefined();
          expect(summary.length).toBeGreaterThan(0);
          expect(typeof summary).toBe('string');
        }),
        { numRuns: 10 }
      );
    });
  });

  /**
   * Property: Multiple Error Handling
   *
   * For any output, classifyMultipleErrors() should return at least one error
   * and should not return duplicate error codes.
   *
   * This ensures multiple error detection is robust and avoids duplicates.
   */
  describe('Property: Multiple Error Handling', () => {
    it('should always return at least one error', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 500 }),
          fc.string({ minLength: 1, maxLength: 30 }),
          (output, stage) => {
            const errors = classifier.classifyMultipleErrors(output, stage);

            expect(errors.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should not return duplicate error codes', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 500 }),
          fc.string({ minLength: 1, maxLength: 30 }),
          (output, stage) => {
            const errors = classifier.classifyMultipleErrors(output, stage);
            const codes = errors.map((e) => e.code);
            const uniqueCodes = new Set(codes);

            expect(uniqueCodes.size).toBe(codes.length);
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});

