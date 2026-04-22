# Implementation Plan: PropertyArk Mobile APK Rebuild

## Overview

This implementation plan breaks down the PropertyArk Mobile APK rebuild into discrete, actionable coding tasks organized by phase. Each task builds incrementally on previous work, with clear dependencies and validation criteria. The plan covers foundation setup, core services, UI/navigation, build configuration, testing, and documentation.

## Phase 1: Foundation & Setup

- [x] 1.1 Initialize clean Expo project with minimal dependencies
  - Create new Expo project using `npx create-expo-app`
  - Configure app.json with correct app name, version, and icons
  - Set up TypeScript configuration (tsconfig.json)
  - Install core dependencies: react-native, expo, expo-router
  - Verify React Native version is 0.81.5 or later
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 1.2 Set up project structure and directory organization
  - Create directory structure: app/, components/, services/, hooks/, constants/, utils/, types/, assets/
  - Create empty placeholder files for each service module
  - Set up ESLint and Prettier configuration
  - Configure import aliases in tsconfig.json
  - _Requirements: 1.2_

- [x] 1.3 Install and configure essential dependencies
  - Install expo-router for navigation
  - Install expo-secure-store for secure token storage
  - Install axios or fetch for API client
  - Install @react-native-async-storage/async-storage for caching
  - Install react-native-crypto for encryption utilities
  - Verify all dependencies are compatible with React Native 0.81.5
  - Document all dependencies in package.json with versions
  - _Requirements: 1.2, 1.3, 1.6_

