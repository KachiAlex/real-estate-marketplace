import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FaMapMarkerAlt, FaTimes } from 'react-icons/fa';
import { loadGoogleMapsAPI, isGoogleMapsLoaded, initializeGoogleMapsServices } from '../utils/googleMapsLoader';

const GoogleMapsAutocomplete = ({ 
  value, 
  onChange, 
  onPlaceSelect, 
  placeholder = "Enter address...",
  className = "",
  error = false
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const autocompleteService = useRef(null);
  const placesService = useRef(null);
  const debounceTimer = useRef(null);
  const requestId = useRef(0);
  
  // Cache for frequently used addresses
  const addressCache = useRef(new Map());
  const maxCacheSize = 50;

  useEffect(() => {
    // Initialize Google Maps services (API should already be preloaded)
    const initializeServices = () => {
      if (window.google && window.google.maps && initializeGoogleMapsServices()) {
        // Use the new AutocompleteSuggestion API instead of deprecated AutocompleteService
        if (window.google.maps.places.AutocompleteSuggestion) {
          autocompleteService.current = new window.google.maps.places.AutocompleteSuggestion();
        } else {
          // Fallback to AutocompleteService for backward compatibility
          autocompleteService.current = new window.google.maps.places.AutocompleteService();
        }
        
        // Use the new Place API instead of deprecated PlacesService
        if (window.google.maps.places.Place) {
          placesService.current = new window.google.maps.places.Place();
        } else {
          // Fallback to PlacesService for backward compatibility
          placesService.current = new window.google.maps.places.PlacesService(
            document.createElement('div')
          );
        }
      }
    };

    // Try to initialize immediately if already loaded
    if (isGoogleMapsLoaded()) {
      initializeServices();
    } else {
      // Fallback: load API if not already loaded
      const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY';
      loadGoogleMapsAPI(apiKey).then(initializeServices).catch(console.error);
    }
  }, []);

  // Optimized search with caching and debouncing
  const getPlacePredictionsOptimized = useCallback((input) => {
    const currentRequestId = ++requestId.current;
    
    // Check cache first
    const cacheKey = input.toLowerCase().trim();
    if (addressCache.current.has(cacheKey)) {
      const cachedResults = addressCache.current.get(cacheKey);
      setSuggestions(cachedResults);
      setShowSuggestions(true);
      setIsLoading(false);
      return;
    }

    if (!autocompleteService.current) {
      setIsLoading(false);
      return;
    }

    const request = {
      input: input,
      types: ['address'],
      componentRestrictions: { country: 'ng' }
    };

      // Use the new API if available, otherwise fallback to the old one
      if (autocompleteService.current.getPlacePredictions) {
        // Old API method
        autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
          // Only process if this is still the latest request
          if (currentRequestId !== requestId.current) return;
          
          setIsLoading(false);
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            // Cache the results
            if (addressCache.current.size >= maxCacheSize) {
              const firstKey = addressCache.current.keys().next().value;
              addressCache.current.delete(firstKey);
            }
            addressCache.current.set(cacheKey, predictions);
            
            setSuggestions(predictions);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        });
      } else if (autocompleteService.current.getSuggestions) {
        // New API method
        autocompleteService.current.getSuggestions(request).then((predictions) => {
          // Only process if this is still the latest request
          if (currentRequestId !== requestId.current) return;
          
          setIsLoading(false);
          if (predictions && predictions.length > 0) {
            // Cache the results
            if (addressCache.current.size >= maxCacheSize) {
              const firstKey = addressCache.current.keys().next().value;
              addressCache.current.delete(firstKey);
            }
            addressCache.current.set(cacheKey, predictions);
            
            setSuggestions(predictions);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        }).catch((error) => {
          console.error('Autocomplete error:', error);
          setIsLoading(false);
          setSuggestions([]);
          setShowSuggestions(false);
        });
      }
  }, []);

  const handleInputChange = useCallback((e) => {
    const inputValue = e.target.value;
    onChange(inputValue);
    
    // Clear previous debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    if (inputValue.length > 2) {
      setIsLoading(true);
      // Debounce the API call by 300ms
      debounceTimer.current = setTimeout(() => {
        getPlacePredictionsOptimized(inputValue);
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
    }
  }, [onChange, getPlacePredictionsOptimized]);

  // Optimized place selection with caching
  const handleSuggestionClick = useCallback((suggestion) => {
    if (!placesService.current) return;

    // Cancel any pending debounced requests
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    const request = {
      placeId: suggestion.place_id,
      fields: ['formatted_address', 'geometry', 'address_components', 'url']
    };

    // Use the new API if available, otherwise fallback to the old one
    if (placesService.current.getDetails) {
      // Old API method
      placesService.current.getDetails(request, (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          // Extract address components
          const addressComponents = place.address_components || [];
          const city = addressComponents.find(component => 
            component.types.includes('locality')
          )?.long_name || '';
          const state = addressComponents.find(component => 
            component.types.includes('administrative_area_level_1')
          )?.long_name || '';
          const zipCode = addressComponents.find(component => 
            component.types.includes('postal_code')
          )?.long_name || '';

          // Call the onPlaceSelect callback with all the data
          onPlaceSelect({
            address: place.formatted_address,
            city: city,
            state: state,
            zipCode: zipCode,
            coordinates: {
              latitude: place.geometry?.location?.lat(),
              longitude: place.geometry?.location?.lng()
            },
            googleMapsUrl: place.url || `https://www.google.com/maps/place/?q=place_id:${suggestion.place_id}`
          });

          // Update the input value
          onChange(place.formatted_address);
          setShowSuggestions(false);
          setSuggestions([]);
        }
      });
    } else if (placesService.current.fetchFields) {
      // New API method
      placesService.current.fetchFields(request).then((place) => {
        if (place) {
          // Extract address components
          const addressComponents = place.address_components || [];
          const city = addressComponents.find(component => 
            component.types.includes('locality')
          )?.long_name || '';
          const state = addressComponents.find(component => 
            component.types.includes('administrative_area_level_1')
          )?.long_name || '';
          const zipCode = addressComponents.find(component => 
            component.types.includes('postal_code')
          )?.long_name || '';

          // Call the onPlaceSelect callback with all the data
          onPlaceSelect({
            address: place.formatted_address,
            city: city,
            state: state,
            zipCode: zipCode,
            coordinates: {
              latitude: place.geometry?.location?.lat(),
              longitude: place.geometry?.location?.lng()
            },
            googleMapsUrl: place.url || `https://www.google.com/maps/place/?q=place_id:${suggestion.place_id}`
          });

          // Update the input value
          onChange(place.formatted_address);
          setShowSuggestions(false);
          setSuggestions([]);
        }
      }).catch((error) => {
        console.error('Place details error:', error);
      });
    }
  }, [onPlaceSelect, onChange]);


  const handleClearInput = useCallback(() => {
    // Clear debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    onChange('');
    setSuggestions([]);
    setShowSuggestions(false);
    setIsLoading(false);
    inputRef.current?.focus();
  }, [onChange]);

  const handleBlur = useCallback((e) => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(document.activeElement)) {
        setShowSuggestions(false);
      }
    }, 200);
  }, []);

  const handleFocus = useCallback(() => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  }, [suggestions.length]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          className={`w-full pl-12 pr-12 py-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
            error ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
          }`}
          placeholder={placeholder}
        />
        <FaMapMarkerAlt className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
        {value && (
          <button
            type="button"
            onClick={handleClearInput}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="text-sm" />
          </button>
        )}
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-xl shadow-lg z-50">
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Searching addresses...</p>
          </div>
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-xl shadow-lg z-50 max-h-60 overflow-y-auto"
        >
          {suggestions.slice(0, 8).map((suggestion) => (
            <button
              key={suggestion.place_id}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors focus:outline-none focus:bg-gray-50"
            >
              <div className="flex items-start space-x-3">
                <FaMapMarkerAlt className="text-blue-500 text-sm mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {suggestion.structured_formatting?.main_text || suggestion.description}
                  </p>
                  {suggestion.structured_formatting?.secondary_text && (
                    <p className="text-xs text-gray-500 truncate">
                      {suggestion.structured_formatting.secondary_text}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default GoogleMapsAutocomplete;
