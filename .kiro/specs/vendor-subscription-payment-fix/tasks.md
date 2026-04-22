# Implementation Plan

## Phase 1: Explore the Bug

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Subscription Endpoints Return HTML 404 Errors
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: For deterministic bugs, scope the property to the concrete failing case(s) to ensure reproducibility
  - Test implementation details from Bug Condition in design:
    - Make HTTP requests to each of the five subscription endpoints
    - Assert that responses are valid JSON (not HTML error pages)
    - Assert that responses have 200 status code (not 404)
    - Assert that response Content-Type is `application/json` (not `text/html`)
  - The test assertions should match the Expected Behavior Properties from design:
    - `/api/subscription/status` returns 200 with valid JSON containing subscription status
    - `/api/subscription/current` returns 200 with valid JSON containing subscription details
    - `/api/subscription/plans` returns 200 with valid JSON containing available plans
    - `/api/subscription/payments` returns 200 with valid JSON containing payment history
    - `/api/subscription/pay` returns 200 with valid JSON confirming payment processing
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found to understand root cause:
    - Record the actual status codes returned (should be 404)
    - Record the actual Content-Type headers (should be `text/html`)
    - Record the actual response bodies (should be HTML error pages)
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

## Phase 2: Preserve Existing Behavior

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-Subscription Endpoints Continue Working
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs (non-subscription endpoints)
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements:
    - Non-subscription endpoints (e.g., `/api/users/*`, `/api/properties/*`) continue to return valid responses
    - Authentication checks continue to work (401 for invalid auth, 403 for insufficient permissions)
    - Error handling continues to work (400 for malformed requests)
    - CORS headers continue to be set correctly
    - OPTIONS requests continue to be handled correctly
  - Property-based testing generates many test cases for stronger guarantees:
    - Generate random requests to non-subscription endpoints
    - Verify they continue to work as before
    - Verify error responses are still valid JSON
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

## Phase 3: Implement the Fix

- [x] 3. Fix for vendor subscription payment endpoints returning 404 errors

  - [x] 3.1 Create subscription handlers module
    - Create new file: `api/subscription/handlers/index.js`
    - Implement handler for `GET /api/subscription/status`
      - Authenticate the request (verify auth token)
      - Query database for vendor's current subscription status
      - Return JSON with status, nextPaymentDate, suggestedAmount, etc.
    - Implement handler for `GET /api/subscription/current`
      - Authenticate the request
      - Query database for vendor's active subscription
      - Return JSON with planId, amount, billingCycle, trialEndDate, nextPaymentDate, etc.
    - Implement handler for `GET /api/subscription/plans`
      - No authentication required (public endpoint)
      - Query database for all available subscription plans
      - Return JSON array with plan details (id, name, amount, billingCycle, features, etc.)
    - Implement handler for `GET /api/subscription/payments`
      - Authenticate the request
      - Query database for vendor's payment history
      - Return JSON array with payment records (date, amount, status, reference, etc.)
    - Implement handler for `POST /api/subscription/pay`
      - Authenticate the request
      - Validate payment request body (planId, paymentMethod)
      - Initialize payment with Paystack API
      - Return JSON with paymentUrl and reference for frontend to use
    - Ensure all responses return valid JSON with `Content-Type: application/json`
    - Ensure all responses follow format: `{ success: true, data: {...} }` for success or `{ success: false, error: '...' }` for errors
    - _Bug_Condition: isBugCondition(input) where input.path IN ['/api/subscription/status', '/api/subscription/current', '/api/subscription/plans', '/api/subscription/payments', '/api/subscription/pay'] AND subscriptionHandlersNotRegistered()_
    - _Expected_Behavior: expectedBehavior(result) - all subscription endpoints return 200 with valid JSON containing requested data_
    - _Preservation: Non-subscription endpoints continue to work, authentication checks continue to function, error handling continues to work_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 3.2 Register subscription handlers in main API router
    - Modify file: `api/[...].js`
    - Add import statement for subscription handlers:
      ```javascript
      const subscriptionHandlers = require('./subscription/handlers');
      ```
    - Add subscription handlers to the `allHandlers` object spread:
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
    - Verify that the subscription handlers are now registered in the router
    - _Bug_Condition: isBugCondition(input) where subscriptionHandlersNotRegistered()_
    - _Expected_Behavior: expectedBehavior(result) - subscription handlers are now available to the router_
    - _Preservation: Other handlers continue to be registered and function normally_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 3.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Subscription Endpoints Return Valid JSON
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - Verify that all five subscription endpoints now return:
      - 200 status code (not 404)
      - Valid JSON responses (not HTML error pages)
      - Correct Content-Type header (`application/json`)
      - Proper response structure with `success: true` and `data` fields
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 3.4 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-Subscription Endpoints Continue Working
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions):
      - Non-subscription endpoints continue to work correctly
      - Authentication checks continue to function
      - Error handling continues to work
      - CORS headers continue to be set correctly
      - OPTIONS requests continue to be handled correctly
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4. Checkpoint - Ensure all tests pass
  - Verify that the bug condition exploration test passes (confirms fix works)
  - Verify that the preservation tests pass (confirms no regressions)
  - Verify that the subscription payment modal can now successfully fetch and parse subscription data
  - Verify that the frontend no longer receives JSON parsing errors
  - Ensure all tests pass, ask the user if questions arise
