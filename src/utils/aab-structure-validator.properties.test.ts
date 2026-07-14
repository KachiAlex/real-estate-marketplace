import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createAABStructureValidator } from './aab-structure-validator';

describe('AABStructureValidator - Property-Based Tests', () => {
  let tempDir: string;
  const validator = createAABStructureValidator();

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aab-pbt-'));
  });

  afterAll(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  /**
   * Property 88: Build Output Existence Verification
   * For any completed build, the build system must verify that the AAB file exists and is not empty.
   *
   * Validates: Requirements 3.4, 6.1
   */
  describe('Property 88: Build Output Existence Verification', () => {
    it('should verify AAB file existence and non-empty status', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 1000 }),
          async (fileSize: number) => {
            const aabPath = path.join(tempDir, `test_${Date.now()}_${Math.random()}.aab`);

            try {
              // Create a valid ZIP file with specified size
              const zipSignature = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
              const padding = Buffer.alloc(Math.max(0, fileSize - 4), 0);
              fs.writeFileSync(aabPath, Buffer.concat([zipSignature, padding]));

              const result = await validator.validateAABStructure(aabPath);

              // Verify that file existence check passed
              const fileExistenceCheck = result.checks.find(c => c.name === 'File Existence');
              expect(fileExistenceCheck?.status).toBe('pass');

              // Verify that file size check passed
              const fileSizeCheck = result.checks.find(c => c.name === 'File Size');
              expect(fileSizeCheck?.status).toBe('pass');

              // Verify that result includes artifact path
              expect(result.artifactPath).toBe(aabPath);
            } finally {
              if (fs.existsSync(aabPath)) {
                fs.unlinkSync(aabPath);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should fail for non-existent AAB files', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('\0')),
          async (filename: string) => {
            const aabPath = path.join(tempDir, `nonexistent_${filename}.aab`);

            const result = await validator.validateAABStructure(aabPath);

            // Should have failed file existence check
            const fileExistenceCheck = result.checks.find(c => c.name === 'File Existence');
            expect(fileExistenceCheck?.status).toBe('fail');
            expect(result.overallStatus).toBe('fail');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should fail for empty AAB files', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          async (filename: string) => {
            const aabPath = path.join(tempDir, `empty_${filename}.aab`);

            try {
              // Create empty file
              fs.writeFileSync(aabPath, '');

              const result = await validator.validateAABStructure(aabPath);

              // Should have failed file size check
              const fileSizeCheck = result.checks.find(c => c.name === 'File Size');
              expect(fileSizeCheck?.status).toBe('fail');
              expect(result.overallStatus).toBe('fail');
            } finally {
              if (fs.existsSync(aabPath)) {
                fs.unlinkSync(aabPath);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional property: Bundle structure validation
   * For any AAB validation, the result must verify bundle components
   */
  describe('Bundle Structure Validation', () => {
    it('should verify bundle components are checked', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }),
          async (numEntries: number) => {
            const aabPath = path.join(tempDir, `bundle_${Date.now()}_${Math.random()}.aab`);

            try {
              // Create a valid ZIP file with ZIP signature
              const zipSignature = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
              fs.writeFileSync(aabPath, zipSignature);

              const result = await validator.validateAABStructure(aabPath);

              // Verify that checks were performed
              expect(result.checks.length).toBeGreaterThan(0);

              // Verify that bundle components check was performed
              const bundleCheck = result.checks.find(c => c.name === 'Bundle Components');
              expect(bundleCheck).toBeDefined();

              // Verify that base module check was performed
              const baseModuleCheck = result.checks.find(c => c.name === 'Base Module');
              expect(baseModuleCheck).toBeDefined();

              // Verify that BundleConfig check was performed
              const bundleConfigCheck = result.checks.find(c => c.name === 'BundleConfig.pb');
              expect(bundleConfigCheck).toBeDefined();
            } finally {
              if (fs.existsSync(aabPath)) {
                fs.unlinkSync(aabPath);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should verify all required checks are performed', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          async (filename: string) => {
            const aabPath = path.join(tempDir, `checks_${filename}.aab`);

            try {
              // Create a valid ZIP file
              const zipSignature = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
              fs.writeFileSync(aabPath, zipSignature);

              const result = await validator.validateAABStructure(aabPath);

              // Verify that all expected checks are present
              const checkNames = result.checks.map(c => c.name);
              expect(checkNames).toContain('File Existence');
              expect(checkNames).toContain('File Size');
              expect(checkNames).toContain('ZIP Structure');
              expect(checkNames).toContain('Bundle Components');
              expect(checkNames).toContain('BundleConfig.pb');
              expect(checkNames).toContain('Base Module');
              expect(checkNames).toContain('META-INF Directory');
            } finally {
              if (fs.existsSync(aabPath)) {
                fs.unlinkSync(aabPath);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should report verification results consistently', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 1000 }),
          async (fileSize: number) => {
            const aabPath = path.join(tempDir, `consistent_${Date.now()}_${Math.random()}.aab`);

            try {
              // Create a valid ZIP file
              const zipSignature = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
              const padding = Buffer.alloc(Math.max(0, fileSize - 4), 0);
              fs.writeFileSync(aabPath, Buffer.concat([zipSignature, padding]));

              // Run validation twice
              const result1 = await validator.validateAABStructure(aabPath);
              const result2 = await validator.validateAABStructure(aabPath);

              // Results should be consistent
              expect(result1.overallStatus).toBe(result2.overallStatus);
              expect(result1.checks.length).toBe(result2.checks.length);

              // All checks should have same status
              for (let i = 0; i < result1.checks.length; i++) {
                expect(result1.checks[i].status).toBe(result2.checks[i].status);
              }
            } finally {
              if (fs.existsSync(aabPath)) {
                fs.unlinkSync(aabPath);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional property: Verification result structure
   * For any AAB validation, the result must have valid structure and all required fields
   */
  describe('Verification Result Structure', () => {
    it('should always return valid VerificationResult structure', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          async (filename: string) => {
            const aabPath = path.join(tempDir, `structure_${filename}.aab`);

            try {
              // Create a valid ZIP file
              const zipSignature = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
              fs.writeFileSync(aabPath, zipSignature);

              const result = await validator.validateAABStructure(aabPath);

              // Verify structure
              expect(result).toHaveProperty('artifactPath');
              expect(result).toHaveProperty('overallStatus');
              expect(result).toHaveProperty('checks');
              expect(result).toHaveProperty('timestamp');
              expect(result).toHaveProperty('duration');

              // Verify types
              expect(typeof result.artifactPath).toBe('string');
              expect(['pass', 'fail', 'warning']).toContain(result.overallStatus);
              expect(Array.isArray(result.checks)).toBe(true);
              expect(result.timestamp instanceof Date).toBe(true);
              expect(typeof result.duration).toBe('number');
              expect(result.duration).toBeGreaterThanOrEqual(0);

              // Verify all checks have required properties
              for (const check of result.checks) {
                expect(check).toHaveProperty('name');
                expect(check).toHaveProperty('category');
                expect(check).toHaveProperty('status');
                expect(check).toHaveProperty('message');
                expect(typeof check.name).toBe('string');
                expect(typeof check.message).toBe('string');
                expect(['structure', 'signature', 'manifest', 'resources', 'code']).toContain(
                  check.category
                );
                expect(['pass', 'fail', 'warning']).toContain(check.status);
              }
            } finally {
              if (fs.existsSync(aabPath)) {
                fs.unlinkSync(aabPath);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional property: Error handling
   * For any invalid input, validation should not throw and should return valid result
   */
  describe('Error Handling', () => {
    it('should handle invalid paths without throwing', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes('\0')),
          async (invalidPath: string) => {
            expect(async () => {
              await validator.validateAABStructure(invalidPath);
            }).not.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return valid result for any input', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes('\0')),
          async (path: string) => {
            const result = await validator.validateAABStructure(path);

            // Should always return valid structure
            expect(result).toHaveProperty('artifactPath');
            expect(result).toHaveProperty('overallStatus');
            expect(result).toHaveProperty('checks');
            expect(result).toHaveProperty('timestamp');
            expect(result).toHaveProperty('duration');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
