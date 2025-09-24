// Google Maps API Loader Utility
let isLoaded = false;
let isLoading = false;
let loadPromise = null;

export const loadGoogleMapsAPI = (apiKey) => {
  if (isLoaded) {
    return Promise.resolve();
  }

  if (isLoading) {
    return loadPromise;
  }

  isLoading = true;
  loadPromise = new Promise((resolve, reject) => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      isLoaded = true;
      isLoading = false;
      resolve();
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      isLoaded = true;
      isLoading = false;
      resolve();
    };
    
    script.onerror = () => {
      isLoading = false;
      reject(new Error('Failed to load Google Maps API'));
    };

    // Add script to document
    document.head.appendChild(script);
  });

  return loadPromise;
};

export const isGoogleMapsLoaded = () => {
  return isLoaded && window.google && window.google.maps;
};
