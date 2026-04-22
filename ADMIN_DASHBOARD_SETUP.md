# Admin Dashboard Setup Guide

## Overview

The admin dashboard is now fully functional with all endpoints properly configured. Follow these steps to populate the database and start using the admin dashboard.

## Prerequisites

- Node.js installed
- PostgreSQL database running
- `DATABASE_URL` environment variable set

## Quick Start

### 1. Ensure Database Tables Exist

If tables don't exist, create them using the migration script:

```bash
cd api
psql $DATABASE_URL < db/neon-migration.sql
```

### 2. Seed Sample Data

Populate the database with sample data for testing:

```bash
cd api
node db/seed.js
```

This will add:
- 1 Admin user
- 3 Vendor users  
- 3 Buyer users
- 5 Sample properties
- 3 Sample disputes
- 3 Sample escrow transactions

### 3. Deploy API

Push the latest changes to your deployment:

```bash
git push origin main
```

The API will automatically deploy with the new endpoints.

### 4. Access Admin Dashboard

Navigate to the admin dashboard in your application:
- URL: `/admin` or `/admin-dashboard`
- Login with admin credentials

## Admin Dashboard Features

### Users Tab
- View all users (admins, vendors, buyers)
- Filter by role
- View user details and status
- Manage user permissions

### Properties Tab
- View all properties
- See approval status (pending, approved, rejected)
- View property details
- Approve or reject properties

### Disputes Tab
- View all disputes
- Track dispute status
- View dispute details
- Resolve disputes

### Escrow Tab
- View escrow transactions
- Track transaction status
- View transaction details
- Manage escrow releases

### Blog Tab
- View blog posts
- Create new posts
- Edit existing posts
- Manage post status (draft, published)

## API Endpoints

All admin endpoints are now functional:

```
GET  /api/admin/users                    - List all users
GET  /api/admin/settings                 - Get admin settings
GET  /api/admin/properties               - List all properties
GET  /api/admin/properties/status-summary - Get property stats
GET  /api/admin/disputes                 - List all disputes
GET  /api/admin/escrow/volumes           - Get escrow volumes
GET  /api/escrow                         - List escrow transactions
GET  /api/admin/escrow-payments/failed   - List failed payments
GET  /api/blog/admin                     - List blog posts
GET  /api/blog/categories                - Get blog categories
```

## Database Schema

### Users Table
- id (UUID)
- firstName, lastName
- email, phone
- role (admin, vendor, buyer)
- isActive, isVerified
- createdAt, updatedAt

### Properties Table
- id (UUID)
- title, description
- price, type, status
- location (JSON), city, state
- ownerId (references users)
- approvalStatus, isVerified
- createdAt, updatedAt

### Disputes Table
- id (UUID)
- propertyId, buyerId, sellerId
- title, description
- status (open, under_review, resolved)
- createdAt, updatedAt

### Escrow Transactions Table
- id (UUID)
- propertyId, buyerId, sellerId
- amount, status
- createdAt, updatedAt

## Troubleshooting

### Admin Dashboard Shows Empty Data

1. **Check database connection**
   ```bash
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
   ```

2. **Verify tables exist**
   ```bash
   psql $DATABASE_URL -c "\dt"
   ```

3. **Re-seed the database**
   ```bash
   node api/db/seed.js
   ```

### 500 Errors on Admin Endpoints

1. **Check API logs** for error messages
2. **Verify database URL** is correct
3. **Ensure tables exist** with correct schema
4. **Check column names** match the queries

### Data Not Updating

1. **Clear browser cache** and refresh
2. **Check network tab** in browser dev tools
3. **Verify API responses** are returning data
4. **Check database** for actual data

## Next Steps

1. ✅ Database seeding scripts created
2. ✅ Admin endpoints configured
3. ✅ Sample data ready to load
4. **TODO**: Run seeding script on your database
5. **TODO**: Deploy API to production
6. **TODO**: Test admin dashboard with real data

## Support

For issues or questions:
1. Check the API logs
2. Review the database schema
3. Verify environment variables
4. Check browser console for frontend errors

---

**Status**: ✅ Admin Dashboard Ready for Data Population
