import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaHeart, FaShare, FaBed, FaBath, FaRuler, FaMapMarkerAlt, FaTrash, FaEye, FaPhone, FaEnvelope, FaFilter, FaSort } from 'react-icons/fa';

const SavedProperties = () => {
  const { user } = useAuth();
  const [savedProperties, setSavedProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('dateAdded');
  const [filterBy, setFilterBy] = useState('all');

  // Mock saved properties data
  useEffect(() => {
    const mockSavedProperties = [
      {
        id: 1,
        title: "Luxury 4-Bedroom Villa in Victoria Island",
        location: "Victoria Island, Lagos",
        price: 250000000,
        bedrooms: 4,
        bathrooms: 5,
        area: 450,
        image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=500&h=300&fit=crop",
        dateAdded: "2024-01-15",
        status: "available",
        type: "sale",
        agent: {
          name: "Sarah Johnson",
          phone: "+234 801 234 5678",
          email: "sarah@naijaluxury.com"
        }
      },
      {
        id: 2,
        title: "Modern 3-Bedroom Apartment in Ikoyi",
        location: "Ikoyi, Lagos",
        price: 180000000,
        bedrooms: 3,
        bathrooms: 3,
        area: 320,
        image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=500&h=300&fit=crop",
        dateAdded: "2024-01-10",
        status: "available",
        type: "sale",
        agent: {
          name: "Michael Adebayo",
          phone: "+234 802 345 6789",
          email: "michael@naijaluxury.com"
        }
      },
      {
        id: 3,
        title: "Elegant 2-Bedroom Penthouse in Lekki",
        location: "Lekki Phase 1, Lagos",
        price: 120000000,
        bedrooms: 2,
        bathrooms: 2,
        area: 280,
        image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500&h=300&fit=crop",
        dateAdded: "2024-01-08",
        status: "sold",
        type: "sale",
        agent: {
          name: "Grace Okafor",
          phone: "+234 803 456 7890",
          email: "grace@naijaluxury.com"
        }
      },
      {
        id: 4,
        title: "Spacious 5-Bedroom Duplex in Abuja",
        location: "Asokoro, Abuja",
        price: 320000000,
        bedrooms: 5,
        bathrooms: 6,
        area: 580,
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&h=300&fit=crop",
        dateAdded: "2024-01-05",
        status: "available",
        type: "sale",
        agent: {
          name: "David Okonkwo",
          phone: "+234 804 567 8901",
          email: "david@naijaluxury.com"
        }
      },
      {
        id: 5,
        title: "Contemporary 3-Bedroom Townhouse",
        location: "GRA, Port Harcourt",
        price: 95000000,
        bedrooms: 3,
        bathrooms: 3,
        area: 350,
        image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=500&h=300&fit=crop",
        dateAdded: "2024-01-03",
        status: "rented",
        type: "rent",
        agent: {
          name: "Blessing Nwosu",
          phone: "+234 805 678 9012",
          email: "blessing@naijaluxury.com"
        }
      }
    ];

    setTimeout(() => {
      setSavedProperties(mockSavedProperties);
      setLoading(false);
    }, 1000);
  }, []);

  const handleRemoveFromSaved = (propertyId) => {
    setSavedProperties(prev => prev.filter(property => property.id !== propertyId));
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
          return b.price - a.price;
        case 'priceLow':
          return a.price - b.price;
        case 'dateAdded':
          return new Date(b.dateAdded) - new Date(a.dateAdded);
        case 'bedrooms':
          return b.bedrooms - a.bedrooms;
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Saved Properties</h1>
        <p className="text-gray-600">
          Manage your saved properties and track their availability status
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                {new Set(savedProperties.map(p => p.location.split(',')[1]?.trim())).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
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
                <img
                  src={property.image}
                  alt={property.title}
                  className="property-card-image"
                />
                <div className="absolute top-2 left-2">
                  <span className={`tag ${getStatusColor(property.status)}`}>
                    {getStatusLabel(property.status)}
                  </span>
                </div>
                <div className="absolute top-2 right-2 flex space-x-2">
                  <button className="text-white bg-black bg-opacity-50 p-1 rounded hover:bg-opacity-70 transition-all">
                    <FaShare className="text-sm" />
                  </button>
                  <button 
                    onClick={() => handleRemoveFromSaved(property.id)}
                    className="text-white bg-red-500 bg-opacity-80 p-1 rounded hover:bg-opacity-100 transition-all"
                  >
                    <FaTrash className="text-sm" />
                  </button>
                </div>
              </div>
              
              <div className="property-card-content">
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

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                    <span>Added: {new Date(property.dateAdded).toLocaleDateString()}</span>
                    <span>Agent: {property.agent.name}</span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Link
                      to={`/property/${property.id}`}
                      className="flex-1 btn-outline text-center py-2"
                    >
                      View Details
                    </Link>
                    <button className="flex-1 btn-primary py-2">
                      <FaPhone className="inline mr-1" />
                      Contact
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
