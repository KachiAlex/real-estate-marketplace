# Mortgage Flow Fixes - Implementation Plan

## 📋 Overview

This document outlines the step-by-step implementation plan for fixing all identified issues in the mortgage flow.

---

## 🔴 Priority 1: Critical Fixes (Week 1)

### Fix 1: Replace Mock Properties with Real Properties
**File:** `src/pages/Mortgage.js`

**Changes:**
1. Import `useProperty` hook from PropertyContext
2. Fetch real properties instead of mock data
3. Transform property data to match expected format
4. Handle loading states
5. Use real property IDs (MongoDB ObjectIds)

**Implementation Steps:**
```javascript
// Add import
import { useProperty } from '../contexts/PropertyContext';

// Replace mock properties with real properties
const { properties, loading: propertiesLoading } = useProperty();

// Transform properties for mortgage page
const allEligibleProperties = useMemo(() => {
  return properties.map(prop => ({
    id: prop.id || prop._id, // Handle both formats
    title: prop.title,
    location: `${prop.location?.city || ''}, ${prop.location?.state || ''}`,
    price: prop.price,
    image: prop.images?.[0] || prop.image || '/placeholder.jpg',
    bedrooms: prop.bedrooms || 0,
    bathrooms: prop.bathrooms || 0,
    area: prop.area || 0,
    category: prop.type || 'residential',
    // ... other mappings
  }));
}, [properties]);
```

**Files to Modify:**
- `src/pages/Mortgage.js`

---

### Fix 2: Fix Property ID Handling
**File:** `src/pages/Mortgage.js`

**Changes:**
1. Use proper property ID from PropertyContext
2. Handle both `id` and `_id` formats
3. Ensure MongoDB ObjectId compatibility

**Implementation:**
```javascript
const handleConfirmMortgageApplication = async () => {
  // Use proper property ID
  const propertyId = selectedProperty.id || selectedProperty._id;
  
  // Submit to backend with correct ID
  await axios.post(`${API_BASE_URL}/api/mortgages/apply`, {
    propertyId: propertyId, // MongoDB ObjectId
    // ... rest of data
  });
};
```

---

### Fix 3: Remove localStorage Submission
**File:** `src/pages/Mortgage.js`

**Changes:**
1. Remove localStorage save logic
2. Only use backend API submission
3. Handle errors properly
4. Show proper loading states

**Implementation:**
```javascript
const handleConfirmMortgageApplication = async () => {
  setLoading(true);
  
  try {
    // Only backend submission
    const response = await axios.post(
      `${API_BASE_URL}/api/mortgages/apply`,
      {
        propertyId: selectedProperty.id,
        mortgageBankId: selectedBankId,
        requestedAmount: requestedAmount,
        downPayment: downPayment,
        loanTermYears: 25,
        interestRate: selectedBank?.defaultInterestRate || 18.5,
        employmentDetails: {
          type: employmentType,
          // ... other details
        },
        documents: uploadedDocuments // URLs from cloud storage
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    if (response.data.success) {
      toast.success('Mortgage application submitted successfully!');
      // Reset form
      // Navigate or close modal
    }
  } catch (error) {
    console.error('Error submitting application:', error);
    toast.error(error.response?.data?.message || 'Failed to submit application');
  } finally {
    setLoading(false);
  }
};
```

---

### Fix 4: Add Proper Error Handling
**Files:** `src/pages/Mortgage.js`

**Changes:**
1. Add try-catch blocks
2. Display user-friendly error messages
3. Handle network errors
4. Validate data before submission

---

### Fix 5: Integrate Document Upload with Cloud Storage
**Files:** 
- `src/pages/Mortgage.js`
- Backend route for document handling

**Changes:**
1. Upload files to Cloudinary
2. Store document URLs in backend
3. Show upload progress
4. Handle upload errors

**Implementation:**
```javascript
const uploadDocuments = async (files) => {
  const uploadPromises = files.map(async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'mortgage_documents');
    
    const response = await axios.post(
      'https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload',
      formData
    );
    
    return {
      type: 'bank_statement',
      url: response.data.secure_url,
      name: file.name,
      uploadedAt: new Date().toISOString()
    };
  });
  
  return Promise.all(uploadPromises);
};
```

