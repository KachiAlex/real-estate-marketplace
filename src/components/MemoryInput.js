import React, { useCallback, useMemo, useState } from 'react';
import { FaHistory, FaTimes } from 'react-icons/fa';

const MemoryInput = ({
  value,
  onChange,
  placeholder = '',
  className = '',
  error = false,
  fieldKey, // unique storage key per field, e.g., 'title', 'price'
  type = 'text',
  min,
  max,
  step,
  multiline = false,
  rows = 4,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const storageKey = useMemo(() => `memory_${fieldKey}`, [fieldKey]);

  const getMemory = useCallback(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, [storageKey]);

  const filteredSuggestions = useMemo(() => {
    if (!value || value.toString().length < 1) return [];
    const memory = getMemory();
    const lower = value.toString().toLowerCase();
    return memory
      .filter((m) => m?.v?.toString().toLowerCase().includes(lower))
      .slice(0, 6);
  }, [value, getMemory]);

  const saveToMemory = useCallback(
    (val) => {
      const trimmed = (val ?? '').toString().trim();
      if (!trimmed) return;
      try {
        const memory = getMemory();
        const newList = [
          { v: trimmed, t: Date.now() },
          ...memory.filter((m) => m?.v !== trimmed),
        ].slice(0, 12);
        localStorage.setItem(storageKey, JSON.stringify(newList));
      } catch {
        // ignore
      }
    },
    [getMemory, storageKey]
  );

  const handleBlur = useCallback(() => {
    saveToMemory(value);
    setTimeout(() => setShowSuggestions(false), 200);
  }, [saveToMemory, value]);

  const handleFocus = useCallback(() => {
    if (filteredSuggestions.length > 0) setShowSuggestions(true);
  }, [filteredSuggestions.length]);

  const handleSelect = useCallback(
    (suggestion) => {
      onChange(suggestion.v);
      setShowSuggestions(false);
    },
    [onChange]
  );

  const clearMemory = useCallback(() => {
    localStorage.removeItem(storageKey);
    setShowSuggestions(false);
  }, [storageKey]);

  const commonProps = {
    value,
    onChange: (e) => onChange(e.target.value),
    onBlur: handleBlur,
    onFocus: handleFocus,
    placeholder,
    className:
      `w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
        error ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
      } ${className}`,
  };

  return (
    <div className="relative">
      <div className="relative">
        {multiline ? (
          <textarea rows={rows} {...commonProps} />
        ) : (
          <input type={type} min={min} max={max} step={step} {...commonProps} />
        )}

        {getMemory().length > 0 && (
          <button
            type="button"
            onClick={clearMemory}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
            title="Clear history"
          >
            <FaTimes className="h-4 w-4" />
          </button>
        )}
      </div>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-xl shadow-lg z-50 max-h-60 overflow-y-auto">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center text-xs text-gray-600 uppercase tracking-wide">
            <FaHistory className="mr-2" /> Recent entries
          </div>
          {filteredSuggestions.map((s, idx) => (
            <button
              key={`${storageKey}-${idx}`}
              type="button"
              onClick={() => handleSelect(s)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
            >
              {s.v}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MemoryInput;


