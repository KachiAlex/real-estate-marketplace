/**
 * Error Remediation Suggester
 *
 * Generates detailed remediation steps based on error type and context.
 * Provides actionable suggestions to help developers resolve build issues.
 *
 * @module utils/error-remediation-suggester
 */

import { BuildError, BuildErrorCode } from '../types/android-build';

/**
 * Remediation suggestion with detailed steps
 */
export interface RemediationSuggestion {
  /** Brief summary of the remediation */
  summary: string;

  /** Detailed steps to resolve the issue */
  steps: string[];

  /** Documentation link for more information */
  documentationLink?: string;

  /** Estimated time to resolve in minutes */
  estimatedTime?: number;

  /** Whether this is a common issue */
  isCommon: boolean;

  /** Alternative solutions if primary remediation fails */
  alternatives?: RemediationSuggestion[];
}

/**
 * ErrorRemediationSuggester generates detailed remediation suggestions for build errors
 *
 * This class provides comprehensive remediation guidance for different error types,
 * including step-by-step instructions, documentation links, and alternative solutions.
 *
 * @class ErrorRemediationSuggester
 */
export class ErrorRemediationSuggester {
  /**
   * Generate remediation suggestion for a build error
   *
   * @param error - The build error to generate remediation for
   * @returns Detailed remediation suggestion
   *
   * @example
   * ```typescript
   * const suggester = new ErrorRemediationSuggester();
   * const suggestion = suggester.generateRemediation(buildError);
   * console.log(suggestion.steps); // Array of remediation steps
   * ```
   */
  public generateRemediation(error: BuildError): RemediationSuggestion {
    switch (error.code) {
      case BuildErrorCode.BuildEnvInvalid:
        return this.generateEnvironmentRemediation(error);

      case BuildErrorCode.BuildConfigInvalid:
        return this.generateConfigurationRemediation(error);

      case BuildErrorCode.BuildGradleFailed:
        return this.generateGradleRemediation(error);

      case BuildErrorCode.BuildSigningFailed:
        return this.generateSigningRemediation(error);

      case BuildErrorCode.BuildVerificationFailed:
        return this.generateVerificationRemediation(error);

      case BuildErrorCode.BuildDependencyConflict:
        return this.generateDependencyRemediation(error);

      case BuildErrorCode.BuildResourceError:
        return this.generateResourceRemediation(error);

      case BuildErrorCode.BuildManifestError:
        return this.generateManifestRemediation(error);

      case BuildErrorCode.BuildCertificateExpired:
        return this.generateCertificateRemediation(error);

      case BuildErrorCode.BuildKeystoreError:
        return this.generateKeystoreRemediation(error);

      default:
        return this.generateGenericRemediation(error);
    }
  }

  /**
   * Generate remediation for environment validation errors
   */
  private generateEnvironmentRemediation(error: BuildError): RemediationSuggestion {
    return {
      summary: 'Set up Android development environment',
      steps: [
        'Download Android SDK from https://developer.android.com/studio',
        'Extract the SDK to a known location',
        'Set ANDROID_SDK_ROOT environment variable to the SDK path',
        'Verify by running: echo $ANDROID_SDK_ROOT (Linux/Mac) or echo %ANDROID_SDK_ROOT% (Windows)',
        'Restart your terminal or IDE for changes to take effect',
        'Run the build again',
      ],
      documentationLink: 'https://developer.android.com/studio/command-line/variables',
      estimatedTime: 15,
      isCommon: true,
      alternatives: [
        {
          summary: 'Use Android Studio to manage SDK',
          steps: [
            'Open Android Studio',
            'Go to Tools > SDK Manager',
            'Install required SDK versions',
            'Android Studio will automatically set environment variables',
          ],
          documentationLink: 'https://developer.android.com/studio/intro',
          estimatedTime: 10,
          isCommon: true,
        },
      ],
    };
  }

  /**
   * Generate remediation for configuration errors
   */
  private generateConfigurationRemediation(error: BuildError): RemediationSuggestion {
    return {
      summary: 'Fix build configuration',
      steps: [
        'Check build.gradle for syntax errors',
        'Verify all required fields are present',
        'Check AndroidManifest.xml for XML syntax errors',
        'Ensure all referenced resources exist',
        'Run: ./gradlew clean to clear build cache',
        'Run the build again',
      ],
      documentationLink: 'https://developer.android.com/studio/build',
      estimatedTime: 10,
      isCommon: true,
      alternatives: [
        {
          summary: 'Validate configuration files',
          steps: [
            'Use an XML validator for AndroidManifest.xml',
            'Use a Gradle syntax checker for build.gradle',
            'Compare with a working project configuration',
          ],
          estimatedTime: 5,
          isCommon: false,
        },
      ],
    };
  }

