# Frontend-Backend Integration Analysis

## Executive Summary
This document outlines every button, link, and user interaction in the PropertyArk frontend, their corresponding backend endpoints, and integration status.

---

## 1. AUTHENTICATION FLOWS

### 1.1 Sign In Modal
| Element | Action | Endpoint | Status | Notes |
|---------|--------|----------|--------|-------|
| Sign In Button | Submit email/password | `POST /api/auth/login` | ✅ WORKING | Returns user object with roles |
| Forgot Password Link | Navigate | `/auth/forgot-password` | ✅ WORKING | Frontend route |
| Create Account Link | Navigate | `/auth/register` | ✅ WORKING | Opens RegisterModal |
| Google Sign In | OAuth flow | `POST /api/auth/google` | ⚠️ COMMENTED OUT | Not currently enabled |
| Close Button (X) | Close modal | N/A | ✅ WORKING | Frontend only |

### 1.2 Register Modal
| Element | Action | Endpoint | Status | Notes |
|---------|--------|----------|--------|-------|
| Register Form Submit | Create account | `POST /api/auth/register` | ✅ WORKING | Creates new user with roles |
| Close Button | Close modal | N/A | ✅ WORKING | Frontend only |

### 1.3 Auth Context Functions
| Function | Endpoint | Status | Notes |
|----------|----------|--------|-------|
| `login()` | `POST /api/auth/login` | ✅ WORKING | Stores access + refresh tokens |
| `logout()` | `POST /api/auth/jwt/logout` | ✅ WORKING | Clears session |
| `refreshAccessToken()` | `POST /api/auth/jwt/refresh` | ✅ WORKING | Gets new access token |
| `refreshCurrentUser()` | `GET /api/auth/me` | ✅ WORKING | Fetches current user profile |
| `switchRole()` | `POST /api/users/switch-role` | ✅ WORKING | Changes user role (buyer/vendor) |
| `updateUserProfile()` | `PUT /api/auth/jwt/update-profile` | ⚠️ NEEDS ENDPOINT | Not yet implemented |

---

## 2. PROPERTY BROWSING & FILTERING

### 2.1 Home Page Filters
| Filter | Type | Endpoint | Status | Notes |
|--------|------|----------|--------|-------|
| Location Dropdown | Select | N/A | ✅ WORKING | Client-side filtering |
| Property Status | Select | N/A | ✅ WORKING | For Sale, For Rent, For Lease, Shortlet |
| Property Type | Select | N/A | ✅ WORKING | Apartment, House, Villa, etc. |
| Price Range Slider | Range | N/A | ✅ WORKING | Min/Max price inputs |
| Bedrooms/Bathrooms | Select | N/A | ✅ WORKING | Dropdown selectors |
| Amenities Checkboxes | Multi-select | N/A | ✅ WORKING | Swimming Pool, Gym, Security, etc. |
| Property Age | Select | N/A | ✅ WORKING | Any Age, 0-5 yrs, 5-10 yrs |
| Vendor Search | Text input | N/A | ✅ WORKING | Vendor name/code search |
| Apply Filters Button | Submit | N/A | ✅ WORKING | Updates filtered properties |
| Reset All Filters Button | Reset | N/A | ✅ WORKING | Clears all filters |
| Show More Amenities | Expand | N/A | ✅ WORKING | Expands amenities list |

### 2.2 Property Card Actions
| Element | Action | Endpoint | Status | Notes |
|---------|--------|----------|--------|-------|
| Share Button | Share | Web Share API | ✅ WORKING | Copies link or uses native share |
| Favorite/Heart Button | Save | `localStorage` | ✅ WORKING | Requires login, saves to `favorites_{userId}` |
| Schedule Viewing Button | Open modal | N/A | ✅ WORKING | Opens viewing request form |
| View Details Link | Navigate | `/property/{propertyId}` | ✅ WORKING | Goes to property detail page |

### 2.3 Pagination
| Element | Action | Endpoint | Status | Notes |
|---------|--------|----------|--------|-------|
| Previous Button | Navigate | N/A | ✅ WORKING | Goes to previous page |
| Next Button | Navigate | N/A | ✅ WORKING | Goes to next page |
| Page Number Buttons | Jump | N/A | ✅ WORKING | Jump to specific page |
| First/Last Page Buttons | Jump | N/A | ✅ WORKING | Jump to first/last page |

