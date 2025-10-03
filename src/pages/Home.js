import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProperty } from '../contexts/PropertyContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  FaMapMarkerAlt, 
  FaRulerCombined, 
  FaHeart, 
  FaShare, 
  FaArrowRight, 
  FaTimes,
  FaCheck,
  FaBuilding,
  FaChartLine,
  FaPlay,
  FaSort,
  FaBed,
  FaBath
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import HomeSections from '../components/HomeSections';
import BlogSection from '../components/BlogSection';

const Home = () => {
  const { properties, toggleFavorite } = useProperty();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState(new Set());
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('Lagos');
  const [selectedType, setSelectedType] = useState('Apartment');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [priceRange, setPriceRange] = useState([0, 100000000]);
  const [bedrooms, setBedrooms] = useState('2');
  const [bathrooms, setBathrooms] = useState('3');
  const [selectedAmenities, setSelectedAmenities] = useState([
    'Swimming Pool', 'Gym', '24/7 Security', 'Air Conditioning', 'Parking Space', 'WiFi', 'Furnished', 'Balcony'
  ]);
  const [propertyAge, setPropertyAge] = useState('New 0-5 yrs');
  const [sortBy, setSortBy] = useState('Most Relevant');
  const [showMoreAmenities, setShowMoreAmenities] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [propertiesPerPage] = useState(9);

  // Mock data for the properties shown in the screenshot
  const mockProperties = [
    {
      id: 1,
      title: "Luxury Apartment in Victoria Island",
      location: "Victoria Island, Lagos",
      price: 75000000,
      status: "For Sale",
      bedrooms: 3,
      bathrooms: 3,
      sqft: 175,
      description: "Stunning 3-bedroom apartment with city views, pool, and gym access.",
      image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop",
      label: "For Sale",
      labelColor: "bg-orange-500"
    },
    {
      id: 2,
      title: "Modern Family House in Lekki",
      location: "Lekki Phase 1, Lagos",
      price: 120000000,
      status: "For Sale",
      bedrooms: 4,
      bathrooms: 4,
      sqft: 250,
      description: "Spacious 4-bedroom house with modern kitchen, garden, and 24/7 security.",
      image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop",
      label: "For Sale",
      labelColor: "bg-orange-500"
    },
    {
      id: 3,
      title: "Penthouse with Ocean View in Ikoyi",
      location: "Ikoyi, Lagos",
      price: 95000000,
      status: "For Sale",
      bedrooms: 2,
      bathrooms: 3,
      sqft: 200,
      description: "Luxurious penthouse with panoramic ocean views and private terrace.",
      image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=300&fit=crop",
      label: "Shortlet",
      labelColor: "bg-blue-500"
    },
    {
      id: 4,
      title: "Elegant Townhouse in Maitama Island",
      location: "Maitama, Abuja",
      price: 75000000,
      status: "For Sale",
      bedrooms: 4,
      bathrooms: 3,
      sqft: 220,
      description: "Contemporary townhouse with private garden and modern amenities.",
      image: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=300&fit=crop",
      label: "New Development",
      labelColor: "bg-red-500"
    },
    {
      id: 5,
      title: "Garden View Apartment in Ikeja GRA",
      location: "Ikeja GRA, Lagos",
      price: 120000000,
      status: "For Sale",
      bedrooms: 2,
      bathrooms: 2,
      sqft: 150,
      description: "Beautiful apartment with lush garden views and modern kitchen.",
      image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop",
      label: "Hot Deals",
      labelColor: "bg-red-500"
    },
    {
      id: 6,
      title: "Beachfront Villa in Banana Island",
      location: "Banana Island, Lagos",
      price: 95000000,
      status: "For Sale",
      bedrooms: 5,
      bathrooms: 5,
      sqft: 400,
      description: "Exclusive beachfront villa with private pool and direct beach access.",
      image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop",
      label: "For Sale",
      labelColor: "bg-orange-500"
    },
    {
      id: 7,
      title: "Contemporary Apartment in Maryland",
      location: "Maryland, Lagos",
      price: 75000000,
      status: "For Sale",
      bedrooms: 3,
      bathrooms: 2,
      sqft: 180,
      description: "Modern apartment with open-plan living and city views.",
      image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop",
      label: "For Sale",
      labelColor: "bg-orange-500"
    },
    {
      id: 8,
      title: "Luxury Villa in Asokoro",
      location: "Asokoro, Abuja",
      price: 120000000,
      status: "For Sale",
      bedrooms: 5,
      bathrooms: 4,
      sqft: 350,
      description: "Spacious villa with swimming pool and landscaped garden.",
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop",
      label: "For Sale",
      labelColor: "bg-orange-500"
    },
    {
      id: 9,
      title: "Waterfront Condominium in Oniru",
      location: "Oniru, Lagos",
      price: 95000000,
      status: "For Sale",
      bedrooms: 3,
      bathrooms: 3,
      sqft: 200,
      description: "Luxury condominium with panoramic lagoon views and private marina.",
      image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=300&fit=crop",
      label: "For Sale",
      labelColor: "bg-orange-500"
    }
  ];

  // Enhanced Quick Filters with sublinks
  const quickFilters = {
    'All Properties': [],
    'For Sale': ['House', 'Apartment', 'Condo', 'Penthouse', 'Land', 'Villa', 'Townhouse'],
    'For Rent': ['Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Ibadan', 'Kaduna', 'Enugu', 'Aba'],
    'Shortlet': ['Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Calabar', 'Jos', 'Ibadan', 'Kaduna'],
    'New Developments': [],
    'Waterfront': [],
    'Luxury': [],
    'Blog': [],
    'Diasporan Services': ['Legal Services', 'Account & Book Keeping', 'Business Office for consultation']
  };

  // All Nigerian States
  const locations = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe', 'Imo', 'Jigawa', 
    'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 
    'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 
    'Zamfara', 'Abuja (FCT)'
  ];
  const propertyTypes = ['Apartment', 'House', 'Villa', 'Condo', 'Townhouse', 'Penthouse', 'Land'];
  const propertyStatuses = ['For Sale', 'For Rent', 'For Lease', 'Shortlet'];
  const amenities = [
    'Swimming Pool', 'Gym', '24/7 Security', 'Air Conditioning', 'Parking Space', 
    'WiFi', 'Furnished', 'Balcony', 'Garden', 'Terrace', 'Home Theater', 'Sauna'
  ];

  const handleAmenityToggle = (amenity) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity) 
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const removeFilter = (filterType, value) => {
    switch(filterType) {
      case 'location':
        setSelectedLocation('');
        break;
      case 'status':
        setSelectedStatus('');
        break;
      case 'type':
        setSelectedType('');
        break;
      case 'bedrooms':
        setBedrooms('');
        break;
    }
  };

  const handleResetAllFilters = () => {
    setSelectedLocation('');
    setSelectedStatus('');
    setSelectedType('');
    setBedrooms('');
    setBathrooms('');
    setPriceRange([0, 100000000]);
    setSearchQuery('');
    setActiveDropdown(null);
  };

  // Initialize filtered properties on component mount
  useEffect(() => {
    setFilteredProperties(mockProperties);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeDropdown && !event.target.closest('.dropdown-container')) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown]);
  
  // Calculate pagination
  const displayProperties = filteredProperties.length > 0 ? filteredProperties : mockProperties;
  const indexOfLastProperty = currentPage * propertiesPerPage;
  const indexOfFirstProperty = indexOfLastProperty - propertiesPerPage;
  const currentProperties = displayProperties.slice(indexOfFirstProperty, indexOfLastProperty);
  const totalPages = Math.ceil(displayProperties.length / propertiesPerPage);


  const handleApplyFilters = () => {
    let filtered = [...mockProperties];
    
    // Apply location filter
    if (selectedLocation) {
      filtered = filtered.filter(property => 
        property.location.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }
    
    // Apply property status filter
    if (selectedStatus) {
      filtered = filtered.filter(property => 
        property.status === selectedStatus || property.label === selectedStatus
      );
    }
    
    // Apply property type filter
    if (selectedType) {
      filtered = filtered.filter(property => 
        property.title.toLowerCase().includes(selectedType.toLowerCase())
      );
    }
    
    // Apply bedrooms filter
    if (bedrooms) {
      const bedroomCount = parseInt(bedrooms);
      filtered = filtered.filter(property => property.bedrooms >= bedroomCount);
    }
    
    // Apply bathrooms filter
    if (bathrooms) {
      const bathroomCount = parseInt(bathrooms);
      filtered = filtered.filter(property => property.bathrooms >= bathroomCount);
    }
    
    // Apply price range filter
    filtered = filtered.filter(property => 
      property.price >= priceRange[0] && property.price <= priceRange[1]
    );
    
    // Apply search query filter
    if (searchQuery) {
      filtered = filtered.filter(property => 
        property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredProperties(filtered);
    setCurrentPage(1);
    toast.success(`Found ${filtered.length} properties matching your criteria!`);
  };

  const handleGetStarted = () => {
    navigate('/register');
  };

  const handleLearnMore = () => {
    navigate('/about');
  };
  
  const handleToggleFavorite = (propertyId) => {
    if (!user) {
      toast.error('Please login to save properties to favorites');
      navigate('/login');
      return;
    }
    
    const newFavorites = new Set(favorites);
    if (newFavorites.has(propertyId)) {
      newFavorites.delete(propertyId);
      toast.success('Removed from favorites');
    } else {
      newFavorites.add(propertyId);
      toast.success('Added to favorites');
    }
    setFavorites(newFavorites);
    toggleFavorite(propertyId);
  };
  
  const handleShareProperty = async (property) => {
    const shareData = {
      title: property.title,
      text: `Check out this amazing property: ${property.title}`,
      url: `${window.location.origin}/property/${property.id}`
    };
    
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast.success('Property shared successfully!');
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast.success('Property link copied to clipboard!');
      }
    } catch (error) {
      toast.error('Failed to share property');
    }
  };
  
  
  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    let sorted = [...(filteredProperties.length > 0 ? filteredProperties : mockProperties)];
    
    switch (newSortBy) {
      case 'Price Low to High':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'Price High to Low':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'Newest':
        sorted.sort((a, b) => b.id - a.id);
        break;
      default:
        // Most Relevant - keep original order
        break;
    }
    
    setFilteredProperties(sorted);
    toast.success(`Sorted by ${newSortBy.toLowerCase()}`);
  };
  
  const handlePaginationClick = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      {/* Custom CSS for Range Slider */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .slider-thumb::-webkit-slider-thumb {
            appearance: none;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: linear-gradient(135deg, #f97316, #ea580c);
            cursor: grab;
            border: 3px solid #fff;
            box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.2);
            transition: all 0.2s ease;
          }
          
          .slider-thumb::-webkit-slider-thumb:hover {
            transform: scale(1.1);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4), 0 2px 6px rgba(0, 0, 0, 0.3);
          }
          
          .slider-thumb::-webkit-slider-thumb:active {
            cursor: grabbing;
            transform: scale(1.05);
          }
          
          .slider-thumb::-moz-range-thumb {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: linear-gradient(135deg, #f97316, #ea580c);
            cursor: grab;
            border: 3px solid #fff;
            box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.2);
            transition: all 0.2s ease;
          }
          
          .slider-thumb::-moz-range-thumb:hover {
            transform: scale(1.1);
          }
          
          .slider-thumb::-moz-range-thumb:active {
            cursor: grabbing;
            transform: scale(1.05);
          }
          
          .slider-thumb:focus {
            outline: none;
          }
          
          .slider-thumb:focus::-webkit-slider-thumb {
            box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.3), 0 3px 8px rgba(0, 0, 0, 0.3);
          }
          
          .slider-thumb:focus::-moz-range-thumb {
            box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.3), 0 3px 8px rgba(0, 0, 0, 0.3);
          }

          .slider-thumb::-webkit-slider-track {
            background: transparent;
          }
          
          .slider-thumb::-moz-range-track {
            background: transparent;
            border: none;
          }
        `
      }} />
      
      {/* Hero Section */}
      <div className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <p className="text-orange-500 text-sm font-medium mb-2">Discover Premium Listing</p>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Find Your Perfect Property in Nigeria
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Browse our curated collection of verified properties across Nigeria's most sought-after locations. 
              Explore luxury homes, apartments, and investment opportunities with confidence.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Menu Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-center space-x-8 py-4">
            {/* For Sale */}
            <div className="relative dropdown-container">
                <button
                onClick={() => setActiveDropdown(activeDropdown === 'For Sale' ? null : 'For Sale')}
                className={`flex items-center space-x-1 px-4 py-2 text-sm font-medium transition-colors hover:text-orange-600 ${
                  activeDropdown === 'For Sale' ? 'text-orange-600' : 'text-gray-700'
                }`}
              >
                <span>For Sale</span>
                <svg 
                  className={`w-4 h-4 transition-transform ${
                    activeDropdown === 'For Sale' ? 'rotate-180' : ''
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                </button>
              
              {activeDropdown === 'For Sale' && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-48">
                  <div className="py-2">
                    {quickFilters['For Sale'].map((item) => (
                      <Link
                        key={item}
                        to={`/properties?type=${encodeURIComponent(item)}&status=For Sale`}
                        onClick={() => setActiveDropdown(null)}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors text-gray-700"
                      >
                        {item}
                      </Link>
              ))}
            </div>
          </div>
              )}
            </div>

            {/* For Rent */}
            <div className="relative dropdown-container">
              <button
                onClick={() => setActiveDropdown(activeDropdown === 'For Rent' ? null : 'For Rent')}
                className={`flex items-center space-x-1 px-4 py-2 text-sm font-medium transition-colors hover:text-orange-600 ${
                  activeDropdown === 'For Rent' ? 'text-orange-600' : 'text-gray-700'
                }`}
              >
                <span>For Rent</span>
                <svg 
                  className={`w-4 h-4 transition-transform ${
                    activeDropdown === 'For Rent' ? 'rotate-180' : ''
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {activeDropdown === 'For Rent' && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-48">
                  <div className="py-2">
                    {quickFilters['For Rent'].map((location) => (
                      <Link
                        key={location}
                        to={`/properties?location=${encodeURIComponent(location)}&status=For Rent`}
                        onClick={() => setActiveDropdown(null)}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors text-gray-700"
                      >
                        {location}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Shortlet */}
            <div className="relative dropdown-container">
              <button
                onClick={() => setActiveDropdown(activeDropdown === 'Shortlet' ? null : 'Shortlet')}
                className={`flex items-center space-x-1 px-4 py-2 text-sm font-medium transition-colors hover:text-orange-600 ${
                  activeDropdown === 'Shortlet' ? 'text-orange-600' : 'text-gray-700'
                }`}
              >
                <span>Shortlet</span>
                <svg 
                  className={`w-4 h-4 transition-transform ${
                    activeDropdown === 'Shortlet' ? 'rotate-180' : ''
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {activeDropdown === 'Shortlet' && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-48">
                  <div className="py-2">
                    {quickFilters['Shortlet'].map((location) => (
                      <Link
                        key={location}
                        to={`/properties?location=${encodeURIComponent(location)}&status=Shortlet`}
                        onClick={() => setActiveDropdown(null)}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors text-gray-700"
                      >
                        {location}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Blog */}
            <Link
              to="/blog"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors"
            >
              Blog
            </Link>

            {/* Diasporan Services */}
            <div className="relative dropdown-container">
              <button
                onClick={() => setActiveDropdown(activeDropdown === 'Diasporan Services' ? null : 'Diasporan Services')}
                className={`flex items-center space-x-1 px-4 py-2 text-sm font-medium transition-colors hover:text-orange-600 ${
                  activeDropdown === 'Diasporan Services' ? 'text-orange-600' : 'text-gray-700'
                }`}
              >
                <span>Diasporan Services</span>
                <svg 
                  className={`w-4 h-4 transition-transform ${
                    activeDropdown === 'Diasporan Services' ? 'rotate-180' : ''
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {activeDropdown === 'Diasporan Services' && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-48">
                  <div className="py-2">
                    {quickFilters['Diasporan Services'].map((service) => (
                      <button
                        key={service}
                        onClick={() => {
                          toast.info(`${service} - Coming soon!`);
                          setActiveDropdown(null);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors text-gray-700"
                      >
                        {service}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <div className="w-80 bg-gray-800 text-white rounded-lg p-6 h-fit">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Property Filters</h3>
              <button 
                onClick={handleResetAllFilters}
                className="text-sm text-gray-300 hover:text-white"
              >
                Reset All
              </button>
            </div>

            {/* Active Filters */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {selectedLocation && (
                  <span className="flex items-center bg-orange-500 text-white px-3 py-1 rounded-full text-sm">
                    {selectedLocation} <FaTimes className="ml-2 cursor-pointer" onClick={() => removeFilter('location')} />
                  </span>
                )}
                {selectedStatus && (
                  <span className="flex items-center bg-orange-500 text-white px-3 py-1 rounded-full text-sm">
                    {selectedStatus} <FaTimes className="ml-2 cursor-pointer" onClick={() => removeFilter('status')} />
                  </span>
                )}
                {selectedType && (
                  <span className="flex items-center bg-orange-500 text-white px-3 py-1 rounded-full text-sm">
                    {selectedType} <FaTimes className="ml-2 cursor-pointer" onClick={() => removeFilter('type')} />
                  </span>
                )}
                {bedrooms && (
                  <span className="flex items-center bg-orange-500 text-white px-3 py-1 rounded-full text-sm">
                    {bedrooms} Bedrooms <FaTimes className="ml-2 cursor-pointer" onClick={() => removeFilter('bedrooms')} />
                  </span>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Location</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {locations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>

            {/* Property Status */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Property Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Status</option>
                {propertyStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {/* Property Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Property Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Types</option>
                {propertyTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Price Range (₦)</label>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={priceRange[0].toLocaleString()}
                    onChange={(e) => {
                      const inputValue = e.target.value.replace(/,/g, '');
                      if (inputValue === '') {
                        setPriceRange([0, priceRange[1]]);
                        return;
                      }
                      const value = parseInt(inputValue) || 0;
                      // Allow any minimum value - no restrictions
                      setPriceRange([value, priceRange[1]]);
                    }}
                    onBlur={(e) => {
                      const inputValue = e.target.value.replace(/,/g, '');
                      if (inputValue === '') {
                        setPriceRange([0, priceRange[1]]);
                        return;
                      }
                      const value = parseInt(inputValue) || 0;
                      // Only ensure non-negative values, no upper limit restriction
                      const clampedValue = Math.max(0, value);
                      setPriceRange([clampedValue, priceRange[1]]);
                    }}
                    className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Min Price (Any amount)"
                  />
                  <input
                    type="text"
                    value={priceRange[1].toLocaleString()}
                    onChange={(e) => {
                      const inputValue = e.target.value.replace(/,/g, '');
                      if (inputValue === '') {
                        setPriceRange([priceRange[0], 1000000000]); // Default to 1B if empty
                        return;
                      }
                      const value = parseInt(inputValue) || 200000000;
                      // Allow any maximum value - no restrictions
                      setPriceRange([priceRange[0], value]);
                    }}
                    onBlur={(e) => {
                      const inputValue = e.target.value.replace(/,/g, '');
                      if (inputValue === '') {
                        setPriceRange([priceRange[0], 1000000000]);
                        return;
                      }
                      const value = parseInt(inputValue) || 200000000;
                      // Only ensure it's not less than minimum
                      const clampedValue = Math.max(value, priceRange[0]);
                      setPriceRange([priceRange[0], clampedValue]);
                    }}
                    className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Max Price (Any amount)"
                  />
                </div>
                
                {/* Interactive Range Slider */}
                <div className="relative">
                  <div className="relative h-2 bg-gray-600 rounded-full">
                    <div 
                      className="absolute h-2 bg-orange-500 rounded-full"
                      style={{
                        left: `${Math.min((priceRange[0] / Math.max(priceRange[1], 200000000)) * 100, 95)}%`,
                        width: `${Math.max(((priceRange[1] - priceRange[0]) / Math.max(priceRange[1], 200000000)) * 100, 5)}%`
                      }}
                    ></div>
                    <input
                      type="range"
                      min="0"
                      max={Math.max(priceRange[1], 200000000)}
                      step="500000"
                      value={priceRange[0]}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        // Allow any minimum value without restriction
                        setPriceRange([value, priceRange[1]]);
                      }}
                      className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer slider-thumb"
                      style={{ zIndex: 2 }}
                    />
                    <input
                      type="range"
                      min="0"
                      max={Math.max(priceRange[1], 200000000)}
                      step="500000"
                      value={priceRange[1]}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        // Allow any maximum value without restriction
                        setPriceRange([priceRange[0], value]);
                      }}
                      className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer slider-thumb"
                      style={{ zIndex: 3 }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-300 mt-2">
                    <span>₦0</span>
                    <span className="text-orange-500 font-medium bg-gray-800 px-2 py-1 rounded">
                      ₦{priceRange[0].toLocaleString()} - ₦{priceRange[1].toLocaleString()}
                    </span>
                    <span>₦{Math.max(priceRange[1], 200000000).toLocaleString()}+</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1 text-center">
                    Drag the slider handles or type any amount in the input fields above
                  </div>
                </div>
              </div>
            </div>

            {/* Bedrooms */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Bedrooms</label>
              <select
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Any</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5+">5+</option>
              </select>
            </div>

            {/* Bathrooms */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Bathrooms</label>
              <select
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Any</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5+">5+</option>
              </select>
            </div>

            {/* Amenities */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">Amenities</label>
              <div className="space-y-2">
                {amenities.slice(0, showMoreAmenities ? amenities.length : 8).map((amenity) => (
                  <label key={amenity} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedAmenities.includes(amenity)}
                      onChange={() => handleAmenityToggle(amenity)}
                      className="w-4 h-4 text-orange-500 bg-gray-700 border-gray-600 rounded focus:ring-orange-500"
                    />
                    <span className="ml-2 text-sm">{amenity}</span>
                  </label>
                ))}
                {!showMoreAmenities && (
                  <button
                    onClick={() => setShowMoreAmenities(true)}
                    className="text-orange-500 text-sm hover:text-orange-400"
                  >
                    + Show more amenities
                  </button>
                )}
              </div>
            </div>

            {/* Property Age */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">Property Age</label>
              <div className="flex space-x-2">
                {['Any Age', 'New 0-5 yrs', '5-10 yrs Age'].map((age) => (
                  <button
                    key={age}
                    onClick={() => setPropertyAge(age)}
                    className={`px-3 py-2 rounded-full text-sm transition-colors ${
                      propertyAge === age
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {age}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="space-y-3">
              <button 
                onClick={handleApplyFilters}
                className="w-full bg-orange-500 text-white py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors"
              >
                Apply Filters
              </button>
              <button 
                onClick={handleResetAllFilters}
                className="w-full bg-transparent border border-gray-600 text-gray-300 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Property Listings */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-700">{displayProperties.length} properties found</p>
              <div className="flex items-center space-x-2">
                <FaSort className="text-gray-400" title="Sort properties" />
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  title="Sort properties by preference"
                >
                  <option value="Most Relevant">Most Relevant</option>
                  <option value="Price Low to High">Price Low to High</option>
                  <option value="Price High to Low">Price High to Low</option>
                  <option value="Newest">Newest</option>
                </select>
              </div>
            </div>

            {/* Property Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentProperties.map((property) => (
                <div key={property.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <img
                      src={property.image}
                      alt={property.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <span className={`px-2 py-1 text-xs font-medium text-white rounded ${property.labelColor}`}>
                        {property.label}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3 flex space-x-2">
                      <button 
                        onClick={() => handleToggleFavorite(property.id)}
                        className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors"
                        title={favorites.has(property.id) ? "Remove from favorites" : "Add to favorites"}
                      >
                        <FaHeart className={`text-sm transition-colors ${
                          favorites.has(property.id) ? 'text-red-500' : 'text-gray-400'
                        }`} />
                      </button>
                      <button 
                        onClick={() => handleShareProperty(property)}
                        className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors"
                        title="Share property"
                      >
                        <FaShare className="text-gray-400 text-sm hover:text-blue-500 transition-colors" />
                      </button>
                    </div>
                    <div className="absolute bottom-3 left-3">
                      <span className="text-2xl font-bold text-white">
                        ₦{property.price.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">{property.title}</h3>
                    <div className="flex items-center text-gray-600 text-sm mb-2">
                      <FaMapMarkerAlt className="mr-1" />
                      <span>{property.location}</span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{property.description}</p>
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <FaBed className="mr-1" />
                          {property.bedrooms} Beds
                        </span>
                        <span className="flex items-center">
                          <FaBath className="mr-1" />
                          {property.bathrooms} Baths
                        </span>
                        <span className="flex items-center">
                          <FaRulerCombined className="mr-1" />
                          {property.sqft}m²
                        </span>
                      </div>
                    </div>
                    <Link
                      to={`/property/${property.id}`}
                      className="flex items-center justify-center w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition-colors"
                      title={`View details for ${property.title}`}
                    >
                      View Details
                      <FaArrowRight className="ml-2 text-sm" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center mt-8 space-x-2">
                <button 
                  onClick={() => handlePaginationClick(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Previous page"
                >
                  &lt;
                </button>
                
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pageNumber = i + 1;
                  return (
                    <button 
                      key={pageNumber}
                      onClick={() => handlePaginationClick(pageNumber)}
                      className={`px-3 py-2 rounded-lg ${
                        currentPage === pageNumber
                          ? 'bg-orange-500 text-white'
                          : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                      title={`Go to page ${pageNumber}`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                
                {totalPages > 5 && (
                  <>
                    <span className="px-3 py-2 text-gray-600">...</span>
                    <button 
                      onClick={() => handlePaginationClick(totalPages)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                      title={`Go to page ${totalPages}`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
                
                <button 
                  onClick={() => handlePaginationClick(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Next page"
                >
                  &gt;
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Premium Property Discovery Section */}
      <div className="bg-brand-blue text-white py-16 mt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Experience Premium Property Discovery</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Naija Luxury Homes offers exclusive features to enhance your property search. 
              Our advanced tools help you find, evaluate, and secure your dream property with confidence.
            </p>
          </div>

          <div className="flex justify-center">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="bg-white bg-opacity-10 rounded-lg p-6 text-center">
                <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaPlay className="text-2xl text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Virtual Tours</h3>
                <p className="text-gray-300 mb-4">
                  Experience immersive 3D tours of properties from the comfort of your home. 
                  Get a realistic feel of spaces before visiting in person.
                </p>
                <button 
                  onClick={handleLearnMore}
                  className="text-yellow-400 hover:text-yellow-300 font-medium"
                >
                  Learn More →
                </button>
              </div>

              <div className="bg-white bg-opacity-10 rounded-lg p-6 text-center">
                <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaCheck className="text-2xl text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Verified Properties</h3>
                <p className="text-gray-300 mb-4">
                  Every property is verified by our expert team for authenticity and legal compliance. 
                  Buy with confidence knowing all details are accurate.
                </p>
                <button 
                  onClick={handleLearnMore}
                  className="text-yellow-400 hover:text-yellow-300 font-medium"
                >
                  Learn More →
                </button>
              </div>

              <div className="bg-white bg-opacity-10 rounded-lg p-6 text-center">
                <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaChartLine className="text-2xl text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Market Insights</h3>
                <p className="text-gray-300 mb-4">
                  Access detailed market analysis and investment reports. 
                  Make informed decisions with comprehensive property data and trends.
                </p>
                <button 
                  onClick={handleLearnMore}
                  className="text-yellow-400 hover:text-yellow-300 font-medium"
                >
                  Learn More →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Home Sections - Agents and Property Categories */}
      <HomeSections />

      {/* Blog Section */}
      <BlogSection />

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-brand-orange rounded-lg flex items-center justify-center">
                  <FaBuilding className="text-white text-xl" />
                </div>
                <span className="text-2xl font-bold">Naija Luxury Homes</span>
              </div>
              <p className="text-gray-400 mb-6">
                Your trusted partner in finding premium properties across Nigeria. 
                We connect you with verified luxury homes, apartments, and investment opportunities.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-brand-orange transition-colors">
                  <span className="text-sm font-bold">f</span>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-brand-orange transition-colors">
                  <span className="text-sm font-bold">t</span>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-brand-orange transition-colors">
                  <span className="text-sm font-bold">in</span>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-brand-orange transition-colors">
                  <span className="text-sm font-bold">ig</span>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-3">
                <li><Link to="/properties" className="text-gray-400 hover:text-white transition-colors">Browse Properties</Link></li>
                <li><Link to="/mortgage" className="text-gray-400 hover:text-white transition-colors">Mortgage Calculator</Link></li>
                <li><Link to="/investment" className="text-gray-400 hover:text-white transition-colors">Investment Opportunities</Link></li>
                <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/help" className="text-gray-400 hover:text-white transition-colors">Help & Support</Link></li>
              </ul>
            </div>

            {/* Property Types */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Property Types</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Luxury Apartments</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Family Houses</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Penthouses</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Beachfront Villas</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Commercial Properties</a></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <FaMapMarkerAlt className="text-brand-orange mt-1" />
                  <div>
                    <p className="text-gray-400">123 Victoria Island</p>
                    <p className="text-gray-400">Lagos, Nigeria</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-brand-orange">📞</span>
                  <p className="text-gray-400">+234 800 123 4567</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-brand-orange">✉️</span>
                  <p className="text-gray-400">info@naijaluxuryhomes.com</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-brand-orange">🕒</span>
                  <p className="text-gray-400">Mon - Fri: 9:00 AM - 6:00 PM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                © 2024 Naija Luxury Homes. All rights reserved.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</a>
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</a>
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
      
    </div>
  );
};

export default Home;