# Mortgage Bank Architecture Proposal

## Overview
This document outlines an adaptable architecture for integrating mortgage banks into the PropertyArk platform, allowing buyers to apply for mortgages on any property without requiring vendors to mark properties as mortgage-eligible.

## Core Principles
1. **Non-Breaking Changes**: Existing mortgage functionality remains intact
2. **Backward Compatible**: Current mortgage applications continue to work
3. **Extensible**: Easy to add new features without refactoring
4. **Role-Based Access**: Clear separation between buyers, vendors, mortgage banks, and admins

---

## 1. Data Models

### 1.1 MortgageBank Model (New)
```javascript
{
  id: ObjectId,
  name: String,                    // Bank name (e.g., "First Bank Mortgage")
  registrationNumber: String,      // Corporate registration
  email: String,                   // Primary contact email
  phone: String,                   // Primary contact phone
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  contactPerson: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    position: String
  },
  documents: [{
    type: String,                  // 'license', 'registration', 'tax_certificate'
    url: String,
    uploadedAt: Date
  }],
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  verifiedBy: ObjectId,            // Admin user ID
  verifiedAt: Date,
  verificationNotes: String,
  isActive: Boolean,               // Only active banks can receive applications
  userAccount: ObjectId,           // Reference to User model (role: 'mortgage_bank')
  mortgageProducts: [{             // Bank's mortgage offerings
    name: String,                  // e.g., "Standard 20-Year Fixed"
    minLoanAmount: Number,
    maxLoanAmount: Number,
    minDownPaymentPercent: Number, // e.g., 20
    maxLoanTerm: Number,           // in years
    interestRate: Number,          // Annual percentage
    interestRateType: String,       // 'fixed', 'variable', 'adjustable'
    eligibilityCriteria: {
      minMonthlyIncome: Number,
      minCreditScore: Number,
      employmentDuration: Number    // months
    }
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### 1.2 MortgageApplication Model (Enhanced)
```javascript
{
  id: ObjectId,
  propertyId: ObjectId,           // Property being purchased
  buyerId: ObjectId,               // User applying for mortgage
  mortgageBankId: ObjectId,        // Bank handling the application (NEW)
  status: String,                  // 'pending', 'under_review', 'approved', 'rejected', 'withdrawn'
  requestedAmount: Number,          // Loan amount requested
  downPayment: Number,              // Down payment amount
  loanTerm: Number,                 // Years
  interestRate: Number,             // Annual percentage
  monthlyPayment: Number,           // Calculated monthly payment
  employmentDetails: {
    type: String,                  // 'employed', 'self-employed'
    employerName: String,
    jobTitle: String,
    monthlyIncome: Number,
    yearsOfEmployment: Number,
    businessName: String,
    businessType: String
  },
  documents: [{
    type: String,                  // 'bank_statement', 'employment_letter', 'tax_return'
    url: String,
    uploadedAt: Date
  }],
  bankReview: {                    // Bank's review (NEW)
    reviewedBy: ObjectId,          // Bank staff user ID
    reviewedAt: Date,
    notes: String,
    decision: String,              // 'approved', 'rejected', 'needs_more_info'
    conditions: [String]           // Any conditions for approval
  },
  adminReview: {                   // Admin oversight (NEW)
    reviewedBy: ObjectId,
    reviewedAt: Date,
    notes: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 1.3 User Model Enhancement
```javascript
// Add to existing User model
role: {
  type: String,
  enum: ['user', 'agent', 'admin', 'mortgage_bank', 'vendor'],  // Added 'mortgage_bank'
  default: 'user'
},
mortgageBankProfile: {            // Only for mortgage_bank role
  type: ObjectId,
  ref: 'MortgageBank'
}
```

---

## 2. Backend API Routes

### 2.1 Mortgage Bank Routes (`/api/mortgage-banks`)
```
POST   /api/mortgage-banks/register          - Register new mortgage bank
GET    /api/mortgage-banks                    - List all banks (public: active only, admin: all)
GET    /api/mortgage-banks/:id                - Get bank details
PUT    /api/mortgage-banks/:id                - Update bank profile (bank only)
GET    /api/mortgage-banks/:id/products       - Get bank's mortgage products
POST   /api/mortgage-banks/:id/products       - Add mortgage product (bank only)
PUT    /api/mortgage-banks/:id/products/:pid  - Update product (bank only)
DELETE /api/mortgage-banks/:id/products/:pid  - Delete product (bank only)
```

### 2.2 Mortgage Application Routes (Enhanced)
```
POST   /api/mortgages/apply                   - Apply for mortgage (buyer)
GET    /api/mortgages                         - List applications (buyer: own, bank: assigned, admin: all)
GET    /api/mortgages/:id                     - Get application details
PUT    /api/mortgages/:id/review              - Review application (bank only)
PUT    /api/mortgages/:id/approve             - Approve application (bank only)
PUT    /api/mortgages/:id/reject              - Reject application (bank only)
PUT    /api/mortgages/:id/request-info        - Request more information (bank only)
POST   /api/mortgages/:id/documents          - Upload additional documents (buyer)
```

### 2.3 Admin Routes (Enhanced)
```
GET    /api/admin/mortgage-banks              - List all banks (pending verification)
PUT    /api/admin/mortgage-banks/:id/verify   - Verify/reject bank
GET    /api/admin/mortgage-applications       - View all applications
```

---

## 3. Frontend Components

### 3.1 Mortgage Bank Registration
**File**: `src/pages/MortgageBankRegister.js`
- Registration form for mortgage banks
- Document upload (license, registration, etc.)
- Submit for admin verification
- Status tracking (pending/approved/rejected)

### 3.2 Mortgage Bank Dashboard
**File**: `src/pages/MortgageBankDashboard.js`
- View pending applications
- Review applications (approve/reject/request info)
- Manage mortgage products
- View application statistics
- Bank profile management

### 3.3 Enhanced Mortgage Application Flow
**File**: `src/pages/Mortgage.js` (Enhanced)
- Remove property eligibility filter
- Add bank selection step
- Show available banks and their products
- Buyer selects preferred bank
- Application submitted to selected bank

### 3.4 Mortgage Application Review (Bank)
**File**: `src/components/MortgageApplicationReview.js`
- View application details
- Review documents
- Approve/reject/request more info
- Set loan terms
- Add review notes

### 3.5 Admin Mortgage Bank Verification
**File**: `src/components/AdminMortgageBankVerification.js`
- List pending bank registrations
- Review bank documents
- Approve/reject banks
- View bank details

---

## 4. Integration Points

### 4.1 Property Purchase Flow
**Current**: Buyer → Select Property → Apply Mortgage (if eligible)
**New**: Buyer → Select Property → Choose Bank → Apply Mortgage

**Changes Required**:
- Remove `mortgageAvailable` or `eligibleForMortgage` checks from Property model
- Add "Apply for Mortgage" button to all properties
- Show bank selection modal when applying

### 4.2 Property Detail Page
**File**: `src/pages/PropertyDetail.js`
- Add "Apply for Mortgage" button (always visible)
- Remove conditional rendering based on mortgage eligibility
- Show available banks when button clicked

### 4.3 Mortgage Context Enhancement
**File**: `src/contexts/MortgageContext.js`
- Add `getMortgageBanks()` function
- Add `getBankProducts(bankId)` function
- Add `applyForMortgage(propertyId, bankId, applicationData)` function
- Keep existing functions for backward compatibility

---

## 5. Migration Strategy

### Phase 1: Add Mortgage Bank Infrastructure (Non-Breaking)
1. Create `MortgageBank` model
2. Add `mortgage_bank` role to User model
3. Create bank registration API
4. Create bank dashboard (frontend)
5. Admin verification interface

### Phase 2: Enhance Mortgage Application (Backward Compatible)
1. Add `mortgageBankId` to MortgageApplication (optional initially)
2. Create bank selection UI
3. Update application submission to include bank selection
4. Keep existing flow working (default to system if no bank selected)

### Phase 3: Remove Property Eligibility Requirement
1. Remove mortgage eligibility checks from property listing
2. Update UI to show "Apply for Mortgage" on all properties
3. Remove `mortgageDetails` from Property model (or make optional)
4. Update property creation form to remove mortgage fields

### Phase 4: Bank Review System
1. Create bank review interface
2. Add bank review workflow
3. Notifications for application status updates
4. Admin oversight dashboard

---

## 6. Database Schema Changes

### 6.1 New Collections
- `mortgagebanks` - Mortgage bank profiles

### 6.2 Modified Collections
- `users` - Add `mortgage_bank` role, `mortgageBankProfile` field
- `mortgageapplications` - Add `mortgageBankId`, `bankReview`, `adminReview` fields
- `properties` - Make `mortgageDetails` optional (deprecated but kept for backward compatibility)

---

## 7. Authentication & Authorization

### 7.1 New Roles
- `mortgage_bank`: Can review applications, manage products, view assigned applications

### 7.2 Permission Matrix
| Action | Buyer | Vendor | Mortgage Bank | Admin |
|--------|-------|--------|---------------|-------|
| Register as bank | ❌ | ❌ | ❌ | ❌ |
| View own applications | ✅ | ❌ | ❌ | ✅ |
| Apply for mortgage | ✅ | ❌ | ❌ | ❌ |
| Review applications | ❌ | ❌ | ✅ (assigned) | ✅ |
| Verify banks | ❌ | ❌ | ❌ | ✅ |
| Manage bank products | ❌ | ❌ | ✅ (own) | ✅ |

---

## 8. Workflow Diagrams

### 8.1 Bank Registration Flow
```
Mortgage Bank → Register → Upload Documents → Submit
    ↓
Admin Reviews → Approve/Reject
    ↓
If Approved: Bank Account Activated → Can Receive Applications
```

### 8.2 Mortgage Application Flow
```
Buyer → Select Property → Click "Apply for Mortgage"
    ↓
Select Mortgage Bank → Choose Product → Fill Application
    ↓
Upload Documents → Submit Application
    ↓
Bank Reviews → Approve/Reject/Request Info
    ↓
If Approved: Create Mortgage → Buyer Makes Payments
```

---

## 9. API Endpoints Detail

### 9.1 Register Mortgage Bank
```javascript
POST /api/mortgage-banks/register
Body: {
  name: String,
  registrationNumber: String,
  email: String,
  phone: String,
  address: Object,
  contactPerson: Object,
  documents: Array,
  userAccount: {        // Creates user account
    firstName: String,
    lastName: String,
    email: String,
    password: String
  }
}
Response: {
  success: Boolean,
  bank: MortgageBank,
  user: User
}
```

### 9.2 Apply for Mortgage
```javascript
POST /api/mortgages/apply
Body: {
  propertyId: ObjectId,
  mortgageBankId: ObjectId,      // NEW: Selected bank
  productId: ObjectId,            // NEW: Selected product
  requestedAmount: Number,
  downPayment: Number,
  employmentDetails: Object,
  documents: Array
}
Response: {
  success: Boolean,
  application: MortgageApplication
}
```

### 9.3 Bank Review Application
```javascript
PUT /api/mortgages/:id/review
Body: {
  decision: 'approved' | 'rejected' | 'needs_more_info',
  notes: String,
  conditions: Array,              // If approved with conditions
  loanTerms: {                    // If approved
    approvedAmount: Number,
    interestRate: Number,
    loanTerm: Number,
    monthlyPayment: Number
  }
}
```

---

## 10. Frontend Route Structure

### 10.1 New Routes
```
/mortgage-bank/register          - Bank registration
/mortgage-bank/dashboard         - Bank dashboard (protected)
/mortgage-bank/applications      - View applications
/mortgage-bank/products          - Manage products
/mortgage-bank/profile           - Bank profile
```

### 10.2 Enhanced Routes
```
/mortgage                        - Show all properties (remove eligibility filter)
/mortgage/apply/:propertyId      - Apply for mortgage (with bank selection)
```

---

## 11. Benefits of This Architecture

1. **Scalable**: Easy to add more banks without code changes
2. **Flexible**: Banks can set their own products and terms
3. **Transparent**: Buyers can compare banks and products
4. **Secure**: Admin verification ensures only legitimate banks
5. **Non-Breaking**: Existing functionality continues to work
6. **Extensible**: Easy to add features like bank ratings, comparison tools, etc.

---

## 12. Implementation Checklist

### Backend
- [ ] Create MortgageBank model
- [ ] Create mortgage bank routes
- [ ] Add mortgage_bank role to User model
- [ ] Enhance MortgageApplication model
- [ ] Create bank verification middleware
- [ ] Add bank review endpoints
- [ ] Update mortgage application endpoints

### Frontend
- [ ] Create MortgageBankRegister component
- [ ] Create MortgageBankDashboard component
- [ ] Create AdminMortgageBankVerification component
- [ ] Create MortgageApplicationReview component
- [ ] Enhance Mortgage.js (remove eligibility filter)
- [ ] Update PropertyDetail.js (add mortgage button to all)
- [ ] Create bank selection modal
- [ ] Update MortgageContext

### Testing
- [ ] Test bank registration flow
- [ ] Test admin verification
- [ ] Test mortgage application with bank selection
- [ ] Test bank review workflow
- [ ] Test backward compatibility

---

## 13. Future Enhancements

1. **Bank Ratings**: Allow buyers to rate banks after mortgage completion
2. **Comparison Tool**: Side-by-side comparison of bank products
3. **Pre-Approval**: Banks can pre-approve buyers before property selection
4. **Auto-Matching**: System suggests best bank/product based on buyer profile
5. **Bank Analytics**: Dashboard for banks to track performance metrics

