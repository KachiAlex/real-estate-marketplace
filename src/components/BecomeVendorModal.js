import React, { useState } from 'react';
import Modal from './Modal';
import { useAuth } from '../contexts/AuthContext-new';
import toast from 'react-hot-toast';
import { getApiUrl } from '../utils/apiConfig';

const BecomeVendorModal = ({ isOpen, onClose }) => {
  const { addRole, currentUser, accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [businessName, setBusinessName] = useState(currentUser?.vendorData?.businessName || '');
  const [isRegistered, setIsRegistered] = useState(false);
  const [cacNumber, setCacNumber] = useState('');
  const [utilityDocs, setUtilityDocs] = useState([]);
  const [idDocs, setIdDocs] = useState([]);

  const onUtilityChange = (e) => setUtilityDocs(Array.from(e.target.files || []));
  const onIdChange = (e) => setIdDocs(Array.from(e.target.files || []));

  const submit = async (e) => {
    e.preventDefault();
    if (!businessName || businessName.trim().length === 0) return toast.error('Business name is required');
    setLoading(true);
    try {
      // 1) Upload utility and ID files separately (so we can tag them)
      let uploaded = [];
      const uploadGroup = async (files) => {
        if (!files || !files.length) return [];
        const fd = new FormData();
        files.forEach((f) => fd.append('documents', f));
        const resp = await fetch(getApiUrl('/upload/vendor/kyc'), {
          method: 'POST',
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
          body: fd
        });
        const json = await resp.json().catch(() => ({}));
        if (!resp || !resp.ok) throw new Error(json.message || 'Upload failed');
        return (json.data && json.data.uploaded) || [];
      };

      const utilUploaded = await uploadGroup(utilityDocs);
      const idUploaded = await uploadGroup(idDocs);

      // Tag uploaded docs with type
      uploaded = [
        ...utilUploaded.map(u => ({ ...u, docType: 'utility' })),
        ...idUploaded.map(u => ({ ...u, docType: 'id' }))
      ];

      // 2) Ensure user has vendor role locally/server-side
      try { await addRole('vendor', false); } catch (e) { /* ignore non-fatal */ }

      // 3) Persist vendor profile (businessName, registration info, and any uploaded doc refs)
      const body = {
        businessName: businessName,
        businessType: isRegistered ? 'registered' : 'individual',
        cacNumber: isRegistered ? cacNumber : undefined,
        contactInfo: {
          email: currentUser?.email || '',
          phone: currentUser?.phone || ''
        },
        kycDocs: uploaded.map(u => ({ publicId: u.publicId || u.public_id || u.public_id || u.name || u.url, url: u.url || u.secure_url || u.url, docType: u.docType }))
      };

      try {
        const pResp = await fetch(getApiUrl('/vendor/profile'), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
          body: JSON.stringify(body)
        });
        const pj = await pResp.json().catch(() => ({}));
        if (!pResp || !pResp.ok) throw new Error(pj.message || 'Failed to save vendor profile');
      } catch (err) {
        // non-fatal; we already uploaded files and added role
        console.warn('Failed to persist vendor profile:', err && err.message ? err.message : err);
      }

      toast.success('Vendor onboarding submitted — KYC pending');
      if (onClose) onClose();
    } catch (err) {
      console.error('BecomeVendor submit error', err);
      toast.error(err.message || 'Onboarding failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Become a vendor">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Business name</label>
          <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="mt-1 block w-full" required />
        </div>

        <div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isRegistered} onChange={(e) => setIsRegistered(e.target.checked)} />
            <span className="text-sm">Registered business (has CAC)</span>
          </label>
        </div>

        {isRegistered && (
          <div>
            <label className="block text-sm font-medium">CAC number</label>
            <input value={cacNumber} onChange={(e) => setCacNumber(e.target.value)} className="mt-1 block w-full" />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium">Upload utility bill</label>
          <input type="file" onChange={onUtilityChange} className="mt-1" />
          {utilityDocs && utilityDocs.length > 0 && (
            <ul className="mt-2 text-sm">
              {utilityDocs.map((d, i) => <li key={i}>{d.name} ({Math.round(d.size/1024)} KB)</li>)}
            </ul>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">Upload government ID (passport/ID card)</label>
          <input type="file" onChange={onIdChange} className="mt-1" />
          {idDocs && idDocs.length > 0 && (
            <ul className="mt-2 text-sm">
              {idDocs.map((d, i) => <li key={i}>{d.name} ({Math.round(d.size/1024)} KB)</li>)}
            </ul>
          )}
        </div>

        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="btn btn-primary">{loading ? 'Submitting…' : 'Submit application'}</button>
          <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
        </div>
      </form>
    </Modal>
  );
};

export default BecomeVendorModal;
