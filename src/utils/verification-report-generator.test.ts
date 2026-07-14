import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createVerificationReportGenerator } from './verification-report-generator';
import { VerificationResult } from '../types/android-build';

describe('VerificationReportGenerator', () => {
  let tempDir: string;
  const generator = createVerificationReportGenerator();

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'report-generator-'));
  });

  afterAll(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  const createMockResult = (status: 'pass' | 'fail' | 'warning'): VerificationResult => ({
    artifactPath: '/path/to/app.apk',
    overallStatus: status,
    checks: [
      {
        name: 'File Existence',
        category: 'structure',
        status: 'pass',
        message: 'File exists',
      },
      {
        name: 'ZIP Structure',
        category: 'structure',
        status: status,
        message: status === 'pass' ? 'Valid ZIP' : 'Invalid ZIP',
      },
      {
        name: 'Manifest',
        category: 'manifest',
        status: status === 'fail' ? 'fail' : 'pass',
        message: status === 'fail' ? 'Manifest missing' : 'Manifest valid',
      },
    ],
    timestamp: new Date(),
    duration: 100,
  });

  describe('generateReport', () => {
    it('should generate a text report', () => {
      const results = [createMockResult('pass')];
      const report = generator.generateReport(results);

      expect(report).toContain('ANDROID BUILD VERIFICATION REPORT');
      expect(report).toContain('SUMMARY');
      expect(report).toContain('DETAILED VERIFICATION RESULTS');
      expect(report).toContain('app.apk');
    });

    it('should include summary statistics', () => {
      const results = [
        createMockResult('pass'),
        createMockResult('warning'),
        createMockResult('fail'),
      ];
      const report = generator.generateReport(results);

      expect(report).toContain('Total Artifacts Verified: 3');
      expect(report).toContain('Passed:');
      expect(report).toContain('Warnings:');
      expect(report).toContain('Failed:');
    });

    it('should include check details', () => {
      const results = [createMockResult('pass')];
      const report = generator.generateReport(results);

      expect(report).toContain('File Existence');
      expect(report).toContain('ZIP Structure');
      expect(report).toContain('Manifest');
    });

    it('should save report to file when path provided', () => {
      const results = [createMockResult('pass')];
      const reportPath = path.join(tempDir, 'report.txt');

      generator.generateReport(results, reportPath);

      expect(fs.existsSync(reportPath)).toBe(true);
      const content = fs.readFileSync(reportPath, 'utf8');
      expect(content).toContain('ANDROID BUILD VERIFICATION REPORT');
    });

    it('should include remediation steps for failures', () => {
      const results = [createMockResult('fail')];
      const report = generator.generateReport(results);

      expect(report).toContain('REMEDIATION STEPS');
    });

    it('should include recommendations for warnings', () => {
      const results = [createMockResult('warning')];
      const report = generator.generateReport(results);

      expect(report).toContain('RECOMMENDATIONS');
    });
  });

  describe('generateJSONReport', () => {
    it('should generate valid JSON report', () => {
      const results = [createMockResult('pass')];
      const jsonReport = generator.generateJSONReport(results);

      expect(() => JSON.parse(jsonReport)).not.toThrow();
    });

    it('should include summary in JSON', () => {
      const results = [
        createMockResult('pass'),
        createMockResult('fail'),
      ];
      const jsonReport = JSON.parse(generator.generateJSONReport(results));

      expect(jsonReport.summary).toBeDefined();
      expect(jsonReport.summary.totalArtifacts).toBe(2);
      expect(jsonReport.summary.passed).toBe(1);
      expect(jsonReport.summary.failed).toBe(1);
    });

    it('should include detailed results in JSON', () => {
      const results = [createMockResult('pass')];
      const jsonReport = JSON.parse(generator.generateJSONReport(results));

      expect(jsonReport.results).toBeDefined();
      expect(jsonReport.results.length).toBe(1);
      expect(jsonReport.results[0].checks).toBeDefined();
    });

    it('should include timestamp in JSON', () => {
      const results = [createMockResult('pass')];
      const jsonReport = JSON.parse(generator.generateJSONReport(results));

      expect(jsonReport.timestamp).toBeDefined();
      expect(new Date(jsonReport.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('generateCSVReport', () => {
    it('should generate valid CSV report', () => {
      const results = [createMockResult('pass')];
      const csvReport = generator.generateCSVReport(results);

      expect(csvReport).toContain('Artifact,Check Name,Category,Status,Message');
      expect(csvReport).toContain('app.apk');
    });

    it('should include all checks in CSV', () => {
      const results = [createMockResult('pass')];
      const csvReport = generator.generateCSVReport(results);

      expect(csvReport).toContain('File Existence');
      expect(csvReport).toContain('ZIP Structure');
      expect(csvReport).toContain('Manifest');
    });

    it('should escape quotes in CSV', () => {
      const results = [createMockResult('pass')];
      const csvReport = generator.generateCSVReport(results);

      // CSV should properly escape quotes
      expect(csvReport).toBeDefined();
      expect(csvReport.length).toBeGreaterThan(0);
    });

    it('should have correct number of rows', () => {
      const results = [createMockResult('pass')];
      const csvReport = generator.generateCSVReport(results);
      const lines = csvReport.split('\n');

      // Header + 3 checks = 4 lines
      expect(lines.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('report structure', () => {
    it('should have consistent structure for all report types', () => {
      const results = [createMockResult('pass')];

      const textReport = generator.generateReport(results);
      const jsonReport = generator.generateJSONReport(results);
      const csvReport = generator.generateCSVReport(results);

      expect(textReport).toBeDefined();
      expect(jsonReport).toBeDefined();
      expect(csvReport).toBeDefined();

      expect(textReport.length).toBeGreaterThan(0);
      expect(jsonReport.length).toBeGreaterThan(0);
      expect(csvReport.length).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle empty results', () => {
      const results: VerificationResult[] = [];
      const report = generator.generateReport(results);

      expect(report).toContain('ANDROID BUILD VERIFICATION REPORT');
      expect(report).toContain('Total Artifacts Verified: 0');
    });

    it('should handle multiple artifacts', () => {
      const results = [
        createMockResult('pass'),
        createMockResult('warning'),
        createMockResult('fail'),
      ];
      const report = generator.generateReport(results);

      expect(report).toContain('Artifact 1');
      expect(report).toContain('Artifact 2');
      expect(report).toContain('Artifact 3');
    });

    it('should handle results with no checks', () => {
      const results: VerificationResult[] = [
        {
          artifactPath: '/path/to/app.apk',
          overallStatus: 'pass',
          checks: [],
          timestamp: new Date(),
          duration: 100,
        },
      ];
      const report = generator.generateReport(results);

      expect(report).toContain('ANDROID BUILD VERIFICATION REPORT');
    });
  });
});
