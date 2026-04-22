/**
 * Deployment Diagnostic Script
 * Run this in browser console to diagnose the issue
 */

(async function diagnose() {
  console.log('🔍 Running Deployment Diagnostics...\n');
  
  // Test 1: Check if api/users.js endpoint exists
  console.log('Test 1: Checking if /api/users endpoint exists...');
  try {
    const resp = await fetch('/api/users?action=get-roles', {
      headers: { 'Authorization': 'Bearer invalid-token' }
    });
    
    if (resp.status === 404) {
      console.log('❌ /api/users endpoint NOT FOUND (404)');
      console.log('   This means api/users.js was not deployed by Vercel');
      console.log('   Possible causes:');
      console.log('   - Vercel build still in progress');
      console.log('   - Vercel function limit reached (12/12)');
      console.log('   - Build error in api/users.js');
    } else if (resp.status === 401) {
      console.log('✅ /api/users endpoint EXISTS (401 = needs valid token)');
    } else {
      console.log(`⚠️  /api/users returned unexpected status: ${resp.status}`);
    }
  } catch (e) {
    console.log('❌ Error testing /api/users:', e.message);
  }
  
  // Test 2: Login and check roles
  console.log('\nTest 2: Testing login and roles...');
  try {
    const loginResp = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'onyedika.akoma@gmail.com',
        password: 'dikaoliver2660'
      })
    });
    
    const loginData = await loginResp.json();
    
    if (loginResp.ok) {
      console.log('✅ Login successful');
      console.log('   User object:', loginData.user);
      console.log('   Roles:', loginData.user?.roles);
      console.log('   Active Role:', loginData.user?.activeRole);
      
      if (!loginData.user?.roles) {
        console.log('❌ PROBLEM: roles is undefined');
        console.log('   This means the login endpoint is not returning roles');
        console.log('   Possible causes:');
        console.log('   - Updated api/auth/login.js not deployed');
        console.log('   - Database roles column is NULL for this user');
      }
      
      window.diagToken = loginData.token;
    } else {
      console.log('❌ Login failed:', loginData.message);
    }
  } catch (e) {
    console.log('❌ Login error:', e.message);
  }
  
  // Test 3: Check database migration
  console.log('\nTest 3: Checking database migration...');
  try {
    const migResp = await fetch('/api/admin?action=setup-database', {
      method: 'POST'
    });
    
    const migData = await migResp.json();
    
    if (migData.success) {
      console.log('✅ Database migration successful');
      const rolesCol = migData.results.find(r => r.step.includes('roles'));
      const activeRoleCol = migData.results.find(r => r.step.includes('activerole'));
      
      if (rolesCol) {
        console.log(`   roles column: ${rolesCol.status} - ${rolesCol.message}`);
      }
      if (activeRoleCol) {
        console.log(`   activerole column: ${activeRoleCol.status} - ${activeRoleCol.message}`);
      }
    }
  } catch (e) {
    console.log('❌ Migration check error:', e.message);
  }
  
  // Test 4: Direct database query via /api/auth/jwt/me
  if (window.diagToken) {
    console.log('\nTest 4: Checking user data from database...');
    try {
      const meResp = await fetch('/api/auth/jwt/me', {
        headers: { 'Authorization': `Bearer ${window.diagToken}` }
      });
      
      const meData = await meResp.json();
      
      if (meResp.ok) {
        console.log('✅ /api/auth/jwt/me successful');
        console.log('   User roles from DB:', meData.user?.roles);
        console.log('   Active role from DB:', meData.user?.activeRole);
        
        if (!meData.user?.roles) {
          console.log('❌ PROBLEM: Database has NULL roles for this user');
          console.log('   Solution: Need to populate roles column');
        }
      }
    } catch (e) {
      console.log('❌ /me error:', e.message);
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 DIAGNOSTIC SUMMARY');
  console.log('='.repeat(60));
  console.log('\nIf /api/users returns 404:');
  console.log('  → Vercel did not deploy api/users.js');
  console.log('  → Check Vercel dashboard for build errors');
  console.log('  → May have hit 12-function limit');
  console.log('\nIf roles is undefined:');
  console.log('  → Database roles column exists but is NULL');
  console.log('  → Need to populate roles for existing users');
  console.log('  → Run: UPDATE users SET roles = ARRAY[role] WHERE roles IS NULL');
  console.log('\n' + '='.repeat(60));
  
})();
