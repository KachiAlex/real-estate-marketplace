# PAYMENT FLOWS - VISUAL GUIDE & IMPLEMENTATION STATUS

**Date:** March 13, 2026  
**Purpose:** Visual reference for all payment flows with Paystack  
**Status:** Ready for Implementation

---

## MASTER PAYMENT FLOW DIAGRAM

```
                        ┌─────────────────────────────────────────┐
                        │   USER INITIATES TRANSACTION             │
                        │  (Property/Escrow/Investment/Sub)        │
                        └─────────────────┬───────────────────────┘
                                          │
                                          ▼
                        ┌─────────────────────────────────────────┐
                        │  CHECK DATABASE FOR ENTITY              │
                        │  (Property exists? Valid status?)       │
                        └─────────────────┬───────────────────────┘
                                          │
                    ┌─────────────────────┴─────────────────────┐
                    │                                           │
                    ▼                                           ▼
            ✅ VALID                            ❌ INVALID
         CREATE ESCROW                      RETURN ERROR
      (if applicable)                       to user
         or ENTITY                              │
                    │                           │
                    ▼                           │
    ┌──────────────────────────────┐          │
    │ POST /api/payments/initialize│          │
    │ Payload: {                    │          │
    │   amount,                     │          │
    │   paymentMethod: 'paystack',  │          │
    │   paymentType: 'escrow'|...  │          │
    │ }                             │          │
    └──────────────┬────────────────┘          │
                   │                            │
                   ▼                            │
    ┌──────────────────────────────┐          │
    │ CREATE PAYMENT RECORD         │          │
    │ status='pending'              │          │
    │ Validate: amount ≥ ₦100       │          │
    └──────────────┬────────────────┘          │
                   │                            │
                   ▼                            │
    ┌──────────────────────────────┐          │
    │ CALL PAYSTACK SERVICE        │          │
    │ paystackService              │          │
    │   .initializePayment()       │          │
    └──────────────┬────────────────┘          │
                   │                            │
    ┌──────────────▼─────────────────┐        │
    │  PAYSTACK API: /transaction/    │        │
    │  initialize                     │        │
    │                                 │        │
    │  POST https://api.paystack.co/  │        │
    │  transaction/initialize         │        │
    │                                 │        │
    │  Headers:                       │        │
    │  Authorization: Bearer {key}    │        │
    │  Content-Type: application/json │        │
    │                                 │        │
    │  Body: {                        │        │
    │    amount: (kobo),              │        │
    │    email,                       │        │
    │    reference,                   │        │
    │    metadata,                    │        │
    │    channels                     │        │
    │  }                              │        │
    └──────────────┬─────────────────┘        │
                   │                            │
    ┌──────────────┴──────────────┐           │
    │                              │           │
    ▼                              ▼           │
✅ SUCCESS                    ❌ FAILURE      │
authUrl, accessCode,          timeout/        │
reference                     network         │
    │                              │           │
    ▼                              ▼           │
RETURN TO FRONTEND            RETRY QUEUE    │
{                             or ERROR        │
  authorizationUrl,                │           │
  accessCode,                      │           │
  reference                        └───────────┴──> RETURN ERROR
}                                    │
    │                                │
    ▼                                │
┌─────────────────────────────────┐  │
│ FRONTEND: LOAD PAYSTACK SDK     │  │
│ window.PaystackPop.setup({       │  │
│   key: publicKey,               │  │
│   email,                        │  │
│   amount,                       │  │
│   ref: reference                │  │
│ })                              │  │
│ .open()                         │  │
└────────────────┬────────────────┘  │
                 │                    │
                 ▼                    │
         ┌──────────────────┐        │
         │ PAYSTACK MODAL   │        │
         │ SHOWN TO USER    │        │
         └────────┬─────────┘        │
                  │                   │
                  ▼                   │
    ┌─────────────────────────────┐ │
    │ USER COMPLETES PAYMENT:     │ │
    │ 1. Enter card details       │ │
    │ 2. 3D Secure (if required) │ │
    │ 3. OTP verification         │ │
    │ 4. Submit                   │ │
    └──────────────┬──────────────┘ │
                   │                 │
        ┌──────────┴──────────┐      │
        │                     │      │
        ▼                     ▼      │
    ✅ SUCCESS            ❌ FAILED  │
    Paystack             User        │
    callback              cancelled   │
    invoked               or card     │
        │                 declined    │
        │                     │       │
        ▼                     ▼       │
    ┌────────────────┐  ┌────────────┴──┐
    │ PAYMENT        │  │ FRONTEND       │
    │ SUCCESSFUL     │  │ ERROR HANDLING │
    │ AT PAYSTACK    │  │ Show message   │
    │                │  │ Retry option   │
    │ Paystack sends │  │                │
    │ callback       │  └────────────────┘
    │ reference      │
    └────────┬───────┘
             │
             ▼
    ┌─────────────────────────────┐
    │ PAYSTACK WEBHOOK TRIGGERED  │
    │ POST /api/payments/webhook/ │
    │ paystack                    │
    │                             │
    │ Payload: {                  │
    │   event: 'charge.success',  │
    │   data: {                   │
    │     reference,              │
    │     status: 'success',      │
    │     amount,                 │
    │     ...                     │
    │   }                         │
    │ }                           │
    └────────┬────────────────────┘
             │
             ▼
    ┌─────────────────────────────┐
    │ BACKEND WEBHOOK HANDLER     │
    │ 🔴 CRITICAL: INCOMPLETE     │
    │                             │
    │ 1. Verify signature         │
    │ 2. Extract reference        │
    │ 3. Find Payment in DB       │
    │ 4. Update Payment.status    │
    │    ='completed'             │
    │ 5. Handle by paymentType:   │
    │    ├─ 'escrow'              │
    │    │  └─ Update Escrow.     │
    │    │     status='funded'    │
    │    ├─ 'investment'          │
    │    │  └─ Create             │
    │    │     UserInvestment     │
    │    ├─ 'vendor_listing'      │
    │    │  └─ Mark property      │
    │    │     listed             │
    │    └─ 'subscription'        │
    │       └─ Create Subscription│
    │ 6. Send notifications       │
    │ 7. Return 200               │
    └────────┬────────────────────┘
             │
    ┌────────┴──────────┐
    │                   │
    ▼                   ▼
✅ PROCESSED        ❌ ERROR
ALL SYSTEMS         In processing
UPDATED             (logged for
    │               manual review)
    │                   │
    ▼                   ▼
┌─────────────────────────────┐ 
│ NOTIFY USER                 │
│ • Email confirmation        │
│ • In-app notification       │
│ • Dashboard update          │
└─────────────────────────────┘
    │
    ▼
TRANSACTION COMPLETE ✓
```

