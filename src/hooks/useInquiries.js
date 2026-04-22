import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

/**
 * Custom hook for managing property inquiries
 * Handles fetching, creating, updating, and deleting inquiries
 */
export const useInquiries = () => {
  const { user } = useAuth();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, limit: 10, offset: 0, hasMore: false });

  // Fetch user inquiries
  const fetchInquiries = useCallback(async (options = {}) => {
    if (!user) {
      setInquiries([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { 
        limit = 10, 
        offset = 0, 
        status = ''
      } = options;

      const params = new URLSearchParams({
        limit,
        offset
      });

      if (status) params.append('status', status);

      const response = await fetch(`/api/inquiries?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch inquiries');
      }

      const data = await response.json();
      setInquiries(data.data?.inquiries || []);
      setPagination(data.data?.pagination || {});
      return data.data;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching inquiries:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Get a single inquiry by ID
  const getInquiryById = useCallback(async (inquiryId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/inquiries/${inquiryId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Inquiry not found');
      }

      const data = await response.json();
      return data.data;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching inquiry:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new inquiry
  const createInquiry = useCallback(async (propertyId, message) => {
    if (!user) {
      toast.error('Please login to create inquiries');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          propertyId,
          message
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create inquiry');
      }

      const data = await response.json();
      toast.success('Inquiry created successfully');
      
      // Update local state
      setInquiries(prev => [data.data, ...prev]);
      return data.data;
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
      console.error('Error creating inquiry:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Update an inquiry
  const updateInquiry = useCallback(async (inquiryId, updates) => {
    if (!user) {
      toast.error('Please login to update inquiries');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/inquiries/${inquiryId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update inquiry');
      }

      const data = await response.json();
      toast.success('Inquiry updated successfully');
      
      // Update local state
      setInquiries(prev => 
        prev.map(inq => inq.inquiryId === inquiryId ? data.data : inq)
      );
      return data.data;
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
      console.error('Error updating inquiry:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Delete an inquiry
  const deleteInquiry = useCallback(async (inquiryId) => {
    if (!user) {
      toast.error('Please login to delete inquiries');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/inquiries/${inquiryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete inquiry');
      }

      toast.success('Inquiry deleted successfully');
      
      // Update local state
      setInquiries(prev => prev.filter(inq => inq.inquiryId !== inquiryId));
      return true;
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
      console.error('Error deleting inquiry:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    inquiries,
    loading,
    error,
    pagination,
    fetchInquiries,
    getInquiryById,
    createInquiry,
    updateInquiry,
    deleteInquiry
  };
};

export default useInquiries;
