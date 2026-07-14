import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ArtifactCollector, createArtifactCollector } from './artifact-collector';
import { BuildVariant, BuildType } from '../types/android-build';

describe('ArtifactCollector', () => {
  let tempDir: string;
  let collector: ArtifactCollector;

  beforeEach(() => {
    // Create a temporary directory for test artifacts
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'artifact-collector-test-'));
    collector = new ArtifactCollector(tempDir);
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('collectArtifactByPath', () => {
    it('should collect a debug APK artifact', async () => {
      // Create a test APK file
      const apkPath = path.join(tempDir, 'app-debug.apk');
      fs.writeFileSync(apkPath, Buffer.from('test apk content'));

      const artifact = await collector.collectArtifactByPath(
        apkPath,
        BuildVariant.Debug,
        BuildType.Debug
      );

      expect(artifact).toBeDefined();
      expect(artifact.fileName).toBe('app-debug.apk');
      expect(artifact.type).toBe('apk');
      expect(artifact.variant).toBe(BuildVariant.Debug);
      expect(artifact.buildType).toBe(BuildType.Debug);
      expect(artifact.fileSize).toBeGreaterThan(0);
      expect(artifact.checksum).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex
      expect(artifact.id).toMatch(/^artifact-/);
    });

    it('should collect a release APK artifact', async () => {
      const apkPath = path.join(tempDir, 'app-release.apk');
      fs.writeFileSync(apkPath, Buffer.from('test release apk'));

      const artifact = await collector.collectArtifactByPath(
        apkPath,
        BuildVariant.Release,
        BuildType.Release
      );

      expect(artifact.type).toBe('apk');
      expect(artifact.buildType).toBe(BuildType.Release);
      expect(artifact.fileSize).toBeGreaterThan(0);
    });

    it('should collect an AAB artifact', async () => {
      const aabPath = path.join(tempDir, 'app-release.aab');
      fs.writeFileSync(aabPath, Buffer.from('test aab content'));

      const artifact = await collector.collectArtifactByPath(
        aabPath,
        BuildVariant.AAB,
        BuildType.Release
      );

      expect(artifact.type).toBe('aab');
      expect(artifact.variant).toBe(BuildVariant.AAB);
      expect(artifact.fileSize).toBeGreaterThan(0);
    });

    it('should throw error if artifact file does not exist', async () => {
      const nonExistentPath = path.join(tempDir, 'non-existent.apk');

      await expect(
        collector.collectArtifactByPath(nonExistentPath, BuildVariant.Debug, BuildType.Debug)
      ).rejects.toThrow('Artifact file not found');
    });

    it('should throw error if artifact file is empty', async () => {
      const emptyPath = path.join(tempDir, 'empty.apk');
      fs.writeFileSync(emptyPath, Buffer.from(''));

      await expect(
        collector.collectArtifactByPath(emptyPath, BuildVariant.Debug, BuildType.Debug)
      ).rejects.toThrow('Artifact file is empty');
    });

    it('should generate unique artifact IDs', async () => {
      const apkPath1 = path.join(tempDir, 'app-debug.apk');
      const apkPath2 = path.join(tempDir, 'app-release.apk');
      fs.writeFileSync(apkPath1, Buffer.from('content1'));
      fs.writeFileSync(apkPath2, Buffer.from('content2'));

      const artifact1 = await collector.collectArtifactByPath(
        apkPath1,
        BuildVariant.Debug,
        BuildType.Debug
      );
      const artifact2 = await collector.collectArtifactByPath(
        apkPath2,
        BuildVariant.Release,
        BuildType.Release
      );

      expect(artifact1.id).not.toBe(artifact2.id);
    });
  });

  describe('calculateSHA256', () => {
    it('should calculate correct SHA-256 checksum', async () => {
      const testPath = path.join(tempDir, 'test.txt');
      const content = 'test content';
      fs.writeFileSync(testPath, content);

      const checksum = await collector.calculateSHA256(testPath);

      // Verify it's a valid SHA-256 hex string (64 characters)
      expect(checksum).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should produce consistent checksums for same content', async () => {
      const testPath = path.join(tempDir, 'test.txt');
      fs.writeFileSync(testPath, 'consistent content');

      const checksum1 = await collector.calculateSHA256(testPath);
      const checksum2 = await collector.calculateSHA256(testPath);

      expect(checksum1).toBe(checksum2);
    });

    it('should produce different checksums for different content', async () => {
      const path1 = path.join(tempDir, 'test1.txt');
      const path2 = path.join(tempDir, 'test2.txt');
      fs.writeFileSync(path1, 'content1');
      fs.writeFileSync(path2, 'content2');

      const checksum1 = await collector.calculateSHA256(path1);
      const checksum2 = await collector.calculateSHA256(path2);

      expect(checksum1).not.toBe(checksum2);
    });

    it('should throw error for non-existent file', async () => {
      const nonExistentPath = path.join(tempDir, 'non-existent.txt');

      await expect(collector.calculateSHA256(nonExistentPath)).rejects.toThrow(
        'Failed to calculate checksum'
      );
    });
  });

  describe('collectArtifacts', () => {
    it('should throw error if no artifacts found', async () => {
      await expect(collector.collectArtifacts(BuildVariant.Debug)).rejects.toThrow(
        'No artifacts found'
      );
    });

    it('should collect debug APK when present', async () => {
      const apkPath = path.join(tempDir, 'app-debug.apk');
      fs.writeFileSync(apkPath, Buffer.from('debug apk'));

      const artifacts = await collector.collectArtifacts(BuildVariant.Debug);

      expect(artifacts.length).toBeGreaterThan(0);
      expect(artifacts[0].type).toBe('apk');
      expect(artifacts[0].buildType).toBe('debug');
    });

    it('should collect release APK when present', async () => {
      const apkPath = path.join(tempDir, 'app-release.apk');
      fs.writeFileSync(apkPath, Buffer.from('release apk'));

      const artifacts = await collector.collectArtifacts(BuildVariant.Release);

      expect(artifacts.length).toBeGreaterThan(0);
      expect(artifacts[0].type).toBe('apk');
      expect(artifacts[0].buildType).toBe('release');
    });

    it('should collect AAB when present', async () => {
      const aabPath = path.join(tempDir, 'app-release.aab');
      fs.writeFileSync(aabPath, Buffer.from('aab content'));

      const artifacts = await collector.collectArtifacts(BuildVariant.AAB);

      expect(artifacts.length).toBeGreaterThan(0);
      expect(artifacts[0].type).toBe('aab');
    });

    it('should skip empty artifact files', async () => {
      const apkPath = path.join(tempDir, 'app-debug.apk');
      fs.writeFileSync(apkPath, Buffer.from(''));

      await expect(collector.collectArtifacts(BuildVariant.Debug)).rejects.toThrow(
        'No artifacts found'
      );
    });
  });

  describe('createArtifactCollector', () => {
    it('should create a new ArtifactCollector instance', () => {
      const instance = createArtifactCollector(tempDir);

      expect(instance).toBeInstanceOf(ArtifactCollector);
    });
  });

  describe('artifact metadata', () => {
    it('should include complete metadata in collected artifact', async () => {
      const apkPath = path.join(tempDir, 'app-debug.apk');
      fs.writeFileSync(apkPath, Buffer.from('test content'));

      const artifact = await collector.collectArtifactByPath(
        apkPath,
        BuildVariant.Debug,
        BuildType.Debug
      );

      // Verify all required metadata fields are present
      expect(artifact.id).toBeDefined();
      expect(artifact.type).toBeDefined();
      expect(artifact.variant).toBeDefined();
      expect(artifact.buildType).toBeDefined();
      expect(artifact.filePath).toBeDefined();
      expect(artifact.fileName).toBeDefined();
      expect(artifact.fileSize).toBeDefined();
      expect(artifact.checksum).toBeDefined();
      expect(artifact.timestamp).toBeDefined();
      expect(artifact.signingInfo).toBeDefined();
      expect(artifact.manifestInfo).toBeDefined();
      expect(artifact.metadata).toBeDefined();
    });

    it('should set correct file size', async () => {
      const apkPath = path.join(tempDir, 'app-debug.apk');
      const content = Buffer.from('test content with specific size');
      fs.writeFileSync(apkPath, content);

      const artifact = await collector.collectArtifactByPath(
        apkPath,
        BuildVariant.Debug,
        BuildType.Debug
      );

      expect(artifact.fileSize).toBe(content.length);
    });

    it('should set correct timestamp', async () => {
      const apkPath = path.join(tempDir, 'app-debug.apk');
      fs.writeFileSync(apkPath, Buffer.from('test'));

      const beforeCollection = new Date();
      const artifact = await collector.collectArtifactByPath(
        apkPath,
        BuildVariant.Debug,
        BuildType.Debug
      );
      const afterCollection = new Date();

      expect(artifact.timestamp.getTime()).toBeGreaterThanOrEqual(beforeCollection.getTime());
      expect(artifact.timestamp.getTime()).toBeLessThanOrEqual(afterCollection.getTime());
    });
  });
});
