import { getApiUrl } from '../utils/apiConfig';

export const fetchInspectionRequests = async (role, userId, token) => {
  let url = '';
  if (role === 'buyer') {
    url = getApiUrl(`/inspection/buyer/${userId}`);
  } else if (role === 'vendor') {
    url = getApiUrl(`/inspection/vendor/${userId}`);
  } else if (role === 'admin') {
    url = getApiUrl(`/inspection/all`);
  }
  const resp = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!resp.ok) throw new Error('Failed to fetch inspection requests');
  return resp.json();
};

export const createInspectionRequestApi = async (data, token) => {
  const resp = await fetch(getApiUrl('/inspection'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!resp.ok) throw new Error('Failed to create inspection request');
  return resp.json();
};

export const updateInspectionRequestApi = async (id, updates, token) => {
  const resp = await fetch(getApiUrl(`/inspection/${id}`), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updates)
  });
  if (!resp.ok) throw new Error('Failed to update inspection request');
  return resp.json();
};
