import * as fs from 'fs';
import * as path from 'path';
import { VerificationResult, VerificationCheck } from '../types/android-build';

/**
 * VerificationReportGenerator creates comprehensive verification reports
 * from verification results, documenting all checks and remediation steps.
 */
export class VerificationReportGenerator {
  /**
   * Generate a comprehensive verification report
   * @param results Array of verification results
   * @param outputPath Optional path to save the report
   * @returns Generated report as string
   */
  generateReport(results: VerificationResult[], outputPath?: string): string {
    const report = this.buildReport(results);

    if (outputPath) {
      fs.writeFileSync(outputPath, report, 'utf8');
    }

    return report;
  }

  /**
   * Build the verification report
   */
  private buildReport(results: VerificationResult[]): string {
    const lines: string[] = [];

    // Header
    lines.push('='.repeat(80));
    lines.push('ANDROID BUILD VERIFICATION REPORT');
    lines.push('='.repeat(80));
    lines.push('');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push(`Total Artifacts Verified: ${results.length}`);
    lines.push('');

    // Summary
    const summary = this.generateSummary(results);
    lines.push(summary);
    lines.push('');

    // Detailed Results
    lines.push('-'.repeat(80));
    lines.push('DETAILED VERIFICATION RESULTS');
    lines.push('-'.repeat(80));
    lines.push('');

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      lines.push(this.generateArtifactReport(result, i + 1));
      lines.push('');
    }

    // Remediation Steps
    const remediationSteps = this.generateRemediationSteps(results);
    if (remediationSteps) {
      lines.push('-'.repeat(80));
      lines.push('REMEDIATION STEPS');
      lines.push('-'.repeat(80));
      lines.push('');
      lines.push(remediationSteps);
      lines.push('');
    }

    // Recommendations
    const recommendations = this.generateRecommendations(results);
    if (recommendations) {
      lines.push('-'.repeat(80));
      lines.push('RECOMMENDATIONS');
      lines.push('-'.repeat(80));
      lines.push('');
      lines.push(recommendations);
      lines.push('');
    }

    // Footer
    lines.push('='.repeat(80));
    lines.push('END OF REPORT');
    lines.push('='.repeat(80));

