// Google Maps API Loader Utility - Optimized for Performance
let isLoaded = false;
let isLoading = false;
let loadPromise = null;
let servicesInitialized = false;

// Preload the API when the page loads
const preloadGoogleMapsAPI = () => {
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  if (apiKey && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY' && !isLoaded && !isLoading) {
    loadGoogleMapsAPI(apiKey);
  }
};

// Start preloading immediately
preloadGoogleMapsAPI();

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

      // Create script element with optimized parameters
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly&loading=async`;
      script.async = true;
      script.defer = true;
    
    // Add preconnect hints for faster loading
    const preconnectLink = document.createElement('link');
    preconnectLink.rel = 'preconnect';
    preconnectLink.href = 'https://maps.googleapis.com';
    document.head.appendChild(preconnectLink);
    
    const dnsPrefetchLink = document.createElement('link');
    dnsPrefetchLink.rel = 'dns-prefetch';
    dnsPrefetchLink.href = 'https://maps.googleapis.com';
    document.head.appendChild(dnsPrefetchLink);
    
    script.onload = () => {
      isLoaded = true;
      isLoading = false;
      resolve();
    };
    
      script.onerror = () => {
        isLoading = false;
        reject(new Error('Failed to load Google Maps API. Please check your API key and ensure the required APIs are enabled.'));
      };

    // Add script to document
    document.head.appendChild(script);
  });

  return loadPromise;
};

export const isGoogleMapsLoaded = () => {
  return isLoaded && window.google && window.google.maps;
};

export const initializeGoogleMapsServices = () => {
  if (!servicesInitialized && isGoogleMapsLoaded()) {
    servicesInitialized = true;
    return true;
  }
  return servicesInitialized;
};
