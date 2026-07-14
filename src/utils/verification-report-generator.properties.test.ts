import * as fc from 'fast-check';
import { createVerificationReportGenerator } from './verification-report-generator';
import { VerificationResult, VerificationCheck } from '../types/android-build';

describe('VerificationReportGenerator - Property-Based Tests', () => {
  const generator = createVerificationReportGenerator();

  /**
   * Property 92: Verification Error Reporting
   * For any failed verification, the build system must report specific verification errors.
   *
   * Validates: Requirements 20.5
   */
  describe('Property 92: Verification Error Reporting', () => {
    it('should report errors with details', async () => {
      await fc.assert(
        fc.property(
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 50 }),
              category: fc.constantFrom('structure', 'signature', 'manifest', 'resources', 'code') as fc.Arbitrary<'structure' | 'signature' | 'manifest' | 'resources' | 'code'>,
              status: fc.constantFrom('pass', 'fail', 'warning') as fc.Arbitrary<'pass' | 'fail' | 'warning'>,
              message: fc.string({ minLength: 1, maxLength: 100 }),
            }),
            { minLength: 1, maxLength: 10 }
          ) as fc.Arbitrary<VerificationCheck[]>,
          (checks: VerificationCheck[]) => {
            const result: VerificationResult = {
              artifactPath: '/path/to/app.apk',
              overallStatus: checks.some(c => c.status === 'fail') ? 'fail' : 'pass',
              checks,
              timestamp: new Date(),
              duration: 100,
            };

            const report = generator.generateReport([result]);

            // Verify that errors are reported
            const failedChecks = checks.filter(c => c.status === 'fail');
            if (failedChecks.length > 0) {
              expect(report).toContain('REMEDIATION STEPS');
              for (const check of failedChecks) {
                expect(report).toContain(check.name);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include error messages in reports', async () => {
      await fc.assert(
        fc.property(
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 50 }),
              category: fc.constantFrom('structure', 'signature', 'manifest', 'resources', 'code') as fc.Arbitrary<'structure' | 'signature' | 'manifest' | 'resources' | 'code'>,
              status: fc.constantFrom('fail') as fc.Arbitrary<'fail'>,
              message: fc.string({ minLength: 1, maxLength: 100 }),
            }),
            { minLength: 1, maxLength: 5 }
          ) as fc.Arbitrary<VerificationCheck[]>,
          (checks: VerificationCheck[]) => {
            const result: VerificationResult = {
              artifactPath: '/path/to/app.apk',
              overallStatus: 'fail',
              checks,
              timestamp: new Date(),
              duration: 100,
            };

            const report = generator.generateReport([result]);

            // All error messages should be in the report
            for (const check of checks) {
              expect(report).toContain(check.message);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 93: Verification Report Generation
   * For any build verification, the build system must provide a verification report showing all checks and results.
   *
   * Validates: Requirements 20.6
   */
  describe('Property 93: Verification Report Generation', () => {
    it('should generate reports for all verification results', async () => {
      await fc.assert(
        fc.property(
          fc.array(
            fc.record({
              artifactPath: fc.string({ minLength: 1, maxLength: 50 }),
              overallStatus: fc.constantFrom('pass', 'fail', 'warning') as fc.Arbitrary<'pass' | 'fail' | 'warning'>,
              checks: fc.array(
                fc.record({
                  name: fc.string({ minLength: 1, maxLength: 50 }),
                  category: fc.constantFrom('structure', 'signature', 'manifest', 'resources', 'code') as fc.Arbitrary<'structure' | 'signature' | 'manifest' | 'resources' | 'code'>,
                  status: fc.constantFrom('pass', 'fail', 'warning') as fc.Arbitrary<'pass' | 'fail' | 'warning'>,
                  message: fc.string({ minLength: 1, maxLength: 100 }),
                }),
                { minLength: 1, maxLength: 5 }
              ) as fc.Arbitrary<VerificationCheck[]>,
              timestamp: fc.date(),
              duration: fc.integer({ min: 0, max: 10000 }),
            }),
            { minLength: 1, maxLength: 10 }
          ) as fc.Arbitrary<VerificationResult[]>,
          (results: VerificationResult[]) => {
            const report = generator.generateReport(results);

            // Report should contain all artifacts
            for (const result of results) {
              expect(report).toContain(result.artifactPath);
            }

            // Report should contain all checks
            for (const result of results) {
              for (const check of result.checks) {
                expect(report).toContain(check.name);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate valid JSON reports', async () => {
      await fc.assert(
        fc.property(
          fc.array(
            fc.record({
              artifactPath: fc.string({ minLength: 1, maxLength: 50 }),
              overallStatus: fc.constantFrom('pass', 'fail', 'warning') as fc.Arbitrary<'pass' | 'fail' | 'warning'>,
              checks: fc.array(
                fc.record({
                  name: fc.string({ minLength: 1, maxLength: 50 }),
                  category: fc.constantFrom('structure', 'signature', 'manifest', 'resources', 'code') as fc.Arbitrary<'structure' | 'signature' | 'manifest' | 'resources' | 'code'>,
                  status: fc.constantFrom('pass', 'fail', 'warning') as fc.Arbitrary<'pass' | 'fail' | 'warning'>,
                  message: fc.string({ minLength: 1, maxLength: 100 }),
                }),
                { minLength: 1, maxLength: 5 }
              ) as fc.Arbitrary<VerificationCheck[]>,
              timestamp: fc.date(),
              duration: fc.integer({ min: 0, max: 10000 }),
            }),
            { minLength: 1, maxLength: 10 }
          ) as fc.Arbitrary<VerificationResult[]>,
          (results: VerificationResult[]) => {
            const jsonReport = generator.generateJSONReport(results);

            // Should be valid JSON
            expect(() => JSON.parse(jsonReport)).not.toThrow();

            const parsed = JSON.parse(jsonReport);

            // Should have required fields
            expect(parsed).toHaveProperty('timestamp');
            expect(parsed).toHaveProperty('summary');
            expect(parsed).toHaveProperty('results');

            // Summary should have correct counts
            expect(parsed.summary.totalArtifacts).toBe(results.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate valid CSV reports', async () => {
      await fc.assert(
        fc.property(
          fc.array(
            fc.record({
              artifactPath: fc.string({ minLength: 1, maxLength: 50 }),
              overallStatus: fc.constantFrom('pass', 'fail', 'warning') as fc.Arbitrary<'pass' | 'fail' | 'warning'>,
              checks: fc.array(
                fc.record({
                  name: fc.string({ minLength: 1, maxLength: 50 }),
                  category: fc.constantFrom('structure', 'signature', 'manifest', 'resources', 'code') as fc.Arbitrary<'structure' | 'signature' | 'manifest' | 'resources' | 'code'>,
                  status: fc.constantFrom('pass', 'fail', 'warning') as fc.Arbitrary<'pass' | 'fail' | 'warning'>,
                  message: fc.string({ minLength: 1, maxLength: 100 }),
                }),
                { minLength: 1, maxLength: 5 }
              ) as fc.Arbitrary<VerificationCheck[]>,
              timestamp: fc.date(),
              duration: fc.integer({ min: 0, max: 10000 }),
            }),
            { minLength: 1, maxLength: 10 }
          ) as fc.Arbitrary<VerificationResult[]>,
          (results: VerificationResult[]) => {
            const csvReport = generator.generateCSVReport(results);

            // Should have header
            expect(csvReport).toContain('Artifact,Check Name,Category,Status,Message');

            // Should have data rows
            const lines = csvReport.split('\n');
            expect(lines.length).toBeGreaterThan(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should show all checks and results in reports', async () => {
      await fc.assert(
        fc.property(
          fc.array(
            fc.record({
              artifactPath: fc.string({ minLength: 1, maxLength: 50 }),
              overallStatus: fc.constantFrom('pass', 'fail', 'warning') as fc.Arbitrary<'pass' | 'fail' | 'warning'>,
              checks: fc.array(
                fc.record({
                  name: fc.string({ minLength: 1, maxLength: 50 }),
                  category: fc.constantFrom('structure', 'signature', 'manifest', 'resources', 'code') as fc.Arbitrary<'structure' | 'signature' | 'manifest' | 'resources' | 'code'>,
                  status: fc.constantFrom('pass', 'fail', 'warning') as fc.Arbitrary<'pass' | 'fail' | 'warning'>,
                  message: fc.string({ minLength: 1, maxLength: 100 }),
                }),
                { minLength: 1, maxLength: 5 }
              ) as fc.Arbitrary<VerificationCheck[]>,
              timestamp: fc.date(),
              duration: fc.integer({ min: 0, max: 10000 }),
            }),
            { minLength: 1, maxLength: 10 }
          ) as fc.Arbitrary<VerificationResult[]>,
          (results: VerificationResult[]) => {
            const report = generator.generateReport(results);

            // Count total checks
            const totalChecks = results.reduce((sum, r) => sum + r.checks.length, 0);

            // Report should mention checks
            expect(report).toContain('Check Results:');
            expect(report).toContain('Passed:');
            expect(report).toContain('Warnings:');
            expect(report).toContain('Failed:');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional property: Report consistency
   * For any verification results, reports should be consistent across formats
   */
  describe('Report Consistency', () => {
    it('should generate consistent reports for same input', async () => {
      await fc.assert(
        fc.property(
          fc.array(
            fc.record({
              artifactPath: fc.string({ minLength: 1, maxLength: 50 }),
              overallStatus: fc.constantFrom('pass', 'fail', 'warning') as fc.Arbitrary<'pass' | 'fail' | 'warning'>,
              checks: fc.array(
                fc.record({
                  name: fc.string({ minLength: 1, maxLength: 50 }),
                  category: fc.constantFrom('structure', 'signature', 'manifest', 'resources', 'code') as fc.Arbitrary<'structure' | 'signature' | 'manifest' | 'resources' | 'code'>,
                  status: fc.constantFrom('pass', 'fail', 'warning') as fc.Arbitrary<'pass' | 'fail' | 'warning'>,
                  message: fc.string({ minLength: 1, maxLength: 100 }),
                }),
                { minLength: 1, maxLength: 5 }
              ) as fc.Arbitrary<VerificationCheck[]>,
              timestamp: fc.date(),
              duration: fc.integer({ min: 0, max: 10000 }),
            }),
            { minLength: 1, maxLength: 10 }
          ) as fc.Arbitrary<VerificationResult[]>,
          (results: VerificationResult[]) => {
            const report1 = generator.generateReport(results);
            const report2 = generator.generateReport(results);

            // Reports should be identical (except for timestamp)
            expect(report1.length).toBe(report2.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional property: Report structure
   * For any verification results, reports must have valid structure
   */
  describe('Report Structure', () => {
    it('should have valid structure for all report types', async () => {
      await fc.assert(
        fc.property(
          fc.array(
            fc.record({
              artifactPath: fc.string({ minLength: 1, maxLength: 50 }),
              overallStatus: fc.constantFrom('pass', 'fail', 'warning') as fc.Arbitrary<'pass' | 'fail' | 'warning'>,
              checks: fc.array(
                fc.record({
                  name: fc.string({ minLength: 1, maxLength: 50 }),
                  category: fc.constantFrom('structure', 'signature', 'manifest', 'resources', 'code') as fc.Arbitrary<'structure' | 'signature' | 'manifest' | 'resources' | 'code'>,
                  status: fc.constantFrom('pass', 'fail', 'warning') as fc.Arbitrary<'pass' | 'fail' | 'warning'>,
                  message: fc.string({ minLength: 1, maxLength: 100 }),
                }),
                { minLength: 1, maxLength: 5 }
              ) as fc.Arbitrary<VerificationCheck[]>,
              timestamp: fc.date(),
              duration: fc.integer({ min: 0, max: 10000 }),
            }),
            { minLength: 1, maxLength: 10 }
          ) as fc.Arbitrary<VerificationResult[]>,
          (results: VerificationResult[]) => {
            const textReport = generator.generateReport(results);
            const jsonReport = generator.generateJSONReport(results);
            const csvReport = generator.generateCSVReport(results);

            // All reports should be non-empty
            expect(textReport.length).toBeGreaterThan(0);
            expect(jsonReport.length).toBeGreaterThan(0);
            expect(csvReport.length).toBeGreaterThan(0);

            // Text report should have structure
            expect(textReport).toContain('ANDROID BUILD VERIFICATION REPORT');

            // JSON report should be valid
            expect(() => JSON.parse(jsonReport)).not.toThrow();

            // CSV report should have header
            expect(csvReport).toContain('Artifact,Check Name,Category,Status,Message');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
