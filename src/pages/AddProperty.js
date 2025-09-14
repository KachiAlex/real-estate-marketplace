import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProperty } from '../contexts/PropertyContext';
import { useAuth } from '../contexts/AuthContext';
import PropertyImageUpload from '../components/PropertyImageUpload';
import { FaHome, FaMapMarkerAlt, FaBed, FaBath, FaRulerCombined, FaDollarSign, FaBuilding, FaPlus, FaTimes, FaCheck, FaUpload, FaMapPin, FaBus, FaFileAlt, FaVideo, FaImage } from 'react-icons/fa';

const AddProperty = () => {
  const navigate = useNavigate();
  const { createProperty } = useProperty();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    type: '',
    status: '', // for-sale, for-rent, for-lease
    location: {
      address: '',
      city: '',
      state: '',
      zipCode: '',
      coordinates: {
        latitude: '',
        longitude: ''
      },
      nearestBusStop: {
        name: '',
        distance: '',
        coordinates: {
          latitude: '',
          longitude: ''
        }
      }
    },
    details: {
      bedrooms: '',
      bathrooms: '',
      sqft: '',
      yearBuilt: '',
      lotSize: '',
      parking: '',
      heating: '',
      cooling: ''
    },
    amenities: [],
    images: [],
    videos: [],
    documentation: []
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [amenityInput, setAmenityInput] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [videoFiles, setVideoFiles] = useState([]);
  const [documentFiles, setDocumentFiles] = useState([]);

  const propertyTypes = ['house', 'apartment', 'condo', 'townhouse', 'land', 'commercial'];
  const propertyStatuses = ['for-sale', 'for-rent', 'for-lease'];
  const commonAmenities = ['Parking', 'Garden', 'Balcony', 'Pool', 'Gym', 'Security', 'Air Conditioning', 'Heating', 'Hardwood Floors', 'Fireplace', 'Walk-in Closet', 'Patio', 'High-Speed Internet'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      if (parent === 'location' && child === 'address') {
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            address: value
          }
        }));
      } else if (parent === 'location' && child === 'city') {
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            city: value
          }
        }));
      } else if (parent === 'location' && child === 'state') {
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            state: value
          }
        }));
      } else if (parent === 'location' && child === 'zipCode') {
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            zipCode: value
          }
        }));
      } else if (name.includes('coordinates.')) {
        const coordType = name.split('.')[1];
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            coordinates: {
              ...prev.location.coordinates,
              [coordType]: parseFloat(value) || ''
            }
          }
        }));
      } else if (name.includes('busStop.')) {
        const busStopType = name.split('.')[1];
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            nearestBusStop: {
              ...prev.location.nearestBusStop,
              [busStopType]: value
            }
          }
        }));
      } else if (name.includes('busStopCoordinates.')) {
        const coordType = name.split('.')[1];
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            nearestBusStop: {
              ...prev.location.nearestBusStop,
              coordinates: {
                ...prev.location.nearestBusStop.coordinates,
                [coordType]: parseFloat(value) || ''
              }
            }
          }
        }));
      } else if (name.includes('details.')) {
        const detailType = name.split('.')[1];
        setFormData(prev => ({
          ...prev,
          details: {
            ...prev.details,
            [detailType]: value
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleAmenityAdd = () => {
    if (amenityInput.trim() && !formData.amenities.includes(amenityInput.trim())) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, amenityInput.trim()]
      }));
      setAmenityInput('');
    }
  };

  const handleAmenityRemove = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(a => a !== amenity)
    }));
  };

  const handleFileUpload = (e, type) => {
    const files = Array.from(e.target.files);
    
    if (type === 'images') {
      setImageFiles(prev => [...prev, ...files]);
    } else if (type === 'videos') {
      setVideoFiles(prev => [...prev, ...files]);
    } else if (type === 'documents') {
      setDocumentFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index, type) => {
    if (type === 'images') {
      setImageFiles(prev => prev.filter((_, i) => i !== index));
    } else if (type === 'videos') {
      setVideoFiles(prev => prev.filter((_, i) => i !== index));
    } else if (type === 'documents') {
      setDocumentFiles(prev => prev.filter((_, i) => i !== index));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title) newErrors.title = 'Title is required';
    if (!formData.description) newErrors.description = 'Description is required';
    if (!formData.price) newErrors.price = 'Price is required';
    if (!formData.type) newErrors.type = 'Property type is required';
    if (!formData.status) newErrors.status = 'Property status is required';
    if (!formData.location.address) newErrors['location.address'] = 'Address is required';
    if (!formData.location.city) newErrors['location.city'] = 'City is required';
    if (!formData.location.state) newErrors['location.state'] = 'State is required';
    if (!formData.details.bedrooms) newErrors['details.bedrooms'] = 'Number of bedrooms is required';
    if (!formData.details.bathrooms) newErrors['details.bathrooms'] = 'Number of bathrooms is required';
    if (!formData.details.sqft) newErrors['details.sqft'] = 'Square footage is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      // Convert files to base64 for demo (in production, upload to cloud storage)
      const processFiles = (files) => {
        return files.map((file, index) => ({
          url: URL.createObjectURL(file), // For demo, use object URL
          isPrimary: index === 0,
          caption: file.name
        }));
      };

      const propertyData = {
        ...formData,
        price: parseFloat(formData.price),
        details: {
          ...formData.details,
          bedrooms: parseInt(formData.details.bedrooms),
          bathrooms: parseInt(formData.details.bathrooms),
          sqft: parseInt(formData.details.sqft),
          yearBuilt: formData.details.yearBuilt ? parseInt(formData.details.yearBuilt) : null
        },
        images: processFiles(imageFiles),
        videos: processFiles(videoFiles),
        documentation: processFiles(documentFiles)
      };
      
      const result = await createProperty(propertyData);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setErrors({ general: result.message });
      }
    } catch (error) {
      setErrors({ general: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <FaHome className="text-white text-3xl" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Add New Property</h1>
          <p className="text-xl text-gray-600">List your property with comprehensive details</p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-xl">
                <p className="font-medium">{errors.general}</p>
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <FaBuilding className="text-white text-lg" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Basic Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Property Title</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                        errors.title ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                      }`}
                      placeholder="e.g., Beautiful 3-bedroom house"
                    />
                    <FaHome className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                  </div>
                  {errors.title && <p className="mt-2 text-sm text-red-600">{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Property Type</label>
                  <div className="relative">
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                        errors.type ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                      }`}
                    >
                      <option value="">Select type</option>
                      {propertyTypes.map(type => (
                        <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                      ))}
                    </select>
                    <FaBuilding className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                  </div>
                  {errors.type && <p className="mt-2 text-sm text-red-600">{errors.type}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Property Status</label>
                  <div className="relative">
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                        errors.status ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                      }`}
                    >
                      <option value="">Select status</option>
                      {propertyStatuses.map(status => (
                        <option key={status} value={status}>
                          {status === 'for-sale' ? 'For Sale' : 
                           status === 'for-rent' ? 'For Rent' : 'For Lease'}
                        </option>
                      ))}
                    </select>
                    <FaCheck className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                  </div>
                  {errors.status && <p className="mt-2 text-sm text-red-600">{errors.status}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Price ($)</label>
                  <div className="relative">
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                        errors.price ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                      }`}
                      placeholder="500000"
                    />
                    <FaDollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                  </div>
                  {errors.price && <p className="mt-2 text-sm text-red-600">{errors.price}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  className={`w-full px-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                    errors.description ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                  }`}
                  placeholder="Describe your property in detail..."
                />
                {errors.description && <p className="mt-2 text-sm text-red-600">{errors.description}</p>}
              </div>
            </div>

            {/* Location Information */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <FaMapMarkerAlt className="text-white text-lg" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Location Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Address</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="location.address"
                      value={formData.location.address}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                        errors['location.address'] ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                      }`}
                      placeholder="123 Main St"
                    />
                    <FaMapMarkerAlt className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                  </div>
                  {errors['location.address'] && <p className="mt-2 text-sm text-red-600">{errors['location.address']}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">City</label>
                  <input
                    type="text"
                    name="location.city"
                    value={formData.location.city}
                    onChange={handleChange}
                    className={`w-full px-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                      errors['location.city'] ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                    }`}
                    placeholder="New York"
                  />
                  {errors['location.city'] && <p className="mt-2 text-sm text-red-600">{errors['location.city']}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">State</label>
                  <input
                    type="text"
                    name="location.state"
                    value={formData.location.state}
                    onChange={handleChange}
                    className={`w-full px-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                      errors['location.state'] ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                    }`}
                    placeholder="NY"
                  />
                  {errors['location.state'] && <p className="mt-2 text-sm text-red-600">{errors['location.state']}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">ZIP Code</label>
                  <input
                    type="text"
                    name="location.zipCode"
                    value={formData.location.zipCode}
                    onChange={handleChange}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                    placeholder="10001"
                  />
                </div>
              </div>

              {/* Geo Coordinates */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-700 flex items-center">
                  <FaMapPin className="mr-2 text-blue-600" />
                  Geographic Coordinates
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      name="coordinates.latitude"
                      value={formData.location.coordinates.latitude}
                      onChange={handleChange}
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                      placeholder="40.7128"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      name="coordinates.longitude"
                      value={formData.location.coordinates.longitude}
                      onChange={handleChange}
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                      placeholder="-74.0060"
                    />
                  </div>
                </div>
                
                {/* Google Maps Link */}
                {formData.location.coordinates.latitude && formData.location.coordinates.longitude && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-sm font-semibold text-blue-800 mb-2">Google Maps Link</h5>
                        <p className="text-sm text-blue-600">
                          Coordinates: {formData.location.coordinates.latitude}, {formData.location.coordinates.longitude}
                        </p>
                      </div>
                      <a
                        href={`https://www.google.com/maps?q=${formData.location.coordinates.latitude},${formData.location.coordinates.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        <FaMapPin className="mr-2" />
                        View on Google Maps
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Nearest Bus Stop */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-700 flex items-center">
                  <FaBus className="mr-2 text-green-600" />
                  Nearest Bus Stop
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Bus Stop Name</label>
                    <input
                      type="text"
                      name="busStop.name"
                      value={formData.location.nearestBusStop.name}
                      onChange={handleChange}
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                      placeholder="Main St & 5th Ave"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Distance</label>
                    <input
                      type="text"
                      name="busStop.distance"
                      value={formData.location.nearestBusStop.distance}
                      onChange={handleChange}
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                      placeholder="0.2 miles"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Property Details */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                  <FaRulerCombined className="text-white text-lg" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Property Details</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Bedrooms</label>
                  <div className="relative">
                    <input
                      type="number"
                      name="details.bedrooms"
                      value={formData.details.bedrooms}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                        errors['details.bedrooms'] ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                      }`}
                      placeholder="3"
                    />
                    <FaBed className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                  </div>
                  {errors['details.bedrooms'] && <p className="mt-2 text-sm text-red-600">{errors['details.bedrooms']}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Bathrooms</label>
                  <div className="relative">
                    <input
                      type="number"
                      name="details.bathrooms"
                      value={formData.details.bathrooms}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                        errors['details.bathrooms'] ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                      }`}
                      placeholder="2"
                    />
                    <FaBath className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                  </div>
                  {errors['details.bathrooms'] && <p className="mt-2 text-sm text-red-600">{errors['details.bathrooms']}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Square Feet</label>
                  <div className="relative">
                    <input
                      type="number"
                      name="details.sqft"
                      value={formData.details.sqft}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                        errors['details.sqft'] ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                      }`}
                      placeholder="2000"
                    />
                    <FaRulerCombined className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                  </div>
                  {errors['details.sqft'] && <p className="mt-2 text-sm text-red-600">{errors['details.sqft']}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Year Built</label>
                  <input
                    type="number"
                    name="details.yearBuilt"
                    value={formData.details.yearBuilt}
                    onChange={handleChange}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                    placeholder="2015"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Lot Size</label>
                  <input
                    type="text"
                    name="details.lotSize"
                    value={formData.details.lotSize}
                    onChange={handleChange}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                    placeholder="0.25 acres"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Parking</label>
                  <input
                    type="text"
                    name="details.parking"
                    value={formData.details.parking}
                    onChange={handleChange}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                    placeholder="2-car garage"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Heating</label>
                  <input
                    type="text"
                    name="details.heating"
                    value={formData.details.heating}
                    onChange={handleChange}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                    placeholder="Central"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Cooling</label>
                  <input
                    type="text"
                    name="details.cooling"
                    value={formData.details.cooling}
                    onChange={handleChange}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                    placeholder="Central AC"
                  />
                </div>
              </div>
            </div>

            {/* Media Upload */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <FaUpload className="text-white text-lg" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Media & Documents</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Image Upload */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-700 flex items-center">
                    <FaImage className="mr-2 text-blue-600" />
                    Property Images
                  </h4>
                  <PropertyImageUpload
                    propertyId={formData.id || 'temp'}
                    onImagesChange={(images) => setFormData(prev => ({ ...prev, images }))}
                    initialImages={formData.images || []}
                    maxImages={10}
                  />
                </div>

                {/* Video Upload */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-700 flex items-center">
                    <FaVideo className="mr-2 text-red-600" />
                    Property Videos
                  </h4>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="video/*"
                      onChange={(e) => handleFileUpload(e, 'videos')}
                      className="hidden"
                      id="video-upload"
                    />
                    <label htmlFor="video-upload" className="cursor-pointer">
                      <FaUpload className="mx-auto text-3xl text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Click to upload videos</p>
                    </label>
                  </div>
                  {videoFiles.length > 0 && (
                    <div className="space-y-2">
                      {videoFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-700 truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(index, 'videos')}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Document Upload */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-700 flex items-center">
                    <FaFileAlt className="mr-2 text-green-600" />
                    Documents
                  </h4>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileUpload(e, 'documents')}
                      className="hidden"
                      id="document-upload"
                    />
                    <label htmlFor="document-upload" className="cursor-pointer">
                      <FaUpload className="mx-auto text-3xl text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Click to upload documents</p>
                    </label>
                  </div>
                  {documentFiles.length > 0 && (
                    <div className="space-y-2">
                      {documentFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-700 truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(index, 'documents')}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <FaCheck className="text-white text-lg" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Amenities</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={amenityInput}
                      onChange={(e) => setAmenityInput(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                      placeholder="Add custom amenity"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAmenityAdd())}
                    />
                    <FaPlus className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                  </div>
                  <button
                    type="button"
                    onClick={handleAmenityAdd}
                    className="px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:-translate-y-1 shadow-lg"
                  >
                    Add
                  </button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {commonAmenities.map(amenity => (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => {
                        if (!formData.amenities.includes(amenity)) {
                          setFormData(prev => ({
                            ...prev,
                            amenities: [...prev.amenities, amenity]
                          }));
                        }
                      }}
                      className={`px-4 py-3 text-sm rounded-xl border-2 transition-all duration-300 ${
                        formData.amenities.includes(amenity)
                          ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-md'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
                      }`}
                    >
                      {amenity}
                    </button>
                  ))}
                </div>
              </div>

              {formData.amenities.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-lg font-semibold text-gray-700">Selected Amenities:</h4>
                  <div className="flex flex-wrap gap-3">
                    {formData.amenities.map((amenity, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-4 py-2 rounded-xl text-sm bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border border-blue-200 shadow-sm"
                      >
                        {amenity}
                        <button
                          type="button"
                          onClick={() => handleAmenityRemove(amenity)}
                          className="ml-3 text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <FaTimes className="text-sm" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-8 py-4 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-1 shadow-lg font-semibold"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Adding Property...
                  </div>
                ) : (
                  'Add Property'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddProperty; 