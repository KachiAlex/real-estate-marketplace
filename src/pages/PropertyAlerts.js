import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaBell, FaPlus, FaEdit, FaTrash, FaMapMarkerAlt, FaBed, FaBath, FaRuler, FaFilter, FaSort, FaToggleOn, FaToggleOff, FaEye, FaEyeSlash, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';

const PropertyAlerts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [filterBy, setFilterBy] = useState('all');

  // Form state for creating/editing alerts
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    propertyType: 'all',
    minPrice: '',
    maxPrice: '',
    minBedrooms: '',
    maxBedrooms: '',
    minBathrooms: '',
    maxBathrooms: '',
    minArea: '',
    maxArea: '',
    features: [],
    frequency: 'daily',
    isActive: true
  });

  // Mock alerts data
  useEffect(() => {
    const mockAlerts = [
      {
        id: 1,
        name: "Lagos Luxury Homes",
        location: "Victoria Island, Lagos",
        propertyType: "apartment",
        minPrice: 100000000,
        maxPrice: 300000000,
        minBedrooms: 3,
        maxBedrooms: 5,
        minBathrooms: 2,
        maxBathrooms: 4,
        minArea: 200,
        maxArea: 500,
        features: ["pool", "gym", "security"],
        frequency: "daily",
        isActive: true,
        matches: 12,
        lastChecked: "2024-01-15T10:30:00Z",
        created: "2024-01-01T00:00:00Z"
      },
      {
        id: 2,
        name: "Abuja Investment Properties",
        location: "Asokoro, Abuja",
        propertyType: "house",
        minPrice: 200000000,
        maxPrice: 500000000,
        minBedrooms: 4,
        maxBedrooms: 6,
        minBathrooms: 3,
        maxBathrooms: 5,
        minArea: 300,
        maxArea: 800,
        features: ["garden", "parking", "security"],
        frequency: "weekly",
        isActive: true,
        matches: 8,
        lastChecked: "2024-01-14T15:20:00Z",
        created: "2024-01-05T00:00:00Z"
      },
      {
        id: 3,
        name: "Lekki Budget Apartments",
        location: "Lekki Phase 1, Lagos",
        propertyType: "apartment",
        minPrice: 50000000,
        maxPrice: 150000000,
        minBedrooms: 2,
        maxBedrooms: 3,
        minBathrooms: 2,
        maxBathrooms: 3,
        minArea: 150,
        maxArea: 300,
        features: ["security"],
        frequency: "daily",
        isActive: false,
        matches: 5,
        lastChecked: "2024-01-10T09:15:00Z",
        created: "2024-01-08T00:00:00Z"
      },
      {
        id: 4,
        name: "Ikoyi Premium Properties",
        location: "Ikoyi, Lagos",
        propertyType: "all",
        minPrice: 150000000,
        maxPrice: 400000000,
        minBedrooms: 3,
        maxBedrooms: 6,
        minBathrooms: 3,
        maxBathrooms: 5,
        minArea: 250,
        maxArea: 600,
        features: ["pool", "gym", "security", "parking"],
        frequency: "immediate",
        isActive: true,
        matches: 15,
        lastChecked: "2024-01-15T08:45:00Z",
        created: "2024-01-12T00:00:00Z"
      }
    ];

    setTimeout(() => {
      setAlerts(mockAlerts);
      setLoading(false);
    }, 1000);
  }, []);

  const handleCreateAlert = () => {
    const newAlert = {
      id: Date.now(),
      ...formData,
      matches: 0,
      lastChecked: new Date().toISOString(),
      created: new Date().toISOString()
    };
    setAlerts(prev => [newAlert, ...prev]);
    setShowCreateForm(false);
    resetForm();
  };

  const handleEditAlert = (alert) => {
    setEditingAlert(alert);
    setFormData(alert);
    setShowCreateForm(true);
  };

  const handleUpdateAlert = () => {
    setAlerts(prev => prev.map(alert => 
      alert.id === editingAlert.id 
        ? { ...alert, ...formData }
        : alert
    ));
    setShowCreateForm(false);
    setEditingAlert(null);
    resetForm();
  };

  const handleDeleteAlert = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const handleToggleAlert = (alertId) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, isActive: !alert.isActive }
        : alert
    ));
  };

  const handleViewMatches = (alert) => {
    console.log('View Matches clicked for alert:', alert.name);
    
    if (!user) {
      toast.error('Please login to view property matches');
      navigate('/');
      return;
    }

    // Create search parameters based on alert criteria
    const searchParams = new URLSearchParams();
    
    // Add location filter
    if (alert.location) {
      searchParams.set('location', alert.location);
    }
    
    // Add property type filter
    if (alert.propertyType && alert.propertyType !== 'all') {
      searchParams.set('type', alert.propertyType);
    }
    
    // Add price range filters
    if (alert.minPrice) {
      searchParams.set('minPrice', alert.minPrice.toString());
    }
    if (alert.maxPrice) {
      searchParams.set('maxPrice', alert.maxPrice.toString());
    }
    
    // Add bedroom/bathroom filters
    if (alert.minBedrooms) {
      searchParams.set('minBedrooms', alert.minBedrooms.toString());
    }
    if (alert.maxBedrooms) {
      searchParams.set('maxBedrooms', alert.maxBedrooms.toString());
    }
    if (alert.minBathrooms) {
      searchParams.set('minBathrooms', alert.minBathrooms.toString());
    }
    if (alert.maxBathrooms) {
      searchParams.set('maxBathrooms', alert.maxBathrooms.toString());
    }
    
    // Add area filters
    if (alert.minArea) {
      searchParams.set('minArea', alert.minArea.toString());
    }
    if (alert.maxArea) {
      searchParams.set('maxArea', alert.maxArea.toString());
    }
    
    // Add features filter
    if (alert.features && alert.features.length > 0) {
      searchParams.set('features', alert.features.join(','));
    }
    
    // Add a special parameter to indicate this is from an alert
    searchParams.set('fromAlert', alert.id.toString());
    searchParams.set('alertName', alert.name);

    // Navigate to properties page with search parameters
    const propertiesUrl = `/properties?${searchParams.toString()}`;
    console.log('Navigating to properties with search params:', propertiesUrl);
    
    toast.success(`Showing properties matching "${alert.name}" criteria`);
    navigate(propertiesUrl);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      propertyType: 'all',
      minPrice: '',
      maxPrice: '',
      minBedrooms: '',
      maxBedrooms: '',
      minBathrooms: '',
      maxBathrooms: '',
      minArea: '',
      maxArea: '',
      features: [],
      frequency: 'daily',
      isActive: true
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFeatureToggle = (feature) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const getPropertyTypeLabel = (type) => {
    switch (type) {
      case 'apartment': return 'Apartment';
      case 'house': return 'House';
      case 'duplex': return 'Duplex';
      case 'penthouse': return 'Penthouse';
      case 'all': return 'All Types';
      default: return type;
    }
  };

  const getFrequencyLabel = (frequency) => {
    switch (frequency) {
      case 'immediate': return 'Immediate';
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      default: return frequency;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filterBy === 'all') return true;
    if (filterBy === 'active') return alert.isActive;
    if (filterBy === 'inactive') return !alert.isActive;
    return true;
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Property Alerts</h1>
            <p className="text-gray-600">
              Set up alerts to get notified when properties matching your criteria become available
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <FaPlus />
            <span>Create Alert</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FaBell className="text-brand-blue text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{alerts.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <FaToggleOn className="text-green-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Alerts</p>
              <p className="text-2xl font-bold text-gray-900">
                {alerts.filter(a => a.isActive).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <FaBell className="text-brand-orange text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Matches</p>
              <p className="text-2xl font-bold text-gray-900">
                {alerts.reduce((sum, alert) => sum + alert.matches, 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-gray-100 rounded-lg">
              <FaToggleOff className="text-gray-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Inactive Alerts</p>
              <p className="text-2xl font-bold text-gray-900">
                {alerts.filter(a => !a.isActive).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingAlert ? 'Edit Alert' : 'Create New Alert'}
            </h2>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setEditingAlert(null);
                resetForm();
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Alert Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., Lagos Luxury Homes"
              />
            </div>

            <div>
              <label className="form-label">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., Victoria Island, Lagos"
              />
            </div>

            <div>
              <label className="form-label">Property Type</label>
              <select
                name="propertyType"
                value={formData.propertyType}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="all">All Types</option>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="duplex">Duplex</option>
                <option value="penthouse">Penthouse</option>
              </select>
            </div>

            <div>
              <label className="form-label">Frequency</label>
              <select
                name="frequency"
                value={formData.frequency}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="immediate">Immediate</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label className="form-label">Min Price (₦)</label>
              <input
                type="number"
                name="minPrice"
                value={formData.minPrice}
                onChange={handleInputChange}
                className="form-input"
                placeholder="50000000"
              />
            </div>

            <div>
              <label className="form-label">Max Price (₦)</label>
              <input
                type="number"
                name="maxPrice"
                value={formData.maxPrice}
                onChange={handleInputChange}
                className="form-input"
                placeholder="300000000"
              />
            </div>

            <div>
              <label className="form-label">Min Bedrooms</label>
              <input
                type="number"
                name="minBedrooms"
                value={formData.minBedrooms}
                onChange={handleInputChange}
                className="form-input"
                placeholder="2"
              />
            </div>

            <div>
              <label className="form-label">Max Bedrooms</label>
              <input
                type="number"
                name="maxBedrooms"
                value={formData.maxBedrooms}
                onChange={handleInputChange}
                className="form-input"
                placeholder="5"
              />
            </div>

            <div>
              <label className="form-label">Min Bathrooms</label>
              <input
                type="number"
                name="minBathrooms"
                value={formData.minBathrooms}
                onChange={handleInputChange}
                className="form-input"
                placeholder="2"
              />
            </div>

            <div>
              <label className="form-label">Max Bathrooms</label>
              <input
                type="number"
                name="maxBathrooms"
                value={formData.maxBathrooms}
                onChange={handleInputChange}
                className="form-input"
                placeholder="4"
              />
            </div>

            <div>
              <label className="form-label">Min Area (m²)</label>
              <input
                type="number"
                name="minArea"
                value={formData.minArea}
                onChange={handleInputChange}
                className="form-input"
                placeholder="150"
              />
            </div>

            <div>
              <label className="form-label">Max Area (m²)</label>
              <input
                type="number"
                name="maxArea"
                value={formData.maxArea}
                onChange={handleInputChange}
                className="form-input"
                placeholder="500"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="form-label">Features</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
              {['pool', 'gym', 'security', 'parking', 'garden', 'balcony', 'elevator', 'generator'].map(feature => (
                <label key={feature} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.features.includes(feature)}
                    onChange={() => handleFeatureToggle(feature)}
                    className="rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
                  />
                  <span className="text-sm text-gray-700 capitalize">{feature}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
              />
              <span className="text-sm text-gray-700">Active Alert</span>
            </label>
          </div>

          <div className="mt-6 flex space-x-4">
            <button
              onClick={editingAlert ? handleUpdateAlert : handleCreateAlert}
              className="btn-primary"
            >
              {editingAlert ? 'Update Alert' : 'Create Alert'}
            </button>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setEditingAlert(null);
                resetForm();
              }}
              className="btn-outline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center space-x-4">
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue focus:border-transparent"
          >
            <option value="all">All Alerts</option>
            <option value="active">Active Alerts</option>
            <option value="inactive">Inactive Alerts</option>
          </select>
          
          <div className="text-sm text-gray-600">
            Showing {filteredAlerts.length} of {alerts.length} alerts
          </div>
        </div>
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FaBell className="text-gray-300 text-6xl mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Alerts Found</h3>
          <p className="text-gray-600 mb-6">
            {filterBy === 'all' 
              ? "You haven't created any property alerts yet. Create your first alert to get notified about new properties!"
              : `No ${filterBy} alerts found.`
            }
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary inline-flex items-center"
          >
            <FaPlus className="mr-2" />
            Create Your First Alert
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredAlerts.map((alert) => (
            <div key={alert.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{alert.name}</h3>
                      <button
                        onClick={() => handleToggleAlert(alert.id)}
                        className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                          alert.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {alert.isActive ? <FaToggleOn /> : <FaToggleOff />}
                        <span>{alert.isActive ? 'Active' : 'Inactive'}</span>
                      </button>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <FaMapMarkerAlt />
                        <span>{alert.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FaBell />
                        <span>{getFrequencyLabel(alert.frequency)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>{getPropertyTypeLabel(alert.propertyType)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditAlert(alert)}
                      className="btn-outline py-2 px-4"
                    >
                      <FaEdit className="inline mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteAlert(alert.id)}
                      className="btn-outline py-2 px-4 text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <FaTrash className="inline mr-1" />
                      Delete
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Price Range</h4>
                    <p className="text-sm text-gray-600">
                      ₦{alert.minPrice.toLocaleString()} - ₦{alert.maxPrice.toLocaleString()}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Bedrooms & Bathrooms</h4>
                    <p className="text-sm text-gray-600">
                      {alert.minBedrooms}-{alert.maxBedrooms} bedrooms, {alert.minBathrooms}-{alert.maxBathrooms} bathrooms
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Area Range</h4>
                    <p className="text-sm text-gray-600">
                      {alert.minArea}m² - {alert.maxArea}m²
                    </p>
                  </div>
                </div>

                {alert.features.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Required Features</h4>
                    <div className="flex flex-wrap gap-2">
                      {alert.features.map(feature => (
                        <span key={feature} className="tag tag-new">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <span className="font-medium text-brand-orange">{alert.matches}</span>
                      <span>matches found</span>
                    </div>
                    <div>
                      Last checked: {formatDate(alert.lastChecked)}
                    </div>
                    <div>
                      Created: {formatDate(alert.created)}
                    </div>
                  </div>
                  
                  {alert.matches > 0 && (
                    <button 
                      onClick={() => handleViewMatches(alert)}
                      className="btn-primary py-2 px-4"
                      title={`View ${alert.matches} properties matching this alert criteria`}
                    >
                      <FaEye className="inline mr-1" />
                      View Matches
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PropertyAlerts;
