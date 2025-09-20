import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

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
      console.log('Loading mock vendor profile for user:', user?.email);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Use mock data
      const vendorData = {
        ...mockVendorProfile,
        // Add user-specific data if available
        ...(user?.vendorData || {})
      };
      
      setVendorProfile(vendorData);
      setIsAgent(vendorData.isAgent || false);
      setIsPropertyOwner(vendorData.isPropertyOwner || false);
      
      // Set mock agent documents
      setAgentDocuments(mockAgentDocuments);
      
      console.log('Mock vendor profile loaded:', vendorData);
    } catch (error) {
      console.error('Error fetching vendor profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgentDocuments = async () => {
    try {
      console.log('Loading mock agent documents');
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Return mock documents
      setAgentDocuments(mockAgentDocuments);
      console.log('Mock agent documents loaded:', mockAgentDocuments);
    } catch (error) {
      console.error('Error fetching agent documents:', error);
    }
  };

  const updateVendorProfile = async (profileData) => {
    try {
      console.log('Updating vendor profile:', profileData);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Update mock data
      const updatedProfile = {
        ...vendorProfile,
        ...profileData,
        updatedAt: new Date().toISOString()
      };
      
      setVendorProfile(updatedProfile);
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
      console.log('Uploading agent document:', documentData);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create mock document
      const newDocument = {
        id: `doc-${Date.now()}`,
        ...documentData,
        agentId: user?.id || 'mock-agent-id',
        uploadedAt: new Date().toISOString(),
        status: 'pending'
      };
      
      // Add to mock documents
      setAgentDocuments(prev => [...prev, newDocument]);
      
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
