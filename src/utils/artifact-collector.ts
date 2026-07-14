import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { BuildArtifact, BuildVariant, BuildType } from '../types/android-build';

/**
 * ArtifactCollector locates generated APK/AAB files from build output,
 * calculates SHA-256 checksums, and extracts metadata.
 */
export class ArtifactCollector {
  private buildOutputDir: string;

  constructor(buildOutputDir: string) {
    this.buildOutputDir = buildOutputDir;
  }

  /**
   * Collect artifacts from the build output directory.
   * Searches for APK and AAB files and extracts metadata.
   *
   * @param variant - The build variant (debug, release, aab)
   * @returns Array of collected artifacts
   * @throws Error if no artifacts are found or if file operations fail
   */
  async collectArtifacts(variant: BuildVariant): Promise<BuildArtifact[]> {
    const artifacts: BuildArtifact[] = [];

    // Determine which file patterns to search for
    const patterns = this.getArtifactPatterns(variant);

    // Search for artifacts in build output directory
    for (const pattern of patterns) {
      const foundArtifacts = await this.findArtifactsByPattern(pattern);
      artifacts.push(...foundArtifacts);
    }

    if (artifacts.length === 0) {
      throw new Error(
        `No artifacts found for variant ${variant} in ${this.buildOutputDir}`
      );
    }

    return artifacts;
  }

