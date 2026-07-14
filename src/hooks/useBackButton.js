import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Custom hook for handling back button navigation with state preservation
 * @param {function} onBack - Callback when back button is pressed
 * @param {object} stateToPreserve - State to preserve (scroll position, filters, etc.)
 */
export const useBackButton = (onBack, stateToPreserve = {}) => {
  const navigate = useNavigate();
  const stateRef = useRef(stateToPreserve);

  useEffect(() => {
    // Save state to sessionStorage when component mounts
    const stateKey = `backButtonState_${window.location.pathname}`;
    
    try {
      sessionStorage.setItem(stateKey, JSON.stringify(stateToPreserve));
    } catch (error) {
      console.error('Error saving back button state:', error);
    }

    // Handle browser back button
    const handlePopState = (e) => {
      if (onBack) {
        // Restore state from sessionStorage
        try {
          const saved = sessionStorage.getItem(stateKey);
          if (saved) {
            const parsedState = JSON.parse(saved);
            onBack(parsedState);
          } else {
            onBack(stateRef.current);
          }
        } catch (error) {
          console.error('Error restoring back button state:', error);
          onBack(stateRef.current);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [onBack, stateToPreserve]);

  // Function to restore scroll position
  const restoreScrollPosition = (key = 'scrollPosition') => {
    try {
      const saved = sessionStorage.getItem(`${key}_${window.location.pathname}`);
      if (saved) {
        const scrollY = parseInt(saved, 10);
        window.scrollTo(0, scrollY);
      }
    } catch (error) {
      console.error('Error restoring scroll position:', error);
    }
  };

  // Function to save scroll position
  const saveScrollPosition = (key = 'scrollPosition') => {
    try {
      const scrollY = window.scrollY;
      sessionStorage.setItem(`${key}_${window.location.pathname}`, scrollY.toString());
    } catch (error) {
      console.error('Error saving scroll position:', error);
    }
  };

  // Custom back handler
  const handleBack = (defaultPath = -1) => {
    saveScrollPosition();
    if (typeof defaultPath === 'string') {
      navigate(defaultPath);
    } else {
      navigate(defaultPath);
    }
  };

  return { handleBack, restoreScrollPosition, saveScrollPosition };
};

export default useBackButton;

