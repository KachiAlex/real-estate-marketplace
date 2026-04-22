# Critical Fixes Guide - Authentication & Database Issues

## Issues Fixed

### 1. Login 401 - Password Not Bcrypt-Hashed ✅
**Error**: `Login failed for onyedika.akoma@gmail.com: Password is not bcrypt-hashed`

**Root Cause**: Existing user passwords in the database are not bcrypt-hashed.

**Solution**: Use the debug endpoint to rehash the password.

### 2. Register 500 - Missing Phone Column ✅
**Error**: `column "phone" of relation "users" does not exist`

**Root Cause**: Database schema missing the `phone` column.

**Solution**: Updated register endpoint to check for phone column existence and handle gracefully.

### 3. Upload Endpoints 404 ✅
**Error**: `/api/upload/vendor/kyc` and `/api/upload/vendor/kyc/signed` not found

**Root Cause**: Missing serverless functions for KYC document upload.

**Solution**: Created mock upload endpoints that allow registration to proceed.

---

## Immediate Action Required

### Step 1: Run Database Setup (CRITICAL)

This will add missing columns to your database:

```bash
POST https://real-estate-marketplace-delta.vercel.app/api/admin/setup-database
```

**Expected Response**:
```json
{
  "success": true,
  "results": [
    { "step": "add_column_phone", "status": "created" },
    { "step": "add_column_resettoken", "status": "created" },
    { "step": "add_column_resettokenexpiry", "status": "created" }
  ]
}
```

### Step 2: Fix Existing User Password (CRITICAL)

For the user `onyedika.akoma@gmail.com`, rehash the password:

```bash
POST https://real-estate-marketplace-delta.vercel.app/api/debug/rehash-password
Content-Type: application/json

{
  "email": "onyedika.akoma@gmail.com",
  "newPassword": "YourNewSecurePassword123"
}
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Password updated for onyedika.akoma@gmail.com"
}
```

### Step 3: Test Login

Try logging in with the new password:

```bash
POST https://real-estate-marketplace-delta.vercel.app/api/auth/login
Content-Type: application/json

{
  "email": "onyedika.akoma@gmail.com",
  "password": "YourNewSecurePassword123"
}
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Step 4: Test Registration

Try registering a new user:

```bash
POST https://real-estate-marketplace-delta.vercel.app/api/auth/register
Content-Type: application/json

{
  "firstName": "Test",
  "lastName": "User",
  "email": "testuser@example.com",
  "password": "TestPassword123",
  "phone": "+1234567890"
}
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "token": "...",
    "user": { ... }
  }
}
```

---

## Testing Checklist

After deployment completes:

- [ ] Run `/api/admin/setup-database` to add missing columns
- [ ] Rehash password for existing user using `/api/debug/rehash-password`
- [ ] Test login with rehashed password
- [ ] Test new user registration
- [ ] Verify KYC upload endpoints return success (mock implementation)
- [ ] Check Vercel logs for any errors

---

## Database Schema Updates

The following columns will be added to the `users` table:

| Column | Type | Description |
|--------|------|-------------|
| `phone` | VARCHAR(20) | User phone number |
| `resettoken` | VARCHAR(255) | Password reset token |
| `resettokenexpiry` | TIMESTAMP | Reset token expiry time |

---

## Upload Endpoints (Mock Implementation)

The KYC upload endpoints are now implemented as mock endpoints that:
- Accept file upload requests
- Return success responses
- Allow registration to proceed
- Log upload attempts

**Production TODO**: Replace with actual cloud storage integration (S3, GCS, Azure Blob).

---

## Common Errors & Solutions

### Error: "Password is not bcrypt-hashed"
**Solution**: Use `/api/debug/rehash-password` to update the password.

### Error: "column 'phone' does not exist"
**Solution**: Run `/api/admin/setup-database` to add the column.

### Error: "Upload endpoint 404"
**Solution**: Redeploy the application (endpoints are now created).

### Error: "User already exists"
**Solution**: Use login instead of register, or use a different email.

---

## Security Notes

1. **Debug Endpoints**: The `/api/debug/*` endpoints should be removed or protected in production
2. **Password Rehashing**: Only use the rehash endpoint for fixing existing users
3. **New Users**: All new registrations automatically use bcrypt hashing
4. **Upload Security**: Mock upload endpoints should be replaced with proper cloud storage

---

## Next Steps

1. Wait for Vercel deployment to complete (~2-3 minutes)
2. Run database setup endpoint
3. Rehash existing user passwords
4. Test authentication flow
5. Implement proper file upload with cloud storage (production)
6. Remove or protect debug endpoints (production)

---

## Vercel Logs to Monitor

After deployment, check logs for:

✅ **Success Messages**:
```
✅ Login successful for user@example.com
📄 KYC document upload simulated: document.pdf
```

❌ **Error Messages**:
```
Login failed for user@example.com: Password is not bcrypt-hashed
Register error: column "phone" does not exist
```

---

## Production Deployment Checklist

Before going live:

- [ ] All database columns exist
- [ ] All existing user passwords are bcrypt-hashed
- [ ] Upload endpoints integrated with real cloud storage
- [ ] Debug endpoints removed or protected
- [ ] Email delivery configured (SendGrid)
- [ ] Environment variables set in Vercel
- [ ] Authentication flow tested end-to-end
- [ ] Error handling tested
- [ ] Security audit completed

