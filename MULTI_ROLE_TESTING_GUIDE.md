# Multi-Role User Testing Guide

## Overview
This guide covers testing the dual-role functionality where users can be both buyers and vendors, with the ability to switch between dashboards.

## Prerequisites

### 1. Run Database Migration
Before testing, ensure the database has the required columns:

```javascript
// Run in browser console on https://real-estate-marketplace-delta.vercel.app
fetch('/api/admin?action=setup-database', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.json())
.then(data => console.log('✅ Migration Result:', data))
.catch(err => console.error('❌ Error:', err));
```

Expected output:
```json
{
  "success": true,
  "message": "Database setup completed",
  "results": [
    {"step": "users_table", "status": "ok"},
    {"step": "add_column_roles", "status": "created"},
    {"step": "add_column_activerole", "status": "created"}
  ]
}
```

## Test Scenarios

### Scenario 1: Register New User with Dual Roles

#### Test Case 1.1: Register as Both Buyer and Vendor
```javascript
// Register with dual roles
fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    firstName: 'Test',
    lastName: 'User',
    email: 'testdual@example.com',
    password: 'password123',
    phone: '+1234567890',
    roles: ['user', 'vendor']  // Dual roles
  })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Registration Result:', data);
  console.log('Roles:', data.user.roles);
  console.log('Active Role:', data.user.activeRole);
  // Save token for next tests
  window.testToken = data.token;
})
.catch(err => console.error('❌ Error:', err));
```

Expected response:
```json
{
  "success": true,
  "message": "Registration successful",
  "token": "eyJhbGc...",
  "user": {
    "id": "...",
    "firstName": "Test",
    "lastName": "User",
    "email": "testdual@example.com",
    "roles": ["user", "vendor"],
    "activeRole": "user"
  }
}
```

#### Test Case 1.2: Register as Single Role (Buyer Only)
```javascript
fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    firstName: 'Buyer',
    lastName: 'Only',
    email: 'buyer@example.com',
    password: 'password123',
    roles: ['user']  // Single role
  })
})
.then(r => r.json())
.then(data => console.log('✅ Result:', data));
```

### Scenario 2: Login and Verify Roles

#### Test Case 2.1: Login with Dual-Role User
```javascript
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
```

### Scenario 3: Switch Roles

#### Test Case 3.1: Switch from User to Vendor
```javascript
// Using the token from login
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
  console.log('All Roles:', data.user.roles);
});
```

Expected response:
```json
{
  "success": true,
  "message": "Active role switched to vendor",
  "user": {
    "id": "...",
    "roles": ["user", "vendor"],
    "activeRole": "vendor"
  }
}
```

