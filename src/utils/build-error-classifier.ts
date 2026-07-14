/**
 * Build Error Classifier
 *
 * Categorizes build errors by type, assigns error codes, and extracts error details
 * from Gradle output. This component helps developers quickly understand what went
 * wrong during the build process.
 *
 * @module utils/build-error-classifier
 */

import { BuildError, BuildErrorCode } from '../types/android-build';

/**
 * Error pattern for matching specific error types in Gradle output
 */
interface ErrorPattern {
  /** Regular expression to match the error */
  pattern: RegExp;

  /** Error code to assign if pattern matches */
  code: BuildErrorCode;

  /** Function to extract details from the match */
  extractDetails: (match: RegExpMatchArray, output: string) => string;

  /** Function to generate remediation steps */
  generateRemediation: (details: string) => string;

  /** Optional documentation link */
  documentationLink?: string;
}

/**
 * BuildErrorClassifier categorizes build errors and provides remediation suggestions
 *
 * This class analyzes Gradle build output to identify error types, extract relevant
 * details, and suggest remediation steps. It supports common Android build errors
 * including environment issues, configuration problems, dependency conflicts,
 * compilation errors, signing failures, and verification failures.
 *
 * @class BuildErrorClassifier
 */
export class BuildErrorClassifier {
  /**
   * Error patterns for matching specific error types
   */
  private static readonly ERROR_PATTERNS: ErrorPattern[] = [
    // Environment validation errors
    {
      pattern: /Android SDK not found|ANDROID_SDK_ROOT|ANDROID_HOME/gi,
      code: BuildErrorCode.BuildEnvInvalid,
      extractDetails: (match, output) => {
        const lines = output.split('\n');
        const errorLine = lines.find((line) => line.includes(match[0]));
        return errorLine || 'Android SDK not found or not properly configured';
      },
      generateRemediation: () =>
        'Set ANDROID_SDK_ROOT or ANDROID_HOME environment variable to your Android SDK installation directory',
      documentationLink: 'https://developer.android.com/studio/command-line/variables',
    },

    // Gradle not found
    {
      pattern: /gradle not found|gradle wrapper not found|gradlew/gi,
      code: BuildErrorCode.BuildEnvInvalid,
      extractDetails: (match, output) => 'Gradle or Gradle wrapper not found',
      generateRemediation: () =>
        'Ensure Gradle is installed or run ./gradlew wrapper to generate the Gradle wrapper',
      documentationLink: 'https://gradle.org/install/',
    },

    // Dependency conflicts (must come before configuration errors)
    {
      pattern: /dependency conflict|version conflict|cannot resolve|unresolved dependency/gi,
      code: BuildErrorCode.BuildDependencyConflict,
      extractDetails: (match, output) => {
        const lines = output.split('\n');
        const conflictLines = lines.filter((line) =>
          /conflict|cannot resolve|unresolved/i.test(line)
        );
        return conflictLines.slice(0, 3).join('\n') || 'Dependency conflict detected';
      },
      generateRemediation: () =>
        'Run ./gradlew dependencies to analyze dependency tree and resolve conflicts. Use dependency resolution strategies in build.gradle if needed',
      documentationLink: 'https://developer.android.com/studio/build/dependencies',
    },

    // Manifest errors (must come before configuration errors)
    {
      pattern: /manifest error|manifest validation failed|invalid manifest|manifest syntax/gi,
      code: BuildErrorCode.BuildManifestError,
      extractDetails: (match, output) => {
        const lines = output.split('\n');
        const errorLine = lines.find((line) => /manifest|AndroidManifest/i.test(line));
        return errorLine || 'AndroidManifest.xml validation failed';
      },
      generateRemediation: () =>
        'Validate AndroidManifest.xml syntax and ensure all required elements are present',
      documentationLink: 'https://developer.android.com/guide/topics/manifest/manifest-intro',
    },

    // Resource errors (must come before configuration errors)
    {
      pattern: /resource error|resource not found|invalid resource|resource compilation failed/gi,
      code: BuildErrorCode.BuildResourceError,
      extractDetails: (match, output) => {
        const lines = output.split('\n');
        const errorLine = lines.find((line) => /resource|res\//i.test(line));
        return errorLine || 'Resource compilation failed';
      },
      generateRemediation: () =>
        'Check your resource files in res/ directory for syntax errors or invalid references',
      documentationLink: 'https://developer.android.com/guide/topics/resources',
    },

    // Configuration errors
    {
      pattern: /invalid configuration|configuration error|build\.gradle/gi,
      code: BuildErrorCode.BuildConfigInvalid,
      extractDetails: (match, output) => {
        const lines = output.split('\n');
        const errorLine = lines.find((line) => line.includes(match[0]));
        return errorLine || 'Build configuration is invalid';
      },
      generateRemediation: () =>
        'Check build.gradle and AndroidManifest.xml for syntax errors or missing required fields',
      documentationLink: 'https://developer.android.com/studio/build',
    },

    // Compilation errors
    {
      pattern: /compilation failed|error: cannot find symbol|error: incompatible types/gi,
      code: BuildErrorCode.BuildGradleFailed,
      extractDetails: (match, output) => {
        const lines = output.split('\n');
        const errorLines = lines.filter((line) => /error:|cannot find|incompatible/i.test(line));
        return errorLines.slice(0, 5).join('\n') || 'Compilation failed';
      },
      generateRemediation: () =>
        'Fix compilation errors in your source code. Check the error messages for file paths and line numbers',
      documentationLink: 'https://developer.android.com/studio/build/troubleshoot',
    },

    // Signing errors
    {
      pattern: /signing failed|keystore error|key not found|invalid keystore|keystore password/gi,
      code: BuildErrorCode.BuildSigningFailed,
      extractDetails: (match, output) => {
        const lines = output.split('\n');
        const errorLine = lines.find((line) => /signing|keystore|key/i.test(line));
        return errorLine || 'Signing failed';
      },
      generateRemediation: () =>
        'Verify keystore file exists, keystore password is correct, and key alias is valid',
      documentationLink: 'https://developer.android.com/studio/publish/app-signing',
    },

    // Certificate errors
    {
      pattern: /certificate expired|certificate not valid|certificate error|certificate validation/gi,
      code: BuildErrorCode.BuildCertificateExpired,
      extractDetails: (match, output) => {
        const lines = output.split('\n');
        const errorLine = lines.find((line) => /certificate|expired/i.test(line));
        return errorLine || 'Certificate validation failed';
      },
      generateRemediation: () =>
        'Check certificate expiration date. If expired, generate a new signing key or renew the certificate',
      documentationLink: 'https://developer.android.com/studio/publish/app-signing#sign-apk',
    },

    // Verification errors
    {
      pattern: /verification failed|verification error|invalid signature|signature verification/gi,
      code: BuildErrorCode.BuildVerificationFailed,
      extractDetails: (match, output) => {
        const lines = output.split('\n');
        const errorLine = lines.find((line) => /verification|signature/i.test(line));
        return errorLine || 'Artifact verification failed';
      },
      generateRemediation: () =>
        'Verify the APK/AAB structure and signature. Ensure the artifact was built correctly',
      documentationLink: 'https://developer.android.com/studio/build/verify-apk',
    },
  ];

  /**
   * Classify a build error from Gradle output
   *
   * Analyzes the provided Gradle output to identify the error type, extract details,
   * and generate remediation suggestions.
   *
   * @param output - Gradle build output containing error messages
   * @param stage - Build stage where the error occurred
   * @returns BuildError object with classification and remediation
   *
   * @example
   * ```typescript
   * const classifier = new BuildErrorClassifier();
   * const error = classifier.classifyError(gradleOutput, 'compilation');
   * console.log(error.code); // BUILD_GRADLE_FAILED
   * console.log(error.remediation); // Fix compilation errors...
   * ```
   */
  public classifyError(output: string, stage: string): BuildError {
    // Try to match against known error patterns
    for (const pattern of BuildErrorClassifier.ERROR_PATTERNS) {
      const match = output.match(pattern.pattern);
      if (match) {
        const details = pattern.extractDetails(match, output);
        const remediation = pattern.generateRemediation(details);

        return {
          code: pattern.code,
          stage,
          message: this.generateErrorMessage(pattern.code, stage),
          details,
          remediation,
          documentationLink: pattern.documentationLink,
          timestamp: new Date(),
        };
      }
    }

    // If no pattern matched, classify as generic Gradle failure
    return {
      code: BuildErrorCode.BuildGradleFailed,
      stage,
      message: `Build failed during ${stage} stage`,
      details: this.extractGenericErrorDetails(output),
      remediation: 'Check the build output above for error details and fix the issues',
      timestamp: new Date(),
    };
  }

  /**
   * Extract generic error details from output when no specific pattern matches
   *
   * @param output - Gradle build output
   * @returns Extracted error details
   */
  private extractGenericErrorDetails(output: string): string {
    const lines = output.split('\n');

    // Look for lines containing ERROR or FAILED
    const errorLines = lines.filter((line) => /ERROR|FAILED|error|failed/i.test(line));

    if (errorLines.length > 0) {
      return errorLines.slice(0, 5).join('\n');
    }

    // If no error lines found, return last 5 lines
    return lines.slice(-5).join('\n');
  }

  /**
   * Generate a human-readable error message based on error code and stage
   *
   * @param code - Error code
   * @param stage - Build stage
   * @returns Human-readable error message
   */
  private generateErrorMessage(code: BuildErrorCode, stage: string): string {
    const messages: Record<BuildErrorCode, string> = {
      [BuildErrorCode.BuildEnvInvalid]: 'Build environment is not properly configured',
      [BuildErrorCode.BuildConfigInvalid]: 'Build configuration is invalid',
      [BuildErrorCode.BuildGradleFailed]: 'Gradle build failed',
      [BuildErrorCode.BuildSigningFailed]: 'Build signing failed',
      [BuildErrorCode.BuildVerificationFailed]: 'Build artifact verification failed',
      [BuildErrorCode.BuildDependencyConflict]: 'Dependency conflict detected',
      [BuildErrorCode.BuildResourceError]: 'Resource compilation failed',
      [BuildErrorCode.BuildManifestError]: 'Manifest validation failed',
      [BuildErrorCode.BuildCertificateExpired]: 'Signing certificate is invalid or expired',
      [BuildErrorCode.BuildKeystoreError]: 'Keystore access failed',
    };

    return messages[code] || `Build failed during ${stage} stage`;
  }

  /**
   * Classify multiple errors from build output
   *
   * Useful for builds that produce multiple errors. This method attempts to
   * identify all distinct errors in the output.
   *
   * @param output - Gradle build output
   * @param stage - Build stage where errors occurred
   * @returns Array of BuildError objects
   *
   * @example
   * ```typescript
   * const classifier = new BuildErrorClassifier();
   * const errors = classifier.classifyMultipleErrors(gradleOutput, 'compilation');
   * console.log(errors.length); // Number of distinct errors found
   * ```
   */
  public classifyMultipleErrors(output: string, stage: string): BuildError[] {
    const errors: BuildError[] = [];
    const processedPatterns = new Set<BuildErrorCode>();

    // Find all matching patterns
    for (const pattern of BuildErrorClassifier.ERROR_PATTERNS) {
      // Check if pattern matches (using test for non-global patterns)
      if (pattern.pattern.test(output)) {
        // Only add one error per error code to avoid duplicates
        if (!processedPatterns.has(pattern.code)) {
          const match = output.match(pattern.pattern);
          if (match) {
            const details = pattern.extractDetails(match, output);
            const remediation = pattern.generateRemediation(details);

            errors.push({
              code: pattern.code,
              stage,
              message: this.generateErrorMessage(pattern.code, stage),
              details,
              remediation,
              documentationLink: pattern.documentationLink,
              timestamp: new Date(),
            });

            processedPatterns.add(pattern.code);
          }
        }
      }
    }

    // If no patterns matched, return a generic error
    if (errors.length === 0) {
      errors.push({
        code: BuildErrorCode.BuildGradleFailed,
        stage,
        message: `Build failed during ${stage} stage`,
        details: this.extractGenericErrorDetails(output),
        remediation: 'Check the build output above for error details and fix the issues',
        timestamp: new Date(),
      });
    }

    return errors;
  }

  /**
   * Check if output contains any errors
   *
   * @param output - Gradle build output
   * @returns True if output contains error indicators
   */
  public hasErrors(output: string): boolean {
    return /ERROR|FAILED|error|failed|exception/i.test(output);
  }

  /**
   * Extract error summary from build output
   *
   * Provides a concise summary of what went wrong.
   *
   * @param output - Gradle build output
   * @returns Error summary string
   */
  public extractErrorSummary(output: string): string {
    const lines = output.split('\n');

    // Look for summary lines
    const summaryLines = lines.filter((line) => /BUILD FAILED|error summary|failed/i.test(line));

    if (summaryLines.length > 0) {
      return summaryLines[0].trim();
    }

    // Look for the first error line
    const errorLine = lines.find((line) => /ERROR|error:/i.test(line));
    if (errorLine) {
      return errorLine.trim();
    }

    // Return last non-empty line
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].trim()) {
        return lines[i].trim();
      }
    }

    return 'Build failed with unknown error';
  }
}
