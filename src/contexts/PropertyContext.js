import React, { createContext, useContext, useState, useCallback } from 'react';
import frontendMockProperties from '../data/mockProperties';
import { getApiUrl } from '../utils/apiConfig';

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

  const matchPropertyId = useCallback((property, targetId) => {
    if (!property || !targetId) return false;
    const raw = String(targetId).trim().toLowerCase();
    if (!raw) return false;

    const variants = new Set();
    const addVariant = (value) => {
      if (!value && value !== 0) return;
      const str = String(value).trim().toLowerCase();
      if (!str) return;
      variants.add(str);
      if (str.startsWith('prop_')) variants.add(str.replace(/^prop_/, ''));
      else variants.add(`prop_${str}`);
    };

    addVariant(property.id);
    addVariant(property.propertyId);
    addVariant(property.slug);
    addVariant(property.numericId);

    // Support numeric ids that may be embedded in strings like "prop_123"
    if (typeof property.id === 'string' && property.id.match(/prop_\d+/)) {
      addVariant(property.id.replace('prop_', ''));
    }

    return variants.has(raw);
  }, []);

  const findLocalProperty = useCallback((propertyId) => {
    if (!propertyId) return null;
    const allSources = [Array.isArray(properties) ? properties : [], Array.isArray(frontendMockProperties) ? frontendMockProperties : []];

    for (const source of allSources) {
      const found = source.find((prop) => matchPropertyId(prop, propertyId));
      if (found) return found;
    }
    return null;
  }, [properties, matchPropertyId]);

  const fetchProperty = useCallback(async (propertyId) => {
    if (!propertyId) return null;
    const localMatch = findLocalProperty(propertyId);
    if (localMatch) return localMatch;

    try {
      const response = await fetch(getApiUrl(`/properties/${propertyId}`));
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data) return null;
      const propertyData = data.property || data.data || null;
      if (!propertyData) return null;

      setProperties((prev) => {
        if (prev.some((prop) => matchPropertyId(prop, propertyData.id || propertyId))) {
          return prev;
        }
        return [propertyData, ...prev];
      });

      return propertyData;
    } catch (err) {
      console.warn('PropertyContext: fetchProperty fallback failed', err);
      return null;
    }
  }, [findLocalProperty, matchPropertyId]);

  const value = {
    properties,
    loading,
    error,
    fetchProperties,
    createProperty,
    fetchProperty,
    getPropertyById: findLocalProperty,
  };

  return (
    <PropertyContext.Provider value={value}>
      {children}
    </PropertyContext.Provider>
  );
}

export default PropertyProvider;