#### Test Case 3.2: Switch Back to User
```javascript
fetch('/api/auth/jwt/switch-role', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${window.testToken}`
  },
  body: JSON.stringify({ role: 'user' })
})
.then(r => r.json())
.then(data => console.log('✅ Result:', data));
```

### Scenario 4: Get Current User Info

#### Test Case 4.1: Get User via /api/auth/me
```javascript
fetch('/api/auth/me', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${window.testToken}`
  }
})
.then(r => r.json())
.then(data => {
  console.log('✅ User Info:', data);
  console.log('Roles:', data.user.roles);
  console.log('Active Role:', data.user.activeRole);
});
```

#### Test Case 4.2: Get User via /api/auth/jwt/me
```javascript
fetch('/api/auth/jwt/me', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${window.testToken}`
  }
})
.then(r => r.json())
.then(data => console.log('✅ User Info:', data));
```

### Scenario 5: Vendor Profile Management

#### Test Case 5.1: Get Vendor Profile
```javascript
fetch('/api/vendor/profile', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${window.testToken}`
  }
})
.then(r => r.json())
.then(data => console.log('✅ Vendor Profile:', data));
```

#### Test Case 5.2: Update Vendor Profile
```javascript
fetch('/api/vendor/profile', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${window.testToken}`
  },
  body: JSON.stringify({
    phone: '+1234567890'
  })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Profile Updated:', data);
  console.log('Roles:', data.user.roles);
  console.log('Active Role:', data.user.activeRole);
});
```

### Scenario 6: Get User Roles

#### Test Case 6.1: Get Available Roles
```javascript
fetch('/api/users/YOUR_USER_ID/roles', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${window.testToken}`
  }
})
.then(r => r.json())
.then(data => {
  console.log('✅ Available Roles:', data.roles);
  console.log('Active Role:', data.activeRole);
});
```

## Frontend Testing

### Test Dashboard Switching

1. Login with dual-role user (e.g., `onyedika.akoma@gmail.com`)
2. Verify dashboard switch dropdown appears
3. Click dropdown and select "Vendor Dashboard"
4. Verify URL changes to `/vendor/dashboard`
5. Verify vendor-specific content appears
6. Switch back to "Buyer Dashboard"
7. Verify URL changes to `/dashboard`

### Test Become Vendor Flow

1. Login with single-role user (buyer only)
2. Navigate to profile or settings
3. Click "Become a Vendor" button
4. Fill out vendor onboarding form
5. Submit form
6. Verify user now has both roles
7. Verify dashboard switch dropdown appears

## Error Cases to Test

### Test Case E1: Switch to Invalid Role
```javascript
fetch('/api/auth/jwt/switch-role', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${window.testToken}`
  },
  body: JSON.stringify({ role: 'invalid' })
})
.then(r => r.json())
.then(data => console.log('Expected Error:', data));
```

Expected: `400 Bad Request` with error message

### Test Case E2: Access Vendor Profile Without Vendor Role
```javascript
// Login as buyer-only user first
fetch('/api/vendor/profile', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${window.buyerOnlyToken}`
  }
})
.then(r => r.json())
.then(data => console.log('Expected Error:', data));
```

Expected: `403 Forbidden` with "User is not a vendor" message

### Test Case E3: Unauthorized Access
```javascript
fetch('/api/auth/jwt/switch-role', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
    // No Authorization header
  },
  body: JSON.stringify({ role: 'vendor' })
})
.then(r => r.json())
.then(data => console.log('Expected Error:', data));
```

Expected: `401 Unauthorized` with "Authorization token required" message

## Existing User Migration

### Migrate Existing User to Dual Roles

For existing users like `admin@propertyark.com`, you can add vendor role:

```javascript
// First login to get token
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
  window.adminToken = data.token;
  
  // Then switch to vendor (will add role automatically)
  return fetch('/api/auth/jwt/switch-role', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${window.adminToken}`
    },
    body: JSON.stringify({ role: 'vendor' })
  });
})
.then(r => r.json())
.then(data => console.log('✅ Admin now has vendor role:', data));
```

## Verification Checklist

- [ ] Database migration completed successfully
- [ ] New users can register with dual roles
- [ ] Login returns correct roles array
- [ ] Role switching works (user ↔ vendor)
- [ ] `/api/auth/me` returns user info
- [ ] `/api/auth/jwt/me` returns user info
- [ ] Vendor profile can be created/updated
- [ ] Dashboard routing works based on active role
- [ ] Frontend dashboard switch dropdown appears for dual-role users
- [ ] Existing single-role users still work
- [ ] Error cases handled correctly

## Troubleshooting

### Issue: "Column roles does not exist"
**Solution**: Run database migration (see Prerequisites)

### Issue: "Role switch failed"
**Solution**: Check that user has valid JWT token and role is valid ('user', 'vendor', or 'admin')

### Issue: "User is not a vendor"
**Solution**: User needs to have 'vendor' in their roles array. Use switch-role endpoint to add it.

### Issue: Dashboard doesn't show role switcher
**Solution**: Verify user has multiple roles in their profile. Check browser console for role data.

## Next Steps

After successful testing:
1. Deploy to production
2. Update user documentation
3. Add role-based feature flags
4. Implement role-specific permissions
5. Add analytics for role switching behavior
