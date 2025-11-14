import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaTimes, FaBuilding, FaChartLine, FaUser, FaMapMarkerAlt } from 'react-icons/fa';
import { useProperty } from '../contexts/PropertyContext';
import { useInvestment } from '../contexts/InvestmentContext';
import { useAuth } from '../contexts/AuthContext';

const GlobalSearch = ({ isOpen, onClose, onResultClick }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // all, properties, investments, users
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  const { searchProperties } = useProperty();
  const { searchInvestments } = useInvestment();
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    const performSearch = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const searchResults = {
          properties: [],
          investments: [],
          users: []
        };

        // Search properties
        if (activeTab === 'all' || activeTab === 'properties') {
          const propertyResults = searchProperties(query, {});
          searchResults.properties = propertyResults.slice(0, 5); // Limit to 5 results
        }

        // Search investments
        if (activeTab === 'all' || activeTab === 'investments') {
          const investmentResults = searchInvestments(query, {});
          searchResults.investments = investmentResults.slice(0, 5); // Limit to 5 results
        }

        // Search users (mock data for now)
        if (activeTab === 'all' || activeTab === 'users') {
          const mockUsers = [
            { id: '1', name: 'John Doe', email: 'john@example.com', role: 'buyer', avatar: null },
            { id: '2', name: 'Admin User', email: 'admin@propertyark.com', role: 'admin', avatar: null },
            { id: '3', name: 'Onyedikachi Akoma', email: 'onyedikachi@example.com', role: 'vendor', avatar: null }
          ];
          
          searchResults.users = mockUsers.filter(user => 
            user.name.toLowerCase().includes(query.toLowerCase()) ||
            user.email.toLowerCase().includes(query.toLowerCase())
          ).slice(0, 5);
        }

        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
        setResults({ properties: [], investments: [], users: [] });
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, activeTab, searchProperties, searchInvestments]);

  const handleResultClick = (type, item) => {
    onResultClick(type, item);
    onClose();
  };

  const getResultIcon = (type) => {
    switch (type) {
      case 'property':
        return <FaBuilding className="text-blue-500" />;
      case 'investment':
        return <FaChartLine className="text-green-500" />;
      case 'user':
        return <FaUser className="text-purple-500" />;
      default:
        return <FaSearch className="text-gray-500" />;
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const totalResults = results.properties.length + results.investments.length + results.users.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
      <div ref={searchRef} className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
        {/* Search Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <FaSearch className="text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search properties, investments, users..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 outline-none text-lg"
            />
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FaTimes className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Search Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { key: 'all', label: 'All', count: totalResults },
            { key: 'properties', label: 'Properties', count: results.properties.length },
            { key: 'investments', label: 'Investments', count: results.investments.length },
            { key: 'users', label: 'Users', count: results.users.length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label} {tab.count > 0 && `(${tab.count})`}
            </button>
          ))}
        </div>

        {/* Search Results */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-500">Searching...</p>
            </div>
          ) : query.trim() ? (
            <div className="p-4">
              {/* Properties Results */}
              {(activeTab === 'all' || activeTab === 'properties') && results.properties.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <FaBuilding className="mr-2" />
                    Properties ({results.properties.length})
                  </h3>
                  <div className="space-y-2">
                    {results.properties.map(property => (
                      <div
                        key={property.id}
                        onClick={() => handleResultClick('property', property)}
                        className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                            {property.images?.[0] ? (
                              <img
                                src={property.images[0]}
                                alt={property.title}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <FaBuilding className="text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">{property.title}</h4>
                            <p className="text-sm text-gray-500 flex items-center">
                              <FaMapMarkerAlt className="mr-1" />
                              {property.location?.address || property.address}
                            </p>
                            <p className="text-sm font-semibold text-blue-600">
                              {formatPrice(property.price)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Investments Results */}
              {(activeTab === 'all' || activeTab === 'investments') && results.investments.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <FaChartLine className="mr-2" />
                    Investments ({results.investments.length})
                  </h3>
                  <div className="space-y-2">
                    {results.investments.map(investment => (
                      <div
                        key={investment.id}
                        onClick={() => handleResultClick('investment', investment)}
                        className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                            {investment.images?.[0] ? (
                              <img
                                src={investment.images[0]}
                                alt={investment.title}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <FaChartLine className="text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">{investment.title}</h4>
                            <p className="text-sm text-gray-500 flex items-center">
                              <FaMapMarkerAlt className="mr-1" />
                              {investment.location?.city}, {investment.location?.state}
                            </p>
                            <div className="flex items-center space-x-4 text-sm">
                              <span className="text-green-600 font-semibold">
                                {investment.expectedReturn}% ROI
                              </span>
                              <span className="text-gray-500">
                                Min: {formatPrice(investment.minimumInvestment)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Users Results */}
              {(activeTab === 'all' || activeTab === 'users') && results.users.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <FaUser className="mr-2" />
                    Users ({results.users.length})
                  </h3>
                  <div className="space-y-2">
                    {results.users.map(user => (
                      <div
                        key={user.id}
                        onClick={() => handleResultClick('user', user)}
                        className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-full h-full object-cover rounded-full"
                              />
                            ) : (
                              <FaUser className="text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900">{user.name}</h4>
                            <p className="text-sm text-gray-500">{user.email}</p>
                            <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                              {user.role}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results */}
              {totalResults === 0 && (
                <div className="text-center py-8">
                  <FaSearch className="mx-auto text-gray-300 text-4xl mb-3" />
                  <p className="text-gray-500">No results found for "{query}"</p>
                  <p className="text-sm text-gray-400 mt-1">Try different keywords or check spelling</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center">
              <FaSearch className="mx-auto text-gray-300 text-4xl mb-3" />
              <p className="text-gray-500">Start typing to search...</p>
              <p className="text-sm text-gray-400 mt-1">Search across properties, investments, and users</p>
            </div>
          )}
        </div>

        {/* Search Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <span>Press <kbd className="px-2 py-1 bg-white border border-gray-300 rounded">Esc</kbd> to close</span>
            </div>
            <div>
              {totalResults > 0 && (
                <span>{totalResults} result{totalResults !== 1 ? 's' : ''} found</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;

