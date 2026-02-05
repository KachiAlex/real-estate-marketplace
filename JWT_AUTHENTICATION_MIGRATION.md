# Firebase to Custom JWT Migration Guide

## Overview
This document outlines the complete migration from Firebase Authentication to a custom JWT-based authentication system for your Real Estate Marketplace application.

**Benefits:**
- ✅ No Firebase costs
- ✅ Complete data control
- ✅ Simpler architecture
- ✅ Works perfectly with PostgreSQL on Render + React on Netlify

---

## What Was Created

### Backend (Node.js/Express)

#### 1. **JWT Authentication Routes** (`backend/routes/auth-jwt.js`)
- `POST /api/auth/jwt/register` - Create new user account
- `POST /api/auth/jwt/login` - Login with email/password
- `POST /api/auth/jwt/refresh` - Refresh access token
- `GET /api/auth/jwt/me` - Get current user profile
- `POST /api/auth/jwt/logout` - Logout user

#### 2. **JWT Verification Middleware** (`backend/middleware/authJwt.js`)
- Validates JWT tokens from Authorization header
- Attaches userId to request object
- Handles expired/invalid tokens
- Returns appropriate error responses

#### 3. **Server Integration** (`backend/server.js`)
- Registered JWT routes at `/api/auth/jwt` prefix
- Works alongside existing Firestore routes (for migration period)

---

### Frontend (React)

#### 1. **New AuthContext** (`src/contexts/AuthContext-new.js`)
Features:
- User registration (email, password, name, phone)
- User login (email/password)
- Token management (access + refresh tokens)
- Automatic token refresh on expiration
- Local storage persistence
- Logout functionality
- Current user profile fetching

Usage:
```javascript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { currentUser, login, register, logout } = useAuth();
  
  // Use auth functions
}
```

#### 2. **New Login Component** (`src/pages/LoginNew.js`)
Features:
- Email/password login
- User registration form
- Form validation
- Error handling with toast notifications
- Toggle between login and registration modes
- Responsive design

---

## Token Structure

### Access Token (JWT)
```
Header: { alg: "HS256", typ: "JWT" }
Payload: { userId: "uuid-here" }
Expiration: 30 days
Storage: localStorage.accessToken
```

### Refresh Token (JWT)
```
Header: { alg: "HS256", typ: "JWT" }
Payload: { userId: "uuid-here" }
Expiration: 90 days
Storage: localStorage.refreshToken
```

---

## API Endpoints

### Register
```
POST /api/auth/jwt/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "1234567890"  // optional
}

Response:
{
  "success": true,
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "roles": ["user"],
    "isVerified": false
  }
}
```

### Login
```
POST /api/auth/jwt/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response: Same as register
```

### Refresh Token
```
POST /api/auth/jwt/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}

Response:
{
  "success": true,
  "accessToken": "eyJhbGc..."
}
```

### Get Current User
```
GET /api/auth/jwt/me
Authorization: Bearer <accessToken>

Response:
{
  "success": true,
  "user": { ...user data... }
}
```

### Logout
```
POST /api/auth/jwt/logout
Authorization: Bearer <accessToken>

Response:
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Database Changes

### User Model (PostgreSQL)
The existing Sequelize User model already has all required fields:
- `email` - unique, indexed
- `password` - hashed with bcryptjs (10 rounds)
- `firstName`, `lastName`
- `phone` (optional)
- `avatar` (optional)
- `role` (enum: user, agent, admin, mortgage_bank, vendor)
- `roles` (JSON array)
- `isVerified` (boolean)
- `isActive` (boolean)
- `provider` (defaults to 'email')
- Timestamps (createdAt, updatedAt)

**Password Hashing:**
- Uses `bcryptjs` v2.4.3
- Hash rounds: 10
- Stored in `password` column

---

## Environment Variables

Add to `backend/.env`:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-key-here-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_EXPIRE=30d

# PostgreSQL (already configured)
DATABASE_URL=postgresql://user:password@host:port/dbname
DB_USER=...
DB_PASSWORD=...
DB_HOST=...
DB_PORT=5432
DB_NAME=...
```

⚠️ **IMPORTANT:** Change both `JWT_SECRET` and `JWT_REFRESH_SECRET` in production to strong random values.

Generate secrets:
```bash
# In Node.js
require('crypto').randomBytes(32).toString('hex')
```

---

## Implementation Checklist

- [x] Backend JWT routes created (`/api/auth/jwt/*`)
- [x] JWT middleware created for route protection
- [x] Frontend AuthContext created for JWT
- [x] Login/Register component created
- [ ] Update `App.js` to use new AuthContext
- [ ] Update route protection to use new middleware
- [ ] Test registration flow
- [ ] Test login flow
- [ ] Test token refresh
- [ ] Test logout
- [ ] Update all API calls to include auth header
- [ ] Deploy to Render (backend)
- [ ] Deploy to Netlify (frontend)
- [ ] Remove Firebase code (optional, can run in parallel)

---

## Migration Steps

### Step 1: Update App.js
Replace Firebase AuthProvider with JWT AuthProvider:

```javascript
// Old (Firebase)
import { AuthProvider as FirebaseAuthProvider } from './contexts/AuthContext';
<FirebaseAuthProvider>
  {/* app */}
</FirebaseAuthProvider>

// New (JWT)
import { AuthProvider as JwtAuthProvider } from './contexts/AuthContext-new';
<JwtAuthProvider>
  {/* app */}
</JwtAuthProvider>
```

