import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ArtifactStorageManager } from './artifact-storage-manager';
import { BuildVariant, BuildType } from '../types/android-build';

describe('ArtifactStorageManager - Property-Based Tests', () => {
  let tempDir: string;
  let manager: ArtifactStorageManager;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'storage-pbt-'));
    manager = new ArtifactStorageManager(tempDir);
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
          fc.oneof(
            fc.constant(BuildVariant.Debug),
            fc.constant(BuildVariant.Release),
            fc.constant(BuildVariant.AAB)
          ),
          async (fileName, variant) => {
            const artifactPath = path.join(tempDir, `app-${fileName}.apk`);
            fs.writeFileSync(artifactPath, Buffer.from('test content'));

            const artifact = {
              id: 'artifact-1',
              type: 'apk' as const,
              variant: variant,
              buildType: variant === BuildVariant.Debug ? BuildType.Debug : BuildType.Release,
              filePath: artifactPath,
              fileName: `app-${fileName}.apk`,
              fileSize: 12,
              checksum: 'abc123',
              timestamp: new Date(),
              buildDuration: 60,
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
                packageName: 'com.example.app',
                versionCode: 1,
                versionName: '1.0.0',
                minSdkVersion: 21,
                targetSdkVersion: 33,
                permissions: [],
                activities: [],
                services: [],
                receivers: [],
                providers: [],
              },
              metadata: {},
            };

            const storedPath = await manager.storeArtifact(artifact);

            // Verify artifact is stored with clear naming
            expect(fs.existsSync(storedPath)).toBe(true);
            expect(storedPath).toContain(variant === BuildVariant.Debug ? 'debug' : 'release');
            expect(storedPath).toContain(`app-${fileName}.apk`);
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
            const artifactPath = path.join(tempDir, 'app.apk');
            fs.writeFileSync(artifactPath, Buffer.from('test'));

            const timestamp = new Date('2024-01-15T10:30:45');
            const artifact = {
              id: 'artifact-1',
              type: 'apk' as const,
              variant: variant,
              buildType: variant === BuildVariant.Debug ? BuildType.Debug : BuildType.Release,
              filePath: artifactPath,
              fileName: 'app.apk',
              fileSize: 4,
              checksum: 'abc123',
              timestamp: timestamp,
              buildDuration: 60,
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
                packageName: 'com.example.app',
                versionCode: 1,
                versionName: '1.0.0',
                minSdkVersion: 21,
                targetSdkVersion: 33,
                permissions: [],
                activities: [],
                services: [],
                receivers: [],
                providers: [],
              },
              metadata: {},
            };

            const storedPath = await manager.storeArtifact(artifact);

            // Verify organization by variant and timestamp
            expect(storedPath).toContain(variant === BuildVariant.Debug ? 'debug' : 'release');
            expect(storedPath).toContain('2024-01-15_10-30-45');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain consistent storage structure across multiple artifacts', () => {
      fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10 }),
          async (numArtifacts) => {
            const artifacts = [];

            for (let i = 0; i < numArtifacts; i++) {
              const artifactPath = path.join(tempDir, `app-${i}.apk`);
              fs.writeFileSync(artifactPath, Buffer.from('test'));

              artifacts.push({
                id: `artifact-${i}`,
                type: 'apk' as const,
                variant: BuildVariant.Debug,
                buildType: BuildType.Debug,
                filePath: artifactPath,
                fileName: `app-${i}.apk`,
                fileSize: 4,
                checksum: 'abc123',
                timestamp: new Date(),
                buildDuration: 60,
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
                  packageName: 'com.example.app',
                  versionCode: 1,
                  versionName: '1.0.0',
                  minSdkVersion: 21,
                  targetSdkVersion: 33,
                  permissions: [],
                  activities: [],
                  services: [],
                  receivers: [],
                  providers: [],
                },
                metadata: {},
              });
            }

            const storedPaths = await manager.storeArtifacts(artifacts);

            // Verify all artifacts are stored
            expect(storedPaths.length).toBe(numArtifacts);

            // Verify all paths follow naming convention
            for (const storedPath of storedPaths) {
              expect(storedPath).toContain('debug');
              expect(fs.existsSync(storedPath)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Storage Directory Creation', () => {
    it('should create directory structure automatically', () => {
      fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.constant(BuildVariant.Debug),
            fc.constant(BuildVariant.Release),
            fc.constant(BuildVariant.AAB)
          ),
          async (variant) => {
            const artifactPath = path.join(tempDir, 'app.apk');
            fs.writeFileSync(artifactPath, Buffer.from('test'));

            const artifact = {
              id: 'artifact-1',
              type: 'apk' as const,
              variant: variant,
              buildType: variant === BuildVariant.Debug ? BuildType.Debug : BuildType.Release,
              filePath: artifactPath,
              fileName: 'app.apk',
              fileSize: 4,
              checksum: 'abc123',
              timestamp: new Date(),
              buildDuration: 60,
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
                packageName: 'com.example.app',
                versionCode: 1,
                versionName: '1.0.0',
                minSdkVersion: 21,
                targetSdkVersion: 33,
                permissions: [],
                activities: [],
                services: [],
                receivers: [],
                providers: [],
              },
              metadata: {},
            };

            const storedPath = await manager.storeArtifact(artifact);
            const directory = path.dirname(storedPath);

            // Verify directory was created
            expect(fs.existsSync(directory)).toBe(true);
            expect(fs.statSync(directory).isDirectory()).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Storage Retrieval', () => {
    it('should retrieve stored artifacts by variant', () => {
      fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.constant(BuildVariant.Debug),
            fc.constant(BuildVariant.Release)
          ),
          async (variant) => {
            const artifactPath = path.join(tempDir, 'app.apk');
            fs.writeFileSync(artifactPath, Buffer.from('test'));

            const artifact = {
              id: 'artifact-1',
              type: 'apk' as const,
              variant: variant,
              buildType: variant === BuildVariant.Debug ? BuildType.Debug : BuildType.Release,
              filePath: artifactPath,
              fileName: 'app.apk',
              fileSize: 4,
              checksum: 'abc123',
              timestamp: new Date(),
              buildDuration: 60,
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
                packageName: 'com.example.app',
                versionCode: 1,
                versionName: '1.0.0',
                minSdkVersion: 21,
                targetSdkVersion: 33,
                permissions: [],
                activities: [],
                services: [],
                receivers: [],
                providers: [],
              },
              metadata: {},
            };

            await manager.storeArtifact(artifact);
            const retrievedArtifacts = await manager.getArtifactsByVariant(variant);

            // Verify artifacts can be retrieved
            expect(retrievedArtifacts.length).toBeGreaterThan(0);
            expect(retrievedArtifacts[0].variant).toBe(variant);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