  /**
   * Generate remediation for Gradle build failures
   */
  private generateGradleRemediation(error: BuildError): RemediationSuggestion {
    const isCompilationError = error.details.toLowerCase().includes('cannot find');

    if (isCompilationError) {
      return {
        summary: 'Fix compilation errors in source code',
        steps: [
          'Read the error message carefully to identify the file and line number',
          'Open the file in your IDE',
          'Fix the compilation error (missing import, syntax error, etc.)',
          'Save the file',
          'Run the build again',
        ],
        documentationLink: 'https://developer.android.com/studio/build/troubleshoot',
        estimatedTime: 15,
        isCommon: true,
      };
    }

    return {
      summary: 'Resolve Gradle build failure',
      steps: [
        'Check the error message for specific details',
        'Run: ./gradlew clean to clear build cache',
        'Run: ./gradlew build --stacktrace for detailed error information',
        'Search for the error message in Android documentation',
        'Apply the suggested fix',
        'Run the build again',
      ],
      documentationLink: 'https://developer.android.com/studio/build/troubleshoot',
      estimatedTime: 20,
      isCommon: true,
    };
  }

  /**
   * Generate remediation for signing failures
   */
  private generateSigningRemediation(error: BuildError): RemediationSuggestion {
    return {
      summary: 'Fix signing configuration',
      steps: [
        'Verify keystore file exists at the specified path',
        'Verify keystore password is correct',
        'Verify key alias exists in the keystore',
        'Verify key password is correct',
        'Run: keytool -list -v -keystore <keystore_path> to verify keystore contents',
        'Update signing configuration if needed',
        'Run the build again',
      ],
      documentationLink: 'https://developer.android.com/studio/publish/app-signing',
      estimatedTime: 10,
      isCommon: true,
      alternatives: [
        {
          summary: 'Recreate keystore if corrupted',
          steps: [
            'Backup existing keystore',
            'Generate new keystore: keytool -genkey -v -keystore <new_keystore>',
            'Update build configuration with new keystore path',
            'Run the build again',
          ],
          estimatedTime: 15,
          isCommon: false,
        },
      ],
    };
  }

  /**
   * Generate remediation for verification failures
   */
  private generateVerificationRemediation(error: BuildError): RemediationSuggestion {
    return {
      summary: 'Verify build artifact integrity',
      steps: [
        'Check that APK/AAB file exists and is not empty',
        'Verify APK/AAB signature: jarsigner -verify -verbose <artifact>',
        'Check APK/AAB structure: unzip -l <artifact>',
        'Verify manifest is valid: aapt dump badging <artifact>',
        'Ensure all required resources are present',
        'Rebuild the artifact',
      ],
      documentationLink: 'https://developer.android.com/studio/build/verify-apk',
      estimatedTime: 15,
      isCommon: false,
    };
  }

  /**
   * Generate remediation for dependency conflicts
   */
  private generateDependencyRemediation(error: BuildError): RemediationSuggestion {
    return {
      summary: 'Resolve dependency conflicts',
      steps: [
        'Run: ./gradlew dependencies to view dependency tree',
        'Identify conflicting dependencies',
        'Use dependency resolution strategies in build.gradle',
        'Example: configurations.all { resolutionStrategy { force "com.example:lib:1.0" } }',
        'Or exclude conflicting transitive dependencies',
        'Example: exclude group: "com.example", module: "conflicting-lib"',
        'Run: ./gradlew clean build to rebuild',
      ],
      documentationLink: 'https://developer.android.com/studio/build/dependencies',
      estimatedTime: 20,
      isCommon: true,
      alternatives: [
        {
          summary: 'Update dependency versions',
          steps: [
            'Check for newer versions of conflicting dependencies',
            'Update to compatible versions',
            'Test that all features still work',
            'Rebuild the project',
          ],
          estimatedTime: 30,
          isCommon: true,
        },
      ],
    };
  }

