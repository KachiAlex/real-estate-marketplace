# Setting Up PostgreSQL on Render

## Overview
Render.com provides free PostgreSQL databases that are perfect for development. This guide walks through creating one for your real-estate marketplace.

---

## Step 1: Sign Up / Log In to Render

1. Go to [render.com](https://render.com)
2. Click **"Sign Up"** (or log in if you already have an account)
3. Use GitHub, Google, or email to register
4. Verify your email

---

## Step 2: Create a PostgreSQL Database

### 2.1 Navigate to Databases
1. After logging in, click **"New"** (top right)
2. Select **"PostgreSQL"**

### 2.2 Configure Database Settings

Fill in the form:

| Field | Value |
|-------|-------|
| **Name** | `real-estate-db` |
| **Database** | `real_estate_db` |
| **User** | `postgres` |
| **Password** | *Auto-generated (copy it!)* |
| **Region** | Select closest to your location |
| **PostgreSQL Version** | 15 (default) |
| **Plan** | Free (for development) |

### 2.3 Create Database
Click **"Create Database"** button

### Important: Copy Your Connection Details
After creation, you'll see a page with connection info. **Copy and save these**:
- **Internal Database URL**
- **External Database URL**
- **Host**
- **Port**
- **Database**
- **User**
- **Password**

---

## Step 3: Update Your `.env` File

### 3.1 Get Connection String
From Render dashboard, find and copy the **External Database URL**. It looks like:
```
postgresql://[user]:[password]@[host]:[port]/[database]
```

### 3.2 Update `.env` File

Open `d:\real-estate-marketplace\.env` and replace the PostgreSQL settings:

```bash
# Old (localhost)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/real_estate_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=real_estate_db

# New (Render cloud)
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/real_estate_db
DB_USER=[user]
DB_PASSWORD=[password]
DB_HOST=[host]
DB_PORT=[port]
DB_NAME=real_estate_db
```

Replace `[user]`, `[password]`, `[host]`, `[port]` with actual values from Render.

**Keep everything else the same:**
```bash
JWT_SECRET_POSTGRES=your-super-secret-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRY=24h
JWT_REFRESH_EXPIRY=7d
NODE_ENV=development
ALLOW_MOCK_AUTH=true
PORT=5001
```

---

## Step 4: Test Connection

### 4.1 Start Backend Server
```bash
cd d:\real-estate-marketplace
node backend/server.js
```

### Expected Output:
```
🚀 Starting server...
📌 Port: 5001
🌍 Environment: development
✅ Firestore initialized
✅ Server listening on port 5001

✅ PostgreSQL initialized and connected
✅ Database models synchronized
```

If you see `✅ PostgreSQL initialized and connected` - SUCCESS! 🎉

### 4.2 Verify Database Connection
```bash
# From your terminal, test direct connection
npm install -g psql  # If not already installed
psql -h [host] -U [user] -d real_estate_db -c "SELECT version();"
```

---

## Step 5: Run Migration Script

Once connected, import data from Firestore to PostgreSQL:

```bash
node backend/migration/migrate.js
```

Expected output:
```
📊 Migration starting...
Exporting users from Firestore...
Exporting properties from Firestore...
Exporting bookmarks from Firestore...
... (other collections)
✅ Migration completed successfully!
Total records migrated: [count]
```

---

## Step 6: Test Authentication Endpoints

### Register New User
```bash
curl -X POST http://localhost:5001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"Test123!",
    "firstName":"Test",
    "lastName":"User"
  }'
```

Expected response:
```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "test@example.com",
    "firstName": "Test"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

### Login
```bash
curl -X POST http://localhost:5001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"Test123!"
  }'
```

### Get Current User (requires token)
```bash
curl -X GET http://localhost:5001/auth/me \
  -H "Authorization: Bearer [accessToken]"
