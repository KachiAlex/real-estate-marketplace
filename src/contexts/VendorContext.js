import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import { db, auth } from '../config/firebase';
import { doc, getDoc, setDoc, collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';

const VendorContext = createContext();

// Mock vendor data
const mockVendorProfile = {
  id: 'vendor-1',
  businessName: 'Luxury Properties Nigeria',
  businessType: 'Real Estate Agency',
  licenseNumber: 'REA-2024-001',
  isAgent: true,
  isPropertyOwner: true,
  experience: '5+ years',
  specializations: ['Luxury Homes', 'Commercial Properties', 'Investment Properties'],
  contactInfo: {
    phone: '+234-XXX-XXXX',
    email: 'info@luxuryproperties.ng',
    address: 'Victoria Island, Lagos'
  },
  rating: 4.8,
  totalProperties: 45,
  totalSales: 1200000000,
  joinedDate: '2020-01-15T00:00:00Z',
  status: 'verified'
};

const mockAgentDocuments = [
  {
    id: 'doc-1',
    type: 'attestation_letter',
    name: 'Real Estate License',
    status: 'verified',
    uploadedAt: '2024-01-01T00:00:00Z',
    url: 'https://example.com/license.pdf'
  },
  {
    id: 'doc-2',
    type: 'identity_verification',
    name: 'Government ID',
    status: 'verified',
    uploadedAt: '2024-01-02T00:00:00Z',
    url: 'https://example.com/id.pdf'
  }
];

export const useVendor = () => {
  const context = useContext(VendorContext);
  if (!context) {
    throw new Error('useVendor must be used within a VendorProvider');
  }
  return context;
};

export const VendorProvider = ({ children }) => {
  const { user } = useAuth();
  const [vendorProfile, setVendorProfile] = useState(null);
  const [isAgent, setIsAgent] = useState(false);
  const [isPropertyOwner, setIsPropertyOwner] = useState(false);
  const [agentDocuments, setAgentDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.roles?.includes('vendor')) {
      fetchVendorProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchVendorProfile = async () => {
    try {
      setLoading(true);
      const fbUser = auth.currentUser;
      if (!fbUser) {
        setVendorProfile(null);
        setLoading(false);
        return;
      }

      // Read vendor profile from Firestore
      const vendorRef = doc(db, 'vendors', fbUser.uid);
      const snap = await getDoc(vendorRef);

      if (!snap.exists()) {
        // Create a minimal vendor profile if none exists yet
        const seed = {
          id: fbUser.uid,
          businessName: user?.vendorData?.businessName || 'My Real Estate Business',
          businessType: user?.vendorData?.businessType || 'Real Estate Agent',
          isAgent: true,
          isPropertyOwner: true,
          contactInfo: {
            email: fbUser.email || user?.email || '',
          },
          status: 'pending',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        await setDoc(vendorRef, seed, { merge: true });
        setVendorProfile(seed);
        setIsAgent(true);
        setIsPropertyOwner(true);
      } else {
        const data = snap.data();
        setVendorProfile({ id: fbUser.uid, ...data });
        setIsAgent(Boolean(data.isAgent));
        setIsPropertyOwner(Boolean(data.isPropertyOwner));
      }

      // Load agent documents from subcollection vendors/{uid}/documents
      try {
        const docsRef = collection(db, 'vendors', fbUser.uid, 'documents');
        const qDocs = await getDocs(docsRef);
        const docs = qDocs.docs.map(d => ({ id: d.id, ...d.data() }));
        setAgentDocuments(docs);
      } catch {
        setAgentDocuments([]);
      }
    } catch (error) {
      console.error('Error fetching vendor profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgentDocuments = async () => {
    try {
      const fbUser = auth.currentUser;
      if (!fbUser) return;
      const docsRef = collection(db, 'vendors', fbUser.uid, 'documents');
      const qDocs = await getDocs(docsRef);
      const docs = qDocs.docs.map(d => ({ id: d.id, ...d.data() }));
      setAgentDocuments(docs);
    } catch (error) {
      console.error('Error fetching agent documents:', error);
    }
  };

  const updateVendorProfile = async (profileData) => {
    try {
      const fbUser = auth.currentUser;
      if (!fbUser) throw new Error('Not authenticated');
      const vendorRef = doc(db, 'vendors', fbUser.uid);
      await setDoc(vendorRef, { ...profileData, updatedAt: serverTimestamp() }, { merge: true });
      setVendorProfile(prev => ({ ...(prev || {}), ...profileData }));
      toast.success('Vendor profile updated successfully!');
      return { success: true };
    } catch (error) {
      console.error('Error updating vendor profile:', error);
      toast.error('Failed to update vendor profile');
      return { success: false, error: error.message };
    }
  };

  const uploadAgentDocument = async (documentData) => {
    try {
      const fbUser = auth.currentUser;
      if (!fbUser) throw new Error('Not authenticated');
      const docsRef = collection(db, 'vendors', fbUser.uid, 'documents');
      const payload = {
        ...documentData,
        agentId: fbUser.uid,
        uploadedAt: serverTimestamp(),
        status: 'pending'
      };
      const ref = await addDoc(docsRef, payload);
      setAgentDocuments(prev => [...prev, { id: ref.id, ...payload }]);
      toast.success('Document uploaded successfully!');
      return { success: true };
    } catch (error) {
      console.error('Error uploading agent document:', error);
      toast.error('Failed to upload document');
      return { success: false, error: error.message };
    }
  };

  const checkDocumentStatus = () => {
    const attestationLetter = agentDocuments.find(doc => doc.type === 'attestation_letter');
    return {
      hasAttestationLetter: !!attestationLetter,
      attestationStatus: attestationLetter?.status || 'missing',
      canListProperties: attestationLetter?.status === 'verified',
      documentStatus: attestationLetter?.status || 'missing'
    };
  };

  const value = {
    vendorProfile,
    isAgent,
    isPropertyOwner,
    agentDocuments,
    loading,
    // Expose computed document status for easy consumption in UI
    documentStatus: checkDocumentStatus(),
    updateVendorProfile,
    uploadAgentDocument,
    checkDocumentStatus,
    fetchVendorProfile
  };

  return (
    <VendorContext.Provider value={value}>
      {children}
    </VendorContext.Provider>
  );
};