    return lines.join('\n');
  }

  /**
   * Generate summary section
   */
  private generateSummary(results: VerificationResult[]): string {
    const lines: string[] = [];

    lines.push('SUMMARY');
    lines.push('-'.repeat(40));

    const passCount = results.filter(r => r.overallStatus === 'pass').length;
    const warningCount = results.filter(r => r.overallStatus === 'warning').length;
    const failCount = results.filter(r => r.overallStatus === 'fail').length;

    lines.push(`✓ Passed:  ${passCount}/${results.length}`);
    lines.push(`⚠ Warnings: ${warningCount}/${results.length}`);
    lines.push(`✗ Failed:  ${failCount}/${results.length}`);
    lines.push('');

    // Overall status
    const overallStatus =
      failCount > 0 ? 'FAILED' : warningCount > 0 ? 'WARNING' : 'PASSED';
    lines.push(`Overall Status: ${overallStatus}`);

    // Check breakdown
    const allChecks = results.flatMap(r => r.checks);
    const checkPassCount = allChecks.filter(c => c.status === 'pass').length;
    const checkWarningCount = allChecks.filter(c => c.status === 'warning').length;
    const checkFailCount = allChecks.filter(c => c.status === 'fail').length;

    lines.push('');
    lines.push('Check Results:');
    lines.push(`  ✓ Passed:  ${checkPassCount}/${allChecks.length}`);
    lines.push(`  ⚠ Warnings: ${checkWarningCount}/${allChecks.length}`);
    lines.push(`  ✗ Failed:  ${checkFailCount}/${allChecks.length}`);

    return lines.join('\n');
  }

  /**
   * Generate report for a single artifact
   */
  private generateArtifactReport(result: VerificationResult, index: number): string {
    const lines: string[] = [];

    // Artifact header
    const statusIcon =
      result.overallStatus === 'pass' ? '✓' : result.overallStatus === 'warning' ? '⚠' : '✗';
    lines.push(`${statusIcon} Artifact ${index}: ${path.basename(result.artifactPath)}`);
    lines.push(`  Path: ${result.artifactPath}`);
    lines.push(`  Status: ${result.overallStatus.toUpperCase()}`);
    lines.push(`  Duration: ${result.duration}ms`);
    
    // Handle invalid dates
    try {
      lines.push(`  Timestamp: ${result.timestamp.toISOString()}`);
    } catch (error) {
      lines.push(`  Timestamp: Invalid date`);
    }
    lines.push('');

    // Checks by category
    const checksByCategory = this.groupChecksByCategory(result.checks);

    for (const [category, checks] of Object.entries(checksByCategory)) {
      lines.push(`  ${category.toUpperCase()}`);
      lines.push('  ' + '-'.repeat(36));

      for (const check of checks) {
        const icon = check.status === 'pass' ? '✓' : check.status === 'warning' ? '⚠' : '✗';
        lines.push(`    ${icon} ${check.name}`);
        lines.push(`      Status: ${check.status}`);
        lines.push(`      Message: ${check.message}`);

        if (check.details) {
          lines.push(`      Details: ${check.details}`);
        }
      }

      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Group checks by category
   */
  private groupChecksByCategory(checks: VerificationCheck[]): Record<string, VerificationCheck[]> {
    const grouped: Record<string, VerificationCheck[]> = {};

    for (const check of checks) {
      if (!grouped[check.category]) {
        grouped[check.category] = [];
      }
      grouped[check.category].push(check);
    }

    return grouped;
  }

  /**
   * Generate remediation steps for failed checks
   */
  private generateRemediationSteps(results: VerificationResult[]): string {
    const lines: string[] = [];
    const failedChecks = results
      .flatMap(r => r.checks.map(c => ({ ...c, artifact: r.artifactPath })))
      .filter(c => c.status === 'fail');

    if (failedChecks.length === 0) {
      return '';
    }

    for (let i = 0; i < failedChecks.length; i++) {
      const check = failedChecks[i];
      lines.push(`${i + 1}. ${check.name} (${path.basename(check.artifact)})`);
      lines.push(`   Issue: ${check.message}`);
      lines.push(`   Remediation:`);

      // Provide specific remediation based on check type
      const remediation = this.getRemediation(check.name, check.message);
      if (Array.isArray(remediation)) {
        for (const step of remediation) {
          lines.push(`     - ${step}`);
        }
      }

      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Get remediation steps for a specific check
   */
  private getRemediation(checkName: string, message: string): string[] {
    const remediations: Record<string, string[]> = {
      'File Existence': [
        'Verify the artifact file path is correct',
        'Check that the file has not been deleted or moved',
        'Ensure you have read permissions for the file',
      ],
      'File Size': [
        'Verify the build completed successfully',
        'Check that the artifact file is not corrupted',
        'Try rebuilding the application',
      ],
      'ZIP Structure': [
        'Verify the artifact is a valid APK or AAB file',
        'Check that the file was not corrupted during transfer',
        'Try rebuilding the application',
      ],
      'AndroidManifest.xml': [
        'Verify the AndroidManifest.xml file exists in the project',
        'Check that the manifest is properly formatted',
        'Rebuild the application to regenerate the manifest',
      ],
      'DEX Files': [
        'Verify the application has source code',
        'Check that the build completed successfully',
        'Try rebuilding the application',
      ],
      'Signature Files': [
        'Verify the artifact is properly signed',
        'Check the signing configuration in build.gradle',
        'Try rebuilding with signing enabled',
      ],
      'Package Name': [
        'Verify the package name in AndroidManifest.xml is valid',
        'Package names must follow Java naming conventions (e.g., com.example.app)',
        'Update the package name and rebuild',
      ],
      'SDK Versions': [
        'Verify minSdkVersion is less than or equal to targetSdkVersion',
        'Check that SDK versions are valid (typically 21+)',
        'Update the SDK versions in build.gradle and rebuild',
      ],
      'Required Fields': [
        'Verify the manifest contains required fields (package, versionCode, versionName)',
        'Check that the manifest is properly formatted',
        'Rebuild the application',
      ],
      'Bundle Components': [
        'Verify the AAB file contains required bundle components',
        'Check that the build completed successfully',
        'Try rebuilding the AAB',
      ],
      'BundleConfig.pb': [
        'Verify the AAB file contains BundleConfig.pb',
        'Check that the AAB was built correctly',
        'Try rebuilding the AAB',
      ],
      'Base Module': [
        'Verify the AAB contains a base module',
        'Check that the build completed successfully',
        'Try rebuilding the AAB',
      ],
    };

    return remediations[checkName] || [
      'Review the error message for more details',
      'Check the build logs for additional information',
      'Try rebuilding the application',
    ];
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(results: VerificationResult[]): string {
    const lines: string[] = [];
    const allChecks = results.flatMap(r => r.checks);
    const warningChecks = allChecks.filter(c => c.status === 'warning');

    if (warningChecks.length === 0) {
      return '';
    }

    lines.push('Based on the verification results, we recommend:');
    lines.push('');

    // Collect unique warning types
    const warningTypes = new Set(warningChecks.map(c => c.name));

    for (const warningType of warningTypes) {
      const warnings = warningChecks.filter(c => c.name === warningType);
      lines.push(`• ${warningType} (${warnings.length} warning(s))`);

      // Add specific recommendations
      if (warningType.includes('SDK')) {
        lines.push('  - Consider targeting a more recent Android API level');
        lines.push('  - Update minSdkVersion to at least API 21 for better compatibility');
      } else if (warningType.includes('Signature')) {
        lines.push('  - Ensure the artifact is properly signed before distribution');
        lines.push('  - Verify the signing certificate is valid and not expired');
      } else if (warningType.includes('Component')) {
        lines.push('  - Verify all declared components are properly implemented');
        lines.push('  - Check that all activities have proper intent filters');
      } else if (warningType.includes('Permission')) {
        lines.push('  - Review declared permissions for necessity');
        lines.push('  - Remove unused permissions to improve security');
      }

      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Generate a JSON report
   */
  generateJSONReport(results: VerificationResult[]): string {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalArtifacts: results.length,
        passed: results.filter(r => r.overallStatus === 'pass').length,
        warnings: results.filter(r => r.overallStatus === 'warning').length,
        failed: results.filter(r => r.overallStatus === 'fail').length,
      },
      results: results.map(r => ({
        artifactPath: r.artifactPath,
        overallStatus: r.overallStatus,
        duration: r.duration,
        timestamp: (() => {
          try {
            return r.timestamp.toISOString();
          } catch (error) {
            return 'Invalid date';
          }
        })(),
        checks: r.checks.map(c => ({
          name: c.name,
          category: c.category,
          status: c.status,
          message: c.message,
          details: c.details,
        })),
      })),
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * Generate a CSV report
   */
  generateCSVReport(results: VerificationResult[]): string {
    const lines: string[] = [];

    // Header
    lines.push('Artifact,Check Name,Category,Status,Message');

    // Data rows
    for (const result of results) {
      const artifactName = path.basename(result.artifactPath);
      for (const check of result.checks) {
        const message = check.message.replace(/"/g, '""'); // Escape quotes
        lines.push(
          `"${artifactName}","${check.name}","${check.category}","${check.status}","${message}"`
        );
      }
    }

    return lines.join('\n');
  }
}

/**
 * Factory function to create VerificationReportGenerator
 */
export function createVerificationReportGenerator(): VerificationReportGenerator {
  return new VerificationReportGenerator();
}
