import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useVendor } from '../contexts/VendorContext';

const steps = [
  'Business Info',
  'KYC Documents',
  'Review & Submit'
];

export default function OnboardVendor() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    businessName: '',
    businessType: '',
    licenseNumber: '',
    contactEmail: '',
    contactPhone: '',
    kycDocs: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { updateVendorProfile, uploadAgentDocument } = useVendor();

  const handleNext = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setForm({ ...form, kycDocs: Array.from(e.target.files) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      // 1. Upload KYC documents to backend
      let kycDocUrls = [];
      if (form.kycDocs && form.kycDocs.length > 0) {
        const uploadResult = await uploadAgentDocument(form.kycDocs);
        if (!uploadResult.success) {
          setError(uploadResult.error || 'Failed to upload KYC documents');
          setSubmitting(false);
          return;
        }
        kycDocUrls = uploadResult.data || [];
      }
      // 2. Submit vendor profile with KYC doc URLs
      await updateVendorProfile({
        businessName: form.businessName,
        businessType: form.businessType,
        licenseNumber: form.licenseNumber,
        contactInfo: {
          email: form.contactEmail,
          phone: form.contactPhone,
        },
        kycDocs: kycDocUrls,
        kycStatus: 'pending',
      });
      navigate('/vendor/dashboard');
    } catch (err) {
      setError('Failed to onboard. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Vendor Onboarding</h1>
      <div className="mb-4 flex space-x-2">
        {steps.map((label, idx) => (
          <div key={label} className={`px-3 py-1 rounded-full text-sm ${step === idx ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>{label}</div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {step === 0 && (
          <>
            <div>
              <label className="block mb-1 font-medium">Business Name</label>
              <input name="businessName" value={form.businessName} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
            </div>
            <div>
              <label className="block mb-1 font-medium">Business Type</label>
              <input name="businessType" value={form.businessType} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
            </div>
            <div>
              <label className="block mb-1 font-medium">License Number</label>
              <input name="licenseNumber" value={form.licenseNumber} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
            </div>
            <div>
              <label className="block mb-1 font-medium">Contact Email</label>
              <input name="contactEmail" value={form.contactEmail} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
            </div>
            <div>
              <label className="block mb-1 font-medium">Contact Phone</label>
              <input name="contactPhone" value={form.contactPhone} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
            </div>
          </>
        )}
        {step === 1 && (
          <div>
            <label className="block mb-1 font-medium">Upload KYC Documents</label>
            <input type="file" multiple onChange={handleFileChange} className="w-full" required />
          </div>
        )}
        {step === 2 && (
          <div>
            <h2 className="font-semibold mb-2">Review</h2>
            <ul className="mb-2 text-sm">
              <li><b>Business Name:</b> {form.businessName}</li>
              <li><b>Business Type:</b> {form.businessType}</li>
              <li><b>License Number:</b> {form.licenseNumber}</li>
              <li><b>Contact Email:</b> {form.contactEmail}</li>
              <li><b>Contact Phone:</b> {form.contactPhone}</li>
              <li><b>KYC Docs:</b> {form.kycDocs.length} file(s) selected</li>
            </ul>
          </div>
        )}
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div className="flex space-x-2">
          {step > 0 && <button type="button" onClick={handleBack} className="px-4 py-2 rounded bg-gray-200">Back</button>}
          {step < steps.length - 1 && <button type="button" onClick={handleNext} className="px-4 py-2 rounded bg-blue-600 text-white">Next</button>}
          {step === steps.length - 1 && <button type="submit" className="px-4 py-2 rounded bg-green-600 text-white" disabled={submitting}>{submitting ? 'Submitting...' : 'Register as Vendor'}</button>}
        </div>
      </form>
    </div>
  );
}
