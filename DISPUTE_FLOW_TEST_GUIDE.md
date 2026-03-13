# End-to-End Dispute Flow Testing Guide

This guide walks through manual testing of the complete dispute resolution system with all endpoints and scenarios.

## Prerequisites

- Backend server running at `http://localhost:5000` (or your configured port)
- Admin user account
- Buyer user account  
- Seller user account
- Existing escrow transaction with both buyer and seller

## Test Data Setup

Before running tests, create:
1. **Buyer** - Email: `buyer@test.com`
2. **Seller** - Email: `seller@test.com`
3. **Admin** - Email: `admin@test.com`
4. **Escrow Transaction** - Status: 'active', with buyer and seller assigned

## Test Flow

### Phase 1: File a Dispute (Buyer Initiates)

**Endpoint:** `POST /api/escrow/:id/dispute`

**Request:**
```bash
curl -X POST http://localhost:5000/api/escrow/tx-123/dispute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <BUYER_TOKEN>" \
  -d {
    "reason": "seller_non_compliance",
    "description": "The seller has not provided the agreed upon inspection report within the promised timeframe. This is causing significant delays in the transaction closure.",
    "evidence": ["doc-url-1.pdf", "doc-url-2.jpg"]
  }
```

**Expected Success Response (200):**
```json
{
  "success": true,
  "message": "Dispute filed successfully",
  "data": {
    "id": "disp-123",
    "escrowId": "tx-123",
    "status": "open",
    "reason": "seller_non_compliance",
    "description": "The seller has not provided...",
    "initiatedBy": "buyer-id",
    "firstResponseDeadline": "2026-03-14T06:50:00Z",
    "resolutionDeadline": "2026-03-16T06:50:00Z",
    "documents": ["doc-url-1.pdf", "doc-url-2.jpg"],
    "timeline": [
      {
        "type": "dispute_filed",
        "timestamp": "2026-03-13T06:50:00Z",
        "initiatedBy": "buyer-id",
        "reason": "seller_non_compliance"
      }
    ]
  }
}
```

**Validation Checks:**
- ✅ Dispute status is 'open'
- ✅ firstResponseDeadline is 24 hours from now
- ✅ resolutionDeadline is 72 hours from now
- ✅ Timeline contains 'dispute_filed' entry
- ✅ Seller receives notification within 5 seconds
- ✅ Admin group receives alert notification
- ✅ Escrow transaction status changes to 'disputed'

**Error Cases to Test:**

1. **Invalid reason:**
```bash
# Should return 400
"reason": "invalid_reason_type"
```
Expected: `Invalid dispute reason`

2. **Description too short:**
```bash
# Should return 400
"description": "short"
```
Expected: `Description must be between 10 and 1000 characters`

3. **Non-participant tries to file:**
```bash
# Use token of person not in transaction
# Should return 403
```
Expected: `You are not a participant in this escrow transaction`

4. **Active dispute already exists:**
```bash
# Try to file again after first dispute filed
# Should return 400
```
Expected: `An active dispute already exists for this transaction`

---

### Phase 2: Seller Submits Response

**Endpoint:** `PUT /api/escrow/:id/dispute-response`

**Request (must be within 24 hours of dispute filing):**
```bash
curl -X PUT http://localhost:5000/api/escrow/tx-123/dispute-response \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <SELLER_TOKEN>" \
  -d {
    "sellerResponse": "We have provided the inspection report to the buyer's representative on March 12, 2026 at 2 PM. attached is the signed delivery confirmation. We dispute the buyer's claim and believe this transaction should proceed.",
    "sellerEvidence": ["delivery-confirmation.pdf", "signed-receipt.jpg"]
  }
```

