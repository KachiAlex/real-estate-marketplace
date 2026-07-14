import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import { VerificationCheck, VerificationResult } from '../types/android-build';

/**
 * APKStructureValidator validates the structure and integrity of APK files.
 * APK files are ZIP archives that must contain specific directories and files.
 */
export class APKStructureValidator {
  /**
   * Validate APK file structure and integrity
   * @param apkPath Path to the APK file
   * @returns VerificationResult with all checks performed
   */
  async validateAPKStructure(apkPath: string): Promise<VerificationResult> {
    const startTime = Date.now();
    const checks: VerificationCheck[] = [];

    try {
      // Check 1: File existence and accessibility
      const fileExistsCheck = this.checkFileExists(apkPath);
      checks.push(fileExistsCheck);
      if (fileExistsCheck.status === 'fail') {
        return this.createVerificationResult(apkPath, checks, startTime);
      }

      // Check 2: File is not empty
      const fileSizeCheck = this.checkFileNotEmpty(apkPath);
      checks.push(fileSizeCheck);
      if (fileSizeCheck.status === 'fail') {
        return this.createVerificationResult(apkPath, checks, startTime);
      }

      // Check 3: Valid ZIP structure
      const zipStructureCheck = await this.checkValidZIPStructure(apkPath);
      checks.push(zipStructureCheck);
      if (zipStructureCheck.status === 'fail') {
        return this.createVerificationResult(apkPath, checks, startTime);
      }

      // Check 4: Required directories exist
      const requiredDirsCheck = await this.checkRequiredDirectories(apkPath);
      checks.push(requiredDirsCheck);

      // Check 5: AndroidManifest.xml exists
      const manifestCheck = await this.checkManifestExists(apkPath);
      checks.push(manifestCheck);

      // Check 6: Resources directory exists
      const resourcesCheck = await this.checkResourcesDirectory(apkPath);
      checks.push(resourcesCheck);

      // Check 7: DEX files exist
      const dexCheck = await this.checkDEXFiles(apkPath);
      checks.push(dexCheck);

      // Check 8: META-INF directory exists
      const metaInfCheck = await this.checkMetaInfDirectory(apkPath);
      checks.push(metaInfCheck);

      // Check 9: Signature files exist in META-INF
      const signatureCheck = await this.checkSignatureFiles(apkPath);
      checks.push(signatureCheck);

      // Check 10: No corrupted entries
      const integrityCheck = await this.checkZIPIntegrity(apkPath);
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

    return this.createVerificationResult(apkPath, checks, startTime);
  }

  /**
   * Check if APK file exists and is accessible
   */
  private checkFileExists(apkPath: string): VerificationCheck {
    try {
      if (!fs.existsSync(apkPath)) {
        return {
          name: 'File Existence',
          category: 'structure',
          status: 'fail',
          message: `APK file not found at ${apkPath}`,
        };
      }

      // Check if file is readable
      fs.accessSync(apkPath, fs.constants.R_OK);

      return {
        name: 'File Existence',
        category: 'structure',
        status: 'pass',
        message: `APK file exists and is readable`,
      };
    } catch (error) {
      return {
        name: 'File Existence',
        category: 'structure',
        status: 'fail',
        message: `Cannot access APK file: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Check if APK file is not empty
   */
  private checkFileNotEmpty(apkPath: string): VerificationCheck {
    try {
      const stats = fs.statSync(apkPath);
      if (stats.size === 0) {
        return {
          name: 'File Size',
          category: 'structure',
          status: 'fail',
          message: 'APK file is empty (0 bytes)',
        };
      }

      return {
        name: 'File Size',
        category: 'structure',
        status: 'pass',
        message: `APK file size is valid (${stats.size} bytes)`,
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
   * Check if APK has valid ZIP structure
   */
  private async checkValidZIPStructure(apkPath: string): Promise<VerificationCheck> {
    try {
      // Read first 4 bytes to check ZIP signature (PK\x03\x04)
      const buffer = Buffer.alloc(4);
      const fd = fs.openSync(apkPath, 'r');
      fs.readSync(fd, buffer, 0, 4, 0);
      fs.closeSync(fd);

      const zipSignature = buffer.toString('hex');
      if (zipSignature !== '504b0304') {
        return {
          name: 'ZIP Structure',
          category: 'structure',
          status: 'fail',
          message: 'APK does not have valid ZIP signature (expected 504b0304)',
          details: `Found signature: ${zipSignature}`,
        };
      }

      return {
        name: 'ZIP Structure',
        category: 'structure',
        status: 'pass',
        message: 'APK has valid ZIP structure',
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
   * Check if required directories exist in APK
   */
  private async checkRequiredDirectories(apkPath: string): Promise<VerificationCheck> {
    try {
      const entries = await this.getZIPEntries(apkPath);
      const requiredDirs = ['META-INF/', 'res/', 'lib/'];
      const missingDirs: string[] = [];

      for (const dir of requiredDirs) {
        if (!entries.some(entry => entry.startsWith(dir))) {
          missingDirs.push(dir);
        }
      }

      if (missingDirs.length > 0) {
        return {
          name: 'Required Directories',
          category: 'structure',
          status: 'warning',
          message: `Some expected directories are missing: ${missingDirs.join(', ')}`,
          details: `Note: lib/ directory is optional for apps without native libraries`,
        };
      }

      return {
        name: 'Required Directories',
        category: 'structure',
        status: 'pass',
        message: 'All required directories are present',
      };
    } catch (error) {
      return {
        name: 'Required Directories',
        category: 'structure',
        status: 'fail',
        message: `Cannot check required directories: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Check if AndroidManifest.xml exists
   */
  private async checkManifestExists(apkPath: string): Promise<VerificationCheck> {
    try {
      const entries = await this.getZIPEntries(apkPath);
      if (!entries.includes('AndroidManifest.xml')) {
        return {
          name: 'AndroidManifest.xml',
          category: 'structure',
          status: 'fail',
          message: 'AndroidManifest.xml not found in APK',
        };
      }

      return {
        name: 'AndroidManifest.xml',
        category: 'structure',
        status: 'pass',
        message: 'AndroidManifest.xml is present',
      };
    } catch (error) {
      return {
        name: 'AndroidManifest.xml',
        category: 'structure',
        status: 'fail',
        message: `Cannot check for AndroidManifest.xml: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Check if resources directory exists
   */
  private async checkResourcesDirectory(apkPath: string): Promise<VerificationCheck> {
    try {
      const entries = await this.getZIPEntries(apkPath);
      if (!entries.some(entry => entry.startsWith('res/'))) {
        return {
          name: 'Resources Directory',
          category: 'structure',
          status: 'warning',
          message: 'Resources directory (res/) not found in APK',
          details: 'Note: Some apps may not have resources',
        };
      }

      return {
        name: 'Resources Directory',
        category: 'structure',
        status: 'pass',
        message: 'Resources directory is present',
      };
    } catch (error) {
      return {
        name: 'Resources Directory',
        category: 'structure',
        status: 'fail',
        message: `Cannot check resources directory: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Check if DEX files exist
   */
  private async checkDEXFiles(apkPath: string): Promise<VerificationCheck> {
    try {
      const entries = await this.getZIPEntries(apkPath);
      const dexFiles = entries.filter(entry => entry.endsWith('.dex'));

      if (dexFiles.length === 0) {
        return {
          name: 'DEX Files',
          category: 'code',
          status: 'fail',
          message: 'No DEX files found in APK',
        };
      }

      return {
        name: 'DEX Files',
        category: 'code',
        status: 'pass',
        message: `DEX files present (${dexFiles.length} file(s): ${dexFiles.join(', ')})`,
      };
    } catch (error) {
      return {
        name: 'DEX Files',
        category: 'code',
        status: 'fail',
        message: `Cannot check DEX files: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Check if META-INF directory exists
   */
  private async checkMetaInfDirectory(apkPath: string): Promise<VerificationCheck> {
    try {
      const entries = await this.getZIPEntries(apkPath);
      if (!entries.some(entry => entry.startsWith('META-INF/'))) {
        return {
          name: 'META-INF Directory',
          category: 'signature',
          status: 'fail',
          message: 'META-INF directory not found in APK',
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
  private async checkSignatureFiles(apkPath: string): Promise<VerificationCheck> {
    try {
      const entries = await this.getZIPEntries(apkPath);
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
          details: 'APK may not be signed',
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
  private async checkZIPIntegrity(apkPath: string): Promise<VerificationCheck> {
    try {
      // Try to read all entries to verify ZIP integrity
      const entries = await this.getZIPEntries(apkPath);

      if (entries.length === 0) {
        return {
          name: 'ZIP Integrity',
          category: 'structure',
          status: 'fail',
          message: 'APK ZIP file appears to be empty or corrupted',
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
   * This is a simplified implementation that reads the ZIP central directory
   */
  private async getZIPEntries(apkPath: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const entries: string[] = [];
      const buffer = Buffer.alloc(1024 * 1024); // 1MB buffer

      try {
        const fd = fs.openSync(apkPath, 'r');
        const stats = fs.statSync(apkPath);
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
    apkPath: string,
    checks: VerificationCheck[],
    startTime: number
  ): VerificationResult {
    const failedChecks = checks.filter(c => c.status === 'fail');
    const warningChecks = checks.filter(c => c.status === 'warning');

    const overallStatus: 'pass' | 'fail' | 'warning' =
      failedChecks.length > 0 ? 'fail' : warningChecks.length > 0 ? 'warning' : 'pass';

    return {
      artifactPath: apkPath,
      overallStatus,
      checks,
      timestamp: new Date(),
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Factory function to create APKStructureValidator
 */
export function createAPKStructureValidator(): APKStructureValidator {
  return new APKStructureValidator();
}
