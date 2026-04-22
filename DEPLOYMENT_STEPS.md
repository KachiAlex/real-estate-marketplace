# Multi-Role Feature Deployment Steps

## Overview
This document outlines the steps to deploy the multi-role user functionality to production.

## Pre-Deployment Checklist

### 1. Verify Local Changes
- [x] `api/users.js` created with role switching and vendor profile
- [x] `api/admin.js` updated with roles column migration
- [x] `api/auth/register.js` updated to support roles array
- [x] `api/auth/login.js` updated to return roles
- [x] `api/auth/jwt/me.js` updated to return roles
- [x] `vercel.json` updated with new routing rules
- [x] Testing guide created

### 2. Review Function Count
Current Vercel functions (should be 12/12):
1. `/api/admin.js`
2. `/api/auth/forgot-password.js`
3. `/api/auth/login.js`
4. `/api/auth/register.js`
5. `/api/auth/reset-password.js`
6. `/api/auth/jwt/me.js`
7. `/api/csrf-token.js`
8. `/api/properties.js`
9. `/api/upload/vendor/kyc.js`
10. `/api/upload/vendor/kyc/signed.js`
11. `/api/users.js` ← NEW
12. (One slot remaining)

## Deployment Steps

### Step 1: Commit and Push Changes
```bash
git add api/users.js
git add api/admin.js
git add api/auth/register.js
git add api/auth/login.js
git add api/auth/jwt/me.js
git add vercel.json
git add MULTI_ROLE_IMPLEMENTATION.md
git add MULTI_ROLE_TESTING_GUIDE.md
git add DEPLOYMENT_STEPS.md

git commit -m "feat: implement multi-role user functionality

- Add consolidated /api/users.js endpoint for role switching and vendor profile
- Update registration to support roles array
- Update login to return roles array
- Add database migration for roles and activerole columns
- Add routing for /api/auth/me, /api/auth/jwt/switch-role, /api/vendor/profile
- Add comprehensive testing guide"

git push origin main
```

### Step 2: Monitor Vercel Deployment
1. Go to https://vercel.com/dashboard
2. Wait for deployment to complete
3. Check build logs for any errors
4. Verify deployment status is "Ready"

### Step 3: Run Database Migration
Once deployed, run the migration in production:

```javascript
// Open browser console on https://real-estate-marketplace-delta.vercel.app
fetch('/api/admin?action=setup-database', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.json())
.then(data => {
  console.log('✅ Migration Result:', data);
  if (data.success) {
    console.log('✅ Database migration completed successfully');
  } else {
    console.error('❌ Migration failed:', data);
  }
});
```

Expected output:
```json
{
  "success": true,
  "message": "Database setup completed",
  "results": [
    {"step": "users_table", "status": "ok"},
    {"step": "check_column_resettoken", "status": "exists"},
    {"step": "check_column_resettokenexpiry", "status": "exists"},
    {"step": "check_column_phone", "status": "exists"},
    {"step": "add_column_roles", "status": "created"},
    {"step": "add_column_activerole", "status": "created"},
    {"step": "password_format_check", "status": "ok"}
  ]
}
```

### Step 4: Test Existing Users

#### Test User 1: onyedika.akoma@gmail.com
```javascript
// Login
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'onyedika.akoma@gmail.com',
    password: 'dikaoliver2660'
  })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Login Result:', data);
  console.log('Roles:', data.user.roles);
  console.log('Active Role:', data.user.activeRole);
  window.testToken = data.token;
});

// Switch to vendor role
fetch('/api/auth/jwt/switch-role', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${window.testToken}`
  },
  body: JSON.stringify({ role: 'vendor' })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Role Switch Result:', data);
  console.log('New Active Role:', data.user.activeRole);
});
```

#### Test User 2: admin@propertyark.com
```javascript
// Login
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@propertyark.com',
    password: 'admin123'
  })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Login Result:', data);
  window.adminToken = data.token;
});

