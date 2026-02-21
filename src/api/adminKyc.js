import { fetchWithAuth } from '../utils/fetchWithAuth';

export async function listPendingVendors() {
  const res = await fetchWithAuth('/api/admin/vendors/pending');
  return res.json();
}

export async function approveKyc(userId) {
  const res = await fetchWithAuth(`/api/admin/vendors/${userId}/kyc/approve`, { method: 'POST' });
  return res.json();
}

export async function rejectKyc(userId, notes) {
  const res = await fetchWithAuth(`/api/admin/vendors/${userId}/kyc/reject`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notes }) });
  return res.json();
}
