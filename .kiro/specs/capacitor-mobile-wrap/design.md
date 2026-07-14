# Capacitor Mobile App Wrap - Design Document

## Overview

This design document outlines the architecture and implementation approach for wrapping the PropertyArk web application with Capacitor to create stable, production-ready iOS and Android mobile applications. The design focuses on preventing crashes, ensuring proper asset loading, and providing a native-like user experience.

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Web Application (React)                       │
│  - PropertyArk UI Components                                     │
│  - Business Logic                                                │
│  - State Management                                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              Capacitor Bridge Layer                              │
│  - Capacitor Core Initialization                                │
│  - Plugin Management                                             │
│  - Native Communication                                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│           Platform-Specific Implementations                      │
│  ┌──────────────────────┐      ┌──────────────────────┐         │
│  │   Android (Java)     │      │   iOS (Swift)        │         │
│  │  - Gradle Build      │      │  - Xcode Build       │         │
│  │  - APK Generation    │      │  - IPA Generation    │         │
│  │  - Plugin Impl.      │      │  - Plugin Impl.      │         │
│  └──────────────────────┘      └──────────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

### Build and Deployment Flow

```
React Web App (src/)
    ↓
npm run build (Create optimized bundle)
    ↓
build/ directory (Static assets)
    ↓
Capacitor Sync (Copy assets to native projects)
    ↓
┌─────────────────────────────────────────┐
│  Android Build                          │
│  - gradle build (android/)              │
│  - APK/AAB generation                   │
│  - Signing                              │
└─────────────────────────────────────────┘
    ↓
Android App (APK/AAB)

┌─────────────────────────────────────────┐
│  iOS Build                              │
│  - xcodebuild (ios/)                    │
│  - IPA generation                       │
│  - Code signing                         │
└─────────────────────────────────────────┘
    ↓
iOS App (IPA)
```

## Key Components

### 1. Capacitor Initialization

**Purpose:** Ensure Capacitor is properly initialized before the React app renders.

**Implementation:**
- Create `src/capacitor-init.ts` to initialize Capacitor
- Import and call initialization in `src/index.tsx` before React render
- Configure Capacitor plugins
- Set up error handlers

**Key Code:**
```typescript
// src/capacitor-init.ts
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

export async function initializeCapacitor() {
  if (Capacitor.isNativePlatform()) {
    // Configure status bar
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#f97316' });
    
    // Configure safe area
    document.documentElement.style.setProperty(
      '--safe-area-inset-top',
      `${Capacitor.getPlugin('SafeArea')?.getInsets?.().top || 0}px`
    );
  }
}
```

### 2. Viewport and Meta Tag Configuration

**Purpose:** Ensure the app displays correctly on all mobile devices.

**Implementation:**
- Update `public/index.html` with proper viewport meta tags
- Add safe area CSS variables
- Configure for notched devices
- Prevent zoom issues

**Key Meta Tags:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="theme-color" content="#f97316" />
```

### 3. Asset Loading Configuration

**Purpose:** Ensure all assets load correctly from the mobile app.

**Implementation:**
- Configure `capacitor.config.ts` with correct `webDir`
- Update build process to output to correct directory
- Configure asset paths for mobile
- Handle asset loading errors

**Key Configuration:**
```typescript
// capacitor.config.ts
const config: CapacitorConfig = {
  webDir: 'build',
  server: {
    cleartext: true,
    androidScheme: 'https',
  },
};
```

### 4. API Endpoint Configuration

**Purpose:** Ensure the app can communicate with the backend.

**Implementation:**
- Create environment-specific API configuration
- Use Capacitor HTTP plugin for API calls
- Configure CORS headers
- Handle network errors

**Key Code:**
```typescript
// src/config/api.ts
export const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  if (Capacitor.isNativePlatform()) {
    return process.env.REACT_APP_MOBILE_API_URL || 'https://api.propertyark.com';
  }
  
  return 'http://localhost:5001';
};
```

### 5. Platform-Specific Styling

**Purpose:** Ensure the app looks and functions correctly on both iOS and Android.

**Implementation:**
- Create platform detection utilities
- Apply platform-specific CSS
- Handle safe areas and notches
- Adapt navigation patterns

**Key Code:**
```typescript
// src/utils/platform.ts
import { Capacitor } from '@capacitor/core';