  /**
   * Generate remediation for resource errors
   */
  private generateResourceRemediation(error: BuildError): RemediationSuggestion {
    return {
      summary: 'Fix resource compilation errors',
      steps: [
        'Check resource files in res/ directory for syntax errors',
        'Verify all resource references are valid',
        'Check for invalid characters in resource names',
        'Ensure resource IDs are unique',
        'Run: ./gradlew clean to clear resource cache',
        'Rebuild the project',
      ],
      documentationLink: 'https://developer.android.com/guide/topics/resources',
      estimatedTime: 15,
      isCommon: true,
    };
  }

  /**
   * Generate remediation for manifest errors
   */
  private generateManifestRemediation(error: BuildError): RemediationSuggestion {
    return {
      summary: 'Fix AndroidManifest.xml errors',
      steps: [
        'Open AndroidManifest.xml in your IDE',
        'Check for XML syntax errors',
        'Verify all required elements are present',
        'Ensure all declared components exist in code',
        'Verify all permissions are valid',
        'Use IDE validation to check for errors',
        'Rebuild the project',
      ],
      documentationLink: 'https://developer.android.com/guide/topics/manifest/manifest-intro',
      estimatedTime: 15,
      isCommon: true,
    };
  }

  /**
   * Generate remediation for certificate expiration
   */
  private generateCertificateRemediation(error: BuildError): RemediationSuggestion {
    return {
      summary: 'Renew or replace signing certificate',
      steps: [
        'Check certificate expiration: keytool -list -v -keystore <keystore>',
        'If expired, generate new key: keytool -genkey -v -keystore <keystore>',
        'Update build configuration with new key alias',
        'For Google Play: Use Play Console to manage signing keys',
        'Test signing with new certificate',
        'Rebuild the project',
      ],
      documentationLink: 'https://developer.android.com/studio/publish/app-signing#sign-apk',
      estimatedTime: 20,
      isCommon: false,
    };
  }

  /**
   * Generate remediation for keystore errors
   */
  private generateKeystoreRemediation(error: BuildError): RemediationSuggestion {
    return {
      summary: 'Fix keystore access issues',
      steps: [
        'Verify keystore file exists at specified path',
        'Check file permissions: ls -la <keystore> (Linux/Mac)',
        'Verify keystore is readable by build process',
        'Test keystore access: keytool -list -keystore <keystore>',
        'If corrupted, restore from backup or recreate',
        'Update build configuration with correct path',
        'Rebuild the project',
      ],
      documentationLink: 'https://developer.android.com/studio/publish/app-signing',
      estimatedTime: 15,
      isCommon: false,
    };
  }

  /**
   * Generate generic remediation for unknown errors
   */
  private generateGenericRemediation(error: BuildError): RemediationSuggestion {
    return {
      summary: 'Troubleshoot build error',
      steps: [
        'Read the error message carefully',
        'Search for the error message in Android documentation',
        'Check Stack Overflow for similar issues',
        'Run: ./gradlew clean to clear build cache',
        'Run: ./gradlew build --stacktrace for detailed information',
        'Check build.gradle and AndroidManifest.xml for issues',
        'Try rebuilding the project',
      ],
      documentationLink: 'https://developer.android.com/studio/build/troubleshoot',
      estimatedTime: 30,
      isCommon: false,
    };
  }

  /**
   * Get remediation suggestions for multiple errors
   *
   * @param errors - Array of build errors
   * @returns Array of remediation suggestions
   */
  public generateRemediations(errors: BuildError[]): RemediationSuggestion[] {
    return errors.map((error) => this.generateRemediation(error));
  }

  /**
   * Format remediation suggestion as readable text
   *
   * @param suggestion - Remediation suggestion
   * @returns Formatted text
   */
  public formatSuggestion(suggestion: RemediationSuggestion): string {
    let text = `${suggestion.summary}\n\n`;

    text += 'Steps:\n';
    suggestion.steps.forEach((step, index) => {
      text += `${index + 1}. ${step}\n`;
    });

    if (suggestion.estimatedTime) {
      text += `\nEstimated time: ${suggestion.estimatedTime} minutes\n`;
    }

    if (suggestion.documentationLink) {
      text += `\nDocumentation: ${suggestion.documentationLink}\n`;
    }

    if (suggestion.alternatives && suggestion.alternatives.length > 0) {
      text += '\nAlternative solutions:\n';
      suggestion.alternatives.forEach((alt, index) => {
        text += `\nAlternative ${index + 1}: ${alt.summary}\n`;
      });
    }

    return text;
  }
}
