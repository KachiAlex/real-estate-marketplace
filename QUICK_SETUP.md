# Quick Setup Guide - Capacitor HTTP Client

Get started with the Capacitor HTTP client in 5 minutes.

## 1. Initialize in Your App

Add this to your app's main entry point (`App.tsx` or `main.tsx`):

```typescript
import { setupAuthInterceptors, setOnLogoutCallback } from './services/authInterceptor';
import { configureHttpPlugin } from './config/api';

// Initialize HTTP client
configureHttpPlugin();

// Setup authentication
setupAuthInterceptors();

// Handle logout
setOnLogoutCallback(() => {
  window.location.href = '/login';
});
```

## 2. Use in Components

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

## 3. Handle Authentication

```typescript
import { setAuthTokens, getAuthToken, clearAuthTokens } from './services/authInterceptor';

// After login
setAuthTokens(token, refreshToken, expiryMs);

// Check if authenticated
const token = getAuthToken();

// Logout
clearAuthTokens();
```

## 4. Handle Offline

```typescript
import { getOfflineManager } from './services/offlineManager';

const offlineManager = getOfflineManager();

// Check connection
if (offlineManager.isConnected()) {
  // Make request
} else {
  // Queue request or use cache
  const cached = offlineManager.getCache('key');
}

// Listen for changes
offlineManager.addListener((isOnline) => {
  console.log('Online:', isOnline);
});
```

## 5. Common Patterns

### GET with Query Parameters
```typescript
const response = await apiClient.get('/users', {
  params: { page: 1, limit: 20 }
});
```

### POST with Data
```typescript
const response = await apiClient.post('/users', {
  name: 'John',
  email: 'john@example.com'
});
```

### Custom Headers
```typescript
const response = await apiClient.get('/data', {
  headers: { 'X-Custom': 'value' }
});
```

### Custom Timeout
```typescript
const response = await apiClient.get('/data', {
  timeout: 10000 // 10 seconds
});
```

## Environment Setup

Add to `.env`:

```env
REACT_APP_API_URL=https://api.example.com
REACT_APP_MOBILE_API_URL=https://api.example.com
```

## Testing

```typescript
import { getApiClient, resetApiClient } from './services/apiClientBridge';

beforeEach(() => {
  resetApiClient();
});

it('should fetch data', async () => {
  const apiClient = getApiClient();
  const response = await apiClient.get('/test');
  expect(response.success).toBe(true);
});
```

## Troubleshooting

**CORS errors on web?**
- Check backend CORS configuration
- Verify API URL is correct

**SSL errors on native?**
- Verify certificate is valid
- Check domain matches certificate

**Timeout errors?**
- Increase timeout value
- Check network connection

## Next Steps

1. Replace existing axios calls with the new client
2. Add authentication setup to your app
3. Test on web and native platforms
4. Add offline handling where needed

## Documentation

- Full guide: `CAPACITOR_HTTP_INTEGRATION_GUIDE.md`
- Migration guide: `MIGRATION_GUIDE.md`
- Examples: `src/services/capacitorHttpClient.example.ts`
- Tests: `src/services/capacitorHttpClient.integration.test.ts`
