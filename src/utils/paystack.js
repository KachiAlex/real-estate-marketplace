// Paystack utility for frontend payment initialization
// Usage: import { initializePaystackPayment } from './paystack';

export function initializePaystackPayment({ key, email, amount, reference, onSuccess, onClose }) {
  if (!window.PaystackPop) {
    console.error('PaystackPop not loaded');
    return;
  }
  const handler = window.PaystackPop.setup({
    key,
    email,
    amount,
    ref: reference,
    callback: onSuccess,
    onClose,
  });
  handler.openIframe();
}

// Example:
// initializePaystackPayment({
//   key: 'pk_test_xxx',
//   email: 'user@example.com',
//   amount: 50000,
//   reference: 'REF123',
//   onSuccess: (response) => { ... },
//   onClose: () => { ... },
// });
