// admin-create.js
const fetch = require('node-fetch');

async function createAdmin() {
  const url = 'https://real-estate-marketplace-1-k8jp.onrender.com/api/auth/jwt/register';
  const payload = {
    email: 'admin@propertyark.com',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin'
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', data);
  } catch (err) {
    console.error('Error creating admin:', err);
  }
}

createAdmin();
