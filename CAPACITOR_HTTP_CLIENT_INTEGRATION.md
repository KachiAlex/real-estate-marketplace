# Capacitor HTTP Client Integration

## Overview

The Capacitor HTTP Client is a unified HTTP wrapper that provides a consistent API for making HTTP requests across both native (iOS/Android) and web platforms. It automatically detects the platform and uses the appropriate HTTP implementation.

## What Was Implemented

### 1. Core HTTP Client (`src/services/capacitorHttpClient.ts`)

A fully-featured HTTP client with:

- **Platform Detection**: Automatically uses Capacitor HTTP plugin on native platforms, fetch API on web
- **HTTP Methods**: GET, POST, PUT, DELETE, PATCH
- **Error Handling**: Custom error classes (HttpError, NetworkError, TimeoutError)
- **Interceptors**: Request, response, and error interceptors for customization
- **Configuration**: Base URL, headers, timeout management
- **URL Building**: Automatic URL construction with query parameter support

### 2. API Configuration Integration (`src/config/api.ts`)

Updated the existing API configuration to:

- **Singleton HTTP Client**: `getHttpClient()` returns a shared instance
- **Automatic Initialization**: Client is created with proper base URL and headers
- **Reset Capability**: `resetHttpClient()` for testing or dynamic URL changes
- **Backward Compatible**: All existing functions remain unchanged

### 3. Type Declarations (`src/services/capacitor-http.d.ts`)

Type definitions for the Capacitor HTTP plugin to support TypeScript compilation.

### 4. Usage Examples (`src/services/capacitorHttpClient.example.ts`)

Comprehensive examples showing:

- Initialization and configuration
- Making requests (GET, POST, etc.)
- Adding interceptors
- Error handling
- Custom timeouts
- Dynamic base URL changes

## Key Features

### Platform-Aware Routing

```typescript
// Automatically uses Capacitor HTTP on native, fetch on web
const response = await client.get('/users');
```

### Error Handling

```typescript
try {
  const response = await client.get('/users');
} catch (error) {
  if (error instanceof HttpError) {
    console.error(`HTTP ${error.status}: ${error.statusText}`);
  } else if (error instanceof NetworkError) {
    console.error('Network failed:', error.message);
  } else if (error instanceof TimeoutError) {
    console.error('Request timed out');
  }
}
```

### Request Interceptors

```typescript
client.addRequestInterceptor((config) => {
  // Add auth token to all requests
  config.headers = {
    ...config.headers,
    'Authorization': `Bearer ${token}`,
  };
  return config;
});
```

### Response Interceptors

```typescript
client.addResponseInterceptor((response) => {
  // Process all responses
  console.log(`Response: ${response.status}`);
  return response;
});
```

### Error Interceptors

```typescript
client.addErrorInterceptor((error) => {
  // Handle specific errors
  if (error instanceof HttpError && error.status === 401) {
    // Redirect to login
  }
  return error;
});
```

## Usage in Your App

### 1. Initialize in App Startup

```typescript
import { configureHttpPlugin } from './config/api';

// In your app initialization
await configureHttpPlugin();
```

### 2. Use in Components/Services

```typescript
import { getHttpClient } from './config/api';

export async function fetchUsers() {
  const client = getHttpClient();
  const response = await client.get('/users');
  return response.data;
}
```

### 3. Add Custom Interceptors

