# Tasks: Frontend-Backend Integration

## Phase 1: Backend API Implementation (Priority 2 - Critical)

### 1.1 Verification System Endpoints
- [-] 1.1.1 Implement GET /verification/config endpoint
  - [x] 1.1.1.1 Create verification types configuration
  - [x] 1.1.1.2 Define document requirements and fees
  - [x] 1.1.1.3 Add caching logic (24-hour expiry)
  - [x] 1.1.1.4 Write unit tests for config retrieval
  - [x] 1.1.1.5 Test error handling for unavailable backend

- [ ] 1.1.2 Implement POST /verification/applications endpoint
  - [x] 1.1.2.1 Create verification application model
  - [x] 1.1.2.2 Implement document upload and validation
  - [x] 1.1.2.3 Add application status tracking
  - [x] 1.1.2.4 Implement email notification to vendor
  - [x] 1.1.2.5 Write integration tests for application submission

### 1.2 Investment System Endpoints
- [ ] 1.2.1 Implement GET /investments endpoint
  - [x] 1.2.1.1 Create investment model and schema
  - [x] 1.2.1.2 Implement pagination (limit, offset)
  - [x] 1.2.1.3 Add filtering by status
  - [x] 1.2.1.4 Add sorting by expectedReturn, targetAmount
  - [x] 1.2.1.5 Write unit tests for investment listing

- [ ] 1.2.2 Implement GET /investments/{investmentId} endpoint
  - [x] 1.2.2.1 Retrieve investment details with property info
  - [x] 1.2.2.2 Include investor list and timeline
  - [x] 1.2.2.3 Add 404 error handling
  - [x] 1.2.2.4 Write unit tests for detail retrieval

- [ ] 1.2.3 Implement POST /investments/{investmentId}/invest endpoint
  - [x] 1.2.3.1 Create investment record model
  - [x] 1.2.3.2 Validate investment amount against minimum
  - [x] 1.2.3.3 Integrate with payment system
  - [x] 1.2.3.4 Set investment status to pending_payment
  - [x] 1.2.3.5 Write integration tests for investment creation

### 1.3 Notification System Endpoints
- [ ] 1.3.1 Implement GET /notifications endpoint
  - [x] 1.3.1.1 Create notification model and schema
  - [x] 1.3.1.2 Implement pagination and filtering
  - [x] 1.3.1.3 Add unread count calculation
  - [x] 1.3.1.4 Write unit tests for notification retrieval

- [ ] 1.3.2 Implement POST /chats/start endpoint
  - [x] 1.3.2.1 Create chat model and schema
  - [x] 1.3.2.2 Validate both users exist
  - [x] 1.3.2.3 Check for blocked users
  - [x] 1.3.2.4 Create initial message
  - [x] 1.3.2.5 Write integration tests for chat creation

- [ ] 1.3.3 Implement POST /ratings endpoint
  - [x] 1.3.3.1 Create rating model and schema
  - [x] 1.3.3.2 Validate rating value (1-5)
  - [x] 1.3.3.3 Handle rating updates for existing ratings
  - [x] 1.3.3.4 Write unit tests for rating submission

## Phase 2: Frontend Pages Implementation (Priority 2 & 3)

### 2.1 Authentication Pages
- [-] 2.1.1 Implement Forgot Password Page
  - [x] 2.1.1.1 Create ForgotPasswordPage component
  - [x] 2.1.1.2 Add email input validation
  - [x] 2.1.1.3 Implement POST /api/auth/forgot-password call
  - [x] 2.1.1.4 Display success/error messages
  - [x] 2.1.1.5 Add link to login page
  - [x] 2.1.1.6 Write component tests

- [x] 2.1.2 Implement Password Reset Flow
  - [x] 2.1.2.1 Create password reset form component
  - [x] 2.1.2.2 Parse reset token from URL
  - [x] 2.1.2.3 Implement POST /api/auth/reset-password call
  - [x] 2.1.2.4 Validate password strength
  - [x] 2.1.2.5 Redirect to login on success
  - [x] 2.1.2.6 Write component tests

