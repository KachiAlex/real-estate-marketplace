import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import { VerificationCheck, VerificationResult, ManifestInfo } from '../types/android-build';

/**
 * ManifestValidator validates AndroidManifest.xml files from APK/AAB artifacts.
 * It parses the manifest and validates its structure and required fields.
 */
export class ManifestValidator {
  /**
   * Validate manifest from APK/AAB file
   * @param artifactPath Path to APK or AAB file
   * @returns VerificationResult with all checks performed
   */
  async validateManifest(artifactPath: string): Promise<VerificationResult> {
    const startTime = Date.now();
    const checks: VerificationCheck[] = [];

    try {
      // Check 1: Artifact file exists
      const fileExistsCheck = this.checkFileExists(artifactPath);
      checks.push(fileExistsCheck);
      if (fileExistsCheck.status === 'fail') {
        return this.createVerificationResult(artifactPath, checks, startTime);
      }

      // Check 2: Extract manifest from artifact
      const manifestCheck = await this.checkManifestExtraction(artifactPath);
      checks.push(manifestCheck);
      // Continue even if extraction fails - other checks can still be performed

      // Check 3: Manifest is well-formed
      const wellFormedCheck = await this.checkManifestWellFormed(artifactPath);
      checks.push(wellFormedCheck);

      // Check 4: Required manifest fields exist
      const requiredFieldsCheck = await this.checkRequiredFields(artifactPath);
      checks.push(requiredFieldsCheck);

      // Check 5: Package name is valid
      const packageNameCheck = await this.checkPackageName(artifactPath);
      checks.push(packageNameCheck);

      // Check 6: Version information is present
      const versionCheck = await this.checkVersionInfo(artifactPath);
      checks.push(versionCheck);

      // Check 7: SDK versions are valid
      const sdkVersionsCheck = await this.checkSDKVersions(artifactPath);
      checks.push(sdkVersionsCheck);

      // Check 8: Permissions are declared
      const permissionsCheck = await this.checkPermissions(artifactPath);
      checks.push(permissionsCheck);

      // Check 9: Components are declared
      const componentsCheck = await this.checkComponents(artifactPath);
      checks.push(componentsCheck);

      // Check 10: No common manifest mistakes
      const mistakesCheck = await this.checkCommonMistakes(artifactPath);
      checks.push(mistakesCheck);
    } catch (error) {
      checks.push({
        name: 'Unexpected Error',
        category: 'manifest',
        status: 'fail',
        message: `Unexpected error during validation: ${error instanceof Error ? error.message : String(error)}`,
        details: error instanceof Error ? error.stack : undefined,
      });
    }

    return this.createVerificationResult(artifactPath, checks, startTime);
  }

