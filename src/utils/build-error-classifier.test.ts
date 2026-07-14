/**
 * Unit Tests for BuildErrorClassifier
 *
 * Tests the error classification, detail extraction, and remediation suggestion
 * functionality of the BuildErrorClassifier component.
 *
 * @module utils/build-error-classifier.test
 */

import { BuildErrorClassifier } from './build-error-classifier';
import { BuildErrorCode } from '../types/android-build';

describe('BuildErrorClassifier', () => {
  let classifier: BuildErrorClassifier;

  beforeEach(() => {
    classifier = new BuildErrorClassifier();
  });

  describe('classifyError', () => {
    it('should classify Android SDK not found error', () => {
      const output = 'Error: ANDROID_SDK_ROOT not set. Please set ANDROID_SDK_ROOT environment variable.';
      const error = classifier.classifyError(output, 'validation');

      expect(error.code).toBe(BuildErrorCode.BuildEnvInvalid);
      expect(error.stage).toBe('validation');
      expect(error.message).toContain('environment');
      expect(error.remediation).toContain('ANDROID_SDK_ROOT');
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should classify Gradle not found error', () => {
      const output = 'Error: gradle not found. Please install Gradle or use gradlew.';
      const error = classifier.classifyError(output, 'validation');

      expect(error.code).toBe(BuildErrorCode.BuildEnvInvalid);
      expect(error.remediation).toContain('Gradle');
    });

    it('should classify configuration error', () => {
      const output = 'Error: Invalid configuration in build.gradle. Missing required field.';
      const error = classifier.classifyError(output, 'validation');

      expect(error.code).toBe(BuildErrorCode.BuildConfigInvalid);
      expect(error.remediation).toContain('build.gradle');
    });

    it('should classify dependency conflict error', () => {
      const output = `
        Error: Dependency conflict detected
        com.example:library:1.0 conflicts with com.example:library:2.0
        Cannot resolve dependency
      `;
      const error = classifier.classifyError(output, 'dependency-resolution');

      expect(error.code).toBe(BuildErrorCode.BuildDependencyConflict);
      expect(error.remediation).toContain('dependencies');
    });

    it('should classify compilation error', () => {
      const output = `
        error: cannot find symbol
        symbol: class MainActivity
        location: package com.example.app
      `;
      const error = classifier.classifyError(output, 'compilation');

      expect(error.code).toBe(BuildErrorCode.BuildGradleFailed);
      expect(error.remediation).toContain('source code');
    });

    it('should classify resource error', () => {
      const output = 'Error: Resource compilation failed. Invalid resource in res/layout/main.xml';
      const error = classifier.classifyError(output, 'compilation');

      expect(error.code).toBe(BuildErrorCode.BuildResourceError);
      expect(error.remediation).toContain('resource');
    });

    it('should classify manifest error', () => {
      const output = 'Error: Manifest validation failed. Invalid manifest syntax in AndroidManifest.xml';
      const error = classifier.classifyError(output, 'compilation');

      expect(error.code).toBe(BuildErrorCode.BuildManifestError);
      expect(error.remediation).toContain('AndroidManifest');
    });

    it('should classify signing error', () => {
      const output = 'Error: Signing failed. Keystore password is incorrect.';
      const error = classifier.classifyError(output, 'signing');

      expect(error.code).toBe(BuildErrorCode.BuildSigningFailed);
      expect(error.remediation).toContain('keystore');
    });

    it('should classify certificate expired error', () => {
      const output = 'Error: Certificate validation failed. Certificate is expired.';
      const error = classifier.classifyError(output, 'signing');

      expect(error.code).toBe(BuildErrorCode.BuildCertificateExpired);
      expect(error.remediation).toContain('certificate');
    });

    it('should classify verification error', () => {
      const output = 'Error: Verification failed. Invalid signature on APK.';
      const error = classifier.classifyError(output, 'verification');

      expect(error.code).toBe(BuildErrorCode.BuildVerificationFailed);
      expect(error.remediation).toContain('APK');
    });

    it('should classify generic Gradle failure when no pattern matches', () => {
      const output = 'Build failed with unknown error';
      const error = classifier.classifyError(output, 'packaging');

      expect(error.code).toBe(BuildErrorCode.BuildGradleFailed);
      expect(error.stage).toBe('packaging');
      expect(error.remediation).toBeDefined();
    });

    it('should include documentation links when available', () => {
      const output = 'Error: ANDROID_SDK_ROOT not set.';
      const error = classifier.classifyError(output, 'validation');

      expect(error.documentationLink).toBeDefined();
      expect(error.documentationLink).toContain('http');
    });

    it('should extract error details from output', () => {
      const output = `
        Some build output
        Error: cannot find symbol
        symbol: class MyClass
        More output
      `;
      const error = classifier.classifyError(output, 'compilation');

      expect(error.details).toBeDefined();
      expect(error.details.length).toBeGreaterThan(0);
    });
  });

  describe('classifyMultipleErrors', () => {
    it('should identify multiple distinct errors', () => {
      const output = `
        Error: ANDROID_SDK_ROOT not set
        Error: Dependency conflict detected
        Error: Compilation failed
      `;
      const errors = classifier.classifyMultipleErrors(output, 'compilation');

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.length).toBeLessThanOrEqual(3);
    });

    it('should avoid duplicate error codes', () => {
      const output = `
        Error: ANDROID_SDK_ROOT not set
        Error: ANDROID_HOME not set
        Error: ANDROID_SDK_ROOT not configured
      `;
      const errors = classifier.classifyMultipleErrors(output, 'validation');

      const codes = errors.map((e) => e.code);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(codes.length);
    });

    it('should return at least one error', () => {
      const output = 'Build failed';
      const errors = classifier.classifyMultipleErrors(output, 'packaging');

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should include remediation for all errors', () => {
      const output = `
        Error: ANDROID_SDK_ROOT not set
        Error: Dependency conflict detected
      `;
      const errors = classifier.classifyMultipleErrors(output, 'compilation');

      errors.forEach((error) => {
        expect(error.remediation).toBeDefined();
        expect(error.remediation.length).toBeGreaterThan(0);
      });
    });
  });

  describe('hasErrors', () => {
    it('should detect ERROR keyword', () => {
      const output = 'Build output with ERROR in it';
      expect(classifier.hasErrors(output)).toBe(true);
    });

    it('should detect FAILED keyword', () => {
      const output = 'Build FAILED';
      expect(classifier.hasErrors(output)).toBe(true);
    });

    it('should detect error keyword (lowercase)', () => {
      const output = 'error: something went wrong';
      expect(classifier.hasErrors(output)).toBe(true);
    });

    it('should detect failed keyword (lowercase)', () => {
      const output = 'build failed';
      expect(classifier.hasErrors(output)).toBe(true);
    });

    it('should detect exception keyword', () => {
      const output = 'Exception: NullPointerException';
      expect(classifier.hasErrors(output)).toBe(true);
    });

    it('should return false for successful output', () => {
      const output = 'Build completed successfully';
      expect(classifier.hasErrors(output)).toBe(false);
    });

    it('should return false for empty output', () => {
      const output = '';
      expect(classifier.hasErrors(output)).toBe(false);
    });
  });

  describe('extractErrorSummary', () => {
    it('should extract BUILD FAILED summary', () => {
      const output = `
        Some build output
        BUILD FAILED in 30s
        More details
      `;
      const summary = classifier.extractErrorSummary(output);

      expect(summary).toContain('BUILD FAILED');
    });

    it('should extract error summary line', () => {
      const output = `
        Build output
        error summary: Compilation failed
        More details
      `;
      const summary = classifier.extractErrorSummary(output);

      expect(summary).toContain('error summary');
    });

    it('should extract first error line if no summary', () => {
      const output = `
        Build output
        ERROR: Something went wrong
        More details
      `;
      const summary = classifier.extractErrorSummary(output);

      expect(summary).toContain('ERROR');
    });

    it('should return last non-empty line as fallback', () => {
      const output = `
        Build output
        Some error
        
        
      `;
      const summary = classifier.extractErrorSummary(output);

      expect(summary).toBe('Some error');
    });

    it('should handle output with no errors', () => {
      const output = 'Build completed successfully';
      const summary = classifier.extractErrorSummary(output);

      expect(summary).toBeDefined();
      expect(summary.length).toBeGreaterThan(0);
    });
  });

  describe('error message generation', () => {
    it('should generate appropriate message for BUILD_ENV_INVALID', () => {
      const output = 'ANDROID_SDK_ROOT not set';
      const error = classifier.classifyError(output, 'validation');

      expect(error.message).toContain('environment');
    });

    it('should generate appropriate message for BUILD_CONFIG_INVALID', () => {
      const output = 'Invalid configuration in build.gradle';
      const error = classifier.classifyError(output, 'validation');

      expect(error.message).toContain('configuration');
    });

    it('should generate appropriate message for BUILD_GRADLE_FAILED', () => {
      const output = 'Compilation failed';
      const error = classifier.classifyError(output, 'compilation');

      expect(error.message).toContain('failed');
    });

    it('should include stage name in generic error message', () => {
      const output = 'Unknown error';
      const error = classifier.classifyError(output, 'custom-stage');

      expect(error.message).toContain('custom-stage');
    });
  });

  describe('error details extraction', () => {
    it('should extract multiple error lines', () => {
      const output = `
        error: cannot find symbol
        symbol: class MainActivity
        location: package com.example
      `;
      const error = classifier.classifyError(output, 'compilation');

      expect(error.details).toContain('cannot find symbol');
    });

    it('should handle multiline error output', () => {
      const output = `
        Error: Dependency conflict
        com.example:lib:1.0 vs com.example:lib:2.0
        Conflicting dependencies found
      `;
      const error = classifier.classifyError(output, 'dependency-resolution');

      expect(error.details).toBeDefined();
      expect(error.details.length).toBeGreaterThan(0);
    });

    it('should extract keystore-related error details', () => {
      const output = 'Error: keystore password is incorrect';
      const error = classifier.classifyError(output, 'signing');

      expect(error.details).toContain('keystore');
    });
  });

  describe('remediation suggestions', () => {
    it('should suggest SDK setup for environment errors', () => {
      const output = 'ANDROID_SDK_ROOT not set';
      const error = classifier.classifyError(output, 'validation');

      expect(error.remediation).toContain('ANDROID_SDK_ROOT');
      expect(error.remediation).toContain('environment');
    });

    it('should suggest dependency resolution for conflicts', () => {
      const output = 'Dependency conflict detected';
      const error = classifier.classifyError(output, 'dependency-resolution');

      expect(error.remediation).toContain('dependencies');
    });

    it('should suggest code fixes for compilation errors', () => {
      const output = 'error: cannot find symbol';
      const error = classifier.classifyError(output, 'compilation');

      expect(error.remediation).toContain('source code');
    });

    it('should suggest keystore verification for signing errors', () => {
      const output = 'Signing failed';
      const error = classifier.classifyError(output, 'signing');

      expect(error.remediation).toContain('keystore');
    });

    it('should suggest certificate renewal for expired certificates', () => {
      const output = 'Error: certificate expired validation failed';
      const error = classifier.classifyError(output, 'signing');

      expect(error.remediation).toContain('certificate');
    });
  });

  describe('edge cases', () => {
    it('should handle empty output', () => {
      const error = classifier.classifyError('', 'validation');

      expect(error).toBeDefined();
      expect(error.code).toBeDefined();
      expect(error.message).toBeDefined();
    });

    it('should handle very long output', () => {
      const longOutput = 'Error: ' + 'x'.repeat(10000);
      const error = classifier.classifyError(longOutput, 'compilation');

      expect(error).toBeDefined();
      expect(error.details).toBeDefined();
    });

    it('should handle output with special characters', () => {
      const output = 'Error: Special chars: @#$%^&*()';
      const error = classifier.classifyError(output, 'validation');

      expect(error).toBeDefined();
      expect(error.message).toBeDefined();
    });

    it('should handle output with unicode characters', () => {
      const output = 'Error: Unicode chars: 你好世界 🚀';
      const error = classifier.classifyError(output, 'validation');

      expect(error).toBeDefined();
      expect(error.message).toBeDefined();
    });

    it('should handle null/undefined stage gracefully', () => {
      const output = 'Error: Something failed';
      const error = classifier.classifyError(output, '');

      expect(error).toBeDefined();
      expect(error.stage).toBe('');
    });
  });

  describe('case insensitivity', () => {
    it('should match errors regardless of case', () => {
      const outputs = [
        'ERROR: Something failed',
        'error: Something failed',
        'Error: Something failed',
        'eRrOr: Something failed',
      ];

      outputs.forEach((output) => {
        expect(classifier.hasErrors(output)).toBe(true);
      });
    });

    it('should classify errors with mixed case keywords', () => {
      const output = 'ANDROID_SDK_ROOT not set';
      const error = classifier.classifyError(output, 'validation');

      expect(error.code).toBe(BuildErrorCode.BuildEnvInvalid);
    });
  });

  describe('timestamp handling', () => {
    it('should set timestamp to current time', () => {
      const before = new Date();
      const error = classifier.classifyError('Error: test', 'validation');
      const after = new Date();

      expect(error.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(error.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should set timestamp for all errors in classifyMultipleErrors', () => {
      const output = 'Error: test1\nError: test2';
      const errors = classifier.classifyMultipleErrors(output, 'validation');

      errors.forEach((error) => {
        expect(error.timestamp).toBeInstanceOf(Date);
      });
    });
  });
});
