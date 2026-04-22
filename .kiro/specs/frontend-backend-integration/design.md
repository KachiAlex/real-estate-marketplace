# Design Document: Frontend-Backend Integration

## Overview

This document provides technical design specifications for implementing Priority 2 and Priority 3 features in the PropertyArk frontend-backend integration. The design covers API endpoint specifications, data models, request/response formats, error handling, and frontend component architecture.

## Architecture

### System Components

```
PropertyArk_Frontend (React)
├── Pages (Forgot Password, My Inquiries, Investments, Escrow, Add/Edit Property, Billing)
├── Components (Forms, Cards, Modals, Lists)
├── Services (API Client, Auth Manager, Cache Manager)
├── Contexts (Auth, User, Investment, Notification)
└── Hooks (useAuth, useInvestments, useNotifications, useCache)

PropertyArk_Backend (Node.js/Express)
├── Routes (Auth, Properties, Investments, Verification, Notifications, Payments)
├── Controllers (Business logic for each domain)
├── Models (User, Property, Investment, Verification, Notification, Chat, Rating)
├── Middleware (Authentication, Validation, Error handling)
└── Services (Email, Payment processing, File upload)
```

## API Endpoint Specifications

### Priority 2 Endpoints (Critical for UX)

#### 1. GET /verification/config

**Purpose:** Retrieve verification requirements and pricing configuration

**Request:**
```
GET /verification/config
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "verificationTypes": [
      {
        "id": "property_verification",
        "name": "Property Verification",
        "description": "Verify property authenticity and ownership",
        "requiredDocuments": ["property_deed", "id_proof", "utility_bill"],
        "fee": 5000,
        "currency": "NGN",
        "processingTime": "3-5 business days"
      },
      {
        "id": "vendor_verification",
        "name": "Vendor Verification",
        "description": "Verify vendor credentials and background",
        "requiredDocuments": ["business_registration", "tax_id", "bank_statement"],
        "fee": 10000,
        "currency": "NGN",
        "processingTime": "5-7 business days"
      }
    ],
    "documentTypes": {
      "property_deed": {
        "name": "Property Deed",
        "acceptedFormats": ["pdf", "jpg", "png"],
        "maxSize": 10485760
      },
      "id_proof": {
        "name": "ID Proof",
        "acceptedFormats": ["pdf", "jpg", "png"],
        "maxSize": 5242880
      }
    },
    "paymentMethods": ["paystack", "bank_transfer"],
    "cacheExpiry": 86400
  }
}
```

**Error Response (500):**
```json
{
  "success": false,
  "error": "Failed to retrieve verification config",
  "code": "CONFIG_FETCH_ERROR"
}
```

---

#### 2. POST /verification/applications

**Purpose:** Submit a property or vendor verification application

**Request:**
```
POST /verification/applications
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data

{
  "verificationType": "property_verification",
  "propertyId": "prop_123",
  "documents": [
    { "type": "property_deed", "file": <binary> },
    { "type": "id_proof", "file": <binary> }
  ],
  "metadata": {
    "propertyAddress": "123 Main St, Lagos",
    "ownershipProof": "deed_number_12345"
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "applicationId": "app_456",
    "verificationType": "property_verification",
    "propertyId": "prop_123",
    "status": "pending_review",
    "submittedAt": "2024-01-15T10:30:00Z",
    "estimatedCompletionDate": "2024-01-20T10:30:00Z",
    "documents": [
      {
        "type": "property_deed",
        "status": "received",
        "uploadedAt": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "documents": "Missing required document: property_deed"
  }
}
```

---

#### 3. GET /investments

**Purpose:** Retrieve list of investment opportunities

