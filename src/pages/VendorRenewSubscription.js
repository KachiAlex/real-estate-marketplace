
import React, { useState } from 'react';
import { useVendor } from '../contexts/VendorContext';
import { useNavigate } from 'react-router-dom';
import { FaExclamationTriangle, FaCheckCircle, FaCalendarAlt } from 'react-icons/fa';


export default function VendorRenewSubscription() {
  const { subscription, markSubscriptionPaid } = useVendor();
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const navigate = useNavigate();
  const fee = subscription?.fee || 50000;
  const lastPaid = subscription?.lastPaid ? new Date(subscription.lastPaid) : null;
  const nextDue = subscription?.nextDue ? new Date(subscription.nextDue) : null;

  const handleRenew = async () => {
    setPaying(true);
    setTimeout(async () => {
      await markSubscriptionPaid(fee);
      setPaying(false);
      setPaid(true);
      setTimeout(() => navigate('/vendor/dashboard'), 1500);
    }, 2000);
  };

  if (paid) {
    return (
      <div style={{ textAlign: 'center', padding: 32 }}>
        <FaCheckCircle size={48} color="#10B981" />
        <h3 style={{ margin: '16px 0 8px' }}>Subscription Renewed</h3>
        <p>Your vendor subscription has been renewed. Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', padding: 32, background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #0001' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <FaExclamationTriangle color="#F59E42" size={32} />
        <h2 style={{ fontSize: 24 }}>Subscription Expired</h2>
      </div>
      <p style={{ fontSize: 16, marginBottom: 16 }}>
        Your monthly vendor subscription has expired. Please renew to regain access to your dashboard and features.
      </p>
      <div style={{ background: '#F3F4F6', borderRadius: 8, padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <FaCalendarAlt color="#6B7280" />
          <span style={{ fontWeight: 500 }}>Last Paid:</span>
          <span>{lastPaid ? lastPaid.toLocaleDateString() : '—'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FaCalendarAlt color="#6B7280" />
          <span style={{ fontWeight: 500 }}>Next Due:</span>
          <span>{nextDue ? nextDue.toLocaleDateString() : '—'}</span>
        </div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 24 }}>
        Amount Due: <span style={{ color: '#10B981' }}>₦{fee.toLocaleString()}</span>
      </div>
      <button
        onClick={handleRenew}
        disabled={paying}
        style={{ background: '#10B981', color: '#fff', border: 'none', borderRadius: 6, padding: '12px 32px', fontSize: 18, cursor: paying ? 'not-allowed' : 'pointer', opacity: paying ? 0.7 : 1 }}
      >
        {paying ? 'Processing...' : 'Renew Subscription'}
      </button>
      <div style={{ marginTop: 24, color: '#6B7280', fontSize: 14, textAlign: 'center' }}>
        <p>
          Subscription is required to maintain access to your vendor dashboard and features.<br />
          If you have any issues with payment, please contact support.
        </p>
      </div>
    </div>
  );
}