---

## ESCROW-SPECIFIC PAYMENT FLOW

```
ESCROW PURCHASE SCENARIO:

User at Property Detail Page
│
├─ Selects: "Make an Offer" / "Buy Now"
│
├─ Inputs: Escrow Amount, Payment Method, Expected Completion Date
│
▼
POST /api/escrow (Create Escrow Transaction)
│
├─ Validations:
│  ├─ Property exists ✓
│  ├─ Property in ['available','for-sale','active'] ✓
│  ├─ Seller ≠ Buyer ✓
│  └─ No active escrow exists ✓
│
├─ Database: CREATE EscrowTransaction
│  {
│    id: UUID
│    propertyId
│    buyerId
│    sellerId
│    amount
│    status: 'pending'
│    fundedAt: NULL
│    completedAt: NULL
│  }
│
├─ Notification: Seller gets notified
│
▼
Frontend: ESCROW PAYMENT FLOW COMPONENT
│
├─ Shows: "Complete your ₦X payment"
├─ Button: "Pay Now"
│
▼
POST /api/payments/initialize
│
├─ Payload:
│  {
│    amount,
│    paymentMethod: 'paystack',
│    paymentType: 'escrow',
│    relatedEntity: { type: 'escrow', id: escrowId },
│    description: 'Escrow for Property XYZ'
│  }
│
├─ Backend: CREATE Payment Record
│  {
│    id: UUID
│    userId: buyerId
│    amount
│    status: 'pending'
│    reference: 'PAY...'
│    metadata: {
│      relatedEntity: { type: 'escrow', id: escrowId },
│      ...
│    }
│  }
│
├─ Call PaystackService.initializePayment()
│
▼
PAYSTACK API CALL
│
├─ POST /transaction/initialize
├─ Returns: { authorizationUrl, accessCode, reference }
│
▼
Frontend: SHOW PAYSTACK MODAL
│
├─ User enters card details
├─ Completes 3D Secure
├─ Clicks Pay
│
▼
PAYSTACK PROCESSES PAYMENT
│
├─ Validates card
├─ Processes transaction
├─ Returns: success | failed
│
▼
WEBHOOK TO BACKEND
│
├─ POST /api/payments/webhook/paystack
│
├─ Backend Handler:
│  │
│  ├─ Verify signature ✓
│  │
│  ├─ Extract reference
│  │
│  ├─ Find Payment by reference
│  │   └─ Update Payment.status = 'completed'
│  │
│  ├─ Find related Escrow via metadata
│  │   └─ Query: EscrowTransaction.findByPk(escrowId)
│  │
│  ├─ Update Escrow:
│  │   {
│  │     status: 'funded',
│  │     fundedAt: now(),
│  │     paymentReference: reference
│  │   }
│  │
│  ├─ Send Notifications:
│  │   ├─ Buyer: "Payment received!"
│  │   └─ Seller: "Payment received. Please upload documents."
│  │
│  └─ Return 200 OK
│
▼
ESCROW.STATUS = 'FUNDED' ✓

Phase 2: Document Verification

Seller Action:
├─ Logs into dashboard
├─ Navigates to Escrow
├─ Sees: "Payment received - ₦X"
├─ Uploads documents:
│  ├─ Title deed
│  ├─ Property survey
│  ├─ Government approval
│  └─ Condition-specific docs
│
├─ Backend saves to:
│  └─ EscrowTransaction.documents (JSON array)
│
▼
Buyer Action:
├─ Reviews documents on Escrow Detail
├─ Options:
│  ├─ "Verify & Approve"
│  │  └─ Call: PUT /api/escrow/:id/status
│  │     { status: 'completed' }
│  │
│  ├─ "Request Clarification"
│  │  └─ Add timeline entry
│  │
│  └─ "File Dispute"
│     └─ POST /api/escrow/:id/dispute
│
▼
COMPLETION PATH (if approved):

PUT /api/escrow/:id/status
│
├─ Validates: buyer authorization
├─ Status: 'funded' → 'completed'
├─ Set: completedAt = now()
│
├─ Backend Actions:
│  ├─ Update EscrowTransaction.status = 'completed'
│  ├─ Update Property.status = 'sold'
│  ├─ Transfer ownership (off-chain or webhook)
│  ├─ Release funds to seller
│  │  └─ Via Paystack or bank transfer
│  └─ Send notifications:
│     ├─ Buyer: "Escrow completed!"
│     └─ Seller: "Funds released!"
│
▼
ESCROW.STATUS = 'COMPLETED' ✓
TRANSACTION COMPLETE ✓

OR DISPUTE PATH:

Buyer files dispute during verification phase:

POST /api/escrow/:id/dispute
│
├─ Payload:
│  {
│    reason: 'title_issues',
│    description: 'Property has encumbrance on title',
│    evidence: ['doc1', 'doc2']
│  }
│
├─ Backend:
│  ├─ Validate reason in approved list
│  ├─ Create DisputeResolution record
│  ├─ Set SLA:
│  │  ├─ firstResponseDeadline: now + 24h
│  │  └─ resolutionDeadline: now + 72h
│  ├─ Update EscrowTransaction.status = 'disputed'
│  ├─ Funds HELD (no release)
│  └─ Send HIGH PRIORITY notifications:
│     ├─ Seller: "Respond within 24 hours"
│     └─ Admin: "New dispute filed"
│
▼
Seller Response (within 24h):

Seller uploads clarification documents:
├─ Court order clearing encumbrance
├─ Bank clearance
│
▼
Admin Review (within 72h):

PUT /api/escrow/:id/resolve-dispute
│
├─ Payload:
│  {
│    resolution: 'seller_favor' | 'buyer_favor' | 'partial_refund' | 'full_refund',
│    adminNotes: 'Encumbrance properly cleared...'
│  }
│
├─ Backend:
│  ├─ Move funds based on resolution:
│  │  ├─ seller_favor: Release to seller
│  │  ├─ buyer_favor: Refund to buyer
│  │  ├─ partial_refund: Split
│  │  └─ full_refund: Full refund
│  │
│  └─ Update DisputeResolution.status = 'resolved'
│
▼
DISPUTE RESOLVED ✓

OR CANCELLATION PATH:

Buyer cancels before completion:

PUT /api/escrow/:id/status
{ status: 'cancelled' }
│
├─ If status = 'funded':
│  └─ Backend calls RefundPayment
│
│  ├─ Calculate refund:
│  │  └─ refundAmount = amount - escrowFee (1%)
│  │
│  ├─ Call PaystackService.refundPayment()
│  │  └─ POST /api/paystack refund endpoint
│  │
│  ├─ Update Payment.status = 'refunded'
│  ├─ Update Escrow.status = 'cancelled'
│  ├─ Mark Property.status = 'available'
│  │
│  └─ Notify:
│     ├─ Buyer: "Refund processed: ₦X"
│     └─ Seller: "Escrow cancelled"
│
▼
ESCROW.STATUS = 'CANCELLED' ✓
(Buyer receives refund in 2-3 business days)
```

