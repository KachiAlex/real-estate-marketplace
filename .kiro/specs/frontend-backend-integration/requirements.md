# Requirements Document: Frontend-Backend Integration

## Introduction

PropertyArk requires comprehensive frontend-backend integration to complete the user experience across property browsing, investment management, verification workflows, and payment processing. This spec covers Priority 2 (Important for UX) and Priority 3 (Nice to Have) features, including 6 critical endpoints for verification, investments, and notifications, plus 7 frontend pages and features for user workflows. The integration ensures seamless data flow between the React frontend and Node.js/Express backend, with proper authentication, error handling, and data persistence.

## Glossary

- **Frontend**: React-based web application for PropertyArk users
- **Backend**: Node.js/Express API service hosted on Render
- **Endpoint**: HTTP API route that handles specific business logic
- **JWT**: JSON Web Token used for stateless authentication
- **Verification System**: Process for vendors to verify property authenticity and credentials
- **Investment System**: Features allowing users to invest in property opportunities
- **Notification System**: Real-time alerts and messaging for user interactions
- **Escrow**: Secure payment holding mechanism for property transactions
- **KYC**: Know Your Customer verification documents and process
- **OAuth**: Third-party authentication protocol (Google Sign-In)
- **Paystack**: Payment gateway for processing transactions
- **PropertyArk_Frontend**: The React web application
- **PropertyArk_Backend**: The Node.js/Express API service
- **Verification_Manager**: Backend component handling property verification workflows
- **Investment_Manager**: Backend component managing investment opportunities and user investments
- **Notification_Manager**: Backend component handling notifications and messaging
- **Payment_Processor**: Backend component managing payment initialization and verification
- **User_Manager**: Backend component handling user profile and authentication
- **Property_Manager**: Backend component managing property CRUD operations

## Requirements

### Requirement 1: Verification Configuration Endpoint

**User Story:** As a vendor, I want to retrieve verification requirements and pricing, so that I can understand what's needed to verify my properties.

#### Acceptance Criteria

1. WHEN a vendor requests verification configuration, THE Verification_Manager SHALL return configuration via `GET /verification/config`
2. THE response SHALL include verification types, required documents, and associated fees
3. THE response SHALL include payment information for verification processing
4. WHEN the endpoint is called, THE response SHALL be cached for 24 hours on the frontend
5. IF the backend is unavailable, THEN the frontend SHALL display a user-friendly error message

### Requirement 2: Property Verification Application Submission

**User Story:** As a vendor, I want to submit my property for verification, so that I can increase buyer confidence and visibility.

#### Acceptance Criteria

1. WHEN a vendor submits a verification application, THE Verification_Manager SHALL accept it via `POST /verification/applications`
2. THE request SHALL include propertyId, verificationType, and required documents
3. THE Verification_Manager SHALL validate all required documents are present
4. IF validation passes, THEN the application SHALL be stored with status `pending_review`
5. THE response SHALL include an applicationId for tracking
6. WHEN the application is submitted, THE frontend SHALL display a success confirmation
7. IF validation fails, THEN the backend SHALL return specific error messages for each missing document

### Requirement 3: Investment Opportunities Listing

**User Story:** As a buyer, I want to view available investment opportunities, so that I can explore and compare investment options.

#### Acceptance Criteria

1. WHEN a user navigates to the investment page, THE Investment_Manager SHALL return opportunities via `GET /investments`
2. THE response SHALL include investmentId, title, description, targetAmount, currentAmount, and expectedReturn
3. THE response SHALL support pagination with limit and offset parameters
4. THE response SHALL support filtering by status (active, completed, closed)
5. WHEN the endpoint is called, THE frontend SHALL display investments in a grid or list format
6. IF no investments are available, THEN the frontend SHALL display an empty state message

### Requirement 4: Investment Details Retrieval

**User Story:** As a buyer, I want to view detailed information about a specific investment, so that I can make an informed investment decision.

#### Acceptance Criteria

1. WHEN a user views an investment, THE Investment_Manager SHALL return details via `GET /investments/{investmentId}`
2. THE response SHALL include full investment details: description, timeline, risk level, expected returns, and investor list
3. THE response SHALL include property information associated with the investment
4. THE response SHALL include current investment progress and funding status
5. WHEN the endpoint is called, THE frontend SHALL display all details on the investment detail page
6. IF the investment does not exist, THEN the backend SHALL return a 404 error with a descriptive message

### Requirement 5: Investment Creation

**User Story:** As a buyer, I want to invest in an opportunity, so that I can participate in property investments.

#### Acceptance Criteria

