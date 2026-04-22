# Vercel Hobby Plan Fix - Consolidated Endpoints

## Problem
Vercel Hobby plan has a limit of 12 serverless functions. We had exactly 12, and adding debug endpoints would exceed the limit.

## Solution
Consolidated admin and debug functions into a single endpoint: `/api/admin`

---

## Current Serverless Functions (11 total)

1. `api/csrf-token.js`
2. `api/properties.js`
3. `api/admin.js` ⭐ **NEW - Consolidated endpoint**
4. `api/auth/forgot-password.js`
5. `api/auth/login.js`
6. `api/auth/register.js`
7. `api/auth/reset-password.js`
8. `api/auth/jwt/me.js`
9. `api/upload/vendor/kyc.js`
10. `api/upload/vendor/kyc/signed.js`
11. `api/utils/sendEmail.js` (utility, not a function)

**Removed:**
- ❌ `api/hello.js` (not needed)
- ❌ `api/migrations/add-password-reset-columns.js` (not actively used)
- ❌ `api/admin/setup-database.js` (consolidated into api/admin.js)

---

## New Consolidated Admin Endpoint

**Base URL:** `/api/admin`

### 1. Setup Database
**Adds missing columns to users table**

```bash
POST /api/admin?action=setup-database
```

**Response:**
```json
{
  "success": true,
  "message": "Database setup completed",
  "results": [
    { "step": "add_column_phone", "status": "created" },
    { "step": "add_column_resettoken", "status": "created" },
    { "step": "add_column_resettokenexpiry", "status": "created" }
  ]
}
```

### 2. Check Password Format
**Verify if a user's password is bcrypt-hashed**

```bash
GET /api/admin?action=check-password&email=user@example.com
```

**Response:**
```json
{
  "found": true,
  "email": "user@example.com",
  "passwordHash": "$2a$10$abcdefghij...",
  "isBcryptHash": true,
  "message": "Password is bcrypt-hashed (correct format)"
}
```

### 3. Rehash Password
**Update a user's password with bcrypt hashing**

```bash
POST /api/admin?action=rehash-password
Content-Type: application/json

{
  "email": "user@example.com",
  "newPassword": "NewSecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password updated for user@example.com",
  "email": "user@example.com"
}
```

---

## Updated Instructions for Password Rehashing

### Using Browser Console:

```javascript
fetch('https://real-estate-marketplace-delta.vercel.app/api/admin?action=rehash-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'onyedika.akoma@gmail.com',
    newPassword: 'YourNewPassword123'
  })
})
.then(r => r.json())
.then(data => console.log('✅ Result:', data))
.catch(err => console.error('❌ Error:', err));
```

### Using curl:

```bash
curl -X POST 'https://real-estate-marketplace-delta.vercel.app/api/admin?action=rehash-password' \
  -H "Content-Type: application/json" \
  -d '{"email":"onyedika.akoma@gmail.com","newPassword":"YourNewPassword123"}'
```

---

## Benefits of Consolidation

1. ✅ Stays within Vercel Hobby plan limit (11/12 functions used)
2. ✅ Room for 1 more serverless function if needed
3. ✅ Easier to manage admin operations
4. ✅ Single endpoint for all admin tasks
5. ✅ Reduced deployment complexity

---

## Testing Checklist

After deployment:

- [ ] Wait for Vercel deployment to complete
- [ ] Test setup-database: `POST /api/admin?action=setup-database`
- [ ] Test check-password: `GET /api/admin?action=check-password&email=...`
- [ ] Test rehash-password: `POST /api/admin?action=rehash-password`
- [ ] Test login with rehashed password
- [ ] Verify all other endpoints still work

---

## Future Considerations

If you need more than 12 serverless functions:

1. **Upgrade to Pro Plan** ($20/month) - unlimited functions
2. **Further Consolidation** - combine more endpoints
3. **Use Edge Functions** - different limit
4. **Move to Backend Server** - single Express server instead of serverless

For now, we have room for 1 more function if needed!

