# PropertyArk Deployment Status & Troubleshooting Guide

## Current Status: Build Failure (Vercel Cache Issue)

### Build Error
```
SyntaxError: /vercel/path0/src/utils/apiConfig.js: Identifier 'getApiBaseUrl' has already been declared. (46:13)
```

**Root Cause**: Vercel's build cache contains an old version of `apiConfig.js` with duplicate `getApiBaseUrl` declarations. The current source code is correct.

**Solution**: The fix has been committed (commit `1fc0770`). Vercel needs to clear its build cache and rebuild.

---

## Architecture Overview

### Backend
- **Location**: Vercel serverless functions under `/api/` directory
- **Database**: PostgreSQL on Render (connection via `DATABASE_URL`)
- **API Base URL**: Same-origin `/api/` (no external URL needed)
- **Authentication**: JWT tokens with bcrypt password hashing

### Frontend
- **Location**: React app deployed on Vercel
- **API Client**: Uses relative `/api/` paths for all backend calls
- **CORS**: Configured to allow `https://real-estate-marketplace-delta.vercel.app`

---

## Known Issues & Solutions

### 1. Login Returns 401 (Unauthorized)
**Problem**: Password verification failing even with correct credentials

**Root Cause**: Existing users in the database likely have plain-text or incompatibly-hashed passwords

**Debug Steps**:
1. Check if password is bcrypt-hashed:
   ```
   GET /api/debug/check-passwords?email=user@example.com
   ```
   Response will show if password is bcrypt-hashed or needs rehashing

2. If password needs rehashing, use:
   ```
   POST /api/debug/rehash-password
   Body: { "email": "user@example.com", "newPassword": "newPassword123" }
   ```

3. Try login again with the new password

**Permanent Fix**: All new registrations use bcrypt hashing (register.js is correct)

---

### 2. Vercel Build Cache Issue
**Problem**: Build fails with duplicate declaration error even though source is correct

**Solution**: 
1. Clear Vercel build cache in project settings
2. Trigger a new deployment
3. Or wait for next automatic deployment

---

### 3. CORS Errors (if still occurring)
**Status**: Should be fixed - Vercel domain added to CORS allowed origins

**Verification**:
- Check `backend/config/security.js` for `https://real-estate-marketplace-delta.vercel.app`
- Check `backend/server.js` for CORS configuration

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/jwt/me` - Get current user info
- `POST /api/auth/jwt/refresh` - Refresh JWT token

### Debug (Development Only)
- `GET /api/debug/check-passwords?email=...` - Check password hash format
- `POST /api/debug/rehash-password` - Rehash password for existing user

### Other Endpoints
- `GET /api/csrf-token` - Get CSRF token
- `GET /api/properties` - List properties
- `GET /api/users/profile` - Get user profile
- `POST /api/upload/vendor/kyc` - Upload KYC documents (not yet implemented)

---

## Environment Variables Required

```
DATABASE_URL=postgresql://...
JWT_SECRET=...
PAYSTACK_SECRET_KEY=...
PAYSTACK_PUBLIC_KEY=...
REACT_APP_PAYSTACK_PUBLIC_KEY=...
REACT_APP_GOOGLE_CLIENT_ID=...
```

---

## Next Steps

1. **Clear Vercel Cache**: Go to Vercel project settings → Deployments → Clear cache
2. **Trigger Rebuild**: Push a new commit or manually redeploy
3. **Test Login**: Use debug endpoints to verify password hashing
4. **Implement Missing Endpoints**: 
   - `api/upload/vendor/kyc.js` - KYC upload
   - `api/upload/vendor/kyc/signed.js` - Signed URL generation
5. **Test Full Flow**: Register → Login → Access protected routes

---

## File Changes Summary

### Recent Commits
- `979a02c` - Add debug endpoints for password verification
- `1fc0770` - Fix: Remove duplicate export in apiConfig.js
- `d18541a` - Fix: Revert API to same-origin /api, rewrite all serverless fns to use pg directly

### Key Files Modified
- `src/utils/apiConfig.js` - API base URL configuration
- `src/services/apiClient.js` - API client with token refresh
- `api/auth/login.js` - Login endpoint (uses pg + bcrypt)
- `api/auth/register.js` - Registration endpoint (uses pg + bcrypt)
- `api/csrf-token.js` - CSRF token endpoint
- `backend/config/security.js` - CORS configuration
- `backend/server.js` - Express server with CORS setup

---

## Testing Checklist

- [ ] Vercel build succeeds
- [ ] Homepage renders without errors
- [ ] CSRF token fetches successfully
- [ ] User can register with new email
- [ ] User can login with correct credentials
- [ ] JWT token is returned and stored
- [ ] Protected routes require valid token
- [ ] Token refresh works on 401
- [ ] Logout clears token

