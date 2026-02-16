import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getApiUrl } from '../utils/apiConfig';
import { initializePaystackPayment } from '../utils/paystack';

const OnboardingWizard = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    businessName: '',
    businessType: '',
    email: '',
    phone: '',
    kycDocs: [],
    paymentComplete: false
  });

  // Step 1: Business Info
  const handleBusinessSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/vendor/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: form.businessName,
          businessType: form.businessType,
          email: form.email,
          phone: form.phone
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success('Business info saved!');
      setStep(1);
    } catch (err) {
      toast.error(err.message || 'Failed to save business info');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: KYC
  const handleKycSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/vendor/kyc/submit'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          documents: form.kycDocs
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success('KYC submitted!');
      setStep(2);
    } catch (err) {
      toast.error(err.message || 'Failed to submit KYC');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Payment
  const handlePayment = () => {
    setLoading(true);
    const paystackKey = process.env.REACT_APP_PAYSTACK_PUBLIC_KEY;
    const reference = `SUB_${Date.now()}`;
    initializePaystackPayment({
      key: paystackKey,
      email: form.email,
      amount: 50000 * 100,
      reference,
      onSuccess: () => {
        toast.success('Payment successful!');
        setForm((prev) => ({ ...prev, paymentComplete: true }));
        setTimeout(() => {
          navigate('/vendor/dashboard');
        }, 2000);
      },
      onClose: () => {
        toast('Payment window closed.');
        setLoading(false);
      }
    });
  };

  // UI
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6 text-center">Vendor Onboarding</h1>
        {step === 0 && (
          <form onSubmit={handleBusinessSubmit} className="space-y-4 bg-white p-6 rounded shadow">
            <input type="text" placeholder="Business Name" value={form.businessName} onChange={e => setForm({ ...form, businessName: e.target.value })} required className="w-full border p-2 rounded" />
            <input type="text" placeholder="Business Type" value={form.businessType} onChange={e => setForm({ ...form, businessType: e.target.value })} required className="w-full border p-2 rounded" />
            <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required className="w-full border p-2 rounded" />
            <input type="text" placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full border p-2 rounded" />
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded">{loading ? 'Saving...' : 'Continue to KYC'}</button>
          </form>
        )}
        {step === 1 && (
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-lg font-semibold mb-4">Upload KYC Documents</h2>
            <input type="file" multiple onChange={e => setForm({ ...form, kycDocs: Array.from(e.target.files) })} className="w-full border p-2 rounded mb-4" />
            <button onClick={handleKycSubmit} disabled={loading || !form.kycDocs.length} className="w-full bg-blue-600 text-white py-2 rounded">{loading ? 'Submitting...' : 'Submit KYC & Continue'}</button>
          </div>
        )}
        {step === 2 && (
          <div className="bg-white p-6 rounded shadow text-center">
            <h2 className="text-lg font-semibold mb-4">Pay Subscription Fee</h2>
            <p className="mb-4">Monthly Fee: <span className="font-bold">₦50,000</span></p>
            <button onClick={handlePayment} disabled={loading || form.paymentComplete} className="w-full bg-green-600 text-white py-2 rounded">{loading ? 'Processing...' : 'Pay & Complete Onboarding'}</button>
          </div>
        )}
        {form.paymentComplete && (
          <div className="bg-green-50 p-6 rounded shadow text-center mt-6">
            <h2 className="text-lg font-semibold mb-2 text-green-700">Onboarding Complete!</h2>
            <p className="text-green-800">You are now a vendor. Redirecting to dashboard...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingWizard;
