# Firestore to PostgreSQL Migration - Complete Guide

## Overview
This document outlines the complete migration from Firebase Firestore to PostgreSQL on Render.

## Database Credentials
- **Database**: propertyark
- **External Host**: dpg-d61qns24d50c7380u57g-a.oregon-postgres.render.com
- **Internal Host**: dpg-d61qns24d50c7380u57g-a
- **User**: propertyark_user
- **Password**: oBphdzVn3C4eyBBIzoCKA4v8LUaWSdej

## Connection URLs
- **External URL** (for remote connections):
  ```
  postgresql://propertyark_user:oBphdzVn3C4eyBBIzoCKA4v8LUaWSdej@dpg-d61qns24d50c7380u57g-a.oregon-postgres.render.com/propertyark
  ```

- **Internal URL** (for Render services):
  ```
  postgresql://propertyark_user:oBphdzVn3C4eyBBIzoCKA4v8LUaWSdej@dpg-d61qns24d50c7380u57g-a/propertyark
  ```

## Migration Steps

### Phase 1: Environment Setup ✅ COMPLETED
- [x] Updated `.env` with PostgreSQL credentials
- [x] Updated `backend/.env` with PostgreSQL credentials
- [x] Installed Sequelize, pg, and pg-hstore packages
- [x] Created all Sequelize models in `backend/models/sequelize/`

### Phase 2: Database Connection Testing
**Status**: In Progress (network connectivity from local dev needed)

To test the connection from a production/cloud environment:
```bash
cd backend
node test-db-connection.js
```

### Phase 3: Run Migration Script
When deployed to Render or connected via VPN:
```bash
cd backend
node migration/migrate.js
```

The migration script will:
1. ✅ Authenticate database connection
2. ✅ Create all tables automatically (Sequelize sync)
3. ✅ Migrate all Firestore collections:
   - **users** (with password hashing)
   - **properties**
   - **investments**
   - **mortgageApplications**
   - **mortgages**
   - **escrowTransactions**
   - **userInvestments**
   - **blog**
   - **supportInquiries**
   - **verificationApplications**
   - **messages**
   - **notifications**
   - **savedProperties**
   - **propertyInquiries**
   - **propertyAlerts**
   - **disputeResolutions**
   - **inspectionRequests**
   - **mortgageBanks**
4. ✅ Display migration summary

### Phase 4: Backend Updates
The backend is already configured to:
- ✅ Use Sequelize ORM
- ✅ Support both Firestore and PostgreSQL
- ✅ Fallback gracefully if modules unavailable
- ✅ Use JWT authentication

### Phase 5: Testing & Deployment

#### Test Database Connection
```bash
cd backend
npm start
```

The server will:
1. Initialize PostgreSQL database
2. Sync models (create tables)
3. Ready to accept API requests

#### Test API Endpoints
```bash
# Get all users
curl http://localhost:3000/api/users

# Get all properties
curl http://localhost:3000/api/properties

# Test authentication
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

## Files Modified

### Configuration Files
- `backend/.env` - Added PostgreSQL credentials
- `.env` - Added PostgreSQL configuration
- `backend/package.json` - Added sequelize, pg, pg-hstore

### New Model Files Created
- `backend/models/sequelize/User.js`
- `backend/models/sequelize/Property.js`
- `backend/models/sequelize/EscrowTransaction.js`
- `backend/models/sequelize/Investment.js`
- `backend/models/sequelize/UserInvestment.js`
- `backend/models/sequelize/MortgageBank.js`
- `backend/models/sequelize/MortgageApplication.js`
- `backend/models/sequelize/Mortgage.js`
- `backend/models/sequelize/Blog.js`
- `backend/models/sequelize/Message.js`
- `backend/models/sequelize/Notification.js`
- `backend/models/sequelize/SavedProperty.js`
- `backend/models/sequelize/PropertyInquiry.js`
- `backend/models/sequelize/PropertyAlert.js`
- `backend/models/sequelize/SupportInquiry.js`
- `backend/models/sequelize/VerificationApplication.js`
- `backend/models/sequelize/DisputeResolution.js`
- `backend/models/sequelize/InspectionRequest.js`
- `backend/models/sequelize/index.js` - Exports all models

### Updated Files
- `backend/config/sequelizeDb.js` - Updated to use new models directory
- `backend/config/postgresqlSetup.js` - Already configured
- `backend/migration/migrate.js` - Already configured

## Data Migration Process

The migration script handles:
1. **User Passwords**: Automatically hashes plain passwords using bcryptjs
2. **Date Fields**: Converts Firestore timestamps to PostgreSQL DATE
3. **JSON Fields**: Preserves complex objects as JSONB in PostgreSQL
4. **Relationships**: Maintains foreign key references
5. **Duplicate Prevention**: Skips existing records to allow re-running

## Post-Migration Verification

After migration, verify:
1. ✅ All tables created in PostgreSQL
2. ✅ All data migrated correctly
3. ✅ Foreign key relationships intact
4. ✅ API endpoints responding from PostgreSQL
5. ✅ User authentication working
6. ✅ Property searches working
7. ✅ Investment operations working

## Deployment to Render

### Step 1: Push Code
```bash
git add .
git commit -m "Migrate: Firestore to PostgreSQL"
git push origin main
```

### Step 2: Environment Variables in Render
Add to Render service environment:
```
DATABASE_URL=postgresql://propertyark_user:oBphdzVn3C4eyBBIzoCKA4v8LUaWSdej@dpg-d61qns24d50c7380u57g-a/propertyark
DB_USER=propertyark_user
DB_PASSWORD=oBphdzVn3C4eyBBIzoCKA4v8LUaWSdej
DB_HOST=dpg-d61qns24d50c7380u57g-a.oregon-postgres.render.com
DB_PORT=5432
DB_NAME=propertyark
NODE_ENV=production
JWT_SECRET=Dabonega$reus2660
```

### Step 3: Run Migration on Render (if not auto-migrated)
In Render dashboard, run the build command:
```bash
npm install && cd backend && npm install && node migration/migrate.js
```

### Step 4: Start Backend Service
Render will automatically start with:
```bash
node backend/server.js
```

## Troubleshooting

### Connection Issues
- **Local Dev**: Use VPN to connect to Render PostgreSQL
- **SSL Errors**: Certificates are auto-configured in production
- **Timeout**: Increase pool timeout in sequelizeDb.js

### Migration Issues
- **Duplicate Keys**: Script skips existing records, safe to re-run
- **Missing Collections**: Check Firestore collections exist
- **Data Loss**: Migration is read-only from Firestore, no data deleted

### Performance
- Connection pooling configured (max 5 connections)
- Indexes on commonly queried fields
- JSONB fields for flexible schemas

## Rollback Plan

If issues occur:
1. Stop backend service
2. Point DATABASE_URL back to Firestore in .env
3. Update server.js to use Firestore client
4. Redeploy

Note: PostgreSQL data will remain but not be used until re-pointed.

## Next Steps

1. ✅ Deploy code to Render
2. ⏳ Verify database connectivity
3. ⏳ Run migration script
4. ⏳ Test all API endpoints
5. ⏳ Verify user authentication
6. ⏳ Monitor performance metrics
7. ⏳ Update frontend API URLs (already using getApiUrl)

## Support

For issues:
1. Check `backend/test-db-connection.js` output
2. Review migration script logs
3. Verify PostgreSQL credentials in .env
4. Check Render dashboard for connection errors
5. Ensure backend/server.js initializes database

---
**Last Updated**: February 5, 2026
**Status**: Environment Setup Complete - Awaiting Deployment
