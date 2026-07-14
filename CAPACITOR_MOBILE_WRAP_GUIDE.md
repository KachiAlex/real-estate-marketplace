# Capacitor Mobile App Wrap - Implementation Guide

## Overview

This guide provides step-by-step instructions for wrapping the PropertyArk web application with Capacitor to create stable iOS and Android mobile apps that don't crash on startup.

## Why Apps Crash on Startup

Common causes of crashes when wrapping web apps with Capacitor:

1. **Missing Capacitor Initialization** - Capacitor not initialized before React renders
2. **Incorrect Viewport Configuration** - Missing or incorrect meta tags
3. **Asset Loading Failures** - Images, fonts, CSS not loading correctly
4. **API Endpoint Issues** - Backend URLs not configured for mobile
5. **CORS Problems** - Cross-origin requests blocked
6. **Platform-Specific Issues** - Layout broken on specific platforms
7. **Unhandled Errors** - Errors not caught, causing silent crashes
8. **Plugin Configuration** - Capacitor plugins not properly configured

## Solution Architecture

Our approach addresses all these issues:

```
1. Proper Capacitor Initialization
   ↓
2. Correct Viewport & Meta Tags
   ↓
3. Asset Loading Configuration
   ↓
4. API Endpoint Setup
   ↓
5. Platform-Specific Styling
   ↓
6. Error Handling
   ↓
7. Plugin Configuration
   ↓
8. Build & Test
```

## Implementation Steps

### Step 1: Capacitor Initialization

Create `src/capacitor-init.ts`:

```typescript
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

export async function initializeCapacitor() {
  if (!Capacitor.isNativePlatform()) {
    console.log('Running in web mode');
    return;
  }

  try {
    console.log('Initializing Capacitor...');
    
    // Configure status bar
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#f97316' });
    
    // Configure safe area
    const safeArea = await Capacitor.getPlugin('SafeArea')?.getInsets?.();
    if (safeArea) {
      document.documentElement.style.setProperty(
        '--safe-area-inset-top',
        `${safeArea.top}px`
      );
      document.documentElement.style.setProperty(
        '--safe-area-inset-bottom',
        `${safeArea.bottom}px`
      );
      document.documentElement.style.setProperty(
        '--safe-area-inset-left',
        `${safeArea.left}px`
      );
      document.documentElement.style.setProperty(
        '--safe-area-inset-right',
        `${safeArea.right}px`
      );
    }
    
    console.log('Capacitor initialized successfully');
  } catch (error) {
    console.error('Error initializing Capacitor:', error);
  }
}
```

Update `src/index.tsx`:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { initializeCapacitor } from './capacitor-init';
import App from './App';
import './index.css';

// Initialize Capacitor BEFORE rendering React
initializeCapacitor().then(() => {
  const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
  );
  
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}).catch((error) => {
  console.error('Failed to initialize app:', error);
  // Show error UI
  document.body.innerHTML = '<div style="padding: 20px; color: red;">Failed to initialize app. Please restart.</div>';
});
```

### Step 2: Update HTML Meta Tags

Update `public/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    
    <!-- CRITICAL: Proper viewport configuration for mobile -->
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no, maximum-scale=1" />
    
    <!-- Safe area support -->
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="PropertyArk" />
    
    <!-- Theme color -->
    <meta name="theme-color" content="#f97316" />
    
    <!-- Prevent zoom on input focus (iOS) -->
    <meta name="format-detection" content="telephone=no" />
    
    <!-- Description -->
    <meta name="description" content="PropertyArk - Buy, sell, rent, and invest in properties with secure escrow services" />
    
    <!-- Icons -->
    <link rel="apple-touch-icon" href="%PUBLIC_URL%/icon-192.png" />
    <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
    
    <!-- Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Preconnect to external resources -->
    <link rel="preconnect" href="https://maps.googleapis.com" crossorigin>
    <link rel="dns-prefetch" href="https://maps.googleapis.com">
    
    <title>PropertyArk</title>
    
    <!-- External scripts (load after app initializes) -->
    <script src="https://js.paystack.co/v1/inline.js" defer></script>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
```

### Step 3: Create Safe Area CSS

Create `src/styles/safe-area.css`:

```css
:root {
  --safe-area-inset-top: 0px;
  --safe-area-inset-bottom: 0px;
  --safe-area-inset-left: 0px;
  --safe-area-inset-right: 0px;
}

body {
  padding-top: var(--safe-area-inset-top);
  padding-bottom: var(--safe-area-inset-bottom);
  padding-left: var(--safe-area-inset-left);
  padding-right: var(--safe-area-inset-right);
}

/* For fixed headers */
header, nav {
  padding-top: max(1rem, var(--safe-area-inset-top));
}

/* For fixed footers */
footer {
  padding-bottom: max(1rem, var(--safe-area-inset-bottom));
}

/* Prevent content from being cut off by notch */
main {
  padding-left: max(1rem, var(--safe-area-inset-left));
  padding-right: max(1rem, var(--safe-area-inset-right));
}
```

Import in `src/index.css`:

```css
@import './styles/safe-area.css';

