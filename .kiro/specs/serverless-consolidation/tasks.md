# Implementation Plan: Serverless Function Consolidation

## Overview

This implementation plan consolidates 20+ serverless functions into 6 multi-purpose functions (Admin, Auth, User, Property, Content, Upload) while maintaining complete API compatibility. The approach follows a 5-phase strategy: router implementation, auth consolidation, admin consolidation, remaining functions consolidation, and cleanup/deployment.

## Tasks

- [-] 1. Router Implementation - Create core routing mechanism
  - [ ] 1.1 Create api/utils/router.js with apiRouter function
    - Implement route matching algorithm supporting exact and pattern-based routes
    - Add parameter extraction logic for dynamic routes (e.g., /api/users/:id)
    - Implement error handling for unknown routes (404 responses)
    - Support all HTTP methods (GET, POST, PUT, DELETE, PATCH)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [ ]* 1.2 Write property test for Route Matching Correctness
    - **Property 1: Route Matching Correctness**
    - **Validates: Requirements 7.1, 2.2, 1.2**
    - Generate random valid routes and verify correct handler selection
    - Test with various HTTP methods and path patterns

  - [ ]* 1.3 Write property test for Parameter Extraction
    - **Property 2: Parameter Extraction**
    - **Validates: Requirements 7.2, 7.3**
    - Generate URLs with dynamic parameters and verify req.params populated correctly
    - Verify original request object unchanged

  - [ ]* 1.4 Write property test for Request/Response Passthrough
    - **Property 3: Request/Response Passthrough**
    - **Validates: Requirements 7.4, 7.5, 8.2, 1.5, 2.5**
    - Generate random requests with various headers, bodies, query params
    - Verify no modification of request properties before handler invocation

  - [ ]* 1.5 Write property test for HTTP Method Support
    - **Property 4: HTTP Method Support**
    - **Validates: Requirements 7.7**
    - Test all HTTP methods (GET, POST, PUT, DELETE, PATCH)
    - Verify same path can have different handlers for different methods

  - [ ]* 1.6 Write property test for Unknown Route Handling
    - **Property 5: Unknown Route Handling**
    - **Validates: Requirements 7.6, 1.6, 2.6**
    - Generate random invalid routes and verify 404 responses
    - Verify error message includes path and method

  - [ ]* 1.7 Write property test for Deterministic Output
    - **Property 6: Deterministic Output**
    - **Validates: Requirements 8.6, 8.1**
    - Send identical requests multiple times and verify identical responses
    - Test with various payloads and parameters

  - [ ]* 1.8 Write property test for Error Status Code Mapping
    - **Property 7: Error Status Code Mapping**
    - **Validates: Requirements 13.2**
    - Verify appropriate HTTP status codes for different error types
    - Test 4xx for client errors, 5xx for server errors

  - [ ]* 1.9 Write property test for Unhandled Exception Handling
    - **Property 8: Unhandled Exception Handling**
    - **Validates: Requirements 13.5**
    - Verify handlers throwing exceptions result in 500 responses
    - Verify error response includes descriptive message

  - [ ] 1.10 Checkpoint - Ensure all router tests pass
    - Ensure all router property tests and unit tests pass
    - Verify router implementation meets all requirements
    - Ask the user if questions arise

- [x] 2. Consolidate Auth Function
  - [ ] 2.1 Create api/auth.js consolidated function
    - Implement main handler with CORS setup and OPTIONS handling
    - Set up apiRouter with all auth endpoint handlers
    - Implement error handling and logging
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ] 2.2 Create api/auth/handlers/ directory structure
    - Create handlers/index.js exporting all auth handlers
    - Move login handler from api/auth/login.js to handlers/login.js
    - Move register handler from api/auth/register.js to handlers/register.js
    - Move forgot-password handler to handlers/forgot-password.js
    - Move reset-password handler to handlers/reset-password.js
    - Move JWT me handler from api/auth/jwt/me.js to handlers/me.js
    - _Requirements: 2.1, 11.2_

  - [ ]* 2.3 Write unit tests for auth handlers
    - Test login endpoint with valid/invalid credentials
    - Test register endpoint with valid/invalid inputs
    - Test forgot-password endpoint
    - Test reset-password endpoint
    - Test JWT me endpoint with valid/invalid tokens
    - _Requirements: 2.4, 14.1, 14.2_

  - [ ] 2.4 Test all auth endpoints for backward compatibility
    - Verify POST /api/auth/login returns identical response to original
    - Verify POST /api/auth/register returns identical response to original
    - Verify POST /api/auth/forgot-password returns identical response to original
    - Verify POST /api/auth/reset-password returns identical response to original
    - Verify GET /api/auth/me returns identical response to original
    - _Requirements: 2.3, 2.4, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 14.2_

  - [ ] 2.5 Checkpoint - Ensure all auth tests pass
    - Ensure all auth unit tests pass
    - Ensure backward compatibility verified
    - Verify CORS headers present in responses
    - Ask the user if questions arise

