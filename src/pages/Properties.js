import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProperty } from '../contexts/PropertyContext';
import { useAuth } from '../contexts/AuthContext';
import { FaBed, FaBath, FaRulerCombined, FaHeart, FaShare, FaBell, FaCalendar } from 'react-icons/fa';
import toast from 'react-hot-toast';
import PropertyCardSkeleton from '../components/PropertyCardSkeleton';
import Breadcrumbs from '../components/Breadcrumbs';

const Properties = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { properties = [], filters = {}, setFilters, fetchProperties, toggleFavorite, saveSearch, loading } = useProperty();
  const { user, setAuthRedirect } = useAuth();
  const safeProperties = useMemo(() => Array.isArray(properties) ? properties : [], [properties]);
  const [showFilters, setShowFilters] = useState(false);
  // Pending filters (what user is selecting)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedVendor, setSelectedVendor] = useState('');
  // Applied filters (what actually filters the properties)
  const [appliedSearchQuery, setAppliedSearchQuery] = useState('');
  const [appliedLocation, setAppliedLocation] = useState('');
  const [appliedType, setAppliedType] = useState('');
  const [appliedStatus, setAppliedStatus] = useState('');
  const [appliedPriceRange, setAppliedPriceRange] = useState({ min: '', max: '' });
  const [appliedVendor, setAppliedVendor] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [favorites, setFavorites] = useState(new Set());
  const [saveSearchName, setSaveSearchName] = useState('');
  const [showSaveSearchModal, setShowSaveSearchModal] = useState(false);
  const [alertName, setAlertName] = useState('');
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);
  const [sortBy, setSortBy] = useState('mostRecent'); // mostRecent, priceLow, priceHigh, mostPopular

  // Load favorites from localStorage
  const loadFavorites = useCallback(() => {
    if (user && user.id) {
      const key = `favorites_${user.id}`;
      const savedFavorites = JSON.parse(localStorage.getItem(key) || '[]');
      // Normalize all IDs to strings for consistent comparison
      const normalizedFavorites = savedFavorites.map(id => String(id));
      setFavorites(new Set(normalizedFavorites));
      return normalizedFavorites.length;
    } else {
      setFavorites(new Set());
      return 0;
    }
  }, [user]);

  useEffect(() => {
    loadFavorites();
  }, [user, loadFavorites]);

  // Listen for favorites updates from other components (like Dashboard, PropertyDetail, etc.)
  // Use a ref to track if we're currently updating to prevent reload loops
  const isUpdatingRef = React.useRef(false);
  
  useEffect(() => {
    if (!user) return;

    const handleFavoritesUpdate = (event) => {
      // Don't reload if we're the ones who triggered the update
      // The toggleFavorite function will handle reloading after it completes
      if (!isUpdatingRef.current) {
        // Reload favorites from localStorage when updated from other components
        setTimeout(() => {
          loadFavorites();
        }, 150);
      }
    };

    const handleStorageChange = (event) => {
      // Listen for storage events (cross-tab synchronization)
      if (user && user.id && event.key === `favorites_${user.id}` && !isUpdatingRef.current) {
        setTimeout(() => {
          loadFavorites();
        }, 150);
      }
    };

    window.addEventListener('favoritesUpdated', handleFavoritesUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('favoritesUpdated', handleFavoritesUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user, loadFavorites]);

  // Normalize location names (handle aliases) - MUST be defined before useMemo that uses it
  const normalizeLocation = (location) => {
    if (!location) return location;
    const locationMap = {
      'port harcourt': 'Rivers',
      'port-harcourt': 'Rivers',
      'ph': 'Rivers',
      'fct': 'Abuja',
      'abuja fct': 'Abuja'
    };
    const normalized = locationMap[location.toLowerCase().trim()];
    return normalized || location;
  };

  // Map type values from URL to display format
  const mapTypeFromUrl = (urlType) => {
    const typeMap = {
      'buy': 'For Sale',
      'rent': 'For Rent',
      'short-let': 'Shortlet',
      'sale': 'For Sale',
      'lease': 'For Lease'
    };
    return typeMap[urlType?.toLowerCase()] || urlType;
  };

  // Map status values from URL to display format
  const mapStatusFromUrl = (urlStatus) => {
    const statusMap = {
      'buy': 'For Sale',
      'rent': 'For Rent',
      'short-let': 'Shortlet',
      'sale': 'For Sale',
      'lease': 'For Lease',
      'shortlet': 'Shortlet'
    };
    return statusMap[urlStatus?.toLowerCase()] || urlStatus;
  };

  // Filtered properties using applied filters (only updates when Apply Filters is clicked)
  const filteredProperties = useMemo(() => {
    let filtered = [...safeProperties];

    // Apply location filter (priority) - optimized for precise matching
    if (appliedLocation) {
      const normalizedSearchLocation = normalizeLocation(appliedLocation).toLowerCase().trim();
      filtered = filtered.filter(property => {
        // Priority 1: Check city field (most reliable)
        const city = property?.city?.toLowerCase() || 
                     (property?.location?.city && typeof property.location === 'object' ? property.location.city.toLowerCase() : '') || '';
        const normalizedCity = normalizeLocation(city);
        if (normalizedCity === normalizedSearchLocation || city === normalizedSearchLocation) {
          return true;
        }
        
        // Priority 2: Check state field
        const state = property?.state?.toLowerCase() || 
                      (property?.location?.state && typeof property.location === 'object' ? property.location.state.toLowerCase() : '') || '';
        const normalizedState = normalizeLocation(state);
        if (normalizedState === normalizedSearchLocation || state === normalizedSearchLocation) {
          return true;
        }
        
        // Priority 3: Check string location field (for mock data format: "Address, City, State")
        if (property?.location && typeof property.location === 'string') {
          const locationString = property.location.toLowerCase();
          // Split by comma and check each part
          const locationParts = locationString.split(',').map(part => normalizeLocation(part.trim()));
          // Check if any part exactly matches the search location
          if (locationParts.includes(normalizedSearchLocation)) {
            return true;
          }
          // Also check if the location string ends with the search term (common pattern)
          if (locationString.endsWith(normalizedSearchLocation) || locationString.endsWith(`, ${normalizedSearchLocation}`)) {
            return true;
          }
          // Check each part against normalized search location
          const originalParts = locationString.split(',').map(part => part.trim());
          for (const part of originalParts) {
            if (normalizeLocation(part) === normalizedSearchLocation) {
              return true;
            }
          }
        }
        
        // Priority 4: Check if location object has city or state that matches
        if (property?.location && typeof property.location === 'object') {
          const objCity = property.location.city?.toLowerCase() || '';
          const objState = property.location.state?.toLowerCase() || '';
          if (normalizeLocation(objCity) === normalizedSearchLocation || 
              normalizeLocation(objState) === normalizedSearchLocation ||
              objCity === normalizedSearchLocation || 
              objState === normalizedSearchLocation) {
            return true;
          }
        }
        
        return false;
      });
    }

    // Apply search query (works independently or with location filter)
    if (appliedSearchQuery.trim()) {
      const query = appliedSearchQuery.toLowerCase();
      filtered = filtered.filter(property => 
        property.title?.toLowerCase().includes(query) ||
        property.description?.toLowerCase().includes(query) ||
        property.location?.toLowerCase().includes(query) ||
        property.address?.toLowerCase().includes(query) ||
        (property.city && property.city.toLowerCase().includes(query)) ||
        (property.state && property.state.toLowerCase().includes(query)) ||
        (property.location?.city && typeof property.location === 'object' && property.location.city.toLowerCase().includes(query)) ||
        (property.location?.state && typeof property.location === 'object' && property.location.state.toLowerCase().includes(query))
      );
    }

    // Apply type filter
    if (appliedType) {
      filtered = filtered.filter(property => property.type === appliedType);
    }

    // Apply status filter
    if (appliedStatus) {
      filtered = filtered.filter(property => 
        property.status === appliedStatus || 
        property.listingType === appliedStatus ||
        property.label === appliedStatus
      );
    }

    // Apply price range filter
    if (appliedPriceRange.min) {
      filtered = filtered.filter(property => property.price >= parseFloat(appliedPriceRange.min));
    }
    if (appliedPriceRange.max) {
      filtered = filtered.filter(property => property.price <= parseFloat(appliedPriceRange.max));
    }

    // Apply vendor filter (supports name, email, vendorCode like VND-XXXXXX, and vendorId)
    if (appliedVendor) {
      const searchTerm = appliedVendor.toLowerCase().trim();
      console.log('Properties: Filtering by vendor search term:', searchTerm);
      filtered = filtered.filter(property => {
        // Try multiple vendor identification fields
        const vendorName = (property?.vendorName || property?.agent?.name || 
          (property?.owner ? `${property.owner.firstName || ''} ${property.owner.lastName || ''}`.trim() : '') ||
          (property?.owner?.name || '')).toLowerCase();
        const vendorId = (property?.vendorId || property?.ownerId || property?.owner?.id || '').toLowerCase();
        const vendorCode = (property?.vendorCode || property?.owner?.vendorCode || '').toLowerCase();
        const vendorEmail = (property?.vendorEmail || property?.ownerEmail || property?.owner?.email || '').toLowerCase();
        
        // Handle vendorCode search (e.g., "VND-E88234" or "E88234" or "e88234")
        let vendorCodeMatches = false;
        if (vendorCode) {
          // Normalize both the property's vendorCode and search term for comparison
          const normalizedVendorCode = vendorCode.toLowerCase().trim();
          const normalizedSearchTerm = searchTerm.toLowerCase().trim();
          
          // Remove VND- prefix from both if present
          const codePart = normalizedVendorCode.replace(/^vnd-/, '');
          const searchPart = normalizedSearchTerm.replace(/^vnd-/, '');
          
          // Match if:
          // 1. Full vendorCode matches (with or without VND- prefix)
          // 2. Just the code part matches (e.g., "E88234" matches "VND-E88234")
          // 3. Partial match within the code
          vendorCodeMatches = normalizedVendorCode === normalizedSearchTerm || 
                              codePart === searchPart ||
                              codePart.includes(searchPart) ||
                              normalizedVendorCode.includes(normalizedSearchTerm);
        }
        
        const matches = vendorName.includes(searchTerm) ||
               vendorId.includes(searchTerm) ||
               vendorCodeMatches ||
               vendorEmail.includes(searchTerm);
        
        if (matches) {
          console.log('Properties: Match found - Property:', property.title, 
            'vendorCode:', property?.vendorCode || property?.owner?.vendorCode || 'MISSING', 
            'vendorName:', property?.vendorName || vendorName || 'MISSING',
            'vendorEmail:', vendorEmail || 'MISSING',
            'ownerId:', property?.ownerId || property?.owner?.id || 'MISSING',
            'searchTerm:', searchTerm);
        } else if (appliedVendor.toLowerCase().includes('vnd-')) {
          // Log why vendorCode search failed
          console.log('Properties: VendorCode search failed - Property:', property.title,
            'vendorCode:', property?.vendorCode || property?.owner?.vendorCode || 'UNDEFINED',
            'searchTerm:', searchTerm);
        }
        
        return matches;
      });
      console.log('Properties: Filtered to', filtered.length, 'properties for vendor search:', searchTerm);
    }

    // Apply sorting
    let sorted = [...filtered];
    switch (sortBy) {
      case 'priceLow':
        sorted.sort((a, b) => {
          const priceA = parseFloat(a?.price || 0);
          const priceB = parseFloat(b?.price || 0);
          return priceA - priceB;
        });
        break;
      case 'priceHigh':
        sorted.sort((a, b) => {
          const priceA = parseFloat(a?.price || 0);
          const priceB = parseFloat(b?.price || 0);
          return priceB - priceA;
        });
        break;
      case 'mostRecent':
        sorted.sort((a, b) => {
          const dateA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA; // Newest first
        });
        break;
      case 'mostPopular':
        sorted.sort((a, b) => {
          const viewsA = parseInt(a?.views || 0);
          const viewsB = parseInt(b?.views || 0);
          const favoritesA = parseInt(a?.favorites || 0);
          const favoritesB = parseInt(b?.favorites || 0);
          // Combine views and favorites for popularity score
          const scoreA = viewsA + (favoritesA * 2);
          const scoreB = viewsB + (favoritesB * 2);
          return scoreB - scoreA;
        });
        break;
      default:
        // Keep original order
        break;
    }

    return sorted;
  }, [safeProperties, appliedSearchQuery, appliedLocation, appliedType, appliedStatus, appliedPriceRange, appliedVendor, sortBy]);

  const filterOptions = useMemo(() => {
    const types = Array.from(new Set(safeProperties.map(p => p.type).filter(Boolean)));
    const statuses = Array.from(new Set(safeProperties.map(p => p.status || p.listingType).filter(Boolean)));
    const locations = Array.from(new Set(safeProperties.map(p => p.location?.city || p.location).filter(Boolean)));
    return {
      types: types.length ? types : ['apartment','house','villa','condo','duplex'],
      statuses: statuses.length ? statuses : ['for-sale','for-rent','for-lease'],
      locations
    };
  }, [safeProperties]);

  // Get unique vendors from properties
  const uniqueVendors = useMemo(() => {
    const vendorMap = new Map();
    safeProperties.forEach(property => {
      const vendorName = property?.agent?.name || 
        (property?.owner ? `${property.owner.firstName || ''} ${property.owner.lastName || ''}`.trim() : '');
      const vendorId = property?.ownerId || property?.owner?.id || '';
      const vendorCode = property?.vendorCode || property?.owner?.vendorCode || '';
      if (vendorName && !vendorMap.has(vendorId)) {
        vendorMap.set(vendorId, { name: vendorName, code: vendorCode });
      }
    });
    return Array.from(vendorMap.entries()).map(([id, data]) => ({ id, name: data.name, code: data.code }));
  }, [safeProperties]);

  // Pagination for filtered properties
  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProperties = filteredProperties.slice(startIndex, endIndex);

  useEffect(() => {
    // Fetch all properties (Firestore + localStorage + mock) on mount
    fetchProperties({}).catch(err => {
      console.warn('Error fetching properties on mount:', err);
    });
  }, [fetchProperties]);

  // Handle URL parameters on initial load and from property alerts
  useEffect(() => {
    const fromAlert = searchParams.get('fromAlert');
    const alertNameParam = searchParams.get('alertName');
    
    // Get URL parameters
    const searchParam = searchParams.get('search');
    const location = searchParams.get('location');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const minBedrooms = searchParams.get('minBedrooms');
    const maxBedrooms = searchParams.get('maxBedrooms');
    const minBathrooms = searchParams.get('minBathrooms');
    const maxBathrooms = searchParams.get('maxBathrooms');
    const minArea = searchParams.get('minArea');
    const maxArea = searchParams.get('maxArea');
    const features = searchParams.get('features');
    
    // Apply search query parameter (general text search)
    if (searchParam) {
      setSearchQuery(searchParam);
      setAppliedSearchQuery(searchParam);
    }
    
    // Apply location filter (normalize location name)
    if (location) {
      const normalizedLoc = normalizeLocation(location);
      setAppliedLocation(normalizedLoc);
      // Only set search query if it wasn't already set by searchParam
      if (!searchParam) {
        setSearchQuery(normalizedLoc);
      }
    } else if (!searchParam) {
      // Clear location filter if no location parameter in URL and no search param
      setAppliedLocation('');
    }
    
    // Apply type filter (map from URL format to display format)
    // Note: When type is "buy", "rent", or "short-let", these should map to status, not type
    if (type) {
      const mappedType = mapTypeFromUrl(type);
      // If type is a status-like value (buy/rent/short-let), apply as status instead
      if (['buy', 'rent', 'short-let', 'sale', 'lease'].includes(type.toLowerCase())) {
        setAppliedStatus(mappedType);
        setSelectedStatus(mappedType);
      } else {
        // Otherwise, it's a property type like "apartment", "house", etc.
        setAppliedType(mappedType);
        setSelectedType(mappedType);
      }
    }
    
    // Apply status filter (map from URL format to display format)
    if (status) {
      const mappedStatus = mapStatusFromUrl(status);
      setAppliedStatus(mappedStatus);
      setSelectedStatus(mappedStatus);
    }
    
    // Apply price range
    if (minPrice || maxPrice) {
      setPriceRange(prev => ({ 
        ...prev, 
        min: minPrice || prev.min, 
        max: maxPrice || prev.max 
      }));
      setAppliedPriceRange({ 
        min: minPrice || '', 
        max: maxPrice || '' 
      });
    }
    
    // Handle alert-specific logic
    if (fromAlert && alertNameParam) {
      console.log('Loading properties from alert:', alertNameParam);
      setAlertName(alertNameParam);
      
      // Apply filters to context
      const alertFilters = {
        location: location || '',
        type: type || '',
        minPrice: minPrice ? parseInt(minPrice) : '',
        maxPrice: maxPrice ? parseInt(maxPrice) : '',
        minBedrooms: minBedrooms ? parseInt(minBedrooms) : '',
        maxBedrooms: maxBedrooms ? parseInt(maxBedrooms) : '',
        minBathrooms: minBathrooms ? parseInt(minBathrooms) : '',
        maxBathrooms: maxBathrooms ? parseInt(maxBathrooms) : '',
        minArea: minArea ? parseInt(minArea) : '',
        maxArea: maxArea ? parseInt(maxArea) : '',
        features: features ? features.split(',') : []
      };
      
      setFilters(alertFilters);
      toast.success(`Showing properties matching "${alertNameParam}" alert criteria`);
    } else if (location || type || status) {
      // Auto-apply filters from URL (not from alert)
      toast.success(`Filtering properties${location ? ` in ${location}` : ''}${type ? ` - ${mapTypeFromUrl(type)}` : ''}${status ? ` - ${mapStatusFromUrl(status)}` : ''}`);
    }
  }, [searchParams, setFilters]);

  // Handle individual filter changes
  const handleFilterChange = (filterType, value) => {
    switch (filterType) {
      case 'type':
        setSelectedType(value);
        break;
      case 'status':
        setSelectedStatus(value);
        break;
      case 'minPrice':
        setPriceRange(prev => ({ ...prev, min: value }));
        break;
      case 'maxPrice':
        setPriceRange(prev => ({ ...prev, max: value }));
        break;
      case 'search':
        setSearchQuery(value);
        break;
      default:
        break;
    }
  };

  const handleApplyFilters = async () => {
    setIsApplyingFilters(true);
    try {
      // Update applied filters from pending filters
      setAppliedSearchQuery(searchQuery);
      setAppliedType(selectedType);
      setAppliedStatus(selectedStatus);
      setAppliedPriceRange({ ...priceRange });
      setAppliedVendor(selectedVendor);
      
      const next = {
        ...filters,
        type: selectedType,
        status: selectedStatus,
        minPrice: priceRange.min,
        maxPrice: priceRange.max,
        search: searchQuery
      };
      setFilters(next);
      await fetchProperties(next, 1);
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
    setSelectedType('');
    setSelectedStatus('');
    setPriceRange({ min: '', max: '' });
    setSearchQuery('');
    setSelectedVendor('');
    // Also clear applied filters
    setAppliedType('');
    setAppliedStatus('');
    setAppliedPriceRange({ min: '', max: '' });
    setAppliedSearchQuery('');
    setAppliedVendor('');
    setFilters({});
    fetchProperties({}, 1);
    setCurrentPage(1);
  };

  const handleSaveSearch = () => {
    if (!user) {
      toast.error('Please login to save searches');
      // User can continue browsing without being forced to login
      return;
    }
    setShowSaveSearchModal(true);
  };

  const handleConfirmSaveSearch = async () => {
    if (!saveSearchName.trim()) {
      toast.error('Please enter a name for your search');
      return;
    }

    try {
      const searchCriteria = {
        type: selectedType,
        status: selectedStatus,
        priceRange,
        searchQuery,
        location: filters.location,
        bedrooms: filters.bedrooms,
        bathrooms: filters.bathrooms
      };

      await saveSearch(saveSearchName, searchCriteria);
      toast.success(`Search "${saveSearchName}" saved successfully!`);
      setShowSaveSearchModal(false);
      setSaveSearchName('');
    } catch (error) {
      console.error('Error saving search:', error);
      toast.error('Failed to save search');
    }
  };

  const closeSaveSearchModal = () => {
    setShowSaveSearchModal(false);
    setSaveSearchName('');
  };

  /**
   * IMPORTANT: This function handles favorite toggling with proper synchronization.
   * 
   * Architecture:
   * 1. Optimistic UI update (immediate visual feedback)
   * 2. Call toggleFavorite from PropertyContext (single source of truth for localStorage)
   * 3. PropertyContext handles: localStorage, events, Firestore sync
   * 4. Reload favorites after successful toggle to ensure consistency
   * 
   * CRITICAL: Do NOT save to localStorage here - let PropertyContext handle it.
   * This prevents race conditions and ensures single source of truth.
   */
  const handleToggleFavorite = async (propertyId) => {
    if (!user) {
      // Show login prompt but don't force redirect - allow user to continue browsing
      toast.error('Please login to save properties to favorites');
      // Optionally navigate to login, but don't block the page
      // User can continue browsing and login later if they want
      return;
    }

    // Normalize propertyId to string
    const propertyIdStr = String(propertyId);
    const wasFavorite = favorites.has(propertyIdStr);

    // Set flag to prevent event listener from reloading during update
    // This prevents race conditions where the listener reloads before toggleFavorite completes
    isUpdatingRef.current = true;

    // Optimistic UI update (visual feedback only, don't save to localStorage yet)
    // CRITICAL: We do NOT save to localStorage here - PropertyContext.toggleFavorite handles it
    const optimisticFavorites = new Set(favorites);
    if (wasFavorite) {
      optimisticFavorites.delete(propertyIdStr);
    } else {
      optimisticFavorites.add(propertyIdStr);
    }
    setFavorites(optimisticFavorites);

    try {
      // Find the property object to pass metadata
      // Search in safeProperties (all properties) not filteredProperties (filtered list)
      const property = safeProperties.find(p => {
        const propId = p.id || p.propertyId || p._id;
        return String(propId) === propertyIdStr || propId === propertyId;
      });
      
      // If not found in safeProperties, try filteredProperties as fallback
      const propertyToSave = property || filteredProperties.find(p => {
        const propId = p.id || p.propertyId || p._id;
        return String(propId) === propertyIdStr || propId === propertyId;
      });
      
      // Call toggleFavorite - it will handle localStorage, events, and Firestore
      // This is the SINGLE SOURCE OF TRUTH for favorite state
      const result = await toggleFavorite(propertyIdStr, propertyToSave);
      
      if (!result || !result.success) {
        throw new Error(result?.error || 'Failed to toggle favorite');
      }
      
      // Verify localStorage was updated correctly
      if (user && user.id) {
        const storageKey = `favorites_${user.id}`;
        const savedFavorites = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const normalizedSaved = savedFavorites.map(id => String(id));
        const isActuallyFavorited = normalizedSaved.includes(propertyIdStr);
        
        if (isActuallyFavorited !== result.favorited) {
          console.warn('Properties: Favorite state mismatch detected, reloading...');
        }
      }
      
      // Reload favorites from localStorage after successful toggle
      // Use a longer delay to ensure toggleFavorite has completed all operations
      setTimeout(() => {
        loadFavorites();
        // Always reset the flag, even if there was an error
        isUpdatingRef.current = false;
      }, 200);
      
    } catch (error) {
      console.error('Properties: Error toggling favorite:', error);
      
      // Always reset the flag on error
      isUpdatingRef.current = false;

      // Revert optimistic update on error
      const revertedFavorites = new Set(favorites);
      if (wasFavorite) {
        revertedFavorites.add(propertyIdStr);
      } else {
        revertedFavorites.delete(propertyIdStr);
      }
      setFavorites(revertedFavorites);
      toast.error(error.message || 'Failed to update saved properties. Please try again.');
    }
  };

  const handleViewDetails = (propertyId) => {
    navigate(`/property/${propertyId}`);
  };

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [viewingMessage, setViewingMessage] = useState('');

  const handleScheduleViewing = (property) => {
    if (!user) {
      toast.error('Please login to schedule viewings');
      // User can continue browsing without being forced to login
      return;
    }
    
    setSelectedProperty(property);
    setShowScheduleModal(true);
  };

  const handleConfirmScheduleViewing = () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Please select both date and time');
      return;
    }

    if (!user || !user.id || !user.firstName || !user.lastName || !user.email) {
      toast.error('User information incomplete. Please refresh and try again.');
      return;
    }

    // Create viewing request data
    const viewingRequest = {
      id: `viewing-${Date.now()}`,
      propertyId: selectedProperty.id,
      propertyTitle: selectedProperty.title,
      propertyLocation: selectedProperty.location,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      status: 'pending_vendor_confirmation',
      requestedAt: new Date().toISOString(),
      preferredDate: selectedDate,
      preferredTime: selectedTime,
      message: viewingMessage,
      agentContact: selectedProperty.agent || {
        name: 'Property Agent',
        phone: '+234-XXX-XXXX',
        email: 'agent@example.com'
      },
      vendorResponse: null,
      confirmedDate: null,
      confirmedTime: null
    };
    
    // Store in localStorage for demo
    const existingRequests = JSON.parse(localStorage.getItem('viewingRequests') || '[]');
    existingRequests.push(viewingRequest);
    localStorage.setItem('viewingRequests', JSON.stringify(existingRequests));
    
    // Dispatch event to notify Dashboard and other components
    window.dispatchEvent(new CustomEvent('viewingsUpdated', {
      detail: { viewingRequest, action: 'created' }
    }));
    
    // Also trigger a storage event for cross-tab synchronization
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'viewingRequests',
      newValue: JSON.stringify(existingRequests)
    }));
    
    toast.success(`Viewing request sent for "${selectedProperty.title}"! The vendor will confirm or suggest an alternative time.`);
    
    // Reset modal
    setShowScheduleModal(false);
    setSelectedProperty(null);
    setSelectedDate('');
    setSelectedTime('');
    setViewingMessage('');
  };

  const handleShareProperty = async (property) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: property.title,
          text: property.description,
          url: `${window.location.origin}/property/${property.id}`
        });
      } catch (error) {
        console.log('Error sharing:', error);
        handleCopyLink(property);
      }
    } else {
      handleCopyLink(property);
    }
  };

  const handleCopyLink = (property) => {
    const url = `${window.location.origin}/property/${property.id}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Property link copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  };

  const handleResetFilters = () => {
    setSelectedType('');
    setSelectedStatus('');
    setPriceRange({ min: '', max: '' });
    setFilters({});
    setCurrentPage(1);
    toast.success('Filters cleared');
  };

  // Pagination logic is now handled above with filteredProperties

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Status helpers currently unused in this layout

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
          {alertName && (
            <div className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              <FaBell className="text-xs" />
              <span>From Alert: {alertName}</span>
            </div>
          )}
        </div>
        <p className="text-gray-600">
          {alertName 
            ? `Properties matching your "${alertName}" alert criteria`
            : "Browse and filter properties to find your perfect match"
          }
        </p>
      </div>

      {/* Active Filters Bar */}
      {(filters.type || filters.status || filters.minPrice || filters.maxPrice) && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-blue-900">Active Filters:</span>
              {filters.type && (
                <span className="px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs">
                  Type: {filters.type}
                </span>
              )}
              {filters.status && (
                <span className="px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs">
                  Status: {filters.status}
                </span>
              )}
              {(filters.minPrice || filters.maxPrice) && (
                <span className="px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs">
                  Price: ₦{filters.minPrice || '0'} - ₦{filters.maxPrice || '∞'}
                </span>
              )}
            </div>
            <button 
              onClick={handleSaveSearch} 
              className="bg-orange-500 text-white px-3 py-1 rounded text-xs flex items-center"
            >
              Save Search
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar - Filters */}
        <div className="w-full lg:w-80 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
          
          {/* Search Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Properties</label>
            <input
              type="text"
              placeholder="Search by title, location, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Price Range */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min Price"
                value={priceRange.min}
                onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="number"
                placeholder="Max Price"
                value={priceRange.max}
                onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Property Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              {filterOptions.types.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Property Status */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              {filterOptions.statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {/* Vendor Search */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search by Vendor</label>
            <input
              type="text"
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              placeholder="Name, email, or Vendor ID (VND-XXXXX)..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {/* Vendor suggestion list intentionally removed — keep text input only */}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button 
              onClick={handleApplyFilters}
              disabled={isApplyingFilters || loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isApplyingFilters || loading ? (
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
              onClick={handleClearFilters}
              disabled={isApplyingFilters || loading}
              className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear All Filters
            </button>
            <button 
              onClick={handleResetFilters}
              disabled={isApplyingFilters || loading}
              className="w-full text-gray-600 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="w-full lg:flex-1">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {filteredProperties.length} Properties Found
              </h2>
              <p className="text-sm text-gray-600">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredProperties.length)} of {filteredProperties.length} properties
                {filteredProperties.length !== safeProperties.length && (
                  <span className="text-blue-600 ml-2">(filtered from {safeProperties.length} total)</span>
                )}
              </p>
            </div>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="mostRecent">Sort by: Most Recent</option>
              <option value="priceLow">Price: Low to High</option>
              <option value="priceHigh">Price: High to Low</option>
              <option value="mostPopular">Most Popular</option>
            </select>
          </div>

          {/* Properties Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <PropertyCardSkeleton count={12} />
            ) : currentProperties.length > 0 ? currentProperties.map((property) => (
              <div key={property.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="relative">
                  <div 
                    onClick={() => handleViewDetails(property.id)}
                    className="cursor-pointer"
                  >
                  <img
                    src={property.image || 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop'}
                    alt={property.title}
                    className="w-full h-48 object-cover"
                  />
                  </div>
                  {property.tag && (
                    <div className={`absolute top-2 left-2 ${property.tagColor || 'bg-orange-500'} text-white px-2 py-1 rounded text-xs font-medium`}>
                      {property.tag}
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex space-x-2 z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(property.id);
                      }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center hover:bg-opacity-75 transition-all ${
                        favorites.has(String(property.id))
                          ? 'bg-red-500 bg-opacity-90'
                          : 'bg-black bg-opacity-50'
                      }`}
                      title={favorites.has(String(property.id)) ? "Remove from favorites" : "Add to favorites"}
                    >
                      <FaHeart className={`text-lg transition-all ${
                        favorites.has(String(property.id)) 
                          ? 'text-red-500 fill-red-500' 
                          : 'text-white'
                      }`} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShareProperty(property);
                      }}
                      className="w-8 h-8 bg-black bg-opacity-50 rounded-full flex items-center justify-center hover:bg-opacity-75 transition-colors"
                    >
                      <FaShare className="text-white text-sm" />
                    </button>
                  </div>
                </div>

                <div 
                  onClick={() => handleViewDetails(property.id)}
                  className="p-4 cursor-pointer"
                >
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    ₦{property.price?.toLocaleString() || '0'}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{property.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{property.location}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center space-x-1">
                      <FaBed />
                      <span>{property.bedrooms || property.details?.bedrooms || 0} Bedrooms</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FaBath />
                      <span>{property.bathrooms || property.details?.bathrooms || 0} Bathrooms</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FaRulerCombined />
                      <span>{property.area || property.details?.sqft || 0}m² Area</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(property.id);
                      }}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center cursor-pointer"
                    >
                      View Details →
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleScheduleViewing(property);
                      }}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                      title={`Schedule a viewing for ${property.title}`}
                    >
                      <FaCalendar className="mr-2" />
                      Schedule Viewing
                    </button>
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 text-lg">No properties found matching your criteria.</p>
                <button 
                  onClick={handleResetFilters}
                  className="mt-4 text-blue-600 hover:text-blue-800"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex items-center space-x-2">
                <button 
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                  className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ‹
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 border rounded text-sm ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="px-2 text-gray-500">...</span>
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
                
                <button 
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                  className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Search Modal */}
      {showSaveSearchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Save Search</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Name
                </label>
                <input
                  type="text"
                  value={saveSearchName}
                  onChange={(e) => setSaveSearchName(e.target.value)}
                  placeholder="e.g., 3-bedroom apartments in Lagos"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <h4 className="font-medium text-gray-900 mb-2">Search Criteria:</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  {selectedType && <p>• Type: {selectedType}</p>}
                  {selectedStatus && <p>• Status: {selectedStatus}</p>}
                  {priceRange.min && <p>• Min Price: ₦{parseInt(priceRange.min).toLocaleString()}</p>}
                  {priceRange.max && <p>• Max Price: ₦{parseInt(priceRange.max).toLocaleString()}</p>}
                  {searchQuery && <p>• Search: "{searchQuery}"</p>}
                  {(!selectedType && !selectedStatus && !priceRange.min && !priceRange.max && !searchQuery) && (
                    <p className="text-gray-500">No specific filters applied</p>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  💡 You'll receive notifications when new properties matching these criteria become available.
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={closeSaveSearchModal}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSaveSearch}
                disabled={!saveSearchName.trim()}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Save Search
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Viewing Modal */}
      {showScheduleModal && selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Schedule Property Viewing</h3>
            <p className="text-gray-600 mb-4">{selectedProperty.title}</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Time</label>
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Time</option>
                  <option value="09:00">9:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="12:00">12:00 PM</option>
                  <option value="13:00">1:00 PM</option>
                  <option value="14:00">2:00 PM</option>
                  <option value="15:00">3:00 PM</option>
                  <option value="16:00">4:00 PM</option>
                  <option value="17:00">5:00 PM</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Message (Optional)</label>
                <textarea
                  value={viewingMessage}
                  onChange={(e) => setViewingMessage(e.target.value)}
                  placeholder="Any specific requirements or questions..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setSelectedProperty(null);
                  setSelectedDate('');
                  setSelectedTime('');
                  setViewingMessage('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmScheduleViewing}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Request Viewing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Properties;