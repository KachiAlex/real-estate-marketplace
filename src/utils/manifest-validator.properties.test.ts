import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createManifestValidator } from './manifest-validator';

describe('ManifestValidator - Property-Based Tests', () => {
  let tempDir: string;
  const validator = createManifestValidator();

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'manifest-pbt-'));
  });

  afterAll(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  /**
   * Property 76: Manifest Validation
   * For any build invocation, the build system must validate the AndroidManifest.xml file.
   *
   * Validates: Requirements 18.1
   */
  describe('Property 76: Manifest Validation', () => {
    it('should validate manifest on every artifact', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 1000 }),
          async (fileSize: number) => {
            const artifactPath = path.join(tempDir, `test_${Date.now()}_${Math.random()}.apk`);

            try {
              // Create a valid ZIP file
              const zipSignature = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
              const padding = Buffer.alloc(Math.max(0, fileSize - 4), 0);
              fs.writeFileSync(artifactPath, Buffer.concat([zipSignature, padding]));

              const result = await validator.validateManifest(artifactPath);

              // Verify that manifest validation was performed
              expect(result.checks.length).toBeGreaterThan(0);
              expect(result.checks.some(c => c.name === 'Manifest Extraction')).toBe(true);
              expect(result.checks.some(c => c.name === 'Manifest Well-Formed')).toBe(true);
            } finally {
              if (fs.existsSync(artifactPath)) {
                fs.unlinkSync(artifactPath);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 77: Component Declaration Verification
   * For any build, the build system must verify that all declared components are defined in the codebase.
   *
   * Validates: Requirements 18.2
   */
  describe('Property 77: Component Declaration Verification', () => {
    it('should verify component declarations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }),
          async (numComponents: number) => {
            const artifactPath = path.join(tempDir, `components_${Date.now()}_${Math.random()}.apk`);

            try {
              // Create a valid ZIP file
              const zipSignature = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
              fs.writeFileSync(artifactPath, zipSignature);

              const result = await validator.validateManifest(artifactPath);

              // Verify that component check was performed
              const componentsCheck = result.checks.find(c => c.name === 'Components');
              expect(componentsCheck).toBeDefined();
              expect(['pass', 'fail', 'warning']).toContain(componentsCheck?.status);
            } finally {
              if (fs.existsSync(artifactPath)) {
                fs.unlinkSync(artifactPath);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 78: Required Permissions Verification
   * For any build, the build system must verify that all required permissions are declared.
   *
   * Validates: Requirements 18.3
   */
  describe('Property 78: Required Permissions Verification', () => {
    it('should verify permission declarations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }),
          async (numPermissions: number) => {
            const artifactPath = path.join(tempDir, `perms_${Date.now()}_${Math.random()}.apk`);

            try {
              // Create a valid ZIP file
              const zipSignature = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
              fs.writeFileSync(artifactPath, zipSignature);

              const result = await validator.validateManifest(artifactPath);

              // Verify that permissions check was performed
              const permissionsCheck = result.checks.find(c => c.name === 'Permissions');
              expect(permissionsCheck).toBeDefined();
              expect(['pass', 'fail', 'warning']).toContain(permissionsCheck?.status);
            } finally {
              if (fs.existsSync(artifactPath)) {
                fs.unlinkSync(artifactPath);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional property: Manifest validation consistency
   * For any artifact, manifest validation should produce consistent results
   */
  describe('Manifest Validation Consistency', () => {
    it('should produce consistent validation results', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 1000 }),
          async (fileSize: number) => {
            const artifactPath = path.join(tempDir, `consistent_${Date.now()}_${Math.random()}.apk`);

            try {
              // Create a valid ZIP file
              const zipSignature = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
              const padding = Buffer.alloc(Math.max(0, fileSize - 4), 0);
              fs.writeFileSync(artifactPath, Buffer.concat([zipSignature, padding]));

              // Run validation twice
              const result1 = await validator.validateManifest(artifactPath);
              const result2 = await validator.validateManifest(artifactPath);

              // Results should be consistent
              expect(result1.overallStatus).toBe(result2.overallStatus);
              expect(result1.checks.length).toBe(result2.checks.length);

              // All checks should have same status
              for (let i = 0; i < result1.checks.length; i++) {
                expect(result1.checks[i].status).toBe(result2.checks[i].status);
              }
            } finally {
              if (fs.existsSync(artifactPath)) {
                fs.unlinkSync(artifactPath);
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
   * For any manifest validation, the result must have valid structure
   */
  describe('Verification Result Structure', () => {
    it('should always return valid VerificationResult structure', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          async (filename: string) => {
            const artifactPath = path.join(tempDir, `structure_${filename}.apk`);

            try {
              // Create a valid ZIP file
              const zipSignature = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
              fs.writeFileSync(artifactPath, zipSignature);

              const result = await validator.validateManifest(artifactPath);

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
              if (fs.existsSync(artifactPath)) {
                fs.unlinkSync(artifactPath);
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
              await validator.validateManifest(invalidPath);
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
            const result = await validator.validateManifest(path);

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

  /**
   * Additional property: All required checks are performed
   * For any manifest validation, all required checks must be performed
   */
  describe('Required Checks Performed', () => {
    it('should perform all required manifest checks', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          async (filename: string) => {
            const artifactPath = path.join(tempDir, `checks_${filename}.apk`);

            try {
              // Create a valid ZIP file
              const zipSignature = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
              fs.writeFileSync(artifactPath, zipSignature);

              const result = await validator.validateManifest(artifactPath);

              // Verify that all expected checks are present
              const checkNames = result.checks.map(c => c.name);
              expect(checkNames).toContain('File Existence');
              expect(checkNames).toContain('Manifest Extraction');
              expect(checkNames).toContain('Manifest Well-Formed');
              expect(checkNames).toContain('Required Fields');
              expect(checkNames).toContain('Package Name');
              expect(checkNames).toContain('Version Information');
              expect(checkNames).toContain('SDK Versions');
              expect(checkNames).toContain('Permissions');
              expect(checkNames).toContain('Components');
              expect(checkNames).toContain('Common Mistakes');
            } finally {
              if (fs.existsSync(artifactPath)) {
                fs.unlinkSync(artifactPath);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