```typescript
import { getHttpClient } from './config/api';

// Add auth interceptor
getHttpClient().addRequestInterceptor((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`,
    };
  }
  return config;
});
```

## Configuration

### Base URL

The base URL is determined by (in priority order):

1. `REACT_APP_MOBILE_API_URL` (for native platforms)
2. `REACT_APP_API_URL` (general environment variable)
3. Platform-specific defaults
4. Production URL fallback

### Default Headers

Automatically includes:

- `Content-Type: application/json`
- `Accept: application/json`
- `X-Platform: ios|android` (on native)
- `X-Client: capacitor-mobile` (on native)

### Timeout

Default timeout is 30 seconds. Can be customized:

```typescript
const client = new CapacitorHttpClient(baseUrl, 60000); // 60 seconds
```

## API Reference

### CapacitorHttpClient

#### Methods

- `get<T>(url, config?)` - GET request
- `post<T>(url, data?, config?)` - POST request
- `put<T>(url, data?, config?)` - PUT request
- `delete<T>(url, config?)` - DELETE request
- `patch<T>(url, data?, config?)` - PATCH request

#### Configuration Methods

- `getBaseUrl()` - Get current base URL
- `setBaseUrl(url)` - Set base URL
- `getDefaultHeaders()` - Get default headers
- `setDefaultHeaders(headers)` - Set default headers
- `getDefaultTimeout()` - Get timeout
- `setDefaultTimeout(ms)` - Set timeout

#### Interceptors

- `addRequestInterceptor(fn)` - Add request interceptor
- `addResponseInterceptor(fn)` - Add response interceptor
- `addErrorInterceptor(fn)` - Add error interceptor

### Error Classes

- `HttpError` - HTTP status errors (4xx, 5xx)
  - `status: number`
  - `statusText: string`
  - `data: any`

- `NetworkError` - Network failures
  - `message: string`

- `TimeoutError` - Request timeouts
  - `message: string`

## Testing

The implementation includes comprehensive test coverage:

- `src/services/capacitorHttpClient.test.ts` - Unit tests
- `src/config/api.test.ts` - API configuration tests

Tests cover:

- Platform detection
- HTTP methods
- Error handling
- Interceptors
- URL building
- Configuration management

## Migration Guide

If you're currently using the Capacitor HTTP plugin directly:

### Before

```typescript
import { Http } from '@capacitor/http';

const response = await Http.request({
  method: 'GET',
  url: 'https://api.example.com/users',
  headers: { 'Authorization': 'Bearer token' },
});
```

### After

```typescript
import { getHttpClient } from './config/api';

const client = getHttpClient();
const response = await client.get('/users', {
  headers: { 'Authorization': 'Bearer token' },
});
```

## Benefits

1. **Unified API** - Same code works on web and native
2. **Automatic Platform Detection** - No need to check platform manually
3. **Better Error Handling** - Typed error classes
4. **Interceptors** - Centralized request/response processing
5. **Type Safe** - Full TypeScript support
6. **Testable** - Easy to mock and test
7. **Flexible** - Supports custom configuration and interceptors

## Next Steps

1. **Update existing API calls** to use the new client
2. **Add authentication interceptor** for token management
3. **Add error handling interceptor** for consistent error handling
4. **Test on native platforms** (iOS/Android)
5. **Monitor performance** and adjust timeouts as needed

## Troubleshooting

### "Cannot find module '@capacitor/http'"

This is expected if the plugin isn't installed. The client gracefully falls back to fetch API.

### Requests timing out

Increase the timeout:

```typescript
const response = await client.get('/endpoint', { timeout: 60000 });
```

### Headers not being sent

Ensure headers are set before making requests:

```typescript
client.setDefaultHeaders({ 'Authorization': 'Bearer token' });
```

### Platform detection not working

Verify Capacitor is properly initialized:

```typescript
import { Capacitor } from '@capacitor/core';
console.log(Capacitor.isNativePlatform()); // Should be true on native
```

## Files Modified/Created

- ✅ `src/services/capacitorHttpClient.ts` - Main implementation
- ✅ `src/services/capacitor-http.d.ts` - Type declarations
- ✅ `src/services/capacitorHttpClient.example.ts` - Usage examples
- ✅ `src/config/api.ts` - Updated with HTTP client integration
- ✅ `src/services/capacitorHttpClient.test.ts` - Unit tests (existing)
- ✅ `src/config/api.test.ts` - API tests (existing)

## Support

For issues or questions:

1. Check the examples in `capacitorHttpClient.example.ts`
2. Review the test files for usage patterns
3. Check the Capacitor documentation for platform-specific issues
