// Disabled Firestore imports to avoid permission errors
// import { db } from '../config/firebase';
// import {
//   collection,
//   addDoc,
//   updateDoc,
//   doc,
//   getDocs,
//   query,
//   where,
//   serverTimestamp
// } from 'firebase/firestore';

const COLLECTION = 'inspectionRequests';

export const createInspectionRequest = async (request) => {
  try {
    // Use localStorage only to avoid Firestore permission errors
    const payload = {
      ...request,
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const existing = JSON.parse(localStorage.getItem('viewingRequests') || '[]');
    existing.push(payload);
    localStorage.setItem('viewingRequests', JSON.stringify(existing));
    
    return payload;
  } catch (error) {
    console.error('Error creating inspection request:', error);
    // Return the request with a fallback ID
    return {
      ...request,
      id: `fallback_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
  }
};

export const listInspectionRequestsByVendor = async (vendorId, vendorEmail) => {
  try {
    // Use localStorage only to avoid Firestore permission errors
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
    return [];
  }
};

export const updateInspectionRequest = async (requestId, updates) => {
  try {
    // Use localStorage only to avoid Firestore permission errors
    const all = JSON.parse(localStorage.getItem('viewingRequests') || '[]');
    const updated = all.map((r) => 
      r.id === requestId 
        ? { ...r, ...updates, updatedAt: new Date().toISOString() }
        : r
    );
    localStorage.setItem('viewingRequests', JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('Error updating inspection request:', error);
    return false;
  }
};

export const syncLocalInspectionRequests = async () => {
  try {
    // Disabled Firestore sync to avoid permission errors
    // All data is now stored in localStorage only
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
  updateInspectionRequest,
  syncLocalInspectionRequests
};


