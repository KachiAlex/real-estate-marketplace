# Design Document: PropertyArk Mobile APK Rebuild

## Overview

PropertyArk is rebuilding its mobile application as a clean Android APK using Expo 54.0.33 with React Native 0.81.5. The rebuild prioritizes reliability, security, and maintainability by establishing a minimal dependency set, robust build infrastructure, and clear separation of concerns between authentication, caching, and API communication layers.

The architecture is designed to support offline functionality, secure JWT token management, and a reproducible build process that prevents the memory and configuration errors encountered in previous builds.

## Architecture

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────┐
│                    PropertyArk Mobile App                    │
│                    (React Native + Expo)                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────┐ │
│  │   UI Layer       │  │  Navigation      │  │  Screens   │ │
│  │  (Components)    │  │  (Expo Router)   │  │  (Pages)   │ │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬───┘ │
│           │                     │                     │      │
│           └─────────────────────┼─────────────────────┘      │
│                                 │                             │
│  ┌──────────────────────────────▼──────────────────────────┐ │
│  │           Application State & Hooks Layer               │ │
│  │  (Redux/Context, Custom Hooks, State Management)        │ │
│  └──────────────────────────────┬──────────────────────────┘ │
│                                 │                             │
│  ┌──────────────────────────────▼──────────────────────────┐ │
│  │              Core Services Layer                        │ │
│  │  ┌─────────────────┐  ┌──────────────┐  ┌────────────┐ │ │
│  │  │ Authentication  │  │ Cache        │  │ API Client │ │ │
│  │  │ Manager         │  │ Manager      │  │            │ │ │
│  │  └────────┬────────┘  └──────┬───────┘  └────────┬───┘ │ │
│  └───────────┼──────────────────┼──────────────────┼──────┘ │
│              │                  │                  │         │
│  ┌───────────▼──────────────────▼──────────────────▼──────┐ │
│  │           Storage & Persistence Layer                  │ │
│  │  ┌──────────────────┐  ┌──────────────────────────┐   │ │
│  │  │ Secure Storage   │  │ Local Cache (Encrypted)  │   │ │
│  │  │ (Device Keystore)│  │ (AsyncStorage/SQLite)    │   │ │
│  │  └──────────────────┘  └──────────────────────────┘   │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              │
                    ┌─────────▼──────────┐
                    │  Render Backend    │
                    │  (PropertyArk API) │
                    │  https://propertyark-backend.onrender.com/api
                    └────────────────────┘
