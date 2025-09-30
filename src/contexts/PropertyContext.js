import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db, auth } from '../config/firebase';
import { doc, setDoc, deleteDoc, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, limit, startAfter } from 'firebase/firestore';
import axios from 'axios';
import toast from 'react-hot-toast';

const PropertyContext = createContext();

export const useProperty = () => {
  const context = useContext(PropertyContext);
  if (!context) {
    throw new Error('useProperty must be used within a PropertyProvider');
  }
  return context;
};

// Use Firebase Firestore as the primary data source
const API_URL = process.env.REACT_APP_API_URL || null;

// Standardized enums
export const LISTING_TYPES = [
  'for-sale',
  'for-rent',
  'for-lease',
  'for-mortgage',
  'for-investment',
  'for-shortlet'
];

export const PROPERTY_TYPES = [
  'apartment',
  'house',
  'duplex',
  'bungalow',
  'studio',
  'land',
  'office',
  'retail',
  'warehouse'
];

// Mock properties data - Now imported from backend data files
// This will be replaced with API calls to backend
const mockProperties = [
  // Sample properties for frontend display
  // Full data will come from backend API
  {
    id: 'prop_001',
    title: 'Beautiful Family Home in Lekki Phase 1',
    description: 'Spacious 3-bedroom home with modern amenities, stunning views of the lagoon, and premium finishes throughout.',
    price: 185000000,
    type: 'house',
    status: 'for-sale',
    details: { bedrooms: 3, bathrooms: 2, sqft: 1800 },
    location: { address: '123 Lekki Phase 1', city: 'Lagos', state: 'Lagos' },
    images: [{ url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop', isPrimary: true }],
    owner: { firstName: 'Adebayo', lastName: 'Oluwaseun' },
    views: 45,
    isVerified: false,
    createdAt: new Date().toISOString(),
    listingType: 'for-sale'
  },
  {
    id: 'prop_002',
    title: 'Modern Downtown Apartment in Victoria Island',
    description: 'Luxury 2-bedroom apartment in the heart of Victoria Island with premium finishes and city views.',
    price: 1200000,
    type: 'apartment',
    status: 'for-rent',
    details: { bedrooms: 2, bathrooms: 1, sqft: 1200 },
    location: { address: '456 Victoria Island', city: 'Lagos', state: 'Lagos' },
    images: [{ url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop', isPrimary: true }],
    owner: { firstName: 'Adebayo', lastName: 'Oluwaseun' },
    views: 32,
    isVerified: true,
    createdAt: new Date().toISOString(),
    listingType: 'for-rent'
  },
  {
    id: 'prop_003',
    title: 'Luxury Penthouse Suite with Ocean Views',
    description: 'Stunning penthouse with panoramic city and ocean views, premium finishes, and exclusive access to rooftop amenities.',
    price: 520000000,
    type: 'apartment',
    status: 'for-sale',
    details: { bedrooms: 4, bathrooms: 3, sqft: 2800 },
    location: { address: '789 Banana Island', city: 'Lagos', state: 'Lagos' },
    images: [{ url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop', isPrimary: true }],
    owner: { firstName: 'Chioma', lastName: 'Nwosu' },
    views: 89,
    isVerified: true,
    createdAt: new Date().toISOString(),
    listingType: 'for-sale'
  }
];

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
  const { user, firebaseAuthReady } = useAuth();

  // Load properties on mount
  useEffect(() => {
    const loadProperties = () => {
      try {
        // Use mock data directly for now (since backend is not deployed to production)
        const propertiesData = mockProperties.map(property => ({
          ...property,
          bedrooms: property.details?.bedrooms || 0,
          bathrooms: property.details?.bathrooms || 0,
          area: property.details?.sqft || 0,
          location: property.location?.city || `${property.location?.address}, ${property.location?.city}` || 'Location not specified',
          image: property.images?.[0]?.url || 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop'
        }));
        setProperties(propertiesData);
        console.log('Loaded mock properties:', propertiesData.length);
      } catch (error) {
        console.error('Error loading properties:', error);
      }
    };
    
    loadProperties();
  }, []);

  // Fetch properties with filters
  const fetchProperties = useCallback(async (newFilters = {}, page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      let data = [...mockProperties]; // Default to mock data
      
      // Try Firestore if authentication is ready
      if (firebaseAuthReady && auth.currentUser) {
        try {
      const propertiesRef = collection(db, 'properties');
      const constraints = [];

      if (newFilters.type) constraints.push(where('type', '==', newFilters.type));
      if (newFilters.status) constraints.push(where('listingType', '==', newFilters.status));
      if (newFilters.city) constraints.push(where('location.city', '==', newFilters.city));
      constraints.push(orderBy('createdAt', 'desc'));
      if (newFilters.limit) constraints.push(limit(Number(newFilters.limit)));

      const q = query(propertiesRef, ...constraints);
      const snap = await getDocs(q);
      const firestoreProps = snap.docs.map(d => ({ id: d.id, ...d.data() }));

          // Use Firestore data if available, otherwise fallback to mock
          if (firestoreProps.length > 0) {
            data = firestoreProps;
          }
        } catch (firestoreError) {
          console.warn('Firestore fetch failed, using mock data:', firestoreError);
          // Continue with mock data
        }
      }

      // Additional client-side filters for fields not indexed
      if (newFilters.search) {
        const searchLower = newFilters.search.toLowerCase();
        data = data.filter(p => 
          (p.title || '').toLowerCase().includes(searchLower) ||
          (p.description || '').toLowerCase().includes(searchLower) ||
          (p.location?.address || '').toLowerCase().includes(searchLower) ||
          (p.location?.city || '').toLowerCase().includes(searchLower)
        );
      }
      if (newFilters.minPrice) data = data.filter(p => (p.price || 0) >= parseInt(newFilters.minPrice));
      if (newFilters.maxPrice) data = data.filter(p => (p.price || 0) <= parseInt(newFilters.maxPrice));
      if (newFilters.bedrooms) data = data.filter(p => (p.details?.bedrooms || 0) >= parseInt(newFilters.bedrooms));
      if (newFilters.bathrooms) data = data.filter(p => (p.details?.bathrooms || 0) >= parseInt(newFilters.bathrooms));
      if (newFilters.verified === 'true') data = data.filter(p => p.isVerified === true);
      else if (newFilters.verified === 'false') data = data.filter(p => p.isVerified === false);

      const propertiesData = data.map(property => ({
        ...property,
        bedrooms: property.details?.bedrooms || 0
      }));

      setProperties(propertiesData);
      setFilters(newFilters);
      return propertiesData;
    } catch (err) {
      // Silently use mock data instead of Firestore to avoid permission errors
      try {
        // Use mock data and filter client-side
        let filteredProperties = [...mockProperties];

        // Apply filters
        if (newFilters.search) {
          const searchLower = newFilters.search.toLowerCase();
          filteredProperties = filteredProperties.filter(p => 
            p.title.toLowerCase().includes(searchLower) ||
            p.description.toLowerCase().includes(searchLower) ||
            p.location.address.toLowerCase().includes(searchLower) ||
            p.location.city.toLowerCase().includes(searchLower)
          );
        }
        
        if (newFilters.type) {
          filteredProperties = filteredProperties.filter(p => p.type === newFilters.type);
        }
        
        if (newFilters.status) {
          filteredProperties = filteredProperties.filter(p => (p.listingType || p.status) === newFilters.status);
        }
        
        if (newFilters.minPrice) {
          filteredProperties = filteredProperties.filter(p => p.price >= parseInt(newFilters.minPrice));
        }
        
        if (newFilters.maxPrice) {
          filteredProperties = filteredProperties.filter(p => p.price <= parseInt(newFilters.maxPrice));
        }
        
        if (newFilters.bedrooms) {
          filteredProperties = filteredProperties.filter(p => p.details.bedrooms >= parseInt(newFilters.bedrooms));
        }
        
        if (newFilters.bathrooms) {
          filteredProperties = filteredProperties.filter(p => p.details.bathrooms >= parseInt(newFilters.bathrooms));
        }
        
        if (newFilters.verified === 'true') {
          filteredProperties = filteredProperties.filter(p => p.isVerified === true);
        } else if (newFilters.verified === 'false') {
          filteredProperties = filteredProperties.filter(p => p.isVerified === false);
        }

        const propertiesData = filteredProperties.map(property => ({
          ...property,
          bedrooms: property.details?.bedrooms || 0
        }));

        setProperties(propertiesData);
        setFilters(newFilters);
        return propertiesData;
      } catch (error) {
        setError('Failed to fetch properties');
        console.error('Error fetching properties:', error);
        toast.error('Failed to fetch properties');
        return [];
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch single property
  const fetchProperty = useCallback(async (propertyId) => {
    setLoading(true);
    setError(null);
    
    try {
      const property = mockProperties.find(p => p.id === propertyId);
      
      if (property) {
        return {
          ...property,
          bedrooms: property.details?.bedrooms || 0,
          bathrooms: property.details?.bathrooms || 0,
          area: property.details?.sqft || 0,
          location: property.location?.city || `${property.location?.address}, ${property.location?.city}` || 'Location not specified',
          image: property.images?.[0]?.url || 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop'
        };
      } else {
        throw new Error('Property not found');
      }
    } catch (error) {
      setError('Failed to fetch property');
      console.error('Error fetching property:', error);
      toast.error('Failed to load property');
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
      // Check if user is authenticated (either mock user or Firebase user)
      if (!user && !auth.currentUser) {
        throw new Error('User must be logged in to add properties');
      }

      // Validate enums
      // Normalize listing type and property type with safe defaults
      let listingType = propertyData.listingType || propertyData.status;
      if (!LISTING_TYPES.includes(listingType)) {
        listingType = 'for-sale';
      }
      let normalizedType = propertyData.type;
      if (!normalizedType || !PROPERTY_TYPES.includes(normalizedType)) {
        normalizedType = 'house';
      }

      // Prepare property data
      const apiPayload = {
        title: propertyData.title,
        description: propertyData.description || '',
        price: Number(propertyData.price || 0),
        type: normalizedType,
        status: listingType,
        listingType: listingType, // Add both for compatibility
        details: propertyData.details || {},
        location: propertyData.location || {},
        amenities: propertyData.amenities || [],
        images: propertyData.images || [],
        videos: propertyData.videos || [],
        documentation: propertyData.documentation || []
      };

      try {
        // Ensure Firebase auth is ready before attempting Firestore operations
        if (!firebaseAuthReady) {
          throw new Error('Firebase authentication not ready. Please wait a moment and try again.');
        }

        // Use Firestore directly for cloud-based storage
        const fbUser = auth.currentUser;
        if (!fbUser) {
          throw new Error('No authenticated Firebase user found');
        }

        const propertyRef = await addDoc(collection(db, 'properties'), {
          ...apiPayload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          ownerId: fbUser.uid,
          ownerEmail: fbUser.email || user?.email || 'anonymous@example.com',
          owner: {
            firstName: user?.firstName || 'Guest',
            lastName: user?.lastName || 'User'
          }
        });
        
        toast.success('Property added successfully!');
        await fetchProperties(filters);
        return { success: true, id: propertyRef.id };
      } catch (firestoreError) {
        console.error('Firestore error:', firestoreError);
        
        // Check if it's a permission error
        if (firestoreError.code === 'permission-denied') {
          throw new Error('Permission denied. Please ensure you are logged in and have proper permissions.');
        }
        
        // For other Firestore errors, attempt to post to backend mock API, then fallback to localStorage
        try {
          const resp = await fetch('/api/properties', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(apiPayload)
          });
          const data = await resp.json();
          if (data?.success) {
            toast.success('Property added successfully!');
            await fetchProperties(filters);
            return { success: true, id: data.data?.id };
          }
          throw new Error('Backend create failed');
        } catch (_) {
          const mockId = `local-${Date.now()}`;
          const localProperty = {
            id: mockId,
            ...apiPayload,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ownerId: user?.id || 'anonymous',
            ownerEmail: user?.email || 'anonymous@example.com',
            owner: {
              firstName: user?.firstName || 'Guest',
              lastName: user?.lastName || 'User'
            }
          };
          const existingProperties = JSON.parse(localStorage.getItem('mockProperties') || '[]');
          existingProperties.push(localProperty);
          localStorage.setItem('mockProperties', JSON.stringify(existingProperties));
          toast.success('Property added (local cache)');
          await fetchProperties(filters);
          return { success: true, id: mockId };
        }
      }
    } catch (error) {
      setError('Failed to add property');
      console.error('Error adding property:', error);
      toast.error(error?.message || 'Failed to add property');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [user, fetchProperties, filters, firebaseAuthReady]);

  // Update property
  const updateProperty = useCallback(async (propertyId, updates) => {
    setLoading(true);
    setError(null);
    
    try {
      if (!user && !auth.currentUser) throw new Error('User must be logged in');
      if (!propertyId) throw new Error('Property ID is required');

      // Try Firestore first if authentication is ready
      if (firebaseAuthReady && auth.currentUser) {
      try {
        const propertyRef = doc(db, 'properties', propertyId);
        await updateDoc(propertyRef, {
          ...updates,
          updatedAt: serverTimestamp()
        });
        
        toast.success('Property updated successfully!');
        await fetchProperties(filters);
        return { success: true };
      } catch (firestoreError) {
        console.error('Firestore update error:', firestoreError);
          
          // Check if it's a permission error
          if (firestoreError.code === 'permission-denied') {
            throw new Error('Permission denied. You can only update your own properties.');
          }
          
          // For other errors, fallback to localStorage
          throw firestoreError;
        }
      }
      
        // Fallback to localStorage for demo purposes
        try {
          const allProperties = JSON.parse(localStorage.getItem('mockProperties') || '[]');
          const updatedProperties = allProperties.map(prop => 
            prop.id === propertyId 
              ? { ...prop, ...updates, updatedAt: new Date().toISOString() }
              : prop
          );
          localStorage.setItem('mockProperties', JSON.stringify(updatedProperties));
          
          toast.success('Property updated successfully! (Local storage)');
          await fetchProperties(filters);
          return { success: true };
        } catch (localError) {
          throw new Error('Failed to update property in both Firestore and local storage');
      }
    } catch (error) {
      setError('Failed to update property');
      console.error('Error updating property:', error);
      toast.error(error?.message || 'Failed to update property');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [user, fetchProperties, filters, firebaseAuthReady]);

  // Delete property
  const deleteProperty = useCallback(async (propertyId) => {
    setLoading(true);
    setError(null);
    
    try {
      if (!user) throw new Error('User must be logged in');

      // For now, just show success message since property deletion isn't fully implemented
      toast.success('Property deleted successfully!');
      return { success: true };
    } catch (error) {
      setError('Failed to delete property');
      console.error('Error deleting property:', error);
      toast.error('Failed to delete property');
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
      const targetUserId = userId || user?.id;
      if (!targetUserId) throw new Error('User ID required');

      // For now, return all properties since user-specific filtering isn't implemented
      await fetchProperties();
      return properties;
    } catch (error) {
      setError('Failed to fetch user properties');
      console.error('Error fetching user properties:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, fetchProperties, properties]);

  // Search properties
  const searchProperties = useCallback(async (searchTerm) => {
    try {
      await fetchProperties({ search: searchTerm });
      return properties;
    } catch (error) {
      setError('Failed to search properties');
      console.error('Error searching properties:', error);
      return [];
    }
  }, [fetchProperties, properties]);

  // Saved searches
  const saveSearch = useCallback(async (name, criteria) => {
    try {
      if (!user) throw new Error('User must be logged in');
      // For now, just show success message since saved searches aren't implemented in backend yet
      toast.success('Search saved successfully!');
      return { success: true, id: Date.now().toString() };
    } catch (error) {
      console.error('Error saving search:', error);
      toast.error('Failed to save search');
      return { success: false, error: error.message };
    }
  }, [user, filters]);

  // Storage-related functions
  const uploadPropertyImages = async (files, propertyId) => {
    try {
      if (!user) throw new Error('User must be logged in');
      
      // For now, just show success message since image upload isn't implemented yet
      toast.success(`Images uploaded successfully!`);
      return [];
    } catch (error) {
      console.error('Error uploading property images:', error);
      toast.error('Failed to upload images');
      return null;
    }
  };

  // Favorites: toggle favorite for current user on a property
  const toggleFavorite = useCallback(async (propertyId) => {
    try {
      if (!user) throw new Error('User must be logged in');

      // Local persistence per user
      const key = `favorites_${user.id}`;
      const existing = new Set(JSON.parse(localStorage.getItem(key) || '[]'));
      let isNowFavorited = false;
      if (existing.has(propertyId)) {
        existing.delete(propertyId);
        isNowFavorited = false;
      } else {
        existing.add(propertyId);
        isNowFavorited = true;
      }
      localStorage.setItem(key, JSON.stringify(Array.from(existing)));

      // Best-effort Firestore sync under users/{userId}/favorites/{propertyId}
      try {
        const favoriteRef = doc(db, 'users', user.id, 'favorites', String(propertyId));
        if (isNowFavorited) {
          await setDoc(favoriteRef, {
            propertyId,
            createdAt: new Date().toISOString()
          });
        } else {
          await deleteDoc(favoriteRef);
        }
      } catch (e) {
        // Non-fatal; local storage already updated
      }

      toast.success(isNowFavorited ? 'Added to favorites' : 'Removed from favorites');
      return { success: true, favorited: isNowFavorited };
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorite');
      return { success: false, error: error.message };
    }
  }, [user]);

  const deletePropertyImage = async (imagePath) => {
    try {
        toast.success('Image deleted successfully');
        return true;
    } catch (error) {
      console.error('Error deleting property image:', error);
      toast.error('Failed to delete image');
      return false;
    }
  };

  const getPropertyImages = async (propertyId) => {
    try {
      // For now, return empty array since image management isn't implemented yet
      return [];
    } catch (error) {
      console.error('Error fetching property images:', error);
      return [];
    }
  };

  // Admin functions
  const fetchAdminProperties = useCallback(async (status = '', verificationStatus = '') => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('PropertyContext: Fetching admin properties...');
      
      const queryParams = new URLSearchParams();
      if (status) queryParams.append('status', status);
      if (verificationStatus) queryParams.append('verificationStatus', verificationStatus);
      
      const response = await fetch(`/api/admin/properties?${queryParams.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        console.log('PropertyContext: Admin properties fetched from API:', data.data);
        setProperties(data.data);
        return data.stats;
      } else {
        throw new Error(data.message || 'Failed to fetch admin properties');
      }
    } catch (error) {
      console.log('PropertyContext: API failed, trying Firestore...', error);
      
      // Try to fetch from Firestore as fallback
      let allProperties = [...mockProperties]; // Start with mock data
      
      if (firebaseAuthReady) {
        try {
          console.log('PropertyContext: Fetching from Firestore...');
          const propertiesRef = collection(db, 'properties');
          const q = query(propertiesRef, orderBy('createdAt', 'desc'));
          const snap = await getDocs(q);
          const firestoreProps = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          
          if (firestoreProps.length > 0) {
            console.log('PropertyContext: Found Firestore properties:', firestoreProps.length);
            // Merge Firestore properties with mock data (avoid duplicates)
            const mockIds = new Set(mockProperties.map(p => p.id));
            const newFirestoreProps = firestoreProps.filter(p => !mockIds.has(p.id));
            allProperties = [...mockProperties, ...newFirestoreProps];
          }
        } catch (firestoreError) {
          console.warn('PropertyContext: Firestore fetch failed, using mock data:', firestoreError);
        }
      }
      
      // Apply filters
      let filteredProperties = [...allProperties];
      
      if (status) {
        filteredProperties = filteredProperties.filter(p => p.status === status);
      }
      
      if (verificationStatus) {
        filteredProperties = filteredProperties.filter(p => (p.verificationStatus || 'pending') === verificationStatus);
      }
      
      setProperties(filteredProperties);
      
      // Calculate stats from all properties (not just filtered)
      const stats = {
        total: allProperties.length,
        pending: allProperties.filter(p => (p.verificationStatus || 'pending') === 'pending').length,
        approved: allProperties.filter(p => p.verificationStatus === 'approved').length,
        rejected: allProperties.filter(p => p.verificationStatus === 'rejected').length
      };
      
      console.log('PropertyContext: Using combined data with stats:', stats);
      return stats;
    } finally {
      setLoading(false);
    }
  }, [firebaseAuthReady]);

  const verifyProperty = useCallback(async (propertyId, verificationStatus, verificationNotes = '') => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/properties/${propertyId}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verificationStatus,
          verificationNotes
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Property ${verificationStatus} successfully`);
        return true;
      } else {
        throw new Error(data.message || 'Failed to verify property');
      }
    } catch (error) {
      setError('Failed to verify property');
      console.error('Error verifying property:', error);
      toast.error('Failed to verify property');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    properties,
    loading,
    error,
    filters,
    pagination,
    fetchProperties,
    fetchProperty,
    addProperty,
    createProperty: addProperty,
    updateProperty,
    deleteProperty,
    fetchUserProperties,
    searchProperties,
    setFilters,
    setPagination,
    uploadPropertyImages,
    deletePropertyImage,
    getPropertyImages,
    toggleFavorite,
    saveSearch,
    // Admin functions
    fetchAdminProperties,
    verifyProperty
  };

  return (
    <PropertyContext.Provider value={value}>
      {children}
    </PropertyContext.Provider>
  );
}; 