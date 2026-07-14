# Password Reset Diagnostic Checklist

This checklist addresses the suggestions you received, adapted for your **custom password reset implementation**.

## Current Setup Overview

- **Implementation Type:** Custom backend password reset (NOT Firebase Auth native)
- **Endpoint:** `/api/auth/forgot-password` (custom)
- **Database:** Firestore (stores reset tokens)
- **Email Service:** Custom email service (SendGrid/Nodemailer)
- **Frontend:** React web app + React Native mobile app

## Diagnostic Checklist

### 1. Backend/API Configuration

#### ✅ Check 1.1: API Endpoint Availability
**Action:** Test the endpoint directly

```bash
curl -X POST https://your-api-url/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**Expected:** 200 OK with `{"success": true, "message": "..."}`

**If 500 error:**
- Check Cloud Run logs
- Verify route is registered correctly in `backend/server.js`
- Check middleware isn't blocking the request

#### ✅ Check 1.2: Backend Environment Variables
**Action:** Verify these are set in your backend environment

```javascript
// Required environment variables:
FRONTEND_URL=https://real-estate-marketplace-37544.web.app
SENDGRID_API_KEY=your_key_here  // or NODEMAILER config
DATABASE_URL=your_firestore_connection
```

**Check location:**
- Cloud Run service environment variables
- `.env` file (if local)
- Secret Manager (if using)

#### ✅ Check 1.3: Backend Error Logs
**Action:** Check Cloud Run logs for actual errors

```bash
# View recent logs
gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" --limit 50 --format json