```

### Component Architecture

The application is organized into distinct layers with clear responsibilities:

1. **UI Layer**: React Native components and screens using Expo Router for navigation
2. **State Management**: Redux or Context API for application state
3. **Service Layer**: Authentication, Caching, and API communication
4. **Storage Layer**: Secure token storage and encrypted local caching
5. **Build System**: Gradle configuration and EAS build pipeline

## Components and Interfaces

### 1. Authentication Manager

**Responsibility**: Manage JWT token lifecycle, login/logout, and token refresh

**Key Methods**:
- `login(email, password)`: Authenticate user and obtain JWT token
- `logout()`: Clear stored token and reset authentication state
- `refreshToken()`: Refresh expired JWT token
- `getToken()`: Retrieve stored JWT token
- `isAuthenticated()`: Check if user has valid token
- `setToken(token)`: Store JWT token securely

**Token Storage**:
- Use React Native's `expo-secure-store` for secure token storage
- Never store tokens in plain text or AsyncStorage
- Implement token expiration tracking

**Token Refresh Flow**:
```
1. API request fails with 401 Unauthorized
2. Check if token is expired
3. Call refresh endpoint with refresh token
4. Store new token if refresh succeeds
5. Retry original request with new token
6. If refresh fails, redirect to login screen
```

### 2. Cache Manager

**Responsibility**: Manage offline data caching, expiration, and synchronization

**Key Methods**:
- `set(key, value, ttl)`: Store data with time-to-live
- `get(key)`: Retrieve cached data
- `remove(key)`: Delete specific cache entry
- `clear()`: Clear all cache
- `isExpired(key)`: Check if cache entry is expired
- `sync()`: Synchronize pending changes with backend
- `getSize()`: Get current cache size

**Cache Strategy**:
- Maximum cache size: 100MB
- Default TTL: 24 hours
- Encrypt sensitive data at rest
- Implement LRU eviction when size limit exceeded
- Track cache metadata (timestamp, expiration, encryption status)

**Offline Synchronization**:
- Queue pending mutations when offline
- Sync queue when connectivity restored
- Implement conflict resolution for concurrent updates
- Provide user feedback on sync status

### 3. API Client

**Responsibility**: Handle HTTP communication with Render backend

**Key Methods**:
- `get(endpoint, options)`: GET request
- `post(endpoint, data, options)`: POST request
- `put(endpoint, data, options)`: PUT request
- `delete(endpoint, options)`: DELETE request
- `setBaseURL(url)`: Configure API endpoint
- `setAuthToken(token)`: Set JWT token for requests

**Request/Response Handling**:
- Include JWT token in Authorization header: `Authorization: Bearer {token}`
- Set Content-Type: `application/json`
- Implement 30-second request timeout
- Handle network errors with user-friendly messages
- Parse JSON responses and validate structure
- Implement certificate pinning for production HTTPS

**Error Handling**:
- 401: Token expired, trigger refresh
- 403: Forbidden, show permission error
- 404: Not found, show resource error
- 5xx: Server error, show retry option
- Network timeout: Show offline message

### 4. Build System

**Responsibility**: Manage APK compilation, signing, and validation

**Build Configuration**:
- Android SDK target: 34
- Android SDK minimum: 24 (API level 24 = Android 7.0)
- Architecture: ARM64
- Gradle version: 8.0+
- Heap memory: Minimum 4GB
- Permissions: INTERNET, ACCESS_NETWORK_STATE

**Build Process**:
1. Validate prerequisites (Node.js, Android SDK, Java)
2. Clear previous build artifacts
3. Install dependencies
4. Validate Gradle configuration
5. Compile source code
6. Generate signed APK
7. Verify APK signature and validity
8. Output signed APK for distribution

**Build Scripts**:
- `build:local`: Build APK locally
- `build:eas`: Build APK using EAS cloud
- `build:validate`: Validate build configuration
- `build:clean`: Clean build artifacts

## Data Models

### JWT Token Structure

```typescript
interface JWTToken {
  accessToken: string;      // JWT access token
  refreshToken: string;     // JWT refresh token
  expiresIn: number;        // Expiration time in seconds
  tokenType: string;        // "Bearer"
  issuedAt: number;         // Timestamp when token was issued
}
```

### Cached Data Structure

```typescript
interface CacheEntry<T> {
  key: string;              // Cache key
  value: T;                 // Cached data
  timestamp: number;        // When data was cached
  ttl: number;              // Time-to-live in milliseconds
  encrypted: boolean;       // Whether data is encrypted
  size: number;             // Size in bytes
}
```

### API Response Structure

```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  timestamp: number;
}
```

### Build Configuration

```typescript
interface BuildConfig {
  targetSDK: number;        // 34
  minSDK: number;           // 24
  architecture: string;     // "arm64-v8a"
  gradleVersion: string;    // "8.0"
  heapMemory: string;       // "4g"
  signingConfig: {
    keystore: string;
    keystorePassword: string;
    keyAlias: string;
    keyPassword: string;
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Dependency Compatibility Validation

*For any* set of dependencies with specified versions, the build system validation SHALL correctly identify whether all dependencies are compatible with React Native 0.81.5 or later.

**Validates: Requirements 1.3, 1.6**

### Property 2: Build Memory Allocation

*For any* build configuration, the build system SHALL allocate at least 4GB of heap memory and validate this allocation before compilation begins.

**Validates: Requirements 2.4, 2.6**

### Property 3: JWT Token Acquisition and Storage

*For any* valid login credentials, the authentication manager SHALL obtain a JWT token from the backend and store it securely such that subsequent retrieval returns the same token.

**Validates: Requirements 3.1, 3.2**

### Property 4: JWT Token Inclusion in Requests

*For any* API request made when an authentication token is stored, the API client SHALL include that token in the Authorization header with the format "Bearer {token}".

**Validates: Requirements 3.3**

### Property 5: Token Refresh on Expiration

*For any* expired JWT token, the authentication manager SHALL automatically trigger a refresh request and, if successful, update the stored token.

**Validates: Requirements 3.4**

### Property 6: Failed Refresh Redirects to Login

*For any* failed token refresh attempt, the authentication manager SHALL clear the stored token and signal a redirect to the login screen.

**Validates: Requirements 3.5**

### Property 7: Logout Clears Token

*For any* authenticated session, calling logout SHALL delete the stored JWT token such that subsequent token retrieval returns null.

**Validates: Requirements 3.6**

### Property 8: Data Caching on Fetch

*For any* data fetched from the backend, the cache manager SHALL store it locally such that subsequent offline requests return the cached data.

**Validates: Requirements 4.1, 4.2**

### Property 9: Cache Expiration After 24 Hours

*For any* cached data entry with a 24-hour TTL, the cache manager SHALL mark it as expired after 24 hours have elapsed since storage.

**Validates: Requirements 4.5**

### Property 10: Sensitive Data Encryption

*For any* sensitive data cached by the cache manager, the data SHALL be encrypted at rest and decrypted only when retrieved.

**Validates: Requirements 4.6, 12.2**

### Property 11: Build Artifact Cleanup

*For any* build process execution, the build system SHALL remove all artifacts from previous builds before compilation begins.

**Validates: Requirements 5.1**

### Property 12: Build Prerequisite Validation

*For any* build attempt, the build system SHALL validate all prerequisites (Node.js, Android SDK, Java) and fail with clear error messages if any are missing.

**Validates: Requirements 5.2**

### Property 13: Signed APK Generation

*For any* successful build, the build system SHALL generate a signed APK file that is valid and ready for installation.

**Validates: Requirements 5.3, 6.2**

### Property 14: APK API Level Compatibility

*For any* built APK, the target API level SHALL be 34 and minimum API level SHALL be 24, ensuring compatibility with Android 7.0 and later.

**Validates: Requirements 6.1**

### Property 15: App Initialization on Launch

*For any* app launch, the authentication manager and cache manager SHALL be initialized before any UI is rendered.

**Validates: Requirements 6.5**

### Property 16: API Request Headers

*For any* API request, the API client SHALL include Content-Type header set to "application/json".

**Validates: Requirements 7.2**

### Property 17: Network Error Handling

*For any* failed API request due to network unavailability, the API client SHALL return an error with a user-friendly message.

**Validates: Requirements 7.3**

### Property 18: JSON Response Parsing

*For any* valid JSON response from the backend, the API client SHALL parse it correctly and extract the data payload.

**Validates: Requirements 7.4**

### Property 19: Request Timeout Enforcement

*For any* API request, if no response is received within 30 seconds, the API client SHALL timeout and return a timeout error.

**Validates: Requirements 7.5**

### Property 20: HTTPS for Sensitive Data

*For any* API request containing sensitive data, the API client SHALL use HTTPS encryption.

**Validates: Requirements 7.6, 12.3**

### Property 21: APK Validation After Build

*For any* built APK, the build system SHALL verify the APK file is valid, properly signed, and ready for installation.

**Validates: Requirements 9.1**

### Property 22: Environment Variable Injection

*For any* build with environment variables specified, the build system SHALL inject those variables into the application configuration.

**Validates: Requirements 10.4**

### Property 23: Memory Usage Limits

*For any* running app instance, memory usage during normal operation SHALL not exceed 150MB.

**Validates: Requirements 11.1**

### Property 24: Cache Size Limits

*For any* cache operation, the total cache size SHALL not exceed 100MB, with older entries evicted when limit is reached.

**Validates: Requirements 11.5**

### Property 25: Secure Token Storage

*For any* JWT token stored by the authentication manager, the token SHALL be stored using secure device storage and not in plain text.

**Validates: Requirements 12.1**

### Property 26: Sensitive Data Logging Prevention

*For any* log output from the application, sensitive information (passwords, tokens, API keys) SHALL never appear in console or file logs.

**Validates: Requirements 12.5**

## Error Handling

### Authentication Errors

| Error | Cause | User Action | Recovery |
|-------|-------|-------------|----------|
| Invalid Credentials | Wrong email/password | Show error message | Retry login |
| Token Expired | JWT token past expiration | Automatic refresh | Retry request |
| Refresh Failed | Refresh token invalid/expired | Redirect to login | Re-authenticate |
| Network Error | No connectivity | Show offline message | Retry when online |
| Unauthorized (401) | Token invalid/revoked | Redirect to login | Re-authenticate |

### API Errors

| Status | Meaning | User Action | Recovery |
|--------|---------|-------------|----------|
| 400 | Bad Request | Show validation error | Fix input and retry |
| 401 | Unauthorized | Redirect to login | Re-authenticate |
| 403 | Forbidden | Show permission error | Contact support |
| 404 | Not Found | Show resource error | Navigate back |
| 500 | Server Error | Show retry option | Retry request |
| Timeout | No response in 30s | Show timeout error | Retry request |

### Build Errors

| Error | Cause | Resolution |
|-------|-------|-----------|
| Out of Memory | Insufficient heap | Increase heap to 4GB+ |
| Gradle Sync Failed | Dependency conflict | Check dependency versions |
| SDK Not Found | Android SDK missing | Install required SDK |
| Signing Failed | Invalid keystore | Verify keystore credentials |
| Permission Denied | File access issue | Check file permissions |

## Testing Strategy

### Unit Testing Approach

**Authentication Manager Tests**:
- Login with valid credentials obtains token
- Login with invalid credentials returns error
- Token refresh updates stored token
- Logout clears stored token
- Expired token triggers automatic refresh
- Failed refresh redirects to login

**Cache Manager Tests**:
- Cached data is retrievable after storage
- Expired cache entries are not returned
- Cache size respects 100MB limit
- Sensitive data is encrypted at rest
- Sync queue processes pending mutations
- Cache indicators show for cached data

**API Client Tests**:
- Requests include JWT token in header
- Requests include Content-Type header
- Timeout occurs after 30 seconds
- Network errors return user-friendly messages
- JSON responses are parsed correctly
- HTTPS is used for sensitive data

**Build System Tests**:
- Build artifacts are cleaned before compilation
- Prerequisites are validated before build
- Signed APK is generated on success
- Build errors provide clear messages
- Environment variables are injected
- Memory allocation is configured

### Integration Testing Approach

**End-to-End Flows**:
- User login → token storage → API request with token
- Offline data access → reconnect → sync with backend
- Token expiration → automatic refresh → retry request
- Build process → APK generation → installation

**Offline Scenarios**:
- App displays cached data when offline
- Pending mutations queued while offline
- Sync occurs when connectivity restored
- Cache indicators show for offline data

**Build Validation**:
- Local build produces valid signed APK
- EAS cloud build produces valid signed APK
- APK installs on Android 7.0+ devices
- App launches without crashes
- Backend connectivity verified on launch

### Property-Based Testing

Property-based testing is NOT applicable to this feature because:

1. **Infrastructure as Code**: Build configuration (Gradle, Android SDK settings) is declarative configuration, not pure functions with inputs/outputs
2. **UI Rendering**: Splash screens and UI components are visual elements best tested with snapshot/visual regression tests
3. **External Services**: Backend connectivity and API behavior are external service dependencies, not our code logic
4. **Configuration Validation**: Environment variable injection and build configuration are setup checks, not universal properties

Instead, we use:
- **Snapshot tests** for build configuration validation
- **Mock-based unit tests** for authentication and caching logic
- **Integration tests** for end-to-end flows with mocked backend
- **Manual testing** for APK installation and app launch

## File Structure and Organization

```
mobile/
├── app/                          # Expo Router app directory
│   ├── (tabs)/                   # Tab-based navigation
│   │   ├── index.tsx             # Home screen
│   │   ├── profile.tsx           # Profile screen
│   │   └── settings.tsx          # Settings screen
│   ├── _layout.tsx               # Root layout
│   └── modal.tsx                 # Modal screens
├── components/                   # Reusable React components
│   ├── ThemedText.tsx
│   ├── ThemedView.tsx
│   └── ...
├── services/                     # Core service layer
│   ├── auth/
│   │   ├── AuthenticationManager.ts
│   │   ├── TokenStorage.ts
│   │   └── types.ts
│   ├── cache/
│   │   ├── CacheManager.ts
│   │   ├── CacheStorage.ts
│   │   └── types.ts
│   └── api/
│       ├── APIClient.ts
│       ├── RequestInterceptor.ts
│       └── types.ts
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts
│   ├── useCache.ts
│   └── useAPI.ts
├── constants/                    # Application constants
│   ├── config.ts                 # Environment configuration
│   ├── endpoints.ts              # API endpoints
│   └── errors.ts                 # Error messages
├── utils/                        # Utility functions
│   ├── encryption.ts
│   ├── validation.ts
│   └── formatting.ts
├── types/                        # TypeScript type definitions
│   ├── auth.ts
│   ├── cache.ts
│   ├── api.ts
│   └── index.ts
├── assets/                       # Images, fonts, icons
│   ├── images/
│   ├── fonts/
│   └── icons/
├── app.json                      # Expo configuration
├── eas.json                      # EAS build configuration
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript configuration
├── eslint.config.js              # ESLint configuration
├── BUILD.md                      # Build documentation
├── README.md                     # Project README
└── .env.example                  # Environment variables template
```

## Build Process Workflow

### Local Build Process

```
1. Validate Prerequisites
   ├── Check Node.js version (16+)
   ├── Check Android SDK installation
   ├── Check Java version (11+)
   └── Check available disk space

2. Clean Build Environment
   ├── Remove node_modules (optional)
   ├── Clear Gradle cache
   ├── Remove previous APK artifacts
   └── Clear build directory

3. Install Dependencies
   ├── Run yarn install
   ├── Validate dependency compatibility
   └── Verify React Native version

4. Validate Configuration
   ├── Check app.json
   ├── Check eas.json
   ├── Verify Gradle configuration
   └── Validate environment variables

5. Build APK
   ├── Set heap memory to 4GB
   ├── Run Gradle build
   ├── Compile source code
   └── Generate unsigned APK

6. Sign APK
   ├── Load keystore
   ├── Sign APK with private key
   └── Generate signed APK

7. Verify APK
   ├── Validate APK signature
   ├── Check APK structure
   ├── Verify permissions
   └── Confirm API levels

8. Output
   └── Save signed APK to output directory
```

### EAS Cloud Build Process

```
1. Commit code to repository
2. Run: eas build --platform android --auto-submit
3. EAS validates configuration
4. EAS builds APK in cloud environment
5. EAS signs APK with configured keystore
6. EAS generates download link
7. Download signed APK
```

## Environment Configuration Strategy

### Environment Variables

```env
# API Configuration
REACT_APP_API_URL=https://propertyark-backend.onrender.com/api
REACT_APP_API_TIMEOUT=30000

# Authentication
REACT_APP_AUTH_REFRESH_ENDPOINT=/auth/refresh
REACT_APP_AUTH_LOGIN_ENDPOINT=/auth/login
REACT_APP_AUTH_LOGOUT_ENDPOINT=/auth/logout

# Cache Configuration
REACT_APP_CACHE_TTL=86400000
REACT_APP_CACHE_MAX_SIZE=104857600

# Build Configuration
REACT_APP_BUILD_ENV=production
REACT_APP_VERSION=1.0.0

# Security
REACT_APP_CERTIFICATE_PINNING=true
REACT_APP_SECURE_STORAGE=true
```

### Environment-Specific Configuration

**Development**:
- API URL: http://localhost:5001
- Certificate pinning: disabled
- Logging: verbose
- Cache TTL: 1 hour

**Staging**:
- API URL: https://staging-api.propertyark.com
- Certificate pinning: enabled
- Logging: normal
- Cache TTL: 12 hours

**Production**:
- API URL: https://propertyark-backend.onrender.com/api
- Certificate pinning: enabled
- Logging: errors only
- Cache TTL: 24 hours

## Build Configuration Details

### Gradle Configuration

```gradle
android {
    compileSdk 34
    
    defaultConfig {
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0.0"
        
        ndk {
            abiFilters 'arm64-v8a'
        }
    }
    
    signingConfigs {
        release {
            storeFile file("keystore.jks")
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias System.getenv("KEY_ALIAS")
            keyPassword System.getenv("KEY_PASSWORD")
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
        }
    }
}
```

### Memory Configuration

```bash
# Set heap memory for Gradle
export GRADLE_OPTS="-Xmx4g -XX:MaxPermSize=512m"

# Verify memory allocation
java -Xmx4g -version
```

## Security Considerations

### Token Security

- Store JWT tokens in secure device storage (Keychain on iOS, Keystore on Android)
- Never store tokens in AsyncStorage or SharedPreferences
- Implement token expiration and automatic refresh
- Clear tokens on logout
- Implement certificate pinning for production

### Data Encryption

- Encrypt sensitive cached data at rest
- Use device-level encryption for cache storage
- Implement secure key derivation for encryption keys
- Never log sensitive information

### API Security

- Use HTTPS for all API requests
- Implement certificate pinning for production
- Validate SSL certificates
- Implement request signing for sensitive operations
- Rate limit API requests to prevent abuse

### Build Security

- Store keystore securely (not in version control)
- Use environment variables for keystore passwords
- Implement dependency scanning for vulnerabilities
- Validate all dependencies before build
- Sign APK with valid keystore

## Maintenance and Future Considerations

### Dependency Updates

- Review dependency updates monthly
- Test compatibility with React Native updates
- Update Expo version when new releases available
- Monitor security advisories for dependencies

### Performance Optimization

- Monitor app memory usage in production
- Optimize image loading and caching
- Implement code splitting for large screens
- Profile app performance regularly

### Monitoring and Logging

- Implement error tracking (Sentry, Bugsnag)
- Monitor API response times
- Track cache hit/miss rates
- Monitor build success/failure rates

### Documentation

- Keep BUILD.md updated with latest procedures
- Document any custom build scripts
- Maintain environment variable documentation
- Document troubleshooting procedures
