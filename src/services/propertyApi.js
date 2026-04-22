// src/services/propertyApi.js
// API for property verification requests

export async function requestPropertyVerification({ propertyId, paymentReference, amount }) {
  const apiClient = (await import('./apiClient')).default;
  const resp = await apiClient.post('/properties/verify-request', { propertyId, paymentReference, amount });
  if (!resp?.data?.success) throw new Error(resp?.data?.message || 'Failed to request property verification');
  return resp.data;
}