**Request:**
```
GET /investments?limit=10&offset=0&status=active&sortBy=expectedReturn
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "investments": [
      {
        "investmentId": "inv_001",
        "title": "Lekki Luxury Apartments",
        "description": "High-end residential complex in Lekki",
        "propertyId": "prop_789",
        "status": "active",
        "targetAmount": 50000000,
        "currentAmount": 35000000,
        "fundingPercentage": 70,
        "expectedReturn": 25,
        "investmentType": "equity",
        "minimumInvestment": 500000,
        "investorCount": 45,
        "startDate": "2024-01-01",
        "endDate": "2025-01-01",
        "riskLevel": "medium",
        "image": "https://cdn.propertyark.com/inv_001.jpg"
      }
    ],
    "pagination": {
      "total": 120,
      "limit": 10,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

**Error Response (500):**
```json
{
  "success": false,
  "error": "Failed to retrieve investments",
  "code": "FETCH_ERROR"
}
```

---

#### 4. GET /investments/{investmentId}

**Purpose:** Retrieve detailed information about a specific investment

**Request:**
```
GET /investments/inv_001
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "investmentId": "inv_001",
    "title": "Lekki Luxury Apartments",
    "description": "High-end residential complex in Lekki with modern amenities",
    "propertyId": "prop_789",
    "property": {
      "propertyId": "prop_789",
      "title": "Lekki Luxury Apartments",
      "location": "Lekki, Lagos",
      "bedrooms": 3,
      "bathrooms": 2,
      "amenities": ["pool", "gym", "security"]
    },
    "status": "active",
    "targetAmount": 50000000,
    "currentAmount": 35000000,
    "fundingPercentage": 70,
    "expectedReturn": 25,
    "investmentType": "equity",
    "minimumInvestment": 500000,
    "investorCount": 45,
    "startDate": "2024-01-01",
    "endDate": "2025-01-01",
    "riskLevel": "medium",
    "timeline": [
      {
        "phase": "Construction",
        "startDate": "2024-01-01",
        "endDate": "2024-06-30",
        "status": "in_progress"
      },
      {
        "phase": "Completion",
        "startDate": "2024-07-01",
        "endDate": "2025-01-01",
        "status": "pending"
      }
    ],
    "investors": [
      {
        "investorId": "user_123",
        "name": "John Doe",
        "investmentAmount": 2000000,
        "investmentDate": "2024-01-10"
      }
    ],
    "documents": [
      {
        "type": "prospectus",
        "url": "https://cdn.propertyark.com/inv_001_prospectus.pdf"
      }
    ]
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "Investment not found",
  "code": "NOT_FOUND"
}
```

---

#### 5. POST /investments/{investmentId}/invest

**Purpose:** Create an investment record for a user

**Request:**
```
POST /investments/inv_001/invest
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "amount": 2000000,
  "paymentMethod": "paystack",
  "investmentType": "equity"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "investmentRecordId": "invr_001",
    "investmentId": "inv_001",
    "userId": "user_123",
    "amount": 2000000,
    "status": "pending_payment",
    "paymentMethod": "paystack",
    "createdAt": "2024-01-15T10:30:00Z",
    "paymentDetails": {
      "paymentId": "pay_789",
      "reference": "txRef_12345",
      "checkoutUrl": "https://checkout.paystack.com/..."
    }
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Investment amount below minimum",
  "code": "VALIDATION_ERROR",
  "details": {
    "minimumAmount": 500000,
    "providedAmount": 200000
  }
}
```

---

#### 6. GET /notifications

**Purpose:** Retrieve user notifications

**Request:**
```
GET /notifications?limit=20&offset=0&type=inquiry&read=false
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "notificationId": "notif_001",
        "type": "inquiry",
        "title": "New Property Inquiry",
        "message": "John Doe inquired about your property at Lekki",
        "relatedEntity": {
          "type": "property",
          "id": "prop_789"
        },
        "read": false,
        "createdAt": "2024-01-15T10:30:00Z",
        "actionUrl": "/property/prop_789"
      },
      {
        "notificationId": "notif_002",
        "type": "viewing",
        "title": "Viewing Request Confirmed",
        "message": "Your viewing request for Lekki Apartments has been confirmed",
        "relatedEntity": {
          "type": "viewing",
          "id": "view_456"
        },
        "read": false,
        "createdAt": "2024-01-14T15:20:00Z",
        "actionUrl": "/my-inspections"
      }
    ],
    "pagination": {
      "total": 45,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    },
    "unreadCount": 12
  }
}
```

**Error Response (500):**
```json
{
  "success": false,
  "error": "Failed to retrieve notifications",
  "code": "FETCH_ERROR"
}
```

---

#### 7. POST /chats/start

**Purpose:** Initiate a chat with another user

**Request:**
```
POST /chats/start
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "recipientId": "user_456",
  "initialMessage": "Hi, I'm interested in your property at Lekki"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "chatId": "chat_001",
    "participants": [
      {
        "userId": "user_123",
        "name": "Jane Smith"
      },
      {
        "userId": "user_456",
        "name": "John Doe"
      }
    ],
    "status": "active",
    "createdAt": "2024-01-15T10:30:00Z",
    "lastMessage": {
      "messageId": "msg_001",
      "senderId": "user_123",
      "text": "Hi, I'm interested in your property at Lekki",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  }
}
```

**Error Response (403):**
```json
{
  "success": false,
  "error": "Cannot start chat with this user",
  "code": "BLOCKED_USER"
}
```

---

#### 8. POST /ratings

**Purpose:** Submit a rating for a user or property

**Request:**
```
POST /ratings
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "targetId": "user_456",
  "targetType": "user",
  "rating": 5,
  "review": "Excellent vendor, very professional and responsive"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "ratingId": "rating_001",
    "targetId": "user_456",
    "targetType": "user",
    "rating": 5,
    "review": "Excellent vendor, very professional and responsive",
    "ratedBy": "user_123",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Invalid rating value",
  "code": "VALIDATION_ERROR",
  "details": {
    "rating": "Must be between 1 and 5"
  }
}
```

---

### Priority 3 Endpoints (Nice to Have)

#### 9. POST /api/auth/forgot-password

**Purpose:** Request password reset email

**Request:**
```
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset link sent to your email"
}
```

---

#### 10. POST /api/auth/reset-password

**Purpose:** Reset password with token

**Request:**
```
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset_token_xyz",
  "newPassword": "newPassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

