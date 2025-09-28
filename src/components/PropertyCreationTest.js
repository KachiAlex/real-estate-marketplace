import React, { useState } from 'react';
import { useProperty } from '../contexts/PropertyContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const PropertyCreationTest = () => {
  const { addProperty } = useProperty();
  const { user, firebaseAuthReady } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const testPropertyCreation = async () => {
    setLoading(true);
    setResult(null);

    try {
      const testProperty = {
        title: 'Test Property - ' + new Date().toISOString(),
        description: 'This is a test property created to verify Firestore permissions',
        price: 1000000,
        type: 'house',
        status: 'for-sale',
        listingType: 'for-sale',
        details: {
          bedrooms: 3,
          bathrooms: 2,
          sqft: 1500
        },
        location: {
          address: '123 Test Street',
          city: 'Lagos',
          state: 'Lagos'
        },
        amenities: ['Swimming Pool', 'Garden'],
        images: [],
        videos: [],
        documentation: []
      };

      console.log('Testing property creation with:', {
        user: user,
        firebaseAuthReady: firebaseAuthReady,
        authCurrentUser: window.auth?.currentUser
      });

      const result = await addProperty(testProperty);
      setResult(result);
      
      if (result.success) {
        toast.success('Property created successfully!');
      } else {
        toast.error('Property creation failed: ' + result.error);
      }
    } catch (error) {
      console.error('Test error:', error);
      setResult({ success: false, error: error.message });
      toast.error('Test failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Property Creation Test</h3>
      
      <div className="mb-4 space-y-2">
        <p><strong>User:</strong> {user ? `${user.firstName} ${user.lastName}` : 'Not logged in'}</p>
        <p><strong>Firebase Auth Ready:</strong> {firebaseAuthReady ? 'Yes' : 'No'}</p>
        <p><strong>Firebase Current User:</strong> {window.auth?.currentUser ? 'Yes' : 'No'}</p>
      </div>

      <button
        onClick={testPropertyCreation}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Property Creation'}
      </button>

      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h4 className="font-semibold">Result:</h4>
          <pre className="text-sm mt-2">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default PropertyCreationTest;
