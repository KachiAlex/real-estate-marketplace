# Capacitor Testing Guide

This guide provides comprehensive instructions for testing the PropertyArk mobile app wrapped with Capacitor on both Android and iOS platforms.

## Table of Contents

1. [Running Tests](#running-tests)
2. [Manual Testing on Android Emulator](#manual-testing-on-android-emulator)
3. [Manual Testing on iOS Simulator](#manual-testing-on-ios-simulator)
4. [Console Log Expectations](#console-log-expectations)
5. [Troubleshooting Guide](#troubleshooting-guide)

## Running Tests

### Unit Tests

Run the Capacitor initialization unit tests:

```bash
npm run frontend:test -- src/capacitor-init.test.ts
```

This runs 24 unit tests covering:
- Capacitor initialization on native platforms
- Platform detection functions
- Device information retrieval
- Error handler setup

### Integration Tests

Run the Capacitor initialization integration tests:

```bash
npm run frontend:test -- src/capacitor-init.integration.test.ts
```

This runs 41 integration tests covering:
- Initialization on iOS platform
- Initialization on Android platform
- Initialization on web platform
- Plugin availability verification
- Error handler setup and functionality
- Graceful degradation when plugins fail
- Platform detection accuracy
- Startup crash prevention

### Run All Tests

Run all Capacitor-related tests:

```bash
npm run frontend:test -- src/capacitor-init
```

### Test Output

Successful test runs will show:
- ✓ All tests passing
- Test count (e.g., "41 passed, 41 total")
- Execution time
- Exit code 0

Example output:
```
PASS  src/capacitor-init.integration.test.ts
  Capacitor Initialization Integration Tests
    Native Platform Initialization
      iOS Platform
        √ should initialize Capacitor on iOS without crashing (11 ms)
        √ should configure status bar for iOS (4 ms)
        ...
    
Test Suites: 1 passed, 1 total
Tests:       41 passed, 41 total
Snapshots:   0 total
Time:        2.81 s
```

## Manual Testing on Android Emulator

### Prerequisites

- Android Studio installed
- Android SDK API 21+ (minimum supported version)
- Android emulator configured and running

### Setup Steps

1. **Start Android Emulator**
   ```bash
   # List available emulators
   emulator -list-avds
   
   # Start an emulator (replace 'Pixel_4_API_30' with your emulator name)
   emulator -avd Pixel_4_API_30
   ```

2. **Build the Web App**
   ```bash
   npm run build
   ```

3. **Sync Capacitor**
   ```bash
   npx cap sync android
   ```

4. **Build Android App**
   ```bash
   # Using Gradle
   cd android
   ./gradlew build
   
   # Or using Android Studio
   # Open android/ folder in Android Studio and click Build > Build Bundle(s) / APK(s)
   ```

5. **Install on Emulator**
   ```bash
   # Using adb
   adb install -r android/app/build/outputs/apk/debug/app-debug.apk
   
   # Or using Android Studio
   # Click Run > Run 'app'
   ```

### Testing Checklist

- [ ] App launches without crashing
- [ ] Status bar is visible and properly styled (orange background)
- [ ] Safe area insets are respected (no content cut off)
- [ ] All UI elements are visible and properly positioned
- [ ] Touch interactions work correctly
- [ ] API calls succeed (if backend is available)
- [ ] Network errors are handled gracefully
- [ ] No console errors in logcat

### Viewing Logs

```bash
# View all logs
adb logcat

# View only app logs
adb logcat | grep PropertyArk

# View Capacitor logs
adb logcat | grep Capacitor

# Save logs to file
adb logcat > android_logs.txt
```

### Common Android Emulator Issues

**Emulator won't start:**
- Ensure virtualization is enabled in BIOS
- Check available disk space (at least 5GB)
- Try deleting and recreating the emulator

**App crashes on startup:**
- Check logcat for error messages
- Verify all dependencies are installed
- Ensure Capacitor is properly initialized

**Slow performance:**
- Allocate more RAM to emulator (Settings > Advanced > RAM)
- Use a higher API level emulator
- Close other applications

## Manual Testing on iOS Simulator

### Prerequisites

- macOS with Xcode installed
- iOS SDK 14.0+ (minimum supported version)
- iOS simulator configured

### Setup Steps

1. **Start iOS Simulator**
   ```bash
   # List available simulators
   xcrun simctl list devices
   
   # Start a simulator (replace 'iPhone 14' with your device)
   open -a Simulator --args -CurrentDeviceUDID <device-udid>
   
   # Or use Xcode: Xcode > Open Developer Tool > Simulator
   ```

2. **Build the Web App**
   ```bash
   npm run build
   ```

3. **Sync Capacitor**
   ```bash
   npx cap sync ios
   ```

4. **Build iOS App**
   ```bash
   # Using xcodebuild
   cd ios/App
   xcodebuild -scheme App -configuration Debug -derivedDataPath build
   
   # Or using Xcode
   # Open ios/App/App.xcworkspace in Xcode and click Product > Build
   ```

5. **Install on Simulator**
   ```bash
   # Using xcrun
   xcrun simctl install booted ios/App/build/Release-iphonesimulator/App.app
   
   # Or using Xcode
   # Click Product > Run
   ```

### Testing Checklist

- [ ] App launches without crashing
- [ ] Status bar is visible and properly styled (orange background)
- [ ] Safe area insets are respected (notch area is avoided)
- [ ] All UI elements are visible and properly positioned
- [ ] Touch interactions work correctly
- [ ] Gestures work as expected
- [ ] API calls succeed (if backend is available)
- [ ] Network errors are handled gracefully
- [ ] No console errors in Xcode console

### Viewing Logs

```bash
# View simulator logs in Xcode
# Window > Devices and Simulators > Select simulator > View Device Logs

# Or view system logs
log stream --predicate 'process == "PropertyArk"'

# View Capacitor logs
log stream --predicate 'process == "PropertyArk" AND message CONTAINS "Capacitor"'
```

### Common iOS Simulator Issues

**Simulator won't start:**
- Restart Xcode
- Reset simulator: `xcrun simctl erase all`
- Check available disk space

**App crashes on startup:**
- Check Xcode console for error messages
- Verify all dependencies are installed
- Ensure Capacitor is properly initialized

**Slow performance:**
- Use a newer iOS version simulator
- Close other applications
- Restart the simulator

## Console Log Expectations

### Successful Initialization Logs

When the app initializes successfully on a native platform, you should see these console logs:

```
[Capacitor] Initializing Capacitor on ios
[Capacitor] Status Bar configured
[Capacitor] Safe Area configured: { top: 44, bottom: 34, left: 0, right: 0 }
[Capacitor] HTTP Plugin available
[Capacitor] Cookies Plugin available
[Capacitor] Initialization completed successfully
```

Or on Android:

```
[Capacitor] Initializing Capacitor on android
[Capacitor] Status Bar configured
[Capacitor] Safe Area configured: { top: 0, bottom: 0, left: 0, right: 0 }
[Capacitor] HTTP Plugin available
[Capacitor] Cookies Plugin available
[Capacitor] Initialization completed successfully
```

### Web Platform Logs

When running in web mode, you should see:

```
[Capacitor] Running in web mode - skipping native initialization
```

### Plugin Availability Logs

If a plugin is not available, you'll see:

```
[Capacitor] HTTP Plugin not available
[Capacitor] Cookies Plugin not available
[Capacitor] Safe Area plugin not available, using defaults
```

### Error Logs

If an error occurs during initialization, you'll see:

```
[Capacitor] Initialization error: [Error details]
```

The app will continue running with default values.

### Error Handler Logs

When errors are caught by the global error handler:

```
[Capacitor Error Handler] Global error caught: [Error details]
[Capacitor Error Handler] Unhandled promise rejection: [Error details]
[Capacitor Error Log] { type: 'error', message: '...', ... }
```

## Troubleshooting Guide

### App Crashes on Startup

**Symptoms:**
- App closes immediately after launching
- No console logs appear

**Solutions:**
1. Check that Capacitor is properly initialized in `src/index.tsx`
2. Verify all Capacitor plugins are installed: `npm list @capacitor/core`
3. Check for TypeScript errors: `npm run frontend:test -- src/capacitor-init.ts`
4. Review platform-specific logs (logcat for Android, Xcode console for iOS)

### Status Bar Not Showing

**Symptoms:**
- Status bar is not visible or not styled correctly
- Status bar color is not orange

**Solutions:**
1. Verify StatusBar plugin is installed: `npm list @capacitor/status-bar`
2. Check that `configureStatusBar()` is being called
3. Verify the color code is correct: `#f97316` (orange)
4. Check platform-specific settings in `capacitor.config.ts`

### Safe Area Not Working

**Symptoms:**
- Content is cut off by notch or rounded corners
- Safe area CSS variables are not set

**Solutions:**
1. Verify SafeArea plugin is available
2. Check that `configureSafeArea()` is being called
3. Verify CSS variables are applied: `--safe-area-inset-top`, etc.
4. Check that viewport meta tag includes `viewport-fit=cover`

### Plugins Not Available

**Symptoms:**
- Console logs show "Plugin not available"
- Native features don't work

**Solutions:**
1. Verify plugins are installed: `npm list @capacitor/http @capacitor/cookies`
2. Run `npx cap sync` to sync plugins to native projects
3. Rebuild native apps
4. Check that plugins are configured in `capacitor.config.ts`

### API Calls Failing

**Symptoms:**
- Network requests fail with CORS errors
- API responses are not received

**Solutions:**
1. Verify API endpoint is correct in environment variables
2. Check that HTTP plugin is configured correctly
3. Verify CORS headers are set correctly
4. Check network connectivity in emulator/simulator
5. Review network logs in browser DevTools or platform-specific logs

### Performance Issues

**Symptoms:**
- App is slow to start
- UI is laggy or unresponsive

**Solutions:**
1. Check bundle size: `npm run build` and review build output
2. Enable code splitting for large components
3. Optimize images and assets
4. Profile app performance using platform-specific tools
5. Check for memory leaks in console

### TypeScript Errors

**Symptoms:**
- Build fails with TypeScript errors
- IDE shows red squiggly lines

**Solutions:**
1. Run type checking: `npm run frontend:test -- src/capacitor-init.ts`
2. Check for missing type definitions
3. Verify imports are correct
4. Update TypeScript: `npm install typescript@latest`

### Test Failures

**Symptoms:**
- Tests fail when running `npm run frontend:test`
- Error messages in test output

**Solutions:**
1. Check that all dependencies are installed: `npm install`
2. Clear Jest cache: `npm run frontend:test -- --clearCache`
3. Review test error messages for specific issues
4. Check that mocks are set up correctly
5. Verify test environment is correct

## Testing Best Practices

1. **Test on Real Devices**: Always test on real devices before release, not just emulators/simulators
2. **Test Multiple Devices**: Test on various device sizes and OS versions
3. **Test Network Conditions**: Test with different network speeds and conditions
4. **Test Error Scenarios**: Test what happens when plugins fail or network is unavailable
5. **Monitor Performance**: Use platform-specific profiling tools to monitor performance
6. **Check Logs**: Always review console logs for errors and warnings
7. **Automate Tests**: Run automated tests as part of CI/CD pipeline
8. **Document Issues**: Document any issues found and their solutions

## Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Capacitor Plugins](https://capacitorjs.com/docs/plugins)
- [Android Emulator Documentation](https://developer.android.com/studio/run/emulator)
- [iOS Simulator Documentation](https://developer.apple.com/documentation/xcode/running-your-app-in-the-simulator-or-on-a-device)
- [PropertyArk Build Guide](./BUILD_GUIDE.md)
- [PropertyArk Setup Guide](./SETUP.md)

## Support

For issues or questions about testing:
1. Check this guide's troubleshooting section
2. Review console logs for error messages
3. Check Capacitor documentation
4. Contact the development team