### 2.2 User Dashboard Pages
- [ ] 2.2.1 Implement My Inquiries Page
  - [x] 2.2.1.1 Create MyInquiriesPage component
  - [x] 2.2.1.2 Fetch inquiries from GET /inquiries
  - [x] 2.2.1.3 Add filtering by status
  - [x] 2.2.1.4 Add sorting by date
  - [x] 2.2.1.5 Implement inquiry detail modal
  - [x] 2.2.1.6 Add delete inquiry functionality
  - [x] 2.2.1.7 Display empty state
  - [x] 2.2.1.8 Write component tests

- [x] 2.2.2 Implement Investment Opportunities Page
  - [x] 2.2.2.1 Create InvestmentPage component
  - [x] 2.2.2.2 Fetch investments from GET /investments
  - [x] 2.2.2.3 Display investments in grid/list format
  - [x] 2.2.2.4 Add filters (status, return range, type)
  - [x] 2.2.2.5 Add sorting options
  - [x] 2.2.2.6 Implement pagination
  - [x] 2.2.2.7 Add "Invest Now" button with modal
  - [x] 2.2.2.8 Add "View Details" navigation
  - [x] 2.2.2.9 Write component tests

- [ ] 2.2.3 Implement Escrow Transactions Page
  - [x] 2.2.3.1 Create EscrowTransactionsPage component
  - [x] 2.2.3.2 Fetch transactions from localStorage
  - [x] 2.2.3.3 Display transaction list with details
  - [x] 2.2.3.4 Add filtering by status
  - [x] 2.2.3.5 Add sorting by date/amount
  - [x] 2.2.3.6 Implement transaction detail modal
  - [x] 2.2.3.7 Add "Complete Payment" button for pending
  - [x] 2.2.3.8 Display empty state
  - [x] 2.2.3.9 Write component tests

- [ ] 2.2.4 Implement Billing and Payments Page
  - [x] 2.2.4.1 Create BillingPaymentsPage component
  - [x] 2.2.4.2 Display payment history table
  - [x] 2.2.4.3 Add saved payment methods section
  - [x] 2.2.4.4 Implement add payment method form
  - [x] 2.2.4.5 Add invoice download functionality
  - [x] 2.2.4.6 Display investment summary
  - [x] 2.2.4.7 Write component tests

### 2.2.5 Implement Saved Properties Page
- [x] 2.2.5.1 Create SavedPropertiesPage component
  - [x] 2.2.5.1.1 Fetch favorites from GET /api/favorites
  - [x] 2.2.5.1.2 Display saved properties in grid/list format
  - [x] 2.2.5.1.3 Add filters (property type, location, price range)
  - [x] 2.2.5.1.4 Add sorting options (newest/oldest, price)
  - [x] 2.2.5.1.5 Implement pagination
  - [x] 2.2.5.1.6 Add "Remove from Favorites" button
  - [x] 2.2.5.1.7 Add "View Details" navigation
  - [x] 2.2.5.1.8 Display empty state
  - [x] 2.2.5.1.9 Write component tests

### 2.3 Property Management Pages
- [ ] 2.3.1 Implement Add Property Page
  - [x] 2.3.1.1 Create AddPropertyPage component
  - [x] 2.3.1.2 Create PropertyForm component (reusable)
  - [x] 2.3.1.3 Add form fields (title, description, location, price, etc.)
  - [x] 2.3.1.4 Implement image upload
  - [x] 2.3.1.5 Add amenities selection
  - [x] 2.3.1.6 Implement form validation
  - [x] 2.3.1.7 Call POST /api/properties on submit
  - [x] 2.3.1.8 Redirect to property detail on success
  - [x] 2.3.1.9 Display error messages
  - [x] 2.3.1.10 Write component tests

