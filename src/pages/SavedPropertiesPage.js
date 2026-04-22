import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHeart, FaMapMarkerAlt, FaBed, FaBath, FaRulerCombined, FaFilter, FaSort } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useFavorites } from '../hooks/useFavorites';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/currency';
import LazyImage from '../components/LazyImage';

/**
 * SavedPropertiesPage Component
 * Displays user's favorite/saved properties with filtering and sorting
 */
const SavedPropertiesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { favorites, loading, fetchFavorites, removeFavorite } = useFavorites();

  // Filter and sort state
  const [filteredFavorites, setFilteredFavorites] = useState([]);
  const [sortBy, setSortBy] = useState('savedAt');
  const [filterType, setFilterType] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [priceRange, setPriceRange] = useState([0, 1000000000]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);

  // Fetch favorites on mount
  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      navigate('/auth/login');
    }
  }, [user, fetchFavorites, navigate]);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...favorites];

    // Filter by type
    if (filterType) {
      filtered = filtered.filter(fav => fav.propertyType?.toLowerCase() === filterType.toLowerCase());
    }

    // Filter by location
    if (filterLocation) {
      filtered = filtered.filter(fav => 
        fav.location?.toLowerCase().includes(filterLocation.toLowerCase()) ||
        fav.city?.toLowerCase().includes(filterLocation.toLowerCase())
      );
    }

    // Filter by price range
    filtered = filtered.filter(fav => {
      const price = fav.price || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Sort
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-high':
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.savedAt) - new Date(b.savedAt));
        break;
      default:
        filtered.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
    }

    setFilteredFavorites(filtered);
    setCurrentPage(1);
  }, [favorites, sortBy, filterType, filterLocation, priceRange]);

  // Pagination
  const totalPages = Math.ceil(filteredFavorites.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedFavorites = filteredFavorites.slice(startIndex, startIndex + itemsPerPage);

  const handleRemoveFavorite = async (propertyId) => {
    const success = await removeFavorite(propertyId);
    if (success) {
      toast.success('Removed from favorites');
    }
  };

  const handleViewDetails = (propertyId) => {
    navigate(`/property/${propertyId}`);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please login to view your saved properties</p>
          <button
            onClick={() => navigate('/auth/login')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Saved Properties</h1>
          <p className="text-gray-600">
            {filteredFavorites.length} property{filteredFavorites.length !== 1 ? 'ies' : ''} saved
          </p>
        </div>

        {/* Filters and Sort */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaSort className="inline mr-2" />
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="savedAt">Recently Saved</option>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>

            {/* Property Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaFilter className="inline mr-2" />
                Property Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="commercial">Commercial</option>
                <option value="villa">Villa</option>
                <option value="townhouse">Townhouse</option>
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaMapMarkerAlt className="inline mr-2" />
                Location
              </label>
              <input
                type="text"
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                placeholder="Search location..."
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Min Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Min Price</label>
              <input
                type="number"
                value={priceRange[0]}
                onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Max Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Price</label>
              <input
                type="number"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 1000000000])}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Properties Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : paginatedFavorites.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FaHeart className="text-4xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Saved Properties</h3>
            <p className="text-gray-600 mb-6">
              {filteredFavorites.length === 0 && favorites.length === 0
                ? "You haven't saved any properties yet. Start exploring!"
                : 'No properties match your filters.'}
            </p>
            <button
              onClick={() => navigate('/properties')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Browse Properties
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedFavorites.map((favorite) => (
                <div key={favorite.favoriteId} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Image */}
                  <div className="relative h-48 bg-gray-200 overflow-hidden group">
                    <LazyImage
                      src={favorite.image}
                      alt={favorite.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      onClick={() => handleRemoveFavorite(favorite.propertyId)}
                      className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
                      title="Remove from favorites"
                    >
                      <FaHeart className="text-red-500" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                      {favorite.title}
                    </h3>

                    {/* Location */}
                    <div className="flex items-center text-gray-600 mb-3">
                      <FaMapMarkerAlt className="mr-2 text-blue-600" />
                      <span className="text-sm line-clamp-1">{favorite.location}</span>
                    </div>

                    {/* Price - Mobile optimized */}
                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 mb-3 truncate">
                      {formatCurrency(favorite.price)}
                    </div>

                    {/* Details */}
                    <div className="flex gap-4 mb-4 text-sm text-gray-600">
                      {favorite.bedrooms !== undefined && (
                        <div className="flex items-center">
                          <FaBed className="mr-1" />
                          {favorite.bedrooms} Bed
                        </div>
                      )}
                      {favorite.bathrooms !== undefined && (
                        <div className="flex items-center">
                          <FaBath className="mr-1" />
                          {favorite.bathrooms} Bath
                        </div>
                      )}
                      {favorite.area && (
                        <div className="flex items-center">
                          <FaRulerCombined className="mr-1" />
                          {favorite.area} sqft
                        </div>
                      )}
                    </div>

                    {/* Status Badge */}
                    {favorite.status && (
                      <div className="mb-4">
                        <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                          {favorite.status}
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <button
                      onClick={() => handleViewDetails(favorite.propertyId)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-lg ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SavedPropertiesPage;
