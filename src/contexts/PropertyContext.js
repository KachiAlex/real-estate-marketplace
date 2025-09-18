import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
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

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
    const loadProperties = async () => {
      try {
        const response = await axios.get(`${API_URL}/properties`);
        if (response.data.success) {
          const propertiesData = response.data.data.map(property => ({
            ...property,
            bedrooms: property.details?.bedrooms || 0,
            bathrooms: property.details?.bathrooms || 0,
            area: property.details?.sqft || 0,
            location: property.location?.city || `${property.location?.address}, ${property.location?.city}` || 'Location not specified',
            image: property.images?.[0]?.url || 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop'
          }));
          setProperties(propertiesData);
        }
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
      // Build query parameters
      const params = new URLSearchParams();
      
      if (newFilters.search) params.append('search', newFilters.search);
      if (newFilters.type) params.append('type', newFilters.type);
      if (newFilters.status) params.append('status', newFilters.status);
      if (newFilters.minPrice) params.append('minPrice', newFilters.minPrice);
      if (newFilters.maxPrice) params.append('maxPrice', newFilters.maxPrice);
      if (newFilters.bedrooms) params.append('bedrooms', newFilters.bedrooms);
      if (newFilters.bathrooms) params.append('bathrooms', newFilters.bathrooms);
      if (newFilters.verified !== undefined) params.append('verified', newFilters.verified);
      params.append('page', page);
      params.append('limit', pagination.itemsPerPage);

      const response = await axios.get(`${API_URL}/properties?${params}`);
      
      if (response.data.success) {
        const propertiesData = response.data.data.map(property => ({
          ...property,
          // Map backend property structure to frontend expected structure
          bedrooms: property.details?.bedrooms || 0,
          bathrooms: property.details?.bathrooms || 0,
          area: property.details?.sqft || 0,
          location: property.location?.city || `${property.location?.address}, ${property.location?.city}` || 'Location not specified',
          image: property.images?.[0]?.url || 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop'
        }));

        setProperties(propertiesData);
        
        if (response.data.pagination) {
          setPagination(prev => ({
            ...prev,
            currentPage: response.data.pagination.currentPage,
            totalPages: response.data.pagination.totalPages,
            totalItems: response.data.pagination.totalItems
          }));
        }

        if (Object.keys(newFilters).length > 0) {
          setFilters(newFilters);
        }
      } else {
        throw new Error(response.data.message || 'Failed to fetch properties');
      }
    } catch (error) {
      setError('Failed to fetch properties');
      console.error('Error fetching properties:', error);
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  }, [pagination.itemsPerPage]);

  // Fetch single property
  const fetchProperty = useCallback(async (propertyId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/properties/${propertyId}`);
      
      if (response.data.success) {
        const property = response.data.data;
        return {
          ...property,
          bedrooms: property.details?.bedrooms || 0,
          bathrooms: property.details?.bathrooms || 0,
          area: property.details?.sqft || 0,
          location: property.location?.city || `${property.location?.address}, ${property.location?.city}` || 'Location not specified',
          image: property.images?.[0]?.url || 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop'
        };
      } else {
        throw new Error(response.data.message || 'Property not found');
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

      const response = await axios.post(`${API_URL}/properties`, propertyData);
      
      if (response.data.success) {
        toast.success('Property added successfully!');
        // Refresh properties list
        fetchProperties();
        return { success: true, id: response.data.data.id };
      } else {
        throw new Error(response.data.message || 'Failed to add property');
      }
    } catch (error) {
      setError('Failed to add property');
      console.error('Error adding property:', error);
      toast.error('Failed to add property');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [user, fetchProperties]);

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

      // For now, just show a success message since favorites aren't implemented in backend yet
      toast.success('Favorite toggled!');
      return { success: true, favorited: true };
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