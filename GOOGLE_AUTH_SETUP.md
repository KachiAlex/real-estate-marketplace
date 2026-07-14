# Google Authentication Setup Guide

## Overview
Google authentication is already implemented in the codebase. To activate it, you need to enable Google as a sign-in provider in your Firebase Console.

## Steps to Enable Google Authentication

### 1. Go to Firebase Console
1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `real-estate-marketplace-37544`

### 2. Enable Google Sign-In Provider
1. Navigate to **Authentication** in the left sidebar
2. Click on the **Sign-in method** tab
3. Find **Google** in the list of providers
4. Click on **Google** to open its configuration
5. Toggle the **Enable** switch to ON
6. Enter your project's **Support email** (required)
7. Click **Save**

### 3. Configure Authorized Domains (if needed)
1. Still in the **Sign-in method** tab
2. Scroll down to **Authorized domains**
3. Make sure your domain is listed:
   - `localhost` (for development)
   - `real-estate-marketplace-37544.web.app` (Firebase hosting)
   - `real-estate-marketplace-37544.firebaseapp.com` (Firebase hosting)
   - Your custom domain (if you have one)

### 4. Test Google Authentication
1. Run your application: `npm start`
2. Navigate to the Login or Register page
3. Click the **Google** button
4. You should see a Google sign-in popup
5. Sign in with your Google account
6. You should be redirected to the dashboard

## Troubleshooting

### Error: "Google sign-in is not enabled"
- **Solution**: Make sure you've enabled Google in Firebase Console (Step 2 above)

### Error: "This domain is not authorized"
- **Solution**: Add your domain to the authorized domains list (Step 3 above)

### Error: "Popup was blocked"
- **Solution**: Allow popups for your site in your browser settings
- The code will automatically fall back to redirect method if popup is blocked

### Error: "auth/operation-not-allowed"
- **Solution**: This means Google sign-in provider is not enabled in Firebase Console
- Follow Step 2 above to enable it

## Code Implementation

The Google authentication is implemented in:
- `src/contexts/AuthContext.js` - Main authentication logic
- `src/pages/Login.js` - Login page with Google button
- `src/pages/Register.js` - Register page with Google button

## Features

✅ Popup-based sign-in (default)
✅ Redirect-based sign-in (fallback when popup is blocked)
✅ Automatic user profile creation
✅ Integration with existing user roles
✅ Error handling with user-friendly messages
✅ Support for existing users (merges with mock users if email matches)

## Notes

- Google authentication uses Firebase Authentication
- User data is stored in localStorage after successful sign-in
- If a Google user's email matches an existing mock user, their roles are preserved
- New Google users default to `buyer` and `vendor` roles

