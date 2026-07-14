import * as fs from 'fs';
import * as path from 'path';
import { DependencyMatrix, ValidationResult, ValidationStatus, ValidationCategory } from '../types/mobile-config';
import { detectAllDependencyVersions } from './dependency-checker';

/**
 * Default compatibility matrix for known versions
 */
const DEFAULT_COMPATIBILITY_MATRIX: Record<string, DependencyMatrix> = {
  '5.0.0': {
    capacitor: {
      version: '5.0.0',
      minAndroidSdk: 34,
      minIosSdk: '14.0',
      minGradleVersion: '8.0.0',
      minCocoaPodsVersion: '1.11.0',
    },
    android: {
      sdkVersion: 34,
      buildToolsVersion: '34.0.0',
      gradleVersion: '8.0.0',
    },
    ios: {
      sdkVersion: '14.0',
      xcodeVersion: '15.0',
      cocoaPodsVersion: '1.11.0',
    },
  },
  '4.8.0': {
    capacitor: {
      version: '4.8.0',
      minAndroidSdk: 33,
      minIosSdk: '13.0',
      minGradleVersion: '7.5.0',
      minCocoaPodsVersion: '1.11.0',
    },
    android: {
      sdkVersion: 33,
      buildToolsVersion: '33.0.0',
      gradleVersion: '7.5.0',
    },
    ios: {
      sdkVersion: '13.0',
      xcodeVersion: '14.0',
      cocoaPodsVersion: '1.11.0',
    },
  },
};

/**
 * Loads compatibility matrix from file or uses default
 * @param matrixPath - Path to compatibility matrix file
 * @returns Loaded compatibility matrix
 */
