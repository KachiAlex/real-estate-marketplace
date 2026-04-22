# Blog API 404 Error Analysis

## Error Summary
The frontend is receiving 404 errors when trying to fetch blog posts from:
- `api-759115682573.us-central1.run.app/api/blog?featured=true&limit=3&sort=newest:1`
- `api-759115682573.us-central1.run.app/api/blog?limit=4&sort=newest:1`

## Root Causes

### 1. **Backend Route Not Accessible (Most Likely)**
The 404 error indicates the route `/api/blog` is not being found by the Express server. This could mean:
- **Backend server is not running** at `api-759115682573.us-central1.run.app`
- **Backend is not deployed** to Cloud Run
- **Route registration issue** - though the code shows the route is registered at line 198 in `backend/server.js`

### 2. **URL Parameter Issue**
The error shows `sort=newest:1` but the frontend code (in `BlogSection.js`) sends `sort=newest`. The `:1` suffix looks like MongoDB sort syntax that shouldn't be in the URL. However, the backend has a sanitizer to handle this (lines 91-97 in `backend/routes/blog.js`).

### 3. **Route Matching Problem**
There are **two 404 handlers** in `backend/server.js`:
- Line 347: `app.use('*', ...)`
- Line 388: `app.use((req, res) => ...)`

If the blog route isn't registered before these handlers, it will return 404.

## Code Analysis

### Frontend Code (Correct)
```javascript
// src/components/BlogSection.js:22
const featuredResponse = await fetch(`${API_BASE_URL}/api/blog?featured=true&limit=3&sort=newest`);
// src/components/BlogSection.js:44
const recentResponse = await fetch(`${API_BASE_URL}/api/blog?limit=4&sort=newest`);
```

### Backend Route (Exists)
```javascript
// backend/server.js:198
app.use('/api/blog', require('./routes/blog'));

// backend/routes/blog.js:84-99
router.get('/', [
  query('sort').optional().customSanitizer(value => {
    // Handle sort parameter - remove any MongoDB-style suffixes like :1
    if (typeof value === 'string') {
      return value.split(':')[0];
    }
    return value;
  }).isIn(['newest', 'oldest', 'popular', 'trending']),
  validate()
], async (req, res) => {
  // Route handler...
});
```

## Solutions

### Solution 1: Verify Backend is Running
1. Check if the backend is deployed to Cloud Run
2. Test the endpoint directly:
   ```bash
   curl https://api-759115682573.us-central1.run.app/api/blog?limit=1
   ```
3. Check Cloud Run logs for errors

### Solution 2: Check Route Registration Order
Ensure the blog route is registered **before** the 404 handlers in `server.js`:
```javascript
// Routes should be registered here (around line 198)
app.use('/api/blog', require('./routes/blog'));

// 404 handlers should be at the END (after all routes)
```

### Solution 3: Fix Duplicate 404 Handlers
Remove one of the duplicate 404 handlers in `backend/server.js` (lines 347 and 388).

### Solution 4: Add Error Handling in Frontend
The frontend already has error handling that silently fails (lines 25-40 in `BlogSection.js`), which is good. However, you might want to add logging:
```javascript
if (!featuredResponse.ok) {
  console.error('Blog API error:', featuredResponse.status, featuredResponse.statusText);
  // Check if it's a 404 specifically
  if (featuredResponse.status === 404) {
    console.warn('Blog API endpoint not found. Is the backend deployed?');
  }
}
```

### Solution 5: Check Firestore Connection
The blog routes use Firestore. If Firestore isn't initialized properly, the routes might fail:
```javascript
// backend/server.js:27-35
try {
  initializeFirestore();
  console.log('✅ Firestore initialized');
} catch (error) {
  console.warn('⚠️ Firestore initialization failed:', error.message);
  // This could cause blog routes to fail
}
```

## Debugging Steps

1. **Check backend logs** on Cloud Run to see if requests are reaching the server
2. **Test the endpoint directly** using curl or Postman
3. **Verify environment variables** are set correctly (especially `FIREBASE_SERVICE_ACCOUNT_KEY`)
4. **Check CORS settings** - ensure the frontend URL is allowed
5. **Verify the route path** - ensure there are no typos or path mismatches

## Expected Behavior

When working correctly:
- GET `/api/blog?featured=true&limit=3&sort=newest` should return:
  ```json
  {
    "success": true,
    "data": [...],
    "pagination": {...}
  }
  ```

## Current Status

The frontend code is correct and handles errors gracefully. The issue is likely:
- Backend not deployed/running
- Firestore not initialized
- Route not matching due to middleware order