- [ ] 2.3.2 Implement Edit Property Page
  - [x] 2.3.2.1 Create EditPropertyPage component
  - [x] 2.3.2.2 Fetch property data on mount
  - [x] 2.3.2.3 Pre-populate PropertyForm with data
  - [x] 2.3.2.4 Implement image management (add/remove)
  - [x] 2.3.2.5 Call PUT /api/properties/{propertyId} on submit
  - [x] 2.3.2.6 Add delete property button
  - [x] 2.3.2.7 Implement DELETE /api/properties/{propertyId}
  - [x] 2.3.2.8 Redirect to vendor dashboard on delete
  - [x] 2.3.2.9 Write component tests

## Phase 3: Frontend Components & Hooks

### 3.1 Shared Components
- [x] 3.1.1 Create NotificationDropdown component
  - [x] 3.1.1.1 Fetch notifications from GET /notifications
  - [x] 3.1.1.2 Display notification list
  - [x] 3.1.1.3 Show unread count badge
  - [x] 3.1.1.4 Implement notification click handling
  - [x] 3.1.1.5 Add real-time updates (polling or WebSocket)
  - [x] 3.1.1.6 Write component tests

- [ ] 3.1.2 Create InvestmentCard component
  - [x] 3.1.2.1 Display investment summary
  - [x] 3.1.2.2 Show funding progress bar
  - [x] 3.1.2.3 Add "Invest Now" button
  - [x] 3.1.2.4 Add "View Details" link
  - [x] 3.1.2.5 Write component tests

- [x] 3.1.3 Create TransactionCard component
  - [x] 3.1.3.1 Display transaction details
  - [x] 3.1.3.2 Show status badge
  - [x] 3.1.3.3 Add action buttons based on status
  - [x] 3.1.3.4 Write component tests

- [ ] 3.1.4 Create FavoriteButton component
  - [x] 3.1.4.1 Display heart icon (filled/empty based on state)
  - [x] 3.1.4.2 Handle click to save/remove favorite
  - [x] 3.1.4.3 Call POST /api/favorites/{propertyId} to save
  - [x] 3.1.4.4 Call DELETE /api/favorites/{propertyId} to remove
  - [x] 3.1.4.5 Show loading state during API call
  - [x] 3.1.4.6 Display error toast on failure
  - [x] 3.1.4.7 Prompt login if user not authenticated
  - [x] 3.1.4.8 Write component tests

### 3.2 Custom Hooks
- [ ] 3.2.1 Create useInvestments hook
  - [x] 3.2.1.1 Fetch investments from GET /investments
  - [x] 3.2.1.2 Implement filtering logic
  - [x] 3.2.1.3 Implement sorting logic
  - [x] 3.2.1.4 Handle pagination
  - [x] 3.2.1.5 Add error handling
  - [x] 3.2.1.6 Write hook tests

- [ ] 3.2.2 Create useNotifications hook
  - [x] 3.2.2.1 Fetch notifications from GET /notifications
  - [x] 3.2.2.2 Implement real-time updates
  - [x] 3.2.2.3 Handle notification filtering
  - [x] 3.2.2.4 Add error handling
  - [x] 3.2.2.5 Write hook tests

- [ ] 3.2.3 Create useInquiries hook
  - [x] 3.2.3.1 Fetch inquiries from GET /inquiries
  - [x] 3.2.3.2 Implement filtering and sorting
  - [x] 3.2.3.3 Handle inquiry creation
  - [x] 3.2.3.4 Handle inquiry deletion
  - [x] 3.2.3.5 Add error handling
  - [x] 3.2.3.6 Write hook tests

- [x] 3.2.4 Create usePayments hook
  - [x] 3.2.4.1 Handle payment initialization
  - [x] 3.2.4.2 Manage payment verification
  - [x] 3.2.4.3 Handle payment errors
  - [x] 3.2.4.4 Write hook tests

