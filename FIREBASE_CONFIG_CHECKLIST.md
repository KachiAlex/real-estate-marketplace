# Firebase Configuration Checklist for Password Reset

Use this checklist to ensure Firebase is properly configured for password reset functionality.

## ✅ Pre-Migration Checklist

### 1. Verify Firebase Project
- [ ] Project ID: `real-estate-marketplace-37544`
- [ ] Access Firebase Console: https://console.firebase.google.com/project/real-estate-marketplace-37544


### 2. Verify API Key Configuration
**Location:** Firebase Console → Project Settings → General → Your apps

- [ ] Check Web App API Key matches `src/config/firebase.js`
- [ ] Current API Key: `AIza...REDACTED`
- [ ] Verify authDomain: `real-estate-marketplace-37544.firebaseapp.com`

**How to verify:**
1. Open Firebase Console
2. Go to Project Settings (gear icon)
3. Scroll to "Your apps" section
4. Check Web App config matches your code

### 3. Authorized Domains (CRITICAL)
**Location:** Firebase Console → Authentication → Settings → Authorized Domains

**Required domains (add if missing):**
- [ ] `localhost` (for local development)
- [ ] `real-estate-marketplace-37544.firebaseapp.com` (Firebase hosting)
- [ ] `real-estate-marketplace-37544.web.app` (Firebase hosting)
- [ ] Your custom domain (if you have one)

**How to add:**
1. Go to Authentication → Settings
2. Scroll to "Authorized domains"
3. Click "Add domain"
4. Enter domain and click "Add"

**⚠️ Important:** Without these domains, password reset emails won't work!

### 4. Password Reset Email Template
**Location:** Firebase Console → Authentication → Templates → Password Reset

- [ ] Template exists and is enabled
- [ ] Action URL is set correctly: `https://real-estate-marketplace-37544.web.app/reset-password`
- [ ] Email subject is appropriate
- [ ] Email body is customized (optional but recommended)

**How to configure:**
1. Go to Authentication → Templates
2. Click on "Password reset"
3. Verify/customize email content
4. Ensure "Action URL" points to your reset password page

**Action URL Format:**
```
https://real-estate-marketplace-37544.web.app/reset-password
```

### 5. Enable Required APIs
**Location:** Google Cloud Console → APIs & Services → Enabled APIs

**Required APIs:**
- [ ] **Identity Toolkit API** (enabled)
- [ ] **Firebase Authentication API** (enabled)
- [ ] **Identity and Access Management API** (enabled)

**How to enable:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: `real-estate-marketplace-37544`
3. Go to "APIs & Services" → "Library"
4. Search for each API above
5. Click "Enable" if not already enabled

### 6. Email/Password Provider
**Location:** Firebase Console → Authentication → Sign-in method

- [ ] Email/Password provider is enabled
- [ ] "Email link (passwordless sign-in)" can be disabled (optional)
- [ ] "Password" option should be enabled

**How to verify:**
1. Go to Authentication → Sign-in method
2. Find "Email/Password"
3. Ensure it's enabled
4. Click to see settings

### 7. Frontend Configuration
**File:** `src/config/firebase.js`

- [ ] Firebase config is correct
- [ ] API key matches Firebase Console
- [ ] Project ID matches: `real-estate-marketplace-37544`
- [ ] Auth domain matches: `real-estate-marketplace-37544.firebaseapp.com`

## 🧪 Testing Checklist

After configuration, test the flow:

### Test 1: Request Password Reset
- [ ] Navigate to `/forgot-password`
- [ ] Enter a valid email address
- [ ] Submit form
- [ ] Verify success message appears
- [ ] Check email inbox for reset link

### Test 2: Reset Link Email
- [ ] Email is received from Firebase (noreply@firebaseapp.com or similar)
- [ ] Email contains reset link
- [ ] Link format: `https://your-domain.com/reset-password?mode=resetPassword&oobCode=...`

### Test 3: Reset Password Page
- [ ] Click reset link in email
- [ ] Page loads at `/reset-password`
- [ ] Password form is visible
- [ ] No errors about invalid link

### Test 4: Complete Password Reset
- [ ] Enter new password (minimum 6 characters)
- [ ] Confirm password matches
- [ ] Submit form
- [ ] Success message appears
- [ ] Redirected to login page

### Test 5: Login with New Password
- [ ] Go to login page
- [ ] Enter email and new password
- [ ] Successfully log in

### Test 6: Error Handling
- [ ] Test with invalid email format
- [ ] Test with non-existent email (should still show success)
- [ ] Test with expired reset link
- [ ] Test with weak password (< 6 characters)
- [ ] Verify appropriate error messages

## 🚨 Common Issues & Solutions

### Issue: "Invalid or expired reset link"
**Possible causes:**
- Link is actually expired (> 1 hour old)
- Authorized domain not configured
- Wrong action URL in email template

**Solution:**
- Check authorized domains
- Verify email template action URL
- Request new reset link

### Issue: Email not received
**Possible causes:**
- Email went to spam
- Email provider blocking Firebase emails
- Too many requests (rate limiting)

**Solution:**
- Check spam folder
- Wait a few minutes
- Try again later if rate limited

### Issue: "This domain is not authorized"
**Solution:**
- Add domain to authorized domains list
- Wait a few minutes for changes to propagate
- Clear browser cache

### Issue: "API key invalid"
**Solution:**
- Verify API key in `src/config/firebase.js` matches Firebase Console
- Check API key restrictions in Google Cloud Console
- Ensure Identity Toolkit API is enabled

## 📝 Post-Migration Notes

### Backend Cleanup (Optional)
After confirming migration works, you can:

1. **Deprecate custom endpoints** (keep for now if users have pending resets):
   - `POST /api/auth/forgot-password`
   - `POST /api/auth/reset-password`

2. **Remove Firestore fields** (optional, after all reset links expire):
   - `resetPasswordToken`
   - `resetPasswordExpires`

3. **Keep email service** for other emails (notifications, etc.)

### Monitoring

Monitor these in Firebase Console:
- Authentication → Users → View user activity
- Authentication → Settings → Usage → View usage stats
- Check for errors in browser console

## ✅ Final Verification

- [ ] All configuration items checked
- [ ] All tests passed
- [ ] No console errors
- [ ] Email received and link works
- [ ] Password reset completes successfully
- [ ] Can login with new password

## 📞 Support

If issues persist:

1. Check Firebase Console → Authentication → Logs
2. Check browser console for error codes
3. Verify all configuration items above
4. Check Firebase status page: https://status.firebase.google.com/

## 📚 Resources

- [Firebase Auth Password Reset Docs](https://firebase.google.com/docs/auth/web/manage-users#send_a_password_reset_email)
- [Firebase Auth Error Codes](https://firebase.google.com/docs/auth/admin/errors)
- [Firebase Console](https://console.firebase.google.com/project/real-estate-marketplace-37544)

