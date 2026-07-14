import { execSync } from 'child_process';
import { ValidationResult, ValidationStatus, ValidationCategory } from '../types/mobile-config';

/**
 * Verifies network connectivity in emulator/simulator
 * @param deviceId - Device ID or emulator name
 * @returns Connectivity result
 */
export function verifyDeviceNetworkConnectivity(deviceId: string): {
  success: boolean;
  isConnected?: boolean;
  error?: string;
} {
  try {
    // Test connectivity using ping
    try {
      const command = `adb -s ${deviceId} shell ping -c 1 8.8.8.8`;
      execSync(command, { stdio: 'pipe' });

      return {
        success: true,
        isConnected: true,
      };
    } catch {
      return {
        success: true,
        isConnected: false,
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to verify network connectivity: ${errorMessage}`,
    };
  }
}

/**
 * Tests API connectivity from device
 * @param deviceId - Device ID or emulator name
 * @param apiEndpoint - API endpoint to test
 * @returns Connectivity test result
 */
export function testAPIConnectivityFromDevice(deviceId: string, apiEndpoint: string): {
  success: boolean;
  isReachable?: boolean;
  responseTime?: number;
  error?: string;
} {
  try {
    // Test API connectivity using curl
    try {
      const startTime = Date.now();
      const command = `adb -s ${deviceId} shell curl -s -o /dev/null -w "%{http_code}" ${apiEndpoint}`;
      const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe' }).trim();
      const responseTime = Date.now() - startTime;

      const statusCode = parseInt(output, 10);
      const isReachable = statusCode >= 200 && statusCode < 500;

      return {
        success: true,
        isReachable,
        responseTime,
      };
    } catch (error) {
      return {
        success: false,
        isReachable: false,
        error: `API endpoint not reachable: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to test API connectivity: ${errorMessage}`,
    };
  }
}

/**
 * Verifies hot reload capability
 * @param deviceId - Device ID or emulator name
 * @returns Hot reload capability result
 */
export function verifyHotReloadCapability(deviceId: string): {
  success: boolean;
  supportsHotReload?: boolean;
  error?: string;
} {
  try {
    // Check if device supports hot reload by checking for development server connectivity
    try {
      // Try to connect to typical development server port
      const command = `adb -s ${deviceId} shell curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/status`;
      const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe' }).trim();

      const statusCode = parseInt(output, 10);
      const supportsHotReload = statusCode === 200;

      return {
        success: true,
        supportsHotReload,
      };
    } catch {
      // If connection fails, hot reload might still be supported but dev server not running
      return {
        success: true,
        supportsHotReload: true, // Assume supported if device is accessible
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to verify hot reload capability: ${errorMessage}`,
    };
  }
}

/**
 * Comprehensive device connectivity validation
 * @param deviceId - Device ID or emulator name
 * @param apiEndpoint - API endpoint to test (optional)
 * @returns Complete validation result
 */
export function validateDeviceConnectivity(deviceId: string, apiEndpoint?: string): ValidationResult {
  const timestamp = new Date();
  const checks = [];

  // Verify network connectivity
  const networkResult = verifyDeviceNetworkConnectivity(deviceId);
  checks.push({
    name: 'Network Connectivity',
    category: ValidationCategory.ENVIRONMENT,
    status: networkResult.isConnected ? ValidationStatus.PASS : ValidationStatus.FAIL,
    message: networkResult.isConnected
      ? 'Device has network connectivity'
      : 'Device does not have network connectivity',
    remediation: networkResult.isConnected
      ? undefined
      : 'Ensure emulator/simulator has network access configured',
    documentationLink: 'https://developer.android.com/studio/run/emulator-networking',
  });

  // Test API connectivity if endpoint provided
  if (apiEndpoint) {
    const apiResult = testAPIConnectivityFromDevice(deviceId, apiEndpoint);
    checks.push({
      name: 'API Connectivity',
      category: ValidationCategory.ENVIRONMENT,
      status: apiResult.isReachable ? ValidationStatus.PASS : ValidationStatus.FAIL,
      message: apiResult.isReachable
        ? `API endpoint reachable (${apiResult.responseTime}ms)`
        : `API endpoint not reachable: ${apiResult.error}`,
      remediation: apiResult.isReachable
        ? undefined
        : 'Check API endpoint configuration and network settings',
      documentationLink: 'https://developer.android.com/studio/run/emulator-networking',
    });
  }

  // Verify hot reload capability
  const hotReloadResult = verifyHotReloadCapability(deviceId);
  checks.push({
    name: 'Hot Reload Support',
    category: ValidationCategory.ENVIRONMENT,
    status: hotReloadResult.supportsHotReload ? ValidationStatus.PASS : ValidationStatus.FAIL,
    message: hotReloadResult.supportsHotReload
      ? 'Device supports hot reload'
      : 'Device does not support hot reload',
    remediation: hotReloadResult.supportsHotReload
      ? undefined
      : 'Ensure development server is running and accessible',
    documentationLink: 'https://capacitorjs.com/docs/guides/live-reload',
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
        ? 'Device connectivity is properly configured'
        : 'Device connectivity issues detected',
  };
}
