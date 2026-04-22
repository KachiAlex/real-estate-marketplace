# Design Document: Serverless Function Consolidation

## Overview

PropertyArk currently exceeds Vercel's Hobby plan limit of 12 serverless functions with 20+ separate functions across the api/ directory. This design consolidates related endpoints into 6 multi-purpose functions (Admin, Auth, User, Property, Content, Upload) while maintaining complete API compatibility, performance, and maintainability.

The consolidation strategy groups endpoints by domain responsibility, implements a consistent internal routing mechanism, and preserves all existing request/response formats. This approach reduces function count from 20+ to 6, staying well within the 12-function limit while improving code organization and reducing deployment complexity.

## Architecture

### High-Level Structure

```
Vercel Deployment (12 function limit)
├── api/admin.js (consolidated)
│   ├── /api/admin/* routes
│   └── /api/admin/disputes/* routes
├── api/auth.js (consolidated)
│   ├── /api/auth/login
│   ├── /api/auth/register
│   └── /api/auth/* routes
├── api/users.js (consolidated)
│   └── /api/users/* routes
├── api/properties.js (consolidated)
│   └── /api/properties/* routes
├── api/content.js (consolidated)
│   ├── /api/content/* routes
│   ├── /api/csrf-token/* routes
│   ├── /api/blog/* routes
│   └── /api/escrow/* routes
├── api/upload.js (consolidated)
│   └── /api/upload/* routes
└── [6 additional utility/middleware functions as needed]
```

### Consolidation Mapping

| Consolidated Function | Source Endpoints | Responsibility |
|---|---|---|
| **Admin** | api/admin.js, api/admin/disputes.js, api/admin/properties.js, api/admin/settings.js, api/admin/users.js | Admin operations, system setup, user management |
| **Auth** | api/auth/login.js, api/auth/register.js, api/auth/forgot-password.js, api/auth/reset-password.js, api/auth/jwt/me.js | Authentication, JWT, password reset |
| **User** | api/users.js | User profiles, user-related operations |
| **Property** | api/properties.js | Property listings, property operations |
| **Content** | api/content.js, api/csrf-token.js, api/blog/categories.js, api/escrow.js | Content, CSRF tokens, blog, escrow |
| **Upload** | api/upload/vendor/kyc.js, api/upload/vendor/kyc/signed.js | File uploads, KYC documents |

## Components and Interfaces

### 1. API Router Component

The API Router is the core routing mechanism used by all consolidated functions. It parses incoming requests and directs them to appropriate handlers.

**Responsibilities:**
- Parse request path and HTTP method
- Extract route parameters (e.g., :id, :userId)
- Locate and invoke the appropriate handler
- Pass through request/response objects unchanged
- Return 404 for unknown routes

**Interface:**

```javascript
/**
 * API Router - Routes requests to appropriate handlers
 * @param {Object} handlers - Map of route patterns to handler functions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
async function apiRouter(handlers, req, res) {
  const { method, url } = req;
  const path = url.split('?')[0]; // Remove query string
  
  // Find matching handler
  const handler = findMatchingHandler(handlers, method, path);
  
  if (!handler) {
    return res.status(404).json({
      success: false,
      error: 'Not found',
      path,
      method
    });
  }
  
  try {
    // Invoke handler with original request/response
    return await handler(req, res);
  } catch (error) {
    console.error(`Handler error for ${method} ${path}:`, error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}
```

**Route Matching Algorithm:**
- Exact match: `/api/auth/login` matches `/api/auth/login`
- Pattern match: `/api/users/:id` matches `/api/users/123`
- Method-aware: Routes include HTTP method (GET, POST, PUT, DELETE, PATCH)
- Specificity: More specific routes take precedence over generic patterns

### 2. Consolidated Function Structure

Each consolidated function follows this pattern:

```javascript
// 1. Imports and setup
const { apiRouter } = require('../utils/router');
const handlers = require('./handlers');

// 2. CORS and OPTIONS handling
function setupCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// 3. Main handler
module.exports = async (req, res) => {
  setupCORS(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Route to appropriate handler
  return apiRouter(handlers, req, res);
};
```

### 3. Handler Organization

Each consolidated function has a handlers directory with modular handlers:

