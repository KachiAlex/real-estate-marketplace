import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle } from 'react-icons/fa';

// Simulate fetching the current subscription fee (from admin config or localStorage)
function getSubscriptionFee() {
  const fee = localStorage.getItem('vendorSubscriptionFee');
  return fee ? Number(fee) : 50000;
}

export default function VendorSubscriptionPayment({ onPaymentSuccess }) {
  const [fee, setFee] = useState(getSubscriptionFee());
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setFee(getSubscriptionFee());
  }, []);

  const handlePay = () => {
    setPaying(true);
    setTimeout(() => {
      setPaying(false);
      setPaid(true);
      localStorage.setItem('vendorSubscriptionPaid', 'true');
      if (onPaymentSuccess) onPaymentSuccess();
    }, 2000); // Simulate payment
  };

  if (paid || localStorage.getItem('vendorSubscriptionPaid') === 'true') {
    return (
      <div style={{ textAlign: 'center', padding: 32 }}>
        <FaCheckCircle size={48} color="#10B981" />
        <h3 style={{ margin: '16px 0 8px' }}>Payment Complete</h3>
        <p>Your vendor subscription payment of ₦{fee.toLocaleString()} was successful.</p>
        <button
          style={{ marginTop: 24, background: '#10B981', color: '#fff', border: 'none', borderRadius: 6, padding: '12px 32px', fontSize: 18, cursor: 'pointer' }}
          onClick={() => navigate('/vendor/onboarding-dashboard')}
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', padding: 32, background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #0001' }}>
      <h2 style={{ fontSize: 24, marginBottom: 16 }}>Vendor Subscription Payment</h2>
      <p style={{ fontSize: 16, marginBottom: 24 }}>
        To complete your vendor onboarding, please pay the required subscription fee set by the admin.
      </p>
      <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 24 }}>
        Amount: <span style={{ color: '#10B981' }}>₦{fee.toLocaleString()}</span>
      </div>
      <button
        onClick={handlePay}
        disabled={paying}
        style={{ background: '#10B981', color: '#fff', border: 'none', borderRadius: 6, padding: '12px 32px', fontSize: 18, cursor: paying ? 'not-allowed' : 'pointer', opacity: paying ? 0.7 : 1 }}
      >
        {paying ? 'Processing...' : 'Pay Now'}
      </button>
    </div>
  );
}