  /**
   * Check if artifact file exists
   */
  private checkFileExists(artifactPath: string): VerificationCheck {
    try {
      if (!fs.existsSync(artifactPath)) {
        return {
          name: 'File Existence',
          category: 'structure',
          status: 'fail',
          message: `Artifact file not found at ${artifactPath}`,
        };
      }

      fs.accessSync(artifactPath, fs.constants.R_OK);

      return {
        name: 'File Existence',
        category: 'structure',
        status: 'pass',
        message: `Artifact file exists and is readable`,
      };
    } catch (error) {
      return {
        name: 'File Existence',
        category: 'structure',
        status: 'fail',
        message: `Cannot access artifact file: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Check if manifest can be extracted from artifact
   */
  private async checkManifestExtraction(artifactPath: string): Promise<VerificationCheck> {
    try {
      const manifestData = await this.extractManifest(artifactPath);
      if (!manifestData) {
        return {
          name: 'Manifest Extraction',
          category: 'manifest',
          status: 'fail',
          message: 'Could not extract AndroidManifest.xml from artifact',
        };
      }

      return {
        name: 'Manifest Extraction',
        category: 'manifest',
        status: 'pass',
        message: 'AndroidManifest.xml successfully extracted',
      };
    } catch (error) {
      return {
        name: 'Manifest Extraction',
        category: 'manifest',
        status: 'fail',
        message: `Failed to extract manifest: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Check if manifest is well-formed
   */
  private async checkManifestWellFormed(artifactPath: string): Promise<VerificationCheck> {
    try {
      const manifestData = await this.extractManifest(artifactPath);
      if (!manifestData) {
        return {
          name: 'Manifest Well-Formed',
          category: 'manifest',
          status: 'fail',
          message: 'Could not extract manifest for validation',
        };
      }

      // Try to parse as XML (basic check)
      const manifestStr = manifestData.toString('utf8', 0, Math.min(1000, manifestData.length));
      if (!manifestStr.includes('<?xml') && !manifestStr.includes('<manifest')) {
        return {
          name: 'Manifest Well-Formed',
          category: 'manifest',
          status: 'warning',
          message: 'Manifest does not appear to be XML format (may be binary)',
        };
      }

      return {
        name: 'Manifest Well-Formed',
        category: 'manifest',
        status: 'pass',
        message: 'Manifest appears to be well-formed',
      };
    } catch (error) {
      return {
        name: 'Manifest Well-Formed',
        category: 'manifest',
        status: 'fail',
        message: `Could not validate manifest format: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Check if required manifest fields exist
   */
  private async checkRequiredFields(artifactPath: string): Promise<VerificationCheck> {
    try {
      const manifestData = await this.extractManifest(artifactPath);
      if (!manifestData) {
        return {
          name: 'Required Fields',
          category: 'manifest',
          status: 'fail',
          message: 'Could not extract manifest',
        };
      }

      const manifestStr = manifestData.toString('utf8');
      const requiredFields = ['package=', 'versionCode', 'versionName'];
      const missingFields: string[] = [];

      for (const field of requiredFields) {
        if (!manifestStr.includes(field)) {
          missingFields.push(field);
        }
      }

      if (missingFields.length > 0) {
        return {
          name: 'Required Fields',
          category: 'manifest',
          status: 'warning',
          message: `Some required fields may be missing: ${missingFields.join(', ')}`,
          details: 'Note: Binary manifests may not show these fields as text',
        };
      }

      return {
        name: 'Required Fields',
        category: 'manifest',
        status: 'pass',
        message: 'Required manifest fields are present',
      };
    } catch (error) {
      return {
        name: 'Required Fields',
        category: 'manifest',
        status: 'fail',
        message: `Could not check required fields: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Check if package name is valid
   */
  private async checkPackageName(artifactPath: string): Promise<VerificationCheck> {
    try {
      const manifestData = await this.extractManifest(artifactPath);
      if (!manifestData) {
        return {
          name: 'Package Name',
          category: 'manifest',
          status: 'fail',
          message: 'Could not extract manifest',
        };
      }

      const manifestStr = manifestData.toString('utf8');
      const packageMatch = manifestStr.match(/package="([^"]+)"/);

      if (!packageMatch || !packageMatch[1]) {
        return {
          name: 'Package Name',
          category: 'manifest',
          status: 'warning',
          message: 'Could not extract package name from manifest',
        };
      }

      const packageName = packageMatch[1];
      // Validate package name format (must be valid Java package name)
      if (!/^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z0-9]+)*$/.test(packageName)) {
        return {
          name: 'Package Name',
          category: 'manifest',
          status: 'fail',
          message: `Invalid package name format: ${packageName}`,
        };
      }

      return {
        name: 'Package Name',
        category: 'manifest',
        status: 'pass',
        message: `Valid package name: ${packageName}`,
      };
    } catch (error) {
      return {
        name: 'Package Name',
        category: 'manifest',
        status: 'fail',
        message: `Could not validate package name: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Check if version information is present
   */
  private async checkVersionInfo(artifactPath: string): Promise<VerificationCheck> {
    try {
      const manifestData = await this.extractManifest(artifactPath);
      if (!manifestData) {
        return {
          name: 'Version Information',
          category: 'manifest',
          status: 'fail',
          message: 'Could not extract manifest',
        };
      }

      const manifestStr = manifestData.toString('utf8');
      const versionCodeMatch = manifestStr.match(/versionCode="?(\d+)"?/);
      const versionNameMatch = manifestStr.match(/versionName="([^"]+)"/);

      if (!versionCodeMatch || !versionNameMatch) {
        return {
          name: 'Version Information',
          category: 'manifest',
          status: 'warning',
          message: 'Version information may be missing or in binary format',
        };
      }

      return {
        name: 'Version Information',
        category: 'manifest',
        status: 'pass',
        message: `Version code: ${versionCodeMatch[1]}, Version name: ${versionNameMatch[1]}`,
      };
    } catch (error) {
      return {
        name: 'Version Information',
        category: 'manifest',
        status: 'fail',
        message: `Could not check version information: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Check if SDK versions are valid
   */
  private async checkSDKVersions(artifactPath: string): Promise<VerificationCheck> {
    try {
      const manifestData = await this.extractManifest(artifactPath);
      if (!manifestData) {
        return {
          name: 'SDK Versions',
          category: 'manifest',
          status: 'fail',
          message: 'Could not extract manifest',
        };
      }

      const manifestStr = manifestData.toString('utf8');
      const minSdkMatch = manifestStr.match(/minSdkVersion="?(\d+)"?/);
      const targetSdkMatch = manifestStr.match(/targetSdkVersion="?(\d+)"?/);

      if (!minSdkMatch || !targetSdkMatch) {
        return {
          name: 'SDK Versions',
          category: 'manifest',
          status: 'warning',
          message: 'SDK version information may be missing or in binary format',
        };
      }

      const minSdk = parseInt(minSdkMatch[1], 10);
      const targetSdk = parseInt(targetSdkMatch[1], 10);

      if (minSdk > targetSdk) {
        return {
          name: 'SDK Versions',
          category: 'manifest',
          status: 'fail',
          message: `Invalid SDK versions: minSdk (${minSdk}) > targetSdk (${targetSdk})`,
        };
      }

      if (minSdk < 16) {
        return {
          name: 'SDK Versions',
          category: 'manifest',
          status: 'warning',
          message: `Low minSdkVersion (${minSdk}): Consider targeting API 21+`,
        };
      }

      return {
        name: 'SDK Versions',
        category: 'manifest',
        status: 'pass',
        message: `Valid SDK versions: minSdk=${minSdk}, targetSdk=${targetSdk}`,
      };
    } catch (error) {
      return {
        name: 'SDK Versions',
        category: 'manifest',
        status: 'fail',
        message: `Could not check SDK versions: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Check if permissions are declared
   */
  private async checkPermissions(artifactPath: string): Promise<VerificationCheck> {
    try {
      const manifestData = await this.extractManifest(artifactPath);
      if (!manifestData) {
        return {
          name: 'Permissions',
          category: 'manifest',
          status: 'fail',
          message: 'Could not extract manifest',
        };
      }

      const manifestStr = manifestData.toString('utf8');
      const permissionMatches = manifestStr.match(/android:name="android\.permission\.[^"]+"/g);

      if (!permissionMatches) {
        return {
          name: 'Permissions',
          category: 'manifest',
          status: 'pass',
          message: 'No permissions declared (app may not require permissions)',
        };
      }

      return {
        name: 'Permissions',
        category: 'manifest',
        status: 'pass',
        message: `${permissionMatches.length} permission(s) declared`,
      };
    } catch (error) {
      return {
        name: 'Permissions',
        category: 'manifest',
        status: 'fail',
        message: `Could not check permissions: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Check if components are declared
   */
  private async checkComponents(artifactPath: string): Promise<VerificationCheck> {
    try {
      const manifestData = await this.extractManifest(artifactPath);
      if (!manifestData) {
        return {
          name: 'Components',
          category: 'manifest',
          status: 'fail',
          message: 'Could not extract manifest',
        };
      }

      const manifestStr = manifestData.toString('utf8');
      const activityMatches = manifestStr.match(/<activity/g);
      const serviceMatches = manifestStr.match(/<service/g);
      const receiverMatches = manifestStr.match(/<receiver/g);
      const providerMatches = manifestStr.match(/<provider/g);

      const totalComponents =
        (activityMatches?.length || 0) +
        (serviceMatches?.length || 0) +
        (receiverMatches?.length || 0) +
        (providerMatches?.length || 0);

      if (totalComponents === 0) {
        return {
          name: 'Components',
          category: 'manifest',
          status: 'warning',
          message: 'No components declared in manifest',
        };
      }

      return {
        name: 'Components',
        category: 'manifest',
        status: 'pass',
        message: `${totalComponents} component(s) declared (Activities: ${activityMatches?.length || 0}, Services: ${serviceMatches?.length || 0}, Receivers: ${receiverMatches?.length || 0}, Providers: ${providerMatches?.length || 0})`,
      };
    } catch (error) {
      return {
        name: 'Components',
        category: 'manifest',
        status: 'fail',
        message: `Could not check components: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Check for common manifest mistakes
   */
  private async checkCommonMistakes(artifactPath: string): Promise<VerificationCheck> {
    try {
      const manifestData = await this.extractManifest(artifactPath);
      if (!manifestData) {
        return {
          name: 'Common Mistakes',
          category: 'manifest',
          status: 'fail',
          message: 'Could not extract manifest',
        };
      }

      const manifestStr = manifestData.toString('utf8');
      const mistakes: string[] = [];

      // Check for debuggable in release builds (if we can detect)
      if (manifestStr.includes('android:debuggable="true"')) {
        mistakes.push('debuggable=true found (should be false for release builds)');
      }

      // Check for missing intent filters on main activity
      if (manifestStr.includes('<activity') && !manifestStr.includes('android.intent.action.MAIN')) {
        mistakes.push('No MAIN activity found (app may not be launchable)');
      }

      if (mistakes.length > 0) {
        return {
          name: 'Common Mistakes',
          category: 'manifest',
          status: 'warning',
          message: `Potential issues found: ${mistakes.join(', ')}`,
        };
      }

      return {
        name: 'Common Mistakes',
        category: 'manifest',
        status: 'pass',
        message: 'No common manifest mistakes detected',
      };
    } catch (error) {
      return {
        name: 'Common Mistakes',
        category: 'manifest',
        status: 'fail',
        message: `Could not check for common mistakes: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Extract AndroidManifest.xml from APK/AAB
   */
  private async extractManifest(artifactPath: string): Promise<Buffer | null> {
    return new Promise((resolve) => {
      try {
        const fd = fs.openSync(artifactPath, 'r');
        const stats = fs.statSync(artifactPath);
        const fileSize = stats.size;

        // Read end of central directory record
        const eocdSize = Math.min(65557, fileSize);
        const eocdBuffer = Buffer.alloc(eocdSize);
        fs.readSync(fd, eocdBuffer, 0, eocdSize, Math.max(0, fileSize - eocdSize));

        // Find end of central directory signature
        let eocdOffset = -1;
        for (let i = eocdBuffer.length - 22; i >= 0; i--) {
          if (
            eocdBuffer[i] === 0x50 &&
            eocdBuffer[i + 1] === 0x4b &&
            eocdBuffer[i + 2] === 0x05 &&
            eocdBuffer[i + 3] === 0x06
          ) {
            eocdOffset = i;
            break;
          }
        }

        if (eocdOffset === -1) {
          fs.closeSync(fd);
          resolve(null);
          return;
        }

        // Parse EOCD
        const eocdData = eocdBuffer.slice(eocdOffset);
        const centralDirOffset = eocdData.readUInt32LE(16);
        const centralDirSize = eocdData.readUInt32LE(12);

        // Read central directory
        const centralDirBuffer = Buffer.alloc(centralDirSize);
        fs.readSync(fd, centralDirBuffer, 0, centralDirSize, centralDirOffset);

        // Find AndroidManifest.xml entry
        let offset = 0;
        while (offset < centralDirBuffer.length) {
          if (
            centralDirBuffer[offset] === 0x50 &&
            centralDirBuffer[offset + 1] === 0x4b &&
            centralDirBuffer[offset + 2] === 0x01 &&
            centralDirBuffer[offset + 3] === 0x04
          ) {
            const fileNameLength = centralDirBuffer.readUInt16LE(offset + 28);
            const fileName = centralDirBuffer.toString('utf8', offset + 46, offset + 46 + fileNameLength);

            if (fileName === 'AndroidManifest.xml') {
              // Found it! Now read the local file header to get the actual data
              const localHeaderOffset = centralDirBuffer.readUInt32LE(offset + 42);
              const localHeaderBuffer = Buffer.alloc(30);
              fs.readSync(fd, localHeaderBuffer, 0, 30, localHeaderOffset);

              const localFileNameLength = localHeaderBuffer.readUInt16LE(26);
              const localExtraFieldLength = localHeaderBuffer.readUInt16LE(28);
              const compressedSize = centralDirBuffer.readUInt32LE(offset + 20);
              const uncompressedSize = centralDirBuffer.readUInt32LE(offset + 24);

              const dataOffset = localHeaderOffset + 30 + localFileNameLength + localExtraFieldLength;
              const manifestBuffer = Buffer.alloc(compressedSize);
              fs.readSync(fd, manifestBuffer, 0, compressedSize, dataOffset);

              fs.closeSync(fd);
              resolve(manifestBuffer);
              return;
            }

            const extraFieldLength = centralDirBuffer.readUInt16LE(offset + 30);
            const fileCommentLength = centralDirBuffer.readUInt16LE(offset + 32);
            offset += 46 + fileNameLength + extraFieldLength + fileCommentLength;
          } else {
            break;
          }
        }

        fs.closeSync(fd);
        resolve(null);
      } catch (error) {
        resolve(null);
      }
    });
  }

  /**
   * Create verification result from checks
   */
  private createVerificationResult(
    artifactPath: string,
    checks: VerificationCheck[],
    startTime: number
  ): VerificationResult {
    const failedChecks = checks.filter(c => c.status === 'fail');
    const warningChecks = checks.filter(c => c.status === 'warning');

    const overallStatus: 'pass' | 'fail' | 'warning' =
      failedChecks.length > 0 ? 'fail' : warningChecks.length > 0 ? 'warning' : 'pass';

    return {
      artifactPath,
      overallStatus,
      checks,
      timestamp: new Date(),
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Factory function to create ManifestValidator
 */
export function createManifestValidator(): ManifestValidator {
  return new ManifestValidator();
}
