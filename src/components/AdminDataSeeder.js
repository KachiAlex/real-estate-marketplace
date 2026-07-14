import React, { useState } from 'react';
import { FaPlus, FaCheck, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';

const AdminDataSeeder = () => {
  const [isSeeding, setIsSeeding] = useState(false);

  // Mock data removed to prevent users from seeing sample properties
  const sampleProperties = [];
  const sampleUsers = [];

  const seedProperties = async () => {
    setIsSeeding(true);
    try {
      const apiClient = (await import('../services/apiClient')).default;
      const res = await apiClient.post('/admin/seed-data', { type: 'properties' });
      if (!res?.data?.success) throw new Error(res?.data?.message || 'Failed to seed properties');
      toast.success('Successfully seeded properties!');
    } catch (error) {
      console.error('Error seeding properties:', error);
      toast.error('Failed to seed properties. Please check console for details.');
    } finally {
      setIsSeeding(false);
    }
  };

  const seedUsers = async () => {
    setIsSeeding(true);
    try {
      const apiClient = (await import('../services/apiClient')).default;
      const res = await apiClient.post('/admin/seed-data', { type: 'users' });
      if (!res?.data?.success) throw new Error(res?.data?.message || 'Failed to seed users');
      toast.success('Successfully seeded users!');
    } catch (error) {
      console.error('Error seeding users:', error);
      toast.error('Failed to seed users. Please check console for details.');
    } finally {
      setIsSeeding(false);
    }
  };

  const seedAllData = async () => {
    setIsSeeding(true);
    try {
      const apiClient = (await import('../services/apiClient')).default;
      const res = await apiClient.post('/admin/seed-data', { type: 'all' });
      if (!res?.data?.success) throw new Error(res?.data?.message || 'Failed to seed all data');
      toast.success('Successfully seeded all data!');
    } catch (error) {
      console.error('Error seeding all data:', error);
      toast.error('Failed to seed all data. Please check console for details.');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Firestore Data Seeder</h2>
      
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Sample Data</h3>
          <ul className="text-blue-800 space-y-1">
            <li>• {sampleProperties.length} Properties across Lagos, Abuja, Port Harcourt, and Kano</li>
            <li>• {sampleUsers.length} Users including buyers and vendors</li>
            <li>• Properties include: For Sale, For Rent, For Lease, and Shortlet</li>
            <li>• Property types: Apartment, House, Villa, Townhouse, Penthouse, Commercial</li>
          </ul>
        </div>

        <div className="flex flex-wrap gap-4">
          <button
            onClick={seedProperties}
            disabled={isSeeding}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSeeding ? (
              <FaSpinner className="animate-spin mr-2" />
            ) : (
              <FaPlus className="mr-2" />
            )}
            Add Properties
          </button>

          <button
            onClick={seedUsers}
            disabled={isSeeding}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSeeding ? (
              <FaSpinner className="animate-spin mr-2" />
            ) : (
              <FaPlus className="mr-2" />
            )}
            Add Users
          </button>

          <button
            onClick={seedAllData}
            disabled={isSeeding}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSeeding ? (
              <FaSpinner className="animate-spin mr-2" />
            ) : (
              <FaCheck className="mr-2" />
            )}
            Add All Data
          </button>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Note:</h4>
          <p className="text-gray-700 text-sm">
            This will add sample data to your Firestore database. Make sure you're authenticated 
            and have the proper permissions to write to Firestore.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDataSeeder;
