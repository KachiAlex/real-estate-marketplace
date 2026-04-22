/**
 * Test Roles Persistence Across Logout/Login
 * 
 * This script tests that roles are properly saved to the database
 * and persist across logout and login cycles.
 */

(async function testRolesPersistence() {
  console.log('🧪 Testing Roles Persistence...\n');
  
  // Step 1: Login
  console.log('Step 1: Login');
  const loginResp = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      email: 'onyedika.akoma@gmail.com',
      password: 'dikaoliver2660'
    })
  });
  
  const loginData = await loginResp.json();
  console.log('✅ Login successful');
  console.log('   Initial roles:', loginData.user.roles);
  console.log('   Active role:', loginData.user.activeRole);
  
  const token1 = loginData.token;
  
  // Step 2: Switch to vendor role
  console.log('\nStep 2: Switch to vendor role');
  const switchResp = await fetch('/api/auth/jwt/switch-role', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token1}`
    },
    body: JSON.stringify({ role: 'vendor' })
  });
  
  const switchData = await switchResp.json();
  console.log('✅ Role switched');
  console.log('   New roles:', switchData.user.roles);
  console.log('   Active role:', switchData.user.activeRole);
  
  // Step 3: Verify roles are in database
  console.log('\nStep 3: Verify roles in database via /me');
  const meResp = await fetch('/api/auth/jwt/me', {
    headers: { 'Authorization': `Bearer ${token1}` }
  });
  
  const meData = await meResp.json();
  console.log('✅ Database check');
  console.log('   Roles from DB:', meData.user.roles);
  console.log('   Active role from DB:', meData.user.activeRole);
  
  // Step 4: Simulate logout (just clear local storage)
  console.log('\nStep 4: Simulate logout');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  console.log('✅ Logged out (cleared tokens)');
  
  // Step 5: Login again
  console.log('\nStep 5: Login again');
  const loginResp2 = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      email: 'onyedika.akoma@gmail.com',
      password: 'dikaoliver2660'
    })
  });
  
  const loginData2 = await loginResp2.json();
  console.log('✅ Logged in again');
  console.log('   Roles after re-login:', loginData2.user.roles);
  console.log('   Active role after re-login:', loginData2.user.activeRole);
  
  // Step 6: Verify results
  console.log('\n' + '='.repeat(60));
  console.log('📊 PERSISTENCE TEST RESULTS');
  console.log('='.repeat(60));
  
  const rolesMatch = JSON.stringify(switchData.user.roles.sort()) === JSON.stringify(loginData2.user.roles.sort());
  const hasVendorRole = loginData2.user.roles.includes('vendor');
  
  if (rolesMatch && hasVendorRole) {
    console.log('✅ SUCCESS: Roles persisted across logout/login!');
    console.log('   Before logout:', switchData.user.roles);
    console.log('   After re-login:', loginData2.user.roles);
    console.log('   ✅ Vendor role is still present');
  } else {
    console.log('❌ FAILED: Roles did not persist');
    console.log('   Before logout:', switchData.user.roles);
    console.log('   After re-login:', loginData2.user.roles);
    if (!hasVendorRole) {
      console.log('   ❌ Vendor role was lost!');
    }
  }
  
  console.log('\n' + '='.repeat(60));
  
  // Save token for further testing
  window.testToken = loginData2.token;
  console.log('\n💾 Token saved to window.testToken');
  
})();
