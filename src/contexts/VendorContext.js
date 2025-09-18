import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc, updateDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

const VendorContext = createContext();

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
      const vendorDoc = await getDoc(doc(db, 'vendors', user.uid));
      
      if (vendorDoc.exists()) {
        const vendorData = vendorDoc.data();
        setVendorProfile(vendorData);
        setIsAgent(vendorData.isAgent || false);
        setIsPropertyOwner(vendorData.isPropertyOwner || false);
        
        // Fetch agent documents if user is an agent
        if (vendorData.isAgent) {
          await fetchAgentDocuments();
        }
      }
    } catch (error) {
      console.error('Error fetching vendor profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgentDocuments = async () => {
    try {
      const documentsQuery = query(
        collection(db, 'agentDocuments'),
        where('agentId', '==', user.uid)
      );
      const documentsSnapshot = await getDocs(documentsQuery);
      const documents = documentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAgentDocuments(documents);
    } catch (error) {
      console.error('Error fetching agent documents:', error);
    }
  };

  const updateVendorProfile = async (profileData) => {
    try {
      const vendorRef = doc(db, 'vendors', user.uid);
      await updateDoc(vendorRef, {
        ...profileData,
        updatedAt: new Date()
      });
      
      setVendorProfile(prev => ({ ...prev, ...profileData }));
      return { success: true };
    } catch (error) {
      console.error('Error updating vendor profile:', error);
      return { success: false, error: error.message };
    }
  };

  const uploadAgentDocument = async (documentData) => {
    try {
      // This would integrate with your file upload service
      const documentRef = doc(collection(db, 'agentDocuments'));
      await setDoc(documentRef, {
        ...documentData,
        agentId: user.uid,
        uploadedAt: new Date(),
        status: 'pending'
      });
      
      await fetchAgentDocuments();
      return { success: true };
    } catch (error) {
      console.error('Error uploading agent document:', error);
      return { success: false, error: error.message };
    }
  };

  const checkDocumentStatus = () => {
    const attestationLetter = agentDocuments.find(doc => doc.type === 'attestation_letter');
    return {
      hasAttestationLetter: !!attestationLetter,
      attestationStatus: attestationLetter?.status || 'missing',
      canListProperties: attestationLetter?.status === 'verified'
    };
  };

  const value = {
    vendorProfile,
    isAgent,
    isPropertyOwner,
    agentDocuments,
    loading,
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