- [-] 3. Consolidate Admin Function
  - [ ] 3.1 Create api/admin.js consolidated function
    - Implement main handler with CORS setup and OPTIONS handling
    - Set up apiRouter with all admin endpoint handlers
    - Implement error handling and logging
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ] 3.2 Create api/admin/handlers/ directory structure
    - Create handlers/index.js exporting all admin handlers
    - Move handlers from api/admin.js to handlers/main.js
    - Move dispute handlers from api/admin/disputes.js to handlers/disputes.js
    - Move property handlers from api/admin/properties.js to handlers/properties.js
    - Move settings handlers from api/admin/settings.js to handlers/settings.js
    - Move user handlers from api/admin/users.js to handlers/users.js
    - _Requirements: 1.1, 11.2_

  - [ ]* 3.3 Write unit tests for admin handlers
    - Test main admin endpoints (setup-database, check-password, etc.)
    - Test dispute endpoints with various inputs
    - Test property endpoints with various inputs
    - Test settings endpoints with various inputs
    - Test user endpoints with various inputs
    - _Requirements: 1.4, 14.1, 14.2_

  - [ ] 3.4 Test nested admin routes
    - Verify /api/admin/disputes/* routes handled correctly
    - Verify /api/admin/properties/* routes handled correctly
    - Verify /api/admin/settings/* routes handled correctly
    - Verify /api/admin/users/* routes handled correctly
    - _Requirements: 1.2, 1.3_

  - [ ] 3.5 Test all admin endpoints for backward compatibility
    - Verify all admin endpoints return identical responses to original functions
    - Verify all error responses match original functions
    - Verify all status codes match original functions
    - _Requirements: 1.3, 1.4, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 14.2_

  - [ ] 3.6 Checkpoint - Ensure all admin tests pass
    - Ensure all admin unit tests pass
    - Ensure backward compatibility verified
    - Verify nested routes working correctly
    - Ask the user if questions arise

- [x] 4. Consolidate Remaining Functions
  - [ ] 4.1 Create api/users.js consolidated function
    - Implement main handler with CORS setup and OPTIONS handling
    - Set up apiRouter with all user endpoint handlers
    - Move handlers from original api/users.js to api/users/handlers/
    - Test all user endpoints for backward compatibility
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ] 4.2 Create api/properties.js consolidated function
    - Implement main handler with CORS setup and OPTIONS handling
    - Set up apiRouter with all property endpoint handlers
    - Move handlers from original api/properties.js to api/properties/handlers/
    - Test all property endpoints for backward compatibility
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ] 4.3 Create api/content.js consolidated function
    - Implement main handler with CORS setup and OPTIONS handling
    - Set up apiRouter with handlers for content, csrf-token, blog, and escrow endpoints
    - Move handlers from api/content.js, api/csrf-token.js, api/blog/categories.js, api/escrow.js
    - Create api/content/handlers/ directory with modular handlers
    - Test all content endpoints for backward compatibility
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ] 4.4 Create api/upload.js consolidated function
    - Implement main handler with CORS setup and OPTIONS handling
    - Set up apiRouter with all upload endpoint handlers
    - Move handlers from api/upload/vendor/kyc.js and api/upload/vendor/kyc/signed.js
    - Create api/upload/handlers/ directory with modular handlers
    - Test all upload endpoints for backward compatibility
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ]* 4.5 Write integration tests for all consolidated functions
    - Test full request/response cycle for each function
    - Test CORS headers present in all responses
    - Test OPTIONS requests handled correctly
    - Test error responses correct
    - Test multiple endpoints in same function
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [ ] 4.6 Checkpoint - Ensure all consolidated functions tested
    - Ensure all unit tests pass for User, Property, Content, Upload functions
    - Ensure backward compatibility verified for all functions
    - Ensure integration tests passing
    - Ask the user if questions arise

- [ ] 5. Cleanup and Deployment
  - [ ] 5.1 Remove old separate function files
    - Delete api/auth/login.js, api/auth/register.js, api/auth/forgot-password.js, api/auth/reset-password.js, api/auth/jwt/me.js
    - Delete api/admin.js (old), api/admin/disputes.js, api/admin/properties.js, api/admin/settings.js, api/admin/users.js
    - Delete api/users.js (old)
    - Delete api/properties.js (old)
    - Delete api/content.js (old), api/csrf-token.js, api/blog/categories.js, api/escrow.js
    - Delete api/upload/vendor/kyc.js, api/upload/vendor/kyc/signed.js
    - _Requirements: 12.2_

  - [ ] 5.2 Update vercel.json configuration
    - Verify vercel.json reflects new consolidated function structure
    - Remove references to old separate functions
    - Ensure all consolidated functions are included
    - _Requirements: 12.1_

  - [ ] 5.3 Run full integration test suite
    - Execute all unit tests for router and handlers
    - Execute all integration tests
    - Execute all backward compatibility tests
    - Verify all tests passing
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

  - [ ] 5.4 Deploy to staging environment
    - Deploy consolidated functions to Vercel staging
    - Verify all endpoints accessible
    - Verify response times acceptable
    - Verify error rates acceptable
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 12.3_

  - [ ] 5.5 Verify function count and performance
    - Confirm total function count is 8 or fewer (within 12-function limit)
    - Verify response times within 10% of original functions
    - Verify memory usage acceptable
    - Verify cold start times under 5 seconds
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ] 5.6 Deploy to production
    - Deploy consolidated functions to Vercel production
    - Monitor error logs and response times
    - Verify all endpoints working correctly
    - Verify backward compatibility maintained
    - _Requirements: 12.3, 12.4, 12.5_

  - [ ] 5.7 Final checkpoint - Verify deployment success
    - Confirm all endpoints responding correctly
    - Confirm function count < 12
    - Confirm no errors in logs
    - Confirm response times acceptable
    - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP, but are recommended for production quality
- Each task references specific requirements for traceability
- Property-based tests validate universal correctness properties of the router
- Unit tests validate specific handler behavior and edge cases
- Integration tests validate end-to-end flows across consolidated functions
- Backward compatibility tests ensure no breaking changes for frontend clients
- Checkpoints ensure incremental validation and allow for course correction
