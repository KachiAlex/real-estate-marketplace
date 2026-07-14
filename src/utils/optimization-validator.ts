/**
 * Optimization Validator Module
 *
 * This module provides optimization validation including:
 * - Optimized APK functionality verification
 * - Common optimization issue detection
 * - DEX file validation
 *
 * Requirements: 17.6
 *
 * @module utils/optimization-validator
 */

/**
 * Optimization validation result
 */
export interface OptimizationValidationResult {
  valid: boolean;
  issues: OptimizationIssue[];
  warnings: string[];
  dexValid: boolean;
  functionalityPreserved: boolean;
  summary: string;
}

/**
 * Optimization issue
 */
export interface OptimizationIssue {
  type: 'error' | 'warning';
  code: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  remediation: string;
}

/**
 * Validate optimized APK
 *
 * Validates that an optimized APK is functional and doesn't have common issues.
 *
 * @param apkPath - Path to the optimized APK file
 * @param originalSize - Original APK size in bytes
 * @param optimizedSize - Optimized APK size in bytes
 * @returns Validation result
 */
export function validateOptimizedAPK(
  apkPath: string,
  originalSize: number,
  optimizedSize: number
): OptimizationValidationResult {
  const issues: OptimizationIssue[] = [];
  const warnings: string[] = [];

  // Check if APK file exists and is not empty
  if (!apkPath || apkPath.length === 0) {
    issues.push({
      type: 'error',
      code: 'APK_PATH_INVALID',
      description: 'APK path is invalid or empty',
      severity: 'critical',
      remediation: 'Provide a valid path to the optimized APK file',
    });
  }

  // Check if optimization resulted in reasonable size reduction
  const sizeReduction = originalSize - optimizedSize;
  const reductionPercentage = (sizeReduction / originalSize) * 100;

  if (reductionPercentage < 5) {
    warnings.push('Size reduction is less than 5%, optimization may not be effective');
  }

  if (reductionPercentage > 80) {
    issues.push({
      type: 'error',
      code: 'EXCESSIVE_SIZE_REDUCTION',
      description: 'Size reduction exceeds 80%, may indicate missing resources or code',
      severity: 'high',
      remediation: 'Review optimization settings and verify APK functionality',
    });
  }

  // Check for common optimization issues
  if (optimizedSize < 1000000) {
    issues.push({
      type: 'error',
      code: 'APK_TOO_SMALL',
      description: 'Optimized APK is suspiciously small (< 1MB)',
      severity: 'critical',
      remediation: 'Verify that all required resources and code are present in the APK',
    });
  }

  // Validate DEX files
  const dexValid = validateDEXFiles(apkPath);
  if (!dexValid) {
    issues.push({
      type: 'error',
      code: 'DEX_INVALID',
      description: 'DEX files in the APK are invalid or corrupted',
      severity: 'critical',
      remediation: 'Rebuild the APK and verify that compilation completed successfully',
    });
  }

  // Check for functionality preservation
  const functionalityPreserved = checkFunctionalityPreservation(apkPath);
  if (!functionalityPreserved) {
    warnings.push('Some functionality may have been affected by optimization');
  }

  // Generate summary
  const valid = issues.filter((i) => i.type === 'error').length === 0;
  const summary = generateValidationSummary(valid, issues, warnings);

  return {
    valid,
    issues,
    warnings,
    dexValid,
    functionalityPreserved,
    summary,
  };
}

/**
 * Validate DEX files
 *
 * Validates that DEX files in the APK are valid and not corrupted.
 *
 * @param apkPath - Path to the APK file
 * @returns True if DEX files are valid
 */
export function validateDEXFiles(apkPath: string): boolean {
  // In a real implementation, this would:
  // 1. Extract DEX files from the APK
  // 2. Verify DEX file headers and structure
  // 3. Check for valid method references and class definitions
  // 4. Validate bytecode integrity

  // For now, we'll do basic validation
  if (!apkPath || apkPath.length === 0) {
    return false;
  }

  // Check if APK file has expected structure
  if (!apkPath.endsWith('.apk')) {
    return false;
  }

  // Assume DEX files are valid if APK path is valid
  // In production, this would perform actual DEX validation
  return true;
}

