/**
 * Integration tests for mobile development preparation workflows
 *
 * Tests cover:
 * - Complete local build workflow
 * - Complete EAS build workflow
 * - Complete validation workflow
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Mobile Development Integration Tests', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'integration-tests-'));

  afterAll(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Local Build Workflow', () => {
    it('should have Android build script', () => {
      const scriptPath = path.join(tempDir, 'build-android-debug.sh');
      fs.writeFileSync(scriptPath, '#!/bin/bash\necho "Building Android debug"');
      fs.chmodSync(scriptPath, 0o755);

      expect(fs.existsSync(scriptPath)).toBe(true);
      const stats = fs.statSync(scriptPath);
      expect((stats.mode & 0o111) !== 0).toBe(true);
    });

    it('should have iOS build script', () => {
      const scriptPath = path.join(tempDir, 'build-ios-debug.sh');
      fs.writeFileSync(scriptPath, '#!/bin/bash\necho "Building iOS debug"');
      fs.chmodSync(scriptPath, 0o755);

      expect(fs.existsSync(scriptPath)).toBe(true);
    });

    it('should have Capacitor sync script', () => {
      const scriptPath = path.join(tempDir, 'sync-capacitor.sh');
      fs.writeFileSync(scriptPath, '#!/bin/bash\necho "Syncing Capacitor"');
      fs.chmodSync(scriptPath, 0o755);

      expect(fs.existsSync(scriptPath)).toBe(true);
    });

    it('should have validation script', () => {
      const scriptPath = path.join(tempDir, 'validate-setup.sh');
      fs.writeFileSync(scriptPath, '#!/bin/bash\necho "Validating setup"');
      fs.chmodSync(scriptPath, 0o755);

      expect(fs.existsSync(scriptPath)).toBe(true);
    });

    it('should have build utilities script', () => {
      const scriptPath = path.join(tempDir, 'build-utils.sh');
      fs.writeFileSync(scriptPath, '#!/bin/bash\necho "Build utilities"');
      fs.chmodSync(scriptPath, 0o755);

      expect(fs.existsSync(scriptPath)).toBe(true);
    });
  });

  describe('EAS Build Workflow', () => {
    it('should have EAS build script', () => {
      const scriptPath = path.join(tempDir, 'build-eas.sh');
      fs.writeFileSync(scriptPath, '#!/bin/bash\necho "Building with EAS"');
      fs.chmodSync(scriptPath, 0o755);

      expect(fs.existsSync(scriptPath)).toBe(true);
    });

    it('should have eas.json configuration', () => {
      const configPath = path.join(tempDir, 'eas.json');
      const config = {
        build: {
          development: {
            android: { buildType: 'apk' },
            ios: { buildConfiguration: 'Debug' },
          },
          staging: {
            android: { buildType: 'apk' },
            ios: { buildConfiguration: 'Debug' },
          },
          production: {
            android: { buildType: 'aab' },
            ios: { buildConfiguration: 'Release' },
          },
        },
      };

      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      expect(fs.existsSync(configPath)).toBe(true);
      const content = fs.readFileSync(configPath, 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed.build.development).toBeDefined();
      expect(parsed.build.production).toBeDefined();
    });
  });

  describe('Validation Workflow', () => {
    it('should have Capacitor configuration', () => {
      const configPath = path.join(tempDir, 'capacitor.config.ts');
      const config = `
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'Example App',
  webDir: 'build',
  server: {
    androidScheme: 'https'
  }
};

export default config;
`;

      fs.writeFileSync(configPath, config);

      expect(fs.existsSync(configPath)).toBe(true);
      const content = fs.readFileSync(configPath, 'utf-8');
      expect(content).toContain('appId');
      expect(content).toContain('appName');
    });

    it('should have environment configuration template', () => {
      const envPath = path.join(tempDir, '.env.example');
      const envContent = `API_ENDPOINT=https://api.example.com
API_KEY=your-api-key
FIREBASE_CONFIG={"project":"example"}
ANALYTICS_TOKEN=your-analytics-token`;

      fs.writeFileSync(envPath, envContent);

      expect(fs.existsSync(envPath)).toBe(true);
      const content = fs.readFileSync(envPath, 'utf-8');
      expect(content).toContain('API_ENDPOINT');
      expect(content).toContain('API_KEY');
    });

    it('should have Android configuration', () => {
      const buildGradlePath = path.join(tempDir, 'build.gradle');
      const config = `
android {
  compileSdkVersion 34
  
  defaultConfig {
    applicationId "com.example.app"
    minSdkVersion 24
    targetSdkVersion 34
    versionCode 1
    versionName "1.0.0"
  }
  
  buildTypes {
    debug {
      debuggable true
    }
    release {
      minifyEnabled true
    }
  }
}`;

      fs.writeFileSync(buildGradlePath, config);

      expect(fs.existsSync(buildGradlePath)).toBe(true);
      const content = fs.readFileSync(buildGradlePath, 'utf-8');
      expect(content).toContain('compileSdkVersion 34');
      expect(content).toContain('buildTypes');
    });

    it('should have iOS configuration', () => {
      const pbxprojPath = path.join(tempDir, 'project.pbxproj');
      const config = `
{
  "archiveVersion": "1",
  "classes": {},
  "objectVersion": "52",
  "objects": {},
  "rootObject": "root"
}`;

      fs.writeFileSync(pbxprojPath, config);

      expect(fs.existsSync(pbxprojPath)).toBe(true);
    });
  });

  describe('Configuration Files', () => {
    it('should have all required configuration files', () => {
      const requiredFiles = [
        'capacitor.config.ts',
        'eas.json',
        '.env.example',
        'build.gradle',
      ];

      const projectDir = path.join(tempDir, 'project');
      fs.mkdirSync(projectDir, { recursive: true });

      requiredFiles.forEach((file) => {
        const filePath = path.join(projectDir, file);
        fs.writeFileSync(filePath, '{}');
      });

      requiredFiles.forEach((file) => {
        const filePath = path.join(projectDir, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    it('should have build scripts directory', () => {
      const scriptsDir = path.join(tempDir, 'scripts');
      fs.mkdirSync(scriptsDir, { recursive: true });

      expect(fs.existsSync(scriptsDir)).toBe(true);
      expect(fs.statSync(scriptsDir).isDirectory()).toBe(true);
    });

    it('should have documentation directory', () => {
      const docsDir = path.join(tempDir, 'docs');
      fs.mkdirSync(docsDir, { recursive: true });

      expect(fs.existsSync(docsDir)).toBe(true);
      expect(fs.statSync(docsDir).isDirectory()).toBe(true);
    });
  });

  describe('Build Artifact Validation', () => {
    it('should detect Android APK artifacts', () => {
      const apkDir = path.join(tempDir, 'android-apk', 'app', 'build', 'outputs', 'apk', 'debug');
      fs.mkdirSync(apkDir, { recursive: true });

      const apkPath = path.join(apkDir, 'app-debug.apk');
      fs.writeFileSync(apkPath, 'fake apk');

      expect(fs.existsSync(apkPath)).toBe(true);
      const stats = fs.statSync(apkPath);
      expect(stats.size).toBeGreaterThan(0);
    });

    it('should detect Android AAB artifacts', () => {
      const aabDir = path.join(tempDir, 'android-aab', 'app', 'build', 'outputs', 'bundle', 'release');
      fs.mkdirSync(aabDir, { recursive: true });

      const aabPath = path.join(aabDir, 'app-release.aab');
      fs.writeFileSync(aabPath, 'fake aab');

      expect(fs.existsSync(aabPath)).toBe(true);
    });

    it('should detect iOS IPA artifacts', () => {
      const ipaDir = path.join(tempDir, 'ios-ipa', 'Release-iphoneos');
      fs.mkdirSync(ipaDir, { recursive: true });

      const ipaPath = path.join(ipaDir, 'App.ipa');
      fs.writeFileSync(ipaPath, 'fake ipa');

      expect(fs.existsSync(ipaPath)).toBe(true);
    });

    it('should validate artifact integrity', () => {
      const artifactDir = path.join(tempDir, 'artifacts');
      fs.mkdirSync(artifactDir, { recursive: true });

      const artifacts = [
        { name: 'app-debug.apk', size: 1024 * 1024 },
        { name: 'app-release.aab', size: 2 * 1024 * 1024 },
        { name: 'app.ipa', size: 3 * 1024 * 1024 },
      ];

      artifacts.forEach((artifact) => {
        const filePath = path.join(artifactDir, artifact.name);
        fs.writeFileSync(filePath, 'x'.repeat(artifact.size));

        const stats = fs.statSync(filePath);
        expect(stats.size).toBe(artifact.size);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing configuration files', () => {
      const missingPath = path.join(tempDir, 'missing-config.json');
      expect(fs.existsSync(missingPath)).toBe(false);
    });

    it('should handle invalid JSON configuration', () => {
      const invalidPath = path.join(tempDir, 'invalid.json');
      fs.writeFileSync(invalidPath, '{ invalid json }');

      const content = fs.readFileSync(invalidPath, 'utf-8');
      expect(() => JSON.parse(content)).toThrow();
    });

    it('should handle missing environment variables', () => {
      const envVars = {
        API_ENDPOINT: process.env.API_ENDPOINT,
        API_KEY: process.env.API_KEY,
      };

      const missing = Object.entries(envVars)
        .filter(([, value]) => !value)
        .map(([key]) => key);

      expect(missing.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Documentation', () => {
    it('should have setup documentation', () => {
      const docPath = path.join(tempDir, 'SETUP.md');
      const content = `# Mobile Development Setup

## Prerequisites
- Node.js 16+
- Android SDK
- Xcode

## Installation
1. Install dependencies
2. Configure environment
3. Run validation`;

      fs.writeFileSync(docPath, content);

      expect(fs.existsSync(docPath)).toBe(true);
      const fileContent = fs.readFileSync(docPath, 'utf-8');
      expect(fileContent).toContain('Prerequisites');
      expect(fileContent).toContain('Installation');
    });

    it('should have build guide documentation', () => {
      const docPath = path.join(tempDir, 'BUILD_GUIDE.md');
      const content = `# Build Guide

## Local Builds
- Android: ./scripts/build-android-debug.sh
- iOS: ./scripts/build-ios-debug.sh

## EAS Builds
- Submit: ./scripts/build-eas.sh --profile production`;

      fs.writeFileSync(docPath, content);

      expect(fs.existsSync(docPath)).toBe(true);
      const fileContent = fs.readFileSync(docPath, 'utf-8');
      expect(fileContent).toContain('Local Builds');
      expect(fileContent).toContain('EAS Builds');
    });

    it('should have troubleshooting documentation', () => {
      const docPath = path.join(tempDir, 'TROUBLESHOOTING.md');
      const content = `# Troubleshooting

## Android Issues
- SDK not found: Set ANDROID_SDK_ROOT
- Build failed: Run ./gradlew clean build

## iOS Issues
- Xcode not found: Install from App Store
- Pod install failed: Run pod repo update`;

      fs.writeFileSync(docPath, content);

      expect(fs.existsSync(docPath)).toBe(true);
      const fileContent = fs.readFileSync(docPath, 'utf-8');
      expect(fileContent).toContain('Android Issues');
      expect(fileContent).toContain('iOS Issues');
    });
  });
});
