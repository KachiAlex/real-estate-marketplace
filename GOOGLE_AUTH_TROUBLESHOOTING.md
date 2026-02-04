# Google Authentication Troubleshooting Guide

## Quick Diagnosis

If Google login is not working, follow these steps:

### Step 1: Check Browser Console
1. Open your browser's Developer Tools (F12)
2. Go to the **Console** tab
3. Click the **Google** button on the login page
4. Look for error messages that start with `[AuthContext]` or `[Firebase Diagnostics]`
5. Note the exact error code and message

### Step 2: Run Diagnostics
When Google auth fails:
- A popup will ask: "Would you like to run a configuration check?"
- Click **OK** and check the console for detailed diagnostics
- Or manually run: `runFirebaseConfigDiagnostics()` in the console

### Step 3: Match Your Error

Find your error code below and follow the solution:

## Common Errors and Solutions

### 🔴 Error: `auth/operation-not-allowed`
**Message**: "Google sign-in is not enabled"

**Cause**: Google Sign-In provider is disabled in Firebase Console

**Solution**:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `real-estate-marketplace-37544`
3. Click **Authentication** in left sidebar
4. Click **Sign-in method** tab
5. Find **Google** in the provider list
6. **Click on Google** to expand it
7. Toggle the **Enable** switch to **ON**
8. Select a **Support email** from the dropdown (required)
9. Click **Save**
10. Refresh your application and try again

### 🔴 Error: `auth/unauthorized-domain`
**Message**: "This domain is not authorized for Google sign-in"

**Cause**: Your current domain is not in the authorized domains list

**Solution**:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `real-estate-marketplace-37544`
3. Click **Authentication** → **Sign-in method**
4. Scroll down to **Authorized domains**
5. Check what domains are listed and your current domain
6. Click **Add domain**
7. Enter your domain:
   - For localhost development: `localhost`
   - For Firebase Hosting: `real-estate-marketplace-37544.web.app`
   - For other domains: Enter your custom domain
8. Click **Add**
9. Refresh your application and try again

**Note**: It may take a few minutes for changes to propagate.

### 🔴 Error: `auth/popup-blocked`
**Message**: "Popup was blocked. Please allow popups for this site"

**Cause**: Your browser is blocking the Google sign-in popup

**Solution**:
1. **Allow Popups**:
   - Click the 🚫 popup icon in your browser's address bar
   - Select "Always allow popups for this site"
   - Refresh the page
2. **Try again**:
   - Click the Google button
   - The popup should now appear
3. **Alternative (Redirect Method)**:
   - The app will automatically try a redirect method if popup fails
   - This should work even with popup blocker enabled

### 🔴 Error: `auth/popup-closed-by-user`
**Message**: "Sign-in was cancelled"

**Cause**: You cancelled the Google sign-in popup

**Solution**: This is normal user behavior. Simply click Google again and complete the sign-in.

### 🔴 Error: `auth/account-exists-with-different-credential`
**Message**: "An account already exists with this email. Please sign in with your existing method"

**Cause**: Your email is already registered with email/password, not Google

**Solution**:
1. Click the **Email** login instead
2. Or use forgot password to reset and try Google login again

## Configuration Checklist

Before contacting support, verify:

- [ ] **Google Provider Enabled**
  - Firebase Console → Authentication → Sign-in method
  - Google provider shows "Enabled" status
  
- [ ] **Support Email Set**
  - Google provider settings have a Support email selected
  
- [ ] **Domain Authorized**
  - Your domain is in Authorized domains list
  - For localhost: `localhost` is listed
  - For Firebase Hosting: `real-estate-marketplace-37544.web.app` is listed
  
- [ ] **Browser Settings**
  - Popups are allowed for this site
  - Cookies are enabled
  - Not in private/incognito mode (some issues there)

- [ ] **Firebase Configuration**
  - `src/config/firebase.js` has correct API key
  - Environment variables are set (if using them)

## Manual Diagnostics in Console

Run these commands in your browser console (F12 → Console tab):

```javascript
// Check Firebase initialization
runFirebaseConfigDiagnostics()

// Check current domain
console.log('Current domain:', window.location.hostname);

// Check if Google is available
console.log('Google available:', typeof window.google);

// Check if Firebase is initialized
import { auth } from './config/firebase';
console.log('Firebase Auth:', !!auth);
```

## Testing Flow

### For Local Development (localhost)

1. Make sure `localhost` is in authorized domains
2. Run your app: `npm start` (should open http://localhost:3000)
3. Go to Login page
4. Click Google button
5. Sign in with a Google account
6. Should redirect to dashboard

### For Firebase Hosting

1. Make sure `real-estate-marketplace-37544.web.app` is authorized
2. Deploy your app: `firebase deploy`
3. Visit: https://real-estate-marketplace-37544.web.app
4. Go to Login page
5. Click Google button
6. Sign in with a Google account
7. Should redirect to dashboard

## Still Not Working?

If you've tried all above steps:

1. **Clear Browser Data**:
   - Clear cookies and cache for your domain
   - Try in an incognito/private window
   
2. **Check Firebase Console Logs**:
   - Firebase Console → Authentication → Sign-in method
   - Look for any recent error logs
   
3. **Verify API Keys**:
   - Firebase Console → Project Settings → General
   - Copy your Web API key
   - Check it matches `src/config/firebase.js`
   
4. **Wait for Propagation**:
   - Changes to Firebase can take 5-10 minutes
   - Wait and try again
   
5. **Contact Support**:
   - Provide:
     - Error code and message
     - Your domain
     - Screenshot of diagnostics output
     - Steps to reproduce

## How Google Auth Works in This App

```
User clicks "Google" button
    ↓
App tries popup sign-in with Google
    ↓
Google popup opens (or user is asked to switch from popup blocker warning)
    ↓
User signs in with Google account
    ↓
Google returns user profile (name, email, avatar)
    ↓
App creates/updates user in Firebase
    ↓
App checks if email matches existing mock user
    ↓
User redirected to dashboard
```

## Security Notes

- ✅ All Google auth is handled by Firebase (secure)
- ✅ No passwords are sent to servers
- ✅ User data is stored in Firebase (encrypted)
- ✅ User email is required and validated
- ✅ Auth tokens are automatically refreshed

## FAQ

**Q: Can I use the same email for Google and email/password login?**
A: No, Firebase requires different authentication methods per email. Choose one method per account.

**Q: Why do I see different error messages on different devices?**
A: Different browsers and domains may have different Firebase configurations.

**Q: Does Google login work on mobile?**
A: Yes! The app will automatically detect mobile and use redirect method instead of popup.

**Q: Why is localhost specifically mentioned for authorized domains?**
A: Firebase requires explicit authorization for local development. This is a security feature.

**Q: Can I use Google auth in production without Firebase Hosting?**
A: Yes, but you need to add your custom domain to authorized domains in Firebase Console.
