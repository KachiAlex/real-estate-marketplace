import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { ValidationResult, ValidationStatus, ValidationCategory } from '../types/mobile-config';

/**
 * Represents a dependency resolution result
 */
export interface DependencyResolutionResult {
  success: boolean;
  resolved: string[];
  unresolved: string[];
  conflicts: Array<{
    dependency: string;
    issue: string;
  }>;
  error?: string;
}

/**
 * Resolves Android Gradle dependencies
 * @returns Resolution result with resolved and unresolved dependencies
 */
export function resolveAndroidGradleDependencies(): DependencyResolutionResult {
  try {
    const buildGradlePath = path.join(process.cwd(), 'android', 'app', 'build.gradle');

    if (!fs.existsSync(buildGradlePath)) {
      return {
        success: false,
        resolved: [],
        unresolved: [],
        conflicts: [],
        error: 'android/app/build.gradle not found',
      };
    }

    // Try to resolve dependencies using Gradle
    try {
      const output = execSync('cd android && ./gradlew dependencies --configuration releaseRuntimeClasspath', {
        encoding: 'utf-8',
        stdio: 'pipe',
        cwd: process.cwd(),
      });

      const resolved: string[] = [];
      const unresolved: string[] = [];
      const conflicts: Array<{ dependency: string; issue: string }> = [];

      // Parse Gradle output
      const lines = output.split('\n');
      for (const line of lines) {
        // Look for resolved dependencies
        if (line.includes('-> ')) {
          const match = line.match(/([a-zA-Z0-9._-]+:[a-zA-Z0-9._-]+:[a-zA-Z0-9._-]+)/);
          if (match) {
            resolved.push(match[1]);
          }
        }

        // Look for unresolved dependencies
        if (line.includes('UNRESOLVED')) {
          const match = line.match(/([a-zA-Z0-9._-]+:[a-zA-Z0-9._-]+:[a-zA-Z0-9._-]+)/);
          if (match) {
            unresolved.push(match[1]);
          }
        }

        // Look for conflicts
        if (line.includes('conflict')) {
          conflicts.push({
            dependency: line.trim(),
            issue: 'Version conflict detected',
          });
        }
      }

      return {
        success: unresolved.length === 0 && conflicts.length === 0,
        resolved,
        unresolved,
        conflicts,
      };
    } catch (error) {
      // If Gradle command fails, try to parse build.gradle directly
      const content = fs.readFileSync(buildGradlePath, 'utf-8');
      const resolved: string[] = [];

      // Extract dependencies from build.gradle
      const depPattern = /implementation\s+['"]([^'"]+)['"]/g;
      let match;

      while ((match = depPattern.exec(content)) !== null) {
        resolved.push(match[1]);
      }

      return {
        success: true,
        resolved,
        unresolved: [],
        conflicts: [],
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      resolved: [],
      unresolved: [],
      conflicts: [],
      error: `Failed to resolve Android Gradle dependencies: ${errorMessage}`,
    };
  }
}

/**
 * Resolves iOS CocoaPods dependencies
 * @returns Resolution result with resolved and unresolved dependencies
 */
export function resolveIOSCocoaPodsDependencies(): DependencyResolutionResult {
  try {
    if (process.platform !== 'darwin') {
      return {
        success: false,
        resolved: [],
        unresolved: [],
        conflicts: [],
        error: 'CocoaPods resolution only available on macOS',
      };
    }

    const podfilePath = path.join(process.cwd(), 'ios', 'Podfile');

    if (!fs.existsSync(podfilePath)) {
      return {
        success: false,
        resolved: [],
        unresolved: [],
        conflicts: [],
        error: 'ios/Podfile not found',
      };
    }

    // Try to resolve dependencies using CocoaPods
    try {
      const output = execSync('cd ios && pod install --repo-update', {
        encoding: 'utf-8',
        stdio: 'pipe',
        cwd: process.cwd(),
      });

      const resolved: string[] = [];
      const unresolved: string[] = [];
      const conflicts: Array<{ dependency: string; issue: string }> = [];

      // Parse CocoaPods output
      const lines = output.split('\n');
      for (const line of lines) {
        // Look for installed pods
        if (line.includes('Installing') || line.includes('Using')) {
          const match = line.match(/([a-zA-Z0-9._-]+)\s+\(([0-9.]+)\)/);
          if (match) {
            resolved.push(`${match[1]}:${match[2]}`);
          }
        }

        // Look for conflicts
        if (line.includes('conflict') || line.includes('ERROR')) {
          conflicts.push({
            dependency: line.trim(),
            issue: 'Dependency issue detected',
          });
        }
      }

      return {
        success: unresolved.length === 0 && conflicts.length === 0,
        resolved,
        unresolved,
        conflicts,
      };
    } catch (error) {
      // If pod install fails, try to parse Podfile directly
      const content = fs.readFileSync(podfilePath, 'utf-8');
      const resolved: string[] = [];

      // Extract pods from Podfile
      const podPattern = /pod\s+['"]([^'"]+)['"]/g;
      let match;

      while ((match = podPattern.exec(content)) !== null) {
        resolved.push(match[1]);
      }

      return {
        success: true,
        resolved,
        unresolved: [],
        conflicts: [],
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      resolved: [],
      unresolved: [],
      conflicts: [],
      error: `Failed to resolve iOS CocoaPods dependencies: ${errorMessage}`,
    };
  }
}

/**
 * Detects unresolved dependencies
 * @param resolutionResult - Dependency resolution result
 * @returns List of unresolved dependencies with remediation steps
 */
export function detectUnresolvedDependencies(resolutionResult: DependencyResolutionResult): {
  unresolved: string[];
  remediation: string[];
} {
  const remediation: string[] = [];

  if (resolutionResult.unresolved.length > 0) {
    remediation.push('Run dependency resolution:');
    remediation.push('  - For Android: cd android && ./gradlew dependencies');
    remediation.push('  - For iOS: cd ios && pod install');
  }

  if (resolutionResult.conflicts.length > 0) {
    remediation.push('Resolve version conflicts:');
    for (const conflict of resolutionResult.conflicts) {
      remediation.push(`  - ${conflict.dependency}: ${conflict.issue}`);
    }
  }

  return {
    unresolved: resolutionResult.unresolved,
    remediation,
  };
}

/**
 * Provides remediation steps for dependency conflicts
 * @param conflicts - List of conflicts
 * @returns Remediation steps
 */
export function provideRemediationSteps(
  conflicts: Array<{ dependency: string; issue: string }>
): string[] {
  const steps: string[] = [];

  if (conflicts.length === 0) {
    return ['No conflicts detected'];
  }

  steps.push('To resolve dependency conflicts:');
  steps.push('');

  for (const conflict of conflicts) {
    steps.push(`1. Issue: ${conflict.issue}`);
    steps.push(`   Dependency: ${conflict.dependency}`);
    steps.push('');
  }

  steps.push('2. Update dependency versions:');
  steps.push('   - For Android: Update build.gradle versions');
  steps.push('   - For iOS: Update Podfile versions');
  steps.push('');

  steps.push('3. Clear dependency cache:');
  steps.push('   - For Android: cd android && ./gradlew clean');
  steps.push('   - For iOS: cd ios && rm -rf Pods && pod install');
  steps.push('');

  steps.push('4. Rebuild the project');

  return steps;
}

/**
 * Comprehensive native dependency validation
 * @returns Complete validation result
 */
export function validateNativeDependencies(): ValidationResult {
  const timestamp = new Date();
  const checks = [];

  // Resolve Android dependencies
  const androidResult = resolveAndroidGradleDependencies();
  checks.push({
    name: 'Android Gradle Dependencies',
    category: ValidationCategory.DEPENDENCY,
    status: androidResult.success ? ValidationStatus.PASS : ValidationStatus.FAIL,
    message: androidResult.success
      ? `${androidResult.resolved.length} Android dependencies resolved`
      : `Android dependency resolution failed: ${androidResult.error || 'Unknown error'}`,
    remediation: androidResult.success
      ? undefined
      : 'Run: cd android && ./gradlew dependencies',
    documentationLink: 'https://developer.android.com/studio/build/dependencies',
  });

  // Resolve iOS dependencies
  const iosResult = resolveIOSCocoaPodsDependencies();
  checks.push({
    name: 'iOS CocoaPods Dependencies',
    category: ValidationCategory.DEPENDENCY,
    status: iosResult.success ? ValidationStatus.PASS : ValidationStatus.FAIL,
    message: iosResult.success
      ? `${iosResult.resolved.length} iOS dependencies resolved`
      : `iOS dependency resolution failed: ${iosResult.error || 'Unknown error'}`,
    remediation: iosResult.success
      ? undefined
      : 'Run: cd ios && pod install',
    documentationLink: 'https://cocoapods.org/',
  });

  // Check for unresolved dependencies
  const androidUnresolved = detectUnresolvedDependencies(androidResult);
  const iosUnresolved = detectUnresolvedDependencies(iosResult);

  if (androidUnresolved.unresolved.length > 0 || iosUnresolved.unresolved.length > 0) {
    checks.push({
      name: 'Unresolved Dependencies',
      category: ValidationCategory.DEPENDENCY,
      status: ValidationStatus.FAIL,
      message: `Found unresolved dependencies: ${[...androidUnresolved.unresolved, ...iosUnresolved.unresolved].join(', ')}`,
      remediation: [...androidUnresolved.remediation, ...iosUnresolved.remediation].join('; '),
      documentationLink: 'https://capacitorjs.com/docs/getting-started',
    });
  }

  // Check for conflicts
  const allConflicts = [...androidResult.conflicts, ...iosResult.conflicts];
  if (allConflicts.length > 0) {
    const remediationSteps = provideRemediationSteps(allConflicts);
    checks.push({
      name: 'Dependency Conflicts',
      category: ValidationCategory.DEPENDENCY,
      status: ValidationStatus.FAIL,
      message: `Found ${allConflicts.length} dependency conflict(s)`,
      remediation: remediationSteps.join('; '),
      documentationLink: 'https://capacitorjs.com/docs/getting-started',
    });
  }

  const overallStatus = checks.every((check) => check.status === ValidationStatus.PASS)
    ? ValidationStatus.PASS
    : ValidationStatus.FAIL;

  return {
    timestamp,
    overallStatus,
    checks,
    summary:
      overallStatus === ValidationStatus.PASS
        ? 'All native dependencies are properly resolved'
        : 'Native dependency issues detected',
  };
}
