import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { ValidationResult, ValidationStatus, ValidationCategory } from '../types/mobile-config';

/**
 * Represents detected dependency versions
 */
export interface DetectedVersions {
  capacitor?: string;
  androidSdk?: number;
  iosSdk?: string;
  gradle?: string;
  cocoaPods?: string;
  error?: string;
}

/**
 * Detects installed Capacitor version
 * @returns Capacitor version or error
 */
export function detectCapacitorVersion(): { success: boolean; version?: string; error?: string } {
  try {
    // Check package.json
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return {
        success: false,
        error: 'package.json not found',
      };
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const version =
      packageJson.dependencies?.['@capacitor/core'] ||
      packageJson.devDependencies?.['@capacitor/core'];

    if (!version) {
      return {
        success: false,
        error: '@capacitor/core not found in package.json',
      };
    }

    // Remove version specifiers (^, ~, etc.)
    const cleanVersion = version.replace(/^[\^~>=<]+/, '');

    return {
      success: true,
      version: cleanVersion,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to detect Capacitor version: ${errorMessage}`,
    };
  }
}

/**
 * Detects installed Android SDK version
 * @returns Android SDK API level or error
 */
export function detectAndroidSdkVersion(): { success: boolean; version?: number; error?: string } {
  try {
    // Check local.properties
    const localPropertiesPath = path.join(process.cwd(), 'android', 'local.properties');
    if (!fs.existsSync(localPropertiesPath)) {
      return {
        success: false,
        error: 'android/local.properties not found',
      };
    }

    const content = fs.readFileSync(localPropertiesPath, 'utf-8');
    const match = content.match(/sdk\.dir=(.+)/);

    if (!match) {
      return {
        success: false,
        error: 'sdk.dir not found in local.properties',
      };
    }

    const sdkPath = match[1].trim();

    // Check for highest API level in platforms directory
    const platformsDir = path.join(sdkPath, 'platforms');
    if (!fs.existsSync(platformsDir)) {
      return {
        success: false,
        error: `Android SDK platforms directory not found: ${platformsDir}`,
      };
    }

    const platforms = fs.readdirSync(platformsDir);
    const apiLevels = platforms
      .filter((p) => p.startsWith('android-'))
      .map((p) => parseInt(p.replace('android-', ''), 10))
      .filter((v) => !isNaN(v))
      .sort((a, b) => b - a);

    if (apiLevels.length === 0) {
      return {
        success: false,
        error: 'No Android API levels found in SDK',
      };
    }

    return {
      success: true,
      version: apiLevels[0],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to detect Android SDK version: ${errorMessage}`,
    };
  }
}

/**
 * Detects installed iOS SDK version
 * @returns iOS SDK version or error
 */
export function detectIOSSdkVersion(): { success: boolean; version?: string; error?: string } {
  try {
    if (process.platform !== 'darwin') {
      return {
        success: false,
        error: 'iOS SDK detection only available on macOS',
      };
    }

    // Use xcode-select to find Xcode path
    const xcodeOutput = execSync('xcode-select -p', { encoding: 'utf-8', stdio: 'pipe' }).trim();

    // List available iOS SDKs
    const output = execSync('xcrun --showsdks', { encoding: 'utf-8', stdio: 'pipe' });

    // Extract iOS SDK versions
    const iosMatch = output.match(/iphoneos\s+([\d.]+)/);
    if (!iosMatch) {
      return {
        success: false,
        error: 'No iOS SDK found',
      };
    }

    return {
      success: true,
      version: iosMatch[1],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to detect iOS SDK version: ${errorMessage}`,
    };
  }
}

/**
 * Detects installed Gradle version
 * @returns Gradle version or error
 */
export function detectGradleVersion(): { success: boolean; version?: string; error?: string } {
  try {
    // Check gradle/wrapper/gradle-wrapper.properties
    const wrapperPropsPath = path.join(
      process.cwd(),
      'android',
      'gradle',
      'wrapper',
      'gradle-wrapper.properties'
    );

    if (!fs.existsSync(wrapperPropsPath)) {
      return {
        success: false,
        error: 'gradle-wrapper.properties not found',
      };
    }

    const content = fs.readFileSync(wrapperPropsPath, 'utf-8');
    const match = content.match(/gradle-(\d+\.\d+(?:\.\d+)?)/);

    if (!match) {
      return {
        success: false,
        error: 'Gradle version not found in gradle-wrapper.properties',
      };
    }

    return {
      success: true,
      version: match[1],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to detect Gradle version: ${errorMessage}`,
    };
  }
}

/**
 * Detects installed CocoaPods version
 * @returns CocoaPods version or error
 */
