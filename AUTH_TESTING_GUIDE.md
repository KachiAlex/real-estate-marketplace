# Authentication Testing & Troubleshooting Guide

## Issues Fixed

### 1. Forgot Password - Missing Database Columns
**Problem**: `resettoken` and `resettokenexpiry` columns didn't exist in users table

**Solution**: Updated `/api/auth/forgot-password` to check for and create missing columns automatically

### 2. Login - Password Verification Issues
**Problem**: Existing users have non-bcrypt-hashed passwords

**Solution**: 
- Added password format validation in login endpoint
- Added detailed logging to identify issues
- Created debug endpoints to check and fix passwords

---

## Step-by-Step Testing Process

### Step 1: Setup Database Schema
Run this endpoint to ensure all required columns exist:

```bash
POST /api/admin/setup-database
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Database setup completed",
  "results": [
    { "step": "users_table", "status": "ok" },
    { "step": "add_column_resettoken", "status": "created" },
    { "step": "add_column_resettokenexpiry", "status": "created" },
    { "step": "password_format_check", "status": "warning" }
  ]
}
```

### Step 2: Check Existing User Password Format
For any existing user, check if their password is bcrypt-hashed:

```bash
GET /api/debug/check-passwords?email=user@example.com
```

**Expected Response**:
```json
{
  "found": true,
  "email": "user@example.com",
  "passwordHash": "$2a$10$abcdefghij...",
  "isBcryptHash": true,
  "message": "Password is bcrypt-hashed (correct format)"
}
```

**If `isBcryptHash: false`**, proceed to Step 3.

### Step 3: Rehash Password for Existing Users
If password is not bcrypt-hashed, update it:

```bash
POST /api/debug/rehash-password
Content-Type: application/json

{
  "email": "user@example.com",
  "newPassword": "newSecurePassword123"
}
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Password updated for user@example.com",
  "email": "user@example.com"
}
```

### Step 4: Test Login
Try logging in with the updated password:

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "newSecurePassword123"
}
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "email": "user@example.com",
      "role": "user",
      "isActive": true,
      "isVerified": false
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Check Vercel Logs** for:
```
✅ Login successful for user@example.com
```

### Step 5: Test Forgot Password
Request a password reset:

```bash
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Expected Response**:
```json
{
  "success": true,
  "message": "If that email exists, you will find a reset link in your inbox.",
  "devToken": "abc123def456..." // Only in development
}
```

**Check Vercel Logs** for:
```
Password reset token for user@example.com: abc123def456...
```

### Step 6: Test Reset Password
Use the token from Step 5 to reset the password:

```bash
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "abc123def456...",
  "newPassword": "anotherSecurePassword456"
}
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Password has been reset successfully. You can now login with your new password."
}
```

### Step 7: Test Login with New Password
Verify the reset worked:

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "anotherSecurePassword456"
}
```

Should return successful login response.

---

## Common Issues & Solutions

### Issue: Login returns 401 with hint about rehashing
**Error Response**:
```json
{
  "success": false,
  "message": "Invalid credentials",
  "hint": "Password needs to be rehashed. Use /api/debug/rehash-password"
}
```

**Solution**: Follow Step 3 above to rehash the password.

### Issue: Forgot password returns 500
**Check Vercel Logs** for:
```
error: column "resettoken" of relation "users" does not exist
```

**Solution**: Run Step 1 to setup database schema.

### Issue: User not found
**Check Vercel Logs** for:
```
Login failed: User not found for email user@example.com
```

**Solution**: Register a new user first:
```bash
POST /api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "user@example.com",
  "password": "securePassword123"
}
```

### Issue: Account deactivated
**Check Vercel Logs** for:
```
Login failed: Account deactivated for user@example.com
```

**Solution**: Update user's `isactive` field in database to `true`.

---

## New User Registration (Recommended)
For testing, create a fresh user with properly hashed password:

```bash
POST /api/auth/register
Content-Type: application/json

{
  "firstName": "Test",
  "lastName": "User",
  "email": "testuser@example.com",
  "password": "testPassword123",
  "phone": "+1234567890"
}
```

This will automatically create a user with bcrypt-hashed password.

---

## Vercel Deployment Notes

After pushing changes:
1. Vercel will automatically deploy
2. Wait for deployment to complete (~2-3 minutes)
3. Check deployment logs for any errors
4. Run Step 1 (setup-database) once after deployment
5. Test authentication flow

---

## Security Notes

- `/api/debug/*` endpoints should be removed or protected in production
- `devToken` in forgot-password response should only appear in development
- Always use HTTPS in production
- Consider adding rate limiting to auth endpoints
- Implement email sending for password reset (currently just logs token)

