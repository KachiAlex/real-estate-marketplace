# Frontend-Backend Integration API Documentation

## Overview
Complete API reference for the frontend-backend integration system, including authentication, property management, investments, inquiries, favorites, and notifications.

## Base URL
```
Production: https://api.example.com
Development: http://localhost:5000
```

## Authentication
All endpoints (except auth endpoints) require JWT token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## Authentication Endpoints

### Register User
**POST** `/api/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "role": "investor" | "vendor"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "role": "investor"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Error Responses:**
- 400: Invalid email format or weak password
- 409: Email already registered

---

### Login
**POST** `/api/auth/login`

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "role": "investor"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Error Responses:**
- 400: Invalid credentials
- 401: Unauthorized

---

### Forgot Password
**POST** `/api/auth/forgot-password`

Request password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "Password reset email sent"
}
```

---

### Reset Password
**POST** `/api/auth/reset-password`

Reset password using token from email.

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewPassword123!"
}
```

**Response (200):**
```json
{
  "message": "Password reset successfully"
}
```

---

### Update Profile
**PUT** `/api/auth/jwt/update-profile`

Update user profile information.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "newemail@example.com",
  "phone": "+1234567890"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "user-123",
    "firstName": "John",
    "lastName": "Doe",
    "email": "newemail@example.com"
  }
}
```

**Error Responses:**
- 400: Invalid email format
- 409: Email already in use

---

## Upload Endpoints

### Upload Avatar
**POST** `/upload/user/avatar`

Upload user profile avatar.

**Request:**
- Content-Type: multipart/form-data
- File field: `avatar`
- Accepted formats: JPEG, PNG, WebP
- Max size: 5MB

**Response (200):**
```json
{
  "url": "https://storage.example.com/avatars/user-123.jpg"
}
```

**Error Responses:**
- 400: Invalid file type or size exceeds 5MB
- 413: Payload too large

---

## Property Endpoints

### Create Property
**POST** `/api/properties`

Create a new property listing.

**Request Body:**
```json
{
  "title": "Modern Apartment",
  "description": "Beautiful 2-bedroom apartment",
  "location": "Downtown",
  "price": 250000,
  "propertyType": "Apartment",
  "bedrooms": 2,
  "bathrooms": 1,
  "squareFeet": 1200,
  "amenities": ["Pool", "Gym", "Parking"]
}
```

