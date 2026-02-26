import React, { createContext, useContext, useState, useCallback } from 'react';

export const PropertyContext = createContext();

export const useProperty = () => {
  const context = useContext(PropertyContext);
  if (!context) {
    throw new Error('useProperty must be used within a PropertyProvider');
  }
  return context;
};

export function PropertyProvider({ children }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Example: fetch properties (replace with real logic as needed)
  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate fetch
      setTimeout(() => {
        setProperties([]);
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
  };

  return (
    <PropertyContext.Provider value={value}>
      {children}
    </PropertyContext.Provider>
  );
}

export default PropertyProvider;