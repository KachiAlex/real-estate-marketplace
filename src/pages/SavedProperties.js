import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProperty } from '../contexts/PropertyContext';
import { FaHeart, FaShare, FaBed, FaBath, FaRuler, FaMapMarkerAlt, FaTrash, FaEye, FaPhone, FaEnvelope, FaFilter, FaSort, FaShoppingCart, FaCalendar } from 'react-icons/fa';
import toast from 'react-hot-toast';

const SavedProperties = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { properties = [], toggleFavorite } = useProperty();
  const [savedProperties, setSavedProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('dateAdded');
  const [filterBy, setFilterBy] = useState('all');

  // Load saved properties from localStorage and match with actual property data
  const loadSavedProperties = useCallback(() => {
    if (!user) {
      setSavedProperties([]);
      setLoading(false);
      return;
    }

    try {
      // Get saved property IDs from localStorage
      const key = `favorites_${user.id}`;
      const savedFavoriteIds = JSON.parse(localStorage.getItem(key) || '[]');
      
      if (!Array.isArray(savedFavoriteIds) || savedFavoriteIds.length === 0) {
        setSavedProperties([]);
        setLoading(false);
        return;
      }

      // Match saved IDs with actual properties
      const matchedProperties = savedFavoriteIds
        .map(favoriteId => {
          // Try to find property by different ID formats
          const property = properties.find(p => 
            p.id === favoriteId || 
            p.id?.toString() === favoriteId?.toString() ||
            p.propertyId === favoriteId ||
            p.propertyId?.toString() === favoriteId?.toString()
          );
          
          if (property) {
            // Transform property to match SavedProperties format
            return {
              id: property.id || property.propertyId || favoriteId,
              title: property.title || 'Untitled Property',
              location: typeof property.location === 'string' 
                ? property.location 
                : property.location?.address 
                  ? `${property.location.address}${property.location.city ? ', ' + property.location.city : ''}${property.location.state ? ', ' + property.location.state : ''}`
                  : property.city && property.state 
                    ? `${property.city}, ${property.state}`
                    : property.city || property.state || 'Location not specified',
              price: property.price || 0,
              bedrooms: property.bedrooms || property.details?.bedrooms || 0,
              bathrooms: property.bathrooms || property.details?.bathrooms || 0,
              area: property.area || property.details?.sqft || property.sqft || 0,
              image: property.image || property.images?.[0]?.url || property.images?.[0] || 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop',
              dateAdded: property.dateAdded || property.createdAt || new Date().toISOString().split('T')[0],
              status: property.status || property.listingType || 'available',
              type: property.type || 'sale',
              agent: property.agent || property.owner || {
                name: property.vendorName || 'Property Agent',
                phone: property.vendorPhone || property.contactPhone || '+234-XXX-XXXX',
                email: property.vendorEmail || property.contactEmail || 'agent@example.com'
              }
            };
          }
          return null;
        })
        .filter(Boolean); // Remove null entries

      setSavedProperties(matchedProperties);
      setLoading(false);
    } catch (error) {
      console.error('Error loading saved properties:', error);
      setSavedProperties([]);
      setLoading(false);
    }
  }, [user, properties]);

  // Fetch properties if not already loaded
  useEffect(() => {
    if (properties.length === 0 && user) {
      // Properties will be loaded by PropertyProvider, just wait
    }
  }, [properties.length, user]);

  // Load saved properties when user or properties change
  useEffect(() => {
    loadSavedProperties();
  }, [loadSavedProperties]);

  // Listen for storage changes (when properties are saved/removed from other tabs/pages)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === `favorites_${user?.id}`) {
        loadSavedProperties();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events (for same-tab updates)
    const handleFavoriteChange = () => {
      loadSavedProperties();
    };
    
    window.addEventListener('favoritesUpdated', handleFavoriteChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('favoritesUpdated', handleFavoriteChange);
    };
  }, [user, loadSavedProperties]);

  const handleRemoveFromSaved = async (propertyId) => {
    if (!user) {
      toast.error('Please login to manage saved properties');
      navigate('/login');
      return;
    }

    try {
      // Remove from localStorage using toggleFavorite
      const result = await toggleFavorite(propertyId);
      
      if (result && result.success) {
        // Reload saved properties to reflect the change
        loadSavedProperties();
        toast.success('Property removed from saved list');
      } else {
        toast.error('Failed to remove property');
      }
    } catch (error) {
      console.error('Error removing property:', error);
      toast.error('Failed to remove property');
    }
  };

  const handleBuyProperty = (property) => {
    if (!user) {
      toast.error('Please login to purchase properties');
      navigate('/login');
      return;
    }
    
    if (property.status === 'sold') {
      toast.error('This property has already been sold');
      return;
    }
    
    // Navigate to escrow process for purchase
    navigate(`/escrow/create?propertyId=${property.id}&type=purchase`);
  };

  const handleScheduleViewing = (property) => {
    if (!user) {
      toast.error('Please login to schedule viewings');
      navigate('/login');
      return;
    }
    
    // Create viewing request data
    const viewingRequest = {
      id: `viewing-${Date.now()}`,
      propertyId: property.id,
      propertyTitle: property.title,
      propertyLocation: property.location,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      preferredDate: null,
      preferredTime: null,
      message: '',
      agentContact: property.agent || {
        name: 'Property Agent',
        phone: '+234-XXX-XXXX',
        email: 'agent@example.com'
      }
    };
    
    // Store in localStorage for demo
    const existingRequests = JSON.parse(localStorage.getItem('viewingRequests') || '[]');
    existingRequests.push(viewingRequest);
    localStorage.setItem('viewingRequests', JSON.stringify(existingRequests));
    
    toast.success(`Viewing request sent for "${property.title}"! The agent will contact you within 24 hours.`);
    
    // Show additional info
    setTimeout(() => {
      toast.info(`Agent: ${viewingRequest.agentContact.name} | Phone: ${viewingRequest.agentContact.phone}`);
    }, 2000);
  };

  const handleContactAgent = (property) => {
    console.log('Contact Agent clicked, property:', property, 'user:', user);
    
    if (!user) {
      toast.error('Please login to contact agents');
      navigate('/login');
      return;
    }
    
    // Get agent's phone number
    const agentPhone = property?.agent?.phone || property?.owner?.phone || property?.vendorPhone || property?.contactPhone;
    
    if (!agentPhone) {
      toast.error('Agent phone number not available');
      return;
    }
    
    // Initiate phone call
    window.location.href = `tel:${agentPhone}`;
    
    // In a real app, this would open a contact form or messaging system
    setTimeout(() => {
      toast.info(`Agent contact information sent to your email. You can also call ${property.agent?.phone || '+234-XXX-XXXX'} for immediate assistance.`);
    }, 2000);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const handleFilterChange = (e) => {
    setFilterBy(e.target.value);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'sold': return 'bg-red-100 text-red-800';
      case 'rented': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'available': return 'Available';
      case 'sold': return 'Sold';
      case 'rented': return 'Rented';
      default: return 'Unknown';
    }
  };

  const filteredAndSortedProperties = savedProperties
    .filter(property => {
      if (filterBy === 'all') return true;
      if (filterBy === 'available') return property.status === 'available';
      if (filterBy === 'sold') return property.status === 'sold';
      if (filterBy === 'rented') return property.status === 'rented';
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'priceHigh':
          const priceA = parseFloat(a.price) || 0;
          const priceB = parseFloat(b.price) || 0;
          return priceB - priceA;
        case 'priceLow':
          const priceALow = parseFloat(a.price) || 0;
          const priceBLow = parseFloat(b.price) || 0;
          return priceALow - priceBLow;
        case 'dateAdded':
          const dateA = a.dateAdded ? new Date(a.dateAdded) : new Date(0);
          const dateB = b.dateAdded ? new Date(b.dateAdded) : new Date(0);
          const timeA = isNaN(dateA.getTime()) ? 0 : dateA.getTime();
          const timeB = isNaN(dateB.getTime()) ? 0 : dateB.getTime();
          return timeB - timeA; // Newest first
        case 'bedrooms':
          const bedroomsA = parseInt(a.bedrooms) || 0;
          const bedroomsB = parseInt(b.bedrooms) || 0;
          return bedroomsB - bedroomsA;
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Saved Properties</h1>
        <p className="text-gray-600">
          Manage your saved properties and track their availability status
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FaHeart className="text-brand-blue text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Saved</p>
              <p className="text-2xl font-bold text-gray-900">{savedProperties.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <FaEye className="text-green-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Available</p>
              <p className="text-2xl font-bold text-gray-900">
                {savedProperties.filter(p => p.status === 'available').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <FaTrash className="text-red-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Sold/Rented</p>
              <p className="text-2xl font-bold text-gray-900">
                {savedProperties.filter(p => p.status === 'sold' || p.status === 'rented').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <FaMapMarkerAlt className="text-brand-orange text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Locations</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(savedProperties.map(p => {
                  if (typeof p.location === 'string') {
                    const parts = p.location.split(',');
                    return parts[parts.length > 1 ? 1 : 0]?.trim() || p.location;
                  }
                  return p.location || 'Unknown';
                })).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="bg-white rounded-lg shadow p-6 mb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center space-x-2">
              <FaFilter className="text-gray-500" />
              <select
                value={filterBy}
                onChange={handleFilterChange}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue focus:border-transparent"
              >
                <option value="all">All Properties</option>
                <option value="available">Available</option>
                <option value="sold">Sold</option>
                <option value="rented">Rented</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <FaSort className="text-gray-500" />
              <select
                value={sortBy}
                onChange={handleSortChange}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue focus:border-transparent"
              >
                <option value="dateAdded">Date Added</option>
                <option value="priceHigh">Price: High to Low</option>
                <option value="priceLow">Price: Low to High</option>
                <option value="bedrooms">Bedrooms</option>
              </select>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            Showing {filteredAndSortedProperties.length} of {savedProperties.length} properties
          </div>
        </div>
      </div>

      {/* Properties Grid */}
      {filteredAndSortedProperties.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FaHeart className="text-gray-300 text-6xl mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Saved Properties</h3>
          <p className="text-gray-600 mb-6">
            {filterBy === 'all' 
              ? "You haven't saved any properties yet. Start browsing to save your favorites!"
              : `No ${filterBy} properties found in your saved list.`
            }
          </p>
          <Link 
            to="/properties" 
            className="btn-primary inline-flex items-center"
          >
            Browse Properties
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedProperties.map((property) => (
            <div key={property.id} className="property-card">
              <div className="relative">
                <Link 
                  to={`/property/${property.id}`}
                  className="block cursor-pointer"
                >
                  <img
                    src={property.image}
                    alt={property.title}
                    className="property-card-image"
                  />
                </Link>
                <div className="absolute top-2 left-2">
                  <span className={`tag ${getStatusColor(property.status)}`}>
                    {getStatusLabel(property.status)}
                  </span>
                </div>
                <div className="absolute top-2 right-2 flex space-x-2 z-10">
                  <button 
                    onClick={async (e) => {
                      e.stopPropagation();
                      const url = `${window.location.origin}/property/${property.id}`;
                      try {
                        if (navigator.share) {
                          await navigator.share({ title: property.title, text: property.title, url });
                        } else {
                          await navigator.clipboard.writeText(url);
                          toast.success('Link copied');
                        }
                      } catch (e) {}
                    }}
                    className="text-white bg-black bg-opacity-50 p-1 rounded hover:bg-opacity-70 transition-all">
                    <FaShare className="text-sm" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFromSaved(property.id);
                    }}
                    className="text-white bg-red-500 bg-opacity-80 p-1 rounded hover:bg-opacity-100 transition-all"
                  >
                    <FaTrash className="text-sm" />
                  </button>
                </div>
              </div>
              
              <Link 
                to={`/property/${property.id}`}
                className="block property-card-content cursor-pointer"
              >
                <div className="property-price">
                  ₦{property.price.toLocaleString()}
                  {property.type === 'rent' && <span className="text-sm text-gray-500">/month</span>}
                </div>
                <h3 className="property-title">{property.title}</h3>
                <p className="property-location">
                  <FaMapMarkerAlt className="mr-1" />
                  {property.location}
                </p>
                
                <div className="property-features">
                  <div className="flex items-center space-x-1">
                    <FaBed />
                    <span>{property.bedrooms} Bedrooms</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FaBath />
                    <span>{property.bathrooms} Bathrooms</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FaRuler />
                    <span>{property.area}m²</span>
                  </div>
                </div>
              </Link>

              <div className="mt-4 pt-4 border-t border-gray-200 px-4 pb-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                    <span>Added: {new Date(property.dateAdded).toLocaleDateString()}</span>
                    <span>Agent: {property.agent.name}</span>
                  </div>
                  
                  <div className="space-y-2">
                    {/* Primary action based on property type and status */}
                    {property.type === 'sale' && property.status === 'available' && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBuyProperty(property);
                        }}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                      >
                        <FaShoppingCart className="mr-2" />
                        Buy Property - ₦{property.price.toLocaleString()}
                      </button>
                    )}
                    
                    {property.type === 'rent' && property.status === 'available' && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBuyProperty(property);
                        }}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                      >
                        <FaShoppingCart className="mr-2" />
                        Rent Property - ₦{property.price.toLocaleString()}/month
                      </button>
                    )}
                    
                    {property.status === 'sold' && (
                      <div className="w-full bg-red-100 text-red-800 py-2 px-4 rounded-lg text-center">
                        Property Sold
                      </div>
                    )}
                    
                    {property.status === 'rented' && (
                      <div className="w-full bg-blue-100 text-blue-800 py-2 px-4 rounded-lg text-center">
                        Property Rented
                      </div>
                    )}
                    
                    {/* Secondary actions */}
                    <div className="flex space-x-2">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/property/${property.id}`);
                        }}
                        className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-center cursor-pointer"
                      >
                        View Details
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleScheduleViewing(property);
                        }}
                        className="flex-1 bg-orange-100 text-orange-700 py-2 px-4 rounded-lg hover:bg-orange-200 transition-colors flex items-center justify-center"
                      >
                        <FaCalendar className="mr-1" />
                        Schedule Viewing
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContactAgent(property);
                        }}
                        className="flex-1 bg-blue-100 text-blue-700 py-2 px-4 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center"
                      >
                        <FaPhone className="mr-1" />
                        Contact Agent
                      </button>
                    </div>
                  </div>
                </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedProperties;

