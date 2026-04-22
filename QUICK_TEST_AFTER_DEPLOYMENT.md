# Quick Test After Deployment (2-3 minutes)

## Step 1: Clear Everything
```javascript
localStorage.clear();
location.reload();
```

## Step 2: Check for 500 Errors
- Open browser console (F12)
- Look for any red errors
- Should be clean ✅

## Step 3: Test Roles Persistence

Copy and paste this entire block:

```javascript
(async function quickTest() {
  console.log('🧪 Quick Roles Persistence Test\n');
  
  // Login
  const login1 = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      email: 'onyedika.akoma@gmail.com',
      password: 'dikaoliver2660'
    })
  }).then(r => r.json());
  
  console.log('1️⃣ Initial login:', login1.user.roles);
  
  // Switch to vendor
  const switched = await fetch('/api/auth/jwt/switch-role', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${login1.token}`
    },
    body: JSON.stringify({ role: 'vendor' })
  }).then(r => r.json());
  
  console.log('2️⃣ After switch:', switched.user.roles);
  
  // Logout
  localStorage.clear();
  console.log('3️⃣ Logged out');
  
  // Login again
  const login2 = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      email: 'onyedika.akoma@gmail.com',
      password: 'dikaoliver2660'
    })
  }).then(r => r.json());
  
  console.log('4️⃣ After re-login:', login2.user.roles);
  
  // Check result
  if (login2.user.roles.includes('vendor')) {
    console.log('\n✅ SUCCESS: Vendor role persisted!');
  } else {
    console.log('\n❌ FAILED: Vendor role was lost');
  }
})();
```

## Expected Output

```
🧪 Quick Roles Persistence Test

1️⃣ Initial login: ['user']
2️⃣ After switch: ['user', 'vendor']
3️⃣ Logged out
4️⃣ After re-login: ['user', 'vendor']

✅ SUCCESS: Vendor role persisted!
```

## If Test Passes

✅ Everything is working!
- No 500 errors
- Roles persist across logout/login
- Multi-role feature is complete

## If Test Fails

Run the detailed test:
```javascript
// Copy contents of test-roles-persistence.js
```

And share the output with me.

---

**Deployment Status:** Pushed to GitHub and GitLab
**Commit:** `9a02c25`
**Wait Time:** 2-3 minutes