```

---

## Troubleshooting

### Error: "password authentication failed"
**Cause**: Wrong credentials in .env
**Fix**: 
1. Go to Render dashboard
2. Click on your database
3. Copy connection details again
4. Update .env with correct values

### Error: "connect ECONNREFUSED"
**Cause**: Database not accessible from your location
**Fix**:
1. Check Render database status (should be "Available")
2. Verify .env DATABASE_URL is correct
3. Check if Render has IP whitelist - add your IP or allow all

### Error: "database does not exist"
**Cause**: Wrong database name in connection string
**Fix**: Use exact name from Render dashboard

### Error: "too many connections"
**Cause**: Render free tier has limited connections
**Fix**: Restart your server or upgrade to paid plan

---

## Monitoring Your Database

### Via Render Dashboard
1. Go to [render.com](https://render.com)
2. Click on your database
3. View:
   - Connection status
   - Storage usage
   - CPU usage
   - Query logs

### Via Command Line
```bash
# List all tables
psql -h [host] -U [user] -d real_estate_db -c "\dt"

# Count records in users table
psql -h [host] -U [user] -d real_estate_db -c "SELECT COUNT(*) FROM users;"

# View database size
psql -h [host] -U [user] -d real_estate_db -c "SELECT pg_size_pretty(pg_database_size(current_database()));"
```

---

## Database Specifications

### Free Tier Limits (Render)
| Limit | Amount |
|-------|--------|
| Storage | 1 GB |
| Connections | 20 concurrent |
| Backups | 7 day retention |
| Memory | 256 MB |
| CPU | Shared |

**Great for development!** Upgrade to paid plan for production.

---

## Next Steps

### 1. Update Frontend Auth (Phase 5)
After PostgreSQL is working, update frontend to use JWT tokens instead of Firebase Auth:

```javascript
// Example: Update AuthContext.js
const login = async (email, password) => {
  const response = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
};
```

### 2. Deploy Backend to Render (Phase 6)
```bash
# Will integrate with your PostgreSQL automatically
```

### 3. Deploy Frontend (Phase 6)
```bash
# Update API endpoints to production backend
```

---

## Quick Reference

### Connection String Format
```
postgresql://[user]:[password]@[host]:[port]/[database]
```

### Environment Variables Needed
```bash
DATABASE_URL=...
DB_USER=...
DB_PASSWORD=...
DB_HOST=...
DB_PORT=...
DB_NAME=...
JWT_SECRET_POSTGRES=...
JWT_REFRESH_SECRET=...
```

### Server Startup Command
```bash
node backend/server.js
```

### Migration Command
```bash
node backend/migration/migrate.js
```

---

## Security Notes

1. **Never commit .env to Git** ✅ (Already in .gitignore)
2. **Keep passwords secret** ✅ (Store in .env only)
3. **Use strong passwords** ✅ (Render auto-generates)
4. **Enable SSL** ✅ (Render enforces SSL by default)
5. **Rotate credentials periodically** ⚠️ (Recommended quarterly)

---

## Helpful Links

- [Render Documentation](https://render.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Sequelize Docs](https://sequelize.org)
- [JWT Authentication Guide](https://tools.ietf.org/html/rfc7519)

---

## Status Checklist

- [ ] Sign up on Render.com
- [ ] Create PostgreSQL database
- [ ] Copy connection details
- [ ] Update .env with Render credentials
- [ ] Start backend server
- [ ] See "✅ PostgreSQL initialized and connected"
- [ ] Run migration script
- [ ] Test auth endpoints
- [ ] Verify data in PostgreSQL

---

## Support

If you encounter issues:

1. **Check .env file** - Verify all DATABASE_* variables are correct
2. **Check Render dashboard** - Ensure database is "Available"
3. **Check logs** - Run `node backend/server.js` and review output
4. **Verify connection** - Test with psql command line tool
5. **Review error messages** - They usually indicate the exact issue

**Common Fix**: Copy connection string directly from Render dashboard - don't manually type it!

---

**Created**: February 4, 2026
**For Project**: Real-Estate Marketplace
**Phase**: 4 (Database Setup)
**Status**: Ready to implement
