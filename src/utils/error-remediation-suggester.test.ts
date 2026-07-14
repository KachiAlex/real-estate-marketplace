/**
 * Unit Tests for ErrorRemediationSuggester
 *
 * Tests the remediation suggestion generation for different error types.
 *
 * @module utils/error-remediation-suggester.test
 */

import { ErrorRemediationSuggester } from './error-remediation-suggester';
import { BuildError, BuildErrorCode } from '../types/android-build';

describe('ErrorRemediationSuggester', () => {
  let suggester: ErrorRemediationSuggester;

  beforeEach(() => {
    suggester = new ErrorRemediationSuggester();
  });

  describe('generateRemediation', () => {
    it('should generate environment remediation for BUILD_ENV_INVALID', () => {
      const error: BuildError = {
        code: BuildErrorCode.BuildEnvInvalid,
        stage: 'validation',
        message: 'Android SDK not found',
        details: 'ANDROID_SDK_ROOT not set',
        remediation: 'Set ANDROID_SDK_ROOT',
        timestamp: new Date(),
      };

      const suggestion = suggester.generateRemediation(error);

      expect(suggestion.summary).toContain('environment');
      expect(suggestion.steps.length).toBeGreaterThan(0);
      expect(suggestion.steps[0]).toContain('Android SDK');
      expect(suggestion.isCommon).toBe(true);
    });

    it('should generate configuration remediation for BUILD_CONFIG_INVALID', () => {
      const error: BuildError = {
        code: BuildErrorCode.BuildConfigInvalid,
        stage: 'validation',
        message: 'Configuration invalid',
        details: 'build.gradle error',
        remediation: 'Fix configuration',
        timestamp: new Date(),
      };

      const suggestion = suggester.generateRemediation(error);

      expect(suggestion.summary).toContain('configuration');
      expect(suggestion.steps.length).toBeGreaterThan(0);
      expect(suggestion.steps.some((s) => s.includes('build.gradle'))).toBe(true);
    });

    it('should generate Gradle remediation for BUILD_GRADLE_FAILED', () => {
      const error: BuildError = {
        code: BuildErrorCode.BuildGradleFailed,
        stage: 'compilation',
        message: 'Gradle build failed',
        details: 'build error',
        remediation: 'Fix compilation errors',
        timestamp: new Date(),
      };

      const suggestion = suggester.generateRemediation(error);

      expect(suggestion.summary).toBeDefined();
      expect(suggestion.steps.length).toBeGreaterThan(0);
    });

    it('should generate signing remediation for BUILD_SIGNING_FAILED', () => {
      const error: BuildError = {
        code: BuildErrorCode.BuildSigningFailed,
        stage: 'signing',
        message: 'Signing failed',
        details: 'keystore error',
        remediation: 'Fix keystore',
        timestamp: new Date(),
      };

      const suggestion = suggester.generateRemediation(error);

      expect(suggestion.summary).toContain('signing');
      expect(suggestion.steps.length).toBeGreaterThan(0);
      expect(suggestion.steps.some((s) => s.includes('keystore'))).toBe(true);
    });

    it('should generate verification remediation for BUILD_VERIFICATION_FAILED', () => {
      const error: BuildError = {
        code: BuildErrorCode.BuildVerificationFailed,
        stage: 'verification',
        message: 'Verification failed',
        details: 'APK structure invalid',
        remediation: 'Verify artifact',
        timestamp: new Date(),
      };

      const suggestion = suggester.generateRemediation(error);

      expect(suggestion.summary).toContain('Verify');
      expect(suggestion.steps.length).toBeGreaterThan(0);
    });

    it('should generate dependency remediation for BUILD_DEPENDENCY_CONFLICT', () => {
      const error: BuildError = {
        code: BuildErrorCode.BuildDependencyConflict,
        stage: 'dependency-resolution',
        message: 'Dependency conflict',
        details: 'version conflict',
        remediation: 'Resolve dependencies',
        timestamp: new Date(),
      };

      const suggestion = suggester.generateRemediation(error);

      expect(suggestion.summary).toContain('dependency');
      expect(suggestion.steps.length).toBeGreaterThan(0);
      expect(suggestion.steps.some((s) => s.includes('dependencies'))).toBe(true);
    });

    it('should generate resource remediation for BUILD_RESOURCE_ERROR', () => {
      const error: BuildError = {
        code: BuildErrorCode.BuildResourceError,
        stage: 'compilation',
        message: 'Resource error',
        details: 'resource not found',
        remediation: 'Fix resources',
        timestamp: new Date(),
      };

      const suggestion = suggester.generateRemediation(error);

      expect(suggestion.summary).toContain('resource');
      expect(suggestion.steps.length).toBeGreaterThan(0);
    });

    it('should generate manifest remediation for BUILD_MANIFEST_ERROR', () => {
      const error: BuildError = {
        code: BuildErrorCode.BuildManifestError,
        stage: 'compilation',
        message: 'Manifest error',
        details: 'manifest validation failed',
        remediation: 'Fix manifest',
        timestamp: new Date(),
      };

      const suggestion = suggester.generateRemediation(error);

      expect(suggestion.summary).toContain('Manifest');
      expect(suggestion.steps.length).toBeGreaterThan(0);
    });

    it('should generate certificate remediation for BUILD_CERTIFICATE_EXPIRED', () => {
      const error: BuildError = {
        code: BuildErrorCode.BuildCertificateExpired,
        stage: 'signing',
        message: 'Certificate expired',
        details: 'certificate validation failed',
        remediation: 'Renew certificate',
        timestamp: new Date(),
      };

      const suggestion = suggester.generateRemediation(error);

      expect(suggestion.summary).toContain('certificate');
      expect(suggestion.steps.length).toBeGreaterThan(0);
    });

    it('should generate keystore remediation for BUILD_KEYSTORE_ERROR', () => {
      const error: BuildError = {
        code: BuildErrorCode.BuildKeystoreError,
        stage: 'signing',
        message: 'Keystore error',
        details: 'keystore not found',
        remediation: 'Fix keystore',
        timestamp: new Date(),
      };

      const suggestion = suggester.generateRemediation(error);

      expect(suggestion.summary).toContain('keystore');
      expect(suggestion.steps.length).toBeGreaterThan(0);
    });
  });

  describe('generateRemediations', () => {
    it('should generate remediations for multiple errors', () => {
      const errors: BuildError[] = [
        {
          code: BuildErrorCode.BuildEnvInvalid,
          stage: 'validation',
          message: 'Environment invalid',
          details: 'SDK not found',
          remediation: 'Set SDK',
          timestamp: new Date(),
        },
        {
          code: BuildErrorCode.BuildGradleFailed,
          stage: 'compilation',
          message: 'Build failed',
          details: 'compilation error',
          remediation: 'Fix code',
          timestamp: new Date(),
        },
      ];

      const suggestions = suggester.generateRemediations(errors);

      expect(suggestions.length).toBe(2);
      expect(suggestions[0].summary).toContain('environment');
      expect(suggestions[1].summary).toContain('Gradle');
    });

    it('should handle empty error array', () => {
      const suggestions = suggester.generateRemediations([]);

      expect(suggestions.length).toBe(0);
    });
  });

  describe('formatSuggestion', () => {
    it('should format suggestion with all fields', () => {
      const error: BuildError = {
        code: BuildErrorCode.BuildEnvInvalid,
        stage: 'validation',
        message: 'Environment invalid',
        details: 'SDK not found',
        remediation: 'Set SDK',
        timestamp: new Date(),
      };

      const suggestion = suggester.generateRemediation(error);
      const formatted = suggester.formatSuggestion(suggestion);

      expect(formatted).toContain(suggestion.summary);
      expect(formatted).toContain('Steps:');
      expect(formatted).toContain('1.');
      expect(formatted).toContain('Documentation:');
    });

    it('should include estimated time when available', () => {
      const error: BuildError = {
        code: BuildErrorCode.BuildEnvInvalid,
        stage: 'validation',
        message: 'Environment invalid',
        details: 'SDK not found',
        remediation: 'Set SDK',
        timestamp: new Date(),
      };

      const suggestion = suggester.generateRemediation(error);
      const formatted = suggester.formatSuggestion(suggestion);

      if (suggestion.estimatedTime) {
        expect(formatted).toContain('Estimated time:');
        expect(formatted).toContain(suggestion.estimatedTime.toString());
      }
    });

    it('should include alternatives when available', () => {
      const error: BuildError = {
        code: BuildErrorCode.BuildEnvInvalid,
        stage: 'validation',
        message: 'Environment invalid',
        details: 'SDK not found',
        remediation: 'Set SDK',
        timestamp: new Date(),
      };

      const suggestion = suggester.generateRemediation(error);
      const formatted = suggester.formatSuggestion(suggestion);

      if (suggestion.alternatives && suggestion.alternatives.length > 0) {
        expect(formatted).toContain('Alternative solutions:');
      }
    });

    it('should format steps with numbers', () => {
      const error: BuildError = {
        code: BuildErrorCode.BuildGradleFailed,
        stage: 'compilation',
        message: 'Build failed',
        details: 'cannot find symbol',
        remediation: 'Fix code',
        timestamp: new Date(),
      };

      const suggestion = suggester.generateRemediation(error);
      const formatted = suggester.formatSuggestion(suggestion);

      expect(formatted).toContain('1.');
      expect(formatted).toContain('2.');
      expect(formatted).toContain('3.');
    });
  });

  describe('remediation properties', () => {
    it('should always have non-empty summary', () => {
      const errors = [
        BuildErrorCode.BuildEnvInvalid,
        BuildErrorCode.BuildConfigInvalid,
        BuildErrorCode.BuildGradleFailed,
        BuildErrorCode.BuildSigningFailed,
        BuildErrorCode.BuildVerificationFailed,
        BuildErrorCode.BuildDependencyConflict,
        BuildErrorCode.BuildResourceError,
        BuildErrorCode.BuildManifestError,
        BuildErrorCode.BuildCertificateExpired,
        BuildErrorCode.BuildKeystoreError,
      ];

      errors.forEach((code) => {
        const error: BuildError = {
          code,
          stage: 'test',
          message: 'Test error',
          details: 'Test details',
          remediation: 'Test remediation',
          timestamp: new Date(),
        };

        const suggestion = suggester.generateRemediation(error);

        expect(suggestion.summary).toBeDefined();
        expect(suggestion.summary.length).toBeGreaterThan(0);
      });
    });

    it('should always have at least one step', () => {
      const errors = [
        BuildErrorCode.BuildEnvInvalid,
        BuildErrorCode.BuildConfigInvalid,
        BuildErrorCode.BuildGradleFailed,
        BuildErrorCode.BuildSigningFailed,
        BuildErrorCode.BuildVerificationFailed,
        BuildErrorCode.BuildDependencyConflict,
        BuildErrorCode.BuildResourceError,
        BuildErrorCode.BuildManifestError,
        BuildErrorCode.BuildCertificateExpired,
        BuildErrorCode.BuildKeystoreError,
      ];

      errors.forEach((code) => {
        const error: BuildError = {
          code,
          stage: 'test',
          message: 'Test error',
          details: 'Test details',
          remediation: 'Test remediation',
          timestamp: new Date(),
        };

        const suggestion = suggester.generateRemediation(error);

        expect(suggestion.steps.length).toBeGreaterThan(0);
        suggestion.steps.forEach((step) => {
          expect(step.length).toBeGreaterThan(0);
        });
      });
    });

    it('should have isCommon property', () => {
      const error: BuildError = {
        code: BuildErrorCode.BuildEnvInvalid,
        stage: 'validation',
        message: 'Environment invalid',
        details: 'SDK not found',
        remediation: 'Set SDK',
        timestamp: new Date(),
      };

      const suggestion = suggester.generateRemediation(error);

      expect(typeof suggestion.isCommon).toBe('boolean');
    });

    it('should have documentation link for most errors', () => {
      const errors = [
        BuildErrorCode.BuildEnvInvalid,
        BuildErrorCode.BuildConfigInvalid,
        BuildErrorCode.BuildGradleFailed,
        BuildErrorCode.BuildSigningFailed,
        BuildErrorCode.BuildVerificationFailed,
        BuildErrorCode.BuildDependencyConflict,
        BuildErrorCode.BuildResourceError,
        BuildErrorCode.BuildManifestError,
        BuildErrorCode.BuildCertificateExpired,
        BuildErrorCode.BuildKeystoreError,
      ];

      errors.forEach((code) => {
        const error: BuildError = {
          code,
          stage: 'test',
          message: 'Test error',
          details: 'Test details',
          remediation: 'Test remediation',
          timestamp: new Date(),
        };

        const suggestion = suggester.generateRemediation(error);

        if (suggestion.documentationLink) {
          expect(suggestion.documentationLink).toMatch(/^https?:\/\//);
        }
      });
    });
  });

  describe('edge cases', () => {
    it('should handle errors with minimal details', () => {
      const error: BuildError = {
        code: BuildErrorCode.BuildGradleFailed,
        stage: 'test',
        message: 'Error',
        details: '',
        remediation: '',
        timestamp: new Date(),
      };

      const suggestion = suggester.generateRemediation(error);

      expect(suggestion).toBeDefined();
      expect(suggestion.steps.length).toBeGreaterThan(0);
    });

    it('should handle errors with very long details', () => {
      const error: BuildError = {
        code: BuildErrorCode.BuildGradleFailed,
        stage: 'test',
        message: 'Error',
        details: 'x'.repeat(10000),
        remediation: '',
        timestamp: new Date(),
      };

      const suggestion = suggester.generateRemediation(error);

      expect(suggestion).toBeDefined();
      expect(suggestion.steps.length).toBeGreaterThan(0);
    });

    it('should format suggestion with no alternatives', () => {
      const error: BuildError = {
        code: BuildErrorCode.BuildVerificationFailed,
        stage: 'verification',
        message: 'Verification failed',
        details: 'APK invalid',
        remediation: 'Verify',
        timestamp: new Date(),
      };

      const suggestion = suggester.generateRemediation(error);
      const formatted = suggester.formatSuggestion(suggestion);

      expect(formatted).toBeDefined();
      expect(formatted.length).toBeGreaterThan(0);
    });
  });

  describe('compilation error detection', () => {
    it('should detect compilation errors and provide specific remediation', () => {
      const error: BuildError = {
        code: BuildErrorCode.BuildGradleFailed,
        stage: 'compilation',
        message: 'Build failed',
        details: 'cannot find symbol: class MainActivity',
        remediation: 'Fix code',
        timestamp: new Date(),
      };

      const suggestion = suggester.generateRemediation(error);

      expect(suggestion.summary).toContain('compilation');
      expect(suggestion.steps.some((s) => s.includes('error message'))).toBe(true);
    });

    it('should provide generic Gradle remediation for non-compilation errors', () => {
      const error: BuildError = {
        code: BuildErrorCode.BuildGradleFailed,
        stage: 'packaging',
        message: 'Build failed',
        details: 'unknown error',
        remediation: 'Fix error',
        timestamp: new Date(),
      };

      const suggestion = suggester.generateRemediation(error);

      expect(suggestion.summary).toContain('Gradle');
      expect(suggestion.steps.some((s) => s.includes('stacktrace'))).toBe(true);
    });
  });
});
