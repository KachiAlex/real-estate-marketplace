import React, { useState, useEffect, useRef } from 'react';
import { FaMapMarkerAlt, FaTimes } from 'react-icons/fa';
import { loadGoogleMapsAPI, isGoogleMapsLoaded } from '../utils/googleMapsLoader';

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

  useEffect(() => {
    // Load Google Maps API and initialize services
    const initializeGoogleMaps = async () => {
      try {
        // You can set your API key here or use environment variable
        const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY';
        
        if (!isGoogleMapsLoaded()) {
          await loadGoogleMapsAPI(apiKey);
        }
        
        if (window.google && window.google.maps) {
          autocompleteService.current = new window.google.maps.places.AutocompleteService();
          placesService.current = new window.google.maps.places.PlacesService(
            document.createElement('div')
          );
        }
      } catch (error) {
        console.error('Failed to load Google Maps API:', error);
      }
    };

    initializeGoogleMaps();
  }, []);

  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    onChange(inputValue);
    
    if (inputValue.length > 2) {
      setIsLoading(true);
      getPlacePredictions(inputValue);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const getPlacePredictions = (input) => {
    if (!autocompleteService.current) return;

    const request = {
      input: input,
      types: ['address'],
      componentRestrictions: { country: 'ng' } // Restrict to Nigeria
    };

    autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
      setIsLoading(false);
      if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
        setSuggestions(predictions);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    });
  };

  const handleSuggestionClick = (suggestion) => {
    if (!placesService.current) return;

    const request = {
      placeId: suggestion.place_id,
      fields: ['formatted_address', 'geometry', 'address_components', 'url']
    };

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
  };

  const handleClearInput = () => {
    onChange('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleBlur = (e) => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(document.activeElement)) {
        setShowSuggestions(false);
      }
    }, 200);
  };

  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

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
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.place_id}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
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