export const getPlatform = () => Capacitor.getPlatform();
export const isIOS = () => getPlatform() === 'ios';
export const isAndroid = () => getPlatform() === 'android';
export const isNative = () => Capacitor.isNativePlatform();
```

### 6. Error Handling and Crash Prevention

**Purpose:** Prevent crashes and provide helpful error messages.

**Implementation:**
- Create global error handler
- Implement error boundary component
- Log errors for debugging
- Provide fallback UI

**Key Code:**
```typescript
// src/utils/error-handler.ts
export function setupGlobalErrorHandler() {
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // Send to error tracking service
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    // Send to error tracking service
  });
}
```

### 7. Build Optimization

**Purpose:** Optimize the app for mobile devices.

**Implementation:**
- Minimize bundle size
- Optimize images
- Enable code splitting
- Configure production builds

**Key Optimizations:**
- Tree-shaking unused code
- Image optimization
- CSS minification
- JavaScript minification
- Lazy loading components

### 8. Capacitor Plugins Configuration

**Purpose:** Ensure Capacitor plugins are properly configured.

**Implementation:**
- Configure HTTP plugin for API calls
- Configure Cookies plugin for session management
- Configure Status Bar plugin
- Configure Safe Area plugin

**Key Plugins:**
- `@capacitor/core` - Core functionality
- `@capacitor/http` - HTTP requests
- `@capacitor/status-bar` - Status bar control
- `@capacitor/safe-area` - Safe area support

## Implementation Phases

### Phase 1: Capacitor Setup and Initialization
- Initialize Capacitor in the React app
- Configure Capacitor plugins
- Set up error handling
- Test basic initialization

### Phase 2: Viewport and Asset Configuration
- Update HTML meta tags
- Configure asset paths
- Test asset loading
- Verify layout on mobile

### Phase 3: API and Network Configuration
- Configure API endpoints
- Set up HTTP plugin
- Test API calls
- Handle network errors

### Phase 4: Platform-Specific Styling
- Create platform detection
- Apply platform-specific CSS
- Handle safe areas
- Test on iOS and Android

### Phase 5: Build and Testing
- Configure build process
- Build for Android
- Build for iOS
- Test on real devices

### Phase 6: Deployment and Documentation
- Create deployment guide
- Document troubleshooting
- Create build scripts
- Prepare for release

## Technology Stack

- **Framework:** React 18.2.0
- **Capacitor:** 8.3.1
- **Build Tool:** React Scripts 5.0.1
- **Package Manager:** npm
- **Target Platforms:** iOS 14.0+, Android 5.0+ (API 21+)

## Success Criteria

1. App initializes without crashing
2. All assets load correctly
3. API calls work properly
4. App displays correctly on all devices
5. Platform-specific features work
6. Build process completes successfully
7. App can be deployed to app stores

## Risk Mitigation

### Risk: App crashes on startup
**Mitigation:** 
- Proper Capacitor initialization
- Comprehensive error handling
- Testing on multiple devices

### Risk: Assets don't load
**Mitigation:**
- Correct asset path configuration
- Build process verification
- Asset loading error handling

### Risk: API calls fail
**Mitigation:**
- Proper endpoint configuration
- CORS configuration
- Network error handling

### Risk: Layout issues on mobile
**Mitigation:**
- Proper viewport configuration
- Safe area handling
- Platform-specific styling

## Testing Strategy

1. **Unit Tests:** Test individual components
2. **Integration Tests:** Test component interactions
3. **Device Testing:** Test on real iOS and Android devices
4. **Network Testing:** Test with various network conditions
5. **Performance Testing:** Test app startup and responsiveness

