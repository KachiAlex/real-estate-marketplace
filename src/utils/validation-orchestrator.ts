import * as fs from 'fs';
import * as path from 'path';
import { ValidationResult, ValidationStatus, ValidationCategory } from '../types/mobile-config';
import { validateAndroidEnvironment } from './android-validator';
import { validateIOSEnvironment } from './ios-validator';
import { validateCapacitorConfiguration } from './capacitor-validator';
import { validateEASConfiguration } from './eas-validator';
import { validateEnvironmentVariables } from './env-loader';
import { validateSecretsManagement } from './secrets-validator';
import { validateDependencyCompatibility } from './compatibility-matrix';
import { validateNativeDependencies } from './native-dependency-resolver';

/**
 * Represents a comprehensive validation report
 */
export interface ValidationReport {
  timestamp: Date;
  overallStatus: ValidationStatus;
  categories: {
    environment: ValidationResult;
    configuration: ValidationResult;
    dependency: ValidationResult;
    credential: ValidationResult;
  };
  summary: string;
  remediationSteps: string[];
  documentationLinks: string[];
}

/**
 * Runs all validation checks in sequence
 * @param options - Validation options
 * @returns Complete validation report
 */
export function runAllValidationChecks(options?: {
  envPath?: string;
  easProfile?: string;
  sourceDir?: string;
  secretsFilePath?: string;
}): ValidationReport {
  const timestamp = new Date();
  const remediationSteps: string[] = [];
  const documentationLinks = new Set<string>();

  // Environment validation
  const environmentChecks: ValidationResult[] = [];

  // Android environment
  const androidResult = validateAndroidEnvironment();
  environmentChecks.push(androidResult);

  // iOS environment
  const iosResult = validateIOSEnvironment();
  environmentChecks.push(iosResult);

  // Configuration validation
  const configurationChecks: ValidationResult[] = [];

  // Capacitor configuration
  const capacitorResult = validateCapacitorConfiguration();
  configurationChecks.push(capacitorResult);

  // EAS configuration
  const easResult = validateEASConfiguration();
  configurationChecks.push(easResult);

  // Environment variables
  const envResult = validateEnvironmentVariables(options?.envPath, options?.easProfile);
  configurationChecks.push(envResult);

  // Dependency validation
  const dependencyChecks: ValidationResult[] = [];

  // Dependency compatibility
  const compatibilityResult = validateDependencyCompatibility();
  dependencyChecks.push(compatibilityResult);

  // Native dependencies
  const nativeDepsResult = validateNativeDependencies();
  dependencyChecks.push(nativeDepsResult);

  // Credential validation
  const credentialChecks: ValidationResult[] = [];

  // Secrets management
  const secretsResult = validateSecretsManagement(options?.sourceDir, options?.secretsFilePath);
  credentialChecks.push(secretsResult);

  // Combine all checks
  const allChecks = [
    ...environmentChecks,
    ...configurationChecks,
    ...dependencyChecks,
    ...credentialChecks,
  ];

  // Collect remediation steps and documentation links
  for (const result of allChecks) {
    for (const check of result.checks) {
      if (check.remediation) {
        remediationSteps.push(`${check.name}: ${check.remediation}`);
      }
      if (check.documentationLink) {
        documentationLinks.add(check.documentationLink);
      }
    }
  }

  // Aggregate results by category
  const categoryResults: Record<ValidationCategory, ValidationResult> = {
    [ValidationCategory.Environment]: {
      timestamp,
      overallStatus: environmentChecks.every((r) => r.overallStatus === ValidationStatus.Pass)
        ? ValidationStatus.Pass
        : ValidationStatus.Fail,
      checks: environmentChecks.flatMap((r) => r.checks),
      summary: `Environment validation: ${environmentChecks.filter((r) => r.overallStatus === ValidationStatus.Pass).length}/${environmentChecks.length} passed`,
    },
    [ValidationCategory.Configuration]: {
      timestamp,
      overallStatus: configurationChecks.every((r) => r.overallStatus === ValidationStatus.Pass)
        ? ValidationStatus.Pass
        : ValidationStatus.Fail,
      checks: configurationChecks.flatMap((r) => r.checks),
      summary: `Configuration validation: ${configurationChecks.filter((r) => r.overallStatus === ValidationStatus.Pass).length}/${configurationChecks.length} passed`,
    },
    [ValidationCategory.Dependency]: {
      timestamp,
      overallStatus: dependencyChecks.every((r) => r.overallStatus === ValidationStatus.Pass)
        ? ValidationStatus.Pass
        : ValidationStatus.Fail,
      checks: dependencyChecks.flatMap((r) => r.checks),
      summary: `Dependency validation: ${dependencyChecks.filter((r) => r.overallStatus === ValidationStatus.Pass).length}/${dependencyChecks.length} passed`,
    },
    [ValidationCategory.Credential]: {
      timestamp,
      overallStatus: credentialChecks.every((r) => r.overallStatus === ValidationStatus.Pass)
        ? ValidationStatus.Pass
        : ValidationStatus.Fail,
      checks: credentialChecks.flatMap((r) => r.checks),
      summary: `Credential validation: ${credentialChecks.filter((r) => r.overallStatus === ValidationStatus.Pass).length}/${credentialChecks.length} passed`,
    },
  };

  // Determine overall status
  const overallStatus = Object.values(categoryResults).every(
    (r) => r.overallStatus === ValidationStatus.Pass
  )
    ? ValidationStatus.Pass
    : ValidationStatus.Fail;

  // Generate summary
  const passedCategories = Object.entries(categoryResults)
    .filter(([, r]) => r.overallStatus === ValidationStatus.Pass)
    .map(([cat]) => cat);

  const failedCategories = Object.entries(categoryResults)
    .filter(([, r]) => r.overallStatus === ValidationStatus.Fail)
    .map(([cat]) => cat);

  const summary =
    overallStatus === ValidationStatus.Pass
      ? 'All validation checks passed. Your development environment is ready!'
      : `Validation failed in ${failedCategories.length} category(ies): ${failedCategories.join(', ')}. See remediation steps below.`;

  return {
    timestamp,
    overallStatus,
    categories: categoryResults,
    summary,
    remediationSteps,
    documentationLinks: Array.from(documentationLinks),
  };
}

