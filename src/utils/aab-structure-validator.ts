import * as fs from 'fs';
import * as path from 'path';
import { VerificationCheck, VerificationResult } from '../types/android-build';

/**
 * AABStructureValidator validates the structure and integrity of AAB (Android App Bundle) files.
 * AAB files are ZIP archives that contain bundle components for Google Play distribution.
 */
export class AABStructureValidator {
  /**
   * Validate AAB file structure and integrity
   * @param aabPath Path to the AAB file
   * @returns VerificationResult with all checks performed
   */
  async validateAABStructure(aabPath: string): Promise<VerificationResult> {
    const startTime = Date.now();
    const checks: VerificationCheck[] = [];

    try {
      // Check 1: File existence and accessibility
      const fileExistsCheck = this.checkFileExists(aabPath);
      checks.push(fileExistsCheck);
      if (fileExistsCheck.status === 'fail') {
        return this.createVerificationResult(aabPath, checks, startTime);
      }

      // Check 2: File is not empty
      const fileSizeCheck = this.checkFileNotEmpty(aabPath);
      checks.push(fileSizeCheck);
      if (fileSizeCheck.status === 'fail') {
        return this.createVerificationResult(aabPath, checks, startTime);
      }

      // Check 3: Valid ZIP structure
      const zipStructureCheck = await this.checkValidZIPStructure(aabPath);
      checks.push(zipStructureCheck);
      if (zipStructureCheck.status === 'fail') {
        return this.createVerificationResult(aabPath, checks, startTime);
      }

      // Check 4: Required bundle components exist
      const bundleComponentsCheck = await this.checkBundleComponents(aabPath);
      checks.push(bundleComponentsCheck);

      // Check 5: BundleConfig.pb exists
      const bundleConfigCheck = await this.checkBundleConfig(aabPath);
      checks.push(bundleConfigCheck);

      // Check 6: Module directories exist
      const modulesCheck = await this.checkModuleDirectories(aabPath);
      checks.push(modulesCheck);

      // Check 7: Base module exists
      const baseModuleCheck = await this.checkBaseModule(aabPath);
      checks.push(baseModuleCheck);

      // Check 8: META-INF directory exists
      const metaInfCheck = await this.checkMetaInfDirectory(aabPath);
      checks.push(metaInfCheck);

      // Check 9: Signature files exist in META-INF
      const signatureCheck = await this.checkSignatureFiles(aabPath);
      checks.push(signatureCheck);

      // Check 10: No corrupted entries
      const integrityCheck = await this.checkZIPIntegrity(aabPath);
      checks.push(integrityCheck);
    } catch (error) {
      checks.push({
        name: 'Unexpected Error',
        category: 'structure',
        status: 'fail',
        message: `Unexpected error during validation: ${error instanceof Error ? error.message : String(error)}`,
        details: error instanceof Error ? error.stack : undefined,
      });
    }

    return this.createVerificationResult(aabPath, checks, startTime);
  }

