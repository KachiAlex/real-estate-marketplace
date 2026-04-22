import React, { useState, useEffect } from 'react';
import { FaHeart } from 'react-icons/fa';
import { useFavorites } from '../hooks/useFavorites';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

/**
 * FavoriteButton Component
 * Displays a heart icon that toggles favorite status for a property
 * Shows filled heart when favorited, empty when not
 */
const FavoriteButton = ({ propertyId, className = '', size = 'md' }) => {
  const { user } = useAuth();
  const { isFavorite, toggleFavorite, loading } = useFavorites();
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    setIsLiked(isFavorite(propertyId));
  }, [propertyId, isFavorite]);

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Please login to save favorites');
      return;
    }

    const success = await toggleFavorite(propertyId);
    if (success) {
      setIsLiked(!isLiked);
    }
  };

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`
        transition-all duration-200 ease-in-out
        hover:scale-110 active:scale-95
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500
        ${sizeClasses[size]}
        ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}
        ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      title={isLiked ? 'Remove from favorites' : 'Add to favorites'}
      aria-label={isLiked ? 'Remove from favorites' : 'Add to favorites'}
    >
      <FaHeart fill={isLiked ? 'currentColor' : 'none'} />
    </button>
  );
};

export default FavoriteButton;
