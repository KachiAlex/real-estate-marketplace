// Check the full login response to see what's actually being returned
fetch('/api/auth/login', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    email: 'onyedika.akoma@gmail.com',
    password: 'dikaoliver2660'
  })
})
.then(r => r.json())
.then(data => {
  console.log('=== FULL LOGIN RESPONSE ===');
  console.log('Full data:', data);
  console.log('\n=== USER OBJECT ===');
  console.log('User:', data.user);
  console.log('\n=== ROLES CHECK ===');
  console.log('user.roles:', data.user?.roles);
  console.log('user.role:', data.user?.role);
  console.log('user.activeRole:', data.user?.activeRole);
  console.log('user.activerole:', data.user?.activerole);
  
  console.log('\n=== FRONTEND STATE ===');
  console.log('Frontend seems to have userRoles: Array(2)');
  console.log('This suggests roles exist somewhere...');
  
  // Check all results
  fetch('/api/admin?action=setup-database', {method: 'POST'})
    .then(r => r.json())
    .then(d => {
      console.log('\n=== SETUP-DATABASE RESULTS ===');
      console.log('All results:', d.results);
      d.results.forEach(r => console.log(`  ${r.step}: ${r.status} - ${r.message}`));
    });
});
