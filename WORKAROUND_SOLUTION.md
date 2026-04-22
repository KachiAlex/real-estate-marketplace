# Workaround Solution - Direct Database Fix

## Problem
Vercel is not deploying our new code changes. Both `api/users.js` and the updated `api/admin.js` are not being deployed.

## Root Cause
Likely one of:
1. Vercel function limit reached (12/12)
2. Vercel build cache issue
3. Vercel deployment configuration problem

## Immediate Workaround

Since we can't deploy new endpoints, we'll use the existing `setup-database` action to populate roles.

### Step 1: Update api/admin.js Locally

Modify the `setupDatabase` function to also populate roles:

```javascript
// In api/admin.js, add this at the end of setupDatabase function, before the final return

// Populate roles for existing users
const populateResult = await client.query(`
  UPDATE users 
  SET roles = ARRAY[role], activerole = role 
  WHERE roles IS NULL OR activerole IS NULL
  RETURNING id, email
`);

if (populateResult.rowCount > 0) {
  results.push({
    step: 'populate_roles',
    status: 'updated',
    message: `Populated roles for ${populateResult.rowCount} existing users`
  });
} else {
  results.push({
    step: 'populate_roles',
    status: 'ok',
    message: 'All users already have roles populated'
  });
}
```

### Step 2: Alternative - Use Database Console

If you have access to your PostgreSQL database console (Render, Heroku, etc.):

```sql
-- Connect to your database and run:
UPDATE users 
SET roles = ARRAY[role], activerole = role 
WHERE roles IS NULL OR activerole IS NULL;

-- Verify:
SELECT email, role, roles, activerole FROM users;
```

### Step 3: Test Without api/users.js

Since `api/users.js` isn't deploying, we need to modify the existing endpoints to handle role switching.

Add to `api/auth/login.js` at the end, before the final return:

```javascript
// If user has NULL roles, populate it now
if (!user.roles || user.roles.length === 0) {
  await client.query(
    'UPDATE users SET roles = ARRAY[$1], activerole = $2 WHERE id = $3',
    [user.role, user.role, user.id]
  );
  user.roles = [user.role];
  user.activerole = user.role;
}
```

## Quick Test

After making these changes, test login:

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
  console.log('Roles:', data.user.roles);
  // Should now show ["user"] even without populate-roles
});
```

## Why Vercel Isn't Deploying

Let me investigate the Vercel configuration...

### Check 1: Function Count

List all API files:
```bash
find api -name "*.js" -type f | wc -l
```

If this is >= 12, we've hit the limit.

### Check 2: Vercel Build Logs

Check https://vercel.com/dashboard → Your Project → Deployments → Latest → View Function Logs

Look for:
- "No more than 12 Serverless Functions"
- Build errors
- Deployment warnings

### Check 3: Git Status

Verify files are actually in the repo:
```bash
git ls-files api/users.js
git show HEAD:api/admin.js | grep populate-roles
```

## Recommended Action

Since Vercel deployments are problematic, let's:

1. **Immediate**: Use database console to run the UPDATE query
2. **Short-term**: Modify `api/auth/login.js` to auto-populate roles
3. **Long-term**: Debug Vercel deployment issue

Would you like me to:
A) Modify login.js to auto-populate roles (no new deployment needed)
B) Provide database console instructions
C) Debug the Vercel deployment issue

Let me know which approach you prefer!