**Expected Success Response (200):**
```json
{
  "success": true,
  "message": "Response submitted successfully",
  "data": {
    "id": "disp-123",
    "escrowId": "tx-123",
    "status": "in_review",
    "sellerResponse": "We have provided the inspection report...",
    "sellerEvidence": ["delivery-confirmation.pdf", "signed-receipt.jpg"],
    "timeline": [
      {
        "type": "dispute_filed",
        "timestamp": "2026-03-13T06:50:00Z",
        "initiatedBy": "buyer-id",
        "reason": "seller_non_compliance"
      },
      {
        "type": "seller_responded",
        "timestamp": "2026-03-13T08:20:00Z",
        "respondedBy": "seller-id",
        "response": "We have provided the inspection report..."
      }
    ]
  }
}
```

**Validation Checks:**
- ✅ Dispute status changes from 'open' to 'in_review'
- ✅ sellerResponse field populated
- ✅ sellerEvidence array contains provided documents
- ✅ Timeline updated with 'seller_responded' entry
- ✅ Buyer receives notification
- ✅ Admin group receives "Dispute Ready for Resolution" notification
- ✅ Cannot file another response (if re-attempted, should fail)

**Error Cases:**

1. **Response deadline passed (> 24 hours):**
```bash
# Try to respond after 24+ hours
# Should return 400
```
Expected: `Response deadline has passed`

2. **Non-seller tries to respond:**
```bash
# Use buyer token
# Should return 403
```
Expected: `Only the seller can submit a response to this dispute`

3. **Response already submitted:**
```bash
# Try to submit second response
# Should return 400
```
Expected: `You have already submitted a response to this dispute`

4. **Response too short:**
```bash
"sellerResponse": "short"
# Should return 400
```
Expected: `Response must be between 10 and 1000 characters`

---

### Phase 3: Admin Lists Disputes with SLA Status

**Endpoint:** `GET /api/admin/disputes`

**Request (with various filters):**
```bash
# List all open disputes
curl -X GET "http://localhost:5000/api/admin/disputes?status=open&page=1&limit=20" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# List by SLA deadline (earliest first)
curl -X GET "http://localhost:5000/api/admin/disputes?sortBy=firstResponseDeadline" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# List disputes ready for resolution
curl -X GET "http://localhost:5000/api/admin/disputes?status=in_review" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Expected Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "disp-123",
      "escrowId": "tx-123",
      "status": "in_review",
      "reason": "seller_non_compliance",
      "initiatedBy": "buyer-id",
      "sellerResponse": "We have provided...",
      "firstResponseDeadline": "2026-03-14T06:50:00Z",
      "resolutionDeadline": "2026-03-16T06:50:00Z",
      "slaStatus": "on-track",
      "urgencyLevel": "normal",
      "hoursUntilDeadline": 42
    },
    {
      "id": "disp-124",
      "escrowId": "tx-124",
      "status": "open",
      "reason": "property_condition",
      "initiatedBy": "buyer-id-2",
      "firstResponseDeadline": "2026-03-14T03:50:00Z",
      "resolutionDeadline": "2026-03-16T03:50:00Z",
      "slaStatus": "at-risk",
      "urgencyLevel": "high",
      "hoursUntilDeadline": 1
    },
    {
      "id": "disp-125",
      "escrowId": "tx-125",
      "status": "open",
      "reason": "payment_issues",
      "initiatedBy": "buyer-id-3",
      "firstResponseDeadline": "2026-03-13T02:50:00Z",
      "resolutionDeadline": "2026-03-15T02:50:00Z",
      "slaStatus": "overdue",
      "urgencyLevel": "critical",
      "hoursUntilDeadline": -2
    }
  ],
  "pagination": {
    "total": 3,
    "totalPages": 1,
    "currentPage": 1,
    "pageSize": 20
  }
}
```

**Validation Checks:**
- ✅ All disputes returned (admin sees all)
- ✅ SLA status calculated correctly:
  - 'on-track': > 2 hours until deadline (or > 6 hours for in_review)
  - 'at-risk': < 2 hours until deadline (or < 6 hours for in_review)
  - 'overdue': Past deadline
- ✅ Urgency levels correct (normal/high/critical)
- ✅ hoursUntilDeadline calculated accurately
- ✅ Pagination includes total, totalPages, currentPage, pageSize
- ✅ Sorting by deadline works (disputes sorted by chosen field)
- ✅ Status filter works (only returns disputes matching filter)