### 2.4 Properties Page
| Element | Action | Endpoint | Status | Notes |
|---------|--------|----------|--------|-------|
| Sort Dropdown | Sort | N/A | ✅ WORKING | Most Recent, Price Low/High, Popular |
| Save Search Button | Save | `localStorage` | ⚠️ PARTIAL | Saves locally, no backend sync |
| Clear Filters Button | Reset | N/A | ✅ WORKING | Resets all filters |

---

## 3. PROPERTY DETAILS & PURCHASE

### 3.1 Property Detail Page
| Element | Action | Endpoint | Status | Notes |
|---------|--------|----------|--------|-------|
| Buy with Escrow Button | Open modal | N/A | ✅ WORKING | Opens EscrowPaymentFlow |
| Schedule Viewing Button | Open modal | N/A | ✅ WORKING | Opens viewing request form |
| Share Property Button | Share | Web Share API | ✅ WORKING | Shares property link |
| Add to Favorites Button | Save | `localStorage` | ✅ WORKING | Requires login |

### 3.2 Escrow Payment Flow
| Step | Element | Action | Endpoint | Status | Notes |
|------|---------|--------|----------|--------|-------|
| 1 | Proceed to Payment | Advance step | N/A | ✅ WORKING | Goes to payment details |
| 2 | Payment Method Select | Select | N/A | ✅ WORKING | Paystack or Card |
| 2 | Process Payment Button | Initialize | `POST /payments/initialize` | ⚠️ NEEDS ENDPOINT | Not yet implemented |
| 2 | Paystack Checkout | Pay | Paystack API | ⚠️ NEEDS SETUP | Requires Paystack integration |
| 3 | Verify Payment Button | Verify | `POST /payments/{paymentId}/verify` | ⚠️ NEEDS ENDPOINT | Not yet implemented |
| 3 | Back Button | Previous step | N/A | ✅ WORKING | Returns to previous step |

**Escrow Transaction Storage:**
- Stored in `localStorage` under `escrowTransactions`
- Structure: `{ id, propertyId, buyerId, sellerId, amount, status, payment, fundedAt }`

---

## 4. DASHBOARD & USER PROFILE

### 4.1 Dashboard Stats Cards
| Card | Action | Endpoint | Status | Notes |
|------|--------|----------|--------|-------|
| Saved Properties | Navigate | `/saved-properties` | ✅ WORKING | Shows favorite properties |
| Active Inquiries | Navigate | `/my-inquiries` | ✅ WORKING | Shows user inquiries |
| Scheduled Viewings | Navigate | `/my-inspections` | ✅ WORKING | Shows viewing requests |
| Total Invested | Navigate | `/billing-payments` | ✅ WORKING | Shows investment summary |
| Active Investments | Navigate | `/investment` | ✅ WORKING | Shows active investments |
| Escrow Transactions | Navigate | `/billing-payments` | ✅ WORKING | Shows escrow status |
| Monthly Budget | Navigate | `/billing-payments` | ✅ WORKING | Shows budget info |

### 4.2 Dashboard Quick Actions
| Element | Action | Endpoint | Status | Notes |
|---------|--------|----------|--------|-------|
| Add Property Button | Navigate | `/add-property` | ✅ WORKING | Vendor only |
| View All Properties Button | Navigate | `/properties` | ✅ WORKING | Goes to properties page |
| Schedule Viewing Button | Open modal | N/A | ✅ WORKING | Opens viewing request form |

### 4.3 Profile Page
| Element | Action | Endpoint | Status | Notes |
|---------|--------|----------|--------|-------|
| Edit Profile Button | Enable edit | N/A | ✅ WORKING | Enables form fields |
| Save Profile Button | Submit | `PUT /api/auth/jwt/update-profile` | ⚠️ NEEDS ENDPOINT | Not yet implemented |
| Avatar Upload | Upload | `POST /upload/user/avatar` | ⚠️ NEEDS ENDPOINT | Not yet implemented |
| Cancel Edit Button | Revert | N/A | ✅ WORKING | Cancels edit mode |
| Become a Vendor Button | Open modal | N/A | ✅ WORKING | Opens vendor signup modal |

---

## 5. VENDOR DASHBOARD

### 5.1 Vendor Dashboard Navigation
| Element | Action | Endpoint | Status | Notes |
|---------|--------|----------|--------|-------|
| Overview Tab | Switch | N/A | ✅ WORKING | Shows vendor stats |
| Subscription Tab | Switch | N/A | ✅ WORKING | Shows subscription status |
| Dashboard Switch | Toggle | `POST /api/users/switch-role` | ✅ WORKING | Switches to buyer dashboard |

