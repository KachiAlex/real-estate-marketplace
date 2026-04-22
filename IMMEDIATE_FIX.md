# Immediate Fix for Multi-Role Feature

## What Happened

The deployment had two issues:
1. ✅ Database migration worked - columns were added
2. ❌ Existing users have NULL in the new `roles` column
3. ❌ `/api/users` endpoint returned 404 (Vercel deployment issue)

## Quick Fix (Run This Now)

Wait 2-3 minutes for the new deployment, then run this in your browser console on https://real-estate-marketplace-delta.vercel.app:

### Step 1: Populate Roles for Existing Users

```javascript
fetch('/api/admin?action=populate-roles', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.json())
.then(data => {
  console.log('✅ Fixed existing users:', data);
  console.log(`Updated ${data.updatedCount} users`);
  console.log('Users:', data.users);
});
```

Expected output:
```
✅ Fixed existing users: {success: true, message: "Updated X users with roles", ...}
Updated 2 users
Users: [{email: "onyedika.akoma@gmail.com", roles: ["user"], ...}, ...]
```

### Step 2: Test Login Again

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
  console.log('✅ Login Result:');
  console.log('  Roles:', data.user.roles);  // Should now show ["user"]
  console.log('  Active Role:', data.user.activeRole);  // Should show "user"
  window.testToken = data.token;
});
```

### Step 3: Test Role Switching

```javascript
// Wait for Step 2 to complete, then run:
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
  console.log('✅ Role Switch Result:');
  console.log('  Roles:', data.user.roles);  // Should show ["user", "vendor"]
  console.log('  Active Role:', data.user.activeRole);  // Should show "vendor"
});
```

## Why This Fix Works

The `populate-roles` action:
1. Finds all users where `roles` is NULL
2. Copies the value from the old `role` column to the new `roles` array
3. Sets `activerole` to match the current `role`

This makes existing users compatible with the new multi-role system.

## About the /api/users 404 Issue

The `/api/users` endpoint returning 404 suggests one of these issues:

### Possible Cause 1: Vercel Function Limit
Vercel Hobby plan has a 12-function limit. We might have hit it.

**Check**: Count the files in `/api/` directory:
- api/admin.js
- api/auth/forgot-password.js
- api/auth/login.js
- api/auth/register.js
- api/auth/reset-password.js
- api/auth/jwt/me.js
- api/csrf-token.js
- api/properties.js
- api/upload/vendor/kyc.js
- api/upload/vendor/kyc/signed.js
- api/users.js ← NEW (11th function)

We should be at 11/12, so this shouldn't be the issue.

### Possible Cause 2: Vercel Build Error
The `api/users.js` file might have a build error.

**Solution**: Check Vercel dashboard → Deployments → Latest → Build Logs

### Possible Cause 3: Vercel Caching
Vercel might be caching the old deployment.

**Solution**: 
1. Hard refresh browser (Ctrl+Shift+R)
2. Wait 5 minutes for CDN cache to clear
3. Check Vercel dashboard for deployment status

## Verification

After running the fix, all these should work:

```javascript
// 1. Login returns roles
fetch('/api/auth/login', {...}).then(r => r.json()).then(d => console.log(d.user.roles));
// Expected: ["user"]

// 2. /api/auth/me works
fetch('/api/auth/me', {headers: {Authorization: `Bearer ${token}`}})
  .then(r => r.json()).then(d => console.log(d.user.roles));
// Expected: ["user"]

// 3. Role switching works (if /api/users is deployed)
fetch('/api/auth/jwt/switch-role', {...}).then(r => r.json()).then(d => console.log(d.user.roles));
// Expected: ["user", "vendor"]
```

## If /api/users Still Returns 404

If after 5 minutes the `/api/users` endpoint still returns 404, we have two options:

### Option A: Wait for Vercel
Sometimes Vercel takes longer to deploy. Check the dashboard.

### Option B: Alternative Implementation
We can implement role switching directly in the existing endpoints without needing `/api/users`. This would work around the deployment issue.

Let me know if you need Option B!

## Next Steps

1. Wait 2-3 minutes for deployment
2. Run Step 1 (populate-roles)
3. Run Step 2 (test login)
4. Run Step 3 (test role switching)
5. Report results

If Step 3 still returns 404, we'll implement the workaround.
