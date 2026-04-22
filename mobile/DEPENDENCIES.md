# Dependencies Documentation

This document provides detailed information about all dependencies used in the PropertyArk Mobile APK project.

## Quick Reference

### Production Dependencies

#### Core Framework (Required)
- **react** (19.1.0) - React library for building UI components
- **react-native** (0.81.5) - React Native framework for mobile development
- **expo** (~54.0.33) - Expo framework providing managed build services and native modules
- **react-dom** (19.1.0) - React DOM for web platform support
- **react-native-web** (~0.21.0) - React Native components for web

#### Navigation & Routing
- **expo-router** (~6.0.23) - File-based routing system for Expo apps
- **@react-navigation/native** (^7.1.8) - Core navigation library
- **@react-navigation/bottom-tabs** (^7.4.0) - Bottom tab navigation component
- **@react-navigation/elements** (^2.6.3) - Navigation UI elements and utilities
- **react-native-gesture-handler** (~2.28.0) - Gesture recognition and handling
- **react-native-screens** (~4.16.0) - Native screen components for performance
- **react-native-safe-area-context** (~5.6.0) - Safe area context for notches and home indicators

#### UI & Assets
- **@expo/vector-icons** (^15.0.3) - Icon library with multiple icon sets
- **expo-image** (~3.0.11) - Optimized image component
- **expo-symbols** (~1.0.8) - SF Symbols for iOS

#### System & Configuration
- **expo-constants** (~18.0.13) - Access to app constants and configuration
- **expo-linking** (~8.0.11) - Deep linking and URL handling
- **expo-splash-screen** (~31.0.13) - Splash screen management
- **expo-status-bar** (~3.0.9) - Status bar styling and control
- **expo-system-ui** (~6.0.9) - System UI integration
- **expo-web-browser** (~15.0.10) - Web browser integration
- **expo-font** (~14.0.11) - Custom font loading
- **expo-haptics** (~15.0.8) - Haptic feedback (vibration)

#### Authentication & Storage (NEW)
- **expo-secure-store** (^13.0.1) - Secure storage for sensitive data (JWT tokens)
  - Uses native Keychain (iOS) and Keystore (Android)
  - Encrypted at rest
  - Required for: Requirement 3.2, 12.1

#### Caching & Data Storage (NEW)
- **@react-native-async-storage/async-storage** (^1.23.1) - Persistent local storage
  - Stores cached API responses
  - Supports offline functionality
  - Required for: Requirement 4.1, 4.2, 4.5

#### API Communication (NEW)
- **axios** (^1.7.7) - HTTP client for API requests
  - Promise-based HTTP client
  - Request/response interceptors
  - Timeout support
  - Required for: Requirement 7.1, 7.2, 7.3

### Development Dependencies

- **@types/react** (~19.1.0) - TypeScript type definitions for React
- **typescript** (~5.9.2) - TypeScript compiler and language support
- **eslint** (^9.25.0) - JavaScript linter for code quality
- **eslint-config-expo** (~10.0.0) - Expo-specific ESLint configuration

## Dependency Purposes by Feature

### Authentication (Requirement 3)
- **expo-secure-store**: Secure JWT token storage
- **axios**: API calls to authentication endpoints

### Offline Support & Caching (Requirement 4)
- **@react-native-async-storage/async-storage**: Local data caching
- **expo-constants**: Configuration management

### API Integration (Requirement 7)
- **axios**: HTTP client for all API requests
- **expo-linking**: Deep linking support

### Navigation (Requirement 5)
- **expo-router**: File-based routing
- **@react-navigation/***: Navigation library and components
- **react-native-gesture-handler**: Gesture support
- **react-native-screens**: Performance optimization

### UI & UX
- **@expo/vector-icons**: Icons
- **expo-image**: Image optimization
- **expo-haptics**: Haptic feedback
- **expo-status-bar**: Status bar control
- **react-native-safe-area-context**: Safe area handling

## Version Strategy

### Pinned Versions (Exact Match)
Used for critical dependencies that must not change:
- react: 19.1.0
- react-native: 0.81.5
- react-dom: 19.1.0

### Tilde Versions (~)
Allows patch updates (e.g., ~54.0.33 allows 54.0.x):
- Used for Expo and most native modules
- Ensures stability while allowing security patches

### Caret Versions (^)
Allows minor and patch updates (e.g., ^1.7.7 allows 1.x.x):
- Used for libraries with good semantic versioning
- Allows feature updates while preventing breaking changes

## Compatibility Notes

### React Native 0.81.5
All dependencies are compatible with React Native 0.81.5:
- No deprecated packages
- No conflicting peer dependencies
- All transitive dependencies are compatible

### Expo 54.0.33
All dependencies are compatible with Expo 54.0.33:
- Includes necessary native modules
- Supports Android SDK 34 and iOS 14+

### Node.js Requirements
- Minimum: Node.js 16
- Recommended: Node.js 18 LTS or later
- npm: 8 or later

## Installation & Verification

### Install All Dependencies
```bash
npm install
```

### Verify Installation
```bash
# List all installed dependencies
npm list

# Check for security vulnerabilities
npm audit

# Check for outdated packages
npm outdated
```

### Update Dependencies
```bash
# Update all dependencies to latest compatible versions
npm update

# Update specific package
npm install package@latest

# Check what would be updated
npm outdated
```

## Security Considerations

### Secure Storage
- JWT tokens stored in expo-secure-store (encrypted)
- Never stored in AsyncStorage or plain text
- Cleared on logout

### API Communication
- axios used for HTTPS requests
- Certificate pinning for production
- 30-second timeout for requests

### Data Caching
- Sensitive data encrypted in AsyncStorage
- Cache expiration after 24 hours
- Maximum cache size: 100MB

## Troubleshooting

### Dependency Installation Issues
```bash
# Clear npm cache
npm cache clean --force

# Reinstall all dependencies
rm -rf node_modules package-lock.json
npm install
```

### Version Conflicts
```bash
# Check for conflicts
npm ls

# Force resolution
npm install --legacy-peer-deps
```

### Security Vulnerabilities
```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Force fix (may break compatibility)
npm audit fix --force
```

## Future Considerations

### Potential Additions
- **react-native-crypto**: For encryption utilities (currently using built-in crypto)
- **redux** or **zustand**: For state management (if needed)
- **react-native-firebase**: For push notifications (future feature)
- **react-native-camera**: For camera functionality (future feature)

### Maintenance Schedule
- Monthly: Check for security updates
- Quarterly: Review dependency updates
- Annually: Major version updates and compatibility review

## References

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [expo-secure-store](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)
- [axios Documentation](https://axios-http.com/)

