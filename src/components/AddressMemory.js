import React, { useState, useEffect, useCallback } from 'react';
import { FaMapMarkerAlt, FaHistory, FaTimes } from 'react-icons/fa';

const AddressMemory = ({ 
  value, 
  onChange, 
  placeholder = "Enter address...",
  className = "",
  error = false,
  fieldType = "address" // address, city, state, zipCode, etc.
}) => {
  const [memorySuggestions, setMemorySuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputRef, setInputRef] = useState(null);

  // Address memory management
  const getAddressMemory = useCallback(() => {
    try {
      const stored = localStorage.getItem(`addressMemory_${fieldType}`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error(`Error loading address memory for ${fieldType}:`, error);
      return [];
    }
  }, [fieldType]);

  const saveAddressToMemory = useCallback((address) => {
    if (!address || address.trim().length < 3) return;
    
    try {
      const memory = getAddressMemory();
      const newMemory = [
        { address: address.trim(), timestamp: Date.now() },
        ...memory.filter(item => item.address !== address.trim())
      ].slice(0, 10); // Keep only last 10 addresses
      
      localStorage.setItem(`addressMemory_${fieldType}`, JSON.stringify(newMemory));
      return newMemory;
    } catch (error) {
      console.error(`Error saving address to memory for ${fieldType}:`, error);
      return [];
    }
  }, [fieldType, getAddressMemory]);

  const getMemorySuggestions = useCallback((input) => {
    if (!input || input.length < 2) return [];
    
    const memory = getAddressMemory();
    return memory
      .filter(item => 
        item.address.toLowerCase().includes(input.toLowerCase())
      )
      .slice(0, 5); // Show max 5 memory suggestions
  }, [getAddressMemory]);

  const handleInputChange = useCallback((e) => {
    const inputValue = e.target.value;
    onChange(inputValue);
    
    // Get memory suggestions
    const suggestions = getMemorySuggestions(inputValue);
    setMemorySuggestions(suggestions);
    setShowSuggestions(suggestions.length > 0);
  }, [onChange, getMemorySuggestions]);

  const handleMemorySuggestionClick = useCallback((memorySuggestion) => {
    onChange(memorySuggestion.address);
    setShowSuggestions(false);
    setMemorySuggestions([]);
  }, [onChange]);

  const handleInputBlur = useCallback((e) => {
    const inputValue = e.target.value.trim();
    if (inputValue.length > 2) {
      saveAddressToMemory(inputValue);
    }
    
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  }, [saveAddressToMemory]);

  const handleInputFocus = useCallback(() => {
    if (memorySuggestions.length > 0) {
      setShowSuggestions(true);
    }
  }, [memorySuggestions.length]);

  const clearMemory = useCallback(() => {
    try {
      localStorage.removeItem(`addressMemory_${fieldType}`);
      setMemorySuggestions([]);
      setShowSuggestions(false);
    } catch (error) {
      console.error(`Error clearing memory for ${fieldType}:`, error);
    }
  }, [fieldType]);

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={setInputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={handleInputFocus}
          className={`w-full pl-12 pr-10 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
            error ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
          } ${className}`}
          placeholder={placeholder}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${fieldType}-error` : undefined}
        />
        <FaMapMarkerAlt className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
        
        {/* Clear memory button */}
        {getAddressMemory().length > 0 && (
          <button
            type="button"
            onClick={clearMemory}
            className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
            title="Clear address history"
          >
            <FaTimes className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Memory Suggestions */}
      {showSuggestions && memorySuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-xl shadow-lg z-50 max-h-60 overflow-y-auto">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center">
              <FaHistory className="mr-1" />
              Recent {fieldType} entries
            </p>
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
        </div>
      )}
    </div>
  );
};

export default AddressMemory;
