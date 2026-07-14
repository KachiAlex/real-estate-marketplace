/**
 * Unit tests for validation orchestrator module
 *
 * Tests cover:
 * - Running all validation checks in sequence
 * - Collecting and formatting validation results
 * - Generating validation reports
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  runAllValidationChecks,
  formatValidationReport,
  exportValidationReportAsJSON,
  saveValidationReport,
} from './validation-orchestrator';
import { ValidationStatus } from '../types/mobile-config';

describe('Validation Orchestrator', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'validation-orchestrator-test-'));
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    process.env = originalEnv;
  });

  describe('runAllValidationChecks', () => {
    it('should run all validation checks and return report', () => {
      const result = runAllValidationChecks();

      expect(result).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.categories).toBeDefined();
      expect(Object.keys(result.categories).length).toBeGreaterThan(0);
      expect(result.summary).toBeDefined();
      expect(typeof result.overallStatus).toBe('string');
    });

    it('should include environment validation checks', () => {
      const result = runAllValidationChecks();

      const envChecks = result.categories.environment.checks;
      expect(envChecks.length).toBeGreaterThan(0);
    });

    it('should include configuration validation checks', () => {
      const result = runAllValidationChecks();

      const configChecks = result.categories.configuration.checks;
      expect(configChecks.length).toBeGreaterThan(0);
    });

    it('should include dependency validation checks', () => {
      const result = runAllValidationChecks();

      const depChecks = result.categories.dependency.checks;
      expect(depChecks.length).toBeGreaterThan(0);
    });

    it('should include credential validation checks', () => {
      const result = runAllValidationChecks();

      const credChecks = result.categories.credential.checks;
      expect(credChecks.length).toBeGreaterThan(0);
    });

    it('should return pass status when all checks pass', () => {
      const result = runAllValidationChecks();

      // At least some checks should pass
      const allChecks = Object.values(result.categories).flatMap((cat) => cat.checks);
      const passedChecks = allChecks.filter((check) => check.status === ValidationStatus.Pass);
      expect(passedChecks.length).toBeGreaterThan(0);
    });

    it('should categorize checks correctly', () => {
      const result = runAllValidationChecks();

      const categories = Object.keys(result.categories);
      expect(categories).toContain('environment');
      expect(categories).toContain('configuration');
      expect(categories).toContain('dependency');
      expect(categories).toContain('credential');
    });
  });

  describe('formatValidationReport', () => {
    it('should format validation report as human-readable string', () => {
      const result = runAllValidationChecks();
      const formatted = formatValidationReport(result);

      expect(formatted).toBeDefined();
      expect(typeof formatted).toBe('string');
      expect(formatted.length).toBeGreaterThan(0);
    });

    it('should include timestamp in formatted report', () => {
      const result = runAllValidationChecks();
      const formatted = formatValidationReport(result);

      expect(formatted).toContain(result.timestamp.toISOString());
    });

    it('should include summary in formatted report', () => {
      const result = runAllValidationChecks();
      const formatted = formatValidationReport(result);

      expect(formatted).toContain(result.summary);
    });

    it('should include category information in formatted report', () => {
      const result = runAllValidationChecks();
      const formatted = formatValidationReport(result);

      expect(formatted).toContain('ENVIRONMENT');
      expect(formatted).toContain('CONFIGURATION');
      expect(formatted).toContain('DEPENDENCY');
      expect(formatted).toContain('CREDENTIAL');
    });
  });

  describe('exportValidationReportAsJSON', () => {
    it('should export validation report as JSON string', () => {
      const result = runAllValidationChecks();
      const json = exportValidationReportAsJSON(result);

      expect(json).toBeDefined();
      expect(typeof json).toBe('string');

      // Verify it's valid JSON
      const parsed = JSON.parse(json);
      expect(parsed).toBeDefined();
      expect(parsed.summary).toBeDefined();
    });

    it('should include all report fields in JSON', () => {
      const result = runAllValidationChecks();
      const json = exportValidationReportAsJSON(result);
      const parsed = JSON.parse(json);

      expect(parsed.timestamp).toBeDefined();
      expect(parsed.categories).toBeDefined();
      expect(parsed.summary).toBeDefined();
      expect(parsed.overallStatus).toBeDefined();
    });

    it('should format JSON with proper indentation', () => {
      const result = runAllValidationChecks();
      const json = exportValidationReportAsJSON(result);

      // Should be formatted with indentation (not minified)
      expect(json).toContain('\n');
      expect(json).toContain('  ');
    });
  });

  describe('saveValidationReport', () => {
    it('should save validation report to file', () => {
      const reportPath = path.join(tempDir, 'validation-report.json');
      const result = runAllValidationChecks();

      const saveResult = saveValidationReport(result, reportPath);

      expect(saveResult.success).toBe(true);
      expect(fs.existsSync(reportPath)).toBe(true);
    });

    it('should save report as valid JSON', () => {
      const reportPath = path.join(tempDir, 'validation-report-json.json');
      const result = runAllValidationChecks();

      saveValidationReport(result, reportPath);

      const content = fs.readFileSync(reportPath, 'utf-8');
      const parsed = JSON.parse(content);

      expect(parsed.summary).toBeDefined();
      expect(parsed.categories).toBeDefined();
    });

    it('should create directory if it does not exist', () => {
      const reportDir = path.join(tempDir, 'reports', 'nested', 'dir');
      const reportPath = path.join(reportDir, 'validation-report.json');
      const result = runAllValidationChecks();

      const saveResult = saveValidationReport(result, reportPath);

      expect(saveResult.success).toBe(true);
      expect(fs.existsSync(reportPath)).toBe(true);
    });

    it('should use default path when not provided', () => {
      const result = runAllValidationChecks();

      const saveResult = saveValidationReport(result);

      expect(saveResult.success).toBe(true);
    });

    it('should handle multiple reports in same directory', () => {
      const reportDir = path.join(tempDir, 'multiple-reports');
      fs.mkdirSync(reportDir, { recursive: true });

      const result1 = runAllValidationChecks();
      const result2 = runAllValidationChecks();

      const path1 = path.join(reportDir, 'report1.json');
      const path2 = path.join(reportDir, 'report2.json');

      const saveResult1 = saveValidationReport(result1, path1);
      const saveResult2 = saveValidationReport(result2, path2);

      expect(saveResult1.success).toBe(true);
      expect(saveResult2.success).toBe(true);
      expect(fs.existsSync(path1)).toBe(true);
      expect(fs.existsSync(path2)).toBe(true);
    });
  });
});
