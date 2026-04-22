/**
 * Multi-Role Deployment Test Script
 * 
 * Copy and paste this entire script into your browser console
 * on https://real-estate-marketplace-delta.vercel.app
 * 
 * It will automatically run all tests and report results.
 */

(async function testMultiRoleDeployment() {
  console.log('🚀 Starting Multi-Role Deployment Tests...\n');
  
  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  // Helper function to test an endpoint
  async function testEndpoint(name, url, options = {}) {
    try {
      const response = await fetch(url, options);
      const data = await response.json().catch(() => ({}));
      
      if (response.ok) {
        results.passed.push(name);
        console.log(`✅ ${name}: PASSED`);
        return { success: true, data, status: response.status };
      } else {
        results.failed.push(`${name} (${response.status})`);
        console.log(`❌ ${name}: FAILED (${response.status})`);
        console.log('   Response:', data);
        return { success: false, data, status: response.status };
      }
    } catch (error) {
      results.failed.push(`${name} (${error.message})`);
      console.log(`❌ ${name}: ERROR - ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // Test 1: Database Migration
  console.log('\n📦 Test 1: Database Migration');
  const migration = await testEndpoint(
    'Database Migration',
    '/api/admin?action=setup-database',
    { method: 'POST', headers: { 'Content-Type': 'application/json' } }
  );

  if (migration.success) {
    console.log('   Migration results:', migration.data.results);
  }

  // Test 2: Login with existing user
  console.log('\n🔐 Test 2: Login with Existing User');
  const login = await testEndpoint(
    'Login',
    '/api/auth/login',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'onyedika.akoma@gmail.com',
        password: 'dikaoliver2660'
      })
    }
  );

  let token = null;
  if (login.success) {
    token = login.data.token || login.data.accessToken;
    console.log('   User roles:', login.data.user?.roles);
    console.log('   Active role:', login.data.user?.activeRole);
    
    if (!login.data.user?.roles) {
      results.warnings.push('Login response missing roles array');
    }
  }

  // Test 3: Get current user via /api/auth/me
  console.log('\n👤 Test 3: Get User Info (/api/auth/me)');
  if (token) {
    const me = await testEndpoint(
      'Get User (/api/auth/me)',
      '/api/auth/me',
      {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    
    if (me.success) {
      console.log('   User roles:', me.data.user?.roles);
      console.log('   Active role:', me.data.user?.activeRole);
    }
  } else {
    results.failed.push('Get User (/api/auth/me) - No token available');
    console.log('❌ Get User (/api/auth/me): SKIPPED (no token)');
  }

  // Test 4: Get current user via /api/auth/jwt/me
  console.log('\n👤 Test 4: Get User Info (/api/auth/jwt/me)');
  if (token) {
    const jwtMe = await testEndpoint(
      'Get User (/api/auth/jwt/me)',
      '/api/auth/jwt/me',
      {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    
    if (jwtMe.success) {
      console.log('   User roles:', jwtMe.data.user?.roles);
      console.log('   Active role:', jwtMe.data.user?.activeRole);
    }
  } else {
    results.failed.push('Get User (/api/auth/jwt/me) - No token available');
    console.log('❌ Get User (/api/auth/jwt/me): SKIPPED (no token)');
  }

  // Test 5: Switch to vendor role
  console.log('\n🔄 Test 5: Switch to Vendor Role');
  if (token) {
    const switchRole = await testEndpoint(
      'Switch Role to Vendor',
      '/api/auth/jwt/switch-role',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: 'vendor' })
      }
    );
    
    if (switchRole.success) {
      console.log('   New roles:', switchRole.data.user?.roles);
      console.log('   Active role:', switchRole.data.user?.activeRole);
      
      if (switchRole.data.user?.activeRole !== 'vendor') {
        results.warnings.push('Active role not set to vendor after switch');
      }
    }
  } else {
    results.failed.push('Switch Role - No token available');
    console.log('❌ Switch Role: SKIPPED (no token)');
  }

  // Test 6: Get vendor profile
  console.log('\n🏪 Test 6: Get Vendor Profile');
  if (token) {
    const vendorProfile = await testEndpoint(
      'Get Vendor Profile',
      '/api/vendor/profile',
      {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    
    if (vendorProfile.success) {
      console.log('   Profile:', vendorProfile.data.profile);
    }
  } else {
    results.failed.push('Get Vendor Profile - No token available');
    console.log('❌ Get Vendor Profile: SKIPPED (no token)');
  }

  // Test 7: Switch back to user role
  console.log('\n🔄 Test 7: Switch Back to User Role');
  if (token) {
    const switchBack = await testEndpoint(
      'Switch Role to User',
      '/api/auth/jwt/switch-role',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: 'user' })
      }
    );
    
    if (switchBack.success) {
      console.log('   New roles:', switchBack.data.user?.roles);
      console.log('   Active role:', switchBack.data.user?.activeRole);
      
      if (switchBack.data.user?.activeRole !== 'user') {
        results.warnings.push('Active role not set to user after switch');
      }
    }
  } else {
    results.failed.push('Switch Back to User - No token available');
    console.log('❌ Switch Back to User: SKIPPED (no token)');
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⚠️  Warnings: ${results.warnings.length}`);
  
  if (results.passed.length > 0) {
    console.log('\n✅ Passed Tests:');
    results.passed.forEach(test => console.log(`   - ${test}`));
  }
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    results.failed.forEach(test => console.log(`   - ${test}`));
  }
  
  if (results.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    results.warnings.forEach(warning => console.log(`   - ${warning}`));
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (results.failed.length === 0) {
    console.log('🎉 ALL TESTS PASSED! Multi-role feature is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.');
  }
  
  console.log('\n💡 Next Steps:');
  console.log('   1. If all tests passed, the feature is ready to use');
  console.log('   2. Test the frontend dashboard switcher');
  console.log('   3. Try registering a new user with dual roles');
  console.log('   4. Monitor Vercel logs for any errors');
  
  // Store token globally for manual testing
  if (token) {
    window.testToken = token;
    console.log('\n💾 Token saved to window.testToken for manual testing');
  }
  
  return results;
})();
