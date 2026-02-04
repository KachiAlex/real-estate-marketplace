# Phase 3: Environment Setup & Dependencies Installation

## Current State ✅
- Schema, models, and middleware created
- JWT authentication system implemented
- Migration script ready
- All files committed to GitHub

## Next Actions (In Order)

### 1. Install Dependencies (5 minutes)
```bash
npm install
```
This will install:
- `sequelize` - ORM for PostgreSQL
- `pg` - PostgreSQL driver
- `pg-hstore` - JSON support for PostgreSQL

### 2. Set Up PostgreSQL Database (5-10 minutes)

**Option A: Local Development**
```bash
# Install PostgreSQL (if not already installed)
# macOS:
brew install postgresql

# Windows: Download from https://www.postgresql.org/download/windows/
# Linux: sudo apt-get install postgresql

# Create database
createdb real_estate_db

# Test connection
psql real_estate_db
\dt  # List tables (should be empty)
\q   # Quit
```

**Option B: Render (Production)**
1. Go to https://render.com/
2. Create new PostgreSQL database
3. Copy DATABASE_URL from dashboard
4. Set as environment variable

### 3. Configure Environment Variables (5 minutes)

Create or update `.env` file in project root:

```env
# Database Connection
DATABASE_URL=postgresql://postgres:password@localhost:5432/real_estate_db
DB_USER=postgres
DB_PASSWORD=your_secure_password_here
DB_HOST=localhost
DB_PORT=5432
DB_NAME=real_estate_db

# JWT Configuration (IMPORTANT: Use secure random strings)
JWT_SECRET=your_super_secret_jwt_key_min_32_chars_change_this
JWT_REFRESH_SECRET=your_refresh_secret_key_min_32_chars_change_this
JWT_EXPIRY=24h
JWT_REFRESH_EXPIRY=7d

# Application
NODE_ENV=development
PORT=5000
ALLOW_MOCK_AUTH=true

# Firebase (keep for Firestore connection during migration)
FIREBASE_API_KEY=your_firebase_key
FIREBASE_AUTH_DOMAIN=your_app.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

**For Render Production**: Set via Environment Variables in dashboard

### 4. Test Database Connection (5 minutes)

```bash
# Start backend
npm run dev

# Watch for connection message:
# ✅ Database connection established
# ✅ Database tables synced
```

### 5. Run Data Migration (10-30 minutes, depends on data size)

```bash
node backend/migration/migrate.js
```

Expected output:
```
🚀 Starting Firestore → PostgreSQL Migration...

✅ Database connection established
📊 Syncing database tables...
✅ Database tables synced

📦 Migrating Users...
✅ Migrated user: user@example.com
✅ Users migration completed: 50 users migrated

📦 Migrating Properties...
✅ Migrated property: Beautiful 3-Bed House
✅ Properties migration completed: 100 properties migrated

... (other collections)

📊 =========================== MIGRATION SUMMARY ===========================
Users:       50
Properties:  100
Other:       1500
Total:       1650
==========================================================================

✅ Migration completed successfully!
```

### 6. Test Authentication API (5 minutes)

**Using Postman/Insomnia or curl:**

```bash
# Register new user
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123",
    "firstName": "Test",
    "lastName": "User",
    "role": "user"
  }'

# Response:
# {
#   "success": true,
#   "accessToken": "eyJhbGciOiJIUzI1NiIs...",
#   "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
#   "expiresIn": "24h"
# }
```

### 7. Get Current User (Verify Auth Works)

```bash
curl -X GET http://localhost:5000/auth/me \
  -H "Authorization: Bearer <accessToken_from_above>"

# Response:
# {
#   "success": true,
#   "user": {
#     "id": "...",
#     "email": "test@example.com",
#     "firstName": "Test",
#     "lastName": "User"
#   }
# }
```

---

## Phase 3 Success Checklist

- [ ] Dependencies installed (npm install completed)
- [ ] PostgreSQL database created and accessible
- [ ] .env file configured with DATABASE_URL and JWT secrets
- [ ] Backend starts without database errors
- [ ] Migration script runs successfully
- [ ] All data migrated from Firestore to PostgreSQL
- [ ] Auth register endpoint works
- [ ] Auth login endpoint works
- [ ] JWT token verification works
- [ ] /auth/me endpoint returns current user
- [ ] Changes committed to GitHub

---

## Phase 4: API Route Migration

Once Phase 3 is complete, we'll update:
- `/api/properties` - Use Sequelize instead of Firestore
- `/api/users` - User CRUD operations
- `/api/investments` - Investment endpoints
- `/api/mortgages` - Mortgage endpoints
- `/api/escrow` - Escrow transaction endpoints
- All other API endpoints

## Estimated Timeline

| Phase | Task | Time |
|-------|------|------|
| 3.1 | Install dependencies | 5 min |
| 3.2 | Set up PostgreSQL | 10 min |
| 3.3 | Configure environment | 5 min |
| 3.4 | Test connection | 5 min |
| 3.5 | Run migration | 30 min |
| 3.6 | Test auth API | 10 min |
| **Total Phase 3** | | **1 hour** |

---

## Troubleshooting

### npm install fails
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### PostgreSQL connection refused
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
- Check PostgreSQL is running: `brew services start postgresql` (macOS)
- Check DATABASE_URL is correct in .env
- Verify credentials match your PostgreSQL setup

### Migration script fails
```
Error: User not found
```
- Ensure users are migrated before dependent collections
- Run migration script again (it skips existing records)
- Check Firebase connection is working

### JWT token errors
```
Error: Invalid or expired token
```
- Token may have expired (24h default)
- Use refresh token: `POST /auth/refresh`
- Check JWT_SECRET matches in .env

### Port already in use
```
Error: EADDRINUSE: address already in use :::5000
```
- Change PORT in .env (e.g., PORT=5001)
- Or kill existing process: `lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill`

---

## Next Commands to Run

```bash
# 1. Install dependencies
npm install

# 2. Start backend
npm run dev

# 3. In another terminal, run migration
node backend/migration/migrate.js

# 4. Test API with curl or Postman
# See examples above
```

---

**Ready to proceed with Phase 3? 🚀**

Just run the commands above and let me know if you hit any issues!
