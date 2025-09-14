import React, { createContext, useContext, useState, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { db } from '../config/firebase';
import storageService from '../services/storageService';
import toast from 'react-hot-toast';

const PropertyContext = createContext();

export const useProperty = () => {
  const context = useContext(PropertyContext);
  if (!context) {
    throw new Error('useProperty must be used within a PropertyProvider');
  }
  return context;
};

export const PropertyProvider = ({ children }) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: '',
    minPrice: '',
    maxPrice: '',
    location: '',
    bedrooms: '',
    bathrooms: '',
    amenities: []
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 12
  });
  const { user } = useAuth();

  // Fetch properties with filters
  const fetchProperties = useCallback(async (newFilters = {}, page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      let q = query(collection(db, 'properties'), orderBy('createdAt', 'desc'));

      // Apply filters
      if (newFilters.type) {
        q = query(q, where('type', '==', newFilters.type));
      }
      if (newFilters.status) {
        q = query(q, where('status', '==', newFilters.status));
      }
      if (newFilters.minPrice) {
        q = query(q, where('price', '>=', parseInt(newFilters.minPrice)));
      }
      if (newFilters.maxPrice) {
        q = query(q, where('price', '<=', parseInt(newFilters.maxPrice)));
      }
      if (newFilters.location) {
        q = query(q, where('location.city', '==', newFilters.location));
      }
      if (newFilters.bedrooms) {
        q = query(q, where('bedrooms', '==', parseInt(newFilters.bedrooms)));
      }
      if (newFilters.bathrooms) {
        q = query(q, where('bathrooms', '==', parseInt(newFilters.bathrooms)));
      }

      // Add pagination
      const itemsPerPage = pagination.itemsPerPage;
      const startIndex = (page - 1) * itemsPerPage;
      if (startIndex > 0) {
        // For pagination beyond first page, we'd need to implement cursor-based pagination
        // For now, we'll limit to first page
      }
      q = query(q, limit(itemsPerPage));

      const querySnapshot = await getDocs(q);
      const propertiesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setProperties(propertiesData);
      setPagination(prev => ({
        ...prev,
        currentPage: page,
        totalItems: propertiesData.length
      }));

      if (Object.keys(newFilters).length > 0) {
        setFilters(newFilters);
      }
    } catch (error) {
      setError('Failed to fetch properties');
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.itemsPerPage]);

  // Fetch single property
  const fetchProperty = useCallback(async (propertyId) => {
    setLoading(true);
    setError(null);
    
    try {
      const propertyDoc = await getDoc(doc(db, 'properties', propertyId));
      if (propertyDoc.exists()) {
        return { id: propertyDoc.id, ...propertyDoc.data() };
      } else {
        throw new Error('Property not found');
      }
    } catch (error) {
      setError('Failed to fetch property');
      console.error('Error fetching property:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Add new property
  const addProperty = useCallback(async (propertyData) => {
    setLoading(true);
    setError(null);
    
    try {
      if (!user) throw new Error('User must be logged in');

      const propertyWithMetadata = {
        ...propertyData,
        ownerId: user.uid,
        ownerName: user.displayName || `${user.firstName} ${user.lastName}`,
        ownerEmail: user.email,
        status: 'pending',
        isVerified: false,
        verificationStatus: 'pending',
        views: 0,
        favorites: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'properties'), propertyWithMetadata);
      return { success: true, id: docRef.id };
    } catch (error) {
      setError('Failed to add property');
      console.error('Error adding property:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Update property
  const updateProperty = useCallback(async (propertyId, updates) => {
    setLoading(true);
    setError(null);
    
    try {
      if (!user) throw new Error('User must be logged in');

      const propertyRef = doc(db, 'properties', propertyId);
      await updateDoc(propertyRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      setError('Failed to update property');
      console.error('Error updating property:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Delete property
  const deleteProperty = useCallback(async (propertyId) => {
    setLoading(true);
    setError(null);
    
    try {
      if (!user) throw new Error('User must be logged in');

      const propertyRef = doc(db, 'properties', propertyId);
      await deleteDoc(propertyRef);

      return { success: true };
    } catch (error) {
      setError('Failed to delete property');
      console.error('Error deleting property:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch user's properties
  const fetchUserProperties = useCallback(async (userId = null) => {
    setLoading(true);
    setError(null);
    
    try {
      const targetUserId = userId || user?.uid;
      if (!targetUserId) throw new Error('User ID required');

      const q = query(
        collection(db, 'properties'),
        where('ownerId', '==', targetUserId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const userProperties = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setProperties(userProperties);
      return userProperties;
    } catch (error) {
      setError('Failed to fetch user properties');
      console.error('Error fetching user properties:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Search properties
  const searchProperties = useCallback(async (searchTerm) => {
    setLoading(true);
    setError(null);
    
    try {
      // Firestore doesn't support full-text search natively
      // For now, we'll search by title and description
      const q = query(
        collection(db, 'properties'),
        orderBy('title'),
        limit(50)
      );

      const querySnapshot = await getDocs(q);
      const allProperties = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter by search term (client-side filtering)
      const filteredProperties = allProperties.filter(property => 
        property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.location.address.toLowerCase().includes(searchTerm.toLowerCase())
      );

      setProperties(filteredProperties);
      return filteredProperties;
    } catch (error) {
      setError('Failed to search properties');
      console.error('Error searching properties:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Storage-related functions
  const uploadPropertyImages = async (files, propertyId) => {
    try {
      if (!user) throw new Error('User must be logged in');
      
      const result = await storageService.uploadPropertyImages(files, propertyId, user.uid);
      
      if (result.success) {
        toast.success(`${result.successful.length} image(s) uploaded successfully!`);
        return result.successful;
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading property images:', error);
      toast.error('Failed to upload images');
      return null;
    }
  };

  const deletePropertyImage = async (imagePath) => {
    try {
      const result = await storageService.deleteFile(imagePath);
      
      if (result.success) {
        toast.success('Image deleted successfully');
        return true;
      } else {
        throw new Error(result.error || 'Delete failed');
      }
    } catch (error) {
      console.error('Error deleting property image:', error);
      toast.error('Failed to delete image');
      return false;
    }
  };

  const getPropertyImages = async (propertyId) => {
    try {
      const result = await storageService.getPropertyImages(propertyId);
      
      if (result.success) {
        return result.files;
      } else {
        throw new Error(result.error || 'Failed to fetch images');
      }
    } catch (error) {
      console.error('Error fetching property images:', error);
      return [];
    }
  };

  const value = {
    properties,
    loading,
    error,
    filters,
    pagination,
    fetchProperties,
    fetchProperty,
    addProperty,
    updateProperty,
    deleteProperty,
    fetchUserProperties,
    searchProperties,
    setFilters,
    setPagination,
    uploadPropertyImages,
    deletePropertyImage,
    getPropertyImages
  };

  return (
    <PropertyContext.Provider value={value}>
      {children}
    </PropertyContext.Provider>
  );
};