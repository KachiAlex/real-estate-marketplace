# Phase 3: Environment Setup - EXECUTION LOG

**Date**: February 4, 2026  
**Status**: 🚀 IN PROGRESS

---

## Step 1: Dependencies Installation ⏳

### npm install Status
```
Command: npm install
Status: RUNNING/COMPLETE
Packages: sequelize, pg, pg-hstore being installed
```

**Expected output when complete:**
```
added XXX packages, removed YYY packages, changed ZZZ packages
```

### Manual Installation (if needed)
```bash
npm install sequelize@6.35.2 pg@8.11.3 pg-hstore@2.3.4 --save
```

---

## Step 2: PostgreSQL Database Setup ⏳

### Option A: PostgreSQL Already Installed
```bash
# Create database
createdb real_estate_db

# Verify
psql -l | grep real_estate_db
```

### Option B: PostgreSQL Not Installed - Install Now

**Windows**:
1. Download: https://www.postgresql.org/download/windows/
2. Run installer with default settings
3. Remember the password you set for `postgres` user
4. Add PostgreSQL to PATH (if needed)

**macOS**:
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux**:
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo service postgresql start
```

### Verify PostgreSQL Installation
```bash
psql --version
# Should show: psql (PostgreSQL) XX.X
```

### Create Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Inside psql prompt:
CREATE DATABASE real_estate_db;
\l  # List databases
\q  # Quit

# Or from command line:
createdb -U postgres real_estate_db
```

---

## Step 3: Environment Configuration ✅

### .env File Updated
Location: `d:\real-estate-marketplace\.env`

**PostgreSQL Configuration Added:**
```env
# PostgreSQL Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/real_estate_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=real_estate_db

# JWT Configuration
JWT_SECRET_POSTGRES=your_super_secret_jwt_key_min_32_chars_change_this_value
JWT_REFRESH_SECRET=your_refresh_secret_key_min_32_chars_change_this_value
JWT_EXPIRY=24h
JWT_REFRESH_EXPIRY=7d

# Application
NODE_ENV=development
PORT=5000
ALLOW_MOCK_AUTH=true
```

**⚠️ IMPORTANT**: 
- Change default password `postgres` to something secure before production
- Keep JWT_SECRET and JWT_REFRESH_SECRET secure and unique
- Store .env file safely (never commit to GitHub)

---

## Step 4: Test Database Connection ⏳

### After npm install completes and PostgreSQL is running:

```bash
npm run dev
```

**Watch for messages:**
```
✅ Database connection established
✅ Database tables synced
```

**If connection fails:**
1. Check PostgreSQL is running
2. Verify DATABASE_URL in .env
3. Check username/password credentials
4. See troubleshooting section below

---

## Step 5: Run Data Migration ⏳

**ONLY AFTER**:
1. ✅ npm install completed
2. ✅ PostgreSQL database created
3. ✅ Backend started successfully
4. ✅ No connection errors in console

**Then run:**
```bash
node backend/migration/migrate.js
```

**Expected output:**
```
🚀 Starting Firestore → PostgreSQL Migration...

✅ Database connection established
📊 Syncing database tables...
✅ Database tables synced

📦 Migrating Users...
✅ Migrated user: user@example.com
...

📊 =========================== MIGRATION SUMMARY ===========================
Users:       50
Properties:  100
Other:       1500
Total:       1650
==========================================================================

✅ Migration completed successfully!
```

---

## Step 6: Test Authentication API ✅

### Test Endpoints (Once server is running)

**Register New User:**
```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123",
    "firstName": "Test",
    "lastName": "User",
    "role": "user"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": "24h",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "role": "user"
  }
}
```

**Login:**
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123"
  }'
```

**Get Current User:**
```bash
# Replace <accessToken> with actual token from login response
curl -X GET http://localhost:5000/auth/me \
  -H "Authorization: Bearer <accessToken>"
