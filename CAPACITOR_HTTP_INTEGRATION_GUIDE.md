# Capacitor HTTP Client Integration Guide

## Overview

The Capacitor HTTP client has been fully integrated into your application. This guide explains how to use it throughout your codebase.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Components                          │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              API Client Bridge                               │
│  (src/services/apiClientBridge.ts)                          │
│  - Unified interface for API calls                          │
│  - Error handling & response formatting                     │
│  - Interceptor support                                      │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│           Capacitor HTTP Client                              │
│  (src/services/capacitorHttpClient.ts)                      │
│  - Platform detection (native/web)                          │
│  - Capacitor HTTP plugin on native                          │
│  - Fetch API on web                                         │
│  - Timeout & error handling                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼──────────┐    ┌────────▼────────┐
│ Capacitor HTTP   │    │   Fetch API     │
│ Plugin (Native)  │    │   (Web)         │
└──────────────────┘    └─────────────────┘
```

## Quick Start

### 1. Basic API Call

```typescript
import { getApiClient } from './services/apiClientBridge';

async function fetchUsers() {
  const apiClient = getApiClient();
  const response = await apiClient.get('/users');
  
  if (response.success) {
    console.log('Users:', response.data);
  } else {
    console.error('Error:', response.error);
  }
}
```

### 2. POST Request with Data

```typescript
async function createProperty() {
  const apiClient = getApiClient();
  
  const response = await apiClient.post('/properties', {
    title: 'Beautiful House',
    price: 250000,
    location: 'New York',
  });
  
  if (response.success) {
    console.log('Created:', response.data);
  } else {
    console.error('Error:', response.error);
  }
}
```

### 3. Query Parameters

```typescript
async function searchProperties() {
  const apiClient = getApiClient();
  
  const response = await apiClient.get('/properties', {
    params: {
      location: 'New York',
      minPrice: 100000,
      maxPrice: 500000,
      page: 1,
      limit: 20,
    },
  });
  
  if (response.success) {
    console.log('Results:', response.data);
  }
}
```

### 4. Custom Headers

```typescript
async function updateProfile() {
  const apiClient = getApiClient();
  
  const response = await apiClient.put('/profile', 
    { name: 'John Doe' },
    {
      headers: {
        'Authorization': 'Bearer your-token',
        'X-Custom-Header': 'value',
      },
    }
  );
  
  if (response.success) {
    console.log('Updated:', response.data);
  }
}
```

## React Component Integration

### Functional Component with Hooks

```typescript
import React, { useState, useEffect } from 'react';
import { getApiClient } from './services/apiClientBridge';

function PropertyList() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  async function fetchProperties() {
    setLoading(true);
    setError(null);
    
    const apiClient = getApiClient();
    const response = await apiClient.get('/properties', {
      params: { limit: 20 },
    });
    
    if (response.success) {
      setProperties(response.data || []);
    } else {
      setError(response.error);
    }
    
    setLoading(false);
  }

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {properties.map((property) => (
        <div key={property.id}>
          <h3>{property.title}</h3>
          <p>${property.price}</p>
        </div>
      ))}
    </div>
  );
}

export default PropertyList;
```

### Form Submission

```typescript
import React, { useState } from 'react';
import { getApiClient } from './services/apiClientBridge';

function CreateProperty() {
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    location: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    const apiClient = getApiClient();
    const response = await apiClient.post('/properties', formData);
    
    if (response.success) {
      setSuccess(true);
      setFormData({ title: '', price: '', location: '' });
    } else {
      setError(response.error);
    }
    
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        required
      />
      <input
        type="number"
        placeholder="Price"
        value={formData.price}
        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
        required
      />
      <input
        type="text"
        placeholder="Location"
        value={formData.location}
        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Property'}
      </button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {success && <div style={{ color: 'green' }}>Property created!</div>}
    </form>
  );
}

export default CreateProperty;
```

## Advanced Usage

### Setting Up Interceptors

```typescript
import { getHttpClient } from './config/api';

// Initialize interceptors on app startup
export function setupInterceptors() {
  const httpClient = getHttpClient();
  
  // Add authentication token to all requests
  httpClient.addRequestInterceptor((config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      return {
        ...config,
        headers: {
          ...config.headers,
          'Authorization': `Bearer ${token}`,
        },
      };
    }
    return config;
  });
  
  // Handle 401 responses
  httpClient.addResponseInterceptor((response) => {
    if (response.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return response;
  });
  
  // Log errors
  httpClient.addErrorInterceptor((error) => {
    console.error('API Error:', error.message);
    return error;
  });
}

