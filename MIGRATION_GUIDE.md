# Migration Guide: Axios to Capacitor HTTP Client

This guide helps you migrate existing API calls from axios to the new Capacitor HTTP client.

## Step 1: Setup Authentication (One-time)

In your app initialization (e.g., `App.tsx` or `main.tsx`):

```typescript
import { setupAuthInterceptors, setOnLogoutCallback } from './services/authInterceptor';
import { configureHttpPlugin } from './config/api';

// Initialize HTTP client
configureHttpPlugin();

// Setup authentication
setupAuthInterceptors();

// Handle logout
setOnLogoutCallback(() => {
  // Redirect to login or show login modal
  window.location.href = '/login';
});
```

## Step 2: Replace Axios Imports

### Before (Axios)
```typescript
import axios from 'axios';

const response = await axios.get('/api/users');
```

### After (Capacitor HTTP Client)
```typescript
import { getApiClient } from './services/apiClientBridge';

const apiClient = getApiClient();
const response = await apiClient.get('/users');
```

## Step 3: Update API Calls

### GET Requests

**Before:**
```typescript
const response = await axios.get('/api/users/123');
const data = response.data;
```

**After:**
```typescript
const apiClient = getApiClient();
const response = await apiClient.get('/users/123');

if (response.success) {
  const data = response.data;
} else {
  console.error('Error:', response.error);
}
```

### POST Requests

**Before:**
```typescript
const response = await axios.post('/api/users', {
  name: 'John',
  email: 'john@example.com',
});
const newUser = response.data;
```

**After:**
```typescript
const apiClient = getApiClient();
const response = await apiClient.post('/users', {
  name: 'John',
  email: 'john@example.com',
});

if (response.success) {
  const newUser = response.data;
} else {
  console.error('Error:', response.error);
}
```

### PUT Requests

**Before:**
```typescript
const response = await axios.put('/api/users/123', {
  name: 'Jane',
});
```

**After:**
```typescript
const apiClient = getApiClient();
const response = await apiClient.put('/users/123', {
  name: 'Jane',
});
```

### DELETE Requests

**Before:**
```typescript
await axios.delete('/api/users/123');
```

**After:**
```typescript
const apiClient = getApiClient();
const response = await apiClient.delete('/users/123');

if (!response.success) {
  console.error('Error:', response.error);
}
```

### Query Parameters

**Before:**
```typescript
const response = await axios.get('/api/users', {
  params: {
    page: 1,
    limit: 20,
  },
});
```

**After:**
```typescript
const apiClient = getApiClient();
const response = await apiClient.get('/users', {
  params: {
    page: 1,
    limit: 20,
  },
});
```

### Custom Headers

**Before:**
```typescript
const response = await axios.get('/api/data', {
  headers: {
    'X-Custom-Header': 'value',
  },
});
```

**After:**
```typescript
const apiClient = getApiClient();
const response = await apiClient.get('/data', {
  headers: {
    'X-Custom-Header': 'value',
  },
});
```

## Step 4: Update React Components

### Before (Axios)
```typescript
import { useState, useEffect } from 'react';
import axios from 'axios';

function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      try {
        const response = await axios.get('/api/users');
        setUsers(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUsers();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### After (Capacitor HTTP Client)
```typescript
import { useState, useEffect } from 'react';
import { getApiClient } from './services/apiClientBridge';

function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      
      const apiClient = getApiClient();
      const response = await apiClient.get('/users');
      
      if (response.success) {
        setUsers(response.data || []);
      } else {
        setError(response.error);
      }
      
      setLoading(false);
    }
    
    fetchUsers();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

## Step 5: Handle Offline Scenarios

```typescript
import { getOfflineManager } from './services/offlineManager';
import { getApiClient } from './services/apiClientBridge';

function MyComponent() {
  const offlineManager = getOfflineManager();
  const apiClient = getApiClient();

  // Listen for online/offline changes
  useEffect(() => {
    const unsubscribe = offlineManager.addListener((isOnline) => {
      console.log('Network status:', isOnline ? 'online' : 'offline');
    });

    return unsubscribe;
  }, []);

  async function fetchData() {
    // Check if online
    if (!offlineManager.isConnected()) {
      // Try to get from cache
      const cached = offlineManager.getCache('users');
      if (cached) {
        console.log('Using cached data');
        return cached;
      }
      
      // Queue request for later
      const requestId = offlineManager.queueRequest('GET', '/users');
      console.log('Request queued:', requestId);
      return null;
    }

    // Make request normally
    const response = await apiClient.get('/users');
    
    if (response.success) {
      // Cache the result
      offlineManager.setCache('users', response.data, 10 * 60 * 1000); // 10 min TTL
      return response.data;
    }
    
    return null;
  }

  return (
    <button onClick={fetchData}>
      Fetch Data
    </button>
  );
}
```

## Step 6: Error Handling

### Common Error Patterns

```typescript
const apiClient = getApiClient();
const response = await apiClient.get('/data');

if (!response.success) {
  // Handle different error types
  if (response.status === 404) {
    console.log('Resource not found');
  } else if (response.status === 401) {
    console.log('Unauthorized - redirecting to login');
  } else if (response.status === 500) {
    console.log('Server error - please try again later');
  } else {
    console.log('Error:', response.error);
  }
}
```

## Step 7: Remove Axios

Once all API calls are migrated:

1. Remove axios from `package.json`
2. Run `npm install` or `yarn install`
3. Remove any axios configuration files

## Migration Checklist

- [ ] Setup authentication interceptors in app initialization
- [ ] Replace all axios imports with getApiClient
- [ ] Update all GET requests
- [ ] Update all POST requests
- [ ] Update all PUT requests
- [ ] Update all DELETE requests
- [ ] Update all PATCH requests
- [ ] Update React components using axios
- [ ] Add offline handling where needed
- [ ] Test on web platform
- [ ] Test on native platforms (iOS/Android)
- [ ] Remove axios from dependencies

## Common Issues

### Issue: "Cannot find module '@capacitor/http'"
**Solution**: This is expected on web. The client falls back to fetch API automatically.

### Issue: CORS errors on web
**Solution**: Ensure your backend allows CORS. Check browser console for details.

### Issue: SSL errors on native
**Solution**: Verify your certificate is valid and domain matches.

### Issue: Requests timing out
**Solution**: Increase timeout value in request options or check network connection.

## Performance Tips

1. **Cache frequently accessed data** - Use `offlineManager.setCache()`
2. **Batch requests** - Combine multiple requests when possible
3. **Use appropriate timeouts** - Shorter for quick operations, longer for uploads
4. **Monitor offline queue** - Check `offlineManager.getQueueStats()`
5. **Clear old cache** - Periodically call `offlineManager.clearAllCache()`

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
    const response = await apiClient.get('/test');
    expect(response.success).toBe(true);
  });
});
```

### Integration Tests

See `src/services/capacitorHttpClient.integration.test.ts` for comprehensive examples.

## Support

- Check `CAPACITOR_HTTP_INTEGRATION_GUIDE.md` for detailed documentation
- Review `src/services/capacitorHttpClient.example.ts` for code examples
- Check `src/services/capacitorHttpClient.integration.test.ts` for test patterns