export function loadCompatibilityMatrix(matrixPath?: string): {
  success: boolean;
  matrix?: Record<string, DependencyMatrix>;
  error?: string;
} {
  try {
    if (matrixPath && fs.existsSync(matrixPath)) {
      const content = fs.readFileSync(matrixPath, 'utf-8');
      const matrix = JSON.parse(content);
      return {
        success: true,
        matrix,
      };
    }

    // Use default matrix
    return {
      success: true,
      matrix: DEFAULT_COMPATIBILITY_MATRIX,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to load compatibility matrix: ${errorMessage}`,
    };
  }
}

/**
 * Compares two version strings
 * @param v1 - First version
 * @param v2 - Second version
 * @returns -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map((p) => parseInt(p, 10));
  const parts2 = v2.split('.').map((p) => parseInt(p, 10));

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;

    if (p1 < p2) return -1;
    if (p1 > p2) return 1;
  }

  return 0;
}

/**
 * Verifies all installed versions are compatible
 * @param detectedVersions - Detected versions
 * @param matrix - Compatibility matrix
 * @returns Compatibility check result
 */
export function verifyVersionCompatibility(
  detectedVersions: Record<string, any>,
  matrix: Record<string, DependencyMatrix>
): {
  success: boolean;
  compatible: boolean;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Find matching Capacitor version in matrix
  const capacitorVersion = detectedVersions.capacitor;
  if (!capacitorVersion) {
    issues.push('Capacitor version not detected');
    return {
      success: false,
      compatible: false,
      issues,
      suggestions: ['Install Capacitor: npm install @capacitor/core'],
    };
  }

  // Find closest matching matrix entry
  let matchedEntry: DependencyMatrix | null = null;
  for (const [version, entry] of Object.entries(matrix)) {
    if (compareVersions(capacitorVersion, version) >= 0) {
      matchedEntry = entry;
      break;
    }
  }

  if (!matchedEntry) {
    issues.push(`Capacitor version ${capacitorVersion} not found in compatibility matrix`);
    return {
      success: false,
      compatible: false,
      issues,
      suggestions: ['Update Capacitor to a supported version'],
    };
  }

  // Check Android SDK compatibility
  if (detectedVersions.androidSdk) {
    if (detectedVersions.androidSdk < matchedEntry.capacitor.minAndroidSdk) {
      issues.push(
        `Android SDK API level ${detectedVersions.androidSdk} is below minimum required ${matchedEntry.capacitor.minAndroidSdk}`
      );
      suggestions.push(
        `Install Android SDK API level ${matchedEntry.capacitor.minAndroidSdk} or higher`
      );
    }
  }

  // Check iOS SDK compatibility
  if (detectedVersions.iosSdk) {
    if (compareVersions(detectedVersions.iosSdk, matchedEntry.capacitor.minIosSdk) < 0) {
      issues.push(
        `iOS SDK ${detectedVersions.iosSdk} is below minimum required ${matchedEntry.capacitor.minIosSdk}`
      );
      suggestions.push(
        `Install iOS SDK ${matchedEntry.capacitor.minIosSdk} or higher`
      );
    }
  }

  // Check Gradle compatibility
  if (detectedVersions.gradle) {
    if (compareVersions(detectedVersions.gradle, matchedEntry.capacitor.minGradleVersion) < 0) {
      issues.push(
        `Gradle ${detectedVersions.gradle} is below minimum required ${matchedEntry.capacitor.minGradleVersion}`
      );
      suggestions.push(
        `Update Gradle to ${matchedEntry.capacitor.minGradleVersion} or higher in gradle-wrapper.properties`
      );
    }
  }

  // Check CocoaPods compatibility
  if (detectedVersions.cocoaPods) {
    if (compareVersions(detectedVersions.cocoaPods, matchedEntry.capacitor.minCocoaPodsVersion) < 0) {
      issues.push(
        `CocoaPods ${detectedVersions.cocoaPods} is below minimum required ${matchedEntry.capacitor.minCocoaPodsVersion}`
      );
      suggestions.push(
        `Update CocoaPods: sudo gem install cocoapods`
      );
    }
  }

  return {
    success: true,
    compatible: issues.length === 0,
    issues,
    suggestions,
  };
}

/**
 * Detects version conflicts between dependencies
 * @param detectedVersions - Detected versions
 * @returns Conflict detection result
 */
export function detectVersionConflicts(detectedVersions: Record<string, any>): {
  success: boolean;
  conflicts: Array<{
    dependency1: string;
    dependency2: string;
    issue: string;
  }>;
} {
  const conflicts: Array<{
    dependency1: string;
    dependency2: string;
    issue: string;
  }> = [];

  // Check for known conflicts
  if (detectedVersions.gradle && detectedVersions.androidSdk) {
    // Gradle 8.0+ requires Android SDK 34+
    if (compareVersions(detectedVersions.gradle, '8.0.0') >= 0) {
      if (detectedVersions.androidSdk < 34) {
        conflicts.push({
          dependency1: 'Gradle',
          dependency2: 'Android SDK',
          issue: `Gradle ${detectedVersions.gradle} requires Android SDK API level 34+, but ${detectedVersions.androidSdk} is installed`,
        });
      }
    }
  }

  return {
    success: conflicts.length === 0,
    conflicts,
  };
}

/**
 * Suggests compatible version combinations
 * @param matrix - Compatibility matrix
 * @returns Suggested version combinations
 */
export function suggestCompatibleVersions(matrix: Record<string, DependencyMatrix>): {
  suggestions: Array<{
    capacitor: string;
    android: string;
    ios: string;
    gradle: string;
    cocoaPods: string;
  }>;
} {
  const suggestions = [];

  for (const [capacitorVersion, entry] of Object.entries(matrix)) {
    suggestions.push({
      capacitor: capacitorVersion,
      android: `API level ${entry.android.sdkVersion}+`,
      ios: `${entry.ios.sdkVersion}+`,
      gradle: entry.android.gradleVersion,
      cocoaPods: entry.ios.cocoaPodsVersion,
    });
  }

  return {
    suggestions,
  };
}

/**
 * Comprehensive compatibility validation
 * @param matrixPath - Path to compatibility matrix file
 * @returns Complete validation result
 */
export function validateDependencyCompatibility(matrixPath?: string): ValidationResult {
  const timestamp = new Date();
  const checks = [];

  // Load compatibility matrix
  const matrixResult = loadCompatibilityMatrix(matrixPath);
  if (!matrixResult.success) {
    return {
      timestamp,
      overallStatus: ValidationStatus.FAIL,
      checks: [
        {
          name: 'Compatibility Matrix',
          category: ValidationCategory.DEPENDENCY,
          status: ValidationStatus.FAIL,
          message: matrixResult.error || 'Failed to load compatibility matrix',
          remediation: 'Ensure compatibility matrix is properly configured',
          documentationLink: 'https://capacitorjs.com/docs/getting-started',
        },
      ],
      summary: 'Dependency compatibility validation failed: matrix not available',
    };
  }

  const matrix = matrixResult.matrix!;

  // Detect all versions
  const detectedVersions = detectAllDependencyVersions();

  // Verify compatibility
  const compatibilityResult = verifyVersionCompatibility(detectedVersions, matrix);
  checks.push({
    name: 'Version Compatibility',
    category: ValidationCategory.DEPENDENCY,
    status: compatibilityResult.compatible ? ValidationStatus.PASS : ValidationStatus.FAIL,
    message: compatibilityResult.compatible
      ? 'All dependency versions are compatible'
      : `Compatibility issues found: ${compatibilityResult.issues.join('; ')}`,
    remediation: compatibilityResult.suggestions.length > 0
      ? compatibilityResult.suggestions.join('; ')
      : undefined,
    documentationLink: 'https://capacitorjs.com/docs/getting-started',
  });

  // Detect conflicts
  const conflictResult = detectVersionConflicts(detectedVersions);
  checks.push({
    name: 'Version Conflicts',
    category: ValidationCategory.DEPENDENCY,
    status: conflictResult.success ? ValidationStatus.PASS : ValidationStatus.FAIL,
    message: conflictResult.success
      ? 'No version conflicts detected'
      : `Conflicts found: ${conflictResult.conflicts.map((c) => c.issue).join('; ')}`,
    remediation: conflictResult.success
      ? undefined
      : 'Resolve version conflicts by updating dependencies',
    documentationLink: 'https://capacitorjs.com/docs/getting-started',
  });

  const overallStatus = checks.every((check) => check.status === ValidationStatus.PASS)
    ? ValidationStatus.PASS
    : ValidationStatus.FAIL;

  return {
    timestamp,
    overallStatus,
    checks,
    summary:
      overallStatus === ValidationStatus.PASS
        ? 'All dependencies are compatible'
        : 'Dependency compatibility issues detected',
  };
}
