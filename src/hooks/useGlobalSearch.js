import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export const useGlobalSearch = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const navigate = useNavigate();

  const openSearch = useCallback(() => {
    setIsSearchOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
  }, []);

  const handleResultClick = useCallback((type, item) => {
    switch (type) {
      case 'property':
        navigate(`/property/${item.id}`);
        break;
      case 'investment':
        navigate(`/investment/${item.id}`);
        break;
      case 'user':
        navigate(`/profile/${item.id}`);
        break;
      default:
        console.warn('Unknown result type:', type);
    }
  }, [navigate]);

  return {
    isSearchOpen,
    openSearch,
    closeSearch,
    handleResultClick
  };
};
