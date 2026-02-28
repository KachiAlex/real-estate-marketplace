// src/services/paystackService.js
// Paystack payment integration for frontend

let paystackScriptLoadingPromise = null;

const PAYSTACK_INLINE_URL = 'https://js.paystack.co/v1/inline.js';

const loadPaystackScript = () => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window is not available'));
  }

  if (window.PaystackPop) {
    return Promise.resolve(window.PaystackPop);
  }

  if (paystackScriptLoadingPromise) {
    return paystackScriptLoadingPromise;
  }

  paystackScriptLoadingPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${PAYSTACK_INLINE_URL}"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        if (window.PaystackPop) {
          resolve(window.PaystackPop);
        } else {
          reject(new Error('Paystack SDK failed to initialize.'));
        }
      }, { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Paystack SDK.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = PAYSTACK_INLINE_URL;
    script.async = true;
    script.onload = () => {
      if (window.PaystackPop) {
        resolve(window.PaystackPop);
      } else {
        reject(new Error('Paystack SDK loaded but PaystackPop is undefined.'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load Paystack SDK.'));
    document.body.appendChild(script);
  }).finally(() => {
    paystackScriptLoadingPromise = null;
  });

  return paystackScriptLoadingPromise;
};

export const initializePaystackPayment = async ({ email, amount, reference, metadata, onSuccess, onClose, publicKey }) => {
  try {
    await loadPaystackScript();
  } catch (error) {
    console.error('[Paystack] Unable to load SDK', error);
    alert(error.message || 'Unable to load Paystack at the moment. Please try again.');
    return;
  }

  const keyToUse = publicKey || process.env.REACT_APP_PAYSTACK_PUBLIC_KEY;
  if (!keyToUse) {
    alert('Paystack public key not configured (set REACT_APP_PAYSTACK_PUBLIC_KEY).');
    return;
  }

  if (!window.PaystackPop) {
    alert('Paystack SDK not available. Please refresh and try again.');
    return;
  }

  const handler = window.PaystackPop.setup({
    key: keyToUse,
    email,
    amount: Number(amount || 0) * 100, // Paystack expects amount in kobo
    ref: reference,
    metadata,
    callback: onSuccess,
    onClose
  });
  handler.openIframe();
};