---

## PAYMENT TYPE COMPARISON TABLE

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PAYMENT TYPE FLOWS                               │
├──────────────┬────────────┬──────────┬──────────────┬──────────────────┤
│ Type         │ Escrow?    │ Duration │ Fund Hold    │ Next Step        │
├──────────────┼────────────┼──────────┼──────────────┼──────────────────┤
│ PROPERTY     │ ❌ Optional│ Instant  │ ❌ No        │ Ownership xfer   │
│ PURCHASE     │            │          │              │ (off-chain)      │
├──────────────┼────────────┼──────────┼──────────────┼──────────────────┤
│ ESCROW       │ ✅ Required│ Custom   │ ✅ Yes       │ Document verify, │
│ PURCHASE     │            │ (1-30d)  │ (days-weeks) │ dispute handling │
├──────────────┼────────────┼──────────┼──────────────┼──────────────────┤
│ INVESTMENT   │ ✅ Required│ Custom   │ ✅ Yes       │ ROI accrual,     │
│              │            │ (6-24m)  │ (months)     │ maturity release │
├──────────────┼────────────┼──────────┼──────────────┼──────────────────┤
│ SUBSCRIPTION │ ❌ No      │ 1-12m    │ ❌ No        │ Feature gating,  │
│              │            │          │              │ renewal reminder │
├──────────────┼────────────┼──────────┼──────────────┼──────────────────┤
│ VENDOR       │ ❌ No      │ Instant  │ ❌ No        │ Property listed, │
│ LISTING      │            │          │              │ visible on site  │
├──────────────┼────────────┼──────────┼──────────────┼──────────────────┤
│ COMMISSION   │ ❌ Auto    │ Instant  │ ❌ No        │ Vendor wallet,   │
│              │            │ at close │              │ withdrawal ready │
├──────────────┼────────────┼──────────┼──────────────┼──────────────────┤
│ PROPERTY     │ ❌ No      │ Instant  │ ❌ No        │ Verification OK, │
│ VERIFICATION │            │          │              │ property vetted  │
└──────────────┴────────────┴──────────┴──────────────┴──────────────────┘
```

---

## IMPLEMENTATION STATUS BY COMPONENT

```
BACKEND COMPONENTS
├─ Models
│  ├─ Payment ✅ (100%)
│  ├─ EscrowTransaction ✅ (100%)
│  ├─ DisputeResolution ⚠️ (70%)
│  ├─ UserInvestment ⚠️ (50%)
│  └─ Subscription ⚠️ (40%)
│
├─ Routes
│  ├─ /api/payments GET ✅ (100%)
│  ├─ /api/payments POST (init) ✅ (100%)
│  ├─ /api/payments/:id/verify ✅ (100%)
│  ├─ /api/payments/:id/cancel ✅ (100%)
│  ├─ /api/payments/:id/refund ⚠️ (10%)
│  ├─ /api/payments/webhook ⚠️ (30%)
│  ├─ /api/escrow GET ✅ (100%)
│  ├─ /api/escrow POST ✅ (100%)
│  ├─ /api/escrow/:id/status PUT ⚠️ (80%)
│  ├─ /api/escrow/:id/dispute ⚠️ (70%)
│  └─ /api/escrow/:id/resolve-dispute ⚠️ (50%)
│
├─ Services
│  ├─ PaystackService ✅ (85%)
│  │  ├─ initializePayment ✅
│  │  ├─ verifyPayment ✅
│  │  └─ refundPayment ❌ (MISSING)
│  │
│  ├─ PaymentService ⚠️ (60%)
│  │  ├─ listUserPayments ✅
│  │  ├─ getPaymentById ✅
│  │  ├─ initializePayment ✅
│  │  ├─ verifyPayment ✅
│  │  ├─ processWebhook ❌ (BLOCKING)
│  │  ├─ processRefund ❌ (BLOCKING)
│  │  └─ getPaymentStats ⚠️ (skeleton)
│  │
│  └─ EscrowService ⚠️ (80%)
│     ├─ listTransactions ✅
│     ├─ getTransactionById ✅
│     ├─ createTransaction ✅
│     ├─ updateStatus ✅
│     ├─ fileDispute ✅
│     └─ resolveDispute ⚠️ (incomplete)
│
└─ Middleware
   ├─ JWT Auth ✅
   ├─ Request Validation ✅
   ├─ Rate Limiting ❌ (MISSING)
   └─ Webhook Verification ⚠️ (partial)