// Call this in your App.tsx or main.tsx
setupInterceptors();
```

### Error Handling Patterns

```typescript
async function handleApiCall() {
  const apiClient = getApiClient();
  const response = await apiClient.get('/data');
  
  if (!response.success) {
    // Handle different error types
    if (response.status === 404) {
      console.log('Resource not found');
    } else if (response.status === 401) {
      console.log('Unauthorized - please login');
    } else if (response.status === 500) {
      console.log('Server error - please try again later');
    } else {
      console.log('Error:', response.error);
    }
  }
}
```

### Retry Logic

```typescript
async function fetchWithRetry(path, maxRetries = 3) {
  const apiClient = getApiClient();
  let retries = 0;
  
  while (retries < maxRetries) {
    const response = await apiClient.get(path);
    
    if (response.success) {
      return response.data;
    }
    
    retries++;
    if (retries < maxRetries) {
      // Exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, retries) * 1000)
      );
    }
  }
  
  throw new Error(`Failed after ${maxRetries} retries`);
}
```

## Configuration

### Environment Variables

Set these in your `.env` file:

```env
# Mobile-specific API URL (used on native platforms)
REACT_APP_MOBILE_API_URL=https://api.example.com

# General API URL (fallback)
REACT_APP_API_URL=https://api.example.com
```

### API Configuration

The API configuration is in `src/config/api.ts`:

```typescript
// Get the HTTP client
const httpClient = getHttpClient();

// Get the API base URL
const baseUrl = getApiBaseUrl();

// Get the full API URL for a path
const url = getApiUrl('/users');

// Get platform information
const platform = getPlatformInfo();
// Returns: { platform: 'ios'|'android'|'web', isNative: boolean, ... }

// Get API configuration
const config = getApiConfig();
```

## API Methods

### GET Request

```typescript
const response = await apiClient.get('/path', {
  params: { key: 'value' },
  headers: { 'Custom-Header': 'value' },
  timeout: 30000,
});
```

### POST Request

```typescript
const response = await apiClient.post('/path', 
  { data: 'value' },
  {
    params: { key: 'value' },
    headers: { 'Custom-Header': 'value' },
    timeout: 30000,
  }
);
```

### PUT Request

```typescript
const response = await apiClient.put('/path', 
  { data: 'value' },
  { /* options */ }
);
```

### DELETE Request

```typescript
const response = await apiClient.delete('/path', {
  params: { key: 'value' },
  headers: { 'Custom-Header': 'value' },
  timeout: 30000,
});
```

### PATCH Request

```typescript
const response = await apiClient.patch('/path', 
  { data: 'value' },
  { /* options */ }
);
```

## Response Format

All API calls return a standardized response:

```typescript
interface ApiResponse<T = any> {
  success: boolean;      // true if request succeeded
  data?: T;              // Response data (if successful)
  error?: string;        // Error message (if failed)
  status?: number;       // HTTP status code
}
```

## Error Handling

The client automatically handles:

- **HTTP Errors** (4xx, 5xx) - Converted to `HttpError`
- **Network Errors** - Converted to `NetworkError`
- **Timeout Errors** - Converted to `TimeoutError`

All errors are caught and returned in the response object with `success: false`.

## Platform-Specific Behavior

### Native Platforms (iOS/Android)

- Uses Capacitor HTTP plugin
- Handles SSL certificates properly
- Supports native authentication
- Better performance for large files

### Web Platform

- Uses standard Fetch API
- Full CORS support
- Browser cache support
- Standard error handling

## Testing

### Unit Tests

```typescript
import { getApiClient, resetApiClient } from './services/apiClientBridge';

describe('API Client', () => {
  beforeEach(() => {
    resetApiClient();
  });

  it('should fetch data', async () => {
    const apiClient = getApiClient();
    // Mock the HTTP client if needed
    const response = await apiClient.get('/test');
    expect(response.success).toBe(true);
  });
});
```

### Integration Tests

See `src/services/capacitorHttpClient.integration.test.ts` for comprehensive integration tests.

## Best Practices

1. **Always check `response.success`** before accessing `response.data`
2. **Use the API Client Bridge** for most use cases (not the HTTP client directly)
3. **Set up interceptors** for authentication and error handling
4. **Handle errors gracefully** in your UI
5. **Use appropriate timeouts** for different types of requests
6. **Log errors** for debugging
7. **Test on both platforms** (native and web)

## Troubleshooting

### CORS Errors on Web

If you see CORS errors on web:
1. Check that your backend allows CORS
2. Verify the API URL is correct
3. Check browser console for details

### SSL Certificate Errors on Native

If you see SSL errors on native:
1. Ensure your certificate is valid
2. Check that the domain matches the certificate
3. Try using the Capacitor HTTP plugin directly

### Timeout Errors

If requests are timing out:
1. Increase the timeout value
2. Check your network connection
3. Verify the API server is responding

## Files

- `src/services/capacitorHttpClient.ts` - Core HTTP client
- `src/services/apiClientBridge.ts` - API client bridge
- `src/config/api.ts` - API configuration
- `src/services/capacitorHttpClient.test.ts` - Unit tests
- `src/services/capacitorHttpClient.integration.test.ts` - Integration tests
- `src/services/capacitorHttpClient.example.ts` - Usage examples

## Support

For issues or questions:
1. Check the examples in `capacitorHttpClient.example.ts`
2. Review the integration tests
3. Check the Capacitor documentation
4. Review your API server logs