// Switch to vendor role
fetch('/api/auth/jwt/switch-role', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${window.adminToken}`
  },
  body: JSON.stringify({ role: 'vendor' })
})
.then(r => r.json())
.then(data => console.log('✅ Admin now has vendor role:', data));
```

### Step 5: Test New User Registration
```javascript
fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    firstName: 'Test',
    lastName: 'Dual',
    email: 'testdual@example.com',
    password: 'password123',
    phone: '+1234567890',
    roles: ['user', 'vendor']
  })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Registration Result:', data);
  console.log('Roles:', data.user.roles);
  console.log('Active Role:', data.user.activeRole);
});
```

### Step 6: Test All Endpoints

Run through the complete test suite in `MULTI_ROLE_TESTING_GUIDE.md`:
- [ ] `/api/auth/me` returns user info
- [ ] `/api/auth/jwt/me` returns user info
- [ ] `/api/auth/jwt/switch-role` switches roles
- [ ] `/api/users/{id}/roles` returns roles
- [ ] `/api/vendor/profile` GET returns profile
- [ ] `/api/vendor/profile` POST updates profile

### Step 7: Frontend Testing

1. **Login with existing user**
   - Navigate to https://real-estate-marketplace-delta.vercel.app
   - Login with `onyedika.akoma@gmail.com` / `dikaoliver2660`
   - Verify login successful

2. **Check dashboard switcher**
   - Look for dashboard switch dropdown in header/nav
   - Should show available roles (user, vendor)
   - Click to switch between dashboards

3. **Test vendor onboarding**
   - Login with buyer-only account
   - Navigate to "Become a Vendor" section
   - Fill out vendor form
   - Submit and verify role added

4. **Test dashboard routing**
   - Switch to vendor role
   - Verify URL changes to `/vendor/dashboard`
   - Verify vendor-specific content appears
   - Switch back to user role
   - Verify URL changes to `/dashboard`

## Post-Deployment Verification

### Success Criteria
- [ ] Database migration completed without errors
- [ ] Existing users can login successfully
- [ ] Existing users can switch to vendor role
- [ ] New users can register with dual roles
- [ ] All API endpoints return expected responses
- [ ] Frontend dashboard switcher appears for dual-role users
- [ ] Dashboard routing works correctly
- [ ] No console errors in browser
- [ ] No 404 errors for role-related endpoints

### Monitoring
Monitor the following for 24 hours after deployment:
- Vercel function logs for errors
- User registration success rate
- Login success rate
- Role switching success rate
- Database query performance

## Rollback Plan

If critical issues are found:

### Option 1: Quick Fix
1. Identify the issue
2. Fix the code
3. Commit and push
4. Wait for Vercel to redeploy

### Option 2: Revert Deployment
1. Go to Vercel dashboard
2. Find previous deployment
3. Click "Promote to Production"
4. Verify rollback successful

### Option 3: Database Rollback
If database migration causes issues:
```sql
-- Connect to database and run:
ALTER TABLE users DROP COLUMN IF EXISTS roles;
ALTER TABLE users DROP COLUMN IF EXISTS activerole;
```

## Known Issues and Limitations

### Issue 1: Existing Users Have No Roles
**Impact**: Existing users will have `roles = null` until they login or switch roles
**Solution**: The switch-role endpoint automatically adds roles when switching

### Issue 2: Frontend May Cache Old User Data
**Impact**: Dashboard switcher may not appear immediately
**Solution**: Frontend should fetch fresh user data from `/api/auth/me` after login

### Issue 3: Vercel Function Limit
**Impact**: Only 1 function slot remaining (12/12 used)
**Solution**: Future endpoints must be consolidated into existing files

## Support and Troubleshooting

### Common Issues

**Issue**: "Column roles does not exist"
**Solution**: Run database migration (Step 3)

**Issue**: "Role switch failed"
**Solution**: Verify user has valid JWT token and role is valid

**Issue**: Dashboard switcher not showing
**Solution**: Check browser console for user data, verify roles array exists

**Issue**: 404 on role endpoints
**Solution**: Verify vercel.json routing rules deployed correctly

### Debug Commands

Check user roles in database:
```javascript
fetch('/api/users/YOUR_USER_ID/roles', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => console.log('Roles:', data));
```

Check current user info:
```javascript
fetch('/api/auth/me', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => console.log('User:', data));
```

## Next Steps After Successful Deployment

1. **User Communication**
   - Notify users about new dual-role feature
   - Provide instructions for becoming a vendor
   - Update help documentation

2. **Feature Enhancements**
   - Add role-based permissions
   - Implement role-specific features
   - Add analytics for role switching

3. **Performance Optimization**
   - Monitor database query performance
   - Add caching for user roles
   - Optimize role switching flow

4. **Security Audit**
   - Review role-based access control
   - Test authorization boundaries
   - Verify JWT token security
