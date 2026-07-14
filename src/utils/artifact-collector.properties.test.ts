import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ArtifactCollector } from './artifact-collector';
import { BuildVariant, BuildType } from '../types/android-build';

describe('ArtifactCollector - Property-Based Tests', () => {
  let tempDir: string;
  let collector: ArtifactCollector;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'artifact-pbt-'));
    collector = new ArtifactCollector(tempDir);
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Property 14: Artifact Storage Organization', () => {
    it('should store artifacts with clear naming conventions', () => {
      fc.assert(
        fc.asyncProperty(
          fc.stringMatching(/^[a-zA-Z0-9_-]{1,20}$/),
          fc.integer({ min: 1, max: 1000000 }),
          async (fileName, fileSize) => {
            // Create test artifact with naming convention
            const artifactPath = path.join(tempDir, `app-${fileName}.apk`);
            fs.writeFileSync(artifactPath, Buffer.alloc(fileSize));

            const artifact = await collector.collectArtifactByPath(
              artifactPath,
              BuildVariant.Debug,
              BuildType.Debug
            );

            // Verify artifact has clear naming
            expect(artifact.fileName).toBeDefined();
            expect(artifact.fileName).toContain('app-');
            expect(artifact.fileName).toMatch(/\.(apk|aab)$/);

            // Verify artifact path is accessible
            expect(artifact.filePath).toBe(artifactPath);
            expect(fs.existsSync(artifact.filePath)).toBe(true);

            // Verify artifact ID follows naming convention
            expect(artifact.id).toMatch(/^artifact-\d+-[a-f0-9]{8}$/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should organize artifacts by variant and timestamp', () => {
      fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.constant(BuildVariant.Debug),
            fc.constant(BuildVariant.Release),
            fc.constant(BuildVariant.AAB)
          ),
          async (variant) => {
            // Create artifacts for different variants
            const fileName =
              variant === BuildVariant.AAB
                ? 'app-release.aab'
                : variant === BuildVariant.Debug
                  ? 'app-debug.apk'
                  : 'app-release.apk';

            const artifactPath = path.join(tempDir, fileName);
            fs.writeFileSync(artifactPath, Buffer.from('test'));

            const buildType = variant === BuildVariant.Debug ? BuildType.Debug : BuildType.Release;

            const artifact = await collector.collectArtifactByPath(
              artifactPath,
              variant,
              buildType
            );

            // Verify artifact variant is correctly identified
            expect(artifact.variant).toBe(variant);

            // Verify timestamp is set
            expect(artifact.timestamp).toBeInstanceOf(Date);
            expect(artifact.timestamp.getTime()).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain consistent artifact structure across multiple collections', () => {
      fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100000 }),
          async (fileSize) => {
            const artifactPath = path.join(tempDir, 'app-debug.apk');
            fs.writeFileSync(artifactPath, Buffer.alloc(fileSize));

            const artifact1 = await collector.collectArtifactByPath(
              artifactPath,
              BuildVariant.Debug,
              BuildType.Debug
            );

            // Verify all required fields are present
            expect(artifact1.id).toBeDefined();
            expect(artifact1.type).toBeDefined();
            expect(artifact1.variant).toBeDefined();
            expect(artifact1.buildType).toBeDefined();
            expect(artifact1.filePath).toBeDefined();
            expect(artifact1.fileName).toBeDefined();
            expect(artifact1.fileSize).toBeDefined();
            expect(artifact1.checksum).toBeDefined();
            expect(artifact1.timestamp).toBeDefined();
            expect(artifact1.signingInfo).toBeDefined();
            expect(artifact1.manifestInfo).toBeDefined();
            expect(artifact1.metadata).toBeDefined();

            // Verify structure consistency
            expect(typeof artifact1.fileSize).toBe('number');
            expect(typeof artifact1.checksum).toBe('string');
            expect(artifact1.timestamp).toBeInstanceOf(Date);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 17: Artifact Information Availability', () => {
    it('should provide file path for any collected artifact', () => {
      fc.assert(
        fc.asyncProperty(
          fc.stringMatching(/^[a-zA-Z0-9_-]{1,20}$/),
          async (fileName) => {
            const artifactPath = path.join(tempDir, `app-${fileName}.apk`);
            fs.writeFileSync(artifactPath, Buffer.from('test'));

            const artifact = await collector.collectArtifactByPath(
              artifactPath,
              BuildVariant.Debug,
              BuildType.Debug
            );

            // Verify file path is available and correct
            expect(artifact.filePath).toBeDefined();
            expect(artifact.filePath).toBe(artifactPath);
            expect(fs.existsSync(artifact.filePath)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should provide file size for any collected artifact', () => {
      fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10000000 }),
          async (fileSize) => {
            const artifactPath = path.join(tempDir, 'app-debug.apk');
            const buffer = Buffer.alloc(fileSize);
            fs.writeFileSync(artifactPath, buffer);

            const artifact = await collector.collectArtifactByPath(
              artifactPath,
              BuildVariant.Debug,
              BuildType.Debug
            );

            // Verify file size is available and correct
            expect(artifact.fileSize).toBeDefined();
            expect(artifact.fileSize).toBe(fileSize);
            expect(artifact.fileSize).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should provide checksum for any collected artifact', () => {
      fc.assert(
        fc.asyncProperty(
          fc.uint8Array({ minLength: 1, maxLength: 10000 }),
          async (buffer) => {
            const artifactPath = path.join(tempDir, 'app-debug.apk');
            fs.writeFileSync(artifactPath, buffer);

            const artifact = await collector.collectArtifactByPath(
              artifactPath,
              BuildVariant.Debug,
              BuildType.Debug
            );

            // Verify checksum is available and valid
            expect(artifact.checksum).toBeDefined();
            expect(typeof artifact.checksum).toBe('string');
            expect(artifact.checksum).toMatch(/^[a-f0-9]{64}$/); // SHA-256
            expect(artifact.checksum.length).toBe(64);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should provide consistent metadata for same artifact', () => {
      fc.assert(
        fc.asyncProperty(
          fc.uint8Array({ minLength: 100, maxLength: 100000 }),
          async (buffer) => {
            const artifactPath = path.join(tempDir, 'app-debug.apk');
            fs.writeFileSync(artifactPath, buffer);

            const artifact1 = await collector.collectArtifactByPath(
              artifactPath,
              BuildVariant.Debug,
              BuildType.Debug
            );

            // Verify metadata is consistent
            expect(artifact1.filePath).toBe(artifactPath);
            expect(artifact1.fileSize).toBe(buffer.length);
            expect(artifact1.checksum).toMatch(/^[a-f0-9]{64}$/);

            // Verify checksum is deterministic
            const artifact2 = await collector.collectArtifactByPath(
              artifactPath,
              BuildVariant.Debug,
              BuildType.Debug
            );
            expect(artifact2.checksum).toBe(artifact1.checksum);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should provide complete artifact information for all variants', () => {
      fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.constant(BuildVariant.Debug),
            fc.constant(BuildVariant.Release),
            fc.constant(BuildVariant.AAB)
          ),
          async (variant) => {
            const fileName =
              variant === BuildVariant.AAB
                ? 'app-release.aab'
                : variant === BuildVariant.Debug
                  ? 'app-debug.apk'
                  : 'app-release.apk';

            const artifactPath = path.join(tempDir, fileName);
            fs.writeFileSync(artifactPath, Buffer.from('test content'));

            const buildType = variant === BuildVariant.Debug ? BuildType.Debug : BuildType.Release;

            const artifact = await collector.collectArtifactByPath(
              artifactPath,
              variant,
              buildType
            );

            // Verify all information is available
            expect(artifact.filePath).toBeDefined();
            expect(artifact.fileSize).toBeGreaterThan(0);
            expect(artifact.checksum).toBeDefined();
            expect(artifact.checksum).toMatch(/^[a-f0-9]{64}$/);

            // Verify variant-specific information
            expect(artifact.variant).toBe(variant);
            expect(artifact.type).toBe(variant === BuildVariant.AAB ? 'aab' : 'apk');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Checksum Determinism', () => {
    it('should produce identical checksums for identical content', () => {
      fc.assert(
        fc.asyncProperty(
          fc.uint8Array({ minLength: 1, maxLength: 100000 }),
          async (buffer) => {
            const path1 = path.join(tempDir, 'test1.apk');
            const path2 = path.join(tempDir, 'test2.apk');

            fs.writeFileSync(path1, buffer);
            fs.writeFileSync(path2, buffer);

            const checksum1 = await collector.calculateSHA256(path1);
            const checksum2 = await collector.calculateSHA256(path2);

            expect(checksum1).toBe(checksum2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce different checksums for different content', () => {
      fc.assert(
        fc.asyncProperty(
          fc.tuple(
            fc.uint8Array({ minLength: 1, maxLength: 100000 }),
            fc.uint8Array({ minLength: 1, maxLength: 100000 })
          ),
          async ([buffer1, buffer2]) => {
            // Skip if buffers are identical
            if (Buffer.compare(buffer1, buffer2) === 0) {
              return;
            }

            const path1 = path.join(tempDir, 'test1.apk');
            const path2 = path.join(tempDir, 'test2.apk');

            fs.writeFileSync(path1, buffer1);
            fs.writeFileSync(path2, buffer2);

            const checksum1 = await collector.calculateSHA256(path1);
            const checksum2 = await collector.calculateSHA256(path2);

            expect(checksum1).not.toBe(checksum2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