**Error Cases:**

1. **Non-admin access:**
```bash
# Use buyer token
# Should return 403
```
Expected: `Forbidden`

2. **Invalid pagination:**
```bash
# ?page=-1 or ?limit=200
# Should return 400
```

---

### Phase 4: Admin Views Single Dispute

**Endpoint:** `GET /api/admin/disputes/:id`

**Request:**
```bash
curl -X GET "http://localhost:5000/api/admin/disputes/disp-123" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "disp-123",
    "escrowId": "tx-123",
    "status": "in_review",
    "reason": "seller_non_compliance",
    "description": "The seller has not provided...",
    "initiatedBy": "buyer-id",
    "sellerResponse": "We have provided the inspection report...",
    "sellerEvidence": ["delivery-confirmation.pdf"],
    "firstResponseDeadline": "2026-03-14T06:50:00Z",
    "resolutionDeadline": "2026-03-16T06:50:00Z",
    "slaStatus": "on-track",
    "urgencyLevel": "normal",
    "hoursUntilDeadline": 42,
    "timeline": [
      {"type": "dispute_filed", "timestamp": "2026-03-13T06:50:00Z"},
      {"type": "seller_responded", "timestamp": "2026-03-13T08:20:00Z"}
    ]
  }
}
```

**Validation Checks:**
- ✅ Full dispute details returned
- ✅ Complete timeline shows all events
- ✅ Both buyer and seller evidence visible
- ✅ SLA status correctly calculated

---

### Phase 5: Admin Resolves Dispute

**Endpoint:** `PUT /api/escrow/:id/resolve-dispute`

**Request (admin only):**
```bash
curl -X PUT http://localhost:5000/api/escrow/tx-123/resolve-dispute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d {
    "resolution": "buyer_favor",
    "adminNotes": "After reviewing both parties' evidence, the seller failed to provide reasonable proof of delivery. Buyer's claim is substantiated. Full resolution in buyer's favor is warranted."
  }
```

**Expected Success Response (200):**
```json
{
  "success": true,
  "message": "Dispute resolved successfully",
  "data": {
    "id": "disp-123",
    "escrowId": "tx-123",
    "status": "resolved",
    "resolution": "buyer_favor",
    "resolvedBy": "admin-id",
    "resolvedAt": "2026-03-13T10:45:00Z",
    "adminNotes": "After reviewing both parties' evidence...",
    "timeline": [
      {"type": "dispute_filed", "timestamp": "2026-03-13T06:50:00Z"},
      {"type": "seller_responded", "timestamp": "2026-03-13T08:20:00Z"},
      {
        "type": "dispute_resolved",
        "timestamp": "2026-03-13T10:45:00Z",
        "resolvedBy": "admin-id",
        "resolution": "buyer_favor"
      }
    ]
  }
}
```

**Validation Checks for Each Resolution Type:**

1. **buyer_favor:**
   - ✅ Dispute status = 'resolved'
   - ✅ Escrow status → 'completed'
   - ✅ Both parties notified with resolution
   - ✅ Timeline updated

2. **seller_favor:**
   - ✅ Dispute status = 'resolved'
   - ✅ Escrow status → 'completed'
   - ✅ Both parties notified

3. **full_refund:**
   - ✅ Dispute status = 'resolved'
   - ✅ Escrow status → 'refunded'
   - ✅ Payment refund initiated
   - ✅ Both parties notified

4. **partial_refund:**
   - ✅ Dispute status = 'resolved'
   - ✅ Escrow status → 'refunded'
   - ✅ Partial refund amount transferred
   - ✅ Both parties notified

**Error Cases:**

1. **Non-admin tries to resolve:**
```bash
# Use buyer token
# Should return 403
```
Expected: `Only admins can resolve disputes`

2. **Invalid resolution type:**
```bash
"resolution": "invalid_type"
# Should return 400
```
Expected: `Invalid resolution type`

3. **Admin notes too short:**
```bash
"adminNotes": "short"
# Should return 400
```
Expected: `Admin notes must be at least 10 characters`