- [x] 1.4 Configure environment variables and .env setup
  - Create .env.example file with all required environment variables
  - Create .env.development with development API URL (http://localhost:5001)
  - Create .env.production with production API URL (https://propertyark-backend.onrender.com/api)
  - Set up environment variable loading in app startup
  - Document environment variables in BUILD.md
  - _Requirements: 10.1, 10.2, 10.3, 10.5_

- [-] 1.5 Set up testing framework and configuration
  - Install Jest as test runner
  - Install @testing-library/react-native for component testing
  - Configure Jest configuration file (jest.config.js)
  - Create test directory structure (tests/, __tests__/)
  - Set up test utilities and mock helpers
  - _Requirements: 9.1_

## Phase 2: Core Services - Authentication

- [x] 2.1 Create Authentication Manager core structure
  - Create services/auth/types.ts with JWTToken and auth-related interfaces
  - Create services/auth/AuthenticationManager.ts with class skeleton
  - Implement methods: login(), logout(), getToken(), setToken(), isAuthenticated()
  - Set up error handling for authentication failures
  - _Requirements: 3.1, 3.2, 3.6_

- [x] 2.2 Implement secure token storage using expo-secure-store
  - Create services/auth/TokenStorage.ts for secure storage operations
  - Implement storeToken(token) to save JWT securely
  - Implement retrieveToken() to get stored JWT
  - Implement deleteToken() to clear token on logout
  - Implement getTokenExpiration() to check token validity
  - Add error handling for storage failures
  - _Requirements: 3.2, 12.1_

- [-] 2.3 Implement JWT token refresh mechanism
  - Add refreshToken() method to AuthenticationManager
  - Implement token expiration detection logic
  - Create refresh request to backend /auth/refresh endpoint
  - Update stored token on successful refresh
  - Handle refresh failure by clearing token and redirecting to login
  - _Requirements: 3.4, 3.5_

- [-] 2.4 Implement login and logout flows
  - Implement login(email, password) method with API call to /auth/login
  - Parse JWT token from login response
  - Store token using TokenStorage
  - Implement logout() method to clear token and reset state
  - Add error handling for invalid credentials
  - _Requirements: 3.1, 3.2, 3.6_

- [ ]* 2.5 Write unit tests for Authentication Manager
  - Test login with valid credentials obtains and stores token
  - Test login with invalid credentials returns error
  - Test token refresh updates stored token
  - Test logout clears stored token
  - Test isAuthenticated() returns correct status
  - Test expired token triggers automatic refresh
  - _Requirements: 3.1, 3.2, 3.4, 3.5, 3.6_

## Phase 3: Core Services - Caching

- [x] 3.1 Create Cache Manager core structure
  - Create services/cache/types.ts with CacheEntry and cache-related interfaces
  - Create services/cache/CacheManager.ts with class skeleton
  - Implement methods: set(), get(), remove(), clear(), isExpired(), getSize()
  - Set up cache metadata tracking (timestamp, TTL, encryption status)
  - _Requirements: 4.1, 4.2, 4.5_

- [-] 3.2 Implement cache storage with AsyncStorage
  - Create services/cache/CacheStorage.ts for storage operations
  - Implement storeData(key, value, ttl) to save data with expiration
  - Implement retrieveData(key) to get cached data
  - Implement deleteData(key) to remove specific cache entry
  - Implement clearAll() to remove all cache
  - Track cache size and metadata
  - _Requirements: 4.1, 4.2_

- [x] 3.3 Implement cache expiration and TTL logic
  - Add isExpired(key) method to check if cache entry is expired
  - Implement 24-hour default TTL for cached data
  - Add automatic cleanup of expired entries on retrieval
  - Implement cache size tracking with 100MB limit
  - Add LRU eviction when cache size exceeds limit
  - _Requirements: 4.5, 11.5_

- [x] 3.4 Implement encryption for sensitive cached data
  - Create utils/encryption.ts with encryption/decryption utilities
  - Implement encryptData(data) using device-level encryption
  - Implement decryptData(encryptedData) to retrieve encrypted data
  - Integrate encryption into CacheManager for sensitive data
  - Mark encrypted entries in cache metadata
  - _Requirements: 4.6, 12.2_

- [x] 3.5 Implement offline synchronization queue
  - Create sync queue structure for pending mutations
  - Implement queueMutation(operation, data) to queue changes while offline
  - Implement sync() method to process queue when online
  - Add conflict resolution for concurrent updates
  - Provide sync status feedback to UI
  - _Requirements: 4.3, 4.4_

- [ ]* 3.6 Write unit tests for Cache Manager
  - Test cached data is retrievable after storage
  - Test expired cache entries are not returned
  - Test cache size respects 100MB limit
  - Test sensitive data is encrypted at rest
  - Test sync queue processes pending mutations
  - Test cache indicators show for cached data
  - _Requirements: 4.1, 4.2, 4.5, 4.6_

## Phase 4: Core Services - API Client

- [x] 4.1 Create API Client core structure
  - Create services/api/types.ts with APIResponse and request/response interfaces
  - Create services/api/APIClient.ts with class skeleton
  - Implement methods: get(), post(), put(), delete(), setBaseURL(), setAuthToken()
  - Set up base URL configuration from environment variables
  - _Requirements: 7.1, 7.2_

- [x] 4.2 Implement HTTP request methods with proper headers
  - Implement get(endpoint, options) for GET requests
  - Implement post(endpoint, data, options) for POST requests
  - Implement put(endpoint, data, options) for PUT requests
  - Implement delete(endpoint, options) for DELETE requests
  - Add Content-Type: application/json header to all requests
  - Add Authorization: Bearer {token} header when token is set
  - _Requirements: 7.2, 3.3_

- [x] 4.3 Implement request timeout and error handling
  - Set 30-second timeout for all API requests
  - Implement timeout error handling with user-friendly messages
  - Handle 401 Unauthorized by triggering token refresh
  - Handle 403 Forbidden with permission error message
  - Handle 404 Not Found with resource error message
  - Handle 5xx Server errors with retry option
  - Handle network errors with offline message
  - _Requirements: 7.3, 7.4, 7.5_

- [x] 4.4 Implement JSON response parsing and validation
  - Parse JSON responses from backend
  - Validate response structure matches APIResponse interface
  - Extract data payload from response
  - Handle malformed JSON responses
  - Implement error response parsing
  - _Requirements: 7.4_

- [x] 4.5 Implement HTTPS and certificate pinning for production
  - Configure HTTPS for all API requests
  - Implement certificate pinning for production environment
  - Validate SSL certificates on requests
  - Disable certificate pinning for development environment
  - _Requirements: 7.6, 12.3_

- [x] 4.6 Create request interceptor for token management
  - Create services/api/RequestInterceptor.ts
  - Implement interceptor to add JWT token to requests
  - Implement interceptor to handle 401 responses and trigger refresh
  - Integrate interceptor into APIClient
  - _Requirements: 3.3, 3.4_

- [ ]* 4.7 Write unit tests for API Client
  - Test requests include JWT token in Authorization header
  - Test requests include Content-Type header
  - Test timeout occurs after 30 seconds
  - Test network errors return user-friendly messages
  - Test JSON responses are parsed correctly
  - Test HTTPS is used for sensitive data
  - Test 401 responses trigger token refresh
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

## Phase 5: UI & Navigation

- [x] 5.1 Set up Expo Router navigation structure
  - Create app/_layout.tsx as root layout
  - Configure tab-based navigation in app/(tabs)/_layout.tsx
  - Create app/(tabs)/index.tsx for home screen
  - Create app/(tabs)/profile.tsx for profile screen
  - Create app/(tabs)/settings.tsx for settings screen
  - Set up navigation state management
  - _Requirements: 6.5_

- [x] 5.2 Create authentication screens
  - Create app/login.tsx screen with email/password form
  - Create app/register.tsx screen for new user registration
  - Implement form validation for email and password
  - Integrate with AuthenticationManager for login/register
  - Add error message display for authentication failures
  - Add loading state during authentication
  - _Requirements: 3.1, 3.2_

- [x] 5.3 Create splash screen and app initialization
  - Create app/splash.tsx as initial screen
  - Implement app initialization logic (load token, initialize services)
  - Add splash screen display during startup
  - Redirect to login if no token, or home if authenticated
  - Initialize AuthenticationManager and CacheManager on app start
  - _Requirements: 6.4, 6.5_

- [x] 5.4 Create home screen with data display
  - Create home screen component to display cached data
  - Implement data fetching from API using APIClient
  - Integrate with CacheManager to display cached data when offline
  - Add cache indicator to show when data is from cache
  - Add pull-to-refresh functionality
  - Add error handling for failed requests
  - _Requirements: 4.2, 4.4, 7.1_

- [x] 5.5 Create profile and settings screens
  - Create profile screen to display user information
  - Create settings screen with app configuration options
  - Add logout button to settings screen
  - Implement logout flow (clear token, redirect to login)
  - Add cache management options (clear cache, view cache size)
  - _Requirements: 3.6, 4.1_

- [x] 5.6 Create custom hooks for service integration
  - Create hooks/useAuth.ts hook for authentication state
  - Create hooks/useCache.ts hook for cache operations
  - Create hooks/useAPI.ts hook for API requests
  - Implement hooks to manage service state and provide methods to components
  - _Requirements: 3.1, 4.1, 7.1_

- [ ]* 5.7 Write component tests for screens
  - Test login screen renders and accepts input
  - Test home screen displays cached data when offline
  - Test cache indicator shows for cached data
  - Test profile screen displays user information
  - Test settings screen has logout button
  - Test navigation between screens works correctly
  - _Requirements: 4.2, 4.4, 6.5_

## Phase 6: Build & Deployment Configuration

- [x] 6.1 Configure Android build settings in app.json
  - Set up app.json with correct app name and version
  - Configure Android-specific settings (package name, version code)
  - Set up app icons and splash screen images
  - Configure permissions (INTERNET, ACCESS_NETWORK_STATE)
  - Set up Android SDK versions (target: 34, minimum: 24)
  - _Requirements: 2.1, 2.2, 2.7, 6.3_

- [x] 6.2 Configure Gradle build settings
  - Create android/build.gradle with correct SDK versions
  - Set compileSdk to 34, minSdk to 24
  - Configure ARM64 architecture as primary target
  - Set up signing configuration for release builds
  - Configure Gradle version to 8.0 or later
  - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [x] 6.3 Set up memory configuration for builds
  - Create build script to set GRADLE_OPTS with 4GB heap memory
  - Implement memory validation before build starts
  - Document memory requirements in BUILD.md
  - Add memory check to build prerequisites validation
  - _Requirements: 2.4, 5.6_

- [x] 6.4 Configure EAS build settings
  - Create eas.json with build configuration
  - Set up Android build profile with correct SDK versions
  - Configure signing configuration in EAS
  - Set up environment variables for EAS builds
  - Document EAS build process in BUILD.md
  - _Requirements: 5.5_

- [x] 6.5 Create build scripts for local and cloud builds
  - Create scripts/build-local.sh for local APK builds
  - Create scripts/build-eas.sh for EAS cloud builds
  - Create scripts/build-validate.sh to validate build configuration
  - Create scripts/build-clean.sh to clean build artifacts
  - Add scripts to package.json as npm commands
  - _Requirements: 5.1, 5.2, 5.5_

- [x] 6.6 Set up keystore and signing configuration
  - Generate keystore file for signing APKs
  - Store keystore securely (not in version control)
  - Configure signing configuration with keystore path and passwords
  - Use environment variables for keystore passwords
  - Document keystore setup in BUILD.md
  - _Requirements: 6.2, 12.1_

- [x] 6.7 Configure environment variable injection for builds
  - Set up build process to inject environment variables
  - Create build configuration loader in app startup
  - Validate required environment variables are present
  - Support different configurations for dev/staging/production
  - _Requirements: 10.4_

## Phase 7: Build Process & Validation

- [x] 7.1 Implement build prerequisite validation
  - Create scripts/validate-prerequisites.sh
  - Check Node.js version (16+)
  - Check Android SDK installation and version
  - Check Java version (11+)
  - Check available disk space
  - Provide clear error messages for missing prerequisites
  - _Requirements: 5.2_

- [x] 7.2 Implement build artifact cleanup
  - Create cleanup logic to remove previous build artifacts
  - Clear Gradle cache before build
  - Remove previous APK files
  - Clear build directory
  - Implement in build scripts
  - _Requirements: 5.1_

- [x] 7.3 Implement build configuration validation
  - Validate app.json configuration
  - Validate eas.json configuration
  - Validate Gradle configuration
  - Validate environment variables
  - Provide clear error messages for invalid configuration
  - _Requirements: 2.6, 5.2_

- [x] 7.4 Implement APK signing and generation
  - Integrate keystore signing into build process
  - Generate signed APK after compilation
  - Verify APK signature validity
  - Output signed APK to distribution directory
  - _Requirements: 5.3, 6.2_

- [x] 7.5 Implement APK validation after build
  - Create validation script to verify APK integrity
  - Check APK signature is valid
  - Verify APK structure and contents
  - Validate permissions in APK manifest
  - Confirm API levels match configuration
  - _Requirements: 9.1_

- [x] 7.6 Create comprehensive build documentation
  - Create BUILD.md with complete build instructions
  - Document prerequisites (Node.js, Android SDK, Java versions)
  - Provide step-by-step local build instructions
  - Provide step-by-step EAS cloud build instructions
  - Document environment variables and configuration
  - Include troubleshooting guide for common errors
  - Document memory requirements and optimization tips
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

## Phase 8: Testing & Validation

- [x] 8.1 Write integration tests for authentication flow
  - Test complete login flow: credentials → token → storage → API request
  - Test token refresh on expiration
  - Test logout clears token and redirects to login
  - Test failed login shows error message
  - Test failed refresh redirects to login
  - _Requirements: 3.1, 3.2, 3.4, 3.5, 3.6_

- [x] 8.2 Write integration tests for offline caching
  - Test app displays cached data when offline
  - Test pending mutations are queued while offline
  - Test sync occurs when connectivity restored
  - Test cache indicators show for offline data
  - Test cache expiration after 24 hours
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 8.3 Write integration tests for API communication
  - Test API requests include JWT token
  - Test API requests include Content-Type header
  - Test timeout occurs after 30 seconds
  - Test network errors show user-friendly messages
  - Test JSON responses are parsed correctly
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 8.4 Write integration tests for build process
  - Test local build produces valid signed APK
  - Test EAS cloud build produces valid signed APK
  - Test APK installs on Android 7.0+ devices
  - Test app launches without crashes
  - Test backend connectivity verified on launch
  - _Requirements: 5.1, 5.2, 5.3, 6.1, 9.1_

- [x] 8.5 Implement memory usage monitoring and tests
  - Add memory profiling to app
  - Test app memory usage stays under 150MB during normal operation
  - Test app releases unused memory when idle
  - Test large lists use virtualization to prevent memory issues
  - Test images are cached and compressed appropriately
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 8.6 Implement security validation tests
  - Test JWT tokens are stored securely (not in plain text)
  - Test sensitive cached data is encrypted at rest
  - Test API requests use HTTPS
  - Test sensitive information is not logged
  - Test certificate pinning works for production
  - _Requirements: 12.1, 12.2, 12.3, 12.5_

- [x] 8.7 Checkpoint - Ensure all tests pass
  - Run full test suite (unit + integration tests)
  - Verify all tests pass without failures
  - Check code coverage meets minimum threshold (80%+)
  - Review test results and fix any failures
  - Ask the user if questions arise.

## Phase 9: Documentation & Cleanup

- [x] 9.1 Create comprehensive README.md
  - Document project overview and purpose
  - List all dependencies and versions
  - Provide quick start instructions
  - Document project structure and organization
  - Include links to BUILD.md and other documentation
  - Add troubleshooting section
  - _Requirements: 8.1_

- [x] 9.2 Create environment setup documentation
  - Document all environment variables in .env.example
  - Explain each variable's purpose and valid values
  - Provide example values for development/production
  - Document how to set up environment for different scenarios
  - _Requirements: 10.1, 10.5_

- [x] 9.3 Create API integration documentation
  - Document all API endpoints used by the app
  - Document request/response formats
  - Document authentication flow
  - Document error handling and error codes
  - Provide examples of API calls
  - _Requirements: 7.1, 7.2_

- [x] 9.4 Create architecture and design documentation
  - Document system architecture and component relationships
  - Document data flow through the application
  - Document authentication and caching flows
  - Document build process workflow
  - Include diagrams and visual representations
  - _Requirements: 1.1, 3.1, 4.1, 7.1_

- [x] 9.5 Clean up and finalize project
  - Remove any temporary files or debug code
  - Verify all dependencies are used and necessary
  - Run linter and fix any style issues
  - Verify TypeScript compilation without errors
  - Verify all tests pass
  - _Requirements: 1.2, 1.3_

- [x] 9.6 Create deployment checklist
  - Document pre-deployment validation steps
  - Create checklist for production release
  - Document rollback procedures
  - Document monitoring and alerting setup
  - Document support and troubleshooting procedures
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 9.7 Final checkpoint - Ensure all requirements met
  - Verify all requirements are implemented
  - Verify all acceptance criteria are satisfied
  - Verify all documentation is complete
  - Verify all tests pass
  - Ask the user if questions arise.

## Task Dependencies

**Critical Path**:
1. Phase 1 (Foundation) → Phase 2 (Auth) → Phase 3 (Cache) → Phase 4 (API)
2. Phase 4 (API) → Phase 5 (UI) → Phase 8 (Testing)
3. Phase 1 (Foundation) → Phase 6 (Build Config) → Phase 7 (Build Process)
4. Phase 8 (Testing) → Phase 9 (Documentation)

**Parallel Work**:
- Phase 2, 3, 4 can be worked on in parallel after Phase 1
- Phase 6 can start after Phase 1
- Phase 5 can start after Phase 2, 3, 4 are mostly complete

## Validation Criteria

Each phase has specific validation criteria:

**Phase 1**: Project initializes without errors, all dependencies installed
**Phase 2**: Authentication flow works end-to-end with token storage
**Phase 3**: Caching works offline, expiration works, encryption works
**Phase 4**: API requests include headers, timeout works, errors handled
**Phase 5**: All screens render, navigation works, data displays correctly
**Phase 6**: Gradle configuration valid, environment variables injected
**Phase 7**: Build completes successfully, APK is signed and valid
**Phase 8**: All tests pass, coverage meets threshold, no memory leaks
**Phase 9**: All documentation complete, project ready for deployment

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Testing tasks validate both functionality and requirements
- Build documentation is critical for reproducibility
- Security validation ensures user data protection
