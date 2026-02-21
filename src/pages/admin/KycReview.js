import React, { useEffect, useState } from 'react';
import { fetchWithAuth } from '../../utils/fetchWithAuth';

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
      const res = await fetchWithAuth('/api/admin/vendors/pending');
      const json = await res.json();
      if (json.success) setVendors(json.data || []);
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
      const res = await fetchWithAuth(`/api/admin/vendors/${id}/kyc/approve`, { method: 'POST' });
      const json = await res.json();
      if (json.success) await loadPending();
      else alert(json.message || 'Failed to approve');
    } catch (e) {
      console.error(e);
      alert('Approve failed');
    } finally {
      setActionLoading(s => ({ ...s, [id]: false }));
    }
  }

  async function rejectKyc(id) {
    const notes = window.prompt('Enter rejection notes (optional)');
    if (notes === null) return; // cancelled
    setActionLoading(s => ({ ...s, [id]: true }));
    try {
      const res = await fetchWithAuth(`/api/admin/vendors/${id}/kyc/reject`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notes }) });
      const json = await res.json();
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
              <pre className="text-xs mt-2 bg-gray-50 p-2 rounded overflow-auto max-h-40">{JSON.stringify(v.vendorData, null, 2)}</pre>
            </div>
            <div className="flex flex-col space-y-2">
              <button onClick={() => approve(v.id)} disabled={!!actionLoading[v.id]} className="px-4 py-2 bg-green-600 text-white rounded">{actionLoading[v.id] ? '...' : 'Approve'}</button>
              <button onClick={() => rejectKyc(v.id)} disabled={!!actionLoading[v.id]} className="px-4 py-2 bg-red-500 text-white rounded">{actionLoading[v.id] ? '...' : 'Reject'}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
