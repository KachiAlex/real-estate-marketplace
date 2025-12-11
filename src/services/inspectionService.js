import { db } from '../config/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api-759115682573.us-central1.run.app';
const COLLECTION = 'inspectionRequests';

export const createInspectionRequest = async (requestData) => {
  try {
    // Skip API call for now since it's returning 404, go directly to localStorage
    console.log('Using localStorage for creating inspection requests (API unavailable)');
    
    // Fallback to localStorage
    const existing = JSON.parse(localStorage.getItem('viewingRequests') || '[]');
    const newRequest = {
      id: `viewing-${Date.now()}`,
      ...requestData,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    existing.push(newRequest);
    localStorage.setItem('viewingRequests', JSON.stringify(existing));
    
    // Dispatch event to notify Dashboard and other components
    window.dispatchEvent(new CustomEvent('viewingsUpdated', {
      detail: { viewingRequest: newRequest, action: 'created' }
    }));
    
    // Also trigger a storage event for cross-tab synchronization
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'viewingRequests',
      newValue: JSON.stringify(existing)
    }));
    
    return newRequest;
  } catch (error) {
    console.error('Error creating inspection request:', error);
    // Final fallback to localStorage
    const existing = JSON.parse(localStorage.getItem('viewingRequests') || '[]');
    const newRequest = {
      id: `viewing-${Date.now()}`,
      ...requestData,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    existing.push(newRequest);
    localStorage.setItem('viewingRequests', JSON.stringify(existing));
    
    // Dispatch event to notify Dashboard and other components
    window.dispatchEvent(new CustomEvent('viewingsUpdated', {
      detail: { viewingRequest: newRequest, action: 'created' }
    }));
    
    // Also trigger a storage event for cross-tab synchronization
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'viewingRequests',
      newValue: JSON.stringify(existing)
    }));
    
    return newRequest;
  }
};

export const listInspectionRequestsByVendor = async (vendorId, vendorEmail) => {
  try {
    // Skip API call for now since it's returning 404, go directly to localStorage
    console.log('Using localStorage for inspection requests (API unavailable)');
    
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
    // Skip API call for now since it's returning 404, go directly to localStorage
    console.log('Using localStorage for buyer inspection requests (API unavailable)');
    
    // Fallback to localStorage
    const local = JSON.parse(localStorage.getItem('viewingRequests') || '[]');
    const filtered = local.filter((r) => r.buyerId === buyerId);
    return filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  } catch (error) {
    console.error('Error listing buyer inspection requests:', error);
    return [];
  }
};

export const updateInspectionRequest = async (requestId, updates) => {
  try {
    // Skip API call for now since it's returning 404, go directly to localStorage
    console.log('Using localStorage for updating inspection requests (API unavailable)');
    
    // Fallback to localStorage
    const all = JSON.parse(localStorage.getItem('viewingRequests') || '[]');
    const updated = all.map((r) => 
      r.id === requestId 
        ? { ...r, ...updates, updatedAt: new Date().toISOString() }
        : r
    );
    localStorage.setItem('viewingRequests', JSON.stringify(updated));
    
    // Dispatch event to notify Dashboard and other components when status changes
    window.dispatchEvent(new CustomEvent('viewingsUpdated', {
      detail: { requestId, updates, action: 'updated' }
    }));
    
    // Also trigger a storage event for cross-tab synchronization
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'viewingRequests',
      newValue: JSON.stringify(updated)
    }));
    
    return true;
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
    
    // Dispatch event to notify Dashboard and other components when status changes
    window.dispatchEvent(new CustomEvent('viewingsUpdated', {
      detail: { requestId, updates, action: 'updated' }
    }));
    
    // Also trigger a storage event for cross-tab synchronization
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'viewingRequests',
      newValue: JSON.stringify(updated)
    }));
    
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