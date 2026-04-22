# Vendor Subscription Payment Fix - Design Document

## Overview

The vendor subscription payment flow is broken because five critical API endpoints are not implemented in the backend API router. When vendors attempt to access subscription data or process payments, the system returns 404 errors with HTML error pages instead of valid JSON responses. This causes JSON parsing errors in the frontend and prevents the entire subscription management feature from functioning.

The fix involves:
1. Creating the subscription handlers module with implementations for all five endpoints
2. Registering the subscription handlers in the main API router
3. Ensuring all endpoints return proper JSON responses with appropriate status codes
4. Implementing proper authentication and error handling

## Glossary

- **Bug_Condition (C)**: Requests to subscription endpoints (`/api/subscription/*`) that should return valid JSON responses but instead return 404 errors with HTML error pages
- **Property (P)**: The desired behavior when subscription endpoints are called - they should return 200 status with valid JSON containing subscription data
- **Preservation**: Existing API behavior for non-subscription endpoints, authentication checks, and error handling must remain unchanged
- **apiRouter**: The routing utility in `api/utils/router.js` that matches HTTP requests to handler functions based on method and path patterns
- **Handler**: A function in `api/[module]/handlers/index.js` that processes API requests and returns JSON responses
- **Subscription Endpoints**: Five API routes that manage vendor subscription data:
  - `GET /api/subscription/status` - Returns current subscription status
  - `GET /api/subscription/current` - Returns active subscription details
  - `GET /api/subscription/plans` - Returns available subscription plans
  - `GET /api/subscription/payments` - Returns payment history
  - `POST /api/subscription/pay` - Processes subscription payments

## Bug Details

### Bug Condition

The bug manifests when a vendor makes requests to any of the five subscription endpoints. The backend API router cannot find matching handlers for these routes because:
1. No subscription handlers module exists in `api/subscription/handlers/`
2. The subscription handlers are not imported in `api/[...].js`
3. The routes are not registered in the `allHandlers` object passed to `apiRouter`