```
api/
├── admin.js (consolidated function)
├── admin/
│   ├── handlers/
│   │   ├── index.js (exports all handlers)
│   │   ├── disputes.js
│   │   ├── properties.js
│   │   ├── settings.js
│   │   └── users.js
│   └── utils/ (admin-specific utilities)
├── auth.js (consolidated function)
├── auth/
│   ├── handlers/
│   │   ├── index.js
│   │   ├── login.js
│   │   ├── register.js
│   │   ├── forgot-password.js
│   │   ├── reset-password.js
│   │   └── me.js
│   └── utils/ (auth-specific utilities)
```

### 4. Handler Interface

Each handler is an async function with this signature:

```javascript
/**
 * Handler function
 * @param {Object} req - Express request object (unchanged)
 * @param {Object} res - Express response object (unchanged)
 * @returns {Promise<void>}
 */
async function handleLogin(req, res) {
  // Handler implementation
  // Uses req.body, req.query, req.params, req.headers as-is
  // Calls res.json(), res.status(), etc. directly
}
```

**Key Principle:** Handlers receive the original request/response objects unchanged. No modification of request/response payloads occurs in the router.

### 5. Request/Response Flow

```
Client Request
    ↓
Consolidated Function (e.g., api/auth.js)
    ↓
setupCORS() - Add CORS headers
    ↓
OPTIONS check - Return 200 if OPTIONS
    ↓
apiRouter(handlers, req, res)
    ↓
findMatchingHandler() - Match route pattern
    ↓
Handler (e.g., handlers/login.js)
    ↓
Handler processes request, calls res.json()/res.status()
    ↓
Response sent to client
```

## Data Models

### Route Handler Map

Each consolidated function maintains a route handler map:

```javascript
// Example: Auth function handlers map
const handlers = {
  'POST /api/auth/login': require('./handlers/login'),
  'POST /api/auth/register': require('./handlers/register'),
  'POST /api/auth/forgot-password': require('./handlers/forgot-password'),
  'POST /api/auth/reset-password': require('./handlers/reset-password'),
  'GET /api/auth/me': require('./handlers/me'),
};
```

### Request Context

Handlers receive the standard Express request object with:
- `req.method` - HTTP method
- `req.url` - Full URL including query string
- `req.path` - URL path without query string
- `req.query` - Query parameters
- `req.body` - Request body (JSON)
- `req.headers` - HTTP headers
- `req.params` - URL parameters (extracted by router)

### Response Format

