// src/services/paystackService.js
// Paystack payment integration for frontend

export const initializePaystackPayment = ({ email, amount, reference, metadata, onSuccess, onClose }) => {
  if (!window.PaystackPop) {
    alert('Paystack SDK not loaded');
    return;
  }
  const handler = window.PaystackPop.setup({
    key: process.env.REACT_APP_PAYSTACK_PUBLIC_KEY,
    email,
    amount: amount * 100, // Paystack expects amount in kobo
    ref: reference,
    metadata,
    callback: onSuccess,
    onClose
  });
  handler.openIframe();
};