When `apiRouter` cannot find a matching handler, it returns a 404 JSON response. However, if the request is being served by a fallback error handler (like Express's default 404 handler), it returns an HTML error page instead of JSON, causing the frontend to fail when trying to parse the response.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type HttpRequest
  OUTPUT: boolean
  
  RETURN input.path IN ['/api/subscription/status', 
                        '/api/subscription/current',
                        '/api/subscription/plans',
                        '/api/subscription/payments',
                        '/api/subscription/pay']
         AND input.method IN ['GET', 'POST']
         AND subscriptionHandlersNotRegistered()
         AND responseContentType = 'text/html'
END FUNCTION
```

### Examples

**Example 1: Status Endpoint Returns HTML 404**
- Input: `GET /api/subscription/status` with valid auth token
- Current Behavior: Returns 404 with HTML error page (`<html><body>Not Found</body></html>`)
- Expected Behavior: Returns 200 with JSON `{ success: true, data: { status: 'active', ... } }`
- Error in Frontend: `SyntaxError: Unexpected token '<', "<html><body>Not Found</body></html>" is not valid JSON`

**Example 2: Plans Endpoint Returns HTML 404**
- Input: `GET /api/subscription/plans` (no auth required)
- Current Behavior: Returns 404 with HTML error page
- Expected Behavior: Returns 200 with JSON `{ success: true, data: [{ id: 'plan1', name: 'Basic', ... }, ...] }`
- Error in Frontend: `SyntaxError: Unexpected token '<'`

**Example 3: Payment Endpoint Returns HTML 404**
- Input: `POST /api/subscription/pay` with valid auth token and payment data
- Current Behavior: Returns 404 with HTML error page
- Expected Behavior: Returns 200 with JSON `{ success: true, data: { paymentUrl: '...', reference: '...' } }`
- Error in Frontend: `SyntaxError: Unexpected token '<'`

**Example 4: Valid Non-Subscription Endpoint Still Works**
- Input: `GET /api/users/profile` with valid auth token
- Current Behavior: Returns 200 with valid JSON (working correctly)
- Expected Behavior: Returns 200 with valid JSON (should remain unchanged)
- This demonstrates that the issue is specific to subscription endpoints

**Example 5: Invalid Auth on Subscription Endpoint**
- Input: `GET /api/subscription/status` with invalid/missing auth token
- Current Behavior: Returns 404 with HTML error page (wrong - should be 401)
- Expected Behavior: Returns 401 with JSON `{ success: false, error: 'Unauthorized' }`
- This is a secondary issue that will be fixed by proper handler implementation

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- All non-subscription API endpoints must continue to work exactly as before
- Authentication and authorization checks must continue to function for all endpoints
- Error responses for malformed requests must continue to return appropriate status codes
- CORS headers must continue to be set correctly for all requests
- OPTIONS requests must continue to be handled correctly
- Internal server errors must continue to be caught and logged appropriately

**Scope:**
All requests that do NOT target the five subscription endpoints should be completely unaffected by this fix. This includes:
- User authentication endpoints (`/api/auth/*`)
- User profile endpoints (`/api/users/*`)
- Property endpoints (`/api/properties/*`)
- Payment endpoints (`/api/payments/*`)
- All other existing API endpoints
- Non-API requests (static files, etc.)

## Hypothesized Root Cause

Based on the bug description and code analysis, the root causes are:

1. **Missing Subscription Handlers Module**: The `api/subscription/handlers/` directory and `api/subscription/handlers/index.js` file do not exist. This is the primary cause - without this module, there are no handler functions to register.

2. **Handlers Not Imported in Main Router**: Even if handlers existed, they are not imported in `api/[...].js`. The file imports handlers from auth, users, properties, investments, payments, notifications, ratings, upload, verification, debug, and inquiries modules, but not from a subscription module.

3. **Handlers Not Registered in allHandlers**: The subscription handlers are not included in the `allHandlers` object that is passed to `apiRouter`. This object is built by spreading all imported handler modules, so without the import, the routes cannot be registered.

4. **Potential HTML Error Page Fallback**: If the request is being caught by a fallback error handler (possibly Express's default 404 handler or a middleware), it may be returning HTML instead of JSON. This would explain why the frontend receives HTML instead of the JSON 404 response that `apiRouter` would return.

5. **Missing Endpoint Implementations**: Even if the routes were registered, the actual handler functions for each endpoint don't exist. Each endpoint needs specific logic to:
   - Authenticate the request (for endpoints that require it)
   - Query the database for subscription data
   - Format and return the response as JSON

## Correctness Properties

Property 1: Bug Condition - Subscription Endpoints Return Valid JSON

_For any_ request to a subscription endpoint (`/api/subscription/status`, `/api/subscription/current`, `/api/subscription/plans`, `/api/subscription/payments`, or `/api/subscription/pay`) with valid authentication (where required), the fixed API SHALL return a 200 status code with a valid JSON response containing the requested subscription data, allowing the frontend to successfully parse the response without JSON parsing errors.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**

Property 2: Preservation - Non-Subscription Endpoints Unchanged

_For any_ request to a non-subscription endpoint or any request that does not target the five subscription routes, the fixed API SHALL produce exactly the same behavior as the original API, preserving all existing functionality for authentication, authorization, error handling, and other API endpoints.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct, the fix requires creating the subscription handlers module and registering it in the main router.

**File 1**: `api/subscription/handlers/index.js` (NEW FILE)

**Purpose**: Export all subscription endpoint handlers

**Specific Changes**:
1. **Create handlers/index.js**: Export handler functions for all five subscription endpoints with route patterns
   - `GET /api/subscription/status` → getSubscriptionStatus handler
   - `GET /api/subscription/current` → getCurrentSubscription handler
   - `GET /api/subscription/plans` → getSubscriptionPlans handler
   - `GET /api/subscription/payments` → getPaymentHistory handler
   - `POST /api/subscription/pay` → processPayment handler

2. **Implement getSubscriptionStatus**: 
   - Authenticate the request (verify auth token)
   - Query database for vendor's current subscription status
   - Return JSON with status, nextPaymentDate, suggestedAmount, etc.

3. **Implement getCurrentSubscription**:
   - Authenticate the request
   - Query database for vendor's active subscription
   - Return JSON with planId, amount, billingCycle, trialEndDate, nextPaymentDate, etc.

4. **Implement getSubscriptionPlans**:
   - No authentication required (public endpoint)
   - Query database for all available subscription plans
   - Return JSON array with plan details (id, name, amount, billingCycle, features, etc.)

5. **Implement getPaymentHistory**:
   - Authenticate the request
   - Query database for vendor's payment history
   - Return JSON array with payment records (date, amount, status, reference, etc.)

6. **Implement processPayment**:
   - Authenticate the request
   - Validate payment request body (planId, paymentMethod)
   - Initialize payment with Paystack API
   - Return JSON with paymentUrl and reference for frontend to use

**File 2**: `api/[...].js` (MODIFY EXISTING FILE)

**Purpose**: Register subscription handlers in the main API router

**Specific Changes**:
1. **Add import statement**: Import subscription handlers at the top with other handler imports
   ```javascript
   const subscriptionHandlers = require('./subscription/handlers');
   ```

2. **Add to allHandlers spread**: Include subscription handlers in the allHandlers object
   ```javascript
   const allHandlers = {
     ...authHandlers,
     ...usersHandlers,
     ...propertiesHandlers,
     ...investmentsHandlers,
     ...paymentsHandlers,
     ...subscriptionHandlers,  // ADD THIS LINE
     ...notificationsHandlers,
     ...ratingsHandlers,
     ...uploadHandlers,
     ...verificationHandlers,
     ...debugHandlers,
     ...inquiriesHandlers,
   };
   ```

### Implementation Details

**Database Schema Considerations**:
- Vendors table must have subscription-related fields (planId, subscriptionStatus, nextPaymentDate, etc.)
- Subscription plans table must exist with plan definitions
- Payment history table must exist to track vendor payments

**Authentication**:
- Use existing authentication middleware/utilities from the codebase
- Verify auth token is present and valid for protected endpoints
- Return 401 Unauthorized if auth fails

**Error Handling**:
- Return 400 Bad Request for malformed request bodies
- Return 401 Unauthorized for missing/invalid authentication
- Return 403 Forbidden for insufficient permissions
- Return 404 Not Found only for truly non-existent resources
- Return 500 Internal Server Error for unexpected errors
- All error responses must be valid JSON

**Response Format**:
- All responses must be valid JSON with `Content-Type: application/json`
- Success responses: `{ success: true, data: {...} }`
- Error responses: `{ success: false, error: 'Error message' }`

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm that subscription endpoints return 404 errors with HTML responses on unfixed code.

**Test Plan**: Write tests that make HTTP requests to each subscription endpoint and assert that the response is valid JSON. Run these tests on the UNFIXED code to observe failures and confirm the root cause.

**Test Cases**:
1. **Status Endpoint Test**: Make GET request to `/api/subscription/status` with valid auth token (will fail on unfixed code - returns HTML 404)
2. **Current Subscription Test**: Make GET request to `/api/subscription/current` with valid auth token (will fail on unfixed code - returns HTML 404)
3. **Plans Endpoint Test**: Make GET request to `/api/subscription/plans` without auth (will fail on unfixed code - returns HTML 404)
4. **Payments Endpoint Test**: Make GET request to `/api/subscription/payments` with valid auth token (will fail on unfixed code - returns HTML 404)
5. **Payment Processing Test**: Make POST request to `/api/subscription/pay` with valid auth token and payment data (will fail on unfixed code - returns HTML 404)

**Expected Counterexamples**:
- All five endpoints return 404 status code
- Response Content-Type is `text/html` instead of `application/json`
- Response body is HTML error page instead of JSON
- Frontend receives `SyntaxError: Unexpected token '<'` when trying to parse response

### Fix Checking

**Goal**: Verify that for all requests to subscription endpoints, the fixed API returns valid JSON responses with appropriate data.

**Pseudocode:**
```
FOR ALL endpoint IN ['/api/subscription/status', '/api/subscription/current', 
                     '/api/subscription/plans', '/api/subscription/payments',
                     '/api/subscription/pay'] DO
  FOR ALL validRequest IN generateValidRequests(endpoint) DO
    response := makeRequest(validRequest)
    ASSERT response.status = 200
    ASSERT response.headers['Content-Type'] CONTAINS 'application/json'
    ASSERT response.body IS valid JSON
    ASSERT response.body.success = true
    ASSERT response.body.data IS NOT null
  END FOR
END FOR
```

### Preservation Checking

**Goal**: Verify that for all non-subscription endpoints, the fixed API produces the same behavior as the original API.

**Pseudocode:**
```
FOR ALL endpoint IN ['/api/auth/*', '/api/users/*', '/api/properties/*', 
                     '/api/payments/*', '/api/notifications/*', ...] DO
  FOR ALL request IN generateRequests(endpoint) DO
    ASSERT originalAPI(request) = fixedAPI(request)
  END FOR
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-subscription endpoints

**Test Plan**: Observe behavior on UNFIXED code first for non-subscription endpoints, then write property-based tests capturing that behavior to ensure the fix doesn't break anything.

**Test Cases**:
1. **Non-Subscription Endpoints Preservation**: Verify that GET/POST requests to non-subscription endpoints continue to work correctly
2. **Authentication Preservation**: Verify that auth checks continue to work (401 for invalid auth, 403 for insufficient permissions)
3. **Error Handling Preservation**: Verify that malformed requests continue to return 400 Bad Request
4. **CORS Headers Preservation**: Verify that CORS headers continue to be set correctly
5. **OPTIONS Request Preservation**: Verify that OPTIONS requests continue to be handled correctly

### Unit Tests

- Test each subscription endpoint handler in isolation
- Test authentication validation for protected endpoints
- Test database query logic for each endpoint
- Test error handling for malformed requests
- Test response format validation (JSON structure, required fields)
- Test edge cases (no subscription, no payment history, invalid plan ID, etc.)

### Property-Based Tests

- Generate random vendor IDs and verify subscription endpoints return consistent data
- Generate random payment data and verify payment processing works correctly
- Generate random requests to non-subscription endpoints and verify they continue to work
- Test that all subscription endpoints return valid JSON responses
- Test that all error responses are valid JSON with appropriate status codes

### Integration Tests

- Test full subscription flow: fetch plans → select plan → process payment → verify payment
- Test that subscription data is correctly retrieved after payment
- Test that payment history is correctly recorded
- Test that switching between subscription endpoints works correctly
- Test that authentication errors are handled correctly across all endpoints
- Test that the frontend can successfully parse all subscription endpoint responses

