import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

/**
 * Custom hook for managing favorite properties
 * Handles fetching, adding, and removing favorites with API integration
 */
export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all favorites for the current user
  const fetchFavorites = useCallback(async (options = {}) => {
    if (!user) {
      setFavorites([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { limit = 10, offset = 0, sortBy = 'savedAt', propertyType = '', location = '', priceRange = [] } = options;
      
      const params = new URLSearchParams({
        limit,
        offset,
        sortBy
      });

      if (propertyType) params.append('propertyType', propertyType);
      if (location) params.append('location', location);
      if (priceRange.length === 2) {
        params.append('minPrice', priceRange[0]);
        params.append('maxPrice', priceRange[1]);
      }

      const response = await fetch(`/api/favorites?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch favorites');
      }

      const data = await response.json();
      setFavorites(data.data?.favorites || []);
      return data.data;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching favorites:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Add a property to favorites
  const addFavorite = useCallback(async (propertyId) => {
    if (!user) {
      toast.error('Please login to save favorites');
      return false;
    }

    try {
      const response = await fetch(`/api/favorites/${propertyId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 409) {
        toast.error('Property already in favorites');
        return false;
      }

      if (!response.ok) {
        throw new Error('Failed to add favorite');
      }

      const data = await response.json();
      toast.success('Added to favorites');
      
      // Update local state
      setFavorites(prev => [...prev, data.data]);
      return true;
    } catch (err) {
      toast.error(err.message);
      console.error('Error adding favorite:', err);
      return false;
    }
  }, [user]);

  // Remove a property from favorites
  const removeFavorite = useCallback(async (propertyId) => {
    if (!user) {
      toast.error('Please login to manage favorites');
      return false;
    }

    try {
      const response = await fetch(`/api/favorites/${propertyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to remove favorite');
      }

      toast.success('Removed from favorites');
      
      // Update local state
      setFavorites(prev => prev.filter(fav => fav.propertyId !== propertyId));
      return true;
    } catch (err) {
      toast.error(err.message);
      console.error('Error removing favorite:', err);
      return false;
    }
  }, [user]);

  // Check if a property is in favorites
  const isFavorite = useCallback((propertyId) => {
    return favorites.some(fav => fav.propertyId === propertyId);
  }, [favorites]);

  // Toggle favorite status
  const toggleFavorite = useCallback(async (propertyId) => {
    if (isFavorite(propertyId)) {
      return removeFavorite(propertyId);
    } else {
      return addFavorite(propertyId);
    }
  }, [isFavorite, addFavorite, removeFavorite]);

  return {
    favorites,
    loading,
    error,
    fetchFavorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite
  };
};

export default useFavorites;