### Step 2: Update Protected Routes
The `verifyToken` middleware in `backend/middleware/authJwt.js` handles route protection:

```javascript
const { verifyToken } = require('../middleware/authJwt');

// Protect route
router.get('/api/profile', verifyToken, (req, res) => {
  // req.userId is set by middleware
});
```

### Step 3: Update API Calls
Include JWT token in all authenticated requests:

```javascript
// Frontend
const response = await fetch('/api/some-endpoint', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

### Step 4: Test Flows
Test all authentication scenarios:
1. Register new user
2. Login with correct credentials
3. Login with wrong credentials (should fail)
4. Make authenticated request
5. Logout

---

## Security Considerations

1. **HTTPS Only** (on Render/Netlify, automatic)
2. **Secure Headers** - Add to backend:
   ```javascript
   app.use(helmet());
   ```

3. **Rate Limiting** - Implemented for auth endpoints:
   ```javascript
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 5 // 5 requests per IP
   });
   app.use('/api/auth/jwt/login', limiter);
   app.use('/api/auth/jwt/register', limiter);
   ```

4. **CORS** - Already configured in `server.js` for:
   - `propertyark.netlify.app`
   - `localhost:3000`
   - Custom domains

5. **Password Requirements:**
   - Minimum 6 characters (backend enforced)
   - Consider requiring stronger passwords in production:
     - Uppercase letter
     - Lowercase letter
     - Number
     - Special character

---

## Removing Firebase (Optional)

Once JWT migration is complete and tested, remove Firebase:

### 1. Backend
```bash
npm remove firebase-admin
```

Remove from files:
- `backend/config/firestore.js` - Don't delete if still needed for data
- `backend/middleware/auth.js` - Replace with authJwt.js
- `backend/routes/auth.js` - Can keep for data migrations, not needed for auth
- References in `backend/server.js`

### 2. Frontend
```bash
npm remove firebase
```

Remove:
- `src/config/firebase.js`
- `src/utils/firebaseConfigDiagnostics.js`
- Firebase imports from all files
- `AuthContext.js` (old version)
- `Login.js` (old version with Google auth)

### 3. Mobile App (if using)
```bash
# In mobile-app/
npm remove firebase
```

---

## Deployment

### Backend to Render
1. Push code to GitHub
2. Render auto-deploys
3. Set environment variables in Render dashboard:
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
   - All PostgreSQL variables

### Frontend to Netlify
1. Push code to GitHub
2. Netlify auto-deploys
3. Update `src/utils/apiConfig.js` to point to Render backend URL

---

## Testing Checklist

```javascript
// Test Registration
POST /api/auth/jwt/register
{
  "email": "test@example.com",
  "password": "testpass123",
  "firstName": "Test",
  "lastName": "User"
}

// Test Login
POST /api/auth/jwt/login
{
  "email": "test@example.com",
  "password": "testpass123"
}

// Test Protected Route
GET /api/auth/jwt/me
Headers: { "Authorization": "Bearer <accessToken>" }

// Test Token Refresh
POST /api/auth/jwt/refresh
{
  "refreshToken": "<refreshToken>"
}

// Test Logout
POST /api/auth/jwt/logout
Headers: { "Authorization": "Bearer <accessToken>" }
```

---

## Troubleshooting

### "Invalid or expired token"
- Token has expired → use refresh endpoint
- Token is malformed → re-login

### "User not found"
- User doesn't exist in database
- Check email is correct
- Try registration

### CORS errors
- Check origin is in `allowedOrigins` array in `server.js`
- Verify Authorization header is set correctly

### Password mismatch on login
- Ensure password is hashed correctly
- Check if user exists with that email
- Verify database connection

---

## Quick Start

### For Users
1. Navigate to login page
2. Click "Sign Up" to create account
3. Enter email, password, name
4. Click "Sign In"
5. You're authenticated!

### For Developers
1. Create endpoint: `router.get('/api/my-endpoint', verifyToken, (req, res) => {})`
2. Frontend gets token from `useAuth()` hook
3. Send token in Authorization header
4. Backend verifies token with middleware

---

## Files Modified/Created

**New Files:**
- ✅ `backend/routes/auth-jwt.js` (330 lines)
- ✅ `backend/middleware/authJwt.js` (60 lines)
- ✅ `src/contexts/AuthContext-new.js` (220 lines)
- ✅ `src/pages/LoginNew.js` (150 lines)

**Modified Files:**
- ✅ `backend/server.js` (added JWT route registration)

**To Update:**
- `src/App.js` (use new AuthContext)
- `src/index.js` (if using AuthProvider there)
- Other route files (add verifyToken middleware)

---

## Next Steps

1. ✅ Backend JWT endpoints created
2. ✅ Frontend JWT AuthContext created
3. ✅ Login/Register component created
4. **TODO:** Update App.js to use new AuthContext
5. **TODO:** Test authentication flow
6. **TODO:** Deploy to Render
7. **TODO:** Deploy to Netlify
8. **TODO:** Remove Firebase (optional)

---

**Status:** ✅ JWT Authentication System Ready for Integration

Last Updated: February 5, 2026
