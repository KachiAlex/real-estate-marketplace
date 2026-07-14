import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

/**
 * Initialize Capacitor and configure plugins
 * This function should be called before React renders
 */
export async function initializeCapacitor() {
  // Check if running on native platform
  if (!Capacitor.isNativePlatform()) {
    console.log('[Capacitor] Running in web mode - skipping native initialization');
    return;
  }

  try {
    console.log('[Capacitor] Initializing Capacitor on', Capacitor.getPlatform());

    // Configure Status Bar
    await configureStatusBar();

    // Configure Safe Area
    await configureSafeArea();

    // Configure HTTP Plugin - now awaited
    await configureHttpPlugin();

    // Configure Cookies Plugin - now awaited
    await configureCookiesPlugin();

    console.log('[Capacitor] Initialization completed successfully');
  } catch (error) {
    console.error('[Capacitor] Initialization error:', error);
    // Don't throw - allow app to continue even if initialization partially fails
  }
}

/**
 * Configure the Status Bar plugin
 */
async function configureStatusBar() {
  try {
    const platform = Capacitor.getPlatform();

    if (platform === 'ios') {
      // iOS: Dark status bar with orange background
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#f97316' });
    } else if (platform === 'android') {
      // Android: Light status bar with orange background
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setBackgroundColor({ color: '#f97316' });
    }

    console.log('[Capacitor] Status Bar configured');
  } catch (error) {
    console.warn('[Capacitor] Failed to configure Status Bar:', error);
  }
}

/**
 * Configure Safe Area insets for notched devices
 */
async function configureSafeArea() {
  try {
    // Set default safe area insets (SafeArea plugin may not be available)
    document.documentElement.style.setProperty('--safe-area-inset-top', '0px');
    document.documentElement.style.setProperty('--safe-area-inset-bottom', '0px');
    document.documentElement.style.setProperty('--safe-area-inset-left', '0px');
    document.documentElement.style.setProperty('--safe-area-inset-right', '0px');
    console.log('[Capacitor] Safe Area configured with defaults');
  } catch (error) {
    console.warn('[Capacitor] Failed to configure Safe Area:', error);
    // Set defaults on error
    document.documentElement.style.setProperty('--safe-area-inset-top', '0px');
    document.documentElement.style.setProperty('--safe-area-inset-bottom', '0px');
    document.documentElement.style.setProperty('--safe-area-inset-left', '0px');
    document.documentElement.style.setProperty('--safe-area-inset-right', '0px');
  }
}

/**
 * Configure HTTP Plugin for API calls
 */
async function configureHttpPlugin() {
  try {
    console.log('[Capacitor] HTTP Plugin will be used for native API calls');
    // HTTP plugin is configured in capacitor.config.ts
    // Additional configuration can be done here if needed
  } catch (error) {
    console.warn('[Capacitor] Failed to configure HTTP Plugin:', error);
  }
}

/**
 * Configure Cookies Plugin for session management
 */
async function configureCookiesPlugin() {
  try {
    console.log('[Capacitor] Cookies Plugin will be used for session management');
    // Cookies plugin is configured in capacitor.config.ts
    // Additional configuration can be done here if needed
  } catch (error) {
    console.warn('[Capacitor] Failed to configure Cookies Plugin:', error);
  }
}

/**
 * Get the current platform (ios, android, or web)
 */
export function getPlatform() {
  return Capacitor.getPlatform();
}

/**
 * Check if running on native platform
 */
export function isNativePlatform() {
  return Capacitor.isNativePlatform();
}

/**
 * Check if running on iOS
 */
export function isIOS() {
  return getPlatform() === 'ios';
}

/**
 * Check if running on Android
 */
export function isAndroid() {
  return getPlatform() === 'android';
}

/**
 * Check if running on web
 */
export function isWeb() {
  return !isNativePlatform();
}

/**
 * Get device information
 */
export function getDeviceInfo() {
  return {
    platform: getPlatform(),
    isNative: isNativePlatform(),
    isIOS: isIOS(),
    isAndroid: isAndroid(),
    isWeb: isWeb(),
  };
}

/**
 * Setup global error handler for Capacitor
 */
export function setupCapacitorErrorHandler() {
  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    console.error('[Capacitor Error Handler] Global error caught:', event.error);
    logCapacitorError({
      type: 'error',
      message: event.message,
      stack: event.error?.stack,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[Capacitor Error Handler] Unhandled promise rejection:', event.reason);
    logCapacitorError({
      type: 'unhandledRejection',
      message: event.reason?.message || String(event.reason),
      stack: event.reason?.stack,
    });
  });
}

/**
 * Log errors for debugging
 */
function logCapacitorError(error) {
  // Log to console
  console.error('[Capacitor Error Log]', error);

  // Send to backend for debugging (optional)
  if (isNativePlatform()) {
    const errorData = {
      ...error,
      platform: getPlatform(),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };

    // Attempt to send error to backend
    fetch('/api/logs/error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorData),
    }).catch((err) => {
      console.error('[Capacitor Error Handler] Failed to log error to backend:', err);
    });
  }
}
