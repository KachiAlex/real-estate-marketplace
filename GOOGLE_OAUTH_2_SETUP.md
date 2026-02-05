# Google OAuth 2.0 Authentication Setup

## Overview
We've completely removed Firebase authentication and replaced it with custom Google OAuth 2.0 + JWT system.

**Benefits:**
- ✅ No Firebase dependency
- ✅ Google Sign-In works directly
- ✅ Complete control over authentication
- ✅ Free tier (Google OAuth is free)

---

## Step 1: Get Google OAuth 2.0 Credentials

### A. Go to Google Cloud Console
1. Navigate to: https://console.cloud.google.com
2. Create a new project (or use existing one)
3. Name: "Property Marketplace" (or your choice)
4. Click "Create"

### B. Enable Google+ API
1. Go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click on it and click "Enable"

### C. Create OAuth 2.0 Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. Choose "Web application"
4. Add Authorized redirect URIs:
   ```
   http://localhost:3000
   https://propertyark.netlify.app
   https://your-domain.com
   ```
5. Click "Create"
6. Copy the **Client ID** (you'll need this)

---

## Step 2: Configure Environment Variables

### Frontend (.env or .env.local)
```env
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id-here
REACT_APP_API_URL=http://localhost:5001
```

**Get Client ID from:** Google Cloud Console → Credentials → OAuth 2.0 Client ID

### Backend (backend/.env)
```env
# JWT Configuration (already set)
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-jwt-refresh-secret

# Google OAuth Configuration
GOOGLE_CLIENT_ID=same-as-frontend-client-id
NODE_ENV=development
```

---

## Step 3: Install Dependencies

### Backend
The backend needs `google-auth-library` to verify Google tokens:

```bash
cd backend
npm install google-auth-library
```

This library:
- Verifies Google OAuth tokens are legitimate
- Prevents fake tokens from being used
- Handles token expiration

### Frontend
Google OAuth library loads automatically from CDN (no npm install needed).

---

## Step 4: How It Works

### Registration/Login Flow
```
User clicks "Sign in with Google"
  ↓
Google OAuth popup opens
  ↓
User authenticates with Google
  ↓
Google returns ID Token to frontend
  ↓
Frontend sends token to backend (/api/auth/jwt/google)
  ↓
Backend verifies token using google-auth-library
  ↓
Backend creates/updates user in PostgreSQL
  ↓
Backend returns JWT tokens to frontend
  ↓
Frontend stores tokens in localStorage
  ↓
User is logged in ✓
```

### New User Auto-Creation
When a user signs in with Google for the first time:
1. Backend verifies Google token
2. Extracts: email, name, profile picture
3. Creates new user in PostgreSQL automatically
4. Returns JWT tokens

### Existing User
When a user who already has an account signs in:
1. Backend finds user by email
2. Updates profile picture (if available)
3. Returns JWT tokens

---

## Step 5: Files Changed

### New Files Created
```
src/config/googleOAuth.js
  ├─ initializeGoogleOAuth()
  ├─ renderGoogleSignInButton()
  ├─ signInWithGooglePopup()
  ├─ decodeGoogleToken()
  └─ getGoogleUserInfo()

backend/routes/auth-jwt.js (updated)
  └─ Added POST /api/auth/jwt/google endpoint
```

### Files Modified
```
src/contexts/AuthContext-new.js
  └─ Added signInWithGoogle() method

src/pages/LoginNew.js
  └─ Added Google Sign-In button
  └─ Added Google button rendering
  └─ Added handleGoogleSignIn callback

backend/package.json
  └─ Added google-auth-library dependency
```

---

## Step 6: Testing Google Sign-In

### Local Development
1. Start backend: `npm run dev` (from backend folder)
2. Start frontend: `npm start` (from root folder)
3. Go to http://localhost:3000/login
4. Click "Sign in with Google"
5. Authenticate with your Google account
6. You should be logged in!

### Troubleshooting

**Problem:** "Google OAuth not initialized"
- Solution: Check `REACT_APP_GOOGLE_CLIENT_ID` is set in .env
- Solution: Wait for page to load completely

**Problem:** "Invalid or expired Google token"
- Solution: This is normal if token is old (> 1 hour)
- Solution: Just sign in again

**Problem:** "User not found after Google sign-in"
- Solution: Backend creates user automatically
- Check PostgreSQL connection is working
- Check logs for error message

**Problem:** Google button not showing
- Solution: Refresh page
- Solution: Check browser console for errors
- Solution: Verify REACT_APP_GOOGLE_CLIENT_ID is correct

---

## Step 7: Deploy to Production

### Frontend (Netlify)
1. Add environment variable in Netlify:
   - Go to Site Settings → Build & Deploy → Environment
   - Add `REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id`

### Backend (Render)
1. Add environment variable in Render:
   - Go to Environment → Environment Variables
   - Add `GOOGLE_CLIENT_ID=your-google-client-id`

### Google Cloud Console
1. Update Authorized redirect URIs:
   - Go back to Google Cloud Console
   - Credentials → OAuth 2.0 Client ID
   - Add your production domains:
     ```
     https://propertyark.netlify.app
     https://your-backend-url.render.com
     https://your-custom-domain.com
     ```

---

## API Endpoint Reference

### Google Token Exchange
```
POST /api/auth/jwt/google

Request:
{
  "googleToken": "<google-id-token-from-frontend>"
}

Response:
{
  "success": true,
  "accessToken": "<jwt-token>",
  "refreshToken": "<jwt-refresh-token>",
  "user": {
    "id": "uuid",
    "email": "user@gmail.com",
    "firstName": "John",
    "lastName": "Doe",
    "avatar": "https://...",
    "role": "user",
    "isVerified": true
  }
}
```

---

## Security Notes

✅ **Token Verification:** Backend verifies Google tokens before accepting them
✅ **No Fake Tokens:** `google-auth-library` prevents man-in-the-middle attacks
✅ **HTTPS Only:** Always use HTTPS in production
✅ **Token Expiry:** JWT access tokens expire in 30 days
✅ **Secure Storage:** Tokens stored in browser localStorage (secure in HTTPS)

---

## What's Different from Firebase?

| Feature | Firebase Auth | Our JWT + Google OAuth |
|---------|---------------|------------------------|
| Cost | $25-100+/month | FREE |
| Setup | Complex | Simple (one env var) |
| Control | Google's rules | Your rules |
| Token Type | Firebase tokens | JWT tokens |
| User Storage | Firestore | PostgreSQL ✓ |
| Sign-In Methods | Google, Email, etc. | Email/Password + Google |
| Multi-tenancy | Available | You can build it |

---

## Extending Google Auth

### Add More Sign-In Methods
Coming soon:
- [ ] GitHub OAuth
- [ ] Microsoft Account
- [ ] Apple Sign-In

### Add Features
- [ ] Password reset via email
- [ ] Email verification
- [ ] Two-factor authentication (2FA)
- [ ] LinkedIn OAuth for agents
- [ ] Social login on mobile app

---

## Quick Reference

**Google OAuth Library:** google-auth-library
**Frontend Config File:** src/config/googleOAuth.js
**Backend Endpoint:** POST /api/auth/jwt/google
**Environment Variable:** REACT_APP_GOOGLE_CLIENT_ID (frontend), GOOGLE_CLIENT_ID (backend)
**User Model:** Still PostgreSQL User table
**Token Type:** JWT (30 days expiry)

---

## Next Steps

1. ✅ Get Google Client ID from Google Cloud Console
2. ✅ Add to .env files (frontend + backend)
3. ✅ Run `npm install google-auth-library` in backend
4. ✅ Test Google sign-in locally
5. ✅ Deploy to Render + Netlify
6. ✅ Update Google Cloud Console authorized domains
7. ✅ Test on production

---

**Status:** ✅ Google OAuth 2.0 Ready to Use

**Time to complete:** 15-20 minutes
**Cost:** FREE
**Firebase Dependency:** REMOVED ✓