#### 11. GET /inquiries

**Purpose:** Retrieve user inquiries

**Request:**
```
GET /inquiries?limit=10&offset=0&status=pending
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "inquiries": [
      {
        "inquiryId": "inq_001",
        "propertyId": "prop_789",
        "propertyTitle": "Lekki Luxury Apartments",
        "status": "pending",
        "message": "Is this property available for viewing?",
        "createdAt": "2024-01-15T10:30:00Z",
        "responses": []
      }
    ],
    "pagination": {
      "total": 15,
      "limit": 10,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

---

#### 12. POST /inquiries

**Purpose:** Create a new inquiry

**Request:**
```
POST /inquiries
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "propertyId": "prop_789",
  "message": "Is this property available for viewing?"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "inquiryId": "inq_001",
    "propertyId": "prop_789",
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

#### 13. DELETE /inquiries/{inquiryId}

**Purpose:** Delete an inquiry

**Request:**
```
DELETE /inquiries/inq_001
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Inquiry deleted successfully"
}
```

---

#### 14. PUT /api/properties/{propertyId}

**Purpose:** Update property details

**Request:**
```
PUT /api/properties/prop_789
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "title": "Updated Property Title",
  "description": "Updated description",
  "price": 50000000,
  "bedrooms": 3,
  "bathrooms": 2,
  "amenities": ["pool", "gym", "security"]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "propertyId": "prop_789",
    "title": "Updated Property Title",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

#### 15. DELETE /api/properties/{propertyId}

**Purpose:** Delete a property

**Request:**
```
DELETE /api/properties/prop_789
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Property deleted successfully"
}
```

---

#### 16. POST /api/auth/google

**Purpose:** Google OAuth authentication

**Request:**
```
POST /api/auth/google
Content-Type: application/json

