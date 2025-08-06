import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

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
    bedrooms: '',
    bathrooms: '',
    verified: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 12
  });
  const { user } = useAuth();

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://real-estate-marketplace-1-k8jp.onrender.com';

  // Fetch properties with filters
  const fetchProperties = useCallback(async (newFilters = filters, page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams({
        page,
        limit: pagination.itemsPerPage,
        ...newFilters
      });

      const response = await fetch(`${API_BASE_URL}/api/properties?${queryParams}`);
      const data = await response.json();

      if (data.success) {
        setProperties(data.data);
        setPagination(data.pagination);
        setFilters(newFilters);
      } else {
        setError(data.message || 'Failed to fetch properties');
      }
    } catch (error) {
      setError('Failed to fetch properties');
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.itemsPerPage, API_BASE_URL]); // Remove filters from dependencies to prevent infinite re-renders

  // Fetch admin properties
  const fetchAdminProperties = useCallback(async (status = '', verificationStatus = '') => {
    if (user?.role !== 'admin') {
      setError('Admin access required');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams();
      if (status) queryParams.append('status', status);
      if (verificationStatus) queryParams.append('verificationStatus', verificationStatus);

      const response = await fetch(`${API_BASE_URL}/api/admin/properties?${queryParams}`);
      const data = await response.json();

      if (data.success) {
        setProperties(data.data);
        return data.stats;
      } else {
        setError(data.message || 'Failed to fetch admin properties');
      }
    } catch (error) {
      setError('Failed to fetch admin properties');
      console.error('Error fetching admin properties:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.role, API_BASE_URL]);

  // Verify property (admin only)
  const verifyProperty = useCallback(async (propertyId, verificationStatus, verificationNotes = '') => {
    if (user?.role !== 'admin') {
      setError('Admin access required');
      return false;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/properties/${propertyId}/verify`, {
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
        // Update the property in the local state
        setProperties(prev => 
          prev.map(prop => 
            prop.id === propertyId 
              ? { ...prop, ...data.data }
              : prop
          )
        );
        return true;
      } else {
        setError(data.message || 'Failed to verify property');
        return false;
      }
    } catch (error) {
      setError('Failed to verify property');
      console.error('Error verifying property:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.role, API_BASE_URL]);

  // Create new property
  const createProperty = useCallback(async (propertyData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(propertyData)
      });

      const data = await response.json();

      if (data.success) {
        setProperties(prev => [data.data, ...prev]);
        return { success: true, data: data.data };
      } else {
        setError(data.message || 'Failed to create property');
        return { success: false, message: data.message };
      }
    } catch (error) {
      setError('Failed to create property');
      console.error('Error creating property:', error);
      return { success: false, message: 'Failed to create property' };
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  // Get property by ID
  const getPropertyById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/properties/${id}`);
      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        setError(data.message || 'Property not found');
        return null;
      }
    } catch (error) {
      setError('Failed to fetch property');
      console.error('Error fetching property:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      type: '',
      status: '',
      minPrice: '',
      maxPrice: '',
      bedrooms: '',
      bathrooms: '',
      verified: ''
    });
  }, []);

  // Get available filter options
  const getFilterOptions = useCallback(() => ({
    types: ['house', 'apartment', 'condo', 'townhouse', 'land', 'commercial'],
    statuses: ['for-sale', 'for-rent', 'for-lease'],
    verificationStatuses: ['pending', 'approved', 'rejected']
  }), []);

  // Remove the automatic fetch on mount to prevent circular dependencies
  // fetchProperties will be called explicitly when needed

  const value = {
    properties,
    loading,
    error,
    filters,
    pagination,
    fetchProperties,
    fetchAdminProperties,
    verifyProperty,
    createProperty,
    getPropertyById,
    updateFilters,
    clearFilters,
    getFilterOptions
  };

  return (
    <PropertyContext.Provider value={value}>
      {children}
    </PropertyContext.Provider>
  );
}; 