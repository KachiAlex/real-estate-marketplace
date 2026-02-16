# Vendor Dashboard Switcher & Onboarding Architecture

## Overview
This architecture implements a dashboard switcher for users with dual buyer/vendor roles, along with a comprehensive vendor onboarding flow including KYC verification, subscription management, and penalty enforcement.

## Core Components

### 1. User Role Management
- **Multi-role Support**: Users can have both 'buyer' and 'vendor' roles simultaneously
- **Role Detection**: Enhanced AuthContext to detect dual-role users
- **Dashboard Switcher**: Only visible for users with both buyer and vendor roles

### 2. Vendor Onboarding Flow
```
Registration → KYC Submission → Admin Review → Payment → Activation
```

### 3. Subscription Management
- **Monthly Billing**: NGN 50,000 default (admin configurable)
- **Manual Renewal**: No auto-renewal, requires user action
- **Penalty System**: Account suspension for non-payment
- **Payment Gateway**: Paystack integration

## Database Schema Updates

### User Model Enhancement
```javascript
{
  // Existing fields...
  roles: [{
    type: String,
    enum: ['buyer', 'vendor', 'admin', 'mortgage_bank'],
    default: ['buyer']
  }],
  vendorProfile: {
    businessName: String,
    businessType: String,
    licenseNumber: String,
    isAgent: Boolean,
    isPropertyOwner: Boolean,
    experience: String,
    specializations: [String],
    contactInfo: {
      phone: String,
      address: String
    },
    kycStatus: {
      type: String,
      enum: ['pending', 'under_review', 'approved', 'rejected'],
      default: 'pending'
    },
    kycDocuments: [{
      type: {
        type: String, // 'nin', 'business_license', 'address_proof'
        required: true
      },
      documentNumber: String,
      fileUrl: String,
      status: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
      },
      uploadedAt: Date,
      verifiedAt: Date,
      verifiedBy: mongoose.Schema.Types.ObjectId
    }],
    subscription: {
      isActive: { type: Boolean, default: false },
      planType: { type: String, default: 'monthly' },
      amount: { type: Number, default: 50000 }, // NGN
      lastPaid: Date,
      nextDue: Date,
      paymentHistory: [{
        amount: Number,
        paidAt: Date,
        reference: String,
        status: String
      }],
      suspensionDate: Date,
      suspensionReason: String
    },
    onboardingComplete: { type: Boolean, default: false },
    joinedDate: Date
  }
}
```

### Admin Settings Enhancement
```javascript
{
  // Existing fields...
  vendorSubscriptionFee: {
    type: Number,
    required: true,
    default: 50000, // NGN 50,000
    min: [0, 'Subscription fee cannot be negative']
  },
  vendorSubscriptionGracePeriod: {
    type: Number,
    default: 7, // days
    min: [0, 'Grace period cannot be negative']
  },
  vendorLateFee: {
    type: Number,
    default: 10000, // NGN 10,000 late fee
    min: [0, 'Late fee cannot be negative']
  }
}
```

## API Endpoints

### Vendor Onboarding
```
POST /api/vendor/register - Register as vendor
POST /api/vendor/kyc/submit - Submit KYC documents
GET /api/vendor/kyc/status - Check KYC verification status
POST /api/vendor/subscribe - Process subscription payment
POST /api/vendor/renew - Renew subscription
```

### Admin Management
```
GET /api/admin/vendors - List all vendors
GET /api/admin/vendors/:id/kyc - Get vendor KYC details
POST /api/admin/vendors/:id/kyc/verify - Approve/reject KYC
PUT /api/admin/settings/subscription - Update subscription settings
GET /api/admin/subscription-analytics - Subscription analytics
```

### Dashboard Switcher
```
GET /api/user/roles - Get user's active roles
POST /api/user/switch-role - Switch active dashboard role
```

## Frontend Components