{
  "code": "authorization_code_from_google",
  "redirectUri": "https://propertyark.com/auth/callback"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "userId": "user_123",
      "email": "user@gmail.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "buyer"
    },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

---

#### 17. PUT /api/auth/jwt/update-profile

**Purpose:** Update user profile

**Request:**
```
PUT /api/auth/jwt/update-profile
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+234801234567",
  "bio": "Real estate investor"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "userId": "user_123",
    "firstName": "John",
    "lastName": "Doe",
    "email": "user@example.com",
    "phone": "+234801234567",
    "bio": "Real estate investor",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

#### 18. POST /upload/user/avatar

**Purpose:** Upload user profile avatar

**Request:**
```
POST /upload/user/avatar
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data

{
  "avatar": <binary image file>
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "avatarUrl": "https://cdn.propertyark.com/avatars/user_123.jpg",
    "uploadedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

#### 19. POST /api/favorites/{propertyId}

**Purpose:** Save a property as favorite

**Request:**
```
POST /api/favorites/prop_789
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "favoriteId": "fav_001",
    "userId": "user_123",
    "propertyId": "prop_789",
    "savedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Response (409 Conflict):**
```json
{
  "success": false,
  "error": "Property already in favorites",
  "code": "DUPLICATE_FAVORITE"
}
```

---

#### 20. DELETE /api/favorites/{propertyId}

**Purpose:** Remove a property from favorites

**Request:**
```
DELETE /api/favorites/prop_789
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Property removed from favorites"
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "Favorite not found",
  "code": "NOT_FOUND"
}
```

---

#### 21. GET /api/favorites

**Purpose:** Retrieve all favorite properties for the user

**Request:**
```
GET /api/favorites?limit=10&offset=0&sortBy=savedAt&propertyType=apartment
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "favorites": [
      {
        "favoriteId": "fav_001",
        "propertyId": "prop_789",
        "title": "Lekki Luxury Apartments",
        "location": "Lekki, Lagos",
        "price": 50000000,
        "bedrooms": 3,
        "bathrooms": 2,
        "image": "https://cdn.propertyark.com/prop_789.jpg",
        "propertyType": "apartment",
        "status": "for_sale",
        "savedAt": "2024-01-15T10:30:00Z",
        "vendorName": "John Doe",
        "rating": 4.5
      }
    ],
    "pagination": {
      "total": 25,
      "limit": 10,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

**Error Response (500):**
```json
{
  "success": false,
  "error": "Failed to retrieve favorites",
  "code": "FETCH_ERROR"
}
```

---

## Frontend Component Architecture

### Pages

#### 1. ForgotPasswordPage
- Email input field
- Submit button
- Success/error messages
- Link to login page

#### 2. MyInquiriesPage
- List of inquiries with filters
- Inquiry detail modal
- Delete inquiry functionality
- Empty state

#### 3. InvestmentPage
- Investment grid/list
- Filters (status, return range, type)
- Sorting options
- Pagination
- Investment detail modal

#### 4. EscrowTransactionsPage
- Transaction list with filters
- Transaction detail modal
- Payment completion button
- Empty state

#### 5. AddPropertyPage
- Property form with validation
- Image upload
- Amenities selection
- Submit button

#### 6. BillingPaymentsPage
- Payment history table
- Saved payment methods
- Invoice download
- Investment summary

#### 7. EditPropertyPage
- Pre-populated property form
- Image management
- Delete property button
- Submit button

### Shared Components

- **NotificationDropdown**: Displays notifications with real-time updates
- **InvestmentCard**: Displays investment summary
- **TransactionCard**: Displays transaction details
- **PropertyForm**: Reusable form for add/edit property
- **PaymentModal**: Payment method selection and processing

### Hooks

- `useInvestments()`: Fetch and manage investments
- `useNotifications()`: Fetch and manage notifications
- `useInquiries()`: Fetch and manage inquiries
- `usePayments()`: Handle payment processing
- `useVerification()`: Handle verification workflows

## Error Handling

### HTTP Status Codes

- **200 OK**: Successful GET/PUT request
- **201 Created**: Successful POST request
- **400 Bad Request**: Validation error
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: User lacks permission
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error

### Error Response Format

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Specific field error"
  }
}
```

### Frontend Error Handling

- Display toast notifications for errors
- Log errors to console in development
- Retry failed requests with exponential backoff
- Redirect to login on 401 errors
- Display user-friendly error messages

## Data Models

### Investment Model
```javascript
{
  investmentId: String,
  title: String,
  description: String,
  propertyId: String,
  status: Enum['active', 'completed', 'closed'],
  targetAmount: Number,
  currentAmount: Number,
  expectedReturn: Number,
  investmentType: String,
  minimumInvestment: Number,
  investorCount: Number,
  startDate: Date,
  endDate: Date,
  riskLevel: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Verification Application Model
```javascript
{
  applicationId: String,
  userId: String,
  verificationType: String,
  propertyId: String,
  status: Enum['pending_review', 'approved', 'rejected'],
  documents: Array,
  submittedAt: Date,
  reviewedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Notification Model
```javascript
{
  notificationId: String,
  userId: String,
  type: String,
  title: String,
  message: String,
  relatedEntity: Object,
  read: Boolean,
  actionUrl: String,
  createdAt: Date
}
```

### Favorite Model
```javascript
{
  favoriteId: String,
  userId: String,
  propertyId: String,
  savedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Acceptance Criteria

### Correctness Properties

1. **Invariant: Investment Funding Consistency**
   - FOR ALL investments, currentAmount <= targetAmount
   - FOR ALL investments, fundingPercentage = (currentAmount / targetAmount) * 100
   - Property: Funding percentage never exceeds 100%

2. **Round-Trip: Verification Application Submission**
   - WHEN a verification application is submitted with documents
   - THEN retrieving the application SHALL return the same documents
   - Property: Submit → Retrieve → Verify documents match

3. **Idempotence: Notification Retrieval**
   - WHEN notifications are retrieved multiple times without changes
   - THEN the response SHALL be identical
   - Property: GET /notifications called twice returns same data

4. **Metamorphic: Investment Filtering**
   - WHEN investments are filtered by status
   - THEN all returned investments SHALL have the specified status
   - Property: len(filtered_investments) <= len(all_investments)

5. **Error Condition: Invalid Investment Amount**
   - WHEN investment amount is below minimum
   - THEN backend SHALL return 400 error with specific message
   - Property: Invalid inputs properly rejected

6. **Invariant: User Authorization**
   - FOR ALL endpoints requiring authentication
   - THEN requests without valid JWT SHALL return 401
   - Property: Unauthorized access prevented

7. **Round-Trip: Profile Update**
   - WHEN user profile is updated
   - THEN retrieving the profile SHALL return updated values
   - Property: Update → Retrieve → Verify changes persisted

8. **Idempotence: Chat Initiation**
   - WHEN chat is initiated between same users multiple times
   - THEN only one active chat SHALL exist
   - Property: Duplicate chat creation prevented

9. **Invariant: Favorite Uniqueness**
   - FOR ALL users, each property can be favorited at most once
   - WHEN a user favorites a property already in their favorites
   - THEN the backend SHALL return a 409 Conflict error
   - Property: No duplicate favorites allowed

10. **Round-Trip: Favorite Persistence**
   - WHEN a user saves a property as favorite
   - THEN retrieving the user's favorites SHALL include that property
   - Property: Save → Retrieve → Verify property in list

