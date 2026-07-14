import * as fs from 'fs';
import * as path from 'path';
import {
  BuildManifest,
  BuildArtifact,
  BuildStageResult,
  BuildVariant,
  BuildType,
} from '../types/android-build';

/**
 * BuildManifestGenerator creates build manifest JSON files containing artifact metadata,
 * build timing information, environment details, and reproducibility metadata.
 */
export class BuildManifestGenerator {
  constructor(private outputDirectory: string) {
    if (!outputDirectory) {
      throw new Error('Output directory is required');
    }
  }

  /**
   * Generate a build manifest with artifact metadata and build information
   */
  async generateManifest(
    buildId: string,
    variant: BuildVariant,
    artifacts: BuildArtifact[],
    stages: BuildStageResult[],
    buildDuration: number,
    environmentInfo: {
      gradleVersion: string;
      androidSdkVersion: number;
      buildToolsVersion: string;
    },
    reproducibilityInfo?: {
      reproducible: boolean;
      previousBuildId?: string;
      checksumMatch: boolean;
    }
  ): Promise<BuildManifest> {
    if (!buildId || buildId.trim() === '') {
      throw new Error('Build ID is required');
    }

    if (!artifacts || artifacts.length === 0) {
      throw new Error('At least one artifact is required');
    }

    if (!stages || stages.length === 0) {
      throw new Error('At least one build stage is required');
    }

    if (buildDuration < 0) {
      throw new Error('Build duration must be non-negative');
    }

    if (!environmentInfo) {
      throw new Error('Environment information is required');
    }

    const manifest: BuildManifest = {
      buildId,
      timestamp: new Date(),
      profile: this.getProfileFromVariant(variant),
      variant: variant,
      artifacts: artifacts,
      buildDuration: buildDuration,
      stages: stages,
      environment: environmentInfo,
      reproducibilityInfo: reproducibilityInfo,
    };

    return manifest;
  }

  /**
   * Save a build manifest to a JSON file
   */
  async saveManifest(manifest: BuildManifest, filePath: string): Promise<void> {
    if (!filePath || filePath.trim() === '') {
      throw new Error('File path is required');
    }

    // Ensure directory exists
    const directory = path.dirname(filePath);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    // Write manifest to file
    const manifestJson = JSON.stringify(manifest, null, 2);
    fs.writeFileSync(filePath, manifestJson, 'utf-8');
  }

  /**
   * Load a build manifest from a JSON file
   */
  async loadManifest(filePath: string): Promise<BuildManifest> {
    if (!filePath || filePath.trim() === '') {
      throw new Error('File path is required');
    }

    if (!fs.existsSync(filePath)) {
      throw new Error(`Manifest file not found: ${filePath}`);
    }

    try {
      const manifestJson = fs.readFileSync(filePath, 'utf-8');
      const manifest = JSON.parse(manifestJson) as BuildManifest;

      // Validate manifest structure
      this.validateManifest(manifest);

      // Convert timestamp string back to Date if needed
      if (typeof manifest.timestamp === 'string') {
        manifest.timestamp = new Date(manifest.timestamp);
      }

      return manifest;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid manifest JSON: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Validate manifest structure and required fields
   */
  private validateManifest(manifest: any): void {
    if (!manifest.buildId) {
      throw new Error('Manifest missing required field: buildId');
    }

    if (!manifest.timestamp) {
      throw new Error('Manifest missing required field: timestamp');
    }

    if (!manifest.variant) {
      throw new Error('Manifest missing required field: variant');
    }

    if (!Array.isArray(manifest.artifacts) || manifest.artifacts.length === 0) {
      throw new Error('Manifest missing required field: artifacts (must be non-empty array)');
    }

    if (!Array.isArray(manifest.stages) || manifest.stages.length === 0) {
      throw new Error('Manifest missing required field: stages (must be non-empty array)');
    }

    if (typeof manifest.buildDuration !== 'number' || manifest.buildDuration < 0) {
      throw new Error('Manifest invalid field: buildDuration (must be non-negative number)');
    }

    if (!manifest.environment) {
      throw new Error('Manifest missing required field: environment');
    }

    if (!manifest.environment.gradleVersion) {
      throw new Error('Manifest environment missing required field: gradleVersion');
    }

    if (typeof manifest.environment.androidSdkVersion !== 'number') {
      throw new Error('Manifest environment invalid field: androidSdkVersion (must be number)');
    }

    if (!manifest.environment.buildToolsVersion) {
      throw new Error('Manifest environment missing required field: buildToolsVersion');
    }
  }

  /**
   * Get profile name from variant
   */
  private getProfileFromVariant(variant: BuildVariant): string {
    switch (variant) {
      case BuildVariant.Debug:
        return 'development';
      case BuildVariant.Release:
        return 'production';
      case BuildVariant.AAB:
        return 'production';
      default:
        return 'custom';
    }
  }

  /**
   * Create a manifest file path based on variant and timestamp
   */
  getManifestPath(variant: BuildVariant, timestamp: Date): string {
    const variantDir = variant === BuildVariant.Debug ? 'debug' : 'release';
    const timestampStr = this.formatTimestamp(timestamp);
    const manifestFileName = 'build-manifest.json';

    return path.join(this.outputDirectory, variantDir, timestampStr, manifestFileName);
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
}

/**
 * Factory function to create a BuildManifestGenerator instance
 */
export function createBuildManifestGenerator(outputDirectory: string): BuildManifestGenerator {
  return new BuildManifestGenerator(outputDirectory);
}
