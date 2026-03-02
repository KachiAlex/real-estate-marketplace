import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProperty } from '../contexts/PropertyContext';
import { useAuth } from '../contexts/AuthContext';
import { FaBed, FaBath, FaRulerCombined, FaHeart, FaShare, FaPhone, FaEnvelope, FaMapMarkerAlt, FaCalendar, FaShoppingCart, FaWhatsapp, FaCreditCard, FaLock, FaArrowLeft } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { createInspectionRequest } from '../services/inspectionService';
import Breadcrumbs from '../components/Breadcrumbs';
import PropertyPurchaseButton from '../components/PropertyPurchaseButton';
import frontendMockProperties from '../data/mockProperties';
import { formatCurrency } from '../utils/currency';

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { properties, loading, error, toggleFavorite } = useProperty();
  const { user, setAuthRedirect } = useAuth();
  const [property, setProperty] = useState(null);

  const [activeImage, setActiveImage] = useState(0);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  const mergedProperties = useMemo(() => {
    const map = new Map();
    if (Array.isArray(frontendMockProperties)) {
      frontendMockProperties.forEach((prop) => {
        if (prop && (prop.id || prop.propertyId)) {
          map.set(prop.id || prop.propertyId, prop);
        }
      });
    }
    if (Array.isArray(properties)) {
      properties.forEach((prop) => {
        if (prop && (prop.id || prop.propertyId)) {
          map.set(prop.id || prop.propertyId, prop);
        }
      });
    }
    return Array.from(map.values());
  }, [properties]);

  useEffect(() => {
    if (mergedProperties && id) {
      console.log('PropertyDetail: Looking for property with id:', id);
      console.log('PropertyDetail: Available properties:', mergedProperties.map(p => ({ id: p.id, propertyId: p.propertyId })));
      
      const foundProperty = mergedProperties.find(p => {
        // Normalize IDs for comparison
        const propId = String(p.id || '').toLowerCase();
        const propPropertyId = String(p.propertyId || '').toLowerCase();
        const searchId = String(id || '').toLowerCase();
        
        return propId === searchId || 
               propPropertyId === searchId || 
               propId === `prop_${searchId}` ||
               propPropertyId === `prop_${searchId}`;
      });
      
      console.log('PropertyDetail: Found property:', foundProperty?.id);
      
      if (foundProperty) {
        // Ensure location data is properly set
        if (foundProperty.location && typeof foundProperty.location === 'string' && foundProperty.location.includes('undefined')) {
          // If location string has undefined, reconstruct from separate properties
          const parts = [
            foundProperty.address,
            foundProperty.city,
            foundProperty.state
          ].filter(part => part && part !== 'undefined' && part !== undefined && part !== null);
          
          if (parts.length > 0) {
            foundProperty.location = parts.join(', ');
          }
        }
        
        setProperty(foundProperty);
        // Reset activeImage when property changes
        setActiveImage(0);
      } else {
        console.warn('PropertyDetail: Property not found for id:', id);
      }
    }
  }, [mergedProperties, id]);

  // Check if property is favorited
  useEffect(() => {
    if (property && user && user.id) {
      const key = `favorites_${user.id}`;
      const favorites = new Set(JSON.parse(localStorage.getItem(key) || '[]'));
      setIsFavorite(favorites.has(property.id));
    } else {
      setIsFavorite(false);
    }
  }, [property, user]);

  // Get the current image URL based on activeImage index
  const getCurrentImage = () => {
    if (!property) return 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop';
    
    // Check if property has images array
    if (property.images && Array.isArray(property.images) && property.images.length > 0) {
      // Ensure activeImage is within bounds
      const safeIndex = Math.max(0, Math.min(activeImage, property.images.length - 1));
      const currentImage = property.images[safeIndex];
      
      // Handle both string URLs and object with url property
      if (typeof currentImage === 'string') {
        return currentImage;
      } else if (currentImage && currentImage.url) {
        return currentImage.url;
      }
    }
    
    // Fallback to property.image if available
    if (property.image) {
      return property.image;
    }
    
    return 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop';
  };

  // Get image URL for thumbnails
  const getImageUrl = (image) => {
    if (typeof image === 'string') {
      return image;
    } else if (image && image.url) {
      return image.url;
    }
    return 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=80&h=80&fit=crop';
  };

  const handleToggleFavorite = async () => {
    if (!user || !user.id) {
      toast.error('Please login to add favorites');
      // User can continue viewing the property without being forced to login
      return;
    }
    
    if (!property || !property.id) {
      toast.error('Property information not available');
      return;
    }

    const storageKey = `favorites_${user.id}`;
    const wasFavorite = isFavorite;
    const propertyIdStr = String(property.id);

    // Optimistic UI update
    setIsFavorite(!wasFavorite);
    let updatedFavorites;
    try {
      const existing = new Set(JSON.parse(localStorage.getItem(storageKey) || '[]'));
      if (wasFavorite) {
        existing.delete(propertyIdStr);
        toast.success('Property removed from saved properties');
      } else {
        existing.add(propertyIdStr);
        toast.success('Property added to saved properties');
      }
      updatedFavorites = Array.from(existing);
      localStorage.setItem(storageKey, JSON.stringify(updatedFavorites));
    } catch {
      // ignore localStorage errors
    }

    try {
      const result = await toggleFavorite(propertyIdStr, property);
      if (!result || result.success === undefined) {
        throw new Error('Failed to toggle favorite on server');
      }
      
      // Dispatch event to notify other components (like Dashboard)
      window.dispatchEvent(new CustomEvent('favoritesUpdated', {
        detail: { propertyId: propertyIdStr, favorited: !wasFavorite }
      }));
      
      // Also trigger a storage event for cross-tab synchronization
      if (updatedFavorites) {
        window.dispatchEvent(new StorageEvent('storage', {
          key: storageKey,
          newValue: JSON.stringify(updatedFavorites)
        }));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);

      // Revert optimistic UI on error
      setIsFavorite(wasFavorite);
      try {
        const existing = new Set(JSON.parse(localStorage.getItem(storageKey) || '[]'));
        if (wasFavorite) {
          existing.add(propertyIdStr);
        } else {
          existing.delete(propertyIdStr);
        }
        localStorage.setItem(storageKey, JSON.stringify(Array.from(existing)));
      } catch {
        // ignore localStorage errors
      }

      toast.error('Failed to update saved properties. Please try again.');
    }
  };

  const handleShareProperty = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: property.title,
          text: property.description,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      toast.success('Property link copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  };

  const createInquiry = (property, inquiryType, message = '') => {
    if (!user || !user.id || !property) {
      console.warn('createInquiry: Missing user or property information');
      return;
    }

    // Check if inquiry already exists for this property and user
    const existingInquiries = JSON.parse(localStorage.getItem('inquiries') || '[]');
    const existingInquiry = existingInquiries.find(
      inq => inq.propertyId === property.id && 
             (inq.userId === user.id || inq.buyerId === user.id) &&
             (inq.status === 'new' || inq.status === 'pending' || inq.status === 'contacted')
    );

    // If inquiry already exists, don't create duplicate
    if (existingInquiry) {
      return existingInquiry;
    }

    // Create new inquiry
    const inquiry = {
      id: `inquiry-${Date.now()}`,
      propertyId: property.id,
      propertyTitle: property.title,
      propertyLocation: typeof property.location === 'string' 
        ? property.location 
        : property.location?.address || property.location?.city || 'Location not specified',
      propertyPrice: property.price || 0,
      propertyImage: property.images?.[0]?.url || property.image || property.images?.[0] || '',
      propertyBedrooms: property.bedrooms || property.details?.bedrooms || 0,
      propertyBathrooms: property.bathrooms || property.details?.bathrooms || 0,
      propertyArea: property.area || property.details?.sqft || 0,
      userId: user.id,
      buyerId: user.id,
      buyerName: `${user.firstName} ${user.lastName}`,
      buyerEmail: user.email,
      buyerPhone: user.phone || '',
      vendorId: property.vendorId || property.owner?.id || property.vendor?.id || '',
      vendorName: property.owner?.firstName 
        ? `${property.owner.firstName} ${property.owner.lastName || ''}`.trim()
        : property.vendor?.firstName 
        ? `${property.vendor.firstName} ${property.vendor.lastName || ''}`.trim()
        : 'Property Vendor',
      vendorEmail: property.owner?.email || property.vendor?.email || property.vendorEmail || '',
      vendorPhone: property.owner?.phone || property.vendorPhone || property.contactPhone || property.vendor?.phone || '',
      inquiryType: inquiryType, // 'call' or 'message'
      message: message || `I'm interested in ${property.title}. Please contact me.`,
      status: 'new',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      responses: []
    };

    // Save to localStorage
    existingInquiries.push(inquiry);
    localStorage.setItem('inquiries', JSON.stringify(existingInquiries));

    // Dispatch event to notify dashboard
    window.dispatchEvent(new CustomEvent('inquiriesUpdated', {
      detail: { inquiry, action: 'created' }
    }));
    
    // Also trigger a storage event for cross-tab synchronization
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'inquiries',
      newValue: JSON.stringify(existingInquiries)
    }));

    return inquiry;
  };

  const handleContactOwner = () => {
    console.log('Contact Owner clicked, property:', property, 'user:', user);
    
    if (!user) {
      toast.error('Please login to contact property vendor');
      // User can continue viewing the property without being forced to login
      return;
    }
    
    // Create inquiry
    createInquiry(property, 'message', `I'm interested in ${property.title}. Please contact me via WhatsApp.`);
    
    // Get vendor's phone number
    const vendorPhone = property?.owner?.phone || property?.vendorPhone || property?.contactPhone || property?.vendor?.phone;
    
    if (!vendorPhone) {
      toast.error('Vendor phone number not available');
      return;
    }
    
    // Format phone number for WhatsApp
    // Remove all non-digit characters
    let formattedPhone = vendorPhone.replace(/\D/g, '');
    
    // Handle Nigerian phone numbers (country code: 234)
    if (formattedPhone.startsWith('234')) {
      // Already has country code, no change needed
    } else if (formattedPhone.startsWith('0')) {
      // Remove leading 0 and add country code
      formattedPhone = '234' + formattedPhone.substring(1);
    } else {
      // Add country code if missing
      formattedPhone = '234' + formattedPhone;
    }
    
    // Create WhatsApp message
    const propertyTitle = property?.title || 'Property';
    const propertyPrice = property?.price ? formatCurrency(property.price) : '';
    const message = encodeURIComponent(
      `Hi, I'm interested in your property: ${propertyTitle}${propertyPrice ? ` (${propertyPrice})` : ''}. Could you please provide more information?`
    );
    
    // Open WhatsApp
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${message}`;
    window.open(whatsappUrl, '_blank');
    
    toast.success('Opening WhatsApp... Inquiry saved to My Inquiries.');
  };

  const handleSendInquiry = () => {
    if (!inquiryMessage.trim()) {
      toast.error('Please enter your message');
      return;
    }
    
    // Simulate sending inquiry
    toast.success('Inquiry sent successfully! The vendor will contact you soon.');
    setShowInquiryModal(false);
    setInquiryMessage('');
  };

  const handleScheduleViewing = () => {
    if (!user) {
      toast.error('Please login to schedule a viewing');
      // User can continue viewing the property without being forced to login
      return;
    }
    // Open scheduling modal to pick date/time
    setShowScheduleModal(true);
  };

  const handleConfirmSchedule = async () => {
    if (!preferredDate || !preferredTime) {
      toast.error('Please select a preferred date and time');
      return;
    }

    if (!user || !user.id || !user.firstName || !user.lastName || !user.email) {
      toast.error('User information incomplete. Please refresh and try again.');
      return;
    }

    const viewingRequest = {
      id: `viewing-${Date.now()}`,
      propertyId: property.id,
      propertyTitle: property.title,
      propertyLocation: property.location,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      status: 'pending_vendor',
      requestedAt: new Date().toISOString(),
      preferredDate,
      preferredTime,
      message: '',
      agentContact: property.agent || {
        name: 'Property Agent',
        phone: '+234-XXX-XXXX',
        email: 'agent@example.com'
      },
      // Map to inspection request fields expected by vendor screen
      projectId: property.id,
      projectName: property.title,
      projectLocation: property.location?.address || property.location || '',
      buyerName: `${user.firstName} ${user.lastName}`,
      buyerEmail: user.email,
      vendorId: property.vendorId || property.owner?.id || undefined,
      vendorEmail: property.vendorEmail || property.owner?.email || undefined
    };
    try {
      await createInspectionRequest(viewingRequest);
      // Event is dispatched by createInspectionRequest service
      setShowScheduleModal(false);
      setPreferredDate('');
      setPreferredTime('');
      toast.success('Viewing scheduled! The vendor has been notified.');
      toast(`Agent: ${viewingRequest.agentContact.name} | Phone: ${viewingRequest.agentContact.phone}`);
    } catch (e) {
      toast.error('Failed to create request');
    }
  };

  const handleCallVendor = () => {
    if (!user) {
      toast.error('Please login to call property vendor');
      // User can continue viewing the property without being forced to login
      return;
    }

    // Create inquiry
    createInquiry(property, 'call', `I'm interested in ${property.title}. Please contact me via phone call.`);
    
    // Get vendor's phone number
    const vendorPhone = property?.owner?.phone || property?.vendorPhone || property?.contactPhone || property?.vendor?.phone;
    
    if (!vendorPhone) {
      toast.error('Vendor phone number not available');
      return;
    }
    
    // Format phone number for tel: link
    // Remove all non-digit characters
    let formattedPhone = vendorPhone.replace(/\D/g, '');
    
    // Handle Nigerian phone numbers (country code: 234)
    if (formattedPhone.startsWith('234')) {
      // Already has country code
    } else if (formattedPhone.startsWith('0')) {
      // Remove leading 0 and add country code
      formattedPhone = '234' + formattedPhone.substring(1);
    } else {
      // Assume it's a local number, add country code
      formattedPhone = '234' + formattedPhone;
    }
    
    // Create tel: link and trigger phone dialer
    window.location.href = `tel:+${formattedPhone}`;
    
    toast.success('Inquiry saved to My Inquiries.');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Property</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Breadcrumbs items={[
            { label: 'Home', path: '/' },
            { label: 'Properties', path: '/properties' },
            { label: 'Property Not Found', path: '#' }
          ]} />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Property Not Found</h2>
          <p className="text-gray-600">The property you're looking for doesn't exist.</p>
          <Link to="/properties" className="mt-4 inline-block text-blue-600 hover:text-blue-500">
            Back to Properties
          </Link>
        </div>
      </div>
    );
  }

  // Breadcrumb items for property detail
  const breadcrumbItems = [
    { label: 'Home', path: '/' },
    { label: 'Properties', path: '/properties' },
    { label: property?.title || 'Property Details', path: `#` }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="mb-8">
              <div className="relative">
                <img
                  src={getCurrentImage()}
                  alt={property.title}
                  className="w-full h-96 object-cover rounded-lg"
                  key={`main-image-${activeImage}`}
                />
                <div className="absolute top-4 right-4 flex gap-2">
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium price-inline">
                    {formatCurrency(property.price || 0)}
                  </span>
                  <button
                    onClick={handleToggleFavorite}
                    className={`bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-colors ${
                      isFavorite ? 'text-red-500' : ''
                    }`}
                    title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <FaHeart className={isFavorite ? 'fill-current' : ''} />
                  </button>
                  <button
                    onClick={handleShareProperty}
                    className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-colors"
                  >
                    <FaShare />
                  </button>
                </div>
              </div>
              
              {/* Thumbnail Images */}
              {property.images && Array.isArray(property.images) && property.images.length > 1 && (
                <div className="mt-4 flex space-x-2 overflow-x-auto pb-2">
                  {property.images.map((image, index) => (
                    <button
                      key={`thumb-${index}`}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveImage(index);
                      }}
                      className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all ${
                        activeImage === index 
                          ? 'border-blue-500 ring-2 ring-blue-300 ring-offset-2' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={getImageUrl(image)}
                        alt={`${property.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Property Details */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{property.title}</h1>
              <p className="text-lg text-gray-600 mb-6">
                {(() => {
                  if (typeof property.location === 'string') {
                    return property.location;
                  }
                  if (property.location && typeof property.location === 'object') {
                    const address = property.location.address || '';
                    const city = property.location.city || '';
                    const state = property.location.state || '';
                    const result = [address, city, state].filter(Boolean).join(', ');
                    return result || 'Location not specified';
                  }
                  return 'Location not specified';
                })()}
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 flex items-center justify-center">
                    <FaBed className="mr-2" />
                    {property.bedrooms || property.details?.bedrooms || 0}
                  </div>
                  <div className="text-sm text-gray-500">Bedrooms</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 flex items-center justify-center">
                    <FaBath className="mr-2" />
                    {property.bathrooms || property.details?.bathrooms || 0}
                  </div>
                  <div className="text-sm text-gray-500">Bathrooms</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 flex items-center justify-center">
                    <FaRulerCombined className="mr-2" />
                    {property.area || property.details?.sqft || 0}
                  </div>
                  <div className="text-sm text-gray-500">Sq Ft</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 capitalize">
                    {property.type}
                  </div>
                  <div className="text-sm text-gray-500">Type</div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
                <p className="text-gray-600 leading-relaxed">{property.description}</p>
              </div>
            </div>

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Amenities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {property.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={handleContactOwner}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <FaWhatsapp className="mr-2" />
                  Contact Vendor
                </button>
                <button
                  onClick={handleScheduleViewing}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <FaCalendar className="mr-2" />
                  Schedule Viewing
                </button>
                <button
                  onClick={handleCallVendor}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <FaPhone className="mr-2" />
                  Call Vendor
                </button>
              </div>
            </div>

            {/* Vendor Information */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Vendor</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                    <span className="text-gray-600 font-semibold">
                      {property.owner?.firstName?.[0] || property.vendor?.firstName?.[0] || 'V'}
                      {property.owner?.lastName?.[0] || property.vendor?.lastName?.[0] || 'D'}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {property.owner?.firstName || property.vendor?.firstName || 'Vendor'} {property.owner?.lastName || property.vendor?.lastName || ''}
                    </div>
                    <div className="text-sm text-gray-500">Property Vendor</div>
                  </div>
                </div>
                <div className="pt-3 border-t">
                  <div className="flex items-start text-gray-600 mb-3">
                    <FaMapMarkerAlt className="mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">
                      {(() => {
                        // First, try to get location from separate address, city, state properties (most reliable)
                        const address = property.address || '';
                        const city = property.city || '';
                        const state = property.state || '';
                        const zipCode = property.zipCode || '';
                        
                        if (address || city || state) {
                          const parts = [address, city, state, zipCode].filter(part => part && part !== '' && part !== null && part !== undefined && part !== 'undefined');
                          if (parts.length > 0) {
                            return parts.join(', ');
                          }
                        }
                        
                        // Handle object location - check if fields exist and are not undefined
                        if (property.location && typeof property.location === 'object') {
                          const objAddress = property.location.address;
                          const objCity = property.location.city;
                          const objState = property.location.state;
                          const objZipCode = property.location.zipCode;
                          
                          const parts = [objAddress, objCity, objState, objZipCode].filter(part => part && part !== '' && part !== null && part !== undefined && part !== 'undefined');
                          if (parts.length > 0) {
                            return parts.join(', ');
                          }
                        }
                        
                        // Handle string location (from transformed properties) - but check it doesn't contain "undefined"
                        if (typeof property.location === 'string' && property.location.trim() !== '' && !property.location.includes('undefined')) {
                          return property.location;
                        }
                        
                        return 'Location not specified';
                      })()}
                    </span>
                  </div>
                  
                  {/* Listing Date */}
                  {property.createdAt && (
                    <div className="flex items-center text-gray-600 mb-3 text-sm">
                      <FaCalendar className="mr-2" />
                      <span>
                        Listed: {(() => {
                          const date = new Date(property.createdAt);
                          if (isNaN(date.getTime())) {
                            return property.createdAt;
                          }
                          return date.toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          });
                        })()}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center text-gray-600 text-sm">
                    <span>Views: {property.views || 0}</span>
                    <span className="mx-2">•</span>
                    <span>
                      {property.isVerified ? '✅ Verified' : '⏳ Pending Verification'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Purchase Information */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Property Value:</span>
                  <span className="font-semibold price-inline">{formatCurrency(property.price || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Property Type:</span>
                  <span className="font-semibold capitalize">{property.status?.replace('-', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Escrow Fee (0.5%):</span>
                  <span className="font-semibold price-inline">{formatCurrency(Math.round((property.price || 0) * 0.005))}</span>
                </div>
                <div className="flex justify-between border-t pt-3">
                  <span className="text-gray-900 font-semibold">Total Amount:</span>
                  <span className="font-bold text-lg price-inline">{formatCurrency(Math.round((property.price || 0) * 1.005))}</span>
                </div>
              </div>
              
              <div className="mt-4 space-y-2">
                <PropertyPurchaseButton
                  property={property}
                  className="bg-green-600 hover:bg-green-700"
                />
              </div>
            </div>

            {/* Property Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Property ID:</span>
                  <span className="font-medium">{property.id}</span>
                </div>
                {property.createdAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Listed:</span>
                    <span className="font-medium">
                      {(() => {
                        const date = new Date(property.createdAt);
                        if (isNaN(date.getTime())) {
                          return property.createdAt || property.dateListed || 'N/A';
                        }
                        return date.toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        });
                      })()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-green-600">Available</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Vendor:</span>
                  <span className="font-medium">{property.ownerName || `${property.owner?.firstName || property.vendor?.firstName || ''} ${property.owner?.lastName || property.vendor?.lastName || ''}`.trim() || 'Vendor'}</span>
                </div>
                
                {/* Location link */}
                {property.location?.googleMapsUrl && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Location</h4>
                    <div className="space-y-2">
                      <a
                        href={property.location.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center w-full px-3 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors text-sm"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Show on Google map
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inquiry Modal */}
      {showInquiryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Send Inquiry</h3>
              <button
                onClick={() => setShowInquiryModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Send a message to the property vendor about <strong>{property.title}</strong>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Message</label>
                <textarea
                  value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="I'm interested in this property. Could you please provide more information about..."
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowInquiryModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendInquiry}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Viewing Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Schedule Viewing</h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date</label>
                <input
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Time</label>
                <input
                  type="time"
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSchedule}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetail;