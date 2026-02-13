import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VendorSubscriptionPayment from '../components/VendorSubscriptionPayment';
import { FaCheckCircle } from 'react-icons/fa';

export default function VendorOnboardingDashboard() {
  const navigate = useNavigate();
  const [paymentComplete, setPaymentComplete] = useState(
    typeof window !== 'undefined' && window.localStorage && localStorage.getItem('vendorSubscriptionPaid') === 'true'
  );

  if (!paymentComplete) {
    return <VendorSubscriptionPayment onPaymentSuccess={() => setPaymentComplete(true)} />;
  }

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', padding: 32, background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #0001' }}>
      <h2 style={{ fontSize: 28, marginBottom: 16 }}>Complete Your Vendor Onboarding</h2>
      <p style={{ fontSize: 16, marginBottom: 24 }}>
        To access the vendor dashboard and manage your properties, please complete the onboarding process. This helps us verify your identity and set up your vendor profile.
      </p>
      <button
        onClick={() => navigate('/vendor/register')}
        style={{ background: '#10B981', color: '#fff', border: 'none', borderRadius: 6, padding: '12px 32px', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
      >
        <FaCheckCircle /> Start Onboarding
      </button>
    </div>
  );
}
