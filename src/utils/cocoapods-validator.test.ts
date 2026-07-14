/**
 * Unit Tests for CocoaPods Validation and Installation Module
 *
 * Tests for CocoaPods detection, version verification, Podfile parsing,
 * and pod install execution.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import {
  detectCocoaPodsInstallation,
  verifyCocoaPodsVersion,
  parseAndValidatePodfile,
  executePodInstall,
  validateCocoaPodsSetup,
} from './cocoapods-validator';

// Mock dependencies
jest.mock('fs');
jest.mock('child_process');

describe('CocoaPods Validation and Installation Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('detectCocoaPodsInstallation', () => {
    it('should detect CocoaPods installation and version', () => {
      (execSync as jest.Mock).mockReturnValue('1.12.1');

      const result = detectCocoaPodsInstallation();

      expect(result.isInstalled).toBe(true);
      expect(result.version).toBe('1.12.1');
      expect(result.message).toContain('1.12.1');
    });

    it('should return not installed when pod command fails', () => {
      (execSync as jest.Mock).mockImplementation(() => {
        throw new Error('pod: command not found');
      });

      const result = detectCocoaPodsInstallation();

      expect(result.isInstalled).toBe(false);
      expect(result.version).toBeNull();
      expect(result.message).toContain('not found');
    });

    it('should handle empty version output', () => {
      (execSync as jest.Mock).mockReturnValue('');

      const result = detectCocoaPodsInstallation();

      expect(result.isInstalled).toBe(true);
      expect(result.version).toBeNull();
    });
  });

  describe('verifyCocoaPodsVersion', () => {
    it('should verify CocoaPods version 1.11.0 or higher', () => {
      (execSync as jest.Mock).mockReturnValue('1.11.0');

      const result = verifyCocoaPodsVersion();

      expect(result.isCompatible).toBe(true);
      expect(result.installedVersion).toBe('1.11.0');
    });

    it('should verify CocoaPods version 1.12.1', () => {
      (execSync as jest.Mock).mockReturnValue('1.12.1');

      const result = verifyCocoaPodsVersion();

      expect(result.isCompatible).toBe(true);
      expect(result.installedVersion).toBe('1.12.1');
    });

    it('should verify CocoaPods version 2.0.0', () => {
      (execSync as jest.Mock).mockReturnValue('2.0.0');

      const result = verifyCocoaPodsVersion();

      expect(result.isCompatible).toBe(true);
      expect(result.installedVersion).toBe('2.0.0');
    });

    it('should fail verification for CocoaPods version below 1.11.0', () => {
      (execSync as jest.Mock).mockReturnValue('1.10.0');

      const result = verifyCocoaPodsVersion();

      expect(result.isCompatible).toBe(false);
      expect(result.installedVersion).toBe('1.10.0');
    });

    it('should fail verification when CocoaPods is not installed', () => {
      (execSync as jest.Mock).mockImplementation(() => {
        throw new Error('pod: command not found');
      });

      const result = verifyCocoaPodsVersion();

      expect(result.isCompatible).toBe(false);
      expect(result.installedVersion).toBeNull();
    });
  });

  describe('parseAndValidatePodfile', () => {
    it('should parse valid Podfile', () => {
      const podfileContent = `platform :ios, '14.0'

target 'App' do
  pod 'Capacitor'
  pod 'CapacitorCordova'
  pod 'Firebase/Core'
end`;

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(podfileContent);

      const result = parseAndValidatePodfile();

      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('ios 14.0');
      expect(result.pods).toContain('Capacitor');
      expect(result.pods).toContain('CapacitorCordova');
      expect(result.pods).toContain('Firebase/Core');
      expect(result.podCount).toBe(3);
    });

    it('should fail validation when Podfile does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = parseAndValidatePodfile();

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('should fail validation when platform is missing', () => {
      const podfileContent = `target 'App' do
  pod 'Capacitor'
end`;

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(podfileContent);

      const result = parseAndValidatePodfile();

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('incomplete');
    });

    it('should fail validation when pods are missing', () => {
      const podfileContent = `platform :ios, '14.0'

target 'App' do
end`;

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(podfileContent);

      const result = parseAndValidatePodfile();

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('incomplete');
    });

    it('should handle Podfile with comments', () => {
      const podfileContent = `# Podfile for iOS app
platform :ios, '14.0'

# Capacitor pods
target 'App' do
  pod 'Capacitor'
  # Firebase pods
  pod 'Firebase/Core'
end`;

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(podfileContent);

      const result = parseAndValidatePodfile();

      expect(result.isValid).toBe(true);
      expect(result.pods.length).toBe(2);
    });

    it('should use default Podfile path when not provided', () => {
      const podfileContent = `platform :ios, '14.0'

target 'App' do
  pod 'Capacitor'
end`;

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(podfileContent);

      const result = parseAndValidatePodfile();

      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.readFileSync).toHaveBeenCalled();
    });
  });

  describe('executePodInstall', () => {
    it('should execute pod install successfully', () => {
      const podInstallOutput = `Analyzing dependencies
Downloading dependencies
Installing Capacitor (5.0.0)
Installing CapacitorCordova (5.0.0)
Pod installation complete!`;

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (execSync as jest.Mock).mockReturnValue(podInstallOutput);

      const result = executePodInstall();

      expect(result.success).toBe(true);
      expect(result.output).toContain('Pod installation complete');
      expect(result.message).toContain('successfully');
    });

    it('should fail when Podfile does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = executePodInstall();

      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('should capture pod install errors', () => {
      const errorOutput = 'error: The dependency `Firebase` is not found';

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (execSync as jest.Mock).mockImplementation(() => {
        throw new Error(errorOutput);
      });

      const result = executePodInstall();

      expect(result.success).toBe(false);
      expect(result.message).toContain('failed');
      expect(result.output).toContain('Firebase');
    });

    it('should use custom iOS project path', () => {
      const customPath = './ios-custom';
      const podInstallOutput = 'Pod installation complete!';

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (execSync as jest.Mock).mockReturnValue(podInstallOutput);

      const result = executePodInstall(customPath);

      expect(result.success).toBe(true);
      expect(execSync).toHaveBeenCalledWith('pod install', expect.objectContaining({ cwd: customPath }));
    });
  });

  describe('validateCocoaPodsSetup', () => {
    it('should validate complete CocoaPods setup', () => {
      const podfileContent = `platform :ios, '14.0'

target 'App' do
  pod 'Capacitor'
end`;

      (execSync as jest.Mock).mockReturnValue('1.12.1');
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(podfileContent);

      const result = validateCocoaPodsSetup();

      expect(result.isValid).toBe(true);
      expect(result.isInstalled).toBe(true);
      expect(result.isCompatible).toBe(true);
      expect(result.podfileValid).toBe(true);
    });

    it('should report failures in CocoaPods setup', () => {
      (execSync as jest.Mock).mockImplementation(() => {
        throw new Error('pod: command not found');
      });
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = validateCocoaPodsSetup();

      expect(result.isValid).toBe(false);
      expect(result.isInstalled).toBe(false);
    });

    it('should identify missing CocoaPods installation', () => {
      (execSync as jest.Mock).mockImplementation(() => {
        throw new Error('pod: command not found');
      });

      const result = validateCocoaPodsSetup();

      expect(result.isInstalled).toBe(false);
      expect(result.message).toContain('not installed');
    });

    it('should identify invalid Podfile', () => {
      const invalidPodfileContent = `target 'App' do
end`;

      (execSync as jest.Mock).mockReturnValue('1.12.1');
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(invalidPodfileContent);

      const result = validateCocoaPodsSetup();

      expect(result.podfileValid).toBe(false);
      expect(result.message).toContain('Podfile invalid');
    });
  });
});
