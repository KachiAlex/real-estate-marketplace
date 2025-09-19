import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProperty } from '../contexts/PropertyContext';
import { useAuth } from '../contexts/AuthContext';
import { FaBed, FaBath, FaRulerCombined, FaHeart, FaShare, FaPhone, FaEnvelope, FaMapMarkerAlt, FaCalendar, FaShoppingCart } from 'react-icons/fa';
import toast from 'react-hot-toast';

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { properties, loading, error, toggleFavorite } = useProperty();
  const { user, setAuthRedirect } = useAuth();
  const [property, setProperty] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState('');

  useEffect(() => {
    if (properties && id) {
      const foundProperty = properties.find(p => p.id === id);
      setProperty(foundProperty);
    }
  }, [properties, id]);

  const handleToggleFavorite = async () => {
    if (!user) {
      toast.error('Please login to add favorites');
      navigate('/login');
      return;
    }
    await toggleFavorite(property.id);
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

  const handleContactOwner = () => {
    if (!user) {
      toast.error('Please login to contact property owner');
      navigate('/login');
      return;
    }
    setShowInquiryModal(true);
  };

  const handleSendInquiry = () => {
    if (!inquiryMessage.trim()) {
      toast.error('Please enter your message');
      return;
    }
    
    // Simulate sending inquiry
    toast.success('Inquiry sent successfully! The owner will contact you soon.');
    setShowInquiryModal(false);
    setInquiryMessage('');
  };

  const handleScheduleViewing = () => {
    if (!user) {
      toast.error('Please login to schedule a viewing');
      navigate('/login');
      return;
    }
    toast.success('Viewing request sent! The agent will contact you to confirm.');
  };

  const handleStartEscrow = () => {
    if (!user) {
      // Set redirect URL to return to payment flow after login
      const redirectUrl = `/escrow/create?propertyId=${property.id}&type=purchase`;
      setAuthRedirect(redirectUrl);
      toast.error('Please login to start escrow process');
      navigate('/login');
      return;
    }
    navigate(`/escrow/create?propertyId=${property.id}&type=purchase`);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Property Not Found</h2>
          <p className="text-gray-600">The property you're looking for doesn't exist.</p>
          <Link to="/properties" className="mt-4 inline-block text-blue-600 hover:text-blue-500">
            Back to Properties
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li><Link to="/" className="hover:text-gray-700">Home</Link></li>
            <li>/</li>
            <li><Link to="/properties" className="hover:text-gray-700">Properties</Link></li>
            <li>/</li>
            <li className="text-gray-900">{property.title}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="mb-8">
              <div className="relative">
                <img
                  src={property.images?.[activeImage]?.url || property.image || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop'}
                  alt={property.title}
                  className="w-full h-96 object-cover rounded-lg"
                />
                <div className="absolute top-4 right-4 flex gap-2">
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    ₦{property.price?.toLocaleString()}
                  </span>
                  <button
                    onClick={handleToggleFavorite}
                    className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-colors"
                  >
                    <FaHeart />
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
              {property.images && property.images.length > 1 && (
                <div className="mt-4 flex space-x-2 overflow-x-auto">
                  {property.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImage(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 ${
                        activeImage === index ? 'border-blue-500' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={image?.url || image || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=80&h=80&fit=crop'}
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
              <p className="text-lg text-gray-600 mb-6">{property.location}</p>
              
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
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <FaEnvelope className="mr-2" />
                  Contact Owner
                </button>
                <button
                  onClick={handleScheduleViewing}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <FaCalendar className="mr-2" />
                  Schedule Viewing
                </button>
                <button
                  onClick={handleStartEscrow}
                  className="w-full bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 transition-colors"
                >
                  Start Escrow Process
                </button>
              </div>
            </div>

            {/* Owner Information */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Owner</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                    <span className="text-gray-600 font-semibold">
                      {property.owner?.firstName?.[0]}{property.owner?.lastName?.[0]}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {property.owner?.firstName} {property.owner?.lastName}
                    </div>
                    <div className="text-sm text-gray-500">Property Owner</div>
                  </div>
                </div>
                <div className="pt-3 border-t">
                  <div className="flex items-center text-gray-600 mb-2">
                    <FaMapMarkerAlt className="mr-2" />
                    <span>{property.location}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <span className="text-sm">Views: {property.views || 0}</span>
                    <span className="mx-2">•</span>
                    <span className="text-sm">
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
                  <span className="font-semibold">₦{property.price?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Property Type:</span>
                  <span className="font-semibold capitalize">{property.status?.replace('-', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Escrow Fee (0.5%):</span>
                  <span className="font-semibold">₦{Math.round((property.price || 0) * 0.005).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t pt-3">
                  <span className="text-gray-900 font-semibold">Total Amount:</span>
                  <span className="font-bold text-lg">₦{Math.round((property.price || 0) * 1.005).toLocaleString()}</span>
                </div>
              </div>
              
              <div className="mt-4 space-y-2">
                <button
                  onClick={handleStartEscrow}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <FaShoppingCart className="mr-2" />
                  {property.status === 'for-sale' ? 'Buy Property' : property.status === 'for-rent' ? 'Rent Property' : 'Lease Property'}
                </button>
                
                <p className="text-xs text-gray-500 text-center">
                  Secure transaction protected by escrow service
                </p>
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
                <div className="flex justify-between">
                  <span className="text-gray-600">Listed:</span>
                  <span className="font-medium">{property.dateListed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-green-600">Available</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Owner:</span>
                  <span className="font-medium">{property.ownerName}</span>
                </div>
                
                {/* Location Links */}
                {property.location?.coordinates?.latitude && property.location?.coordinates?.longitude && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Location</h4>
                    <div className="space-y-2">
                      <a
                        href={`https://www.google.com/maps?q=${property.location.coordinates.latitude},${property.location.coordinates.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center w-full px-3 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors text-sm"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        View Property on Google Maps
                      </a>
                      
                      {property.location?.nearestBusStop?.coordinates?.latitude && property.location?.nearestBusStop?.coordinates?.longitude && (
                        <a
                          href={`https://www.google.com/maps?q=${property.location.nearestBusStop.coordinates.latitude},${property.location.nearestBusStop.coordinates.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center w-full px-3 py-2 bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors text-sm"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          View Nearest Bus Stop
                        </a>
                      )}
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
                Send a message to the property owner about <strong>{property.title}</strong>
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
    </div>
  );
};

export default PropertyDetail; 