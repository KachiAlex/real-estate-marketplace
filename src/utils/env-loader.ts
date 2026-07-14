import * as fs from 'fs';
import * as path from 'path';
import { ValidationResult, ValidationStatus, ValidationCategory } from '../types/mobile-config';

/**
 * Loads environment variables from .env.local file
 * @param envPath - Path to .env.local file (defaults to project root)
 * @returns Loaded environment variables or error details
 */
export function loadLocalEnvironmentVariables(envPath?: string): {
  success: boolean;
  variables?: Record<string, string>;
  error?: string;
} {
  try {
    const resolvedPath = envPath || path.join(process.cwd(), '.env.local');

    if (!fs.existsSync(resolvedPath)) {
      return {
        success: false,
        error: `.env.local file not found at ${resolvedPath}`,
      };
    }

    const content = fs.readFileSync(resolvedPath, 'utf-8');
    const variables: Record<string, string> = {};

    // Parse .env file format
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      // Parse KEY=VALUE format
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();

        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }

        variables[key] = value;
      }
    }

    return {
      success: true,
      variables,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to load local environment variables: ${errorMessage}`,
    };
  }
}

/**
 * Loads environment variables from EAS secrets
 * @param profile - Build profile name (development, staging, production)
 * @returns Loaded environment variables or error details
 */
export function loadEASEnvironmentVariables(profile: string): {
  success: boolean;
  variables?: Record<string, string>;
  error?: string;
} {
  try {
    // In a real implementation, this would fetch from EAS API
    // For now, we'll check if EAS CLI is available and can retrieve secrets
    const { execSync } = require('child_process');

    try {
      execSync('eas --version', { stdio: 'pipe' });
    } catch {
      return {
        success: false,
        error: 'EAS CLI is not installed. Install it with: npm install -g eas-cli',
      };
    }

    // Try to get secrets from EAS
    try {
      const output = execSync(`eas secret:list --profile ${profile}`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      const variables: Record<string, string> = {};

      // Parse EAS secret output
      const lines = output.split('\n');
      for (const line of lines) {
        const match = line.match(/^([A-Z_]+)\s+/);
        if (match) {
          const key = match[1];
          // Note: EAS doesn't return secret values for security reasons
          // We just track that the secret exists
          variables[key] = '***';
        }
      }

      return {
        success: true,
        variables,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to retrieve EAS secrets for profile "${profile}"`,
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to load EAS environment variables: ${errorMessage}`,
    };
  }
}

/**
 * Validates that all required environment variables are present
 * @param variables - Environment variables to validate
 * @param requiredVariables - List of required variable names
 * @returns Validation result with missing variables
 */
export function validateRequiredEnvironmentVariables(
  variables: Record<string, string>,
  requiredVariables?: string[]
): {
  success: boolean;
  missingVariables: string[];
  details: string[];
} {
  // Default required variables for mobile builds
  const required = requiredVariables || [
    'API_ENDPOINT',
    'API_KEY',
    'FIREBASE_CONFIG',
    'ANALYTICS_TOKEN',
  ];

  const missingVariables: string[] = [];
  const details: string[] = [];

  for (const variable of required) {
    if (!(variable in variables)) {
      missingVariables.push(variable);
      details.push(`Missing required environment variable: ${variable}`);
    } else if (!variables[variable] || variables[variable].trim() === '') {
      missingVariables.push(variable);
      details.push(`Environment variable "${variable}" is empty`);
    }
  }

  return {
    success: missingVariables.length === 0,
    missingVariables,
    details,
  };
}

/**
 * Provides clear error messages for missing variables
 * @param missingVariables - List of missing variable names
 * @param envPath - Path to .env.local file
 * @returns Formatted error message with remediation steps
 */
export function generateMissingVariablesMessage(missingVariables: string[], envPath?: string): string {
  const resolvedPath = envPath || path.join(process.cwd(), '.env.local');

  const message = [
    'Missing required environment variables:',
    '',
    missingVariables.map((v) => `  - ${v}`).join('\n'),
    '',
    'To fix this issue:',
    `1. Create or edit ${resolvedPath}`,
    '2. Add the following variables:',
    missingVariables.map((v) => `   ${v}=<value>`).join('\n'),
    '3. Save the file and try again',
    '',
    'Example .env.local:',
    missingVariables.map((v) => `${v}=your_value_here`).join('\n'),
  ].join('\n');

  return message;
}

/**
 * Comprehensive environment variable validation
 * @param envPath - Path to .env.local file
 * @param profile - EAS profile name (optional)
 * @param requiredVariables - List of required variables (optional)
 * @returns Complete validation result
 */
export function validateEnvironmentVariables(
  envPath?: string,
  profile?: string,
  requiredVariables?: string[]
): ValidationResult {
  const timestamp = new Date();
  const checks = [];

  // Load local environment variables
  const localResult = loadLocalEnvironmentVariables(envPath);
  checks.push({
    name: 'Local Environment File',
    category: ValidationCategory.Configuration,
    status: localResult.success ? ValidationStatus.Pass : ValidationStatus.Fail,
    message: localResult.success
      ? `.env.local file found with ${Object.keys(localResult.variables || {}).length} variables`
      : localResult.error || 'Failed to load local environment file',
    remediation: localResult.success
      ? undefined
      : `Create .env.local file in project root with required environment variables`,
    documentationLink: 'https://docs.expo.dev/build/variables/',
  });

  let allVariables: Record<string, string> = {};

  if (localResult.success && localResult.variables) {
    allVariables = { ...localResult.variables };
  }

  // Load EAS environment variables if profile is specified
  if (profile) {
    const easResult = loadEASEnvironmentVariables(profile);
    checks.push({
      name: 'EAS Environment Variables',
      category: ValidationCategory.Configuration,
      status: easResult.success ? ValidationStatus.Pass : ValidationStatus.Fail,
      message: easResult.success
        ? `EAS secrets loaded for profile "${profile}" (${Object.keys(easResult.variables || {}).length} secrets)`
        : easResult.error || 'Failed to load EAS environment variables',
      remediation: easResult.success ? undefined : `Configure EAS secrets for profile "${profile}"`,
      documentationLink: 'https://docs.expo.dev/build/variables/',
    });

    if (easResult.success && easResult.variables) {
      allVariables = { ...allVariables, ...easResult.variables };
    }
  }

  // Validate required variables
  const validationResult = validateRequiredEnvironmentVariables(allVariables, requiredVariables);
  checks.push({
    name: 'Required Variables',
    category: ValidationCategory.Configuration,
    status: validationResult.success ? ValidationStatus.Pass : ValidationStatus.Fail,
    message: validationResult.success
      ? 'All required environment variables are defined'
      : generateMissingVariablesMessage(validationResult.missingVariables, envPath),
    remediation: validationResult.success ? undefined : 'Add missing environment variables to .env.local',
    documentationLink: 'https://docs.expo.dev/build/variables/',
  });

  const overallStatus = checks.every((check) => check.status === ValidationStatus.Pass)
    ? ValidationStatus.Pass
    : ValidationStatus.Fail;

  return {
    timestamp,
    overallStatus,
    checks,
    summary:
      overallStatus === ValidationStatus.Pass
        ? 'All environment variables are properly configured'
        : `Environment variable validation failed: ${validationResult.missingVariables.length} variable(s) missing`,
  };
}
