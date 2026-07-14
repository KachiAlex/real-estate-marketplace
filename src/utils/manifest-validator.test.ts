import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createManifestValidator } from './manifest-validator';

describe('ManifestValidator', () => {
  let tempDir: string;
  const validator = createManifestValidator();

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'manifest-validator-'));
  });

  afterAll(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  describe('validateManifest', () => {
    it('should fail when artifact file does not exist', async () => {
      const result = await validator.validateManifest('/nonexistent/file.apk');
      expect(result.overallStatus).toBe('fail');
      expect(result.checks.some(c => c.name === 'File Existence' && c.status === 'fail')).toBe(true);
    });

    it('should include all verification checks in result', async () => {
      const testFile = path.join(tempDir, 'test.apk');
      fs.writeFileSync(testFile, Buffer.from([0x50, 0x4b, 0x03, 0x04]));

      const result = await validator.validateManifest(testFile);
      expect(result.checks.length).toBeGreaterThan(0);
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.artifactPath).toBe(testFile);
    });

    it('should handle errors gracefully', async () => {
      const problematicPath = path.join(tempDir, 'problematic.apk');
      fs.writeFileSync(problematicPath, 'test');

      const result = await validator.validateManifest(problematicPath);
      expect(result.checks.length).toBeGreaterThan(0);
      expect(result.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('checkFileExists', () => {
    it('should detect non-existent files', async () => {
      const result = await validator.validateManifest('/nonexistent/path/file.apk');
      const fileCheck = result.checks.find(c => c.name === 'File Existence');
      expect(fileCheck?.status).toBe('fail');
    });

    it('should detect existing files', async () => {
      const testFile = path.join(tempDir, 'test.apk');
      fs.writeFileSync(testFile, Buffer.from([0x50, 0x4b, 0x03, 0x04]));

      const result = await validator.validateManifest(testFile);
      const fileCheck = result.checks.find(c => c.name === 'File Existence');
      expect(fileCheck?.status).toBe('pass');
    });
  });

  describe('verification result structure', () => {
    it('should return valid VerificationResult structure', async () => {
      const testFile = path.join(tempDir, 'test.apk');
      fs.writeFileSync(testFile, Buffer.from([0x50, 0x4b, 0x03, 0x04]));

      const result = await validator.validateManifest(testFile);

      expect(result).toHaveProperty('artifactPath');
      expect(result).toHaveProperty('overallStatus');
      expect(result).toHaveProperty('checks');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('duration');

      expect(typeof result.artifactPath).toBe('string');
      expect(['pass', 'fail', 'warning']).toContain(result.overallStatus);
      expect(Array.isArray(result.checks)).toBe(true);
      expect(result.timestamp instanceof Date).toBe(true);
      expect(typeof result.duration).toBe('number');
    });

    it('should have all checks with required properties', async () => {
      const testFile = path.join(tempDir, 'test.apk');
      fs.writeFileSync(testFile, Buffer.from([0x50, 0x4b, 0x03, 0x04]));

      const result = await validator.validateManifest(testFile);

      for (const check of result.checks) {
        expect(check).toHaveProperty('name');
        expect(check).toHaveProperty('category');
        expect(check).toHaveProperty('status');
        expect(check).toHaveProperty('message');

        expect(typeof check.name).toBe('string');
        expect(['structure', 'signature', 'manifest', 'resources', 'code']).toContain(check.category);
        expect(['pass', 'fail', 'warning']).toContain(check.status);
        expect(typeof check.message).toBe('string');
      }
    });
  });

  describe('error handling', () => {
    it('should handle file read errors gracefully', async () => {
      const result = await validator.validateManifest('/root/restricted/file.apk');
      expect(result.checks.length).toBeGreaterThan(0);
      expect(result.overallStatus).toBe('fail');
    });

    it('should not throw exceptions', async () => {
      expect(async () => {
        await validator.validateManifest('/nonexistent/file.apk');
      }).not.toThrow();
    });
  });

  describe('manifest checks', () => {
    it('should check for manifest extraction', async () => {
      const testFile = path.join(tempDir, 'test.apk');
      fs.writeFileSync(testFile, Buffer.from([0x50, 0x4b, 0x03, 0x04]));

      const result = await validator.validateManifest(testFile);
      const extractionCheck = result.checks.find(c => c.name === 'Manifest Extraction');
      expect(extractionCheck).toBeDefined();
      expect(['pass', 'fail', 'warning']).toContain(extractionCheck?.status);
    });

    it('should check for manifest well-formed status', async () => {
      const testFile = path.join(tempDir, 'test.apk');
      fs.writeFileSync(testFile, Buffer.from([0x50, 0x4b, 0x03, 0x04]));

      const result = await validator.validateManifest(testFile);
      const wellFormedCheck = result.checks.find(c => c.name === 'Manifest Well-Formed');
      expect(wellFormedCheck).toBeDefined();
      expect(['pass', 'fail', 'warning']).toContain(wellFormedCheck?.status);
    });

    it('should check for required fields', async () => {
      const testFile = path.join(tempDir, 'test.apk');
      fs.writeFileSync(testFile, Buffer.from([0x50, 0x4b, 0x03, 0x04]));

      const result = await validator.validateManifest(testFile);
      const fieldsCheck = result.checks.find(c => c.name === 'Required Fields');
      expect(fieldsCheck).toBeDefined();
      expect(['pass', 'fail', 'warning']).toContain(fieldsCheck?.status);
    });

    it('should check package name validity', async () => {
      const testFile = path.join(tempDir, 'test.apk');
      fs.writeFileSync(testFile, Buffer.from([0x50, 0x4b, 0x03, 0x04]));

      const result = await validator.validateManifest(testFile);
      const packageCheck = result.checks.find(c => c.name === 'Package Name');
      expect(packageCheck).toBeDefined();
      expect(['pass', 'fail', 'warning']).toContain(packageCheck?.status);
    });

    it('should check version information', async () => {
      const testFile = path.join(tempDir, 'test.apk');
      fs.writeFileSync(testFile, Buffer.from([0x50, 0x4b, 0x03, 0x04]));

      const result = await validator.validateManifest(testFile);
      const versionCheck = result.checks.find(c => c.name === 'Version Information');
      expect(versionCheck).toBeDefined();
      expect(['pass', 'fail', 'warning']).toContain(versionCheck?.status);
    });

    it('should check SDK versions', async () => {
      const testFile = path.join(tempDir, 'test.apk');
      fs.writeFileSync(testFile, Buffer.from([0x50, 0x4b, 0x03, 0x04]));

      const result = await validator.validateManifest(testFile);
      const sdkCheck = result.checks.find(c => c.name === 'SDK Versions');
      expect(sdkCheck).toBeDefined();
      expect(['pass', 'fail', 'warning']).toContain(sdkCheck?.status);
    });

    it('should check permissions', async () => {
      const testFile = path.join(tempDir, 'test.apk');
      fs.writeFileSync(testFile, Buffer.from([0x50, 0x4b, 0x03, 0x04]));

      const result = await validator.validateManifest(testFile);
      const permissionsCheck = result.checks.find(c => c.name === 'Permissions');
      expect(permissionsCheck).toBeDefined();
      expect(['pass', 'fail', 'warning']).toContain(permissionsCheck?.status);
    });

    it('should check components', async () => {
      const testFile = path.join(tempDir, 'test.apk');
      fs.writeFileSync(testFile, Buffer.from([0x50, 0x4b, 0x03, 0x04]));

      const result = await validator.validateManifest(testFile);
      const componentsCheck = result.checks.find(c => c.name === 'Components');
      expect(componentsCheck).toBeDefined();
      expect(['pass', 'fail', 'warning']).toContain(componentsCheck?.status);
    });

    it('should check for common mistakes', async () => {
      const testFile = path.join(tempDir, 'test.apk');
      fs.writeFileSync(testFile, Buffer.from([0x50, 0x4b, 0x03, 0x04]));

      const result = await validator.validateManifest(testFile);
      const mistakesCheck = result.checks.find(c => c.name === 'Common Mistakes');
      expect(mistakesCheck).toBeDefined();
      expect(['pass', 'fail', 'warning']).toContain(mistakesCheck?.status);
    });
  });
});