FRONTEND COMPONENTS
├─ Services
│  ├─ paystackService ✅ (90%)
│  ├─ flutterwaveService ✅ (85%)
│  ├─ socketService ❌ (MISSING - CRITICAL)
│  └─ paymentService ✅ (70%)
│
├─ Components
│  ├─ EscrowPaymentFlow ✅ (85%)
│  ├─ PaymentCheckout ✅ (80%)
│  ├─ SubscriptionSelector ⚠️ (60%)
│  ├─ InvestmentPayment ⚠️ (50%)
│  ├─ EscrowDetail ⚠️ (70%)
│  ├─ DisputeForm ⚠️ (60%)
│  └─ AdminPaymentDashboard ❌ (MISSING)
│
└─ Context/State
   ├─ PaymentContext ✅ (80%)
   ├─ EscrowContext ✅ (85%)
   ├─ SocketContext ❌ (MISSING - CRITICAL)
   └─ SubscriptionContext ⚠️ (50%)

DATABASE SETUP
├─ PostgreSQL ✅ (running)
├─ Sequelize ORM ✅ (configured)
├─ Migrations ⚠️ (need to run:)
│  ├─ CREATE TABLE payments
│  ├─ CREATE TABLE escrow_transactions
│  ├─ CREATE TABLE dispute_resolutions
│  ├─ CREATE TABLE subscriptions
│  └─ CREATE TABLE user_investments
└─ Indexes ⚠️ (need to create for performance)