  /**
   * Collect a single artifact by file path.
   * Useful when the artifact path is already known.
   *
   * @param filePath - Full path to the artifact file
   * @param variant - The build variant
   * @param buildType - The build type (debug or release)
   * @returns The collected artifact
   * @throws Error if file doesn't exist or can't be read
   */
  async collectArtifactByPath(
    filePath: string,
    variant: BuildVariant,
    buildType: BuildType
  ): Promise<BuildArtifact> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Artifact file not found: ${filePath}`);
    }

    const stats = fs.statSync(filePath);
    if (stats.size === 0) {
      throw new Error(`Artifact file is empty: ${filePath}`);
    }

    const checksum = await this.calculateSHA256(filePath);
    const fileName = path.basename(filePath);
    const artifactType = this.getArtifactType(fileName);

    return {
      id: this.generateArtifactId(fileName),
      type: artifactType,
      variant,
      buildType,
      filePath,
      fileName,
      fileSize: stats.size,
      checksum,
      timestamp: stats.mtime,
      buildDuration: 0, // Will be set by caller
      signingInfo: {
        signed: false,
        certificateSubjectDN: '',
        certificateIssuerDN: '',
        certificateNotBefore: new Date(),
        certificateNotAfter: new Date(),
        signatureAlgorithm: '',
        certificateExpired: false,
        certificateExpiringIn: 0,
      },
      manifestInfo: {
        packageName: '',
        versionCode: 0,
        versionName: '',
        minSdkVersion: 0,
        targetSdkVersion: 0,
        permissions: [],
        activities: [],
        services: [],
        receivers: [],
        providers: [],
      },
      metadata: {},
    };
  }

  /**
   * Calculate SHA-256 checksum of a file.
   *
   * @param filePath - Path to the file
   * @returns SHA-256 checksum as hex string
   * @throws Error if file can't be read
   */
  async calculateSHA256(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);

      stream.on('error', (err) => {
        reject(new Error(`Failed to calculate checksum for ${filePath}: ${err.message}`));
      });

      stream.on('data', (chunk) => {
        hash.update(chunk);
      });

      stream.on('end', () => {
        resolve(hash.digest('hex'));
      });
    });
  }

  /**
   * Get artifact patterns to search for based on variant.
   *
   * @param variant - The build variant
   * @returns Array of file patterns to search for
   */
  private getArtifactPatterns(variant: BuildVariant): string[] {
    switch (variant) {
      case BuildVariant.Debug:
        return ['**/*-debug.apk', '**/app-debug.apk'];
      case BuildVariant.Release:
        return ['**/*-release.apk', '**/app-release.apk'];
      case BuildVariant.AAB:
        return ['**/*-release.aab', '**/app-release.aab', '**/*.aab'];
      default:
        return [];
    }
  }

  /**
   * Find artifacts matching a pattern in the build output directory.
   *
   * @param pattern - File pattern to search for
   * @returns Array of found artifacts
   */
  private async findArtifactsByPattern(pattern: string): Promise<BuildArtifact[]> {
    const artifacts: BuildArtifact[] = [];

    // Simple pattern matching - search for files in build output
    const searchDir = this.buildOutputDir;

    if (!fs.existsSync(searchDir)) {
      return artifacts;
    }

    const files = this.findFilesRecursive(searchDir, pattern);

    for (const filePath of files) {
      try {
        const stats = fs.statSync(filePath);
        if (stats.size === 0) {
          continue; // Skip empty files
        }

        const checksum = await this.calculateSHA256(filePath);
        const fileName = path.basename(filePath);
        const artifactType = this.getArtifactType(fileName);
        const buildType = this.getBuildTypeFromFileName(fileName);

        artifacts.push({
          id: this.generateArtifactId(fileName),
          type: artifactType,
          variant: this.getVariantFromFileName(fileName),
          buildType,
          filePath,
          fileName,
          fileSize: stats.size,
          checksum,
          timestamp: stats.mtime,
          buildDuration: 0,
          signingInfo: {
            signed: false,
            certificateSubjectDN: '',
            certificateIssuerDN: '',
            certificateNotBefore: new Date(),
            certificateNotAfter: new Date(),
            signatureAlgorithm: '',
            certificateExpired: false,
            certificateExpiringIn: 0,
          },
          manifestInfo: {
            packageName: '',
            versionCode: 0,
            versionName: '',
            minSdkVersion: 0,
            targetSdkVersion: 0,
            permissions: [],
            activities: [],
            services: [],
            receivers: [],
            providers: [],
          },
          metadata: {},
        });
      } catch (error) {
        // Skip files that can't be processed
        continue;
      }
    }

    return artifacts;
  }

  /**
   * Recursively find files matching a pattern.
   *
   * @param dir - Directory to search
   * @param pattern - File pattern to match
   * @returns Array of matching file paths
   */
  private findFilesRecursive(dir: string, pattern: string): string[] {
    const files: string[] = [];

    if (!fs.existsSync(dir)) {
      return files;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Recursively search subdirectories
        files.push(...this.findFilesRecursive(fullPath, pattern));
      } else if (entry.isFile()) {
        // Check if file matches pattern
        if (this.matchesPattern(entry.name, pattern)) {
          files.push(fullPath);
        }
      }
    }

    return files;
  }

  /**
   * Check if a filename matches a pattern.
   *
   * @param fileName - The filename to check
   * @param pattern - The pattern to match against
   * @returns True if the filename matches the pattern
   */
  private matchesPattern(fileName: string, pattern: string): boolean {
    // Handle simple patterns like "*-debug.apk" or "app-*.apk"
    if (pattern.includes('**')) {
      // For ** patterns, just check if the filename ends with the suffix
      const suffix = pattern.replace('**/', '').replace('**/','');
      return fileName.endsWith(suffix) || fileName.includes(suffix);
    }

    if (pattern.includes('*')) {
      // Convert glob pattern to regex
      const regexPattern = pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.');

      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(fileName);
    }

    // Exact match
    return fileName === pattern;
  }

  /**
   * Get artifact type from filename.
   *
   * @param fileName - The artifact filename
   * @returns The artifact type (apk or aab)
   */
  private getArtifactType(fileName: string): 'apk' | 'aab' {
    if (fileName.endsWith('.aab')) {
      return 'aab';
    }
    return 'apk';
  }

  /**
   * Get build type from filename.
   *
   * @param fileName - The artifact filename
   * @returns The build type (debug or release)
   */
  private getBuildTypeFromFileName(fileName: string): BuildType {
    if (fileName.includes('debug')) {
      return BuildType.Debug;
    }
    return BuildType.Release;
  }

  /**
   * Get variant from filename.
   *
   * @param fileName - The artifact filename
   * @returns The build variant
   */
  private getVariantFromFileName(fileName: string): BuildVariant {
    if (fileName.endsWith('.aab')) {
      return BuildVariant.AAB;
    }
    if (fileName.includes('debug')) {
      return BuildVariant.Debug;
    }
    return BuildVariant.Release;
  }

  /**
   * Generate a unique artifact ID.
   *
   * @param fileName - The artifact filename
   * @returns A unique artifact ID
   */
  private generateArtifactId(fileName: string): string {
    const timestamp = Date.now();
    const hash = crypto.createHash('md5').update(fileName).digest('hex').substring(0, 8);
    return `artifact-${timestamp}-${hash}`;
  }
}

/**
 * Create an ArtifactCollector instance.
 *
 * @param buildOutputDir - The build output directory
 * @returns A new ArtifactCollector instance
 */
export function createArtifactCollector(buildOutputDir: string): ArtifactCollector {
  return new ArtifactCollector(buildOutputDir);
}