/* Rest of your styles */
```

### Step 4: Create Platform Detection

Create `src/utils/platform.ts`:

```typescript
import { Capacitor } from '@capacitor/core';

export const getPlatform = () => Capacitor.getPlatform();

export const isIOS = () => getPlatform() === 'ios';

export const isAndroid = () => getPlatform() === 'android';

export const isNative = () => Capacitor.isNativePlatform();

export const isWeb = () => !Capacitor.isNativePlatform();

export const getDeviceInfo = () => ({
  platform: getPlatform(),
  isNative: isNative(),
  isIOS: isIOS(),
  isAndroid: isAndroid(),
});
```

### Step 5: Configure API Endpoints

Create `src/config/api.ts`:

```typescript
import { Capacitor } from '@capacitor/core';

export const getApiBaseUrl = () => {
  // Use environment variable if set
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // For native mobile apps
  if (Capacitor.isNativePlatform()) {
    return process.env.REACT_APP_MOBILE_API_URL || 'https://api.propertyark.com';
  }

  // For web development
  return process.env.REACT_APP_DEV_API_URL || 'http://localhost:5001';
};

export const API_CONFIG = {
  baseURL: getApiBaseUrl(),
  timeout: 30000, // 30 seconds for mobile
  headers: {
    'Content-Type': 'application/json',
  },
};
```

Create `.env.local`:

```
REACT_APP_API_URL=https://api.propertyark.com
REACT_APP_MOBILE_API_URL=https://api.propertyark.com
REACT_APP_DEV_API_URL=http://localhost:5001
```

### Step 6: Create Error Handler

Create `src/utils/error-handler.ts`:

```typescript
import { Capacitor } from '@capacitor/core';

export function setupGlobalErrorHandler() {
  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error);
    logError({
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
    console.error('Unhandled promise rejection:', event.reason);
    logError({
      type: 'unhandledRejection',
      message: event.reason?.message || String(event.reason),
      stack: event.reason?.stack,
    });
  });
}

function logError(error: any) {
  // Log to console
  console.error('[ERROR LOG]', error);

  // Send to backend (optional)
  if (Capacitor.isNativePlatform()) {
    // Send error to backend for debugging
    fetch('/api/logs/error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...error,
        platform: Capacitor.getPlatform(),
        timestamp: new Date().toISOString(),
      }),
    }).catch((err) => console.error('Failed to log error:', err));
  }
}
```

Update `src/index.tsx` to call this:

```typescript
import { setupGlobalErrorHandler } from './utils/error-handler';

setupGlobalErrorHandler();
```

### Step 7: Create Error Boundary

Create `src/components/ErrorBoundary.tsx`:

```typescript
import React, { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: '#d32f2f',
        }}>
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f97316',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

Wrap your app in `src/App.tsx`:

```typescript
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      {/* Your app content */}
    </ErrorBoundary>
  );
}
```

### Step 8: Update Capacitor Configuration

Update `capacitor.config.ts`:

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.propertyark.app',
  appName: 'PropertyArk',
  webDir: 'build',
  version: '1.0.1',
  server: {
    cleartext: true,
    androidScheme: 'https',
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    CapacitorCookies: {
      enabled: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#f97316',
    },
  },
  android: {
    minSdkVersion: 21,
    targetSdkVersion: 34,
    buildToolsVersion: '34.0.0',
  },
  ios: {
    deploymentTarget: '14.0',
    scheme: 'PropertyArk',
  },
};

export default config;
```

### Step 9: Build and Sync

```bash
# Build the web app
npm run build

# Sync to native projects
npx cap sync

# For Android
npx cap sync android

# For iOS
npx cap sync ios
```

### Step 10: Build for Android

```bash
# Open Android Studio
npx cap open android

# Or build from command line
cd android
./gradlew assembleDebug
```

### Step 11: Build for iOS

```bash
# Open Xcode
npx cap open ios

# Or build from command line
cd ios
xcodebuild -workspace App.xcworkspace -scheme App -configuration Debug
```

## Testing Checklist

- [ ] App starts without crashing
- [ ] All assets load correctly
- [ ] API calls work
- [ ] Layout looks correct on mobile
- [ ] Safe areas are respected
- [ ] Platform-specific styles apply
- [ ] Error handling works
- [ ] App works on multiple devices
- [ ] App works on different OS versions

## Troubleshooting

### App crashes immediately
1. Check browser console for errors
2. Verify Capacitor initialization
3. Check for unhandled exceptions
4. Review error logs

### Assets not loading
1. Verify `webDir` in capacitor.config.ts
2. Check asset paths in components
3. Verify build output
4. Check network tab in DevTools

### API calls failing
1. Verify API endpoint configuration
2. Check CORS headers
3. Verify network connectivity
4. Check backend logs

### Layout issues
1. Verify viewport meta tags
2. Check safe area CSS
3. Test on actual device
4. Check platform-specific styles

## Next Steps

1. Implement all changes from this guide
2. Test thoroughly on real devices
3. Fix any remaining issues
4. Prepare for app store submission
5. Deploy to Google Play and App Store

