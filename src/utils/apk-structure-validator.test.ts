import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createAPKStructureValidator } from './apk-structure-validator';

describe('APKStructureValidator', () => {
  let tempDir: string;
  const validator = createAPKStructureValidator();

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apk-validator-'));
  });

  afterAll(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  describe('validateAPKStructure', () => {
    it('should fail when APK file does not exist', async () => {
      const result = await validator.validateAPKStructure('/nonexistent/file.apk');
      expect(result.overallStatus).toBe('fail');
      expect(result.checks.some(c => c.name === 'File Existence' && c.status === 'fail')).toBe(true);
    });

    it('should fail when APK file is empty', async () => {
      const emptyApkPath = path.join(tempDir, 'empty.apk');
      fs.writeFileSync(emptyApkPath, '');

      const result = await validator.validateAPKStructure(emptyApkPath);
      expect(result.overallStatus).toBe('fail');
      expect(result.checks.some(c => c.name === 'File Size' && c.status === 'fail')).toBe(true);
    });

    it('should fail when APK has invalid ZIP signature', async () => {
      const invalidApkPath = path.join(tempDir, 'invalid.apk');
      fs.writeFileSync(invalidApkPath, 'This is not a ZIP file');

      const result = await validator.validateAPKStructure(invalidApkPath);
      expect(result.overallStatus).toBe('fail');
      expect(result.checks.some(c => c.name === 'ZIP Structure' && c.status === 'fail')).toBe(true);
    });

    it('should pass when APK has valid ZIP structure', async () => {
      const validApkPath = path.join(tempDir, 'valid.apk');
      // Create a minimal valid ZIP file with correct signature
      const zipSignature = Buffer.from([0x50, 0x4b, 0x03, 0x04]); // PK\x03\x04
      fs.writeFileSync(validApkPath, zipSignature);

      const result = await validator.validateAPKStructure(validApkPath);
      expect(result.checks.some(c => c.name === 'ZIP Structure' && c.status === 'pass')).toBe(true);
    });

    it('should include all verification checks in result', async () => {
      const validApkPath = path.join(tempDir, 'valid.apk');
      const zipSignature = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
      fs.writeFileSync(validApkPath, zipSignature);

      const result = await validator.validateAPKStructure(validApkPath);
      expect(result.checks.length).toBeGreaterThan(0);
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.artifactPath).toBe(validApkPath);
    });

    it('should have warning status when some checks warn', async () => {
      const validApkPath = path.join(tempDir, 'valid.apk');
      const zipSignature = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
      fs.writeFileSync(validApkPath, zipSignature);

      const result = await validator.validateAPKStructure(validApkPath);
      // A minimal ZIP without proper structure should have warnings
      const hasWarnings = result.checks.some(c => c.status === 'warning');
      if (hasWarnings) {
        expect(result.overallStatus).toMatch(/warning|fail/);
      }
    });

    it('should handle errors gracefully', async () => {
      // Create a file that exists but cannot be read properly
      const problematicPath = path.join(tempDir, 'problematic.apk');
      fs.writeFileSync(problematicPath, 'test');

      const result = await validator.validateAPKStructure(problematicPath);
      expect(result.checks.length).toBeGreaterThan(0);
      expect(result.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('checkFileExists', () => {
    it('should detect non-existent files', async () => {
      const result = await validator.validateAPKStructure('/nonexistent/path/file.apk');
      const fileCheck = result.checks.find(c => c.name === 'File Existence');
      expect(fileCheck?.status).toBe('fail');
    });

    it('should detect existing files', async () => {
      const testFile = path.join(tempDir, 'test.apk');
      fs.writeFileSync(testFile, Buffer.from([0x50, 0x4b, 0x03, 0x04]));

      const result = await validator.validateAPKStructure(testFile);
      const fileCheck = result.checks.find(c => c.name === 'File Existence');
      expect(fileCheck?.status).toBe('pass');
    });
  });

  describe('checkFileNotEmpty', () => {
    it('should fail for empty files', async () => {
      const emptyFile = path.join(tempDir, 'empty.apk');
      fs.writeFileSync(emptyFile, '');

      const result = await validator.validateAPKStructure(emptyFile);
      const sizeCheck = result.checks.find(c => c.name === 'File Size');
      expect(sizeCheck?.status).toBe('fail');
    });

    it('should pass for non-empty files', async () => {
      const nonEmptyFile = path.join(tempDir, 'nonempty.apk');
      fs.writeFileSync(nonEmptyFile, Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00]));

      const result = await validator.validateAPKStructure(nonEmptyFile);
      const sizeCheck = result.checks.find(c => c.name === 'File Size');
      expect(sizeCheck?.status).toBe('pass');
    });
  });

  describe('checkValidZIPStructure', () => {
    it('should detect invalid ZIP signature', async () => {
      const invalidZip = path.join(tempDir, 'invalid_zip.apk');
      fs.writeFileSync(invalidZip, 'INVALID_ZIP_CONTENT');

      const result = await validator.validateAPKStructure(invalidZip);
      const zipCheck = result.checks.find(c => c.name === 'ZIP Structure');
      expect(zipCheck?.status).toBe('fail');
    });

    it('should detect valid ZIP signature', async () => {
      const validZip = path.join(tempDir, 'valid_zip.apk');
      fs.writeFileSync(validZip, Buffer.from([0x50, 0x4b, 0x03, 0x04]));

      const result = await validator.validateAPKStructure(validZip);
      const zipCheck = result.checks.find(c => c.name === 'ZIP Structure');
      expect(zipCheck?.status).toBe('pass');
    });
  });

  describe('verification result structure', () => {
    it('should return valid VerificationResult structure', async () => {
      const testFile = path.join(tempDir, 'test.apk');
      fs.writeFileSync(testFile, Buffer.from([0x50, 0x4b, 0x03, 0x04]));

      const result = await validator.validateAPKStructure(testFile);

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

      const result = await validator.validateAPKStructure(testFile);

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
      const result = await validator.validateAPKStructure('/root/restricted/file.apk');
      expect(result.checks.length).toBeGreaterThan(0);
      expect(result.overallStatus).toBe('fail');
    });

    it('should not throw exceptions', async () => {
      expect(async () => {
        await validator.validateAPKStructure('/nonexistent/file.apk');
      }).not.toThrow();
    });
  });
});