1. WHEN a user invests in an opportunity, THE Investment_Manager SHALL accept the investment via `POST /investments/{investmentId}/invest`
2. THE request SHALL include investmentId, amount, and paymentMethod
3. THE Investment_Manager SHALL validate the investment amount is within acceptable range
4. IF validation passes, THEN the investment SHALL be created with status `pending_payment`
5. THE response SHALL include an investmentRecordId for tracking
6. WHEN the investment is created, THE frontend SHALL trigger the payment flow
7. IF the investment amount exceeds available funds, THEN the backend SHALL return a validation error

### Requirement 6: Notifications Retrieval

**User Story:** As a user, I want to receive and view notifications, so that I stay informed about property inquiries, viewings, and investments.

#### Acceptance Criteria

1. WHEN a user opens the notification dropdown, THE Notification_Manager SHALL return notifications via `GET /notifications`
2. THE response SHALL include notificationId, type, message, timestamp, and read status
3. THE response SHALL support filtering by type (inquiry, viewing, investment, payment, verification)
4. THE response SHALL support pagination with limit and offset parameters
5. WHEN notifications are retrieved, THE frontend SHALL display them in chronological order (newest first)
6. IF no notifications exist, THEN the frontend SHALL display an empty state message
7. WHEN a notification is clicked, THE frontend SHALL navigate to the relevant page or open a modal

### Requirement 7: Chat Initiation

**User Story:** As a user, I want to start a chat with another user, so that I can communicate about properties or investments.

#### Acceptance Criteria

1. WHEN a user initiates a chat, THE Notification_Manager SHALL create a chat via `POST /chats/start`
2. THE request SHALL include recipientId and optional initialMessage
3. THE Notification_Manager SHALL validate both users exist and are not blocked
4. IF validation passes, THEN the chat SHALL be created with status `active`
5. THE response SHALL include chatId and initial message details
6. WHEN the chat is created, THE frontend SHALL navigate to the chat interface
7. IF the users are blocked, THEN the backend SHALL return a 403 error

### Requirement 8: Rating Submission

**User Story:** As a user, I want to rate another user or property, so that I can provide feedback and help other users make decisions.

#### Acceptance Criteria

1. WHEN a user submits a rating, THE Notification_Manager SHALL accept it via `POST /ratings`
2. THE request SHALL include targetId (userId or propertyId), rating (1-5), and optional review text
3. THE Notification_Manager SHALL validate the rating is between 1 and 5
4. IF validation passes, THEN the rating SHALL be stored with timestamp
5. THE response SHALL include ratingId and confirmation message
6. WHEN the rating is submitted, THE frontend SHALL display a success message
7. IF the user has already rated the target, THEN the backend SHALL update the existing rating

### Requirement 9: Forgot Password Page

**User Story:** As a user, I want to reset my password, so that I can regain access to my account if I forget my password.

#### Acceptance Criteria

1. WHEN a user navigates to `/auth/forgot-password`, THE PropertyArk_Frontend SHALL display the forgot password page
2. THE page SHALL include an email input field and submit button
3. WHEN the user submits their email, THE frontend SHALL call `POST /api/auth/forgot-password`
4. IF the email exists, THEN the backend SHALL send a password reset link via email
5. WHEN the user clicks the reset link, THE frontend SHALL display a password reset form
6. WHEN the user submits a new password, THE frontend SHALL call `POST /api/auth/reset-password`
7. IF the reset is successful, THEN the user SHALL be redirected to the login page

### Requirement 10: My Inquiries Page

**User Story:** As a user, I want to view all my property inquiries, so that I can track my interest in properties.

#### Acceptance Criteria

1. WHEN a user navigates to `/my-inquiries`, THE PropertyArk_Frontend SHALL display all user inquiries
2. THE page SHALL display inquiryId, propertyTitle, status, and createdAt for each inquiry
3. THE page SHALL support filtering by status (pending, responded, closed)
4. THE page SHALL support sorting by date (newest/oldest)
5. WHEN an inquiry is clicked, THE frontend SHALL display inquiry details and conversation history
6. WHEN the user clicks "Delete Inquiry", THE frontend SHALL call `DELETE /inquiries/{inquiryId}`
7. IF no inquiries exist, THEN the page SHALL display an empty state message

### Requirement 11: Investment Opportunities Page

**User Story:** As a buyer, I want to browse and filter investment opportunities, so that I can find investments matching my criteria.

#### Acceptance Criteria

1. WHEN a user navigates to `/investment`, THE PropertyArk_Frontend SHALL display available investments
2. THE page SHALL display investments in a grid or list format with key details
3. THE page SHALL include filters for status, expectedReturn range, and investmentType
4. THE page SHALL support sorting by expectedReturn, targetAmount, or createdAt
5. WHEN a user clicks "Invest Now", THE frontend SHALL open the investment modal
6. WHEN a user clicks "View Details", THE frontend SHALL navigate to `/investment/{investmentId}`
7. THE page SHALL display pagination controls for browsing multiple pages

