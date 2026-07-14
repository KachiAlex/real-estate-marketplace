/**
 * Safe localStorage utility that handles browser extension blocking
 * and provides fallback behavior
 */

const isStorageAvailable = (type = 'localStorage') => {
  try {
    const storage = window[type];
    const testKey = '__storage_test__';
    storage.setItem(testKey, 'test');
    storage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

export const safeLocalStorage = {
  getItem: (key) => {
    try {
      if (!isStorageAvailable()) {
        console.warn('localStorage is not available (may be blocked by browser extension)');
        return null;
      }
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('Error accessing localStorage:', error);
      return null;
    }
  },

  setItem: (key, value) => {
    try {
      if (!isStorageAvailable()) {
        console.warn('localStorage is not available (may be blocked by browser extension)');
        return false;
      }
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn('Error writing to localStorage:', error);
      return false;
    }
  },

  removeItem: (key) => {
    try {
      if (!isStorageAvailable()) {
        return false;
      }
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('Error removing from localStorage:', error);
      return false;
    }
  },

  clear: () => {
    try {
      if (!isStorageAvailable()) {
        return false;
      }
      localStorage.clear();
      return true;
    } catch (error) {
      console.warn('Error clearing localStorage:', error);
      return false;
    }
  }
};

export default safeLocalStorage;

