import React, { useEffect, useState } from 'react';
import { approveKyc, rejectKyc, listPendingVendors } from '../../api/adminKyc';

export default function KycReview() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    loadPending();
  }, []);

  async function loadPending() {
    setLoading(true);
    try {
      const json = await listPendingVendors();
      if (json && json.success) setVendors(json.data || []);
      else setVendors([]);
    } catch (e) {
      console.error('Failed to load pending vendors', e);
      setVendors([]);
    } finally {
      setLoading(false);
    }
  }

  async function approve(id) {
    setActionLoading(s => ({ ...s, [id]: true }));
    try {
      const json = await approveKyc(id);
      if (json.success) await loadPending();
      else alert(json.message || 'Failed to approve');
    } catch (e) {
      console.error(e);
      alert('Approve failed');
    } finally {
      setActionLoading(s => ({ ...s, [id]: false }));
    }
  }

  async function rejectKycHandler(id) {
    const notes = window.prompt('Enter rejection notes (optional)');
    if (notes === null) return; // cancelled
    setActionLoading(s => ({ ...s, [id]: true }));
    try {
      const json = await rejectKyc(id, notes);
      if (json.success) await loadPending();
      else alert(json.message || 'Failed to reject');
    } catch (e) {
      console.error(e);
      alert('Reject failed');
    } finally {
      setActionLoading(s => ({ ...s, [id]: false }));
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Pending Vendor KYC</h1>
      {loading && <div>Loading...</div>}
      {!loading && !vendors.length && <div>No pending KYC requests.</div>}
      <div className="space-y-4 mt-4">
        {vendors.map(v => (
          <div key={v.id} className="border rounded p-4 bg-white shadow-sm flex justify-between items-start">
            <div>
              <div className="text-lg font-medium">{v.email}</div>
              <div className="text-sm text-gray-600 mt-1">{v.vendorData && v.vendorData.kycStatus ? `Status: ${v.vendorData.kycStatus}` : 'No vendorData'}</div>
              {v.vendorData && v.vendorData.kycDocs && v.vendorData.kycDocs.length > 0 && (
                <div className="mt-2">
                  <div className="text-sm font-medium">Documents:</div>
                  <ul className="list-disc list-inside text-sm">
                    {v.vendorData.kycDocs.map((d, i) => (
                      <li key={i}><a href={d.url} target="_blank" rel="noreferrer" className="text-blue-600 underline">{d.name || d.url}</a></li>
                    ))}
                  </ul>
                </div>
              )}
              <pre className="text-xs mt-2 bg-gray-50 p-2 rounded overflow-auto max-h-40">{JSON.stringify(v.vendorData, null, 2)}</pre>
            </div>
            <div className="flex flex-col space-y-2">
              <button onClick={() => approve(v.id)} disabled={!!actionLoading[v.id]} className="px-4 py-2 bg-green-600 text-white rounded">{actionLoading[v.id] ? '...' : 'Approve'}</button>
              <button onClick={() => rejectKycHandler(v.id)} disabled={!!actionLoading[v.id]} className="px-4 py-2 bg-red-500 text-white rounded">{actionLoading[v.id] ? '...' : 'Reject'}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
