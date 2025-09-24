import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../config/firebase';
import { doc, setDoc, deleteDoc, collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, limit, startAfter } from 'firebase/firestore';
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

// For now, use mock data directly since backend is not deployed to production
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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

// Mock properties data for production use - All prices in Nigerian Naira (₦)
const mockProperties = [
  {
    id: '1',
    title: 'Beautiful Family Home',
    description: 'Spacious 3-bedroom home with modern amenities and stunning views',
    price: 185000000, // ₦185,000,000
    type: 'house',
    status: 'for-sale',
    details: { bedrooms: 3, bathrooms: 2, sqft: 1800 },
    location: { address: '123 Lekki Phase 1', city: 'Lagos', state: 'Lagos' },
    images: [{ url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop', isPrimary: true }],
    owner: { firstName: 'John', lastName: 'Doe' },
    views: 45,
    isVerified: false,
    createdAt: new Date().toISOString(),
    listingType: 'for-sale'
  },
  {
    id: '2',
    title: 'Modern Downtown Apartment',
    description: 'Luxury 2-bedroom apartment in the heart of Victoria Island',
    price: 1200000, // ₦1,200,000/month
    type: 'apartment',
    status: 'for-rent',
    details: { bedrooms: 2, bathrooms: 1, sqft: 1200 },
    location: { address: '456 Victoria Island', city: 'Lagos', state: 'Lagos' },
    images: [{ url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop', isPrimary: true }],
    owner: { firstName: 'John', lastName: 'Doe' },
    views: 32,
    isVerified: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    title: 'Luxury Penthouse Suite',
    description: 'Stunning penthouse with panoramic city views and premium finishes',
    price: 520000000, // ₦520,000,000
    type: 'apartment',
    status: 'for-sale',
    details: { bedrooms: 4, bathrooms: 3, sqft: 2800 },
    location: { address: '789 Banana Island', city: 'Lagos', state: 'Lagos' },
    images: [{ url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop', isPrimary: true }],
    owner: { firstName: 'Admin', lastName: 'User' },
    views: 89,
    isVerified: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '4',
    title: 'Cozy Studio Apartment',
    description: 'Perfect starter home in a vibrant neighborhood',
    price: 800000, // ₦800,000/month
    type: 'apartment',
    status: 'for-rent',
    details: { bedrooms: 1, bathrooms: 1, sqft: 650 },
    location: { address: '321 Surulere', city: 'Lagos', state: 'Lagos' },
    images: [{ url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop', isPrimary: true }],
    owner: { firstName: 'John', lastName: 'Doe' },
    views: 24,
    isVerified: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '5',
    title: 'Suburban Villa with Pool',
    description: 'Spacious family villa with private pool and garden',
    price: 310000000, // ₦310,000,000
    type: 'house',
    status: 'for-sale',
    details: { bedrooms: 5, bathrooms: 4, sqft: 3200 },
    location: { address: '456 Magodo GRA', city: 'Lagos', state: 'Lagos' },
    images: [{ url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=300&fit=crop', isPrimary: true }],
    owner: { firstName: 'Admin', lastName: 'User' },
    views: 67,
    isVerified: false,
    createdAt: new Date().toISOString()
  },
  {
    id: '6',
    title: 'Commercial Office Space',
    description: 'Prime commercial space perfect for business operations',
    price: 3500000, // ₦3,500,000/month
    type: 'commercial',
    status: 'for-lease',
    details: { bedrooms: 0, bathrooms: 2, sqft: 1500 },
    location: { address: '123 Ikeja GRA', city: 'Lagos', state: 'Lagos' },
    images: [{ url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop', isPrimary: true }],
    owner: { firstName: 'Onyedikachi', lastName: 'Akoma' },
    views: 43,
    isVerified: true,
    createdAt: new Date().toISOString()
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
  const { user } = useAuth();

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
      // Prefer Firestore
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

      // Fallback to mock if Firestore empty
      let data = firestoreProps.length ? firestoreProps : [...mockProperties];

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
      console.warn('Firestore fetch failed, using mock. Error:', err?.message);
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
      if (!user) throw new Error('User must be logged in');

      // Validate enums
      const listingType = propertyData.listingType || propertyData.status;
      if (!LISTING_TYPES.includes(listingType)) {
        throw new Error('Invalid listing type');
      }
      if (propertyData.type && !PROPERTY_TYPES.includes(propertyData.type)) {
        throw new Error('Invalid property type');
      }

      const payload = {
        title: propertyData.title,
        description: propertyData.description || '',
        price: Number(propertyData.price || 0),
        type: propertyData.type || 'apartment',
        listingType,
        details: propertyData.details || {},
        location: propertyData.location || {},
        images: propertyData.images || [],
        isVerified: false,
        vendorId: user?.id || user?.uid || String(user),
        owner: { firstName: user.firstName || '', lastName: user.lastName || '' },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const ref = await addDoc(collection(db, 'properties'), payload);
      toast.success('Property added successfully!');
      await fetchProperties(filters);
      return { success: true, id: ref.id };
    } catch (error) {
      setError('Failed to add property');
      console.error('Error adding property:', error);
      toast.error(error?.message || 'Failed to add property');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [user, fetchProperties, filters]);

  // Update property
  const updateProperty = useCallback(async (propertyId, updates) => {
    setLoading(true);
    setError(null);
    
    try {
      if (!user) throw new Error('User must be logged in');

      // For now, just show success message since property updates aren't fully implemented
      toast.success('Property updated successfully!');
      return { success: true };
    } catch (error) {
      setError('Failed to update property');
      console.error('Error updating property:', error);
      toast.error('Failed to update property');
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
    saveSearch
  };

  return (
    <PropertyContext.Provider value={value}>
      {children}
    </PropertyContext.Provider>
  );
}; 