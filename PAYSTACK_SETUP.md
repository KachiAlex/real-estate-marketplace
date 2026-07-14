# Paystack Setup for Local Development

## Test API Keys

Your Paystack test keys have been provided:

- **Secret Key**: `sk_test_0bc8b42c70ec2955ac5d61a4b36f463ab47368fb`
- **Public Key**: `pk_test_b03deeb7e613d20289b6523d13f9ad311602c2b3`

## Setup Instructions

### Option 1: Add to `.env` file (Recommended)

1. Open or create `.env` file in the project root
2. Add these lines:

```env
PAYSTACK_SECRET_KEY=sk_test_0bc8b42c70ec2955ac5d61a4b36f463ab47368fb
PAYSTACK_PUBLIC_KEY=pk_test_b03deeb7e613d20289b6523d13f9ad311602c2b3
```

3. Save the file (it's already in `.gitignore`, so it won't be committed)

### Option 2: Set via PowerShell (Temporary)

Run this in PowerShell before starting the backend:

```powershell
$env:PAYSTACK_SECRET_KEY='sk_test_0bc8b42c70ec2955ac5d61a4b36f463ab47368fb'
$env:PAYSTACK_PUBLIC_KEY='pk_test_b03deeb7e613d20289b6523d13f9ad311602c2b3'
$env:NODE_ENV='development'
$env:USE_LOCAL_DB='true'
npm start
```

Or use the provided script:

```powershell
.\backend\set-paystack-keys.ps1
npm start
```

## Verification

After setting the keys, restart your backend server. You should see in the logs:

```
✅ Paystack service initialized with test keys
```

Then test the subscription payment flow:

1. Navigate to Vendor Dashboard → Subscription tab
2. Click "Subscribe now"
3. The Paystack modal should initialize without the "Invalid key" error

## Testing Payments

Use these Paystack test card details:

- **Card Number**: 4084084084084081
- **Expiry**: 12/30
- **CVV**: 408
- **OTP**: 123456

## Important Notes

⚠️ **Security:**
- Never commit these keys to git (they're in `.gitignore`)
- These are test keys only - safe for development
- Use different keys for production
- Rotate keys periodically

✅ **Next Steps:**
1. Add keys to `.env` file
2. Restart backend server
3. Test subscription payment flow