```

---

## Checklist: Phase 3 Success Criteria

- [ ] npm install completed successfully
- [ ] PostgreSQL database installed on system
- [ ] real_estate_db database created
- [ ] .env file updated with DATABASE_URL and JWT secrets
- [ ] Backend starts without errors: `npm run dev`
- [ ] Database connection successful
- [ ] Database tables synced
- [ ] Migration script runs: `node backend/migration/migrate.js`
- [ ] Users migrated from Firestore
- [ ] Properties migrated from Firestore
- [ ] Other collections migrated
- [ ] POST /auth/register works
- [ ] POST /auth/login works
- [ ] GET /auth/me works (with token)

---

## Troubleshooting

### npm install fails
```bash
# Clear cache
npm cache clean --force

# Remove and reinstall
rm -r node_modules package-lock.json
npm install
```

### PostgreSQL connection refused
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions:**
1. Check PostgreSQL running:
   ```bash
   # macOS
   brew services list | grep postgresql
   
   # Windows: Check Services (services.msc)
   
   # Linux
   sudo service postgresql status
   ```

2. Start PostgreSQL if stopped:
   ```bash
   # macOS
   brew services start postgresql
   
   # Linux
   sudo service postgresql start
   ```

3. Check credentials in .env match your setup

### Database already exists
```
Error: database "real_estate_db" already exists
```

**Solution:**
```bash
# Drop existing database
dropdb real_estate_db

# Create new
createdb real_estate_db
```

### Migration script fails
```
Error: User not found
```

**Solution:**
```bash
# Ensure users migrated first
# Run migration script again (it's idempotent)
node backend/migration/migrate.js
```

### JWT token errors
```
Error: Invalid or expired token
```

**Solutions:**
1. Token may have expired (24h default)
2. Use refresh endpoint to get new token
3. Check JWT_SECRET in .env is set

### Port 5000 already in use
```
Error: EADDRINUSE: address already in use :::5000
```

**Solution:**
```bash
# Change PORT in .env
# Or kill existing process:
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process
```

---

## Phase 3 Timeline

| Step | Duration | Status |
|------|----------|--------|
| 1. npm install | 5-10 min | ⏳ Running |
| 2. PostgreSQL setup | 10-15 min | ⏳ Next |
| 3. Environment config | 5 min | ✅ Done |
| 4. Test connection | 5 min | ⏳ Next |
| 5. Run migration | 15-30 min | ⏳ Next |
| 6. Test API | 10 min | ⏳ Next |
| **Total** | **~1 hour** | **In Progress** |

---

## Next Commands (Run In Order)

```bash
# 1. Wait for npm install to complete
# (You should see completion message)

# 2. If PostgreSQL not installed, install it now
# (See installation instructions above)

# 3. Create database
createdb -U postgres real_estate_db

# 4. Start backend
npm run dev

# 5. In new terminal, run migration
node backend/migration/migrate.js

# 6. Test API endpoints with curl commands above
```

---

## Quick Status Check

### Check npm install complete:
```bash
npm list sequelize pg pg-hstore
# Should show version numbers, not "invalid"
```

### Check PostgreSQL running:
```bash
psql --version
psql -U postgres -d real_estate_db -c "SELECT 1"
# Should return: 1
```

### Check database exists:
```bash
psql -U postgres -l | grep real_estate_db
# Should show database in list
```

### Check backend starts:
```bash
npm run dev
# Should see: ✅ Database connection established
```

---

## What's Ready

✅ **Code**: All backend models and routes ready  
✅ **.env**: Database configuration added  
✅ **Dependencies**: Being installed (sequelize, pg)  
✅ **Documentation**: Setup guide ready (this file)  

**Waiting For:**  
⏳ npm install to complete  
⏳ PostgreSQL to be installed (if needed)  
⏳ Database to be created  
⏳ Backend to be tested  
⏳ Migration to be run  
⏳ API endpoints to be verified  

---

## Phase 4 Preview (After Phase 3)

Once Phase 3 is complete:
1. Update all `/api` routes to use PostgreSQL
2. Remove Firestore queries from backend
3. Update frontend auth context for JWT
4. Test complete authentication flow
5. Deploy to Render

---

**Status**: Phase 3 - Environment Setup IN PROGRESS  
**Started**: February 4, 2026  
**Est. Completion**: ~1 hour  

**Next**: Check npm install status and proceed with remaining steps
