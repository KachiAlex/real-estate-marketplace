// src/services/propertyApi.js
// API for property verification requests

export async function requestPropertyVerification({ propertyId, paymentReference, amount }) {
  const token = localStorage.getItem('token');
  const res = await fetch('/api/properties/verify-request', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ propertyId, paymentReference, amount })
  });
  if (!res.ok) throw new Error('Failed to request property verification');
  return res.json();
}
