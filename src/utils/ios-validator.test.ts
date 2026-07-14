/**
 * Unit Tests for iOS SDK and Xcode Validation Module
 *
 * Tests for Xcode detection and version verification, iOS SDK detection,
 * and SDK version validation.
 */

import { execSync } from 'child_process';
import {
  detectXcodeInstallation,
  verifyXcodeVersion,
  detectAvailableIosSdks,
  verifyIosSdkVersion,
} from './ios-validator';

// Mock child_process
jest.mock('child_process');

// Suppress console output during tests
beforeAll(() => {
  jest.spyOn(console, 'debug').mockImplementation(() => {});
  jest.spyOn(console, 'info').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe('iOS SDK and Xcode Validation Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('detectXcodeInstallation', () => {
    it('should detect Xcode installation and version', () => {
      const xcodeSelectOutput = '/Applications/Xcode.app/Contents/Developer';
      const versionOutput = 'Xcode 15.0\nBuild 15A240d';

      (execSync as jest.Mock)
        .mockReturnValueOnce(xcodeSelectOutput)
        .mockReturnValueOnce(versionOutput);

      const result = detectXcodeInstallation();

      expect(result.isInstalled).toBe(true);
      expect(result.path).toBe(xcodeSelectOutput);
      expect(result.version).toBe('15.0');
    });

    it('should return not installed when xcode-select fails', () => {
      (execSync as jest.Mock).mockImplementation(() => {
        throw new Error('xcode-select: error: unable to get active developer directory');
      });

      const result = detectXcodeInstallation();

      expect(result.isInstalled).toBe(false);
      expect(result.path).toBeNull();
      expect(result.version).toBeNull();
    });

    it('should handle version extraction failure gracefully', () => {
      const xcodeSelectOutput = '/Applications/Xcode.app/Contents/Developer';
      const versionOutput = 'Invalid version output';

      (execSync as jest.Mock)
        .mockReturnValueOnce(xcodeSelectOutput)
        .mockReturnValueOnce(versionOutput);

      const result = detectXcodeInstallation();

      expect(result.isInstalled).toBe(true);
      expect(result.path).toBe(xcodeSelectOutput);
      expect(result.version).toBeNull();
    });
  });

  describe('verifyXcodeVersion', () => {
    it('should verify Xcode version 15.0 or higher', () => {
      const xcodeSelectOutput = '/Applications/Xcode.app/Contents/Developer';
      const versionOutput = 'Xcode 15.0\nBuild 15A240d';

      (execSync as jest.Mock)
        .mockReturnValueOnce(xcodeSelectOutput)
        .mockReturnValueOnce(versionOutput);

      const result = verifyXcodeVersion();

      expect(result.isValid).toBe(true);
      expect(result.installedVersion).toBe('15.0');
    });

    it('should verify Xcode version 15.1 or higher', () => {
      const xcodeSelectOutput = '/Applications/Xcode.app/Contents/Developer';
      const versionOutput = 'Xcode 15.1\nBuild 15B42';

      (execSync as jest.Mock)
        .mockReturnValueOnce(xcodeSelectOutput)
        .mockReturnValueOnce(versionOutput);

      const result = verifyXcodeVersion();

      expect(result.isValid).toBe(true);
      expect(result.installedVersion).toBe('15.1');
    });

    it('should fail verification for Xcode version below 15.0', () => {
      const xcodeSelectOutput = '/Applications/Xcode.app/Contents/Developer';
      const versionOutput = 'Xcode 14.3\nBuild 14E222b';

      (execSync as jest.Mock)
        .mockReturnValueOnce(xcodeSelectOutput)
        .mockReturnValueOnce(versionOutput);

      const result = verifyXcodeVersion();

      expect(result.isValid).toBe(false);
      expect(result.installedVersion).toBe('14.3');
    });

    it('should fail verification when Xcode is not installed', () => {
      (execSync as jest.Mock).mockImplementation(() => {
        throw new Error('xcode-select: error');
      });

      const result = verifyXcodeVersion();

      expect(result.isValid).toBe(false);
      expect(result.installedVersion).toBeNull();
    });
  });

  describe('detectAvailableIosSdks', () => {
    it('should detect available iOS SDKs', () => {
      const showSdksOutput = `iOS SDKs:
\t-sdk iphoneos14.0
\t-sdk iphoneos15.0
\t-sdk iphoneos16.0
\t-sdk iphoneos17.0`;

      (execSync as jest.Mock).mockReturnValue(showSdksOutput);

      const result = detectAvailableIosSdks();

      expect(result.sdks).toContain('14.0');
      expect(result.sdks).toContain('15.0');
      expect(result.sdks).toContain('16.0');
      expect(result.sdks).toContain('17.0');
      expect(result.sdks.length).toBe(4);
    });

    it('should sort iOS SDKs in descending order', () => {
      const showSdksOutput = `iOS SDKs:
\t-sdk iphoneos14.0
\t-sdk iphoneos17.0
\t-sdk iphoneos15.0`;

      (execSync as jest.Mock).mockReturnValue(showSdksOutput);

      const result = detectAvailableIosSdks();

      expect(result.sdks[0]).toBe('17.0');
      expect(result.sdks[1]).toBe('15.0');
      expect(result.sdks[2]).toBe('14.0');
    });

    it('should return empty array when no iOS SDKs found', () => {
      const showSdksOutput = `macOS SDKs:
\t-sdk macosx14.0`;

      (execSync as jest.Mock).mockReturnValue(showSdksOutput);

      const result = detectAvailableIosSdks();

      expect(result.sdks).toEqual([]);
      expect(result.message).toContain('No iOS SDKs');
    });

    it('should handle xcodebuild failure', () => {
      (execSync as jest.Mock).mockImplementation(() => {
        throw new Error('xcodebuild: error');
      });

      const result = detectAvailableIosSdks();

      expect(result.sdks).toEqual([]);
      expect(result.message).toContain('Error');
    });
  });

  describe('verifyIosSdkVersion', () => {
    it('should verify iOS SDK 14.0 or higher', () => {
      const showSdksOutput = `iOS SDKs:
\t-sdk iphoneos14.0
\t-sdk iphoneos15.0`;

      (execSync as jest.Mock).mockReturnValue(showSdksOutput);

      const result = verifyIosSdkVersion();

      expect(result.isValid).toBe(true);
      expect(result.installedVersion).toBe('15.0');
    });

    it('should verify iOS SDK 17.0 or higher', () => {
      const showSdksOutput = `iOS SDKs:
\t-sdk iphoneos17.0`;

      (execSync as jest.Mock).mockReturnValue(showSdksOutput);

      const result = verifyIosSdkVersion();

      expect(result.isValid).toBe(true);
      expect(result.installedVersion).toBe('17.0');
    });

    it('should fail verification when iOS SDK is below 14.0', () => {
      const showSdksOutput = `iOS SDKs:
\t-sdk iphoneos13.0`;

      (execSync as jest.Mock).mockReturnValue(showSdksOutput);

      const result = verifyIosSdkVersion();

      expect(result.isValid).toBe(false);
      expect(result.installedVersion).toBe('13.0');
    });

    it('should fail verification when no iOS SDKs found', () => {
      const showSdksOutput = `macOS SDKs:
\t-sdk macosx14.0`;

      (execSync as jest.Mock).mockReturnValue(showSdksOutput);

      const result = verifyIosSdkVersion();

      expect(result.isValid).toBe(false);
      expect(result.installedVersion).toBeNull();
    });
  });
});