### 5.2 Vendor Dashboard Buttons
| Element | Action | Endpoint | Status | Notes |
|---------|--------|----------|--------|-------|
| Add Property Button | Navigate | `/add-property` | ✅ WORKING | Creates new property |
| View Property Button | Navigate | `/property/{propertyId}` | ✅ WORKING | Views property details |
| Edit Property Button | Navigate | `/edit-property/{propertyId}` | ⚠️ NEEDS ENDPOINT | Not yet implemented |
| Delete Property Button | Delete | `DELETE /api/properties/{propertyId}` | ⚠️ NEEDS ENDPOINT | Not yet implemented |

### 5.3 Vendor Data Fetching
| Function | Endpoint | Status | Notes |
|----------|----------|--------|-------|
| Fetch vendor properties | `GET /api/properties` | ✅ WORKING | Gets all properties |
| Get property details | `GET /api/properties/{propertyId}` | ✅ WORKING | Gets single property |
| Get verification apps | `GET /verification/applications/mine` | ⚠️ NEEDS ENDPOINT | Not yet implemented |

---

## 6. VENDOR PROFILE & ONBOARDING

### 6.1 Vendor Status Card
| Element | Action | Endpoint | Status | Notes |
|---------|--------|----------|--------|-------|
| Upload KYC Documents | Upload | `POST /upload/vendor/kyc` | ✅ WORKING | Uploads KYC files |
| View KYC Status | Display | N/A | ✅ WORKING | Shows verification status |

### 6.2 Become Vendor Modal
| Element | Action | Endpoint | Status | Notes |
|---------|--------|----------|--------|-------|
| Submit Vendor Application | Submit | `POST /api/users/switch-role` | ✅ WORKING | Changes role to vendor |
| Close Modal Button | Close | N/A | ✅ WORKING | Closes modal |

---

## 7. PAYMENT & BILLING

