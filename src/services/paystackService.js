// src/services/paystackService.js
// Paystack payment integration for frontend

export const initializePaystackPayment = ({ email, amount, reference, metadata, onSuccess, onClose, publicKey }) => {
  if (!window.PaystackPop) {
    alert('Paystack SDK not loaded');
    return;
  }
  const keyToUse = publicKey || process.env.REACT_APP_PAYSTACK_PUBLIC_KEY;
  if (!keyToUse) {
    alert('Paystack public key not configured (REACT_APP_PAYSTACK_PUBLIC_KEY)');
    return;
  }
  const handler = window.PaystackPop.setup({
    key: keyToUse,
    email,
    amount: amount * 100, // Paystack expects amount in kobo
    ref: reference,
    metadata,
    callback: onSuccess,
    onClose
  });
  handler.openIframe();
};
