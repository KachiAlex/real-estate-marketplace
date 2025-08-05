import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const PropertyContext = createContext();

export const useProperty = () => {
  const context = useContext(PropertyContext);
  if (!context) {
    throw new Error('useProperty must be used within a PropertyProvider');
  }
  return context;
};

export const PropertyProvider = ({ children }) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    priceRange: '',
    location: '',
    bedrooms: '',
    bathrooms: '',
    propertyType: '',
  });

  // Mock data for demo purposes
  const mockProperties = [
    {
      id: '1',
      title: 'Modern Downtown Apartment',
      description: 'Beautiful 2-bedroom apartment in the heart of downtown with stunning city views.',
      price: 450000,
      rentPrice: 2500,
      type: 'sale', // sale, rent, lease
      propertyType: 'apartment',
      bedrooms: 2,
      bathrooms: 2,
      sqft: 1200,
      location: {
        address: '123 Main St, Downtown',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        coordinates: { lat: 40.7128, lng: -74.0060 }
      },
      features: ['Balcony', 'Gym', 'Pool', 'Parking'],
      images: [
        'https://via.placeholder.com/600x400/3b82f6/ffffff?text=Apartment+1',
        'https://via.placeholder.com/600x400/10b981/ffffff?text=Apartment+2',
        'https://via.placeholder.com/600x400/f59e0b/ffffff?text=Apartment+3'
      ],
      owner: {
        id: '1',
        name: 'John Smith',
        email: 'john@example.com',
        phone: '+1234567890',
        avatar: 'https://via.placeholder.com/150'
      },
      status: 'active',
      createdAt: '2024-01-15T10:00:00Z',
      escrowEnabled: true,
      investmentOpportunity: false
    },
    {
      id: '2',
      title: 'Luxury Family Home',
      description: 'Spacious 4-bedroom family home with large backyard and modern amenities.',
      price: 850000,
      rentPrice: 4500,
      type: 'sale',
      propertyType: 'house',
      bedrooms: 4,
      bathrooms: 3,
      sqft: 2800,
      location: {
        address: '456 Oak Ave, Suburbs',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90210',
        coordinates: { lat: 34.0522, lng: -118.2437 }
      },
      features: ['Backyard', 'Garage', 'Fireplace', 'Hardwood Floors'],
      images: [
        'https://via.placeholder.com/600x400/ef4444/ffffff?text=House+1',
        'https://via.placeholder.com/600x400/8b5cf6/ffffff?text=House+2',
        'https://via.placeholder.com/600x400/06b6d4/ffffff?text=House+3'
      ],
      owner: {
        id: '2',
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        phone: '+1234567891',
        avatar: 'https://via.placeholder.com/150'
      },
      status: 'active',
      createdAt: '2024-01-10T14:30:00Z',
      escrowEnabled: true,
      investmentOpportunity: true
    },
    {
      id: '3',
      title: 'Commercial Office Space',
      description: 'Prime office space in business district, perfect for startups and established companies.',
      price: 1200000,
      rentPrice: 8000,
      type: 'lease',
      propertyType: 'commercial',
      bedrooms: 0,
      bathrooms: 2,
      sqft: 5000,
      location: {
        address: '789 Business Blvd, Financial District',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94105',
        coordinates: { lat: 37.7749, lng: -122.4194 }
      },
      features: ['Conference Rooms', 'Reception Area', 'Kitchen', 'Parking'],
      images: [
        'https://via.placeholder.com/600x400/84cc16/ffffff?text=Office+1',
        'https://via.placeholder.com/600x400/f97316/ffffff?text=Office+2',
        'https://via.placeholder.com/600x400/a855f7/ffffff?text=Office+3'
      ],
      owner: {
        id: '3',
        name: 'Commercial Real Estate LLC',
        email: 'info@commercialre.com',
        phone: '+1234567892',
        avatar: 'https://via.placeholder.com/150'
      },
      status: 'active',
      createdAt: '2024-01-05T09:15:00Z',
      escrowEnabled: true,
      investmentOpportunity: true
    }
  ];

  useEffect(() => {
    // Load properties on component mount
    setProperties(mockProperties);
  }, []);

  const getProperties = async (filters = {}) => {
    try {
      setLoading(true);
      // Simulate API call
      const response = await fetch('/api/properties?' + new URLSearchParams(filters));
      
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }

      const data = await response.json();
      setProperties(data);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const getPropertyById = async (id) => {
    try {
      setLoading(true);
      // Simulate API call
      const response = await fetch(`/api/properties/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch property');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching property:', error);
      toast.error('Failed to load property details');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const addProperty = async (propertyData) => {
    try {
      setLoading(true);
      // Simulate API call
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(propertyData),
      });

      if (!response.ok) {
        throw new Error('Failed to add property');
      }

      const newProperty = await response.json();
      setProperties(prev => [newProperty, ...prev]);
      toast.success('Property added successfully!');
      return newProperty;
    } catch (error) {
      console.error('Error adding property:', error);
      toast.error('Failed to add property');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateProperty = async (id, propertyData) => {
    try {
      setLoading(true);
      // Simulate API call
      const response = await fetch(`/api/properties/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(propertyData),
      });

      if (!response.ok) {
        throw new Error('Failed to update property');
      }

      const updatedProperty = await response.json();
      setProperties(prev => 
        prev.map(property => 
          property.id === id ? updatedProperty : property
        )
      );
      toast.success('Property updated successfully!');
      return updatedProperty;
    } catch (error) {
      console.error('Error updating property:', error);
      toast.error('Failed to update property');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteProperty = async (id) => {
    try {
      setLoading(true);
      // Simulate API call
      const response = await fetch(`/api/properties/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete property');
      }

      setProperties(prev => prev.filter(property => property.id !== id));
      toast.success('Property deleted successfully!');
    } catch (error) {
      console.error('Error deleting property:', error);
      toast.error('Failed to delete property');
    } finally {
      setLoading(false);
    }
  };

  const searchProperties = async (searchParams) => {
    try {
      setLoading(true);
      // Simulate API call
      const response = await fetch('/api/properties/search?' + new URLSearchParams(searchParams));
      
      if (!response.ok) {
        throw new Error('Failed to search properties');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error searching properties:', error);
      toast.error('Failed to search properties');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const value = {
    properties,
    loading,
    filters,
    setFilters,
    getProperties,
    getPropertyById,
    addProperty,
    updateProperty,
    deleteProperty,
    searchProperties,
  };

  return (
    <PropertyContext.Provider value={value}>
      {children}
    </PropertyContext.Provider>
  );
}; 