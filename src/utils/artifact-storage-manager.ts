import * as fs from 'fs';
import * as path from 'path';
import { BuildArtifact, BuildVariant } from '../types/android-build';

/**
 * ArtifactStorageManager organizes build artifacts by variant and timestamp,
 * creating a structured directory hierarchy for easy access and management.
 */
export class ArtifactStorageManager {
  constructor(private baseDirectory: string) {
    if (!baseDirectory) {
      throw new Error('Base directory is required');
    }
  }

  /**
   * Get the storage directory for a specific variant and timestamp
   */
  getStorageDirectory(variant: BuildVariant, timestamp: Date): string {
    const variantDir = this.getVariantDirectory(variant);
    const timestampDir = this.formatTimestamp(timestamp);
    return path.join(this.baseDirectory, variantDir, timestampDir);
  }

  /**
   * Store an artifact in the organized directory structure
   */
  async storeArtifact(artifact: BuildArtifact, destinationDirectory?: string): Promise<string> {
    if (!artifact) {
      throw new Error('Artifact is required');
    }

    if (!fs.existsSync(artifact.filePath)) {
      throw new Error(`Artifact file not found: ${artifact.filePath}`);
    }

    // Determine destination directory
    const storageDir =
      destinationDirectory || this.getStorageDirectory(artifact.variant, artifact.timestamp);

    // Create directory structure if it doesn't exist
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    // Copy artifact to storage location
    const destinationPath = path.join(storageDir, artifact.fileName);
    fs.copyFileSync(artifact.filePath, destinationPath);

    return destinationPath;
  }

  /**
   * Store multiple artifacts in the organized directory structure
   */
  async storeArtifacts(
    artifacts: BuildArtifact[],
    destinationDirectory?: string
  ): Promise<string[]> {
    if (!artifacts || artifacts.length === 0) {
      throw new Error('At least one artifact is required');
    }

    const storedPaths: string[] = [];

    for (const artifact of artifacts) {
      const storedPath = await this.storeArtifact(artifact, destinationDirectory);
      storedPaths.push(storedPath);
    }

    return storedPaths;
  }

  /**
   * Get all artifacts stored for a specific variant
   */
  async getArtifactsByVariant(variant: BuildVariant): Promise<BuildArtifact[]> {
    const variantDir = path.join(this.baseDirectory, this.getVariantDirectory(variant));

    if (!fs.existsSync(variantDir)) {
      return [];
    }

    const artifacts: BuildArtifact[] = [];
    const timestampDirs = fs.readdirSync(variantDir);

    for (const timestampDir of timestampDirs) {
      const timestampPath = path.join(variantDir, timestampDir);
      const stats = fs.statSync(timestampPath);

      if (stats.isDirectory()) {
        const files = fs.readdirSync(timestampPath);

        for (const file of files) {
          if (file.endsWith('.apk') || file.endsWith('.aab')) {
            const filePath = path.join(timestampPath, file);
            const fileStats = fs.statSync(filePath);

            artifacts.push({
              id: `artifact-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`,
              type: file.endsWith('.aab') ? 'aab' : 'apk',
              variant: variant,
              buildType: variant === BuildVariant.Debug ? 'debug' : 'release',
              filePath: filePath,
              fileName: file,
              fileSize: fileStats.size,
              checksum: '', // Would be calculated by ArtifactCollector
              timestamp: new Date(fileStats.mtime),
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
          }
        }
      }
    }

    return artifacts;
  }

  /**
   * Get artifacts stored within a date range for a specific variant
   */
  async getArtifactsByDateRange(
    variant: BuildVariant,
    startDate: Date,
    endDate: Date
  ): Promise<BuildArtifact[]> {
    if (startDate > endDate) {
      throw new Error('Start date must be before end date');
    }

    const allArtifacts = await this.getArtifactsByVariant(variant);

    return allArtifacts.filter((artifact) => {
      return artifact.timestamp >= startDate && artifact.timestamp <= endDate;
    });
  }

  /**
   * Get the most recent artifacts for a variant
   */
  async getRecentArtifacts(variant: BuildVariant, limit: number = 10): Promise<BuildArtifact[]> {
    if (limit <= 0) {
      throw new Error('Limit must be greater than 0');
    }

    const allArtifacts = await this.getArtifactsByVariant(variant);

    // Sort by timestamp descending (most recent first)
    allArtifacts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return allArtifacts.slice(0, limit);
  }

  /**
   * Delete artifacts older than a specified date
   */
  async deleteArtifactsOlderThan(variant: BuildVariant, cutoffDate: Date): Promise<number> {
    const variantDir = path.join(this.baseDirectory, this.getVariantDirectory(variant));

    if (!fs.existsSync(variantDir)) {
      return 0;
    }

    let deletedCount = 0;
    const timestampDirs = fs.readdirSync(variantDir);

    for (const timestampDir of timestampDirs) {
      const timestampPath = path.join(variantDir, timestampDir);
      const stats = fs.statSync(timestampPath);

      if (stats.isDirectory()) {
        const dirDate = new Date(stats.mtime);

        if (dirDate < cutoffDate) {
          const files = fs.readdirSync(timestampPath);
          deletedCount += files.length;
          fs.rmSync(timestampPath, { recursive: true, force: true });
        }
      }
    }

    return deletedCount;
  }

  /**
   * Get total storage size for a variant
   */
  async getStorageSize(variant: BuildVariant): Promise<number> {
    const variantDir = path.join(this.baseDirectory, this.getVariantDirectory(variant));

    if (!fs.existsSync(variantDir)) {
      return 0;
    }

    let totalSize = 0;
    const timestampDirs = fs.readdirSync(variantDir);

    for (const timestampDir of timestampDirs) {
      const timestampPath = path.join(variantDir, timestampDir);
      const stats = fs.statSync(timestampPath);

      if (stats.isDirectory()) {
        const files = fs.readdirSync(timestampPath);

        for (const file of files) {
          const filePath = path.join(timestampPath, file);
          const fileStats = fs.statSync(filePath);
          totalSize += fileStats.size;
        }
      }
    }

    return totalSize;
  }

  /**
   * Get the variant directory name
   */
  private getVariantDirectory(variant: BuildVariant): string {
    switch (variant) {
      case BuildVariant.Debug:
        return 'debug';
      case BuildVariant.Release:
        return 'release';
      case BuildVariant.AAB:
        return 'release';
      default:
        return 'custom';
    }
  }

  /**
   * Format timestamp for directory naming (YYYY-MM-DD_HH-mm-ss)
   */
  private formatTimestamp(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
  }

  /**
   * Verify storage directory structure exists
   */
  async ensureStorageDirectoryExists(): Promise<void> {
    if (!fs.existsSync(this.baseDirectory)) {
      fs.mkdirSync(this.baseDirectory, { recursive: true });
    }
  }
}

/**
 * Factory function to create an ArtifactStorageManager instance
 */
export function createArtifactStorageManager(baseDirectory: string): ArtifactStorageManager {
  return new ArtifactStorageManager(baseDirectory);
}