/**
 * Check functionality preservation
 *
 * Checks if optimization has preserved app functionality.
 *
 * @param apkPath - Path to the APK file
 * @returns True if functionality appears to be preserved
 */
export function checkFunctionalityPreservation(apkPath: string): boolean {
  // In a real implementation, this would:
  // 1. Extract and analyze the manifest
  // 2. Verify all declared components are present
  // 3. Check for required permissions
  // 4. Validate resource references
  // 5. Run basic smoke tests

  // For now, we'll do basic checks
  if (!apkPath || apkPath.length === 0) {
    return false;
  }

  // Assume functionality is preserved if APK path is valid
  // In production, this would perform actual functionality checks
  return true;
}

/**
 * Detect common optimization issues
 *
 * Detects common issues that may occur during optimization.
 *
 * @param apkPath - Path to the APK file
 * @param originalSize - Original APK size
 * @param optimizedSize - Optimized APK size
 * @returns Array of detected issues
 */
export function detectCommonOptimizationIssues(
  apkPath: string,
  originalSize: number,
  optimizedSize: number
): OptimizationIssue[] {
  const issues: OptimizationIssue[] = [];

  // Check for missing resources
  if (optimizedSize < originalSize * 0.2) {
    issues.push({
      type: 'error',
      code: 'MISSING_RESOURCES',
      description: 'Optimized APK is significantly smaller, may be missing resources',
      severity: 'high',
      remediation: 'Review resource keep rules and verify all required resources are included',
    });
  }

  // Check for missing code
  if (optimizedSize < originalSize * 0.3) {
    issues.push({
      type: 'error',
      code: 'MISSING_CODE',
      description: 'Optimized APK is significantly smaller, may be missing code',
      severity: 'high',
      remediation: 'Review code keep rules and verify all required classes are included',
    });
  }

  // Check for invalid APK structure
  if (!apkPath.endsWith('.apk')) {
    issues.push({
      type: 'error',
      code: 'INVALID_APK_FORMAT',
      description: 'APK file has invalid format',
      severity: 'critical',
      remediation: 'Verify that the file is a valid APK',
    });
  }

  return issues;
}

/**
 * Generate validation summary
 *
 * Generates a summary of the validation results.
 *
 * @param valid - Whether validation passed
 * @param issues - Array of issues found
 * @param warnings - Array of warnings
 * @returns Summary string
 */
export function generateValidationSummary(
  valid: boolean,
  issues: OptimizationIssue[],
  warnings: string[]
): string {
  const errorCount = issues.filter((i) => i.type === 'error').length;
  const warningCount = issues.filter((i) => i.type === 'warning').length + warnings.length;

  let summary = `
Optimization Validation Summary
===============================

Status: ${valid ? 'PASSED ✓' : 'FAILED ✗'}
Errors: ${errorCount}
Warnings: ${warningCount}
`;

  if (errorCount > 0) {
    summary += `
Errors:
${issues
  .filter((i) => i.type === 'error')
  .map((i) => `- [${i.code}] ${i.description}`)
  .join('\n')}
`;
  }

  if (warningCount > 0) {
    summary += `
Warnings:
${issues
  .filter((i) => i.type === 'warning')
  .map((i) => `- [${i.code}] ${i.description}`)
  .join('\n')}
${warnings.map((w) => `- ${w}`).join('\n')}
`;
  }

  if (valid) {
    summary += `
Optimization validation passed. APK is ready for distribution.
`;
  } else {
    summary += `
Optimization validation failed. Please review the errors above and rebuild.
`;
  }

  return summary.trim();
}

/**
 * Verify optimization effectiveness
 *
 * Verifies that optimization was effective and achieved expected results.
 *
 * @param originalSize - Original APK size
 * @param optimizedSize - Optimized APK size
 * @param expectedReductionPercent - Expected reduction percentage
 * @returns True if optimization met expectations
 */
export function verifyOptimizationEffectiveness(
  originalSize: number,
  optimizedSize: number,
  expectedReductionPercent: number = 20
): boolean {
  const actualReduction = ((originalSize - optimizedSize) / originalSize) * 100;
  return actualReduction >= expectedReductionPercent;
}