### Requirement 12: Escrow Transactions Page

**User Story:** As a user, I want to view my escrow transactions, so that I can track payment status and transaction history.

#### Acceptance Criteria

1. WHEN a user navigates to `/billing-payments`, THE PropertyArk_Frontend SHALL display escrow transactions
2. THE page SHALL display transactionId, propertyTitle, amount, status, and date for each transaction
3. THE page SHALL support filtering by status (pending, payment_received, completed, disputed, cancelled)
4. THE page SHALL support sorting by date (newest/oldest) or amount
5. WHEN a transaction is clicked, THE frontend SHALL display full transaction details
6. WHEN a transaction status is `pending`, THE page SHALL display a "Complete Payment" button
7. IF no transactions exist, THEN the page SHALL display an empty state message

### Requirement 13: Add Property Page

**User Story:** As a vendor, I want to add a new property, so that I can list properties for sale or rent.

#### Acceptance Criteria

1. WHEN a vendor navigates to `/add-property`, THE PropertyArk_Frontend SHALL display the property form
2. THE form SHALL include fields for title, description, location, price, bedrooms, bathrooms, amenities, and images
3. WHEN the vendor submits the form, THE frontend SHALL call `POST /api/properties`
4. THE backend SHALL validate all required fields are present
5. IF validation passes, THEN the property SHALL be created with status `draft`
6. THE response SHALL include propertyId for future reference
7. WHEN the property is created, THE frontend SHALL redirect to `/property/{propertyId}`
8. IF validation fails, THEN the frontend SHALL display specific error messages for each field

### Requirement 14: Billing and Payments Page

**User Story:** As a user, I want to view my billing history and payment methods, so that I can manage my account finances.

#### Acceptance Criteria

1. WHEN a user navigates to `/billing-payments`, THE PropertyArk_Frontend SHALL display billing information
2. THE page SHALL display payment history with transactionId, amount, date, and status
3. THE page SHALL display saved payment methods and allow adding new methods
4. THE page SHALL display invoice information and allow downloading invoices
5. WHEN a user clicks "Download Invoice", THE frontend SHALL generate and download a PDF
6. WHEN a user clicks "Add Payment Method", THE frontend SHALL open a payment method form
7. THE page SHALL display total invested amount and active investments summary

### Requirement 15: Edit Property Page

**User Story:** As a vendor, I want to edit my property details, so that I can update information and keep listings current.

#### Acceptance Criteria

1. WHEN a vendor navigates to `/edit-property/{propertyId}`, THE PropertyArk_Frontend SHALL display the property edit form
2. THE form SHALL be pre-populated with current property data
3. WHEN the vendor submits the form, THE frontend SHALL call `PUT /api/properties/{propertyId}`
4. THE backend SHALL validate all required fields are present
5. IF validation passes, THEN the property SHALL be updated
6. WHEN the property is updated, THE frontend SHALL display a success message
7. WHEN the vendor clicks "Delete Property", THE frontend SHALL call `DELETE /api/properties/{propertyId}`
8. IF deletion is successful, THEN the frontend SHALL redirect to the vendor dashboard

### Requirement 16: Google OAuth Integration

**User Story:** As a user, I want to sign in with Google, so that I can quickly create an account without entering credentials.

#### Acceptance Criteria

1. WHEN a user clicks "Sign in with Google", THE PropertyArk_Frontend SHALL initiate Google OAuth flow
2. THE frontend SHALL redirect to Google's authentication page
3. WHEN the user authorizes the app, THE frontend SHALL receive an authorization code
4. THE frontend SHALL call `POST /api/auth/google` with the authorization code
5. THE backend SHALL exchange the code for user information
6. IF the user is new, THEN the backend SHALL create a new user account
7. IF the user exists, THEN the backend SHALL return the existing user
8. THE backend SHALL return JWT tokens for authentication
9. WHEN authentication is successful, THE frontend SHALL redirect to the dashboard

### Requirement 17: Profile Update Endpoint

**User Story:** As a user, I want to update my profile information, so that I can keep my account details current.

#### Acceptance Criteria

1. WHEN a user updates their profile, THE User_Manager SHALL accept updates via `PUT /api/auth/jwt/update-profile`
2. THE request SHALL include firstName, lastName, email, phone, and optional profileImage
3. THE User_Manager SHALL validate email is unique (if changed)
4. IF validation passes, THEN the profile SHALL be updated
5. THE response SHALL include the updated user object
6. WHEN the profile is updated, THE frontend SHALL display a success message
7. IF email is already in use, THEN the backend SHALL return a validation error

### Requirement 18: Avatar Upload Endpoint

