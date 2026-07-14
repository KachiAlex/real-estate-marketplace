import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor Configuration for PropertyArk Mobile App
 * 
 * This configuration ensures:
 * - Correct build output directory (webDir: 'build')
 * - Proper asset loading from the React build output
 * - Platform-specific settings for iOS and Android
 * - Plugin configurations for native features
 * - Server configuration for development and production
 */
const config: CapacitorConfig = {
  // Application identifier - must match the bundle ID in native projects
  appId: 'com.propertyark.app',
  
  // Application display name
  appName: 'PropertyArk',
  
  /**
   * Web Directory Configuration
   * Points to the React build output directory where all static assets are located
   * This directory contains:
   * - index.html (entry point)
   * - static/js/ (JavaScript bundles)
   * - static/css/ (CSS stylesheets)
   * - Public assets (images, fonts, etc.)
   * 
   * The build process (npm run build) outputs to this directory
   * Capacitor syncs these files to native projects during 'npx cap sync'
   */
  webDir: 'build',
  
  // Application version - should match package.json version
  version: '1.0.1',
  
  /**
   * Server Configuration
   * Controls how the app loads web assets on mobile devices
   */
  server: {
    // Allow cleartext (HTTP) traffic for development
    // Set to false in production for security
    cleartext: true,
    
    // Android scheme for loading assets
    // 'https' ensures secure asset loading on Android
    androidScheme: 'https',
    
    // URL configuration for development
    // In production, assets are loaded from the bundled build directory
    // url: 'http://localhost:8100', // Uncomment for live reload during development
  },
  
  /**
   * Plugin Configurations
   * Enables and configures Capacitor plugins for native features
   */
  plugins: {
    /**
     * HTTP Plugin Configuration
     * Handles API calls with proper CORS handling and timeout settings
     * Replaces fetch/axios for better native platform integration
     */
    CapacitorHttp: {
      enabled: true,
      // Read timeout in milliseconds (30 seconds)
      // Time to wait for response data after connection is established
      readTimeout: 30000,
      // Connection timeout in milliseconds (10 seconds)
      // Time to wait for initial connection to be established
      connectTimeout: 10000,
    },

    /**
     * Cookies Plugin Configuration
     * Manages session cookies and cookie handling for API requests
     * Ensures cookies are properly persisted across app sessions
     */
    CapacitorCookies: {
      enabled: true,
    },

    /**
     * Status Bar Plugin Configuration
     * Controls the appearance of the status bar on iOS and Android
     * Ensures the status bar doesn't interfere with app content
     */
    StatusBar: {
      enabled: true,
      // Default background color (orange - PropertyArk brand color)
      // Matches the app's primary brand color
      backgroundColor: '#f97316',
      // Overlay style: true means status bar overlays the app content
      // This allows the app to use the full screen height
      overlaysWebView: true,
    },

    /**
     * Safe Area Plugin Configuration
     * Handles safe area insets for notched devices (iPhone X+, Android notched devices)
     * Prevents content from being cut off by notches or rounded corners
     */
    SafeArea: {
      enabled: true,
      // Margin for safe area insets (in pixels)
      // These values ensure content respects device safe areas
      marginTop: 0,
      marginBottom: 0,
      marginLeft: 0,
      marginRight: 0,
    },
  },

  /**
   * Android Configuration
   * Platform-specific settings for Android builds
   */
  android: {
    // Minimum Android API level (Android 5.0+)
    // Ensures compatibility with older Android devices
    minSdkVersion: 21,
    
    // Target Android API level (Android 14)
    // Should be updated to latest stable API level
    targetSdkVersion: 34,
    
    // Build tools version
    // Must be installed in Android SDK
    buildToolsVersion: '34.0.0',
  },

  /**
   * iOS Configuration
   * Platform-specific settings for iOS builds
   */
  ios: {
    // Minimum iOS deployment target (iOS 14.0+)
    // Ensures compatibility with older iOS devices
    deploymentTarget: '14.0',
    
    // Xcode scheme name
    // Must match the scheme created in Xcode project
    scheme: 'PropertyArk',
  },
};

export default config;