### 7.1 Payment Initialization
| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/payments/initialize` | POST | ⚠️ NEEDS ENDPOINT | Not yet implemented |
| `/payments/{paymentId}/verify` | POST | ⚠️ NEEDS ENDPOINT | Not yet implemented |

**Expected Request Body for `/payments/initialize`:**
```json
{
  "amount": 50000000,
  "paymentMethod": "paystack",
  "paymentType": "escrow",
  "relatedEntity": {
    "type": "property|investment",
    "id": "escrowId",
    "metadata": { "escrowId", "propertyId", "investmentId" }
  },
  "description": "Escrow payment for property purchase",
  "currency": "NGN"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "payment": { "id": "paymentId", "reference": "txRef" },
    "providerData": { "txRef": "txRef", "checkoutUrl": "..." }
  }
}
```

---

## 8. ESCROW TRANSACTIONS

### 8.1 Escrow Context Functions
| Function | Endpoint | Status | Notes |
|----------|----------|--------|-------|
| `createEscrowTransaction()` | N/A | ✅ WORKING | Creates transaction in localStorage |
| Mark transaction funded | N/A | ✅ WORKING | Updates status to `payment_received` |
| Get escrow transactions | N/A | ✅ WORKING | Reads from localStorage |

**Transaction Structure:**
```json
{
  "id": "escrow-{timestamp}",
  "propertyId": "propertyId",
  "buyerId": "userId",
  "sellerId": "vendorId",
  "amount": 50000000,
  "status": "pending|payment_received|completed|disputed|cancelled",
  "payment": {
    "method": "paystack|card",
    "reference": "txRef",
    "paidAt": "ISO timestamp"
  },
  "fundedAt": "ISO timestamp"
}
```

---

## 9. VIEWING REQUESTS & INSPECTIONS

### 9.1 Schedule Viewing Modal
| Element | Action | Endpoint | Status | Notes |
|---------|--------|----------|--------|-------|
| Preferred Date Picker | Select | N/A | ✅ WORKING | Date input |
| Preferred Time Picker | Select | N/A | ✅ WORKING | Time input |
| Message Text Area | Input | N/A | ✅ WORKING | Optional message |
| Submit Button | Create | `localStorage` | ✅ WORKING | Stores in `viewingRequests` |
| Cancel Button | Close | N/A | ✅ WORKING | Closes modal |

**Viewing Request Structure:**
```json
{
  "id": "viewing-{timestamp}",
  "propertyId": "propertyId",
  "propertyTitle": "Property Title",
  "userId": "buyerId",
  "userName": "First Last",
  "userEmail": "user@email.com",
  "status": "pending_vendor_confirmation|accepted|confirmed|completed|declined",
  "requestedAt": "ISO timestamp",
  "preferredDate": "YYYY-MM-DD",
  "preferredTime": "HH:MM",
  "message": "Optional message"
}
```

---

## 10. NOTIFICATIONS & MESSAGING

### 10.1 Notification Dropdown
| Element | Action | Endpoint | Status | Notes |
|---------|--------|----------|--------|-------|
| Fetch Notifications | Get | `GET /notifications?{params}` | ⚠️ NEEDS ENDPOINT | Not yet implemented |
| Start Chat Button | Create | `POST /chats/start` | ⚠️ NEEDS ENDPOINT | Not yet implemented |
| Submit Rating Button | Submit | `POST /ratings` | ⚠️ NEEDS ENDPOINT | Not yet implemented |

---

## 11. PROPERTY VERIFICATION

### 11.1 Property Verification Component
| Element | Action | Endpoint | Status | Notes |
|---------|--------|----------|--------|-------|
| Get Verification Config | Fetch | `GET /verification/config` | ⚠️ NEEDS ENDPOINT | Not yet implemented |
| Submit for Verification | Submit | `POST /verification/applications` | ⚠️ NEEDS ENDPOINT | Not yet implemented |
| Initialize Verification Payment | Pay | `POST /payments/initialize` | ⚠️ NEEDS ENDPOINT | Not yet implemented |
| Verify Payment | Verify | `POST /payments/{paymentId}/verify` | ⚠️ NEEDS ENDPOINT | Not yet implemented |

---

## 12. INVESTMENT OPPORTUNITIES

### 12.1 Investment Dashboard
| Element | Action | Endpoint | Status | Notes |
|---------|--------|----------|--------|-------|
| Invest Now Button | Open modal | N/A | ✅ WORKING | Opens EscrowPaymentFlow |
| View Details Link | Navigate | `/investment/{investmentId}` | ✅ WORKING | Goes to investment details |
| Fetch Investments | Get | `GET /investments` | ⚠️ NEEDS ENDPOINT | Not yet implemented |
| Get Investment Details | Get | `GET /investments/{investmentId}` | ⚠️ NEEDS ENDPOINT | Not yet implemented |
| Create Investment | Create | `POST /investments/{investmentId}/invest` | ⚠️ NEEDS ENDPOINT | Not yet implemented |

---

## 13. NAVIGATION FLOWS

### 13.1 Key Routes
| Route | Component | Status | Notes |
|-------|-----------|--------|-------|
| `/` | Home | ✅ WORKING | Property listing and filtering |
| `/auth/login` | SignInModal | ✅ WORKING | Login page |
| `/auth/register` | RegisterModal | ✅ WORKING | Registration page |
| `/auth/forgot-password` | ForgotPasswordPage | ⚠️ NEEDS IMPLEMENTATION | Password reset |
| `/properties` | Properties | ✅ WORKING | Properties listing |
| `/property/{propertyId}` | PropertyDetail | ✅ WORKING | Property details |
| `/dashboard` | Dashboard | ✅ WORKING | User dashboard |
| `/vendor/dashboard` | VendorDashboard | ✅ WORKING | Vendor dashboard |
| `/profile` | Profile | ✅ WORKING | User profile |
| `/saved-properties` | SavedProperties | ✅ WORKING | Favorite properties |
| `/my-inquiries` | MyInquiries | ⚠️ NEEDS IMPLEMENTATION | User inquiries |
| `/my-inspections` | MyInspections | ✅ WORKING | Viewing requests |
| `/investment` | Investment | ⚠️ NEEDS IMPLEMENTATION | Investment opportunities |
| `/escrow` | Escrow | ⚠️ NEEDS IMPLEMENTATION | Escrow transactions |
| `/add-property` | AddProperty | ⚠️ NEEDS IMPLEMENTATION | Add new property |
| `/billing-payments` | BillingPayments | ⚠️ NEEDS IMPLEMENTATION | Billing and payments |

---

## 14. DATA PERSISTENCE

### 14.1 localStorage Keys
| Key | Purpose | Status | Notes |
|-----|---------|--------|-------|
| `accessToken` / `token` | Auth token | ✅ WORKING | Used for API requests |
| `refreshToken` | Refresh token | ✅ WORKING | Used to get new access token |
| `currentUser` | Current user object | ✅ WORKING | User profile data |
| `favorites_{userId}` | Favorite property IDs | ✅ WORKING | Array of property IDs |
| `viewingRequests` | Viewing request objects | ✅ WORKING | Array of viewing requests |
| `inquiries` | Inquiry objects | ✅ WORKING | Array of inquiries |
| `escrowTransactions` | Escrow transaction objects | ✅ WORKING | Array of escrow transactions |
| `escrowPayments` | Payment entries | ✅ WORKING | Array of payment entries |
| `userInvestments_{userId}` | User investments | ✅ WORKING | Array of investments |

### 14.2 Custom Events
| Event | Fired When | Status | Notes |
|-------|-----------|--------|-------|
| `favoritesUpdated` | Favorites change | ✅ WORKING | Notifies listeners |
| `viewingsUpdated` | Viewing requests change | ✅ WORKING | Notifies listeners |
| `inquiriesUpdated` | Inquiries change | ✅ WORKING | Notifies listeners |
| `investmentsUpdated` | Investments change | ✅ WORKING | Notifies listeners |
| `escrowUpdated` | Escrow transactions change | ✅ WORKING | Notifies listeners |

---

## 15. AUTHENTICATION HEADERS

### 15.1 API Request Headers
```
Authorization: Bearer {accessToken}
Content-Type: application/json
X-CSRF-Token: {csrfToken} (for state-changing requests)
```

### 15.2 CSRF Token Management
| Function | Endpoint | Status | Notes |
|----------|----------|--------|-------|
| Fetch CSRF Token | `GET /api/csrf-token` | ✅ WORKING | Called on app init |
| Store CSRF Token | N/A | ✅ WORKING | Stored in memory |
| Add to Requests | N/A | ✅ WORKING | Added to POST/PUT/DELETE/PATCH |

---

## 16. ERROR HANDLING

### 16.1 Toast Notifications
| Type | Message | Status | Notes |
|------|---------|--------|-------|
| Success | "Profile updated" | ✅ WORKING | Shows on success |
| Success | "Filters applied successfully!" | ✅ WORKING | Shows on filter apply |
| Success | "Payment verified!" | ✅ WORKING | Shows on payment success |
| Error | "Please login to save properties" | ✅ WORKING | Shows on auth required |
| Error | "Failed to apply filters" | ✅ WORKING | Shows on filter error |
| Error | "Payment verification failed" | ✅ WORKING | Shows on payment error |
| Info | "Escrow status updated to: {status}" | ✅ WORKING | Shows on status change |

### 16.2 401 Handling
| Action | Endpoint | Status | Notes |
|--------|----------|--------|-------|
| Automatic token refresh | `POST /api/auth/jwt/refresh` | ✅ WORKING | Retries with new token |
| Retry original request | N/A | ✅ WORKING | Uses new token |
| Clear tokens on failure | N/A | ✅ WORKING | Redirects to login |

---

## SUMMARY OF ISSUES

### ✅ WORKING (Fully Functional)
- Authentication (login, register, logout, token refresh)
- Property browsing and filtering
- Favorite properties
- Viewing requests
- Dashboard navigation
- Vendor dashboard
- Role switching
- CSRF token management
- Error handling and toast notifications

### ⚠️ NEEDS BACKEND ENDPOINTS
- Payment initialization (`POST /payments/initialize`)
- Payment verification (`POST /payments/{paymentId}/verify`)
- Profile update (`PUT /api/auth/jwt/update-profile`)
- Avatar upload (`POST /upload/user/avatar`)
- Property edit/delete (`PUT/DELETE /api/properties/{propertyId}`)
- Verification endpoints (`GET /verification/config`, `POST /verification/applications`)
- Investment endpoints (`GET /investments`, `POST /investments/{investmentId}/invest`)
- Notification endpoints (`GET /notifications`, `POST /chats/start`, `POST /ratings`)
- Inquiry endpoints (`GET /my-inquiries`, `POST /inquiries`)

### ⚠️ NEEDS IMPLEMENTATION
- Forgot password page
- My inquiries page
- Investment opportunities page
- Escrow transactions page
- Add property page
- Billing and payments page
- Edit property page
- Google OAuth integration

---

## RECOMMENDATIONS

1. **Priority 1 - Critical for MVP:**
   - Implement payment endpoints (`/payments/initialize`, `/payments/{paymentId}/verify`)
   - Implement property CRUD endpoints (`PUT/DELETE /api/properties`)
   - Implement profile update endpoint (`PUT /api/auth/jwt/update-profile`)

2. **Priority 2 - Important for UX:**
   - Implement verification endpoints
   - Implement investment endpoints
   - Implement notification endpoints

3. **Priority 3 - Nice to Have:**
   - Implement forgot password flow
   - Implement Google OAuth
   - Implement inquiry management

4. **Testing:**
   - Test all payment flows end-to-end
   - Test role switching and dashboard navigation
   - Test viewing request creation and management
   - Test favorite properties persistence