/**
 * Generates a human-readable validation report
 * @param report - Validation report
 * @returns Formatted report string
 */
export function formatValidationReport(report: ValidationReport): string {
  const lines: string[] = [
    '═══════════════════════════════════════════════════════════════',
    'MOBILE DEVELOPMENT ENVIRONMENT VALIDATION REPORT',
    '═══════════════════════════════════════════════════════════════',
    '',
    `Timestamp: ${report.timestamp.toISOString()}`,
    `Overall Status: ${report.overallStatus.toUpperCase()}`,
    '',
    '───────────────────────────────────────────────────────────────',
    'SUMMARY',
    '───────────────────────────────────────────────────────────────',
    report.summary,
    '',
  ];

  // Add category results
  lines.push('───────────────────────────────────────────────────────────────');
  lines.push('VALIDATION RESULTS BY CATEGORY');
  lines.push('───────────────────────────────────────────────────────────────');
  lines.push('');

  for (const [category, result] of Object.entries(report.categories)) {
    const statusIcon = result.overallStatus === ValidationStatus.Pass ? '✓' : '✗';
    lines.push(`${statusIcon} ${category.toUpperCase()}: ${result.overallStatus.toUpperCase()}`);

    for (const check of result.checks) {
      const checkIcon = check.status === ValidationStatus.Pass ? '  ✓' : '  ✗';
      lines.push(`${checkIcon} ${check.name}: ${check.message}`);

      if (check.status === ValidationStatus.Fail && check.remediation) {
        lines.push(`     Remediation: ${check.remediation}`);
      }
    }

    lines.push('');
  }

  // Add remediation steps if needed
  if (report.remediationSteps.length > 0) {
    lines.push('───────────────────────────────────────────────────────────────');
    lines.push('REMEDIATION STEPS');
    lines.push('───────────────────────────────────────────────────────────────');
    lines.push('');

    for (let i = 0; i < report.remediationSteps.length; i++) {
      lines.push(`${i + 1}. ${report.remediationSteps[i]}`);
    }

    lines.push('');
  }

  // Add documentation links
  if (report.documentationLinks.length > 0) {
    lines.push('───────────────────────────────────────────────────────────────');
    lines.push('DOCUMENTATION REFERENCES');
    lines.push('───────────────────────────────────────────────────────────────');
    lines.push('');

    for (const link of report.documentationLinks) {
      lines.push(`• ${link}`);
    }

    lines.push('');
  }

  lines.push('═══════════════════════════════════════════════════════════════');

  return lines.join('\n');
}

/**
 * Exports validation report as JSON
 * @param report - Validation report
 * @returns JSON string
 */
export function exportValidationReportAsJSON(report: ValidationReport): string {
  return JSON.stringify(
    {
      timestamp: report.timestamp.toISOString(),
      overallStatus: report.overallStatus,
      categories: Object.entries(report.categories).reduce(
        (acc, [category, result]) => {
          acc[category] = {
            status: result.overallStatus,
            checks: result.checks.map((check) => ({
              name: check.name,
              category: check.category,
              status: check.status,
              message: check.message,
              remediation: check.remediation,
              documentationLink: check.documentationLink,
            })),
          };
          return acc;
        },
        {} as Record<string, any>
      ),
      summary: report.summary,
      remediationSteps: report.remediationSteps,
      documentationLinks: report.documentationLinks,
    },
    null,
    2
  );
}

/**
 * Saves validation report to file
 * @param report - Validation report
 * @param outputPath - Path to save report
 * @param format - Report format (text or json)
 * @returns Save result
 */
export function saveValidationReport(
  report: ValidationReport,
  outputPath?: string,
  format: 'text' | 'json' = 'text'
): { success: boolean; path?: string; error?: string } {
  try {
    const resolvedPath =
      outputPath ||
      path.join(
        process.cwd(),
        `validation-report-${report.timestamp.toISOString().split('T')[0]}.${format === 'json' ? 'json' : 'txt'}`
      );

    const content = format === 'json' ? exportValidationReportAsJSON(report) : formatValidationReport(report);

    // Create directory if it doesn't exist
    const dir = path.dirname(resolvedPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(resolvedPath, content, 'utf-8');

    return {
      success: true,
      path: resolvedPath,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to save validation report: ${errorMessage}`,
    };
  }
}