DEPLOYMENT
├─ Environment Variables
│  ├─ PAYSTACK_PUBLIC_KEY ⚠️ (needs setup)
│  ├─ PAYSTACK_SECRET_KEY ⚠️ (needs setup)
│  ├─ FLUTTERWAVE_SECRET_KEY ⚠️ (needs setup)
│  └─ SENDGRID_API_KEY ⚠️ (for emails)
│
├─ Webhook Configuration
│  ├─ Paystack Dashboard ⚠️ (needs URL)
│  ├─ Flutterwave Dashboard ⚠️ (needs URL)
│  └─ Stripe Dashboard ⚠️ (if applicable)
│
└─ Monitoring
   ├─ Payment Success Rate ❌ (no dashboard)
   ├─ Webhook Delivery Logs ❌ (no tracking)
   └─ Error Tracking ⚠️ (basic console logs only)
```

---

## CRITICAL PATH TO MVP LAUNCH

```
WEEK 1: BLOCKING ISSUES
┌────────────────────────────────────────────────────┐
│ Task                          Time    Priority    │
├────────────────────────────────────────────────────┤
│ 1. Implement processWebhook() 2 days 🔴 CRITICAL │
│ 2. Add PaystackService        1 day  🔴 CRITICAL │
│    .refundPayment()                               │
│ 3. Test webhook integration   1 day  🔴 CRITICAL │
│ 4. Test payment → escrow flow 1 day  🔴 CRITICAL │
└────────────────────────────────────────────────────┘

