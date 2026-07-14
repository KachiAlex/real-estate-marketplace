import { useEffect, useRef } from 'react';

/**
 * Custom hook for auto-saving form data to localStorage
 * @param {string} storageKey - Key for localStorage
 * @param {object} formData - Form data to save
 * @param {number} debounceMs - Debounce delay in milliseconds (default: 1000)
 */
export const useAutoSave = (storageKey, formData, debounceMs = 1000) => {
  const timeoutRef = useRef(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Skip auto-save on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(formData));
      } catch (error) {
        console.error('Error auto-saving form data:', error);
      }
    }, debounceMs);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [formData, storageKey, debounceMs]);

  // Function to clear saved data
  const clearSavedData = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Error clearing saved data:', error);
    }
  };

  // Function to load saved data manually
  const loadSavedData = () => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
    return null;
  };

  return { clearSavedData, loadSavedData };
};

export default useAutoSave;