# Or check Firebase Console → Functions/Cloud Run → Logs
```

**Look for:**
- Database connection errors
- Email service errors
- Token generation failures
- Missing environment variables

### 2. Database/Firestore Configuration

#### ✅ Check 2.1: Firestore Write Permissions
**Action:** Verify backend service account can write to Firestore

**Check:**
- Service account has `Firestore User` or `Cloud Datastore User` role
- Firestore security rules allow writes (or backend bypasses rules)
- User collection is accessible

**Test:** Check if token is being saved
```javascript
// After password reset request, check Firestore:
// users/{userId}/resetPasswordToken should exist
```

#### ✅ Check 2.2: User Document Structure
**Action:** Verify user documents have reset token fields

**Required fields:**
- `resetPasswordToken` (string, hashed)
- `resetPasswordExpires` (timestamp)

**Check code:** `backend/services/userService.js` - `updateUser` method

### 3. Email Service Configuration

#### ✅ Check 3.1: Email Service API Key
**Action:** Verify SendGrid (or your email service) is configured

**For SendGrid:**
- API key is valid and has sending permissions
- Sender email is verified
- Domain authentication is set up (if using custom domain)

**Test email sending:**
```javascript
// Test directly in your backend
const emailResult = await emailService.sendEmail(
  'test@example.com',
  'Test Subject',
  'Test HTML',
  'Test Text'
);
console.log(emailResult);
```

#### ✅ Check 3.2: Email Service Quotas
**Action:** Check if you've hit sending limits

- SendGrid: Check dashboard for quota/usage
- Verify account isn't suspended
- Check for rate limiting errors in logs

#### ✅ Check 3.3: Email Template
**Action:** Verify reset email contains correct URL

**Current template location:** `backend/routes/auth.js` (lines 407-419)

**Verify:**
- Reset URL format: `${frontendUrl}/reset-password?token=...&email=...`
- Frontend URL matches deployed URL
- Email renders correctly (HTML + text versions)

### 4. Frontend Configuration

#### ✅ Check 4.1: API URL Configuration
**Action:** Verify frontend calls correct backend URL

**Check:** `src/pages/ForgotPassword.js` - `getApiUrl()` function

**Should match:**
- Your Cloud Run service URL
- Or API Gateway URL
- Ensure no CORS issues

#### ✅ Check 4.2: Frontend Error Handling
**Action:** Check browser console for actual errors

**Look for:**
- Network errors (CORS, 500, timeout)
- CORS preflight failures
- Incorrect API endpoint

**Test:** Open DevTools → Network tab → Submit forgot password form

#### ✅ Check 4.3: Reset Password Page Route
**Action:** Verify reset page is accessible

**URL format:** `/reset-password?token=...&email=...`

**Check:**
- Route is defined in `src/App.js`
- Page component exists (`src/pages/ResetPassword.js`)
- Token and email params are read correctly

### 5. Mobile App Configuration (If Applicable)

#### ✅ Check 5.1: Mobile API URL
**Action:** Verify mobile app uses correct backend URL

**Check:** `mobile-app/src/config/api.js` or similar

**Should match web backend URL**

#### ✅ Check 5.2: Deep Linking (If Using)
**Action:** If using custom reset links on mobile

**Required:**
- Deep link URL scheme configured
- URL handler in mobile app
- Test deep link opens app correctly

### 6. Security & Rate Limiting

#### ✅ Check 6.1: Rate Limiting
**Action:** Check if backend has rate limiting that's too aggressive

**Look for:**
- Express rate limit middleware
- Cloud Run rate limiting
- Email service rate limits

**Common issue:** Rate limit returns 500 instead of 429

#### ✅ Check 6.2: Token Security
**Action:** Verify token generation and validation

**Check:**
- Tokens are cryptographically random (crypto.randomBytes)
- Tokens are hashed before storing (SHA-256)
- Tokens expire after 1 hour (or configured time)
- Tokens are cleared after use

### 7. Integration Testing

#### ✅ Check 7.1: End-to-End Test
**Action:** Test full password reset flow

1. Submit forgot password form
2. Check email is received
3. Click reset link
4. Verify reset page loads
5. Submit new password
6. Try logging in with new password

**If any step fails:** Check logs for that specific step

#### ✅ Check 7.2: Error Scenarios
**Action:** Test error cases

- Invalid email format
- Non-existent email
- Expired token
- Invalid token
- Missing parameters

**Expected:** Appropriate error messages, no 500 errors

## Common 500 Error Causes (Custom Implementation)

### Cause 1: Database Connection Error
**Symptoms:**
- 500 error when finding user
- 500 error when saving token

**Fix:**
- Check Firestore service account credentials
- Verify network connectivity from Cloud Run
- Check Firestore quota/limits

### Cause 2: Email Service Error
**Symptoms:**
- 500 error when sending email
- Email not received

**Fix:**
- Verify SendGrid API key
- Check email service quota
- Verify sender email is authenticated

### Cause 3: Missing Environment Variable
**Symptoms:**
- 500 error on backend startup
- Undefined variable errors in logs

**Fix:**
- Set all required environment variables
- Check variable names match code
- Verify secrets are accessible

### Cause 4: Token Generation Failure
**Symptoms:**
- 500 error during token creation
- Crypto errors in logs

**Fix:**
- Verify crypto module is available
- Check random bytes generation
- Verify hashing function

### Cause 5: Route Not Registered
**Symptoms:**
- 404 or 500 when calling endpoint
- Route handler not found

**Fix:**
- Check route is registered before middleware
- Verify route path matches frontend call
- Check middleware order in `server.js`

## Quick Diagnostic Script

Create a test script to check your setup:

```javascript
// test-password-reset.js
const testPasswordReset = async () => {
  const API_URL = process.env.API_URL || 'your-api-url';
  const testEmail = 'test@example.com';
  
  try {
    const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', data);
    
    if (response.status === 500) {
      console.error('❌ 500 Error - Check backend logs');
    } else if (response.ok) {
      console.log('✅ Request successful');
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
};

testPasswordReset();
```

## Next Steps

1. **Run through checklist above**
2. **Check backend logs** for specific error messages
3. **Test endpoint directly** with curl/Postman
4. **Verify email service** is working
5. **Check Firestore** for token storage

## If Issues Persist

If you're still getting 500 errors after checking everything:

1. **Enable detailed logging:**
   ```javascript
   // Add to backend
   console.log('Full error:', error);
   console.log('Stack:', error.stack);
   console.log('Request:', req.body);
   ```

2. **Check Cloud Run metrics:**
   - Error rate
   - Request latency
   - Memory/CPU usage

3. **Consider migrating to Firebase Auth native** if issues are complex

## Migration to Firebase Auth Native

If you decide to migrate (see `PASSWORD_RESET_ANALYSIS.md`), you'll need to:

1. Update frontend to use `sendPasswordResetEmail`
2. Remove custom backend password reset endpoint
3. Update reset password page to use `confirmPasswordReset`
4. Handle migration of existing users

See `PASSWORD_RESET_ANALYSIS.md` for detailed migration steps.