**User Story:** As a user, I want to upload a profile avatar, so that I can personalize my account.

#### Acceptance Criteria

1. WHEN a user uploads an avatar, THE User_Manager SHALL accept it via `POST /upload/user/avatar`
2. THE request SHALL include the image file (multipart/form-data)
3. THE User_Manager SHALL validate the file is an image (JPEG, PNG, WebP)
4. THE User_Manager SHALL validate the file size is under 5MB
5. IF validation passes, THEN the image SHALL be uploaded and stored
6. THE response SHALL include the image URL
7. WHEN the upload is successful, THE frontend SHALL display the new avatar
8. IF validation fails, THEN the backend SHALL return specific error messages

### Requirement 19: Property CRUD Operations

**User Story:** As a vendor, I want to manage my properties, so that I can create, read, update, and delete listings.

#### Acceptance Criteria

1. WHEN a vendor creates a property, THE Property_Manager SHALL accept it via `POST /api/properties`
2. WHEN a vendor retrieves properties, THE Property_Manager SHALL return them via `GET /api/properties`
3. WHEN a vendor retrieves a specific property, THE Property_Manager SHALL return it via `GET /api/properties/{propertyId}`
4. WHEN a vendor updates a property, THE Property_Manager SHALL accept updates via `PUT /api/properties/{propertyId}`
5. WHEN a vendor deletes a property, THE Property_Manager SHALL accept deletion via `DELETE /api/properties/{propertyId}`
6. THE Property_Manager SHALL validate all required fields for create and update operations
7. IF validation fails, THEN the backend SHALL return specific error messages for each field
8. WHEN a property is deleted, THE frontend SHALL redirect to the vendor dashboard

### Requirement 20: Inquiry Management Endpoints

**User Story:** As a user, I want to manage property inquiries, so that I can track and respond to buyer questions.

#### Acceptance Criteria

1. WHEN a user creates an inquiry, THE backend SHALL accept it via `POST /inquiries`
2. WHEN a user retrieves inquiries, THE backend SHALL return them via `GET /inquiries`
3. WHEN a user retrieves a specific inquiry, THE backend SHALL return it via `GET /inquiries/{inquiryId}`
4. WHEN a user updates an inquiry, THE backend SHALL accept updates via `PUT /inquiries/{inquiryId}`
5. WHEN a user deletes an inquiry, THE backend SHALL accept deletion via `DELETE /inquiries/{inquiryId}`
6. THE backend SHALL validate all required fields for create and update operations
7. IF validation fails, THEN the backend SHALL return specific error messages
8. WHEN an inquiry is created, THE backend SHALL notify the property vendor

### Requirement 21: Favorite Properties Management

**User Story:** As a buyer, I want to save favorite properties to my account, so that I can access them across devices and keep track of properties I'm interested in.

#### Acceptance Criteria

1. WHEN a user clicks the favorite/heart button on a property, THE frontend SHALL call `POST /api/favorites/{propertyId}` to save the property
2. WHEN a user clicks the favorite button again, THE frontend SHALL call `DELETE /api/favorites/{propertyId}` to remove the property
3. WHEN a user navigates to `/saved-properties`, THE frontend SHALL call `GET /api/favorites` to retrieve all saved properties
4. THE response SHALL include propertyId, title, location, price, image, and savedAt timestamp
5. THE response SHALL support pagination with limit and offset parameters
6. WHEN a property is saved, THE frontend SHALL update the heart icon to filled state
7. WHEN a property is removed, THE frontend SHALL update the heart icon to empty state
8. IF the user is not authenticated, THEN the frontend SHALL prompt the user to login before saving
9. THE backend SHALL sync favorites across all devices for the authenticated user
10. WHEN a property is deleted by the vendor, THE backend SHALL automatically remove it from all users' favorites

### Requirement 22: Favorite Properties Persistence

**User Story:** As a system, I want to persist favorite properties in the database, so that users can access their favorites across devices and sessions.

#### Acceptance Criteria

1. WHEN a user saves a favorite, THE backend SHALL store it in the database with userId and propertyId
2. THE backend SHALL prevent duplicate favorites (same user cannot favorite same property twice)
3. WHEN a user removes a favorite, THE backend SHALL delete it from the database
4. WHEN a user retrieves favorites, THE backend SHALL return all saved properties with metadata
5. THE backend SHALL include property details (title, location, price, image) in the response
6. THE backend SHALL support filtering favorites by property type, location, or price range
7. THE backend SHALL support sorting by savedAt (newest/oldest) or property price
8. WHEN a property is deleted, THE backend SHALL cascade delete all associated favorites
9. THE backend SHALL track savedAt timestamp for each favorite
10. THE backend SHALL return the count of users who have favorited each property