All responses follow this pattern:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* endpoint-specific data */ }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "message": "Descriptive error message"
}
```

## Error Handling

### Error Handling Strategy

1. **Input Validation Errors (400)** - Invalid request format, missing required fields
2. **Authentication Errors (401)** - Missing or invalid JWT token
3. **Authorization Errors (403)** - User lacks required permissions
4. **Not Found Errors (404)** - Resource or route not found
5. **Server Errors (500)** - Unhandled exceptions, database errors

### Error Handling in Consolidated Functions

```javascript
// In consolidated function
module.exports = async (req, res) => {
  setupCORS(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    return await apiRouter(handlers, req, res);
  } catch (error) {
    console.error('Unhandled error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};
```

### Error Handling in Handlers

Handlers implement their own error handling:

```javascript
async function handleLogin(req, res) {
  try {
    const { email, password } = req.body || {};
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password required'
      });
    }
    
    // Process login...
    
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Login failed',
      message: error.message
    });
  }
}
```

### Logging Strategy

- **Info Level:** Successful operations, route matches
- **Warn Level:** Validation failures, missing optional fields
- **Error Level:** Exceptions, database errors, authentication failures
- **Debug Level:** Request/response details (development only)

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Route Matching Correctness

*For any* valid request with a path matching a registered route pattern, the API Router SHALL select the correct handler corresponding to that route.

**Validates: Requirements 7.1, 2.2, 1.2**

### Property 2: Parameter Extraction

*For any* URL path containing dynamic parameters (e.g., `/api/users/:id`), the API Router SHALL correctly extract and populate `req.params` with the parameter values without modifying the original request.

**Validates: Requirements 7.2, 7.3**

### Property 3: Request/Response Passthrough

*For any* incoming request, the API Router SHALL pass the original request and response objects to the handler without modifying request headers, body, query parameters, or any other request properties.

**Validates: Requirements 7.4, 7.5, 8.2, 1.5, 2.5**

### Property 4: HTTP Method Support

*For any* HTTP method (GET, POST, PUT, DELETE, PATCH), the API Router SHALL correctly route requests based on both the method and path, allowing the same path to have different handlers for different methods.

**Validates: Requirements 7.7**

### Property 5: Unknown Route Handling

*For any* request path that does not match any registered route, the API Router SHALL return a 404 status code with a descriptive error message.

**Validates: Requirements 7.6, 1.6, 2.6**

### Property 6: Deterministic Output

*For any* identical request (same method, path, headers, body, query parameters), the consolidated function SHALL produce identical output (same status code, response body, headers).

**Validates: Requirements 8.6, 8.1**

### Property 7: Error Status Code Mapping

*For any* error condition, the consolidated function SHALL return an appropriate HTTP status code (4xx for client errors, 5xx for server errors) that correctly represents the error type.

**Validates: Requirements 13.2**

### Property 8: Unhandled Exception Handling

*For any* unhandled exception thrown by a handler, the consolidated function SHALL catch the exception and return a 500 status code with an error response.

**Validates: Requirements 13.5**

## Testing Strategy

### Unit Testing Approach

**Test Categories:**

1. **Property-Based Tests (Router)** - Verify apiRouter correctness properties
   - Route matching with generated paths and methods
   - Parameter extraction with various URL patterns
   - Request/response passthrough with random payloads
   - HTTP method support across all methods
   - Unknown route handling
   - Deterministic output verification
   - Error status code mapping
   - Exception handling

2. **Example-Based Tests (Handlers)** - Verify specific handler behavior
   - Valid input scenarios
   - Invalid input scenarios
   - Error conditions
   - Response format validation
   - Authentication/authorization scenarios

3. **Integration Tests** - Verify consolidated functions work end-to-end
   - Full request/response cycle
   - CORS headers present
   - OPTIONS requests handled
   - Error responses correct
   - Multiple endpoints in same function

4. **Backward Compatibility Tests** - Verify responses match original functions
   - Same response format
   - Same status codes
   - Same error messages
   - Same data structure

### Property-Based Testing Configuration

**Router Property Tests:**
- Minimum 100 iterations per property test
- Generate random:
  - URL paths with various patterns
  - HTTP methods (GET, POST, PUT, DELETE, PATCH)
  - Query parameters and values
  - Request headers
  - Request bodies (JSON)
  - URL parameters (IDs, slugs, etc.)

**Test Generators:**
- Path generator: Creates valid and invalid URL paths
- Method generator: Generates all HTTP methods
- Parameter generator: Creates various parameter types (numbers, strings, UUIDs)
- Payload generator: Creates random JSON payloads
- Header generator: Creates various header combinations

**Property Test Tags:**
- Feature: serverless-consolidation, Property 1: Route Matching Correctness
- Feature: serverless-consolidation, Property 2: Parameter Extraction
- Feature: serverless-consolidation, Property 3: Request/Response Passthrough
- Feature: serverless-consolidation, Property 4: HTTP Method Support
- Feature: serverless-consolidation, Property 5: Unknown Route Handling
- Feature: serverless-consolidation, Property 6: Deterministic Output
- Feature: serverless-consolidation, Property 7: Error Status Code Mapping
- Feature: serverless-consolidation, Property 8: Unhandled Exception Handling

### Test Organization

```
tests/
├── unit/
│   ├── router.test.js - apiRouter property-based tests
│   │   ├── Property 1: Route Matching Correctness
│   │   ├── Property 2: Parameter Extraction
│   │   ├── Property 3: Request/Response Passthrough
│   │   ├── Property 4: HTTP Method Support
│   │   ├── Property 5: Unknown Route Handling
│   │   ├── Property 6: Deterministic Output
│   │   ├── Property 7: Error Status Code Mapping
│   │   └── Property 8: Unhandled Exception Handling
│   ├── admin/
│   │   ├── disputes.test.js
│   │   ├── properties.test.js
│   │   └── ...
│   ├── auth/
│   │   ├── login.test.js
│   │   ├── register.test.js
│   │   └── ...
│   └── ...
├── integration/
│   ├── admin.test.js
│   ├── auth.test.js
│   └── ...
└── compatibility/
    ├── admin-compatibility.test.js
    ├── auth-compatibility.test.js
    └── ...