WEEK 2: HIGH PRIORITY
┌────────────────────────────────────────────────────┐
│ Task                          Time    Priority    │
├────────────────────────────────────────────────────┤
│ 1. Implement Socket.IO client 2 days  🟠 HIGH    │
│ 2. Real-time UI updates       1 day  🟠 HIGH    │
│ 3. Rate limiting on endpoints  1 day  🟠 HIGH    │
│ 4. Error handling improvements 1 day  🟠 HIGH    │
└────────────────────────────────────────────────────┘

WEEK 3: MEDIUM PRIORITY
┌────────────────────────────────────────────────────┐
│ Task                          Time    Priority    │
├────────────────────────────────────────────────────┤
│ 1. Complete dispute workflow  2 days  🟡 MEDIUM  │
│ 2. Admin dashboard            2 days  🟡 MEDIUM  │
│ 3. Subscription feature-gating 1 day  🟡 MEDIUM  │
└────────────────────────────────────────────────────┘

WEEK 4: TESTING & DEPLOYMENT
┌────────────────────────────────────────────────────┐
│ Task                          Time    Priority    │
├────────────────────────────────────────────────────┤
│ 1. E2E testing                3 days  🔵 VERIFY  │
│ 2. Security audit             1 day  🔵 VERIFY  │
│ 3. Load testing               1 day  🔵 VERIFY  │
│ 4. Production deployment      1 day  🔵 LAUNCH  │
└────────────────────────────────────────────────────┘

Total: 4 weeks to production-ready MVP
```

---

## NEXT IMMEDIATE ACTIONS

1. **TODAY:** Review this investigation document with team
2. **TOMORROW:** Start implementation on processWebhook() (blocking)
3. **DAY 3:** Add PaystackService.refundPayment() method
4. **DAY 5:** Test webhook with sandbox transactions
5. **END OF WEEK:** Complete payment → escrow flow testing

---

**Status:** Ready to proceed with implementation  
**Confidence Level:** HIGH (90%+)  
**Last Updated:** March 13, 2026