export function detectCocoaPodsVersion(): { success: boolean; version?: string; error?: string } {
  try {
    if (process.platform !== 'darwin') {
      return {
        success: false,
        error: 'CocoaPods detection only available on macOS',
      };
    }

    const output = execSync('pod --version', { encoding: 'utf-8', stdio: 'pipe' }).trim();

    if (!output) {
      return {
        success: false,
        error: 'CocoaPods not installed',
      };
    }

    return {
      success: true,
      version: output,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to detect CocoaPods version: ${errorMessage}`,
    };
  }
}

/**
 * Detects all dependency versions
 * @returns All detected versions
 */
export function detectAllDependencyVersions(): DetectedVersions {
  const capacitor = detectCapacitorVersion();
  const androidSdk = detectAndroidSdkVersion();
  const iosSdk = detectIOSSdkVersion();
  const gradle = detectGradleVersion();
  const cocoaPods = detectCocoaPodsVersion();

  return {
    capacitor: capacitor.success ? capacitor.version : undefined,
    androidSdk: androidSdk.success ? androidSdk.version : undefined,
    iosSdk: iosSdk.success ? iosSdk.version : undefined,
    gradle: gradle.success ? gradle.version : undefined,
    cocoaPods: cocoaPods.success ? cocoaPods.version : undefined,
    error: [capacitor, androidSdk, iosSdk, gradle, cocoaPods]
      .filter((r) => !r.success)
      .map((r) => r.error)
      .join('; '),
  };
}

/**
 * Comprehensive dependency version checking
 * @returns Complete validation result
 */
export function checkDependencyVersions(): ValidationResult {
  const timestamp = new Date();
  const checks = [];

  // Detect Capacitor version
  const capacitorResult = detectCapacitorVersion();
  checks.push({
    name: 'Capacitor Version',
    category: ValidationCategory.DEPENDENCY,
    status: capacitorResult.success ? ValidationStatus.PASS : ValidationStatus.FAIL,
    message: capacitorResult.success
      ? `Capacitor ${capacitorResult.version} detected`
      : capacitorResult.error || 'Failed to detect Capacitor version',
    remediation: capacitorResult.success ? undefined : 'Install Capacitor: npm install @capacitor/core',
    documentationLink: 'https://capacitorjs.com/docs/getting-started',
  });

  // Detect Android SDK version
  const androidSdkResult = detectAndroidSdkVersion();
  checks.push({
    name: 'Android SDK Version',
    category: ValidationCategory.DEPENDENCY,
    status: androidSdkResult.success ? ValidationStatus.PASS : ValidationStatus.FAIL,
    message: androidSdkResult.success
      ? `Android SDK API level ${androidSdkResult.version} detected`
      : androidSdkResult.error || 'Failed to detect Android SDK version',
    remediation: androidSdkResult.success ? undefined : 'Install Android SDK API level 34+',
    documentationLink: 'https://developer.android.com/studio/install',
  });

  // Detect iOS SDK version
  const iosSdkResult = detectIOSSdkVersion();
  checks.push({
    name: 'iOS SDK Version',
    category: ValidationCategory.DEPENDENCY,
    status: iosSdkResult.success ? ValidationStatus.PASS : ValidationStatus.FAIL,
    message: iosSdkResult.success
      ? `iOS SDK ${iosSdkResult.version} detected`
      : iosSdkResult.error || 'Failed to detect iOS SDK version',
    remediation: iosSdkResult.success ? undefined : 'Install Xcode 15.0+ with iOS SDK',
    documentationLink: 'https://developer.apple.com/xcode/',
  });

  // Detect Gradle version
  const gradleResult = detectGradleVersion();
  checks.push({
    name: 'Gradle Version',
    category: ValidationCategory.DEPENDENCY,
    status: gradleResult.success ? ValidationStatus.PASS : ValidationStatus.FAIL,
    message: gradleResult.success
      ? `Gradle ${gradleResult.version} detected`
      : gradleResult.error || 'Failed to detect Gradle version',
    remediation: gradleResult.success ? undefined : 'Update Gradle in gradle-wrapper.properties',
    documentationLink: 'https://gradle.org/releases/',
  });

  // Detect CocoaPods version
  const cocoaPodsResult = detectCocoaPodsVersion();
  checks.push({
    name: 'CocoaPods Version',
    category: ValidationCategory.DEPENDENCY,
    status: cocoaPodsResult.success ? ValidationStatus.PASS : ValidationStatus.FAIL,
    message: cocoaPodsResult.success
      ? `CocoaPods ${cocoaPodsResult.version} detected`
      : cocoaPodsResult.error || 'Failed to detect CocoaPods version',
    remediation: cocoaPodsResult.success ? undefined : 'Install CocoaPods: sudo gem install cocoapods',
    documentationLink: 'https://cocoapods.org/',
  });

  const overallStatus = checks.every((check) => check.status === ValidationStatus.PASS)
    ? ValidationStatus.PASS
    : ValidationStatus.FAIL;

  return {
    timestamp,
    overallStatus,
    checks,
    summary:
      overallStatus === ValidationStatus.PASS
        ? 'All dependency versions detected successfully'
        : 'Some dependency versions could not be detected',
  };
}
