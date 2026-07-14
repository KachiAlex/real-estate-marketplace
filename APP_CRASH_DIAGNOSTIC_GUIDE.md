# App Crash Diagnostic Guide

## Overview
The Android APK build is now successful. If the app crashes on startup, this guide will help diagnose the issue.

## Quick Diagnosis Steps

### Step 1: Check Android Logcat
The most reliable way to diagnose app crashes is through Android logcat:

```bash
# View all logs
adb logcat

# Filter for PropertyArk app logs
adb logcat | grep -i propertyark

# Filter for JavaScript errors
adb logcat | grep -i "javascript\|error\|exception"

# Clear logs and start fresh
adb logcat -c
adb logcat
```

### Step 2: Install and Run the APK
```bash
# Install the development APK
adb install android/app/build/outputs/apk/development/debug/app-development-debug.apk

# Launch the app
adb shell am start -n com.realestate.marketplace.dev/.MainActivity

# Watch logs as app starts
adb logcat
```

## Common Crash Scenarios

### Scenario 1: JavaScript Initialization Error
**Symptoms**: App crashes immediately on startup with JavaScript error

**Check these files**:
1. `src/index.js` - Main entry point
   - Verify all imports are correct
   - Check for syntax errors
   - Ensure `setupGlobalUser` is properly exported

2. `src/capacitor-init.ts` - Capacitor initialization
   - Check for plugin configuration errors
   - Verify error handling in try-catch blocks

3. `src/App.js` - Main app component
   - Check for context provider errors
   - Verify route configuration

**Diagnostic code**:
```javascript
// Add to src/index.js before React render
console.log('[App] Starting initialization...');
console.log('[App] setupGlobalUser imported:', typeof setupGlobalUser);
console.log('[App] ErrorBoundary imported:', typeof ErrorBoundary);
console.log('[App] HelmetProvider imported:', typeof HelmetProvider);
```

### Scenario 2: Missing Module Error
**Symptoms**: "Cannot find module" or "Module not found" error

**Check**:
- All imported files exist in the correct location
- File extensions match (`.js` vs `.ts` vs `.tsx`)
- No circular dependencies

**Files to verify**:
```
src/setupGlobalUser.js ✓
src/components/ErrorBoundary.js ✓
src/utils/HelmetShim.js ✓
src/utils/runtimeGuards.js ✓
src/App.js ✓
src/capacitor-init.ts ✓
src/capacitor-init.js ✓
```

### Scenario 3: Capacitor Plugin Error
**Symptoms**: "Plugin not found" or "Capacitor not initialized"

**Check**:
1. Verify `capacitor.config.ts` has correct plugin configuration
2. Check that plugins are properly initialized in `src/capacitor-init.ts`
3. Ensure error handling for missing plugins

**Diagnostic code**:
```typescript
// In src/capacitor-init.ts
console.log('[Capacitor] Platform:', Capacitor.getPlatform());
console.log('[Capacitor] Is native:', Capacitor.isNativePlatform());
console.log('[Capacitor] Available plugins:', Capacitor.getPlugins());
```

### Scenario 4: Context Provider Error
**Symptoms**: "Cannot read property of undefined" or context-related errors

**Check**:
1. All context providers are properly wrapped in `src/App.js`
2. Context hooks are used correctly in components
3. No circular dependencies between contexts

**Verify in src/App.js**:
```javascript
// These should all be present and properly nested
<TourProvider>
  <AuthProvider>
    <NotificationProvider>
      <VendorProvider>
        <PropertyProvider>
          <InvestmentProvider>
            <EscrowProvider>
              <MortgageProvider>
                <SidebarProvider>
                  {/* App content */}
                </SidebarProvider>
              </MortgageProvider>
            </EscrowProvider>
          </InvestmentProvider>
        </PropertyProvider>
      </VendorProvider>
    </NotificationProvider>
  </AuthProvider>
</TourProvider>
```

## Debugging Tools

### 1. Chrome DevTools Remote Debugging
```bash
# Enable USB debugging on Android device
# Connect device via USB
# In Chrome, go to: chrome://inspect

# Then you can inspect the WebView and see console logs
```

### 2. React DevTools
Install React DevTools extension in Chrome to inspect component tree and state.

### 3. Capacitor Console
Add this to `src/index.js` to capture all console output:
```javascript
// Capture console logs for debugging
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

console.log = function(...args) {
  originalLog('[LOG]', ...args);
};

console.error = function(...args) {
  originalError('[ERROR]', ...args);
};

console.warn = function(...args) {
  originalWarn('[WARN]', ...args);
};
```

## Error Boundary Fallback UI

If the app crashes, the `ErrorBoundary` component should display an error screen with:
- Error message
- Stack trace (in development mode)
- Buttons to refresh or go home
- Option to clear cache and reload

If you see this screen, check the error details displayed.

## Build Verification Checklist

Before testing on device:
- ✅ React build completed successfully
- ✅ Capacitor sync completed
- ✅ Gradle build successful
- ✅ APK file exists and has reasonable size (>10 MB)
- ✅ All required files present in `src/`

## Performance Considerations

The app initializes several providers and plugins:
1. Capacitor initialization (async)
2. React context providers
3. Error handlers and guards
4. Lazy-loaded routes

If the app is slow to start, check:
- Network requests during initialization
- Large bundle sizes
- Unnecessary re-renders

## Next Steps

1. **Install APK**: `adb install android/app/build/outputs/apk/development/debug/app-development-debug.apk`
2. **Run app**: `adb shell am start -n com.realestate.marketplace.dev/.MainActivity`
3. **Check logs**: `adb logcat | grep -i propertyark`
4. **Report errors**: Share the logcat output for further diagnosis

## Support

If the app continues to crash:
1. Share the complete logcat output
2. Note the exact error message
3. Describe when the crash occurs (on startup, after action, etc.)
4. Include any recent code changes
