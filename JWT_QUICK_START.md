# JWT Authentication - Quick Setup (5 Minutes)

## What You Got
✅ Custom JWT authentication (no Firebase needed!)
✅ Works with your PostgreSQL database on Render
✅ Works with your React frontend on Netlify
✅ Free (no authentication service costs)

---

## Files Created

```
backend/
├── routes/
│   └── auth-jwt.js          ← JWT login/register/refresh endpoints
├── middleware/
│   └── authJwt.js            ← Token verification middleware

src/
├── contexts/
│   └── AuthContext-new.js    ← React auth context with JWT
└── pages/
    └── LoginNew.js           ← Email/password login form
```

---

## How It Works (Simple Version)

1. **User registers/logs in** with email & password
2. **Backend stores password** (hashed, can't see it even we wanted to)
3. **Backend returns JWT tokens** (like access cards)
4. **Frontend stores tokens** in localStorage
5. **Frontend sends token** with every protected request
6. **Backend verifies token** is valid

---

## Environment Variables

Add to `backend/.env`:

```env
JWT_SECRET=generate-a-random-string-here
JWT_REFRESH_SECRET=generate-another-random-string-here
JWT_EXPIRE=30d
```

**Generate random secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Activate It (3 Steps)

### Step 1: Update App.js
```javascript
// Find this in src/App.js or src/index.js
import { AuthProvider } from './contexts/AuthContext';

// Replace with this:
import { AuthProvider } from './contexts/AuthContext-new';
```

### Step 2: Update Login Page
```javascript
// In your routes or App.js, change:
import Login from './pages/Login';

// To:
import LoginNew from './pages/LoginNew';
```

### Step 3: Deploy
```bash
# Push to GitHub
git add .
git commit -m "feat: Implement JWT authentication (remove Firebase)"
git push origin master

# Render auto-deploys backend
# Netlify auto-deploys frontend
```

---

## Test It Works

### Test Registration
```bash
curl -X POST http://localhost:5001/api/auth/jwt/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:5001/api/auth/jwt/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

You'll get back:
```json
{
  "success": true,
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "test@example.com",
    "firstName": "John",
    "role": "user"
  }
}
```

---

## API Endpoints (For Reference)

```
POST   /api/auth/jwt/register    ← Create account
POST   /api/auth/jwt/login       ← Login
POST   /api/auth/jwt/refresh     ← Get new access token
GET    /api/auth/jwt/me          ← Get current user (requires token)
POST   /api/auth/jwt/logout      ← Logout
```

All endpoints (except register/login) need this header:
```
Authorization: Bearer <your-access-token>
```

---

## Protect Your Routes (Backend)

```javascript
const { verifyToken } = require('../middleware/authJwt');

// Add verifyToken middleware to any protected route:
router.get('/api/my-protected-route', verifyToken, (req, res) => {
  console.log('User ID:', req.userId);  // Middleware adds this
  res.json({ data: 'Only logged in users see this' });
});
```

---

## Use Auth in Components (Frontend)

```javascript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { currentUser, login, register, logout, accessToken } = useAuth();

  const handleLogin = async () => {
    await login('email@example.com', 'password123');
    // Now currentUser is set, accessToken is in localStorage
  };

  const handleRegister = async () => {
    await register('email@example.com', 'password', 'John', 'Doe');
    // User is automatically logged in
  };

  const handleLogout = async () => {
    await logout();
    // currentUser is cleared, tokens deleted
  };

  return (
    <div>
      {currentUser ? (
        <>
          <p>Welcome, {currentUser.firstName}</p>
          <button onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <>
          <p>Not logged in</p>
          <button onClick={() => login('email', 'pass')}>Login</button>
        </>
      )}
    </div>
  );
}
```

---

## Key Points

| Feature | Before (Firebase) | Now (JWT) |
|---------|------------------|-----------|
| Cost | ~$25-100/month | FREE |
| Auth Type | Google OAuth, Email | Email/Password only |
| Database | Firestore | PostgreSQL ✓ |
| Control | Cloud | Your server |
| Setup | Complex | Simple |

---

## Troubleshooting

**Problem:** Getting 404 on `/api/auth/jwt/login`
- Solution: Make sure you pushed code to GitHub and Render deployed it

**Problem:** "Invalid token" errors
- Solution: Token expired → use refresh endpoint
- Solution: Clear localStorage, re-login

**Problem:** Database error when registering
- Solution: Check PostgreSQL credentials in `.env`
- Solution: Run migration first: `node backend/migration/migrate.js`

**Problem:** CORS errors
- Solution: Check `allowedOrigins` in `backend/server.js`
- Solution: Add your domain to the list

---

## What Changed

### Removed
- ❌ Firebase Admin SDK imports
- ❌ Firebase Auth (Google Sign-In)
- ❌ Firestore for auth
- ❌ Firebase config files

### Added
- ✅ JWT endpoints
- ✅ Token refresh logic
- ✅ Custom login form
- ✅ Email/password auth

### Kept
- ✅ PostgreSQL (improved!)
- ✅ All other data
- ✅ All routes
- ✅ Cloudinary storage
- ✅ Business logic

---

## Next: Remove Firebase (Optional)

If you want to fully remove Firebase later:

```bash
# Backend
npm uninstall firebase-admin

# Frontend
npm uninstall firebase

# Then delete these files:
# - backend/config/firestore.js
# - src/config/firebase.js
# - Old AuthContext.js
# - Old Login.js
```

But no hurry! You can run both systems together during transition.

---

**Status:** ✅ JWT Auth Ready to Use!

**Time to activate:** 5-10 minutes
**No Firebase needed:** ✓
**Works with Render + Netlify:** ✓
**Costs money:** ✗ (FREE!)

Questions? Check `JWT_AUTHENTICATION_MIGRATION.md` for full details.
