from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import os

content = """Payment Gateway Communication Overview

1. Overview
- Front end never handles raw card data.
- All payment initiation requests go through the backend (`/api/payments/...`) with JWT in `Authorization` headers.
- The backend orchestrates Paystack, Flutterwave, Stripe, and bank transfer flows via dedicated services.

2. Property Purchase (Escrow) Flow
1. User clicks “Proceed to Purchase (Escrow)” on the property detail page.
2. `EscrowPaymentFlow` loads the property, calculates the 0.5% escrow fee, and presents a multi-step form (Review → Payment Details → Confirmation).
3. The frontend posts to `POST /api/payments/initialize` with:
   - `amount`: property price
   - `paymentMethod`: `flutterwave | paystack | stripe | bank_transfer`
   - `paymentType`: `property_purchase`
   - `relatedEntity`: { type: "property", id: propertyId }
   - `description`, `currency`, other metadata
4. Backend validates payload, creates a `Payment` record, and routes it to the appropriate provider service.
5. Provider service sends the request to Paystack/Flutterwave/Stripe and returns authorization data.
6. Frontend redirects the user to the provider’s checkout (or uses Stripe client).
7. Webhooks (`/api/payments/webhook/:provider`) confirm success and update payment status.
8. Escrow transaction is created on backend (`/api/escrow`), fees/timeline are recorded, and the property is held for vendor documents.

3. Vendor Listing Fee (Registration)
- Admin sets `vendorListingFee` via `/api/admin/settings`.
- During vendor registration, we render `VendorRegistrationPayment`, which calls `/api/payments/initialize` with `paymentType = vendor_listing`.
- After payment success, we call `registerAsVendor` to assign the vendor role and save the payment reference.

4. Backend Payment Orchestration
- `backend/routes/payments.js` enforces authentication (JWT) and validation (`express-validator`).
- Provider metadata includes amount, fees, customer details, and `relatedEntity`.
- Provider services compute platform (2.5%) + processing (1.5%) fees before invoking Paystack/Flutterwave/Stripe.
- Webhooks verify signatures and change payment statuses to `completed`, `failed`, etc.

5. Escrow Transaction Creation
- `EscrowPaymentFlow` uses `createEscrowTransaction` (Escrow context).
- `POST /api/escrow` checks property availability, prevents duplicate escrows, calculates fees, and creates the transaction record.
- Escrow records expose timeline entries and can be retrieved via `/api/escrow/:id`.

6. Security & Compliance Notes
- JWT required on all backend payment routes (`Authorization: Bearer <token>`).
- Validation middleware catches missing/invalid data before provider calls.
- Webhooks verify provider signatures.
- Sensitive keys stored in `.env` (Paystack, Flutterwave, Stripe).
- Escrow/payment data kept in MongoDB; no provider secrets reach the browser.

7. Bank Integration Checklist
- Provide test credentials for Paystack/Flutterwave (or bank API).
- Configure webhook endpoint(s) at `/api/payments/webhook/:provider`.
- Validate flows using existing Cypress E2E coverage or mock data.
- Monitor transactions through admin dashboards and backend logs.
- Escrow flow demonstrates multi-step proof for compliance (review → hold funds → release).
"""

lines = content.split("\n")

os.makedirs("docs", exist_ok=True)
path = os.path.join("docs", "payment_gateway_overview.pdf")

width, height = letter
canvas_obj = canvas.Canvas(path, pagesize=letter)

y = height - 72
for line in lines:
    if y < 72:
        canvas_obj.showPage()
        y = height - 72
    canvas_obj.drawString(72, y, line)
    y -= 16

canvas_obj.save()
print("PDF generated at", path)

