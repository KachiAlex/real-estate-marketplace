import { execSync } from 'child_process';
import { ValidationResult, ValidationStatus, ValidationCategory } from '../types/mobile-config';

/**
 * Represents an iOS simulator
 */
export interface IOSSimulator {
  name: string;
  udid: string;
  iosVersion: string;
  state: 'Booted' | 'Shutdown' | 'Unknown';
}

/**
 * Detects available iOS simulators
 * @returns List of available simulators
 */
export function detectAvailableSimulators(): {
  success: boolean;
  simulators?: IOSSimulator[];
  error?: string;
} {
  try {
    if (process.platform !== 'darwin') {
      return {
        success: false,
        error: 'iOS simulator detection only available on macOS',
      };
    }

    // List available simulators
    try {
      const output = execSync('xcrun simctl list devices --json', {
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      const data = JSON.parse(output);
      const simulators: IOSSimulator[] = [];

      // Extract simulators from JSON output
      for (const [iosVersion, devices] of Object.entries(data.devices || {})) {
        if (Array.isArray(devices)) {
          for (const device of devices) {
            const deviceData = device as any;
            simulators.push({
              name: deviceData.name,
              udid: deviceData.udid,
              iosVersion: iosVersion.replace('iOS ', ''),
              state: deviceData.state || 'Unknown',
            });
          }
        }
      }

      return {
        success: true,
        simulators,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to list simulators. Ensure Xcode is properly installed.',
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to detect simulators: ${errorMessage}`,
    };
  }
}

/**
 * Verifies simulator with iOS 14.0+ is available
 * @returns Verification result
 */
export function verifyModernSimulatorAvailable(): {
  success: boolean;
  simulator?: IOSSimulator;
  error?: string;
} {
  try {
    if (process.platform !== 'darwin') {
      return {
        success: false,
        error: 'iOS simulator verification only available on macOS',
      };
    }

    const detectResult = detectAvailableSimulators();
    if (!detectResult.success) {
      return {
        success: false,
        error: detectResult.error,
      };
    }

    // Find simulator with iOS 14.0+
    const modernSimulator = detectResult.simulators?.find((s) => {
      const version = parseFloat(s.iosVersion);
      return version >= 14.0;
    });

    if (!modernSimulator) {
      return {
        success: false,
        error: 'No simulator with iOS 14.0+ found',
      };
    }

    return {
      success: true,
      simulator: modernSimulator,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to verify simulator: ${errorMessage}`,
    };
  }
}

/**
 * Launches an iOS simulator and verifies it starts successfully
 * @param simulatorUdid - UDID of the simulator to launch
 * @param timeout - Timeout in milliseconds (default: 60000)
 * @returns Launch result
 */
export function launchIOSSimulator(simulatorUdid: string, timeout: number = 60000): {
  success: boolean;
  error?: string;
} {
  try {
    if (process.platform !== 'darwin') {
      return {
        success: false,
        error: 'iOS simulator launch only available on macOS',
      };
    }

    // Boot simulator
    try {
      execSync(`xcrun simctl boot ${simulatorUdid}`, {
        stdio: 'pipe',
      });
    } catch (error) {
      // Simulator might already be booted
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('already booted')) {
        return {
          success: false,
          error: `Failed to boot simulator: ${errorMessage}`,
        };
      }
    }

    // Wait for simulator to be ready
    const startTime = Date.now();
    let ready = false;

    while (Date.now() - startTime < timeout) {
      try {
        const output = execSync(`xcrun simctl list devices | grep ${simulatorUdid}`, {
          encoding: 'utf-8',
          stdio: 'pipe',
        });

        if (output.includes('(Booted)')) {
          ready = true;
          break;
        }
      } catch {
        // Simulator not ready yet
      }

      // Wait before checking again
      const waitTime = Math.min(5000, timeout - (Date.now() - startTime));
      if (waitTime > 0) {
        // In a real async implementation, we would await here
      }
    }

    if (!ready) {
      return {
        success: false,
        error: `Simulator did not boot within ${timeout}ms`,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to launch simulator: ${errorMessage}`,
    };
  }
}

/**
 * Shuts down an iOS simulator
 * @param simulatorUdid - UDID of the simulator to shut down
 * @returns Shutdown result
 */
export function shutdownIOSSimulator(simulatorUdid: string): {
  success: boolean;
  error?: string;
} {
  try {
    if (process.platform !== 'darwin') {
      return {
        success: false,
        error: 'iOS simulator shutdown only available on macOS',
      };
    }

    execSync(`xcrun simctl shutdown ${simulatorUdid}`, {
      stdio: 'pipe',
    });

    return {
      success: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to shutdown simulator: ${errorMessage}`,
    };
  }
}

/**
 * Comprehensive iOS simulator validation
 * @returns Complete validation result
 */
export function validateIOSSimulatorSetup(): ValidationResult {
  const timestamp = new Date();
  const checks = [];

  // Check if on macOS
  if (process.platform !== 'darwin') {
    return {
      timestamp,
      overallStatus: ValidationStatus.FAIL,
      checks: [
        {
          name: 'macOS Requirement',
          category: ValidationCategory.ENVIRONMENT,
          status: ValidationStatus.FAIL,
          message: 'iOS simulator is only available on macOS',
          remediation: 'Use a macOS machine to develop for iOS',
          documentationLink: 'https://developer.apple.com/xcode/',
        },
      ],
      summary: 'iOS simulator validation failed: macOS required',
    };
  }

  // Detect available simulators
  const detectResult = detectAvailableSimulators();
  checks.push({
    name: 'Available Simulators',
    category: ValidationCategory.ENVIRONMENT,
    status: detectResult.success ? ValidationStatus.PASS : ValidationStatus.FAIL,
    message: detectResult.success
      ? `${detectResult.simulators?.length || 0} simulator(s) available`
      : detectResult.error || 'Failed to detect simulators',
    remediation: detectResult.success
      ? undefined
      : 'Install Xcode and create a simulator: xcrun simctl create <name> <device-type> <os-version>',
    documentationLink: 'https://developer.apple.com/xcode/',
  });

  // Verify modern simulator available
  const verifyResult = verifyModernSimulatorAvailable();
  checks.push({
    name: 'Modern Simulator Available',
    category: ValidationCategory.ENVIRONMENT,
    status: verifyResult.success ? ValidationStatus.PASS : ValidationStatus.FAIL,
    message: verifyResult.success
      ? `iOS ${verifyResult.simulator?.iosVersion} simulator available`
      : 'No simulator with iOS 14.0+ found',
    remediation: verifyResult.success
      ? undefined
      : 'Create a simulator with iOS 14.0+',
    documentationLink: 'https://developer.apple.com/xcode/',
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
        ? 'iOS simulator is properly configured'
        : 'iOS simulator setup incomplete',
  };
}
