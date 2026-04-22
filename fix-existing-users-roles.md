# Fix Existing Users - Populate Roles Column

## Problem
The database migration added the `roles` and `activerole` columns, but existing users have NULL values. This causes the login endpoint to return `undefined` for roles.

## Solution
We need to populate the roles column for existing users based on their current `role` column.

## Option 1: Via API Endpoint (Recommended)

Add this action to `api/admin.js`:

```javascript
// Add to the switch statement in api/admin.js
case 'populate-roles':
  return await populateRoles(req, res);
```

Then add this function:

```javascript
// Add to api/admin.js
async function populateRoles(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const client = await getPool().connect();
  try {
    // Update all users where roles is NULL
    const result = await client.query(`
      UPDATE users 
      SET roles = ARRAY[role], activerole = role 
      WHERE roles IS NULL OR activerole IS NULL
      RETURNING id, email, role, roles, activerole
    `);

    console.log(`✅ Updated ${result.rowCount} users with roles`);

    return res.json({
      success: true,
      message: `Updated ${result.rowCount} users`,
      users: result.rows.map(u => ({
        email: u.email,
        role: u.role,
        roles: u.roles,
        activeRole: u.activerole
      }))
    });
  } catch (error) {
    console.error('Populate roles error:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
}
```

Then run in browser console:

```javascript
fetch('/api/admin?action=populate-roles', {
  method: 'POST'
})
.then(r => r.json())
.then(data => console.log('✅ Fixed:', data));
```

## Option 2: Direct SQL (If you have database access)

Connect to your PostgreSQL database and run:

```sql
-- Populate roles array from role column for users where roles is NULL
UPDATE users 
SET roles = ARRAY[role], activerole = role 
WHERE roles IS NULL OR activerole IS NULL;

-- Verify the update
SELECT id, email, role, roles, activerole 
FROM users 
LIMIT 10;
```

## Option 3: Quick Fix via Existing Endpoint

We can use the existing switch-role endpoint to populate roles. But first we need api/users.js to be deployed.

## Verification

After running the fix, test with:

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
  console.log('Active Role:', data.user.activeRole);
  // Should now show: roles: ["user"], activeRole: "user"
});
```

## Why This Happened

The database migration added the columns but didn't populate them with data. Existing users have:
- `role`: "user" (old column, still has data)
- `roles`: NULL (new column, empty)
- `activerole`: NULL (new column, empty)

The login endpoint queries both columns and returns NULL for the new ones.

## Immediate Workaround

Until api/users.js is deployed, you can manually update the database or add the populate-roles action to api/admin.js.