- [ ] 3.2.5 Create useFavorites hook
  - [x] 3.2.5.1 Fetch favorites from GET /api/favorites
  - [x] 3.2.5.2 Implement add favorite (POST /api/favorites/{propertyId})
  - [x] 3.2.5.3 Implement remove favorite (DELETE /api/favorites/{propertyId})
  - [x] 3.2.5.4 Implement filtering and sorting logic
  - [x] 3.2.5.5 Handle pagination
  - [x] 3.2.5.6 Add error handling
  - [x] 3.2.5.7 Write hook tests

## Phase 4: Authentication & OAuth Integration

### 4.1 Google OAuth Integration
- [ ] 4.1.1 Implement Google OAuth Sign-In
  - [ ] 4.1.1.1 Install Google OAuth library
  - [ ] 4.1.1.2 Configure Google OAuth credentials
  - [ ] 4.1.1.3 Add "Sign in with Google" button to SignInModal
  - [ ] 4.1.1.4 Implement OAuth flow
  - [ ] 4.1.1.5 Call POST /api/auth/google with authorization code
  - [ ] 4.1.1.6 Handle user creation for new users
  - [ ] 4.1.1.7 Store JWT tokens
  - [ ] 4.1.1.8 Redirect to dashboard on success
  - [ ] 4.1.1.9 Write integration tests

### 4.2 Profile Management
- [ ] 4.2.1 Implement Profile Update Endpoint
  - [ ] 4.2.1.1 Create PUT /api/auth/jwt/update-profile endpoint
  - [ ] 4.2.1.2 Validate email uniqueness
  - [ ] 4.2.1.3 Update user profile in database
  - [ ] 4.2.1.4 Return updated user object
  - [ ] 4.2.1.5 Write unit tests

- [ ] 4.2.2 Implement Avatar Upload Endpoint
  - [ ] 4.2.2.1 Create POST /upload/user/avatar endpoint
  - [ ] 4.2.2.2 Validate file type (JPEG, PNG, WebP)
  - [ ] 4.2.2.3 Validate file size (max 5MB)
  - [ ] 4.2.2.4 Upload to cloud storage
  - [ ] 4.2.2.5 Return image URL
  - [ ] 4.2.2.6 Write unit tests

- [ ] 4.2.3 Update Profile Page Component
  - [ ] 4.2.3.1 Add avatar upload button
  - [ ] 4.2.3.2 Implement avatar preview
  - [ ] 4.2.3.3 Call PUT /api/auth/jwt/update-profile on save
  - [ ] 4.2.3.4 Call POST /upload/user/avatar for avatar
  - [ ] 4.2.3.5 Display success/error messages
  - [ ] 4.2.3.6 Write component tests

## Phase 5: Property Management Endpoints

### 5.1 Property CRUD Operations
- [ ] 5.1.1 Implement POST /api/properties endpoint
  - [ ] 5.1.1.1 Create property model and schema
  - [ ] 5.1.1.2 Validate required fields
  - [ ] 5.1.1.3 Set property status to draft
  - [ ] 5.1.1.4 Handle image uploads
  - [ ] 5.1.1.5 Return created property with ID
  - [ ] 5.1.1.6 Write unit tests

- [ ] 5.1.2 Implement PUT /api/properties/{propertyId} endpoint
  - [ ] 5.1.2.1 Fetch property from database
  - [ ] 5.1.2.2 Validate ownership (vendor can only edit own)
  - [ ] 5.1.2.3 Update property fields
  - [ ] 5.1.2.4 Handle image updates
  - [ ] 5.1.2.5 Return updated property
  - [ ] 5.1.2.6 Write unit tests

- [ ] 5.1.3 Implement DELETE /api/properties/{propertyId} endpoint
  - [ ] 5.1.3.1 Fetch property from database
  - [ ] 5.1.3.2 Validate ownership
  - [ ] 5.1.3.3 Delete property and associated data
  - [ ] 5.1.3.4 Return success message
  - [ ] 5.1.3.5 Write unit tests