### Dashboard Switcher Component
```javascript
// Only shows for dual-role users
const DashboardSwitcher = () => {
  const { user } = useAuth();
  const hasBothRoles = user?.roles?.includes('buyer') && user?.roles?.includes('vendor');

  if (!hasBothRoles) return null;

  return (
    <div className="dashboard-switcher">
      <button onClick={() => navigate('/dashboard')}>
        Buyer Dashboard
      </button>
      <button onClick={() => navigate('/vendor/dashboard')}>
        Vendor Dashboard
      </button>
    </div>
  );
};
```

### Vendor Onboarding Wizard
```javascript
const VendorOnboardingWizard = () => {
  const steps = [
    'Business Info',
    'KYC Documents',
    'Review & Payment',
    'Activation'
  ];

  // Step-by-step wizard with progress tracking
};
```

### Subscription Management
```javascript
const SubscriptionManager = () => {
  const { subscription } = useVendor();

  // Show current status, renewal options, payment history
  // Handle Paystack payment integration
};
```

## Payment Integration (Paystack)

### Payment Flow
1. **Initialize Payment**: Generate Paystack transaction reference
2. **Redirect to Paystack**: User completes payment
3. **Webhook/Webhook Verification**: Confirm payment success
4. **Update Subscription**: Activate vendor account

### Paystack Configuration
```javascript
const paystackConfig = {
  publicKey: process.env.PAYSTACK_PUBLIC_KEY,
  subscriptionFee: 50000, // NGN
  currency: 'NGN',
  callbackUrl: `${process.env.FRONTEND_URL}/vendor/payment/callback`
};
```

## Admin Panel Enhancements

### Vendor Management Dashboard
- List all vendors with status (KYC, subscription, activity)
- KYC document review interface
- Subscription analytics and revenue tracking
- Bulk actions (suspend, activate, send reminders)

### Subscription Settings
- Configure default subscription fee
- Set grace period and late fees
- View payment analytics

## Notification System

### Email Notifications
- KYC submission confirmation
- KYC approval/rejection
- Subscription renewal reminders
- Payment confirmations
- Account suspension warnings

### In-App Notifications
- Dashboard alerts for expiring subscriptions
- KYC status updates
- Payment success/failure messages

## Security Considerations

### KYC Document Handling
- Secure file upload with validation
- Encrypted storage of sensitive documents
- Admin-only access to KYC documents
- Document retention policies

### Payment Security
- Paystack webhook signature verification
- Transaction reference validation
- Secure payment data handling
- PCI compliance considerations

## Error Handling & Edge Cases

### Subscription Management
- Handle failed payments gracefully
- Automatic suspension after grace period
- Manual reactivation process
- Refund handling for overpayments

### Role Switching
- Preserve user context when switching dashboards
- Handle authentication state across role switches
- Maintain separate preferences per role

### KYC Process
- Handle document upload failures
- Admin review workflow with audit trail
- Rejection reasons and resubmission process

## Implementation Phases

### Phase 1: Core Infrastructure
- Update user model and database schema
- Implement multi-role authentication
- Create basic dashboard switcher

### Phase 2: Vendor Onboarding
- Build KYC submission interface
- Implement document upload and storage
- Create admin KYC review system

### Phase 3: Subscription System
- Integrate Paystack payment gateway
- Implement subscription lifecycle management
- Add penalty and suspension logic

### Phase 4: Admin Management
- Build vendor management dashboard
- Add subscription analytics
- Implement bulk operations

### Phase 5: Polish & Testing
- Comprehensive testing of all flows
- Error handling improvements
- Performance optimization

## Success Metrics

- **Conversion Rate**: Percentage of buyers who become vendors
- **KYC Approval Rate**: Speed and accuracy of KYC verification
- **Subscription Retention**: Monthly renewal rates
- **Payment Success Rate**: Paystack transaction success percentage
- **Admin Efficiency**: Time to review KYC applications

This architecture provides a robust foundation for vendor management while maintaining security, scalability, and user experience standards.</content>
<parameter name="filePath">d:\real-estate-marketplace\VENDOR_DASHBOARD_ARCHITECTURE.md