import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createAABStructureValidator } from './aab-structure-validator';

describe('AABStructureValidator', () => {
  let tempDir: string;
  const validator = createAABStructureValidator();

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aab-validator-'));
  });

  afterAll(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  describe('validateAABStructure', () => {
    it('should fail when AAB file does not exist', async () => {
      const result = await validator.validateAABStructure('/nonexistent/file.aab');
      expect(result.overallStatus).toBe('fail');
      expect(result.checks.some(c => c.name === 'File Existence' && c.status === 'fail')).toBe(true);
    });

    it('should fail when AAB file is empty', async () => {
      const emptyAabPath = path.join(tempDir, 'empty.aab');
      fs.writeFileSync(emptyAabPath, '');

      const result = await validator.validateAABStructure(emptyAabPath);
      expect(result.overallStatus).toBe('fail');
      expect(result.checks.some(c => c.name === 'File Size' && c.status === 'fail')).toBe(true);
    });

    it('should fail when AAB has invalid ZIP signature', async () => {
      const invalidAabPath = path.join(tempDir, 'invalid.aab');
      fs.writeFileSync(invalidAabPath, 'This is not a ZIP file');

      const result = await validator.validateAABStructure(invalidAabPath);
      expect(result.overallStatus).toBe('fail');
      expect(result.checks.some(c => c.name === 'ZIP Structure' && c.status === 'fail')).toBe(true);
    });

    it('should pass when AAB has valid ZIP structure', async () => {
      const validAabPath = path.join(tempDir, 'valid.aab');
      // Create a minimal valid ZIP file with correct signature
      const zipSignature = Buffer.from([0x50, 0x4b, 0x03, 0x04]); // PK\x03\x04
      fs.writeFileSync(validAabPath, zipSignature);

      const result = await validator.validateAABStructure(validAabPath);
      expect(result.checks.some(c => c.name === 'ZIP Structure' && c.status === 'pass')).toBe(true);
    });

    it('should include all verification checks in result', async () => {
      const validAabPath = path.join(tempDir, 'valid.aab');
      const zipSignature = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
      fs.writeFileSync(validAabPath, zipSignature);

      const result = await validator.validateAABStructure(validAabPath);
      expect(result.checks.length).toBeGreaterThan(0);
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.artifactPath).toBe(validAabPath);
    });

    it('should have warning status when some checks warn', async () => {
      const validAabPath = path.join(tempDir, 'valid.aab');
      const zipSignature = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
      fs.writeFileSync(validAabPath, zipSignature);

      const result = await validator.validateAABStructure(validAabPath);
      // A minimal ZIP without proper structure should have warnings
      const hasWarnings = result.checks.some(c => c.status === 'warning');
      if (hasWarnings) {
        expect(result.overallStatus).toMatch(/warning|fail/);
      }
    });

    it('should handle errors gracefully', async () => {
      // Create a file that exists but cannot be read properly
      const problematicPath = path.join(tempDir, 'problematic.aab');
      fs.writeFileSync(problematicPath, 'test');

      const result = await validator.validateAABStructure(problematicPath);
      expect(result.checks.length).toBeGreaterThan(0);
      expect(result.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('checkFileExists', () => {
    it('should detect non-existent files', async () => {
      const result = await validator.validateAABStructure('/nonexistent/path/file.aab');
      const fileCheck = result.checks.find(c => c.name === 'File Existence');
      expect(fileCheck?.status).toBe('fail');
    });

    it('should detect existing files', async () => {
      const testFile = path.join(tempDir, 'test.aab');
      fs.writeFileSync(testFile, Buffer.from([0x50, 0x4b, 0x03, 0x04]));

      const result = await validator.validateAABStructure(testFile);
      const fileCheck = result.checks.find(c => c.name === 'File Existence');
      expect(fileCheck?.status).toBe('pass');
    });
  });

  describe('checkFileNotEmpty', () => {
    it('should fail for empty files', async () => {
      const emptyFile = path.join(tempDir, 'empty.aab');
      fs.writeFileSync(emptyFile, '');

      const result = await validator.validateAABStructure(emptyFile);
      const sizeCheck = result.checks.find(c => c.name === 'File Size');
      expect(sizeCheck?.status).toBe('fail');
    });

    it('should pass for non-empty files', async () => {
      const nonEmptyFile = path.join(tempDir, 'nonempty.aab');
      fs.writeFileSync(nonEmptyFile, Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00]));

      const result = await validator.validateAABStructure(nonEmptyFile);
      const sizeCheck = result.checks.find(c => c.name === 'File Size');
      expect(sizeCheck?.status).toBe('pass');
    });
  });

  describe('checkValidZIPStructure', () => {
    it('should detect invalid ZIP signature', async () => {
      const invalidZip = path.join(tempDir, 'invalid_zip.aab');
      fs.writeFileSync(invalidZip, 'INVALID_ZIP_CONTENT');

      const result = await validator.validateAABStructure(invalidZip);
      const zipCheck = result.checks.find(c => c.name === 'ZIP Structure');
      expect(zipCheck?.status).toBe('fail');
    });

    it('should detect valid ZIP signature', async () => {
      const validZip = path.join(tempDir, 'valid_zip.aab');
      fs.writeFileSync(validZip, Buffer.from([0x50, 0x4b, 0x03, 0x04]));

      const result = await validator.validateAABStructure(validZip);
      const zipCheck = result.checks.find(c => c.name === 'ZIP Structure');
      expect(zipCheck?.status).toBe('pass');
    });
  });

  describe('verification result structure', () => {
    it('should return valid VerificationResult structure', async () => {
      const testFile = path.join(tempDir, 'test.aab');
      fs.writeFileSync(testFile, Buffer.from([0x50, 0x4b, 0x03, 0x04]));

      const result = await validator.validateAABStructure(testFile);

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
      const testFile = path.join(tempDir, 'test.aab');
      fs.writeFileSync(testFile, Buffer.from([0x50, 0x4b, 0x03, 0x04]));

      const result = await validator.validateAABStructure(testFile);

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
      const result = await validator.validateAABStructure('/root/restricted/file.aab');
      expect(result.checks.length).toBeGreaterThan(0);
      expect(result.overallStatus).toBe('fail');
    });

    it('should not throw exceptions', async () => {
      expect(async () => {
        await validator.validateAABStructure('/nonexistent/file.aab');
      }).not.toThrow();
    });
  });
});