  /**
   * Check if AAB file exists and is accessible
   */
  private checkFileExists(aabPath: string): VerificationCheck {
    try {
      if (!fs.existsSync(aabPath)) {
        return {
          name: 'File Existence',
          category: 'structure',
          status: 'fail',
          message: `AAB file not found at ${aabPath}`,
        };
      }

      // Check if file is readable
      fs.accessSync(aabPath, fs.constants.R_OK);

      return {
        name: 'File Existence',
        category: 'structure',
        status: 'pass',
        message: `AAB file exists and is readable`,
      };
    } catch (error) {
      return {
        name: 'File Existence',
        category: 'structure',
        status: 'fail',
        message: `Cannot access AAB file: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Check if AAB file is not empty
   */
  private checkFileNotEmpty(aabPath: string): VerificationCheck {
    try {
      const stats = fs.statSync(aabPath);
      if (stats.size === 0) {
        return {
          name: 'File Size',
          category: 'structure',
          status: 'fail',
          message: 'AAB file is empty (0 bytes)',
        };
      }

      return {
        name: 'File Size',
        category: 'structure',
        status: 'pass',
        message: `AAB file size is valid (${stats.size} bytes)`,
      };
    } catch (error) {
      return {
        name: 'File Size',
        category: 'structure',
        status: 'fail',
        message: `Cannot determine file size: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Check if AAB has valid ZIP structure
   */
  private async checkValidZIPStructure(aabPath: string): Promise<VerificationCheck> {
    try {
      // Read first 4 bytes to check ZIP signature (PK\x03\x04)
      const buffer = Buffer.alloc(4);
      const fd = fs.openSync(aabPath, 'r');
      fs.readSync(fd, buffer, 0, 4, 0);
      fs.closeSync(fd);

      const zipSignature = buffer.toString('hex');
      if (zipSignature !== '504b0304') {
        return {
          name: 'ZIP Structure',
          category: 'structure',
          status: 'fail',
          message: 'AAB does not have valid ZIP signature (expected 504b0304)',
          details: `Found signature: ${zipSignature}`,
        };
      }

      return {
        name: 'ZIP Structure',
        category: 'structure',
        status: 'pass',
        message: 'AAB has valid ZIP structure',
      };
    } catch (error) {
      return {
        name: 'ZIP Structure',
        category: 'structure',
        status: 'fail',
        message: `Cannot validate ZIP structure: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Check if required bundle components exist
   */
  private async checkBundleComponents(aabPath: string): Promise<VerificationCheck> {
    try {
      const entries = await this.getZIPEntries(aabPath);
      const requiredComponents = ['BundleConfig.pb', 'base/'];
      const missingComponents: string[] = [];

      for (const component of requiredComponents) {
        if (!entries.some(entry => entry === component || entry.startsWith(component))) {
          missingComponents.push(component);
        }
      }

      if (missingComponents.length > 0) {
        return {
          name: 'Bundle Components',
          category: 'structure',
          status: 'fail',
          message: `Required bundle components are missing: ${missingComponents.join(', ')}`,
        };
      }

      return {
        name: 'Bundle Components',
        category: 'structure',
        status: 'pass',
        message: 'All required bundle components are present',
      };
    } catch (error) {
      return {
        name: 'Bundle Components',
        category: 'structure',
        status: 'fail',
        message: `Cannot check bundle components: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Check if BundleConfig.pb exists
   */
  private async checkBundleConfig(aabPath: string): Promise<VerificationCheck> {
    try {
      const entries = await this.getZIPEntries(aabPath);
      if (!entries.includes('BundleConfig.pb')) {
        return {
          name: 'BundleConfig.pb',
          category: 'structure',
          status: 'fail',
          message: 'BundleConfig.pb not found in AAB',
        };
      }

      return {
        name: 'BundleConfig.pb',
        category: 'structure',
        status: 'pass',
        message: 'BundleConfig.pb is present',
      };
    } catch (error) {
      return {
        name: 'BundleConfig.pb',
        category: 'structure',
        status: 'fail',
        message: `Cannot check for BundleConfig.pb: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Check if module directories exist
   */
  private async checkModuleDirectories(aabPath: string): Promise<VerificationCheck> {
    try {
      const entries = await this.getZIPEntries(aabPath);
      const modules = new Set<string>();

      for (const entry of entries) {
        if (entry.includes('/')) {
          const moduleName = entry.split('/')[0];
          if (moduleName && moduleName !== 'META-INF' && moduleName !== 'BundleConfig.pb') {
            modules.add(moduleName);
          }
        }
      }

      if (modules.size === 0) {
        return {
          name: 'Module Directories',
          category: 'structure',
          status: 'warning',
          message: 'No module directories found in AAB',
        };
      }

      return {
        name: 'Module Directories',
        category: 'structure',
        status: 'pass',
        message: `Module directories present (${Array.from(modules).join(', ')})`,
      };
    } catch (error) {
      return {
        name: 'Module Directories',
        category: 'structure',
        status: 'fail',
        message: `Cannot check module directories: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Check if base module exists
   */
  private async checkBaseModule(aabPath: string): Promise<VerificationCheck> {
    try {
      const entries = await this.getZIPEntries(aabPath);
      if (!entries.some(entry => entry.startsWith('base/'))) {
        return {
          name: 'Base Module',
          category: 'structure',
          status: 'fail',
          message: 'Base module not found in AAB',
        };
      }

      return {
        name: 'Base Module',
        category: 'structure',
        status: 'pass',
        message: 'Base module is present',
      };
    } catch (error) {
      return {
        name: 'Base Module',
        category: 'structure',
        status: 'fail',
        message: `Cannot check base module: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Check if META-INF directory exists
   */
  private async checkMetaInfDirectory(aabPath: string): Promise<VerificationCheck> {
    try {
      const entries = await this.getZIPEntries(aabPath);
      if (!entries.some(entry => entry.startsWith('META-INF/'))) {
        return {
          name: 'META-INF Directory',
          category: 'signature',
          status: 'fail',
          message: 'META-INF directory not found in AAB',
        };
      }

      return {
        name: 'META-INF Directory',
        category: 'signature',
        status: 'pass',
        message: 'META-INF directory is present',
      };
    } catch (error) {
      return {
        name: 'META-INF Directory',
        category: 'signature',
        status: 'fail',
        message: `Cannot check META-INF directory: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Check if signature files exist in META-INF
   */
  private async checkSignatureFiles(aabPath: string): Promise<VerificationCheck> {
    try {
      const entries = await this.getZIPEntries(aabPath);
      const signatureFiles = entries.filter(
        entry =>
          entry.startsWith('META-INF/') &&
          (entry.endsWith('.RSA') || entry.endsWith('.DSA') || entry.endsWith('.EC'))
      );

      if (signatureFiles.length === 0) {
        return {
          name: 'Signature Files',
          category: 'signature',
          status: 'warning',
          message: 'No signature files found in META-INF',
          details: 'AAB may not be signed',
        };
      }

      return {
        name: 'Signature Files',
        category: 'signature',
        status: 'pass',
        message: `Signature files present (${signatureFiles.join(', ')})`,
      };
    } catch (error) {
      return {
        name: 'Signature Files',
        category: 'signature',
        status: 'fail',
        message: `Cannot check signature files: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Check ZIP file integrity
   */
  private async checkZIPIntegrity(aabPath: string): Promise<VerificationCheck> {
    try {
      // Try to read all entries to verify ZIP integrity
      const entries = await this.getZIPEntries(aabPath);

      if (entries.length === 0) {
        return {
          name: 'ZIP Integrity',
          category: 'structure',
          status: 'fail',
          message: 'AAB ZIP file appears to be empty or corrupted',
        };
      }

      return {
        name: 'ZIP Integrity',
        category: 'structure',
        status: 'pass',
        message: `ZIP integrity verified (${entries.length} entries)`,
      };
    } catch (error) {
      return {
        name: 'ZIP Integrity',
        category: 'structure',
        status: 'fail',
        message: `ZIP integrity check failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Get list of entries in ZIP file
   */
  private async getZIPEntries(aabPath: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const entries: string[] = [];

      try {
        const fd = fs.openSync(aabPath, 'r');
        const stats = fs.statSync(aabPath);
        const fileSize = stats.size;

        // Read end of central directory record (last 22 bytes minimum)
        const eocdSize = Math.min(65557, fileSize); // Max EOCD size
        const eocdBuffer = Buffer.alloc(eocdSize);
        fs.readSync(fd, eocdBuffer, 0, eocdSize, Math.max(0, fileSize - eocdSize));

        // Find end of central directory signature (0x06054b50)
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
          reject(new Error('Invalid ZIP file: End of central directory not found'));
          fs.closeSync(fd);
          return;
        }

        // Parse EOCD to get central directory offset
        const eocdData = eocdBuffer.slice(eocdOffset);
        const centralDirOffset = eocdData.readUInt32LE(16);
        const centralDirSize = eocdData.readUInt32LE(12);

        // Read central directory
        const centralDirBuffer = Buffer.alloc(centralDirSize);
        fs.readSync(fd, centralDirBuffer, 0, centralDirSize, centralDirOffset);

        // Parse central directory entries
        let offset = 0;
        while (offset < centralDirBuffer.length) {
          // Check for central directory file header signature (0x02014b50)
          if (
            centralDirBuffer[offset] === 0x50 &&
            centralDirBuffer[offset + 1] === 0x4b &&
            centralDirBuffer[offset + 2] === 0x01 &&
            centralDirBuffer[offset + 3] === 0x04
          ) {
            const fileNameLength = centralDirBuffer.readUInt16LE(offset + 28);
            const extraFieldLength = centralDirBuffer.readUInt16LE(offset + 30);
            const fileCommentLength = centralDirBuffer.readUInt16LE(offset + 32);

            const fileName = centralDirBuffer.toString('utf8', offset + 46, offset + 46 + fileNameLength);
            entries.push(fileName);

            offset += 46 + fileNameLength + extraFieldLength + fileCommentLength;
          } else {
            break;
          }
        }

        fs.closeSync(fd);
        resolve(entries);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Create verification result from checks
   */
  private createVerificationResult(
    aabPath: string,
    checks: VerificationCheck[],
    startTime: number
  ): VerificationResult {
    const failedChecks = checks.filter(c => c.status === 'fail');
    const warningChecks = checks.filter(c => c.status === 'warning');

    const overallStatus: 'pass' | 'fail' | 'warning' =
      failedChecks.length > 0 ? 'fail' : warningChecks.length > 0 ? 'warning' : 'pass';

    return {
      artifactPath: aabPath,
      overallStatus,
      checks,
      timestamp: new Date(),
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Factory function to create AABStructureValidator
 */
export function createAABStructureValidator(): AABStructureValidator {
  return new AABStructureValidator();
}
