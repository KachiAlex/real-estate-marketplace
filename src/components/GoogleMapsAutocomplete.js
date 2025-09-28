import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FaMapMarkerAlt, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
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
  const [isGoogleMapsAvailable, setIsGoogleMapsAvailable] = useState(true);
  const [memorySuggestions, setMemorySuggestions] = useState([]);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const autocompleteService = useRef(null);
  const placesService = useRef(null);
  const debounceTimer = useRef(null);
  const requestId = useRef(0);
  
  // Cache for frequently used addresses
  const addressCache = useRef(new Map());
  const maxCacheSize = 50;

  // Address memory management
  const getAddressMemory = () => {
    try {
      const stored = localStorage.getItem('addressMemory');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading address memory:', error);
      return [];
    }
  };

  const saveAddressToMemory = (address) => {
    try {
      const memory = getAddressMemory();
      const newMemory = [
        { address, timestamp: Date.now() },
        ...memory.filter(item => item.address !== address)
      ].slice(0, 10); // Keep only last 10 addresses
      
      localStorage.setItem('addressMemory', JSON.stringify(newMemory));
      return newMemory;
    } catch (error) {
      console.error('Error saving address to memory:', error);
      return [];
    }
  };

  const getMemorySuggestions = (input) => {
    if (!input || input.length < 2) return [];
    
    const memory = getAddressMemory();
    return memory
      .filter(item => 
        item.address.toLowerCase().includes(input.toLowerCase())
      )
      .slice(0, 5); // Show max 5 memory suggestions
  };

  useEffect(() => {
    // Initialize Google Maps services (API should already be preloaded)
    const initializeServices = () => {
      if (window.google && window.google.maps && initializeGoogleMapsServices()) {
        // Check if places API is available
        if (window.google.maps.places) {
          // Use the new AutocompleteSuggestion API if available, otherwise fallback
          if (window.google.maps.places.AutocompleteSuggestion) {
            try {
              autocompleteService.current = new window.google.maps.places.AutocompleteSuggestion();
            } catch (error) {
              console.log('AutocompleteSuggestion not available, using AutocompleteService');
              autocompleteService.current = new window.google.maps.places.AutocompleteService();
            }
          } else {
            // Fallback to AutocompleteService for backward compatibility
            autocompleteService.current = new window.google.maps.places.AutocompleteService();
          }
          
          // Use the new Place API if available, otherwise fallback
          if (window.google.maps.places.Place) {
            try {
              placesService.current = new window.google.maps.places.Place();
            } catch (error) {
              console.log('Place API not available, using PlacesService');
              placesService.current = new window.google.maps.places.PlacesService(
                document.createElement('div')
              );
            }
          } else {
            // Fallback to PlacesService for backward compatibility
            placesService.current = new window.google.maps.places.PlacesService(
              document.createElement('div')
            );
          }
        } else {
          console.error('Google Maps Places API not available');
        }
      }
    };

    // Try to initialize immediately if already loaded
    if (isGoogleMapsLoaded()) {
      initializeServices();
    } else {
      // Fallback: load API if not already loaded
      const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY';
      
      // Only attempt to load if we have a real API key
      if (apiKey && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY') {
        loadGoogleMapsAPI(apiKey).then(initializeServices).catch((error) => {
          console.error('Failed to load Google Maps API:', error);
          // Set a flag to disable autocomplete functionality
          autocompleteService.current = null;
          placesService.current = null;
          setIsGoogleMapsAvailable(false);
        });
      } else {
        // Silently disable autocomplete without console warning
        // Set a flag to disable autocomplete functionality
        autocompleteService.current = null;
        placesService.current = null;
        setIsGoogleMapsAvailable(false);
      }
    }
  }, []);

  // Optimized search with caching and debouncing
  const getPlacePredictionsOptimized = useCallback((input) => {
    const currentRequestId = ++requestId.current;
    
    // Get memory suggestions first
    const memorySuggestions = getMemorySuggestions(input);
    setMemorySuggestions(memorySuggestions);
    
    // Check cache first
    const cacheKey = input.toLowerCase().trim();
    if (addressCache.current.has(cacheKey)) {
      const cachedResults = addressCache.current.get(cacheKey);
      setSuggestions(cachedResults);
      setShowSuggestions(true);
      setIsLoading(false);
      return;
    }

    // Check if services are available
    if (!autocompleteService.current || !window.google?.maps?.places) {
        // Silently handle unavailable Google Maps services
      setIsLoading(false);
      setSuggestions([]);
      setShowSuggestions(memorySuggestions.length > 0);
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

  // Save address to memory when user finishes typing (on blur)
  const handleInputBlur = useCallback((e) => {
    const inputValue = e.target.value.trim();
    if (inputValue.length > 5) { // Only save meaningful addresses
      saveAddressToMemory(inputValue);
    }
    // Defer hiding suggestions using local logic to avoid referencing before init
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(document.activeElement)) {
        setShowSuggestions(false);
      }
    }, 200);
  }, []);

  // Optimized place selection with caching
  const handleSuggestionClick = useCallback((suggestion) => {
    if (!placesService.current || !window.google?.maps?.places) {
      console.warn('Google Maps places service not available');
      return;
    }

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

          // Save to address memory
          saveAddressToMemory(place.formatted_address);

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

          // Save to address memory
          saveAddressToMemory(place.formatted_address);

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


  const handleMemorySuggestionClick = useCallback((memorySuggestion) => {
    // Clear debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Update the input value
    onChange(memorySuggestion.address);
    
    // Call the onPlaceSelect callback with the memory data
    onPlaceSelect({
      address: memorySuggestion.address,
      city: '',
      state: '',
      zipCode: '',
      coordinates: {
        latitude: null,
        longitude: null
      },
      googleMapsUrl: ''
    });

    setShowSuggestions(false);
    setSuggestions([]);
    setMemorySuggestions([]);
  }, [onChange, onPlaceSelect]);

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
            onBlur={handleInputBlur}
            onFocus={handleFocus}
          className={`w-full pl-12 pr-12 py-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
            error ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
          }`}
          placeholder={isGoogleMapsAvailable ? placeholder : "Enter address manually (autocomplete disabled)"}
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

        {/* Google Maps not available message */}
        {!isGoogleMapsAvailable && (
          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-700">
              <FaExclamationTriangle className="inline mr-1" />
              Google Maps autocomplete is disabled. Please enter the address manually.
            </p>
          </div>
        )}

        {/* Suggestions dropdown */}
        {(showSuggestions && (suggestions.length > 0 || memorySuggestions.length > 0)) && (
        <div 
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-xl shadow-lg z-50 max-h-60 overflow-y-auto"
        >
          {/* Memory Suggestions */}
          {memorySuggestions.length > 0 && (
            <>
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Recent Addresses</p>
              </div>
              {memorySuggestions.map((memorySuggestion, index) => (
                <button
                  key={`memory-${index}`}
                  type="button"
                  onClick={() => handleMemorySuggestionClick(memorySuggestion)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors focus:outline-none focus:bg-gray-50"
                >
                  <div className="flex items-start space-x-3">
                    <FaMapMarkerAlt className="text-green-500 text-sm mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {memorySuggestion.address}
                      </p>
                      <p className="text-xs text-gray-500">
                        Previously used
                      </p>
                    </div>
                  </div>
                </button>
              ))}
              {suggestions.length > 0 && (
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Google Maps Suggestions</p>
                </div>
              )}
            </>
          )}
          
          {/* Google Maps Suggestions */}
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