**Response (201):**
```json
{
  "property": {
    "id": "prop-123",
    "title": "Modern Apartment",
    "status": "draft",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- 400: Missing required fields
- 401: Unauthorized

---

### Get Properties
**GET** `/api/properties`

Retrieve all properties with pagination and filtering.

**Query Parameters:**
- `limit` (number): Items per page (default: 10)
- `offset` (number): Pagination offset (default: 0)
- `status` (string): Filter by status (draft, published, sold)
- `propertyType` (string): Filter by type
- `minPrice` (number): Minimum price filter
- `maxPrice` (number): Maximum price filter
- `sort` (string): Sort field (price, createdAt)
- `order` (string): Sort order (asc, desc)

**Response (200):**
```json
{
  "properties": [
    {
      "id": "prop-123",
      "title": "Modern Apartment",
      "price": 250000,
      "location": "Downtown",
      "propertyType": "Apartment"
    }
  ],
  "total": 45,
  "limit": 10,
  "offset": 0
}
```

---

### Get Property Details
**GET** `/api/properties/{propertyId}`

Retrieve detailed information about a specific property.

**Response (200):**
```json
{
  "property": {
    "id": "prop-123",
    "title": "Modern Apartment",
    "description": "Beautiful 2-bedroom apartment",
    "price": 250000,
    "location": "Downtown",
    "propertyType": "Apartment",
    "bedrooms": 2,
    "bathrooms": 1,
    "squareFeet": 1200,
    "amenities": ["Pool", "Gym"],
    "images": ["url1", "url2"],
    "vendor": {
      "id": "vendor-123",
      "name": "John Vendor"
    }
  }
}
```

**Error Responses:**
- 404: Property not found

---

### Update Property
**PUT** `/api/properties/{propertyId}`

Update property details.

**Request Body:**
```json
{
  "title": "Updated Title",
  "price": 275000,
  "bedrooms": 3
}
```

**Response (200):**
```json
{
  "property": {
    "id": "prop-123",
    "title": "Updated Title",
    "price": 275000
  }
}
```

**Error Responses:**
- 403: Not property owner
- 404: Property not found

---

### Delete Property
**DELETE** `/api/properties/{propertyId}`

Delete a property listing.

**Response (200):**
```json
{
  "message": "Property deleted successfully"
}
```

**Error Responses:**
- 403: Not property owner
- 404: Property not found

---

## Investment Endpoints

### Get Investments
**GET** `/api/investments`

Retrieve investment opportunities.

**Query Parameters:**
- `limit` (number): Items per page
- `offset` (number): Pagination offset
- `status` (string): Filter by status
- `sort` (string): Sort field
- `order` (string): Sort order

**Response (200):**
```json
{
  "investments": [
    {
      "id": "inv-123",
      "title": "Downtown Development",
      "expectedReturn": 12.5,
      "targetAmount": 500000,
      "raisedAmount": 350000,
      "status": "active"
    }
  ],
  "total": 20
}
```

---

### Get Investment Details
**GET** `/api/investments/{investmentId}`

Retrieve detailed investment information.

**Response (200):**
```json
{
  "investment": {
    "id": "inv-123",
    "title": "Downtown Development",
    "description": "Mixed-use development project",
    "expectedReturn": 12.5,
    "targetAmount": 500000,
    "raisedAmount": 350000,
    "investors": [
      {
        "id": "user-123",
        "name": "John Investor",
        "amount": 50000
      }
    ],
    "timeline": [
      {
        "date": "2024-06-01",
        "milestone": "Construction begins"
      }
    ]
  }
}
```

---

### Create Investment
**POST** `/api/investments/{investmentId}/invest`

Invest in an opportunity.

**Request Body:**
```json
{
  "amount": 50000,
  "paymentMethod": "credit_card"
}
```

**Response (201):**
```json
{
  "investment": {
    "id": "inv-rec-123",
    "investmentId": "inv-123",
    "amount": 50000,
    "status": "pending_payment"
  }
}
```

**Error Responses:**
- 400: Amount below minimum
- 404: Investment not found

---

## Inquiry Endpoints

### Create Inquiry
**POST** `/inquiries`

Create a property inquiry.

**Request Body:**
```json
{
  "propertyId": "prop-123",
  "message": "Interested in this property"
}
```

**Response (201):**
```json
{
  "inquiry": {
    "id": "inq-123",
    "propertyId": "prop-123",
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### Get Inquiries
**GET** `/inquiries`

Retrieve user inquiries.

**Query Parameters:**
- `limit` (number): Items per page
- `offset` (number): Pagination offset
- `status` (string): Filter by status

**Response (200):**
```json
{
  "inquiries": [
    {
      "id": "inq-123",
      "propertyId": "prop-123",
      "status": "pending",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 5
}
```

---

### Get Inquiry Details
**GET** `/inquiries/{inquiryId}`

Retrieve inquiry details with conversation history.

**Response (200):**
```json
{
  "inquiry": {
    "id": "inq-123",
    "propertyId": "prop-123",
    "status": "pending",
    "messages": [
      {
        "sender": "user-123",
        "message": "Interested in this property",
        "timestamp": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

---

### Update Inquiry
**PUT** `/inquiries/{inquiryId}`

Update inquiry status or add message.

**Request Body:**
```json
{
  "status": "responded",
  "message": "Updated message"
}
```

**Response (200):**
```json
{
  "inquiry": {
    "id": "inq-123",
    "status": "responded"
  }
}
```

---

### Delete Inquiry
**DELETE** `/inquiries/{inquiryId}`

Delete an inquiry.

**Response (200):**
```json
{
  "message": "Inquiry deleted successfully"
}
```

**Error Responses:**
- 403: Not inquiry owner
- 404: Inquiry not found

---

## Favorites Endpoints

### Save Property as Favorite
**POST** `/api/favorites/{propertyId}`

Save a property to favorites.

**Response (201):**
```json
{
  "favorite": {
    "id": "fav-123",
    "propertyId": "prop-123",
    "savedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- 404: Property not found
- 409: Already favorited

---

### Get Favorites
**GET** `/api/favorites`

Retrieve user's favorite properties.

**Query Parameters:**
- `limit` (number): Items per page
- `offset` (number): Pagination offset
- `propertyType` (string): Filter by type
- `minPrice` (number): Minimum price
- `maxPrice` (number): Maximum price
- `sort` (string): Sort field (price, savedAt)
- `order` (string): Sort order

**Response (200):**
```json
{
  "favorites": [
    {
      "id": "fav-123",
      "propertyId": "prop-123",
      "property": {
        "title": "Modern Apartment",
        "price": 250000,
        "location": "Downtown"
      },
      "savedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 12
}
```

---

### Remove Favorite
**DELETE** `/api/favorites/{propertyId}`

Remove property from favorites.

**Response (200):**
```json
{
  "message": "Removed from favorites"
}
```

**Error Responses:**
- 403: Not favorite owner
- 404: Favorite not found

---

## Notification Endpoints

### Get Notifications
**GET** `/notifications`

Retrieve user notifications.

**Query Parameters:**
- `limit` (number): Items per page
- `offset` (number): Pagination offset
- `unread` (boolean): Filter unread only

**Response (200):**
```json
{
  "notifications": [
    {
      "id": "notif-123",
      "type": "inquiry",
      "message": "New inquiry on your property",
      "read": false,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "unreadCount": 3
}
```

---

## Verification Endpoints

### Get Verification Config
**GET** `/verification/config`

Retrieve verification types and requirements.

**Response (200):**
```json
{
  "verificationTypes": [
    {
      "type": "identity",
      "name": "Identity Verification",
      "documents": ["passport", "driver_license"],
      "fee": 50
    }
  ]
}
```

---

### Submit Verification Application
**POST** `/verification/applications`

Submit verification documents.

**Request Body:**
```json
{
  "verificationType": "identity",
  "documents": ["document-url-1", "document-url-2"]
}
```

**Response (201):**
```json
{
  "application": {
    "id": "app-123",
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 500 | Server Error | Internal server error |

---

## Rate Limiting

API requests are rate-limited to 100 requests per minute per user.

Response headers include:
- `X-RateLimit-Limit`: 100
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset timestamp

---

## Pagination

All list endpoints support pagination with:
- `limit`: Number of items per page (default: 10, max: 100)
- `offset`: Number of items to skip (default: 0)

Response includes:
- `total`: Total number of items
- `limit`: Items per page
- `offset`: Current offset
