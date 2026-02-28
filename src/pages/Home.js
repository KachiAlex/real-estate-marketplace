import React, { useState, useEffect, useMemo } from 'react';
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
  FaEye,
  FaSort,
  FaBed,
  FaBath,
  FaShieldAlt,
  FaLock,
  FaFileContract,
  FaHandshake,
  FaClock,
  FaCertificate,
  FaUsers,
  FaMobileAlt,
  FaPhone,
  FaEnvelope
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import HomeSections from '../components/HomeSections';
import StaticHeroBanner from '../components/StaticHeroBanner';
import RegisterModal from '../components/auth/RegisterModal';
import SEO from '../components/SEO';
import frontendMockProperties from '../data/mockProperties';

const mockProperties = Array.isArray(frontendMockProperties) ? frontendMockProperties : [];

const Home = () => {
  const { properties = [], fetchProperties, toggleFavorite } = useProperty();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState(new Set());
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  // Pending filters (what user is selecting)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [priceRange, setPriceRange] = useState([0, 1000000000]);
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);
  
  // Applied filters (what actually filters the properties)
  const [appliedSearchQuery, setAppliedSearchQuery] = useState('');
  const [appliedLocation, setAppliedLocation] = useState('');
  const [appliedType, setAppliedType] = useState('');
  const [appliedStatus, setAppliedStatus] = useState('');
  const [appliedPriceRange, setAppliedPriceRange] = useState([0, 1000000000]);
  const [appliedBedrooms, setAppliedBedrooms] = useState('');
  const [appliedBathrooms, setAppliedBathrooms] = useState('');
  const [appliedVendor, setAppliedVendor] = useState('');

  // Fetch properties on mount
  useEffect(() => {
    fetchProperties({}).catch(err => {
      console.warn('Error fetching properties on mount:', err);
    });
  }, [fetchProperties]);

  // Load favorites from localStorage
  useEffect(() => {
    if (user) {
      const key = `favorites_${user.id}`;
      const savedFavorites = JSON.parse(localStorage.getItem(key) || '[]');
      setFavorites(new Set(savedFavorites));
    } else {
      setFavorites(new Set());
    }
  }, [user]);
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [propertyAge, setPropertyAge] = useState('Any Age');
  const [sortBy, setSortBy] = useState('Most Relevant');
  const [showMoreAmenities, setShowMoreAmenities] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [propertiesPerPage] = useState(9);
  const [selectedVendor, setSelectedVendor] = useState('');
  
  // Filtering - only applies when user clicks "Apply Filters"
  const filteredProperties = useMemo(() => {
    // Merge properties from context with mock properties
    // Properties from context (Firestore + localStorage) take precedence
    const allPropertiesMap = new Map();
    
    // First add mock properties
    if (Array.isArray(frontendMockProperties)) {
      frontendMockProperties.forEach(prop => {
        allPropertiesMap.set(prop.id, prop);
      });
    }
    
    // Then add/override with properties from context
    if (Array.isArray(properties)) {
      properties.forEach(prop => {
        allPropertiesMap.set(prop.id, prop);
      });
    }
    
    let filtered = Array.from(allPropertiesMap.values());
    
    // Apply search query (from applied filters)
    if (appliedSearchQuery && appliedSearchQuery.trim()) {
      const query = appliedSearchQuery.toLowerCase();
      filtered = filtered.filter(property => 
        property?.title?.toLowerCase().includes(query) ||
        property?.description?.toLowerCase().includes(query) ||
        property?.location?.toLowerCase().includes(query) ||
        property?.address?.toLowerCase().includes(query)
      );
    }
    
    // Apply location filter (from applied filters) - optimized for precise matching
    if (appliedLocation) {
      const searchLocation = appliedLocation.toLowerCase().trim();
      filtered = filtered.filter(property => {
        // Priority 1: Check city field (most reliable)
        const city = property?.city?.toLowerCase() || 
                     (property?.location?.city && typeof property.location === 'object' ? property.location.city.toLowerCase() : '') || '';
        if (city === searchLocation) {
          return true;
        }
        
        // Priority 2: Check state field
        const state = property?.state?.toLowerCase() || 
                      (property?.location?.state && typeof property.location === 'object' ? property.location.state.toLowerCase() : '') || '';
        if (state === searchLocation) {
          return true;
        }
        
        // Priority 3: Check string location field (for mock data format: "Address, City, State")
        if (property?.location && typeof property.location === 'string') {
          const locationString = property.location.toLowerCase();
          // Split by comma and check each part
          const locationParts = locationString.split(',').map(part => part.trim());
          // Check if any part exactly matches the search location
          if (locationParts.includes(searchLocation)) {
            return true;
          }
          // Also check if the location string ends with the search term (common pattern)
          if (locationString.endsWith(searchLocation) || locationString.endsWith(`, ${searchLocation}`)) {
            return true;
          }
        }
        
        // Priority 4: Check if location object has city or state that matches
        if (property?.location && typeof property.location === 'object') {
          const objCity = property.location.city?.toLowerCase() || '';
          const objState = property.location.state?.toLowerCase() || '';
          if (objCity === searchLocation || objState === searchLocation) {
            return true;
          }
        }
        
        return false;
      });
    }
    
    // Apply property status filter (from applied filters)
    if (appliedStatus) {
      filtered = filtered.filter(property => 
        property?.status === appliedStatus || property?.label === appliedStatus
      );
    }
    
    // Apply property type filter (from applied filters)
    if (appliedType) {
      filtered = filtered.filter(property => 
        property?.type === appliedType
      );
    }
    
    // Apply bedrooms filter (from applied filters)
    if (appliedBedrooms) {
      const bedroomCount = parseInt(appliedBedrooms);
      if (!isNaN(bedroomCount)) {
        filtered = filtered.filter(property => (property?.bedrooms || 0) >= bedroomCount);
      }
    }
    
    // Apply bathrooms filter (from applied filters)
    if (appliedBathrooms) {
      const bathroomCount = parseInt(appliedBathrooms);
      if (!isNaN(bathroomCount)) {
        filtered = filtered.filter(property => (property?.bathrooms || 0) >= bathroomCount);
      }
    }
    
    // Apply price range filter (from applied filters)
    if (Array.isArray(appliedPriceRange) && appliedPriceRange.length === 2) {
      filtered = filtered.filter(property => {
        const price = property?.price || 0;
        return price >= appliedPriceRange[0] && price <= appliedPriceRange[1];
      });
    }
    
    // Apply vendor filter (from applied filters) - supports name, email, vendorCode like VND-XXXXXX, and vendorId
    if (appliedVendor) {
      const searchTerm = appliedVendor.toLowerCase().trim();
      filtered = filtered.filter(property => {
        // Try multiple vendor identification fields
        const vendorName = (property?.vendorName || property?.agent?.name || 
          (property?.owner ? `${property.owner.firstName || ''} ${property.owner.lastName || ''}`.trim() : '') ||
          (property?.owner?.name || '')).toLowerCase();
        const vendorId = (property?.vendorId || property?.ownerId || property?.owner?.id || '').toLowerCase();
        const vendorCode = (property?.vendorCode || property?.owner?.vendorCode || '').toLowerCase();
        const vendorEmail = (property?.vendorEmail || property?.ownerEmail || property?.owner?.email || '').toLowerCase();
        
        // Handle vendorCode search (e.g., "VND-E88234" or "E88234")
        let vendorCodeMatches = false;
        if (vendorCode) {
          const normalizedVendorCode = vendorCode.toLowerCase().trim();
          const normalizedSearchTerm = searchTerm.toLowerCase().trim();
          const codePart = normalizedVendorCode.replace(/^vnd-/, '');
          const searchPart = normalizedSearchTerm.replace(/^vnd-/, '');
          vendorCodeMatches = normalizedVendorCode === normalizedSearchTerm || 
                              codePart === searchPart ||
                              codePart.includes(searchPart) ||
                              normalizedVendorCode.includes(normalizedSearchTerm);
        }
        
        return vendorName.includes(searchTerm) ||
               vendorId.includes(searchTerm) ||
               vendorCodeMatches ||
               vendorEmail.includes(searchTerm);
      });
    }
    
    // Apply sorting
    let sorted = [...filtered];
    switch (sortBy) {
      case 'Price Low to High':
        sorted.sort((a, b) => {
          const priceA = parseFloat(a?.price) || 0;
          const priceB = parseFloat(b?.price) || 0;
          return priceA - priceB;
        });
        break;
      case 'Price High to Low':
        sorted.sort((a, b) => {
          const priceA = parseFloat(a?.price) || 0;
          const priceB = parseFloat(b?.price) || 0;
          return priceB - priceA;
        });
        break;
      case 'Newest':
        sorted.sort((a, b) => {
          const dateA = a?.createdAt ? new Date(a.createdAt) : new Date(0);
          const dateB = b?.createdAt ? new Date(b.createdAt) : new Date(0);
          const timeA = isNaN(dateA.getTime()) ? 0 : dateA.getTime();
          const timeB = isNaN(dateB.getTime()) ? 0 : dateB.getTime();
          return timeB - timeA; // Newest first
        });
        break;
      default:
        // Most Relevant - keep original order
        break;
    }
    
    return sorted;
  }, [properties, appliedSearchQuery, appliedLocation, appliedType, appliedStatus, appliedBedrooms, appliedBathrooms, appliedPriceRange, sortBy, appliedVendor]);

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
  
  // Get unique vendors from all properties (merged from context and mock)
  const uniqueVendors = useMemo(() => {
    const vendorMap = new Map();
    
    // Merge properties from context with mock properties
    const allPropertiesMap = new Map();
    if (Array.isArray(mockProperties)) {
      mockProperties.forEach(prop => {
        allPropertiesMap.set(prop.id, prop);
      });
    }
    if (Array.isArray(properties)) {
      properties.forEach(prop => {
        allPropertiesMap.set(prop.id, prop);
      });
    }
    
    const allProperties = Array.from(allPropertiesMap.values());
    
    allProperties.forEach(property => {
      const vendorName = property?.vendorName || property?.agent?.name || 
        (property?.owner ? `${property.owner.firstName || ''} ${property.owner.lastName || ''}`.trim() : '') ||
        (property?.owner?.name || '');
      const vendorId = property?.vendorId || property?.ownerId || property?.owner?.id || '';
      const vendorCode = property?.vendorCode || property?.owner?.vendorCode || '';
      
      if (!vendorMap.has(vendorId)) {
        vendorMap.set(vendorId, { name: vendorName, code: vendorCode, count: 1 });
      } else {
        // increment count for vendor listings (used for anonymized display)
        const entry = vendorMap.get(vendorId) || { name: vendorName, code: vendorCode, count: 0 };
        entry.count = (entry.count || 0) + 1;
        vendorMap.set(vendorId, entry);
      }
    });
    return Array.from(vendorMap.entries()).map(([id, data]) => ({ id, name: data.name, code: data.code, count: data.count || 0 }));
  }, [properties]);

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
        setAppliedLocation('');
        break;
      case 'status':
        setSelectedStatus('');
        setAppliedStatus('');
        break;
      case 'type':
        setSelectedType('');
        setAppliedType('');
        break;
      case 'bedrooms':
        setBedrooms('');
        setAppliedBedrooms('');
        break;
      case 'vendor':
        setSelectedVendor('');
        setAppliedVendor('');
        break;
    }
  };

  const handleResetAllFilters = () => {
    // Reset pending filters
    setSelectedLocation('');
    setSelectedStatus('');
    setSelectedType('');
    setBedrooms('');
    setBathrooms('');
    setPriceRange([0, 1000000000]);
    setSearchQuery('');
    setSelectedVendor('');
    
    // Reset applied filters
    setAppliedLocation('');
    setAppliedStatus('');
    setAppliedType('');
    setAppliedBedrooms('');
    setAppliedBathrooms('');
    setAppliedPriceRange([0, 1000000000]);
    setAppliedSearchQuery('');
    setAppliedVendor('');
    
    setCurrentPage(1);
    toast.success('All filters cleared');
  };

  // Reset to page 1 when applied filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [appliedSearchQuery, appliedLocation, appliedType, appliedStatus, appliedBedrooms, appliedBathrooms, appliedPriceRange, appliedVendor]);

  // Calculate pagination
  const safeFilteredProperties = Array.isArray(filteredProperties) ? filteredProperties : [];
  const indexOfLastProperty = currentPage * propertiesPerPage;
  const indexOfFirstProperty = indexOfLastProperty - propertiesPerPage;
  const currentProperties = safeFilteredProperties.slice(indexOfFirstProperty, indexOfLastProperty);
  const totalPages = Math.ceil(safeFilteredProperties.length / propertiesPerPage);


  const handleApplyFilters = async () => {
    setIsApplyingFilters(true);
    try {
      // Simulate a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Copy pending filters to applied filters
      setAppliedSearchQuery(searchQuery);
      setAppliedLocation(selectedLocation);
      setAppliedType(selectedType);
      setAppliedStatus(selectedStatus);
      setAppliedBedrooms(bedrooms);
      setAppliedBathrooms(bathrooms);
      setAppliedPriceRange([...priceRange]);
      setAppliedVendor(selectedVendor);
      
      setCurrentPage(1);
      toast.success('Filters applied successfully!');
    } catch (error) {
      console.error('Error applying filters:', error);
      toast.error('Failed to apply filters');
    } finally {
      setIsApplyingFilters(false);
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedLocation('Lagos');
    setSelectedType('Apartment');
    setSelectedStatus('');
    setPriceRange([0, 100000000]);
    setBedrooms('2');
    setBathrooms('3');
    setCurrentPage(1);
    toast.success('Filters cleared');
  };

  const handleLearnMore = () => {
    navigate('/about');
  };
  
  const handleToggleFavorite = async (propertyId, property = null) => {
    if (!user) {
      toast.error('Please login to save properties to favorites');
      navigate('/');
      return;
    }

    const storageKey = `favorites_${user.id}`;
    const wasFavorite = favorites.has(propertyId);

    // Optimistic UI update
    const optimisticFavorites = new Set(favorites);
    if (wasFavorite) {
      optimisticFavorites.delete(propertyId);
      toast.success('Property removed from saved properties');
    } else {
      optimisticFavorites.add(propertyId);
      toast.success('Property added to saved properties');
    }
    setFavorites(optimisticFavorites);
    localStorage.setItem(storageKey, JSON.stringify(Array.from(optimisticFavorites)));

    try {
      // If property not provided, try to find it in merged properties (including mock)
      let propertyToSave = property;
      if (!propertyToSave) {
        // Check in mock properties first
        propertyToSave = mockProperties.find(p => (p.id || p.propertyId) === propertyId);
        // If not found, check in context properties
        if (!propertyToSave) {
          propertyToSave = properties.find(p => {
            const propId = p.id || p.propertyId || p._id;
            return propId === propertyId || String(propId) === String(propertyId);
          });
        }
      }
      
      const propertyIdStr = String(propertyId);
      const result = await toggleFavorite(propertyIdStr, propertyToSave);
      if (!result || !result.success) {
        throw new Error('Failed to toggle favorite on server');
      }
      
      // Dispatch event to notify other components (like Dashboard)
      window.dispatchEvent(new CustomEvent('favoritesUpdated', {
        detail: { propertyId: propertyIdStr, favorited: !wasFavorite }
      }));
      
      // Also trigger a storage event for cross-tab synchronization
      window.dispatchEvent(new StorageEvent('storage', {
        key: storageKey,
        newValue: JSON.stringify(Array.from(optimisticFavorites))
      }));
    } catch (error) {
      console.error('Error toggling favorite:', error);

      // Revert optimistic update on error
      const revertedFavorites = new Set(optimisticFavorites);
      if (wasFavorite) {
        revertedFavorites.add(propertyId);
      } else {
        revertedFavorites.delete(propertyId);
      }
      setFavorites(revertedFavorites);
      localStorage.setItem(storageKey, JSON.stringify(Array.from(revertedFavorites)));
      toast.error('Failed to update saved properties. Please try again.');
    }
  };
  
  const handleShareProperty = async (property) => {
    const shareData = {
      title: property.title,
      text: `Check out this amazing property: ${property.title}`,
      url: `${window.location.origin}/property/${property.propertyId || property.id}`
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
    setCurrentPage(1);
  };
  
  const handlePaginationClick = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Scroll to properties section instead of top of page
    const propertiesSection = document.getElementById('properties-section');
    if (propertiesSection) {
      propertiesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      // Fallback to top if section not found
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Expose modal opener globally for StaticHeroBanner
  useEffect(() => {
    window.openRegisterModal = () => setShowRegisterModal(true);
    return () => { window.openRegisterModal = undefined; };
  }, []);

  return (
    <>
      <SEO 
        title="Find Your Dream Property in Nigeria"
        description="Browse thousands of properties for sale, rent, and investment across Nigeria. Luxury homes, apartments, land, and commercial properties."
        keywords="real estate Nigeria, buy property Nigeria, rent property Lagos, property for sale, investment property, luxury homes"
      />
      <div className="min-h-screen bg-gray-50 w-full">
      {/* Custom CSS for Range Slider and Scrolling Text */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes scroll-text {
            0% {
              transform: translateX(0);
            }
            {
              id: 'prop_003',
              title: 'Luxury Penthouse Suite with Ocean Views',
              description: 'Stunning penthouse with panoramic city and ocean views, premium finishes, and exclusive access to rooftop amenities.',
              price: 520000000,
              type: 'apartment',
              status: 'for-sale',
              details: { bedrooms: 4, bathrooms: 3, sqft: 2800, yearBuilt: 2021, parking: 3, furnished: 'fully-furnished' },
              location: { address: '789 Banana Island', city: 'Lagos', state: 'Lagos', zipCode: '101001', coordinates: { lat: 6.4528, lng: 3.4068 } },
              images: [{ url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop', isPrimary: true }, { url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop', isPrimary: false }, { url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=600&fit=crop', isPrimary: false }],
              owner: { id: 'mock_vendor', name: 'Vendor Example', email: 'vendor@example.com' },
              views: 27,
              isVerified: true,
              amenities: ['Rooftop Lounge', 'Private Elevator', 'Ocean View', 'Smart Home', 'Gym'],
              createdAt: '2024-01-05'
            }
          }
          
          .animate-scroll-text:hover {
            animation-play-state: paused;
          }
          
          .animate-scroll-bg {
            animation: scroll-bg 15s linear infinite;
          }
          
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
      
      {/* Static Hero Banner with Search - Full Width */}
      <div className="-mx-4 sm:-mx-6 lg:-mx-8 mb-8">
        <StaticHeroBanner onOpenRegisterModal={() => setShowRegisterModal(true)} />
      </div>
      {showRegisterModal && (
        <RegisterModal onClose={() => setShowRegisterModal(false)} />
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        {/* Security Message - Static Text with Scrolling Background Effect */}
        <div className="mb-3 overflow-hidden relative bg-gradient-to-r from-blue-50 via-green-50 to-purple-50 rounded-lg py-4">
          {/* Scrolling background effect - flowing gradient waves */}
          <div className="absolute inset-0 animate-scroll-bg">
            <div className="inline-flex items-center space-x-20 whitespace-nowrap h-full">
              {/* Multiple copies for seamless loop */}
              {[...Array(3)].map((_, i) => (
                <div key={i} className="inline-flex items-center space-x-16 h-full">
                  <div className="w-32 h-full bg-gradient-to-r from-blue-200/30 via-blue-300/20 to-transparent rounded-full blur-sm"></div>
                  <div className="w-28 h-full bg-gradient-to-r from-green-200/30 via-green-300/20 to-transparent rounded-full blur-sm"></div>
                  <div className="w-36 h-full bg-gradient-to-r from-purple-200/30 via-purple-300/20 to-transparent rounded-full blur-sm"></div>
                  <div className="w-24 h-full bg-gradient-to-r from-orange-200/30 via-orange-300/20 to-transparent rounded-full blur-sm"></div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Static text content - locked in position */}
          <div className="relative z-10 text-center px-4">
            <span className="text-lg md:text-xl font-bold text-gray-800">
              Secure real estate transactions with{' '}
              <span className="text-blue-600">escrow protection</span>
              ,{' '}
              <span className="text-green-600">verified listings</span>
              , and{' '}
              <span className="text-purple-600">transparent processes</span>
            </span>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="w-full lg:w-80 bg-gray-800 text-white rounded-lg p-6 lg:sticky lg:top-24 lg:self-stretch lg:min-h-[calc(100vh-6rem)]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Property Filters</h3>
              <button 
                onClick={handleResetAllFilters}
                className="text-sm text-gray-300 hover:text-white"
              >
                Reset All
              </button>
            </div>

            {/* Active Filters (showing applied filters) */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {appliedLocation && (
                  <span className="flex items-center bg-orange-500 text-white px-3 py-1 rounded-full text-sm">
                    {appliedLocation} <FaTimes className="ml-2 cursor-pointer" onClick={() => {
                      setAppliedLocation('');
                      setSelectedLocation('');
                    }} />
                  </span>
                )}
                {appliedStatus && (
                  <span className="flex items-center bg-orange-500 text-white px-3 py-1 rounded-full text-sm">
                    {appliedStatus} <FaTimes className="ml-2 cursor-pointer" onClick={() => {
                      setAppliedStatus('');
                      setSelectedStatus('');
                    }} />
                  </span>
                )}
                {appliedType && (
                  <span className="flex items-center bg-orange-500 text-white px-3 py-1 rounded-full text-sm">
                    {appliedType} <FaTimes className="ml-2 cursor-pointer" onClick={() => {
                      setAppliedType('');
                      setSelectedType('');
                    }} />
                  </span>
                )}
                {appliedBedrooms && (
                  <span className="flex items-center bg-orange-500 text-white px-3 py-1 rounded-full text-sm">
                    {appliedBedrooms} Bedrooms <FaTimes className="ml-2 cursor-pointer" onClick={() => {
                      setAppliedBedrooms('');
                      setBedrooms('');
                    }} />
                  </span>
                )}
                {appliedVendor && (
                  <span className="flex items-center bg-orange-500 text-white px-3 py-1 rounded-full text-sm">
                    Vendor (hidden) <FaTimes className="ml-2 cursor-pointer" onClick={() => {
                      setAppliedVendor('');
                      setSelectedVendor('');
                    }} />
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

            {/* Vendor Search */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Search by Vendor</label>
              <input
                  type="text"
                  value={selectedVendor}
                  onChange={(e) => setSelectedVendor(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && selectedVendor && selectedVendor.trim()) {
                      navigate(`/properties?vendor=${encodeURIComponent(selectedVendor.trim())}`);
                    }
                  }}
                  placeholder="Enter vendor name..."
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
            </div>

            {/* Price Range */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Price Range (₦)</label>
              <div className="space-y-4">
                <div className="flex space-x-2 items-stretch">
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
                    className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 min-w-0"
                    placeholder="Min Price"
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
                    className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 min-w-0"
                    placeholder="Max Price"
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
                  <div className="flex justify-between items-center text-xs text-gray-300 mt-2">
                    <span>₦0</span>
                    <span className="text-orange-500 font-medium bg-gray-800 px-3 py-1 rounded">
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
                disabled={isApplyingFilters}
                className="w-full bg-orange-500 text-white py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isApplyingFilters ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Applying Filters...
                  </>
                ) : (
                  'Apply Filters'
                )}
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
          <div id="properties-section" className="w-full lg:flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-700">{(filteredProperties?.length || 0)} {(filteredProperties?.length || 0) === 1 ? 'property' : 'properties'} found</p>
              {(filteredProperties?.length || 0) > 0 && (
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
              )}
            </div>

            {/* Property Grid */}
            {(filteredProperties?.length || 0) > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentProperties.map((property) => (
                <div key={property.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <Link 
                    to={`/property/${property.propertyId || property.id}`}
                    className="block relative cursor-pointer"
                  >
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
                    <div className="absolute bottom-3 left-3">
                      <span className="text-2xl font-bold text-white">
                        ₦{(property.price || 0).toLocaleString()}
                      </span>
                    </div>
                  </Link>
                  <div className="absolute top-3 right-3 flex space-x-2 z-10">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(property.id, property);
                      }}
                      className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors"
                      title={favorites.has(property.id) ? "Remove from favorites" : "Add to favorites"}
                    >
                      <FaHeart className={`text-sm transition-colors ${
                        favorites.has(property.id) ? 'text-red-500' : 'text-gray-400'
                      }`} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShareProperty(property);
                      }}
                      className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors"
                      title="Share property"
                      aria-label="Share property"
                    >
                      <FaShare className="text-gray-400 text-sm hover:text-blue-500 transition-colors" />
                    </button>
                  </div>

                  <Link 
                    to={`/property/${property.propertyId || property.id}`}
                    className="block p-4 cursor-pointer"
                  >
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
                          {property.bedrooms || property.details?.bedrooms || 0} Beds
                        </span>
                        <span className="flex items-center">
                          <FaBath className="mr-1" />
                          {property.bathrooms || property.details?.bathrooms || 0} Baths
                        </span>
                        <span className="flex items-center">
                          <FaRulerCombined className="mr-1" />
                          {property.sqft || property.details?.sqft || property.area || 0}m²
                        </span>
                      </div>
                    </div>
                    <div
                      className="flex items-center justify-center w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition-colors cursor-pointer"
                      title={`View details for ${property.title}`}
                    >
                      View Details
                      <FaArrowRight className="ml-2 text-sm" />
                    </div>
                  </Link>
                </div>
              ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <FaBuilding className="text-gray-300 text-6xl mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No properties found</h3>
                  <p className="text-gray-500 mb-6">
                    Try adjusting your filters or search criteria to find more properties.
                  </p>
                  <button
                    onClick={handleResetAllFilters}
                    className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            )}

            {/* Pagination */}
            {(filteredProperties?.length || 0) > 0 && totalPages > 1 && (() => {
              // Calculate which page numbers to show
              let startPage, endPage;
              
              if (totalPages <= 7) {
                // Show all pages if 7 or fewer
                startPage = 1;
                endPage = totalPages;
              } else {
                // Show pages around current page
                if (currentPage <= 4) {
                  startPage = 1;
                  endPage = 5;
                } else if (currentPage >= totalPages - 3) {
                  startPage = totalPages - 4;
                  endPage = totalPages;
                } else {
                  startPage = currentPage - 2;
                  endPage = currentPage + 2;
                }
              }
              
              const pageNumbers = [];
              for (let i = startPage; i <= endPage; i++) {
                pageNumbers.push(i);
              }
              
              return (
                <div className="flex items-center justify-center mt-8 space-x-2">
                  <button 
                    onClick={() => handlePaginationClick(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Previous page"
                  >
                    &lt;
                  </button>
                  
                  {startPage > 1 && (
                    <>
                      <button 
                        onClick={() => handlePaginationClick(1)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                        title="Go to page 1"
                      >
                        1
                      </button>
                      {startPage > 2 && (
                        <span className="px-3 py-2 text-gray-600">...</span>
                      )}
                    </>
                  )}
                  
                  {pageNumbers.map((pageNumber) => (
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
                  ))}
                  
                  {endPage < totalPages && (
                    <>
                      {endPage < totalPages - 1 && (
                        <span className="px-3 py-2 text-gray-600">...</span>
                      )}
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
              );
            })()}
          </div>
        </div>
      </div>

      {/* Security & Value Proposition Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-20 rounded-full mb-6">
              <FaLock className="text-yellow-300" />
              <p className="font-medium">Bank-Level Security</p>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Why Choose PropertyArk for Secure Real Estate?
            </h2>
            
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              We understand the risks in real estate transactions. That's why we've built the most secure 
              property marketplace in Nigeria with multiple layers of protection for buyers, sellers, and investors.
            </p>
          </div>

          {/* Security Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {/* Escrow Protection */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300">
              <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mb-6 mx-auto">
                <FaShieldAlt className="text-3xl text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-center">Escrow Protection</h3>
              <p className="text-blue-100 text-center leading-relaxed">
                Your money is held in secure escrow until the transaction is complete. No payments are released 
                until both parties are satisfied. Our escrow system protects your funds at every stage.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-blue-50">
                <li className="flex items-start">
                  <FaCheck className="text-yellow-400 mr-2 mt-1 flex-shrink-0" />
                  <span>Automatic refund protection</span>
                </li>
                <li className="flex items-start">
                  <FaCheck className="text-yellow-400 mr-2 mt-1 flex-shrink-0" />
                  <span>Identity verification required</span>
                </li>
                <li className="flex items-start">
                  <FaCheck className="text-yellow-400 mr-2 mt-1 flex-shrink-0" />
                  <span>Payment processed only on agreement</span>
                </li>
              </ul>
            </div>

            {/* Verified Properties */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-6 mx-auto">
                <FaCertificate className="text-3xl text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-center">Property Verification</h3>
              <p className="text-blue-100 text-center leading-relaxed">
                Every property listing undergoes rigorous verification. We confirm ownership, legality, 
                documents, and accuracy of details before listing. No fake listings on our platform.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-blue-50">
                <li className="flex items-start">
                  <FaCheck className="text-green-400 mr-2 mt-1 flex-shrink-0" />
                  <span>Complete document verification</span>
                </li>
                <li className="flex items-start">
                  <FaCheck className="text-green-400 mr-2 mt-1 flex-shrink-0" />
                  <span>Ownership and title confirmation</span>
                </li>
                <li className="flex items-start">
                  <FaCheck className="text-green-400 mr-2 mt-1 flex-shrink-0" />
                  <span>Physical inspection reports</span>
                </li>
              </ul>
            </div>

            {/* Dispute Resolution */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mb-6 mx-auto">
                <FaHandshake className="text-3xl text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-center">Fair Dispute Resolution</h3>
              <p className="text-blue-100 text-center leading-relaxed">
                If something goes wrong, we're here to help. Our expert team mediates disputes fairly 
                and ensures both parties are treated justly. We provide transparent resolution processes.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-blue-50">
                <li className="flex items-start">
                  <FaCheck className="text-purple-400 mr-2 mt-1 flex-shrink-0" />
                  <span>Expert mediation team</span>
                </li>
                <li className="flex items-start">
                  <FaCheck className="text-purple-400 mr-2 mt-1 flex-shrink-0" />
                  <span>Evidence-based decisions</span>
                </li>
                <li className="flex items-start">
                  <FaCheck className="text-purple-400 mr-2 mt-1 flex-shrink-0" />
                  <span>Quick turnaround times</span>
                </li>
              </ul>
            </div>

            {/* Legal Compliance */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-6 mx-auto">
                <FaFileContract className="text-3xl text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-center">Legal Documentation</h3>
              <p className="text-blue-100 text-center leading-relaxed">
                We guide you through all legal requirements. From contracts to deed transfers, our legal 
                framework ensures compliance with Nigerian real estate laws and regulations.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-blue-50">
                <li className="flex items-start">
                  <FaCheck className="text-red-400 mr-2 mt-1 flex-shrink-0" />
                  <span>Standardized legal contracts</span>
                </li>
                <li className="flex items-start">
                  <FaCheck className="text-red-400 mr-2 mt-1 flex-shrink-0" />
                  <span>Professional legal guidance</span>
                </li>
                <li className="flex items-start">
                  <FaCheck className="text-red-400 mr-2 mt-1 flex-shrink-0" />
                  <span>Government compliance support</span>
                </li>
              </ul>
            </div>

            {/* 24/7 Support */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-6 mx-auto">
                <FaClock className="text-3xl text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-center">24/7 Support</h3>
              <p className="text-blue-100 text-center leading-relaxed">
                Our dedicated support team is available around the clock to assist you with any concerns. 
                Get help via phone, email, or live chat whenever you need it.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-blue-50">
                <li className="flex items-start">
                  <FaCheck className="text-blue-400 mr-2 mt-1 flex-shrink-0" />
                  <span>Instant live chat support</span>
                </li>
                <li className="flex items-start">
                  <FaCheck className="text-blue-400 mr-2 mt-1 flex-shrink-0" />
                  <span>Phone and email assistance</span>
                </li>
                <li className="flex items-start">
                  <FaCheck className="text-blue-400 mr-2 mt-1 flex-shrink-0" />
                  <span>Transaction progress tracking</span>
                </li>
              </ul>
            </div>

            {/* Mobile Access */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300">
              <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center mb-6 mx-auto">
                <FaMobileAlt className="text-3xl text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-center">Mobile-First Platform</h3>
              <p className="text-blue-100 text-center leading-relaxed">
                Browse, search, and complete transactions from anywhere. Our mobile-optimized platform 
                makes real estate investing accessible from your phone, tablet, or computer.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-blue-50">
                <li className="flex items-start">
                  <FaCheck className="text-indigo-400 mr-2 mt-1 flex-shrink-0" />
                  <span>Responsive design for all devices</span>
                </li>
                <li className="flex items-start">
                  <FaCheck className="text-indigo-400 mr-2 mt-1 flex-shrink-0" />
                  <span>Quick property notifications</span>
                </li>
                <li className="flex items-start">
                  <FaCheck className="text-indigo-400 mr-2 mt-1 flex-shrink-0" />
                  <span>Secure mobile payments</span>
                </li>
              </ul>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-white text-gray-900 rounded-2xl p-12 text-center shadow-2xl">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Invest Securely?
            </h3>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of smart investors who trust PropertyArk for their real estate transactions. 
              Start browsing verified properties today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => navigate('/properties')}
                className="px-10 py-4 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 group"
              >
                <span>Explore Properties</span>
                <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
              {/* Become a Vendor CTA removed from Home page — use Profile Settings */}
            </div>
          </div>
        </div>
      </div>

      {/* Premium Property Discovery Section */}
      <div className="bg-brand-blue text-white py-16 mt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Experience Premium Property Discovery</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              PropertyArk offers exclusive features to enhance your property search. 
              Our advanced tools help you find, evaluate, and secure your dream property with confidence.
            </p>
          </div>

          <div className="flex justify-center">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="bg-white bg-opacity-10 rounded-lg p-6 text-center">
                <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaEye className="text-2xl text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Virtual Tours</h3>
                <p className="text-gray-300 mb-4">
                  Experience immersive 3D tours of properties from the comfort of your home. 
                  Get a realistic feel of spaces before visiting in person.
                </p>
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
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Home Sections - Agents and Property Categories */}
      <HomeSections />

      {/* Blog Section */}
      {/* Blog section removed */}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="lg:col-span-1">
              <div className="flex items-center mb-4">
                <div className="bg-white p-1 rounded-md shadow-lg inline-block">
                  <img 
                    src={`${process.env.PUBLIC_URL}/logo.png?v=4.0`} 
                    alt="PropertyArk Logo" 
                    className="w-auto"
                    style={{ 
                      height: '6rem',
                      backgroundColor: 'transparent',
                      mixBlendMode: 'normal',
                      display: 'block'
                    }}
                    onError={(e) => {
                      // Fallback to icon if logo image doesn't exist
                      e.target.style.display = 'none';
                      e.target.parentElement.nextSibling.style.display = 'flex';
                    }}
                  />
                </div>
                <div className="w-10 h-10 bg-brand-orange rounded-lg flex items-center justify-center" style={{ display: 'none' }}>
                  <FaBuilding className="text-white text-xl" />
                </div>
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
                <li><Link to="/investment" className="text-gray-400 hover:text-white transition-colors">Investment Opportunities</Link></li>
                <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors">About Us</Link></li>
              </ul>
            </div>

            {/* Property Types */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Property Types</h3>
              <ul className="space-y-3">
                <li><Link to="/properties?type=apartment&luxury=true" className="text-gray-400 hover:text-white transition-colors">Luxury Apartments</Link></li>
                <li><Link to="/properties?type=house&family=true" className="text-gray-400 hover:text-white transition-colors">Family Houses</Link></li>
                <li><Link to="/properties?type=penthouse" className="text-gray-400 hover:text-white transition-colors">Penthouses</Link></li>
                <li><Link to="/properties?type=villa&beachfront=true" className="text-gray-400 hover:text-white transition-colors">Beachfront Villas</Link></li>
                <li><Link to="/properties?type=commercial" className="text-gray-400 hover:text-white transition-colors">Commercial Properties</Link></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <FaMapMarkerAlt className="text-brand-orange mt-1" />
                  <div>
                    <p className="text-gray-400">Suite 305, Orago Complex</p>
                    <p className="text-gray-400">Kam Salem Street, Garki, Abuja</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <FaPhone className="text-brand-orange" />
                  <p className="text-gray-400">+234 800 123 4567</p>
                </div>
                <div className="flex items-center space-x-3">
                  <FaEnvelope className="text-brand-orange" />
                  <p className="text-gray-400">info@propertyark.com</p>
                </div>
                <div className="flex items-center space-x-3">
                  <FaClock className="text-brand-orange" />
                  <p className="text-gray-400">Mon - Fri: 9:00 AM - 6:00 PM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                © 2024 PropertyArk. All rights reserved.
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
    </>
  );
};

export default Home;
