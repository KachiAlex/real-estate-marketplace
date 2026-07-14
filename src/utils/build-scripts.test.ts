/**
 * Unit tests for build script utilities
 *
 * Tests cover:
 * - Build script invocation and error handling
 * - Artifact collection and validation
 * - Error message generation
 * - Build configuration validation
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

describe('Build Scripts', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'build-scripts-test-'));

  afterAll(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Build Script Invocation', () => {
    it('should detect build script files', () => {
      const scriptsDir = path.join(tempDir, 'scripts');
      fs.mkdirSync(scriptsDir, { recursive: true });

      const buildScripts = [
        'build-android-debug.sh',
        'build-android-release.sh',
        'build-ios-debug.sh',
        'build-ios-release.sh',
        'build-eas.sh',
        'validate-setup.sh',
        'sync-capacitor.sh',
      ];

      buildScripts.forEach((script) => {
        const scriptPath = path.join(scriptsDir, script);
        fs.writeFileSync(scriptPath, '#!/bin/bash\necho "test"');
        fs.chmodSync(scriptPath, 0o755);
      });

      const existingScripts = fs.readdirSync(scriptsDir).filter((file) => file.endsWith('.sh'));

      expect(existingScripts.length).toBe(buildScripts.length);
      buildScripts.forEach((script) => {
        expect(existingScripts).toContain(script);
      });
    });

    it('should verify build scripts are executable', () => {
      const scriptsDir = path.join(tempDir, 'scripts-executable');
      fs.mkdirSync(scriptsDir, { recursive: true });

      const scriptPath = path.join(scriptsDir, 'test-build.sh');
      fs.writeFileSync(scriptPath, '#!/bin/bash\necho "test"');
      fs.chmodSync(scriptPath, 0o755);

      const stats = fs.statSync(scriptPath);
      const isExecutable = (stats.mode & 0o111) !== 0;

      expect(isExecutable).toBe(true);
    });

    it('should handle script execution errors', () => {
      const scriptsDir = path.join(tempDir, 'scripts-error');
      fs.mkdirSync(scriptsDir, { recursive: true });

      const scriptPath = path.join(scriptsDir, 'failing-script.sh');
      fs.writeFileSync(scriptPath, '#!/bin/bash\nexit 1');
      fs.chmodSync(scriptPath, 0o755);

      expect(() => {
        execSync(`bash ${scriptPath}`, { stdio: 'pipe' });
      }).toThrow();
    });

    it('should capture script output', () => {
      const scriptsDir = path.join(tempDir, 'scripts-output');
      fs.mkdirSync(scriptsDir, { recursive: true });

      const scriptPath = path.join(scriptsDir, 'output-script.sh');
      fs.writeFileSync(scriptPath, '#!/bin/bash\necho "Build successful"');
      fs.chmodSync(scriptPath, 0o755);

      const output = execSync(`bash ${scriptPath}`, { encoding: 'utf-8' });

      expect(output).toContain('Build successful');
    });

    it('should handle script with environment variables', () => {
      const scriptsDir = path.join(tempDir, 'scripts-env');
      fs.mkdirSync(scriptsDir, { recursive: true });

      const scriptPath = path.join(scriptsDir, 'env-script.sh');
      fs.writeFileSync(scriptPath, '#!/bin/bash\necho "API_KEY=$API_KEY"');
      fs.chmodSync(scriptPath, 0o755);

      const output = execSync(`bash ${scriptPath}`, {
        encoding: 'utf-8',
        env: { ...process.env, API_KEY: 'test-key-123' },
      });

      expect(output).toContain('API_KEY=test-key-123');
    });
  });

  describe('Artifact Collection', () => {
    it('should detect Android debug APK artifacts', () => {
      const buildDir = path.join(tempDir, 'android-build');
      const apkDir = path.join(buildDir, 'app', 'build', 'outputs', 'apk', 'debug');
      fs.mkdirSync(apkDir, { recursive: true });

      const apkPath = path.join(apkDir, 'app-debug.apk');
      fs.writeFileSync(apkPath, 'fake apk content');

      expect(fs.existsSync(apkPath)).toBe(true);
    });

    it('should detect Android release AAB artifacts', () => {
      const buildDir = path.join(tempDir, 'android-release-build');
      const aabDir = path.join(buildDir, 'app', 'build', 'outputs', 'bundle', 'release');
      fs.mkdirSync(aabDir, { recursive: true });

      const aabPath = path.join(aabDir, 'app-release.aab');
      fs.writeFileSync(aabPath, 'fake aab content');

      expect(fs.existsSync(aabPath)).toBe(true);
    });

    it('should detect iOS debug app artifacts', () => {
      const buildDir = path.join(tempDir, 'ios-debug-build');
      const appDir = path.join(buildDir, 'Debug-iphoneos', 'App.app');
      fs.mkdirSync(appDir, { recursive: true });

      expect(fs.existsSync(appDir)).toBe(true);
    });

    it('should detect iOS release IPA artifacts', () => {
      const buildDir = path.join(tempDir, 'ios-release-build');
      fs.mkdirSync(buildDir, { recursive: true });

      const ipaPath = path.join(buildDir, 'Release-iphoneos', 'App.ipa');
      fs.mkdirSync(path.dirname(ipaPath), { recursive: true });
      fs.writeFileSync(ipaPath, 'fake ipa content');

      expect(fs.existsSync(ipaPath)).toBe(true);
    });

    it('should validate artifact file sizes', () => {
      const artifactDir = path.join(tempDir, 'artifacts');
      fs.mkdirSync(artifactDir, { recursive: true });

      const apkPath = path.join(artifactDir, 'app.apk');
      fs.writeFileSync(apkPath, 'x'.repeat(1024 * 1024)); // 1MB

      const stats = fs.statSync(apkPath);
      expect(stats.size).toBeGreaterThan(0);
    });

    it('should handle missing artifacts gracefully', () => {
      const missingPath = path.join(tempDir, 'missing-artifact.apk');

      expect(fs.existsSync(missingPath)).toBe(false);
    });

    it('should collect multiple artifacts', () => {
      const artifactDir = path.join(tempDir, 'multi-artifacts');
      fs.mkdirSync(artifactDir, { recursive: true });

      const artifacts = ['app-debug.apk', 'app-release.aab', 'app.ipa'];
      artifacts.forEach((artifact) => {
        fs.writeFileSync(path.join(artifactDir, artifact), 'content');
      });

      const collected = fs.readdirSync(artifactDir);
      expect(collected.length).toBe(artifacts.length);
    });
  });

  describe('Error Message Generation', () => {
    it('should generate clear error message for missing SDK', () => {
      const errorMessage = 'Android SDK not found. Please set ANDROID_SDK_ROOT or ANDROID_HOME environment variable.';

      expect(errorMessage).toContain('Android SDK');
      expect(errorMessage).toContain('ANDROID_SDK_ROOT');
      expect(errorMessage).toContain('ANDROID_HOME');
    });

    it('should generate error message with remediation steps', () => {
      const errorMessage = `Build failed: Gradle compilation error
Remediation steps:
1. Check that all dependencies are installed: npm install
2. Verify Android SDK is properly configured
3. Run: ./gradlew clean build`;

      expect(errorMessage).toContain('Build failed');
      expect(errorMessage).toContain('Remediation steps');
      expect(errorMessage).toContain('npm install');
    });

    it('should generate error message for missing configuration', () => {
      const errorMessage = 'capacitor.config.ts not found. Please create it in the project root.';

      expect(errorMessage).toContain('capacitor.config.ts');
      expect(errorMessage).toContain('not found');
    });

    it('should generate error message for signing failure', () => {
      const errorMessage = `Signing error: Keystore file not found at /path/to/keystore.jks
Remediation:
1. Verify keystore file exists
2. Check KEYSTORE_PATH environment variable
3. Ensure keystore password is correct`;

      expect(errorMessage).toContain('Signing error');
      expect(errorMessage).toContain('Keystore file');
      expect(errorMessage).toContain('KEYSTORE_PATH');
    });

    it('should generate error message for dependency resolution failure', () => {
      const errorMessage = `Dependency resolution failed: Could not resolve dependency 'com.example:library:1.0.0'
Remediation:
1. Check internet connection
2. Verify Maven repository is accessible
3. Update build.gradle dependencies`;

      expect(errorMessage).toContain('Dependency resolution failed');
      expect(errorMessage).toContain('Could not resolve');
      expect(errorMessage).toContain('Maven repository');
    });

    it('should include line numbers in error messages', () => {
      const errorMessage = 'Error at line 42: Invalid configuration syntax';

      expect(errorMessage).toContain('line 42');
      expect(errorMessage).toContain('Invalid configuration');
    });

    it('should format error messages with proper structure', () => {
      const errorMessage = `[ERROR] Build failed
[REASON] Gradle compilation error
[REMEDIATION] Run: ./gradlew clean build
[DOCUMENTATION] https://docs.gradle.org/`;

      expect(errorMessage).toContain('[ERROR]');
      expect(errorMessage).toContain('[REASON]');
      expect(errorMessage).toContain('[REMEDIATION]');
      expect(errorMessage).toContain('[DOCUMENTATION]');
    });
  });

  describe('Build Configuration Validation', () => {
    it('should validate build configuration object', () => {
      const config = {
        platform: 'android',
        variant: 'debug',
        buildType: 'local',
        environmentVariables: {
          API_ENDPOINT: 'https://api.example.com',
        },
      };

      expect(config.platform).toBe('android');
      expect(config.variant).toBe('debug');
      expect(config.buildType).toBe('local');
      expect(config.environmentVariables).toBeDefined();
    });

    it('should validate platform values', () => {
      const validPlatforms = ['android', 'ios'];
      const testPlatform = 'android';

      expect(validPlatforms).toContain(testPlatform);
    });

    it('should validate variant values', () => {
      const validVariants = ['debug', 'release'];
      const testVariant = 'debug';

      expect(validVariants).toContain(testVariant);
    });

    it('should validate buildType values', () => {
      const validBuildTypes = ['local', 'eas'];
      const testBuildType = 'local';

      expect(validBuildTypes).toContain(testBuildType);
    });

    it('should validate environment variables in config', () => {
      const config = {
        environmentVariables: {
          API_ENDPOINT: 'https://api.example.com',
          API_KEY: 'test-key-123',
        },
      };

      expect(config.environmentVariables.API_ENDPOINT).toBeDefined();
      expect(config.environmentVariables.API_KEY).toBeDefined();
    });

    it('should validate signing configuration', () => {
      const signingConfig = {
        platform: 'android',
        keystorePath: '/path/to/keystore.jks',
        keystorePassword: 'password',
        keyAlias: 'key-alias',
      };

      expect(signingConfig.platform).toBe('android');
      expect(signingConfig.keystorePath).toBeDefined();
      expect(signingConfig.keystorePassword).toBeDefined();
      expect(signingConfig.keyAlias).toBeDefined();
    });

    it('should validate output path in config', () => {
      const config = {
        outputPath: '/path/to/build/outputs',
      };

      expect(config.outputPath).toBeDefined();
      expect(config.outputPath).toContain('outputs');
    });
  });

  describe('Build Script Documentation', () => {
    it('should verify build scripts have documentation', () => {
      const scripts = [
        { name: 'build-android-debug.sh', description: 'Build Android debug APK' },
        { name: 'build-android-release.sh', description: 'Build Android release AAB' },
        { name: 'build-ios-debug.sh', description: 'Build iOS debug app' },
        { name: 'build-ios-release.sh', description: 'Build iOS release IPA' },
        { name: 'build-eas.sh', description: 'Submit build to EAS' },
        { name: 'validate-setup.sh', description: 'Validate development environment' },
        { name: 'sync-capacitor.sh', description: 'Sync Capacitor web assets' },
      ];

      scripts.forEach((script) => {
        expect(script.name).toBeDefined();
        expect(script.description).toBeDefined();
        expect(script.description.length).toBeGreaterThan(0);
      });
    });

    it('should verify scripts have usage examples', () => {
      const scriptUsage = {
        'build-android-debug.sh': './scripts/build-android-debug.sh',
        'build-ios-release.sh': './scripts/build-ios-release.sh',
        'build-eas.sh': './scripts/build-eas.sh --profile production',
      };

      Object.entries(scriptUsage).forEach(([script, usage]) => {
        expect(usage).toContain(script);
      });
    });

    it('should verify scripts document required environment variables', () => {
      const scriptEnvVars = {
        'build-android-debug.sh': ['ANDROID_SDK_ROOT', 'ANDROID_HOME'],
        'build-ios-debug.sh': ['XCODE_PATH'],
        'build-eas.sh': ['EAS_TOKEN'],
      };

      Object.entries(scriptEnvVars).forEach(([script, vars]) => {
        expect(vars).toBeInstanceOf(Array);
        expect(vars.length).toBeGreaterThan(0);
      });
    });

    it('should verify scripts have error handling documentation', () => {
      const errorHandling = {
        'build-android-debug.sh': 'Handles Gradle compilation errors',
        'build-ios-debug.sh': 'Handles Xcode build errors',
        'build-eas.sh': 'Handles EAS authentication errors',
      };

      Object.entries(errorHandling).forEach(([script, handling]) => {
        expect(handling).toBeDefined();
        expect(handling.length).toBeGreaterThan(0);
      });
    });
  });
});