### 5.2 Inquiry Management Endpoints
- [ ] 5.2.1 Implement POST /inquiries endpoint
  - [ ] 5.2.1.1 Create inquiry model and schema
  - [ ] 5.2.1.2 Validate propertyId exists
  - [ ] 5.2.1.3 Create inquiry with pending status
  - [ ] 5.2.1.4 Send notification to property vendor
  - [ ] 5.2.1.5 Return created inquiry
  - [ ] 5.2.1.6 Write unit tests

- [ ] 5.2.2 Implement GET /inquiries endpoint
  - [ ] 5.2.2.1 Fetch user inquiries from database
  - [ ] 5.2.2.2 Implement pagination
  - [ ] 5.2.2.3 Implement filtering by status
  - [ ] 5.2.2.4 Return inquiry list
  - [ ] 5.2.2.5 Write unit tests

- [ ] 5.2.3 Implement GET /inquiries/{inquiryId} endpoint
  - [ ] 5.2.3.1 Fetch inquiry from database
  - [ ] 5.2.3.2 Include conversation history
  - [ ] 5.2.3.3 Return inquiry details
  - [ ] 5.2.3.4 Write unit tests

- [ ] 5.2.4 Implement PUT /inquiries/{inquiryId} endpoint
  - [ ] 5.2.4.1 Fetch inquiry from database
  - [ ] 5.2.4.2 Validate ownership
  - [ ] 5.2.4.3 Update inquiry fields
  - [ ] 5.2.4.4 Return updated inquiry
  - [ ] 5.2.4.5 Write unit tests

- [ ] 5.2.5 Implement DELETE /inquiries/{inquiryId} endpoint
  - [ ] 5.2.5.1 Fetch inquiry from database
  - [ ] 5.2.5.2 Validate ownership
  - [ ] 5.2.5.3 Delete inquiry
  - [ ] 5.2.5.4 Return success message
  - [ ] 5.2.5.5 Write unit tests

### 5.3 Favorite Properties Management Endpoints
- [ ] 5.3.1 Implement POST /api/favorites/{propertyId} endpoint
  - [ ] 5.3.1.1 Create favorite model and schema
  - [ ] 5.3.1.2 Validate propertyId exists
  - [ ] 5.3.1.3 Check for duplicate favorites
  - [ ] 5.3.1.4 Create favorite with savedAt timestamp
  - [ ] 5.3.1.5 Return created favorite
  - [ ] 5.3.1.6 Write unit tests

- [ ] 5.3.2 Implement DELETE /api/favorites/{propertyId} endpoint
  - [ ] 5.3.2.1 Fetch favorite from database
  - [ ] 5.3.2.2 Validate ownership (user can only delete own favorites)
  - [ ] 5.3.2.3 Delete favorite
  - [ ] 5.3.2.4 Return success message
  - [ ] 5.3.2.5 Write unit tests

- [ ] 5.3.3 Implement GET /api/favorites endpoint
  - [ ] 5.3.3.1 Fetch user favorites from database
  - [ ] 5.3.3.2 Include property details (title, location, price, image)
  - [ ] 5.3.3.3 Implement pagination (limit, offset)
  - [ ] 5.3.3.4 Implement filtering by property type, location, price range
  - [ ] 5.3.3.5 Implement sorting by savedAt or price
  - [ ] 5.3.3.6 Return favorites list with metadata
  - [ ] 5.3.3.7 Write unit tests

- [ ] 5.3.4 Implement cascade delete for favorites
  - [ ] 5.3.4.1 When property is deleted, delete all associated favorites
  - [ ] 5.3.4.2 Add database constraint for cascade delete
  - [ ] 5.3.4.3 Write integration tests

## Phase 6: Integration Testing

### 6.1 End-to-End Tests
- [ ] 6.1.1 Test Investment Flow
  - [ ] 6.1.1.1 Fetch investments list
  - [ ] 6.1.1.2 View investment details
  - [ ] 6.1.1.3 Create investment
  - [ ] 6.1.1.4 Verify payment flow

- [ ] 6.1.2 Test Verification Flow
  - [ ] 6.1.2.1 Fetch verification config
  - [ ] 6.1.2.2 Submit verification application
  - [ ] 6.1.2.3 Verify application status

