import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ArtifactStorageManager, createArtifactStorageManager } from './artifact-storage-manager';
import { BuildVariant, BuildType } from '../types/android-build';

describe('ArtifactStorageManager', () => {
  let tempDir: string;
  let manager: ArtifactStorageManager;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'storage-manager-test-'));
    manager = new ArtifactStorageManager(tempDir);
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('getStorageDirectory', () => {
    it('should return correct storage directory for debug variant', () => {
      const timestamp = new Date('2024-01-15T10:30:45');
      const storageDir = manager.getStorageDirectory(BuildVariant.Debug, timestamp);

      expect(storageDir).toContain('debug');
      expect(storageDir).toContain('2024-01-15_10-30-45');
    });

    it('should return correct storage directory for release variant', () => {
      const timestamp = new Date('2024-01-15T14:30:45');
      const storageDir = manager.getStorageDirectory(BuildVariant.Release, timestamp);

      expect(storageDir).toContain('release');
      expect(storageDir).toContain('2024-01-15_14-30-45');
    });
  });

  describe('storeArtifact', () => {
    it('should store artifact in correct directory', async () => {
      const artifactPath = path.join(tempDir, 'app-debug.apk');
      fs.writeFileSync(artifactPath, Buffer.from('test apk content'));

      const artifact = {
        id: 'artifact-1',
        type: 'apk' as const,
        variant: BuildVariant.Debug,
        buildType: BuildType.Debug,
        filePath: artifactPath,
        fileName: 'app-debug.apk',
        fileSize: 16,
        checksum: 'abc123',
        timestamp: new Date('2024-01-15T10:30:45'),
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

      expect(fs.existsSync(storedPath)).toBe(true);
      expect(storedPath).toContain('debug');
      expect(storedPath).toContain('app-debug.apk');
    });

    it('should throw error if artifact file does not exist', async () => {
      const artifact = {
        id: 'artifact-1',
        type: 'apk' as const,
        variant: BuildVariant.Debug,
        buildType: BuildType.Debug,
        filePath: '/non/existent/path.apk',
        fileName: 'app-debug.apk',
        fileSize: 16,
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

      await expect(manager.storeArtifact(artifact)).rejects.toThrow('Artifact file not found');
    });
  });

  describe('getArtifactsByVariant', () => {
    it('should return empty array if no artifacts exist', async () => {
      const artifacts = await manager.getArtifactsByVariant(BuildVariant.Debug);
      expect(artifacts).toEqual([]);
    });
  });

  describe('getStorageSize', () => {
    it('should return zero if no artifacts exist', async () => {
      const size = await manager.getStorageSize(BuildVariant.Debug);
      expect(size).toBe(0);
    });
  });

  describe('createArtifactStorageManager', () => {
    it('should create a new ArtifactStorageManager instance', () => {
      const instance = createArtifactStorageManager(tempDir);
      expect(instance).toBeInstanceOf(ArtifactStorageManager);
    });
  });
});
