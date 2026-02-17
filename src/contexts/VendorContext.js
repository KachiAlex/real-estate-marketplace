import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import axios from 'axios';
import { getApiUrl } from '../utils/apiConfig';
import { uploadVendorKycDocuments } from '../utils/vendorKycUpload';

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
  status: 'verified',
  subscription: {
    active: true,
    lastPaid: new Date().toISOString(),
    nextDue: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
    fee: 50000
  }
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
  const { currentUser, loading: authLoading } = useAuth();
  const user = currentUser;
  const authReady = !authLoading;
  const [vendorProfile, setVendorProfile] = useState(null);
  // Subscription state: {active, lastPaid, nextDue, fee}
  const [subscription, setSubscription] = useState(null);
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

  // Check if subscription is active (paid for this month)
  const isSubscriptionActive = (sub) => {
    if (!sub || !sub.lastPaid || !sub.nextDue) return false;
    const now = new Date();
    return new Date(sub.lastPaid) <= now && now < new Date(sub.nextDue);
  };

  // Call this after payment to update vendor profile
  const markSubscriptionPaid = async (fee = 50000) => {
    try {
      const fbUser = auth.currentUser;
      if (!fbUser) throw new Error('Not authenticated');
      const now = new Date();
      const nextDue = new Date(now.getTime() + 30*24*60*60*1000); // 30 days
      const sub = {
        active: true,
        lastPaid: now.toISOString(),
        nextDue: nextDue.toISOString(),
        fee
      };
      const vendorRef = doc(db, 'vendors', fbUser.uid);
      await setDoc(vendorRef, { subscription: sub, updatedAt: serverTimestamp() }, { merge: true });
      setSubscription(sub);
      setVendorProfile(prev => ({ ...(prev || {}), subscription: sub }));
      toast.success('Subscription payment recorded!');
      return { success: true };
    } catch (error) {
      toast.error('Failed to update subscription status');
      return { success: false, error: error.message };
    }
  };

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
        const now = new Date();
        const nextDue = new Date(now.getTime() + 30*24*60*60*1000);
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
          updatedAt: serverTimestamp(),
          subscription: {
            active: true,
            lastPaid: now.toISOString(),
            nextDue: nextDue.toISOString(),
            fee: 50000
          }
        };
        await setDoc(vendorRef, seed, { merge: true });
        setVendorProfile(seed);
        setSubscription(seed.subscription);
        setIsAgent(true);
        setIsPropertyOwner(true);
      } else {
        const data = snap.data();
        setVendorProfile({ id: fbUser.uid, ...data });
        setSubscription(data.subscription || null);
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

  // Update vendor profile via Render backend
  const updateVendorProfile = async (profileData) => {
    try {
      if (!user || !user.id) throw new Error('Not authenticated');
      const token = localStorage.getItem('token');
      const response = await axios.put(
        getApiUrl(`/vendor/profile`),
        profileData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setVendorProfile(prev => ({ ...(prev || {}), ...response.data.vendor }));
      toast.success('Vendor profile updated successfully!');
      return { success: true };
    } catch (error) {
      console.error('Error updating vendor profile:', error);
      toast.error('Failed to update vendor profile');
      return { success: false, error: error.message };
    }
  };

  // Upload agent/vendor KYC document(s) via Render backend
  const uploadAgentDocument = async (files) => {
    const result = await uploadVendorKycDocuments(files);
    if (result.success) {
      setAgentDocuments(prev => [...prev, ...result.data]);
      toast.success('KYC documents uploaded successfully!');
    } else {
      toast.error(result.error || 'Failed to upload KYC documents');
    }
    return result;
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
    subscription,
    isSubscriptionActive: isSubscriptionActive(subscription),
    markSubscriptionPaid,
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