```

### Testing Tools

- **Jest** - Unit and integration testing framework
- **Supertest** - HTTP assertion library for testing endpoints
- **Mock Database** - In-memory database for testing without external dependencies

### Test Coverage Goals

- **Router Property Tests:** 100% coverage of routing logic with 100+ iterations per property
- **Router Unit Tests:** 100% coverage (all route patterns, methods, parameters, edge cases)
- **Handler Tests:** 90%+ coverage (all code paths, error conditions)
- **Integration Tests:** All endpoints tested with representative inputs
- **Compatibility Tests:** All original endpoints tested against consolidated versions
- **Overall Coverage:** 85%+ code coverage across all consolidated functions

## Implementation Approach

### Phase 1: Router Implementation

1. Create `api/utils/router.js` with apiRouter function
2. Implement route matching algorithm
3. Add parameter extraction logic
4. Add error handling for unknown routes
5. Write comprehensive router tests

### Phase 2: Consolidate Auth Function

1. Create `api/auth.js` consolidated function
2. Create `api/auth/handlers/` directory
3. Move handlers from separate files to handlers directory
4. Update imports and dependencies
5. Test all auth endpoints
6. Verify backward compatibility

### Phase 3: Consolidate Admin Function

1. Create `api/admin.js` consolidated function
2. Create `api/admin/handlers/` directory
3. Move handlers from separate files
4. Handle nested routes (admin/disputes, admin/properties, etc.)
5. Test all admin endpoints
6. Verify backward compatibility

### Phase 4: Consolidate Remaining Functions

1. Consolidate User function
2. Consolidate Property function
3. Consolidate Content function
4. Consolidate Upload function
5. Test all endpoints
6. Verify backward compatibility

### Phase 5: Cleanup and Deployment

1. Remove old separate function files
2. Update vercel.json if needed
3. Run full integration test suite
4. Deploy to staging environment
5. Verify all endpoints work
6. Deploy to production

### Key Implementation Decisions

1. **Route Matching:** Use string-based route patterns (e.g., "POST /api/auth/login") for simplicity and performance
2. **Parameter Extraction:** Extract URL parameters using regex patterns, store in req.params
3. **Handler Organization:** Keep handlers in separate files for maintainability, export from index.js
4. **Error Handling:** Centralized error handling in consolidated function, handlers throw errors
5. **CORS:** Centralized CORS setup in consolidated function, applied to all routes
6. **Logging:** Consistent logging across all handlers using console methods

## Performance Considerations

### Cold Start Optimization

- Consolidated functions will have slightly larger code size but fewer total functions
- Fewer functions = fewer cold starts overall
- Each consolidated function will be invoked more frequently = warmer cache
- Net effect: Improved cold start performance

### Memory Usage

- Consolidated functions load all handlers at startup
- Estimated memory increase: ~5-10% per function
- Acceptable trade-off for reduced function count

### Routing Overhead

- Route matching is O(n) where n = number of routes in function
- Typical: 5-10 routes per function = negligible overhead
- Estimated latency: <1ms for route matching

### Database Connection Pooling

- Each consolidated function maintains its own connection pool
- Pool size: 1 connection (as per current implementation)
- Idle timeout: 10 seconds
- Connection timeout: 10 seconds

## Deployment Strategy

### Pre-Deployment Checklist

- [ ] All handlers moved to consolidated functions
- [ ] Router implementation complete and tested
- [ ] All endpoints tested individually
- [ ] Integration tests passing
- [ ] Backward compatibility verified
- [ ] CORS headers correct
- [ ] Error handling working
- [ ] Logging configured
- [ ] Documentation updated

### Deployment Steps

1. Deploy consolidated functions to staging
2. Run full integration test suite
3. Verify all endpoints respond correctly
4. Check response times and error rates
5. Deploy to production
6. Monitor error logs and response times
7. Remove old separate function files
8. Verify Vercel function count < 12

### Rollback Plan

If issues occur:
1. Revert to previous deployment
2. Investigate error logs
3. Fix issues in development
4. Re-test before re-deploying

## Documentation Requirements

### Endpoint Mapping Document

Complete mapping of all endpoints to consolidated functions:

```
Admin Function (api/admin.js)
├── POST /api/admin/setup-database
├── GET /api/admin/check-password
├── POST /api/admin/rehash-password
├── POST /api/admin/populate-roles
├── POST /api/admin/disputes/...
├── GET /api/admin/properties/...
├── POST /api/admin/settings/...
└── GET /api/admin/users/...

Auth Function (api/auth.js)
├── POST /api/auth/login
├── POST /api/auth/register
├── POST /api/auth/forgot-password
├── POST /api/auth/reset-password
└── GET /api/auth/me

[... etc for other functions ...]
```

### Developer Guide

- How to add new endpoints to consolidated functions
- How to modify existing handlers
- How to test changes
- Common troubleshooting issues

### API Reference

- Request/response formats for each endpoint
- Authentication requirements
- Authorization requirements
- Error codes and messages

