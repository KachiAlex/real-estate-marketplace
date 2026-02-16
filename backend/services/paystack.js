// Paystack service for backend payment verification
const fetch = require('node-fetch');

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_VERIFY_URL = 'https://api.paystack.co/transaction/verify/';

async function verifyPaystackTransaction(reference) {
  if (!reference) throw new Error('No reference provided');
  const url = PAYSTACK_VERIFY_URL + encodeURIComponent(reference);
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  const data = await response.json();
  if (!data.status || !data.data) throw new Error('Invalid Paystack response');
  return data.data;
}

module.exports = { verifyPaystackTransaction };
