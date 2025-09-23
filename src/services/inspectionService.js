import { db } from '../config/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';

const COLLECTION = 'inspectionRequests';

export const createInspectionRequest = async (request) => {
  try {
    const payload = {
      ...request,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    const ref = await addDoc(collection(db, COLLECTION), payload);
    return { id: ref.id, ...request };
  } catch (error) {
    console.error('Firestore createInspectionRequest failed, falling back to localStorage:', error);
    const existing = JSON.parse(localStorage.getItem('viewingRequests') || '[]');
    existing.push(request);
    localStorage.setItem('viewingRequests', JSON.stringify(existing));
    return request;
  }
};

export const listInspectionRequestsByVendor = async (vendorId, vendorEmail) => {
  const results = [];
  try {
    if (vendorId) {
      const q1 = query(collection(db, COLLECTION), where('vendorId', '==', vendorId));
      const snap1 = await getDocs(q1);
      snap1.forEach((d) => results.push({ id: d.id, ...d.data() }));
    }

    if (vendorEmail) {
      const q2 = query(collection(db, COLLECTION), where('vendorEmail', '==', vendorEmail));
      const snap2 = await getDocs(q2);
      snap2.forEach((d) => results.push({ id: d.id, ...d.data() }));
    }

    // Deduplicate by id
    const map = new Map();
    for (const r of results) {
      map.set(r.id || `${r.projectId}-${r.buyerId}-${r.preferredDate}-${r.preferredTime}`, r);
    }
    const unique = Array.from(map.values());

    // Sort newest first
    unique.sort((a, b) => new Date(b.createdAt?.toDate?.() || b.createdAt || 0) - new Date(a.createdAt?.toDate?.() || a.createdAt || 0));
    return unique;
  } catch (error) {
    console.error('Firestore listInspectionRequestsByVendor failed, falling back to localStorage:', error);
    const local = JSON.parse(localStorage.getItem('viewingRequests') || '[]');
    return local.filter((r) => (vendorId && r.vendorId === vendorId) || (vendorEmail && r.vendorEmail === vendorEmail));
  }
};

export const updateInspectionRequest = async (requestId, updates) => {
  try {
    const ref = doc(db, COLLECTION, requestId);
    await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
    return true;
  } catch (error) {
    console.error('Firestore updateInspectionRequest failed, attempting local update:', error);
    try {
      const all = JSON.parse(localStorage.getItem('viewingRequests') || '[]');
      const updated = all.map((r) => (r.id === requestId ? { ...r, ...updates } : r));
      localStorage.setItem('viewingRequests', JSON.stringify(updated));
      return true;
    } catch (e) {
      return false;
    }
  }
};

export const syncLocalInspectionRequests = async () => {
  try {
    const local = JSON.parse(localStorage.getItem('viewingRequests') || '[]');
    if (!local.length) return { synced: 0 };
    let synced = 0;
    for (const req of local) {
      try {
        await addDoc(collection(db, COLLECTION), { ...req, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        synced += 1;
      } catch (e) {
        // ignore individual failures
      }
    }
    return { synced };
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