- [ ] 6.1.3 Test Notification Flow
  - [ ] 6.1.3.1 Fetch notifications
  - [ ] 6.1.3.2 Start chat
  - [ ] 6.1.3.3 Submit rating

- [ ] 6.1.4 Test Property Management Flow
  - [ ] 6.1.4.1 Create property
  - [ ] 6.1.4.2 Update property
  - [ ] 6.1.4.3 Delete property

- [ ] 6.1.5 Test Inquiry Flow
  - [ ] 6.1.5.1 Create inquiry
  - [ ] 6.1.5.2 Fetch inquiries
  - [ ] 6.1.5.3 Delete inquiry

- [ ] 6.1.6 Test Favorite Properties Flow
  - [ ] 6.1.6.1 Save property as favorite
  - [ ] 6.1.6.2 Fetch user favorites
  - [ ] 6.1.6.3 Remove property from favorites
  - [ ] 6.1.6.4 Verify favorite persists across sessions
  - [ ] 6.1.6.5 Test favorite button state updates

### 6.2 Error Handling Tests
- [ ] 6.2.1 Test 401 Unauthorized Errors
  - [ ] 6.2.1.1 Test missing JWT token
  - [ ] 6.2.1.2 Test expired JWT token
  - [ ] 6.2.1.3 Test invalid JWT token

- [ ] 6.2.2 Test 400 Validation Errors
  - [ ] 6.2.2.1 Test missing required fields
  - [ ] 6.2.2.2 Test invalid field values
  - [ ] 6.2.2.3 Test constraint violations

- [ ] 6.2.3 Test 404 Not Found Errors
  - [ ] 6.2.3.1 Test non-existent investment
  - [ ] 6.2.3.2 Test non-existent property
  - [ ] 6.2.3.3 Test non-existent inquiry

- [ ] 6.2.4 Test 403 Forbidden Errors
  - [ ] 6.2.4.1 Test unauthorized property edit
  - [ ] 6.2.4.2 Test unauthorized inquiry delete
  - [ ] 6.2.4.3 Test blocked user chat

## Phase 7: Documentation & Deployment

### 7.1 API Documentation
- [x] 7.1.1 Create API documentation
  - [x] 7.1.1.1 Document all endpoints
  - [x] 7.1.1.2 Include request/response examples
  - [x] 7.1.1.3 Document error codes
  - [x] 7.1.1.4 Include authentication requirements

### 7.2 Frontend Documentation
- [x] 7.2.1 Create component documentation
  - [x] 7.2.1.1 Document all pages
  - [x] 7.2.1.2 Document all components
  - [x] 7.2.1.3 Document all hooks
  - [x] 7.2.1.4 Include usage examples

### 7.3 Deployment
- [ ] 7.3.1 Deploy backend endpoints
  - [ ] 7.3.1.1 Deploy to Render
  - [ ] 7.3.1.2 Configure environment variables
  - [ ] 7.3.1.3 Run database migrations
  - [ ] 7.3.1.4 Verify endpoints are accessible

- [ ] 7.3.2 Deploy frontend
  - [ ] 7.3.2.1 Build production bundle
  - [ ] 7.3.2.2 Deploy to hosting service
  - [ ] 7.3.2.3 Configure API endpoints
  - [ ] 7.3.2.4 Verify all pages are accessible

### 7.4 Testing & QA
- [ ] 7.4.1 Manual Testing
  - [ ] 7.4.1.1 Test all user flows
  - [ ] 7.4.1.2 Test error scenarios
  - [ ] 7.4.1.3 Test on multiple browsers
  - [ ] 7.4.1.4 Test on mobile devices

- [ ] 7.4.2 Performance Testing
  - [ ] 7.4.2.1 Test API response times
  - [ ] 7.4.2.2 Test page load times
  - [ ] 7.4.2.3 Test with large datasets
  - [ ] 7.4.2.4 Optimize slow endpoints