4. **Dispute already resolved:**
```bash
# Try to resolve a second time
# Should return 400
```
Expected: `Dispute is already resolved or closed`

---

### Phase 6: Admin Escalates Dispute (Optional)

**Endpoint:** `POST /api/escrow/:id/dispute-escalate`

**Request (before dispute is resolved):**
```bash
curl -X POST http://localhost:5000/api/escrow/tx-123/dispute-escalate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d {
    "escalationReason": "High-value transaction ($500k) with conflicting evidence from both parties. Requires legal team review before final resolution."
  }
```

**Expected Success Response (200):**
```json
{
  "success": true,
  "message": "Dispute escalated successfully",
  "data": {
    "id": "disp-123",
    "escrowId": "tx-123",
    "status": "escalated",
    "escalatedBy": "admin-id",
    "escalatedAt": "2026-03-13T09:30:00Z",
    "timeline": [
      {"type": "dispute_filed", "timestamp": "2026-03-13T06:50:00Z"},
      {"type": "seller_responded", "timestamp": "2026-03-13T08:20:00Z"},
      {
        "type": "dispute_escalated",
        "timestamp": "2026-03-13T09:30:00Z",
        "escalatedBy": "admin-id",
        "reason": "High-value transaction..."
      }
    ]
  }
}
```

**Validation Checks:**
- ✅ Dispute status = 'escalated'
- ✅ escalatedBy and escalatedAt recorded
- ✅ Admin group receives "critical" priority notification
- ✅ Timeline updated with escalation event
- ✅ Dispute still visible in admin list with escalation indicator

---

## Notification Validation

After each operation, validate notifications:

**After fileDispute():**
- [ ] Seller receives notification: "Property Dispute Filed by Buyer" (high priority)
- [ ] Admin group receives alert: "New Escrow Dispute Filed" (high priority)

**After submitSellerResponse():**
- [ ] Buyer receives notification: "Seller Response to Dispute"
- [ ] Admin group receives: "Dispute Ready for Resolution" (high priority)

**After resolveDispute():**
- [ ] Buyer receives notification with resolution
- [ ] Seller receives notification with resolution

**After escalateDispute():**
- [ ] Admin group receives: "Dispute Escalated" (critical priority)

---

## Database Validation

Check the database after key operations:

```sql
-- Check dispute record created
SELECT * FROM "DisputeResolution" WHERE "escrowId" = 'tx-123';

-- Check timeline entries
SELECT * FROM "DisputeResolution" WHERE id = 'disp-123' \G

-- Check escrow status updated
SELECT id, status FROM "EscrowTransaction" WHERE id = 'tx-123';

-- Check notifications sent
SELECT * FROM "Notification" 
WHERE "createdAt" > NOW() - INTERVAL 5 MINUTE
ORDER BY "createdAt" DESC;
```

---

## Summary Checklist

- [ ] Phase 1: Buyer files dispute successfully
- [ ] Phase 1: Dispute has correct SLA deadlines (24h & 72h)
- [ ] Phase 1: Notifications sent to seller and admin
- [ ] Phase 2: Seller can submit response within 24h window
- [ ] Phase 2: Dispute status changes to 'in_review'
- [ ] Phase 3: Admin can list disputes with SLA indicators
- [ ] Phase 3: SLA status calculations accurate (on-track/at-risk/overdue)
- [ ] Phase 4: Admin can view full dispute details
- [ ] Phase 5: Admin can resolve with all 4 resolution types
- [ ] Phase 5: Escrow status updates appropriately per resolution type
- [ ] Phase 5: Both parties receive resolution notifications
- [ ] Phase 6: Admin can escalate complex disputes
- [ ] Phase 6: Escalation marked in timeline
- [ ] Timeline audit trail complete for all events
- [ ] All error cases handled with proper HTTP status codes

---

## Performance Notes

- SLA calculations should be < 10ms per dispute
- Admin disputes list should load < 500ms for 1000+ disputes
- Notifications should deliver within 5 seconds
- Database queries should use indexes on escrowId, status, firstResponseDeadline
