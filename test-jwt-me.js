// Test the /api/auth/jwt/me endpoint to see why it's returning 500

// First, login to get a valid token
fetch('/api/auth/login', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    email: 'onyedika.akoma@gmail.com',
    password: 'dikaoliver2660'
  })
})
.then(r => r.json())
.then(loginData => {
  console.log('✅ Login successful');
  console.log('Token:', loginData.token);
  
  // Now test /api/auth/jwt/me with the token
  return fetch('/api/auth/jwt/me', {
    headers: { 'Authorization': `Bearer ${loginData.token}` }
  });
})
.then(r => {
  console.log('Status:', r.status);
  return r.json();
})
.then(data => {
  console.log('✅ /api/auth/jwt/me response:', data);
  console.log('User roles:', data.user?.roles);
  console.log('Active role:', data.user?.activeRole);
})
.catch(err => {
  console.error('❌ Error:', err);
});
