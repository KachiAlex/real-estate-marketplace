/**
 * Capacitor HTTP Client - Usage Examples
 * 
 * This file demonstrates how to use the Capacitor HTTP client
 * throughout your React application.
 */

import { getApiClient } from './apiClientBridge';
import { getHttpClient } from '../config/api';

// ============================================================================
// Example 1: Using the API Client Bridge (Recommended)
// ============================================================================

/**
 * Example: Fetch user data using the API bridge
 */
export async function fetchUserExample() {
  const apiClient = getApiClient();
  
  const response = await apiClient.get('/users/123');
  
  if (response.success) {
    console.log('User data:', response.data);
  } else {
    console.error('Error:', response.error);
  }
}

/**
 * Example: Create a new property listing
 */
export async function createPropertyExample() {
  const apiClient = getApiClient();
  
  const propertyData = {
    title: 'Beautiful House',
    price: 250000,
    location: 'New York',
    bedrooms: 3,
    bathrooms: 2,
  };
  
  const response = await apiClient.post('/properties', propertyData);
  
  if (response.success) {
    console.log('Property created:', response.data);
  } else {
    console.error('Failed to create property:', response.error);
  }
}

/**
 * Example: Update a property with custom headers
 */
export async function updatePropertyExample() {
  const apiClient = getApiClient();
  
  const updateData = {
    price: 275000,
    status: 'sold',
  };
  
  const response = await apiClient.put('/properties/456', updateData, {
    headers: {
      'Authorization': 'Bearer your-token-here',
    },
  });
  
  if (response.success) {
    console.log('Property updated:', response.data);
  } else {
    console.error('Failed to update property:', response.error);
  }
}

/**
 * Example: Delete a property
 */
export async function deletePropertyExample() {
  const apiClient = getApiClient();
  
  const response = await apiClient.delete('/properties/456');
  
  if (response.success) {
    console.log('Property deleted');
  } else {
    console.error('Failed to delete property:', response.error);
  }
}

/**
 * Example: Search properties with query parameters
 */
export async function searchPropertiesExample() {
  const apiClient = getApiClient();
  
  const response = await apiClient.get('/properties', {
    params: {
      location: 'New York',
      minPrice: 100000,
      maxPrice: 500000,
      bedrooms: 3,
      page: 1,
      limit: 20,
    },
  });
  
  if (response.success) {
    console.log('Search results:', response.data);
  } else {
    console.error('Search failed:', response.error);
  }
}

/**
 * Example: Handle timeout with custom timeout value
 */
export async function fetchWithTimeoutExample() {
  const apiClient = getApiClient();
  
  const response = await apiClient.get('/properties', {
    timeout: 10000, // 10 seconds
  });
  
  if (response.success) {
    console.log('Data:', response.data);
  } else {
    console.error('Error:', response.error);
  }
}

// ============================================================================
// Example 2: Using the HTTP Client Directly (Advanced)
// ============================================================================

/**
 * Example: Direct HTTP client usage with interceptors
 */
export async function setupInterceptorsExample() {
  const httpClient = getHttpClient();
  
  // Add request interceptor to add auth token
  httpClient.addRequestInterceptor((config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      return {
        ...config,
        headers: {
          ...config.headers,
          'Authorization': `Bearer ${token}`,
        },
      };
    }
    return config;
  });
  
  // Add response interceptor to handle 401 errors
  httpClient.addResponseInterceptor((response) => {
    if (response.status === 401) {
      // Handle unauthorized - redirect to login
      console.log('Unauthorized - redirecting to login');
    }
    return response;
  });
  
  // Add error interceptor for logging
  httpClient.addErrorInterceptor((error) => {
    console.error('HTTP Error:', error.message);
    return error;
  });
}

/**
 * Example: Direct HTTP client GET request
 */
export async function directHttpGetExample() {
  const httpClient = getHttpClient();
  
  try {
    const response = await httpClient.get('/api/users/123');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    console.log('Headers:', response.headers);
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example: Direct HTTP client POST request
 */
export async function directHttpPostExample() {
  const httpClient = getHttpClient();
  
  try {
    const response = await httpClient.post('/api/properties', {
      title: 'New Property',
      price: 300000,
    });
    console.log('Created:', response.data);
  } catch (error) {
    console.error('Error:', error);
  }
}

// ============================================================================
// Example 3: React Component Usage
// ============================================================================

/**
 * Example React component using the API client
 */
export function PropertyListComponent() {
  const [properties, setProperties] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchProperties();
  }, []);

  async function fetchProperties() {
    setLoading(true);
    setError(null);
    
    const apiClient = getApiClient();
    const response = await apiClient.get('/properties', {
      params: { limit: 20 },
    });
    
    if (response.success) {
      setProperties(response.data || []);
    } else {
      setError(response.error || 'Failed to fetch properties');
    }
    
    setLoading(false);
  }

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {properties.map((property: any) => (
        <div key={property.id}>
          <h3>{property.title}</h3>
          <p>Price: ${property.price}</p>
        </div>
      ))}
    </div>
  );
}

/**
 * Example React component with form submission
 */
export function CreatePropertyComponent() {
  const [formData, setFormData] = React.useState({
    title: '',
    price: '',
    location: '',
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    const apiClient = getApiClient();
    const response = await apiClient.post('/properties', formData);
    
    if (response.success) {
      setSuccess(true);
      setFormData({ title: '', price: '', location: '' });
    } else {
      setError(response.error || 'Failed to create property');
    }
    
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
      />
      <input
        type="number"
        placeholder="Price"
        value={formData.price}
        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
      />
      <input
        type="text"
        placeholder="Location"
        value={formData.location}
        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Property'}
      </button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {success && <div style={{ color: 'green' }}>Property created successfully!</div>}
    </form>
  );
}

// ============================================================================
// Example 4: Error Handling Patterns
// ============================================================================

/**
 * Example: Comprehensive error handling
 */
export async function comprehensiveErrorHandlingExample() {
  const apiClient = getApiClient();
  
  try {
    const response = await apiClient.get('/properties/invalid-id');
    
    if (!response.success) {
      // Handle API error
      if (response.status === 404) {
        console.log('Property not found');
      } else if (response.status === 401) {
        console.log('Unauthorized - please login');
      } else if (response.status === 500) {
        console.log('Server error - please try again later');
      } else {
        console.log('Error:', response.error);
      }
    } else {
      console.log('Success:', response.data);
    }
  } catch (error) {
    // This shouldn't happen with ApiClientBridge, but just in case
    console.error('Unexpected error:', error);
  }
}

/**
 * Example: Retry logic for failed requests
 */
export async function retryLogicExample() {
  const apiClient = getApiClient();
  const maxRetries = 3;
  let retries = 0;
  
  while (retries < maxRetries) {
    const response = await apiClient.get('/properties');
    
    if (response.success) {
      console.log('Success:', response.data);
      return response.data;
    }
    
    retries++;
    if (retries < maxRetries) {
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
    }
  }
  
  console.error('Failed after', maxRetries, 'retries');
}

// Note: Add React import at the top of your actual file
// import React from 'react';
