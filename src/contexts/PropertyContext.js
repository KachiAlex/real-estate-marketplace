import React, { createContext, useContext, useState, useCallback } from 'react';
import frontendMockProperties from '../data/mockProperties';

export const PropertyContext = createContext();

export const useProperty = () => {
  const context = useContext(PropertyContext);
  if (!context) {
    throw new Error('useProperty must be used within a PropertyProvider');
  }
  return context;
};

export function PropertyProvider({ children }) {
  const [properties, setProperties] = useState(() => (
    Array.isArray(frontendMockProperties) ? frontendMockProperties : []
  ));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  // Add property creation logic
  const createProperty = async (propertyData) => {
    setLoading(true);
    setError(null);
    try {
      // Assign a unique id and add to the list
      const newProperty = {
        ...propertyData,
        id: `prop_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setProperties(prev => [newProperty, ...prev]);
      setLoading(false);
      return { success: true, id: newProperty.id };
    } catch (e) {
      setError('Failed to create property');
      setLoading(false);
      return { success: false };
    }
  };

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate fetch
      setTimeout(() => {
        setLoading(false);
      }, 500);
    } catch (e) {
      setError('Failed to fetch properties');
      setLoading(false);
    }
  }, []);

  const value = {
    properties,
    loading,
    error,
    fetchProperties,
    createProperty,
  };

  return (
    <PropertyContext.Provider value={value}>
      {children}
    </PropertyContext.Provider>
  );
}

export default PropertyProvider;