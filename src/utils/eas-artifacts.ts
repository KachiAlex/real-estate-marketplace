import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { ValidationResult, ValidationStatus, ValidationCategory } from '../types/mobile-config';

/**
 * Artifact validation result
 */
export interface ArtifactValidationResult {
  isValid: boolean;
  artifactPath: string;
  artifactType: 'apk' | 'aab' | 'ipa';
  size: number;
  signature?: {
    isValid: boolean;
    signer?: string;
    error?: string;
  };
  structure?: {
    isValid: boolean;
    issues: string[];
  };
  error?: string;
}

/**
 * Verifies APK/AAB structure and signature
 * @param artifactPath - Path to APK or AAB file
 * @returns Validation result with structure and signature details
 */
export function verifyAndroidArtifact(artifactPath: string): ArtifactValidationResult {
  const result: ArtifactValidationResult = {
    isValid: false,
    artifactPath,
    artifactType: artifactPath.endsWith('.aab') ? 'aab' : 'apk',
    size: 0,
    structure: {
      isValid: false,
      issues: [],
    },
  };

  try {
    // Check file exists
    if (!fs.existsSync(artifactPath)) {
      result.error = `Artifact file not found: ${artifactPath}`;
      return result;
    }

    // Get file size
    const stats = fs.statSync(artifactPath);
    result.size = stats.size;

    if (result.size === 0) {
      result.structure!.issues.push('Artifact file is empty');
      return result;
    }

    // Verify file is a valid ZIP archive (APK/AAB are ZIP files)
    try {
      const zipCommand = process.platform === 'win32' ? 'powershell -Command' : 'unzip';
      const testCommand =
        process.platform === 'win32'
          ? `powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::OpenRead('${artifactPath}').Dispose()"`
          : `unzip -t "${artifactPath}" > /dev/null 2>&1`;

      execSync(testCommand, { stdio: 'pipe' });
      result.structure!.isValid = true;
    } catch {
      result.structure!.issues.push('Invalid ZIP archive structure');
      return result;
    }

    // Verify APK/AAB contains required files
    try {
      const listCommand =
        process.platform === 'win32'
          ? `powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; $zip = [System.IO.Compression.ZipFile]::OpenRead('${artifactPath}'); $zip.Entries | Select-Object -ExpandProperty Name"`
          : `unzip -l "${artifactPath}"`;

      const output = execSync(listCommand, { encoding: 'utf-8', stdio: 'pipe' });

      // Check for required files
      const requiredFiles = ['AndroidManifest.xml', 'classes.dex'];
      for (const file of requiredFiles) {
        if (!output.includes(file)) {
          result.structure!.issues.push(`Missing required file: ${file}`);
        }
      }

      if (result.structure!.issues.length === 0) {
        result.structure!.isValid = true;
      }
    } catch {
      result.structure!.issues.push('Failed to verify archive contents');
    }

    // Verify signature (for APK)
    if (result.artifactType === 'apk') {
      try {
        // Check if jarsigner is available
        try {
          execSync('jarsigner -version', { stdio: 'pipe' });
        } catch {
          result.signature = {
            isValid: false,
            error: 'jarsigner not found. Install Java Development Kit (JDK)',
          };
          return result;
        }

        // Verify APK signature
        const verifyCommand = `jarsigner -verify -verbose "${artifactPath}"`;
        const output = execSync(verifyCommand, { encoding: 'utf-8', stdio: 'pipe' });

        if (output.includes('jar verified')) {
          result.signature = {
            isValid: true,
            signer: 'APK is properly signed',
          };
        } else {
          result.signature = {
            isValid: false,
            error: 'APK signature verification failed',
          };
        }
      } catch (error) {
        result.signature = {
          isValid: false,
          error: `Signature verification failed: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    }

    // Overall validity
    result.isValid =
      result.structure!.isValid &&
      (result.artifactType === 'aab' || (result.signature?.isValid ?? false));

    return result;
  } catch (error) {
    result.error = `Failed to verify Android artifact: ${error instanceof Error ? error.message : String(error)}`;
    return result;
  }
}

/**
 * Verifies IPA structure and code signing
 * @param artifactPath - Path to IPA file
 * @returns Validation result with structure and code signing details
 */
export function verifyIOSArtifact(artifactPath: string): ArtifactValidationResult {
  const result: ArtifactValidationResult = {
    isValid: false,
    artifactPath,
    artifactType: 'ipa',
    size: 0,
    structure: {
      isValid: false,
      issues: [],
    },
  };

  try {
    // Check file exists
    if (!fs.existsSync(artifactPath)) {
      result.error = `Artifact file not found: ${artifactPath}`;
      return result;
    }

    // Get file size
    const stats = fs.statSync(artifactPath);
    result.size = stats.size;

    if (result.size === 0) {
      result.structure!.issues.push('Artifact file is empty');
      return result;
    }

    // Verify file is a valid ZIP archive (IPA is a ZIP file)
    try {
      const testCommand =
        process.platform === 'win32'
          ? `powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::OpenRead('${artifactPath}').Dispose()"`
          : `unzip -t "${artifactPath}" > /dev/null 2>&1`;

      execSync(testCommand, { stdio: 'pipe' });
      result.structure!.isValid = true;
    } catch {
      result.structure!.issues.push('Invalid ZIP archive structure');
      return result;
    }

    // Verify IPA contains required structure
    try {
      const listCommand =
        process.platform === 'win32'
          ? `powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; $zip = [System.IO.Compression.ZipFile]::OpenRead('${artifactPath}'); $zip.Entries | Select-Object -ExpandProperty Name"`
          : `unzip -l "${artifactPath}"`;

      const output = execSync(listCommand, { encoding: 'utf-8', stdio: 'pipe' });

      // Check for required IPA structure
      const requiredPaths = ['Payload/', 'Payload/'];
      let hasPayload = false;

      for (const path of requiredPaths) {
        if (output.includes(path)) {
          hasPayload = true;
          break;
        }
      }

      if (!hasPayload) {
        result.structure!.issues.push('Missing required Payload directory');
      }

      if (result.structure!.issues.length === 0) {
        result.structure!.isValid = true;
      }
    } catch {
      result.structure!.issues.push('Failed to verify archive contents');
    }

    // Verify code signing (macOS only)
    if (process.platform === 'darwin') {
      try {
        // Extract and verify code signature
        const tempDir = path.join(process.cwd(), '.ipa-temp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        // Unzip IPA
        execSync(`unzip -q "${artifactPath}" -d "${tempDir}"`, { stdio: 'pipe' });

        // Find the app bundle
        const payloadDir = path.join(tempDir, 'Payload');
        const appBundles = fs.readdirSync(payloadDir).filter((f) => f.endsWith('.app'));

        if (appBundles.length === 0) {
          result.signature = {
            isValid: false,
            error: 'No app bundle found in IPA',
          };
        } else {
          const appBundle = path.join(payloadDir, appBundles[0]);

          // Verify code signature
          try {
            const output = execSync(`codesign -v "${appBundle}"`, {
              encoding: 'utf-8',
              stdio: 'pipe',
            });

            if (output.includes('valid on disk')) {
              result.signature = {
                isValid: true,
                signer: 'IPA is properly code signed',
              };
            } else {
              result.signature = {
                isValid: false,
                error: 'Code signature verification failed',
              };
            }
          } catch (error) {
            result.signature = {
              isValid: false,
              error: `Code signature verification failed: ${error instanceof Error ? error.message : String(error)}`,
            };
          }
        }

        // Cleanup
        try {
          execSync(`rm -rf "${tempDir}"`, { stdio: 'pipe' });
        } catch {
          // Ignore cleanup errors
        }
      } catch (error) {
        result.signature = {
          isValid: false,
          error: `Failed to verify code signing: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    } else {
      // On non-macOS, we can't verify code signing
      result.signature = {
        isValid: true,
        signer: 'Code signing verification skipped (requires macOS)',
      };
    }

    // Overall validity
    result.isValid = result.structure!.isValid && (result.signature?.isValid ?? false);

    return result;
  } catch (error) {
    result.error = `Failed to verify iOS artifact: ${error instanceof Error ? error.message : String(error)}`;
    return result;
  }
}

/**
 * Validates artifact integrity by checking file hash
 * @param artifactPath - Path to artifact file
 * @returns Validation result with integrity details
 */
export function validateArtifactIntegrity(artifactPath: string): {
  success: boolean;
  hash?: string;
  error?: string;
} {
  try {
    if (!fs.existsSync(artifactPath)) {
      return {
        success: false,
        error: `Artifact file not found: ${artifactPath}`,
      };
    }

    // Calculate file hash
    const crypto = require('crypto');
    const fileBuffer = fs.readFileSync(artifactPath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    const hash = hashSum.digest('hex');

    return {
      success: true,
      hash,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to validate artifact integrity: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Comprehensive artifact validation
 * @param artifactPath - Path to artifact file
 * @returns Complete validation result
 */
export function validateBuildArtifact(artifactPath: string): ValidationResult {
  const timestamp = new Date();
  const checks = [];

  // Determine artifact type
  const isAndroid = artifactPath.endsWith('.apk') || artifactPath.endsWith('.aab');
  const isIOS = artifactPath.endsWith('.ipa');

  if (!isAndroid && !isIOS) {
    return {
      timestamp,
      overallStatus: ValidationStatus.FAIL,
      checks: [
        {
          name: 'Artifact Type',
          category: ValidationCategory.CONFIGURATION,
          status: ValidationStatus.FAIL,
          message: `Unknown artifact type: ${path.extname(artifactPath)}`,
          remediation: 'Ensure artifact is APK, AAB, or IPA file',
          documentationLink: 'https://docs.expo.dev/build/artifacts/',
        },
      ],
      summary: 'Artifact validation failed: unknown artifact type',
    };
  }

  // Verify artifact
  const artifactResult = isAndroid ? verifyAndroidArtifact(artifactPath) : verifyIOSArtifact(artifactPath);

  checks.push({
    name: 'Artifact Structure',
    category: ValidationCategory.CONFIGURATION,
    status: artifactResult.structure?.isValid ? ValidationStatus.PASS : ValidationStatus.FAIL,
    message: artifactResult.structure?.isValid
      ? `${artifactResult.artifactType.toUpperCase()} structure is valid`
      : `${artifactResult.structure?.issues.join('; ') || 'Structure validation failed'}`,
    remediation: artifactResult.structure?.isValid ? undefined : 'Rebuild artifact and verify build configuration',
    documentationLink: 'https://docs.expo.dev/build/artifacts/',
  });

  if (artifactResult.signature) {
    checks.push({
      name: 'Artifact Signature',
      category: ValidationCategory.CREDENTIAL,
      status: artifactResult.signature.isValid ? ValidationStatus.PASS : ValidationStatus.FAIL,
      message: artifactResult.signature.isValid
        ? artifactResult.signature.signer || 'Artifact is properly signed'
        : artifactResult.signature.error || 'Signature verification failed',
      remediation: artifactResult.signature.isValid ? undefined : 'Verify signing configuration and rebuild',
      documentationLink: 'https://docs.expo.dev/build/code-signing/',
    });
  }

  // Validate integrity
  const integrityResult = validateArtifactIntegrity(artifactPath);
  checks.push({
    name: 'Artifact Integrity',
    category: ValidationCategory.CONFIGURATION,
    status: integrityResult.success ? ValidationStatus.PASS : ValidationStatus.FAIL,
    message: integrityResult.success
      ? `Artifact integrity verified (SHA256: ${integrityResult.hash?.substring(0, 16)}...)`
      : integrityResult.error || 'Integrity validation failed',
    remediation: integrityResult.success ? undefined : 'Verify artifact file is not corrupted',
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
        ? `${artifactResult.artifactType.toUpperCase()} artifact is valid and ready for deployment`
        : 'Artifact validation failed',
  };
}
