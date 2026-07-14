/**
 * Unit tests for Certificate Validator
 *
 * Tests certificate validation functionality including:
 * - Certificate extraction
 * - Validity checking
 * - Expiration checking
 * - Subject DN matching
 */

import * as fs from 'fs';
import { execSync } from 'child_process';
import {
  extractCertificate,
  validateCertificateValidity,
  checkCertificateExpiration,
  validateCertificateSubjectDN,
} from './certificate-validator';

jest.mock('fs');
jest.mock('child_process');

describe('CertificateValidator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockCertificateOutput = `Alias name: mykey
Creation date: Jan 1, 2024
Entry type: PrivateKeyEntry
Certificate chain length: 1
Certificate[1]:
Owner: CN=MyApp, O=MyCompany, C=US
Issuer: CN=MyApp, O=MyCompany, C=US
Serial number: 1234567890
Valid from: Mon Jan 01 00:00:00 UTC 2024 until: Wed Jan 01 00:00:00 UTC 2026
Certificate fingerprints:
	 SHA-256: AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99
Signature algorithm name: SHA256withRSA
Subject Public Key Info:
	Algorithm: RSA
	Public Key: (2048 bits)`;

  describe('extractCertificate', () => {
    it('should extract certificate from keystore', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (execSync as jest.Mock).mockReturnValue(mockCertificateOutput);

      const result = extractCertificate('/path/to/keystore.keystore', 'password', 'mykey');

      expect(result.isValid).toBe(true);
      expect(result.certificate).toBeDefined();
      expect(result.certificate?.subjectDN).toContain('CN=MyApp');
    });

    it('should fail when keystore does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = extractCertificate('/path/to/nonexistent.keystore', 'password', 'mykey');

      expect(result.isValid).toBe(false);
      expect(result.certificate).toBeNull();
      expect(result.message).toContain('not found');
    });

    it('should handle keytool errors', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (execSync as jest.Mock).mockImplementation(() => {
        throw new Error('Keystore was tampered with');
      });

      const result = extractCertificate('/path/to/keystore.keystore', 'password', 'mykey');

      expect(result.isValid).toBe(false);
      expect(result.certificate).toBeNull();
    });

    it('should parse certificate details correctly', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (execSync as jest.Mock).mockReturnValue(mockCertificateOutput);

      const result = extractCertificate('/path/to/keystore.keystore', 'password', 'mykey');

      expect(result.certificate?.subjectDN).toContain('CN=MyApp');
      expect(result.certificate?.issuerDN).toContain('CN=MyApp');
      expect(result.certificate?.signatureAlgorithm).toContain('SHA256');
      expect(result.certificate?.notBefore).toBeInstanceOf(Date);
      expect(result.certificate?.notAfter).toBeInstanceOf(Date);
    });
  });

  describe('validateCertificateValidity', () => {
    it('should validate non-expired certificate', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (execSync as jest.Mock).mockReturnValue(mockCertificateOutput);

      const result = validateCertificateValidity(
        '/path/to/keystore.keystore',
        'password',
        'mykey'
      );

      expect(result.isValid).toBe(true);
      expect(result.certificate?.isExpired).toBe(false);
    });

    it('should fail for expired certificate', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      const expiredOutput = mockCertificateOutput.replace(
        'Valid from: Mon Jan 01 00:00:00 UTC 2024 until: Wed Jan 01 00:00:00 UTC 2026',
        'Valid from: Mon Jan 01 00:00:00 UTC 2020 until: Wed Jan 01 00:00:00 UTC 2021'
      );
      (execSync as jest.Mock).mockReturnValue(expiredOutput);

      const result = validateCertificateValidity(
        '/path/to/keystore.keystore',
        'password',
        'mykey'
      );

      expect(result.isValid).toBe(false);
      expect(result.certificate?.isExpired).toBe(true);
      expect(result.message).toContain('expired');
    });

    it('should fail for not-yet-valid certificate', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      const futureOutput = mockCertificateOutput.replace(
        'Valid from: Mon Jan 01 00:00:00 UTC 2024 until: Wed Jan 01 00:00:00 UTC 2026',
        'Valid from: Mon Jan 01 00:00:00 UTC 2099 until: Wed Jan 01 00:00:00 UTC 2100'
      );
      (execSync as jest.Mock).mockReturnValue(futureOutput);

      const result = validateCertificateValidity(
        '/path/to/keystore.keystore',
        'password',
        'mykey'
      );

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('not yet valid');
    });
  });

  describe('checkCertificateExpiration', () => {
    it('should warn for certificate expiring soon', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      // Certificate expiring in 15 days
      const soonOutput = mockCertificateOutput.replace(
        'Valid from: Mon Jan 01 00:00:00 UTC 2024 until: Wed Jan 01 00:00:00 UTC 2026',
        `Valid from: Mon Jan 01 00:00:00 UTC 2024 until: ${new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toUTCString()}`
      );
      (execSync as jest.Mock).mockReturnValue(soonOutput);

      const result = checkCertificateExpiration(
        '/path/to/keystore.keystore',
        'password',
        'mykey',
        30
      );

      expect(result.isValid).toBe(true);
      expect(result.message).toContain('expiring soon');
      expect(result.certificate?.daysUntilExpiration).toBeLessThan(30);
    });

    it('should not warn for certificate with plenty of time', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (execSync as jest.Mock).mockReturnValue(mockCertificateOutput);

      const result = checkCertificateExpiration(
        '/path/to/keystore.keystore',
        'password',
        'mykey',
        30
      );

      expect(result.isValid).toBe(true);
      expect(result.message).not.toContain('expiring soon');
    });

    it('should fail for expired certificate', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      const expiredOutput = mockCertificateOutput.replace(
        'Valid from: Mon Jan 01 00:00:00 UTC 2024 until: Wed Jan 01 00:00:00 UTC 2026',
        'Valid from: Mon Jan 01 00:00:00 UTC 2020 until: Wed Jan 01 00:00:00 UTC 2021'
      );
      (execSync as jest.Mock).mockReturnValue(expiredOutput);

      const result = checkCertificateExpiration(
        '/path/to/keystore.keystore',
        'password',
        'mykey',
        30
      );

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('expired');
    });
  });

  describe('validateCertificateSubjectDN', () => {
    it('should validate matching subject DN', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (execSync as jest.Mock).mockReturnValue(mockCertificateOutput);

      const result = validateCertificateSubjectDN(
        '/path/to/keystore.keystore',
        'password',
        'mykey',
        'CN=MyApp, O=MyCompany, C=US'
      );

      expect(result.isValid).toBe(true);
      expect(result.message).toContain('matches');
    });

    it('should fail for non-matching subject DN', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (execSync as jest.Mock).mockReturnValue(mockCertificateOutput);

      const result = validateCertificateSubjectDN(
        '/path/to/keystore.keystore',
        'password',
        'mykey',
        'CN=DifferentApp, O=OtherCompany, C=US'
      );

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('does not match');
    });

    it('should handle DN normalization', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (execSync as jest.Mock).mockReturnValue(mockCertificateOutput);

      // Test with different spacing
      const result = validateCertificateSubjectDN(
        '/path/to/keystore.keystore',
        'password',
        'mykey',
        'CN = MyApp , O = MyCompany , C = US'
      );

      expect(result.isValid).toBe(true);
    });
  });
});