---

## 🟡 Priority 2: Integration Fixes (Week 2)

### Fix 6: Update Backend to Accept Document URLs
**File:** `backend/routes/mortgages.js`

**Changes:**
1. Accept document URLs in request
2. Store in MortgageApplication documents array
3. Validate document URLs

---

### Fix 7: Create Application → Mortgage Conversion
**Files:**
- `backend/routes/mortgages.js`
- New endpoint: `POST /api/mortgages/:id/activate`

**Implementation:**
```javascript
// Convert approved application to active mortgage
router.post('/:id/activate', protect, async (req, res) => {
  const application = await MortgageApplication.findById(req.params.id);
  
  if (application.status !== 'approved') {
    return res.status(400).json({
      success: false,
      message: 'Only approved applications can be activated'
    });
  }
  
  // Create active mortgage from application
  // Link to payment system
  // Set up payment schedule
});
```

---

### Fix 8: Connect MortgageContext to Backend
**File:** `src/contexts/MortgageContext.js`

**Changes:**
1. Fetch mortgages from backend API
2. Remove mock data
3. Connect to real mortgage data

---

### Fix 9: Add Email Notifications (Banks)
**Files:**
- `backend/routes/mortgages.js`
- `backend/services/emailService.js`

**Implementation:**
```javascript
// After creating application
const bank = await MortgageBank.findById(mortgageBankId);
await emailService.sendEmail(
  bank.email,
  'New Mortgage Application Received',
  // HTML template
);
```

---

### Fix 10: Add Email Notifications (Buyers)
**Files:**
- `backend/routes/mortgages.js`

**Implementation:**
```javascript
// After status change
await emailService.sendEmail(
  buyer.email,
  'Mortgage Application Status Update',
  // HTML template with status
);
```

---

## 🟢 Priority 3: Enhancements (Week 3-4)

### Fix 11: Document Preview/Download
**File:** `src/pages/MortgageBankDashboard.js`

**Implementation:**
- Add document viewer component
- Download functionality
- Preview in modal

---

### Fix 12: Enhance Bank Review Interface
**File:** `src/pages/MortgageBankDashboard.js`

**Changes:**
- Add notes field
- Add conditions field
- Loan term adjustment
- Loan calculator

---

### Fix 13: Display Bank Products
**File:** `src/pages/Mortgage.js`

**Implementation:**
- Show products during selection
- Display rates and terms
- Comparison feature

---

### Fix 14: GET Endpoint for Active Mortgages
**File:** `backend/routes/mortgages.js`

**Implementation:**
```javascript
router.get('/active', protect, async (req, res) => {
  // Get active mortgages for logged-in user
  const mortgages = await MortgageApplication.find({
    buyer: req.user.id,
    status: 'approved',
    activated: true
  });
  
  return res.json({ success: true, data: mortgages });
});
```

---

### Fix 15: Payment Gateway Integration
**Files:**
- `src/components/MortgagePaymentFlow.js`
- Backend payment processing

**Implementation:**
- Integrate Flutterwave/Stripe
- Process payments
- Update mortgage balance
- Generate receipts

---

## 📝 Implementation Order

### Day 1-2: Core Data Connection
1. Fix 1: Replace mock properties
2. Fix 2: Fix property ID handling
3. Fix 3: Remove localStorage

### Day 3-4: Document & Error Handling
4. Fix 4: Error handling
5. Fix 5: Document upload

### Day 5-7: Backend Updates
6. Fix 6: Backend document URLs
7. Fix 7: Application conversion

### Week 2: Integration
8. Fix 8: Connect MortgageContext
9. Fix 9-10: Email notifications
11. Fix 11: Document preview

### Week 3-4: Enhancements
12-15. Remaining enhancements

---

## ✅ Testing Checklist

After each fix:
- [ ] Test the specific functionality
- [ ] Verify no regressions
- [ ] Check error handling
- [ ] Test edge cases
- [ ] Verify data persistence

---

**Last Updated:** [Current Date]
**Status:** Ready to Implement

