import { db } from '../config/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api-kzs3jdpe7a-uc.a.run.app';
const COLLECTION = 'inspectionRequests';

export const createInspectionRequest = async (requestData) => {
  try {
    // Try API first
    const response = await fetch(`${API_BASE_URL}/api/inspection-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (response.ok) {
      return await response.json();
    } else {
      console.warn('API failed, falling back to localStorage');
      // Fallback to localStorage
      const existing = JSON.parse(localStorage.getItem('viewingRequests') || '[]');
      const newRequest = {
        id: `viewing-${Date.now()}`,
        ...requestData,
        createdAt: new Date().toISOString()
      };
      existing.push(newRequest);
      localStorage.setItem('viewingRequests', JSON.stringify(existing));
      return newRequest;
    }
  } catch (error) {
    console.error('Error creating inspection request:', error);
    // Final fallback to localStorage
    const existing = JSON.parse(localStorage.getItem('viewingRequests') || '[]');
    const newRequest = {
      id: `viewing-${Date.now()}`,
      ...requestData,
      createdAt: new Date().toISOString()
    };
    existing.push(newRequest);
    localStorage.setItem('viewingRequests', JSON.stringify(existing));
    return newRequest;
  }
};

export const listInspectionRequestsByVendor = async (vendorId, vendorEmail) => {
  try {
    // Try API first
    const params = new URLSearchParams();
    if (vendorId) params.append('vendorId', vendorId);
    if (vendorEmail) params.append('vendorEmail', vendorEmail);
    
    const response = await fetch(`${API_BASE_URL}/api/inspection-requests?${params}`);
    
    if (response.ok) {
      return await response.json();
    } else {
      console.warn('API failed, falling back to localStorage');
      // Fallback to localStorage
      const local = JSON.parse(localStorage.getItem('viewingRequests') || '[]');
      
      // Filter by vendorId or vendorEmail
      const filtered = local.filter((r) => 
        (vendorId && r.vendorId === vendorId) || 
        (vendorEmail && r.vendorEmail === vendorEmail)
      );
      
      // Sort newest first
      filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      
      return filtered;
    }
  } catch (error) {
    console.error('Error listing inspection requests:', error);
    // Final fallback to localStorage
    const local = JSON.parse(localStorage.getItem('viewingRequests') || '[]');
    const filtered = local.filter((r) => 
      (vendorId && r.vendorId === vendorId) || 
      (vendorEmail && r.vendorEmail === vendorEmail)
    );
    return filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }
};

export const listInspectionRequestsByBuyer = async (buyerId) => {
  try {
    // Try API first
    const response = await fetch(`${API_BASE_URL}/api/inspection-requests?buyerId=${buyerId}`);
    
    if (response.ok) {
      return await response.json();
    } else {
      console.warn('API failed, falling back to localStorage');
      // Fallback to localStorage
      const local = JSON.parse(localStorage.getItem('viewingRequests') || '[]');
      const filtered = local.filter((r) => r.buyerId === buyerId);
      return filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
  } catch (error) {
    console.error('Error listing buyer inspection requests:', error);
    return [];
  }
};

export const updateInspectionRequest = async (requestId, updates) => {
  try {
    // Try API first
    const response = await fetch(`${API_BASE_URL}/api/inspection-requests/${requestId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (response.ok) {
      return true;
    } else {
      console.warn('API failed, falling back to localStorage');
      // Fallback to localStorage
      const all = JSON.parse(localStorage.getItem('viewingRequests') || '[]');
      const updated = all.map((r) => 
        r.id === requestId 
          ? { ...r, ...updates, updatedAt: new Date().toISOString() }
          : r
      );
      localStorage.setItem('viewingRequests', JSON.stringify(updated));
      return true;
    }
  } catch (error) {
    console.error('Error updating inspection request:', error);
    // Final fallback to localStorage
    const all = JSON.parse(localStorage.getItem('viewingRequests') || '[]');
    const updated = all.map((r) => 
      r.id === requestId 
        ? { ...r, ...updates, updatedAt: new Date().toISOString() }
        : r
    );
    localStorage.setItem('viewingRequests', JSON.stringify(updated));
    return true;
  }
};

export const syncLocalInspectionRequests = async () => {
  try {
    // Try to sync with API if available
    const local = JSON.parse(localStorage.getItem('viewingRequests') || '[]');
    console.log('Inspection requests stored locally:', local.length);
    return { synced: local.length };
  } catch (error) {
    console.error('syncLocalInspectionRequests failed:', error);
    return { synced: 0 };
  }
};

export default {
  createInspectionRequest,
  listInspectionRequestsByVendor,
  listInspectionRequestsByBuyer,
  updateInspectionRequest,
  syncLocalInspectionRequests
};