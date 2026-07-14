import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { ValidationResult, ValidationStatus, ValidationCategory } from '../types/mobile-config';

/**
 * Represents the status of an EAS build
 */
export interface EASBuildStatus {
  buildId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'canceled';
  platform: 'android' | 'ios';
  artifacts?: {
    url: string;
    type: 'apk' | 'aab' | 'ipa';
  }[];
  error?: string;
}

/**
 * Authenticates with EAS service using stored credentials
 * @returns Authentication result with status and error details
 */
export function authenticateWithEAS(): { success: boolean; error?: string; token?: string } {
  try {
    // Check if EAS CLI is installed
    try {
      execSync('eas --version', { stdio: 'pipe' });
    } catch {
      return {
        success: false,
        error: 'EAS CLI is not installed. Install it with: npm install -g eas-cli',
      };
    }

    // Check if user is authenticated
    try {
      const output = execSync('eas whoami', { encoding: 'utf-8', stdio: 'pipe' });
      if (output.includes('Not logged in')) {
        return {
          success: false,
          error: 'Not authenticated with EAS. Run: eas login',
        };
      }
      return {
        success: true,
        token: 'authenticated',
      };
    } catch {
      return {
        success: false,
        error: 'Failed to verify EAS authentication. Run: eas login',
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `EAS authentication failed: ${errorMessage}`,
    };
  }
}

/**
 * Submits a build to EAS with specified profile
 * @param profile - Build profile name (development, staging, production)
 * @param platform - Target platform (android or ios)
 * @returns Build submission result with build ID
 */
export function submitBuildToEAS(
  profile: string,
  platform: 'android' | 'ios'
): { success: boolean; buildId?: string; error?: string } {
  try {
    // Verify authentication first
    const authResult = authenticateWithEAS();
    if (!authResult.success) {
      return {
        success: false,
        error: authResult.error,
      };
    }

    // Validate profile
    const validProfiles = ['development', 'staging', 'production'];
    if (!validProfiles.includes(profile)) {
      return {
        success: false,
        error: `Invalid profile: ${profile}. Must be one of: ${validProfiles.join(', ')}`,
      };
    }

    // Validate platform
    if (!['android', 'ios'].includes(platform)) {
      return {
        success: false,
        error: `Invalid platform: ${platform}. Must be 'android' or 'ios'`,
      };
    }

    // Submit build to EAS
    const command = `eas build --platform ${platform} --profile ${profile} --non-interactive`;
    const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe' });

    // Extract build ID from output
    const buildIdMatch = output.match(/Build ID: ([a-f0-9-]+)/);
    if (!buildIdMatch) {
      return {
        success: false,
        error: 'Failed to extract build ID from EAS response',
      };
    }

    return {
      success: true,
      buildId: buildIdMatch[1],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to submit build to EAS: ${errorMessage}`,
    };
  }
}

/**
 * Monitors build progress by polling EAS service
 * @param buildId - Build ID to monitor
 * @param maxWaitTime - Maximum time to wait in milliseconds (default: 30 minutes)
 * @returns Final build status
 */
export function monitorBuildProgress(
  buildId: string,
  maxWaitTime: number = 30 * 60 * 1000
): { success: boolean; status?: EASBuildStatus; error?: string } {
  try {
    const startTime = Date.now();
    const pollInterval = 10000; // Poll every 10 seconds

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const output = execSync(`eas build --status ${buildId}`, {
          encoding: 'utf-8',
          stdio: 'pipe',
        });

        // Parse build status from output
        const statusMatch = output.match(/Status: (\w+)/);
        const platformMatch = output.match(/Platform: (\w+)/);

        if (!statusMatch || !platformMatch) {
          return {
            success: false,
            error: 'Failed to parse build status from EAS response',
          };
        }

        const status = statusMatch[1].toLowerCase() as EASBuildStatus['status'];
        const platform = platformMatch[1].toLowerCase() as 'android' | 'ios';

        // Check if build is complete
        if (status === 'completed' || status === 'failed' || status === 'canceled') {
          return {
            success: status === 'completed',
            status: {
              buildId,
              status,
              platform,
              error: status === 'failed' ? 'Build failed on EAS service' : undefined,
            },
          };
        }

        // Wait before polling again
        const remainingTime = maxWaitTime - (Date.now() - startTime);
        if (remainingTime > 0) {
          const waitTime = Math.min(pollInterval, remainingTime);
          // eslint-disable-next-line no-await-in-loop
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          success: false,
          error: `Failed to check build status: ${errorMessage}`,
        };
      }
    }

    return {
      success: false,
      error: `Build monitoring timed out after ${maxWaitTime / 1000 / 60} minutes`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Build monitoring failed: ${errorMessage}`,
    };
  }
}

/**
 * Downloads build artifacts from EAS
 * @param buildId - Build ID to download artifacts for
 * @param outputDir - Directory to save artifacts (defaults to ./build-artifacts)
 * @returns Download result with artifact paths
 */
export function downloadBuildArtifacts(
  buildId: string,
  outputDir?: string
): { success: boolean; artifacts?: string[]; error?: string } {
  try {
    const resolvedOutputDir = outputDir || path.join(process.cwd(), 'build-artifacts');

    // Create output directory if it doesn't exist
    if (!fs.existsSync(resolvedOutputDir)) {
      fs.mkdirSync(resolvedOutputDir, { recursive: true });
    }

    // Download artifacts using EAS CLI
    const command = `eas build:download --id ${buildId} --path ${resolvedOutputDir}`;
    const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe' });

    // Extract artifact paths from output
    const artifactPaths: string[] = [];
    const lines = output.split('\n');

    for (const line of lines) {
      if (line.includes('Downloaded') || line.includes('.apk') || line.includes('.aab') || line.includes('.ipa')) {
        const match = line.match(/([^\s]+\.(apk|aab|ipa))/);
        if (match) {
          artifactPaths.push(path.join(resolvedOutputDir, match[1]));
        }
      }
    }

    if (artifactPaths.length === 0) {
      return {
        success: false,
        error: 'No artifacts found in EAS build output',
      };
    }

    return {
      success: true,
      artifacts: artifactPaths,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to download build artifacts: ${errorMessage}`,
    };
  }
}

/**
 * Complete EAS build workflow: authenticate, submit, monitor, and download
 * @param profile - Build profile name
 * @param platform - Target platform
 * @param outputDir - Directory to save artifacts
 * @returns Complete workflow result
 */
export function executeEASBuildWorkflow(
  profile: string,
  platform: 'android' | 'ios',
  outputDir?: string
): ValidationResult {
  const timestamp = new Date();
  const checks = [];

  // Step 1: Authenticate
  const authResult = authenticateWithEAS();
  checks.push({
    name: 'EAS Authentication',
    category: ValidationCategory.CREDENTIAL,
    status: authResult.success ? ValidationStatus.PASS : ValidationStatus.FAIL,
    message: authResult.success ? 'Successfully authenticated with EAS' : authResult.error || 'Authentication failed',
    remediation: authResult.success ? undefined : 'Run: eas login',
    documentationLink: 'https://docs.expo.dev/build/setup/',
  });

  if (!authResult.success) {
    return {
      timestamp,
      overallStatus: ValidationStatus.FAIL,
      checks,
      summary: 'EAS build workflow failed: authentication required',
    };
  }

  // Step 2: Submit build
  const submitResult = submitBuildToEAS(profile, platform);
  checks.push({
    name: 'Build Submission',
    category: ValidationCategory.CONFIGURATION,
    status: submitResult.success ? ValidationStatus.PASS : ValidationStatus.FAIL,
    message: submitResult.success
      ? `Build submitted successfully (ID: ${submitResult.buildId})`
      : submitResult.error || 'Build submission failed',
    remediation: submitResult.success ? undefined : 'Check EAS configuration and try again',
    documentationLink: 'https://docs.expo.dev/build/eas-json/',
  });

  if (!submitResult.success) {
    return {
      timestamp,
      overallStatus: ValidationStatus.FAIL,
      checks,
      summary: 'EAS build workflow failed: build submission failed',
    };
  }

  // Step 3: Monitor build (with timeout)
  const monitorResult = monitorBuildProgress(submitResult.buildId!);
  checks.push({
    name: 'Build Monitoring',
    category: ValidationCategory.CONFIGURATION,
    status: monitorResult.success ? ValidationStatus.PASS : ValidationStatus.FAIL,
    message: monitorResult.success
      ? `Build completed successfully (Status: ${monitorResult.status?.status})`
      : monitorResult.error || 'Build monitoring failed',
    remediation: monitorResult.success ? undefined : 'Check EAS dashboard for build details',
    documentationLink: 'https://docs.expo.dev/build/status/',
  });

  if (!monitorResult.success) {
    return {
      timestamp,
      overallStatus: ValidationStatus.FAIL,
      checks,
      summary: 'EAS build workflow failed: build did not complete successfully',
    };
  }

  // Step 4: Download artifacts
  const downloadResult = downloadBuildArtifacts(submitResult.buildId!, outputDir);
  checks.push({
    name: 'Artifact Download',
    category: ValidationCategory.CONFIGURATION,
    status: downloadResult.success ? ValidationStatus.PASS : ValidationStatus.FAIL,
    message: downloadResult.success
      ? `Artifacts downloaded successfully (${downloadResult.artifacts?.length || 0} file(s))`
      : downloadResult.error || 'Artifact download failed',
    remediation: downloadResult.success ? undefined : 'Check disk space and permissions',
    documentationLink: 'https://docs.expo.dev/build/artifacts/',
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
        ? `EAS build workflow completed successfully for ${platform} (${profile})`
        : 'EAS build workflow failed',
  };
}
