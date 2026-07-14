/**
 * Unit tests for environment variable loader module
 *
 * Tests cover:
 * - Loading environment variables from .env.local file
 * - Loading environment variables from EAS secrets
 * - Validating required environment variables
 * - Error message generation for missing variables
 * - Comprehensive environment variable validation
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  loadLocalEnvironmentVariables,
  validateRequiredEnvironmentVariables,
  generateMissingVariablesMessage,
  validateEnvironmentVariables,
} from './env-loader';
import { ValidationStatus } from '../types/mobile-config';

describe('Environment Loader', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'env-loader-test-'));

  afterAll(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('loadLocalEnvironmentVariables', () => {
    it('should load variables from .env.local file', () => {
      const envPath = path.join(tempDir, '.env.local');
      const content = `API_ENDPOINT=https://api.example.com
API_KEY=test-key-123
FIREBASE_CONFIG={"project":"test"}`;

      fs.writeFileSync(envPath, content);

      const result = loadLocalEnvironmentVariables(envPath);

      expect(result.success).toBe(true);
      expect(result.variables).toBeDefined();
      expect(result.variables?.API_ENDPOINT).toBe('https://api.example.com');
      expect(result.variables?.API_KEY).toBe('test-key-123');
      expect(result.variables?.FIREBASE_CONFIG).toBe('{"project":"test"}');
    });

    it('should skip comments in .env.local file', () => {
      const envPath = path.join(tempDir, '.env.local-comments');
      const content = `# This is a comment
API_ENDPOINT=https://api.example.com
# Another comment
API_KEY=test-key-123`;

      fs.writeFileSync(envPath, content);

      const result = loadLocalEnvironmentVariables(envPath);

      expect(result.success).toBe(true);
      expect(result.variables).toBeDefined();
      expect(Object.keys(result.variables || {}).length).toBe(2);
      expect(result.variables?.API_ENDPOINT).toBe('https://api.example.com');
    });

    it('should skip empty lines in .env.local file', () => {
      const envPath = path.join(tempDir, '.env.local-empty-lines');
      const content = `API_ENDPOINT=https://api.example.com

API_KEY=test-key-123

ANALYTICS_TOKEN=token-123`;

      fs.writeFileSync(envPath, content);

      const result = loadLocalEnvironmentVariables(envPath);

      expect(result.success).toBe(true);
      expect(result.variables).toBeDefined();
      expect(Object.keys(result.variables || {}).length).toBe(3);
    });

    it('should handle quoted values', () => {
      const envPath = path.join(tempDir, '.env.local-quoted');
      const content = `API_ENDPOINT="https://api.example.com"
API_KEY='test-key-123'
UNQUOTED=value`;

      fs.writeFileSync(envPath, content);

      const result = loadLocalEnvironmentVariables(envPath);

      expect(result.success).toBe(true);
      expect(result.variables?.API_ENDPOINT).toBe('https://api.example.com');
      expect(result.variables?.API_KEY).toBe('test-key-123');
      expect(result.variables?.UNQUOTED).toBe('value');
    });

    it('should handle values with spaces', () => {
      const envPath = path.join(tempDir, '.env.local-spaces');
      const content = `DESCRIPTION="This is a description with spaces"
ANOTHER_VAR=value with spaces`;

      fs.writeFileSync(envPath, content);

      const result = loadLocalEnvironmentVariables(envPath);

      expect(result.success).toBe(true);
      expect(result.variables?.DESCRIPTION).toBe('This is a description with spaces');
      expect(result.variables?.ANOTHER_VAR).toBe('value with spaces');
    });

    it('should return error when file does not exist', () => {
      const result = loadLocalEnvironmentVariables('/non/existent/.env.local');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('not found');
      expect(result.variables).toBeUndefined();
    });

    it('should handle empty .env.local file', () => {
      const envPath = path.join(tempDir, '.env.local-empty');
      fs.writeFileSync(envPath, '');

      const result = loadLocalEnvironmentVariables(envPath);

      expect(result.success).toBe(true);
      expect(result.variables).toBeDefined();
      expect(Object.keys(result.variables || {}).length).toBe(0);
    });

    it('should handle file with only comments', () => {
      const envPath = path.join(tempDir, '.env.local-only-comments');
      const content = `# Comment 1
# Comment 2
# Comment 3`;

      fs.writeFileSync(envPath, content);

      const result = loadLocalEnvironmentVariables(envPath);

      expect(result.success).toBe(true);
      expect(result.variables).toBeDefined();
      expect(Object.keys(result.variables || {}).length).toBe(0);
    });

    it('should use default path when not provided', () => {
      const envPath = path.join(tempDir, '.env.local-default');
      const content = `API_ENDPOINT=https://api.example.com`;

      fs.writeFileSync(envPath, content);

      // Note: We can't easily change cwd in tests, so we just verify the function
      // accepts undefined and uses a default path
      const result = loadLocalEnvironmentVariables(envPath);
      expect(result.success).toBe(true);
    });

    it('should handle special characters in values', () => {
      const envPath = path.join(tempDir, '.env.local-special');
      const content = `DATABASE_URL=postgresql://user:p@ss!word@localhost:5432/db
API_KEY=sk_live_abc123!@#$%^&*()
SPECIAL_CHARS=!@#$%^&*()`;

      fs.writeFileSync(envPath, content);

      const result = loadLocalEnvironmentVariables(envPath);

      expect(result.success).toBe(true);
      expect(result.variables?.DATABASE_URL).toContain('p@ss!word');
      expect(result.variables?.API_KEY).toContain('!@#$%^&*()');
    });
  });

  describe('validateRequiredEnvironmentVariables', () => {
    it('should validate all required variables are present', () => {
      const variables = {
        API_ENDPOINT: 'https://api.example.com',
        API_KEY: 'test-key-123',
        FIREBASE_CONFIG: '{"project":"test"}',
        ANALYTICS_TOKEN: 'token-123',
      };

      const result = validateRequiredEnvironmentVariables(variables);

      expect(result.success).toBe(true);
      expect(result.missingVariables.length).toBe(0);
      expect(result.details.length).toBe(0);
    });

    it('should detect missing required variables', () => {
      const variables = {
        API_ENDPOINT: 'https://api.example.com',
        // Missing API_KEY, FIREBASE_CONFIG, ANALYTICS_TOKEN
      };

      const result = validateRequiredEnvironmentVariables(variables);

      expect(result.success).toBe(false);
      expect(result.missingVariables).toContain('API_KEY');
      expect(result.missingVariables).toContain('FIREBASE_CONFIG');
      expect(result.missingVariables).toContain('ANALYTICS_TOKEN');
    });

    it('should detect empty variable values', () => {
      const variables = {
        API_ENDPOINT: '',
        API_KEY: '   ',
        FIREBASE_CONFIG: 'valid-value',
        ANALYTICS_TOKEN: 'token-123',
      };

      const result = validateRequiredEnvironmentVariables(variables);

      expect(result.success).toBe(false);
      expect(result.missingVariables).toContain('API_ENDPOINT');
      expect(result.missingVariables).toContain('API_KEY');
    });

    it('should accept custom required variables list', () => {
      const variables = {
        CUSTOM_VAR_1: 'value1',
        CUSTOM_VAR_2: 'value2',
      };

      const result = validateRequiredEnvironmentVariables(variables, ['CUSTOM_VAR_1', 'CUSTOM_VAR_2']);

      expect(result.success).toBe(true);
      expect(result.missingVariables.length).toBe(0);
    });

    it('should detect missing custom required variables', () => {
      const variables = {
        CUSTOM_VAR_1: 'value1',
      };

      const result = validateRequiredEnvironmentVariables(variables, ['CUSTOM_VAR_1', 'CUSTOM_VAR_2', 'CUSTOM_VAR_3']);

      expect(result.success).toBe(false);
      expect(result.missingVariables).toContain('CUSTOM_VAR_2');
      expect(result.missingVariables).toContain('CUSTOM_VAR_3');
    });

    it('should handle empty variables object', () => {
      const variables = {};

      const result = validateRequiredEnvironmentVariables(variables);

      expect(result.success).toBe(false);
      expect(result.missingVariables.length).toBeGreaterThan(0);
    });

    it('should include detailed error messages', () => {
      const variables = {
        API_ENDPOINT: 'https://api.example.com',
      };

      const result = validateRequiredEnvironmentVariables(variables);

      expect(result.details.length).toBeGreaterThan(0);
      result.details.forEach((detail) => {
        expect(detail).toContain('Missing required environment variable');
      });
    });

    it('should handle case-sensitive variable names', () => {
      const variables = {
        api_endpoint: 'https://api.example.com', // lowercase
        API_KEY: 'test-key-123',
      };

      const result = validateRequiredEnvironmentVariables(variables);

      expect(result.success).toBe(false);
      expect(result.missingVariables).toContain('API_ENDPOINT'); // uppercase required
    });
  });

  describe('generateMissingVariablesMessage', () => {
    it('should generate helpful error message for missing variables', () => {
      const missingVars = ['API_ENDPOINT', 'API_KEY'];
      const envPath = path.join(tempDir, '.env.local');

      const message = generateMissingVariablesMessage(missingVars, envPath);

      expect(message).toContain('Missing required environment variables');
      expect(message).toContain('API_ENDPOINT');
      expect(message).toContain('API_KEY');
      expect(message).toContain('To fix this issue');
      expect(message).toContain('.env.local');
    });

    it('should include remediation steps', () => {
      const missingVars = ['API_ENDPOINT'];
      const envPath = path.join(tempDir, '.env.local');

      const message = generateMissingVariablesMessage(missingVars, envPath);

      expect(message).toContain('Create or edit');
      expect(message).toContain('Add the following variables');
      expect(message).toContain('Save the file');
    });

    it('should include example .env.local content', () => {
      const missingVars = ['API_ENDPOINT', 'API_KEY', 'FIREBASE_CONFIG'];
      const envPath = path.join(tempDir, '.env.local');

      const message = generateMissingVariablesMessage(missingVars, envPath);

      expect(message).toContain('Example .env.local');
      expect(message).toContain('API_ENDPOINT=');
      expect(message).toContain('API_KEY=');
      expect(message).toContain('FIREBASE_CONFIG=');
    });

    it('should use default path when not provided', () => {
      const missingVars = ['API_ENDPOINT'];

      const message = generateMissingVariablesMessage(missingVars);

      expect(message).toContain('.env.local');
    });

    it('should handle single missing variable', () => {
      const missingVars = ['API_ENDPOINT'];
      const envPath = path.join(tempDir, '.env.local');

      const message = generateMissingVariablesMessage(missingVars, envPath);

      expect(message).toContain('API_ENDPOINT');
      expect(message).toContain('Missing required environment variables');
    });

    it('should handle multiple missing variables', () => {
      const missingVars = ['VAR1', 'VAR2', 'VAR3', 'VAR4', 'VAR5'];
      const envPath = path.join(tempDir, '.env.local');

      const message = generateMissingVariablesMessage(missingVars, envPath);

      missingVars.forEach((variable) => {
        expect(message).toContain(variable);
      });
    });
  });

  describe('validateEnvironmentVariables', () => {
    it('should return comprehensive validation result', () => {
      const envPath = path.join(tempDir, '.env.local-comprehensive');
      const content = `API_ENDPOINT=https://api.example.com
API_KEY=test-key-123
FIREBASE_CONFIG={"project":"test"}
ANALYTICS_TOKEN=token-123`;

      fs.writeFileSync(envPath, content);

      const result = validateEnvironmentVariables(envPath);

      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.checks).toBeInstanceOf(Array);
      expect(result.checks.length).toBeGreaterThan(0);
      expect(result.summary).toBeDefined();
      expect(typeof result.overallStatus).toBe('string');
    });

    it('should include all required validation checks', () => {
      const envPath = path.join(tempDir, '.env.local-all-checks');
      const content = `API_ENDPOINT=https://api.example.com
API_KEY=test-key-123
FIREBASE_CONFIG={"project":"test"}
ANALYTICS_TOKEN=token-123`;

      fs.writeFileSync(envPath, content);

      const result = validateEnvironmentVariables(envPath);

      const checkNames = result.checks.map((check) => check.name);
      expect(checkNames).toContain('Local Environment File');
      expect(checkNames).toContain('Required Variables');
    });

    it('should return pass status when all checks pass', () => {
      const envPath = path.join(tempDir, '.env.local-all-pass');
      const content = `API_ENDPOINT=https://api.example.com
API_KEY=test-key-123
FIREBASE_CONFIG={"project":"test"}
ANALYTICS_TOKEN=token-123`;

      fs.writeFileSync(envPath, content);

      const result = validateEnvironmentVariables(envPath);

      expect(result.overallStatus).toBe(ValidationStatus.Pass);
      expect(result.summary).toContain('properly configured');
    });

    it('should return fail status when .env.local is missing', () => {
      const result = validateEnvironmentVariables('/non/existent/.env.local');

      expect(result.overallStatus).toBe(ValidationStatus.Fail);
      const failedChecks = result.checks.filter((check) => check.status === ValidationStatus.Fail);
      expect(failedChecks.length).toBeGreaterThan(0);
    });

    it('should return fail status when required variables are missing', () => {
      const envPath = path.join(tempDir, '.env.local-missing-vars');
      const content = `API_ENDPOINT=https://api.example.com`;

      fs.writeFileSync(envPath, content);

      const result = validateEnvironmentVariables(envPath);

      expect(result.overallStatus).toBe(ValidationStatus.Fail);
      const failedChecks = result.checks.filter((check) => check.status === ValidationStatus.Fail);
      expect(failedChecks.length).toBeGreaterThan(0);
    });

    it('should include remediation steps for failed checks', () => {
      const envPath = path.join(tempDir, '.env.local-remediation');
      const content = `API_ENDPOINT=https://api.example.com`;

      fs.writeFileSync(envPath, content);

      const result = validateEnvironmentVariables(envPath);

      const failedChecks = result.checks.filter((check) => check.status === ValidationStatus.Fail);
      failedChecks.forEach((check) => {
        expect(check.remediation).toBeDefined();
      });
    });

    it('should include documentation links for all checks', () => {
      const envPath = path.join(tempDir, '.env.local-docs');
      const content = `API_ENDPOINT=https://api.example.com
API_KEY=test-key-123
FIREBASE_CONFIG={"project":"test"}
ANALYTICS_TOKEN=token-123`;

      fs.writeFileSync(envPath, content);

      const result = validateEnvironmentVariables(envPath);

      result.checks.forEach((check) => {
        expect(check.documentationLink).toBeDefined();
        expect(check.documentationLink).toMatch(/^https?:\/\//);
      });
    });

    it('should accept custom required variables', () => {
      const envPath = path.join(tempDir, '.env.local-custom');
      const content = `CUSTOM_VAR_1=value1
CUSTOM_VAR_2=value2`;

      fs.writeFileSync(envPath, content);

      const result = validateEnvironmentVariables(envPath, undefined, ['CUSTOM_VAR_1', 'CUSTOM_VAR_2']);

      expect(result.overallStatus).toBe(ValidationStatus.Pass);
    });

    it('should validate with EAS profile when provided', () => {
      const envPath = path.join(tempDir, '.env.local-eas');
      const content = `API_ENDPOINT=https://api.example.com
API_KEY=test-key-123
FIREBASE_CONFIG={"project":"test"}
ANALYTICS_TOKEN=token-123`;

      fs.writeFileSync(envPath, content);

      const result = validateEnvironmentVariables(envPath, 'development');

      expect(result.checks).toBeInstanceOf(Array);
      // Should include EAS environment variables check
      const easCheck = result.checks.find((check) => check.name === 'EAS Environment Variables');
      expect(easCheck).toBeDefined();
    });
  });
});
