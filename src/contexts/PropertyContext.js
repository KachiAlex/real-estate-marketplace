import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const PropertyContext = createContext();

const API_BASE_URL = 'https://real-estate-marketplace-1-k8jp.onrender.com';

export const PropertyProvider = ({ children }) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch properties from API
  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/properties`);
      const data = await response.json();
      if (data.success) {
        setProperties(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch properties');
      }
    } catch (err) {
      setError('Failed to fetch properties');
      console.error('Error fetching properties:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add new property
  const addProperty = async (propertyData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(propertyData),
      });
      const data = await response.json();
      if (data.success) {
        setProperties(prev => [...prev, data.data]);
        return { success: true, data: data.data };
      } else {
        setError(data.message || 'Failed to add property');
        return { success: false, message: data.message };
      }
    } catch (err) {
      setError('Failed to add property');
      console.error('Error adding property:', err);
      return { success: false, message: 'Failed to add property' };
    } finally {
      setLoading(false);
    }
  };

  // Get property by ID
  const getPropertyById = async (id) => {
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
    } catch (err) {
      setError('Failed to fetch property');
      console.error('Error fetching property:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const value = {
    properties,
    loading,
    error,
    fetchProperties,
    addProperty,
    getPropertyById,
  };

  return (
    <PropertyContext.Provider value={value}>
      {children}
    </PropertyContext.Provider>
  );
};

export const useProperty = () => {
  const context = useContext(PropertyContext);
  if (!context) {
    throw new Error('useProperty must be used within a PropertyProvider');
  }
  return context;
}; 