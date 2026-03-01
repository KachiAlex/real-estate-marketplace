import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext-new';
import { getApiUrl } from '../utils/apiConfig';

const VendorStatusCard = ({ onOpenKyc }) => {
  const { currentUser, accessToken } = useAuth();
  const [removing, setRemoving] = useState(null);
  const vendorData = currentUser?.vendorData || currentUser?.vendor_data || {};
  const status = vendorData?.kycStatus || currentUser?.kycStatus || 'not_requested';

  const [docs, setDocs] = useState(Array.isArray(vendorData?.kycDocs) ? vendorData.kycDocs : []);
  useEffect(() => {
    setDocs(Array.isArray(vendorData?.kycDocs) ? vendorData.kycDocs : []);
  }, [vendorData?.kycDocs]);
  const { setUserLocally } = useAuth();
  const replaceInputRef = useRef(null);
  const [replaceTarget, setReplaceTarget] = useState(null);
  const [replacing, setReplacing] = useState(null);

  const fetchMe = async () => {
    if (!accessToken) return;
    try {
      const resp = await fetch(getApiUrl('/auth/jwt/me'), { headers: { 'Authorization': `Bearer ${accessToken}` } });
      const data = resp ? await resp.json().catch(() => ({})) : {};
      const serverUser = data.user || data;
      if (serverUser) setUserLocally(serverUser);
    } catch (e) { console.warn('fetchMe failed', e); }
  };

  const statusLabel = {
    not_requested: 'Not requested',
    required: 'KYC required',
    pending: 'Pending review',
    verified: 'Verified',
    rejected: 'Action required'
  }[status] || String(status);

  const deleteDoc = async (doc) => {
    if (!accessToken) {
      alert('Please sign in to remove documents');
      return;
    }
    const publicId = doc.publicId || (doc.url ? String(doc.url).split('/').pop().replace(/\.[^.]+$/, '') : null);
    if (!publicId) {
      alert('Unable to determine document id');
      return;
    }
    if (!window.confirm('Delete this document?')) return;
    try {
      setRemoving(publicId);
      const url = getApiUrl(`/upload/delete-multiple`);
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({ publicIds: [publicId], resourceType: 'raw' })
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.message || 'Delete failed');
      // Optimistic UI: remove from DOM
      if (doc._onDeleted) try { doc._onDeleted(publicId); } catch (e) {}
      setRemoving(null);
      return true;
    } catch (e) {
      setRemoving(null);
      console.error('Delete failed', e);
      alert(e.message || 'Delete failed');
      return false;
    }
  };

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Vendor status</h3>
          <p className="text-sm text-gray-600">{statusLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onOpenKyc && onOpenKyc()} className="px-3 py-2 bg-amber-400 text-slate-900 rounded-md">
            Upload KYC
          </button>
        </div>
      </div>

      {docs && docs.length > 0 && (
        <div className="mt-3 text-sm text-gray-700">
          <div className="font-medium">Uploaded documents</div>
          <ul className="list-disc list-inside mt-1">
            {docs.map((d, i) => (
              <li key={i} className="flex items-center gap-3">
                <a href={d.url} className="text-blue-600 hover:underline" target="_blank" rel="noreferrer">{d.name || d.publicId || d.url}</a>
                <button
                  disabled={removing === (d.publicId || d.url)}
                  onClick={async () => {
                    const ok = await deleteDoc({ ...d, _onDeleted: (pid) => setDocs((prev) => prev.filter((x) => (x.publicId || x.url) !== (d.publicId || d.url))) });
                    if (ok) {
                      await fetchMe();
                    }
                  }}
                  className="text-sm text-red-600 hover:underline"
                >
                  {removing === (d.publicId || d.url) ? 'Removing...' : 'Remove'}
                </button>
                <button
                  disabled={replacing === (d.publicId || d.url)}
                  onClick={() => { setReplaceTarget(d); if (replaceInputRef.current) replaceInputRef.current.click(); }}
                  className="text-sm text-amber-600 hover:underline"
                >
                  {replacing === (d.publicId || d.url) ? 'Replacing...' : 'Replace'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <input
        id="vendor-replace-input"
        ref={replaceInputRef}
        type="file"
        accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
        style={{ display: 'none' }}
        onChange={async (e) => {
          const file = e.target.files && e.target.files[0];
          if (!file || !replaceTarget) return;
          if (!accessToken) { alert('Please sign in to replace documents'); return; }
          try {
            setReplacing(replaceTarget.publicId || replaceTarget.url);
            const form = new FormData();
            form.append('documents', file, file.name);
            const resp = await fetch(getApiUrl('/upload/vendor/kyc'), { method: 'POST', headers: { 'Authorization': `Bearer ${accessToken}` }, body: form });
            const data = resp ? await resp.json().catch(() => ({})) : {};
            if (!resp || !resp.ok) throw new Error(data.message || 'Upload failed');
            // After successful upload, remove the old doc
            await deleteDoc(replaceTarget);
            await fetchMe();
          } catch (e) {
            console.error('Replace failed', e);
            alert(e.message || 'Replace failed');
          } finally {
            setReplacing(null);
            setReplaceTarget(null);
            if (replaceInputRef.current) replaceInputRef.current.value = '';
          }
        }}
      />
    </div>
  );
};

export default VendorStatusCard;
