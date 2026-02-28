import React, { createContext, useContext, useState, useCallback } from 'react';
import frontendMockProperties from '../data/mockProperties';
import { getApiUrl } from '../utils/apiConfig';
import { useAuth } from './AuthContext';
import apiClient from '../services/apiClient';

const buildMetadataSnapshot = (property, propertyId) => {
  const base = property || {};
  const primaryImage = Array.isArray(base.images) && base.images.length > 0
    ? (typeof base.images[0] === 'string' ? base.images[0] : base.images[0]?.url)
    : base.image;

  return {
    id: base.id || base.propertyId || propertyId,
    title: base.title || 'Property',
    description: base.description || '',
    location: base.location || base.address || {
      city: base.city,
      state: base.state,
      address: base.address
    },
    city: base.city,
    state: base.state,
    price: base.price || 0,
    bedrooms: base.bedrooms || base.details?.bedrooms || 0,
    bathrooms: base.bathrooms || base.details?.bathrooms || 0,
    area: base.area || base.details?.sqft || base.sqft || 0,
    images: base.images || (primaryImage ? [primaryImage] : []),
    image: primaryImage,
    status: base.status,
    type: base.type,
    agent: base.agent || base.owner || {
      name: base.vendorName,
      phone: base.vendorPhone,
      email: base.vendorEmail
    },
    vendorName: base.vendorName,
    vendorEmail: base.vendorEmail,
    vendorPhone: base.vendorPhone,
    dateAdded: base.createdAt || base.dateAdded || new Date().toISOString()
  };
};

export const PropertyContext = createContext();

export const useProperty = () => {
  const context = useContext(PropertyContext);
  if (!context) {
    throw new Error('useProperty must be used within a PropertyProvider');
  }
  return context;
};

export function PropertyProvider({ children }) {
  const { currentUser } = useAuth();
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

  const toggleFavorite = useCallback(async (propertyId, propertyData = null) => {
    if (!currentUser || !currentUser.id) {
      return { success: false, requiresAuth: true };
    }

    const propertyIdStr = String(propertyId || '').trim();
    if (!propertyIdStr) {
      return { success: false, error: 'Invalid property id' };
    }

    const favoritesKey = `favorites_${currentUser.id}`;
    const metadataKey = `favorites_metadata_${currentUser.id}`;

    let favoritesSet = new Set();
    try {
      const stored = JSON.parse(localStorage.getItem(favoritesKey) || '[]');
      favoritesSet = new Set((stored || []).map((id) => String(id)));
    } catch (err) {
      console.warn('PropertyContext: failed to parse favorites from localStorage', err);
    }

    const wasFavorite = favoritesSet.has(propertyIdStr);
    if (wasFavorite) {
      favoritesSet.delete(propertyIdStr);
    } else {
      favoritesSet.add(propertyIdStr);
    }

    try {
      localStorage.setItem(favoritesKey, JSON.stringify(Array.from(favoritesSet)));
    } catch (err) {
      console.warn('PropertyContext: failed to persist favorites', err);
    }

    try {
      const metadata = JSON.parse(localStorage.getItem(metadataKey) || '{}') || {};
      if (!wasFavorite) {
        const sourceProperty = propertyData || findLocalProperty(propertyIdStr) || { id: propertyIdStr };
        metadata[propertyIdStr] = buildMetadataSnapshot(sourceProperty, propertyIdStr);
      } else {
        delete metadata[propertyIdStr];
      }
      localStorage.setItem(metadataKey, JSON.stringify(metadata));
    } catch (err) {
      console.warn('PropertyContext: failed to persist favorites metadata', err);
    }

    try {
      window.dispatchEvent(new CustomEvent('favoritesUpdated', {
        detail: { propertyId: propertyIdStr, favorited: !wasFavorite }
      }));
    } catch (err) {
      console.debug('PropertyContext: favoritesUpdated event failed', err);
    }

    let apiError = null;
    try {
      const response = await apiClient.post(`/properties/${propertyIdStr}/favorite`);
      if (!response?.data?.success) {
        apiError = response?.data?.message || 'Favorite toggle failed on server';
      }
    } catch (err) {
      console.warn('PropertyContext: toggleFavorite API failed', err?.response?.data || err.message || err);
      apiError = err?.response?.data?.message || err.message;
    }

    return {
      success: true,
      favorited: !wasFavorite,
      fallback: Boolean(apiError),
      error: apiError || null
    };
  }, [currentUser, findLocalProperty]);

  const value = {
    properties,
    loading,
    error,
    fetchProperties,
    createProperty,
    fetchProperty,
    getPropertyById: findLocalProperty,
    toggleFavorite,
  };

  return (
    <PropertyContext.Provider value={value}>
      {children}
    </PropertyContext.Provider>
  );
}

export default PropertyProvider;