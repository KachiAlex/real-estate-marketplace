
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle } from 'react-icons/fa';
import { getApiUrl } from '../utils/apiConfig';
import { authenticatedFetch } from '../utils/authToken';


export default function VendorSubscriptionPayment({ onPaymentSuccess }) {
  const [fee, setFee] = useState(50000); // Default value until fetched
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [loadingFee, setLoadingFee] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchFee() {
      setLoadingFee(true);
      setError('');
      try {
        const response = await authenticatedFetch(getApiUrl('/admin/settings'));
        if (!response.ok) throw new Error('Failed to fetch subscription fee');
        const data = await response.json();
        if (data && data.success && typeof data.data?.vendorSubscriptionFee === 'number') {
          setFee(data.data.vendorSubscriptionFee);
        } else {
          setFee(50000); // fallback
        }
      } catch (err) {
        setError('Unable to load subscription fee. Please try again.');
        setFee(50000);
      } finally {
        setLoadingFee(false);
      }
    }
    fetchFee();
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


  if (loadingFee) {
    return (
      <div style={{ textAlign: 'center', padding: 32 }}>
        <p>Loading subscription fee...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: 32, color: 'red' }}>
        <p>{error}</p>
      </div>
    );
  }

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
