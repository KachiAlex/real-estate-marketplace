import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

/**
 * Custom hook for managing investments
 * Handles fetching, filtering, sorting, and investing in opportunities
 */
export const useInvestments = () => {
  const { user } = useAuth();
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, limit: 10, offset: 0, hasMore: false });

  // Fetch investments with filtering and sorting
  const fetchInvestments = useCallback(async (options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const { 
        limit = 10, 
        offset = 0, 
        status = '', 
        sortBy = 'expectedReturn',
        minReturn = '',
        maxReturn = ''
      } = options;

      const params = new URLSearchParams({
        limit,
        offset,
        sortBy
      });

      if (status) params.append('status', status);
      if (minReturn) params.append('minReturn', minReturn);
      if (maxReturn) params.append('maxReturn', maxReturn);

      const response = await fetch(`/api/investments?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch investments');
      }

      const data = await response.json();
      setInvestments(data.data?.investments || []);
      setPagination(data.data?.pagination || {});
      return data.data;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching investments:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch a single investment by ID
  const getInvestmentById = useCallback(async (investmentId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/investments/${investmentId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Investment not found');
      }

      const data = await response.json();
      return data.data;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching investment:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create an investment (user invests in an opportunity)
  const investInOpportunity = useCallback(async (investmentId, amount, paymentMethod = 'paystack') => {
    if (!user) {
      toast.error('Please login to invest');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/investments/${investmentId}/invest`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount,
          paymentMethod
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details?.minimumAmount 
          ? `Minimum investment is ₦${errorData.details.minimumAmount.toLocaleString()}`
          : errorData.error || 'Failed to create investment'
        );
      }

      const data = await response.json();
      toast.success('Investment created successfully');
      return data.data;
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
      console.error('Error creating investment:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Get user's investments
  const getUserInvestments = useCallback(async (status = '') => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);

      const response = await fetch(`/api/investments/user/my-investments?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user investments');
      }

      const data = await response.json();
      return data.data || [];
    } catch (err) {
      setError(err.message);
      console.error('Error fetching user investments:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get user's investment summary
  const getInvestmentSummary = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/investments/user/summary', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch investment summary');
      }

      const data = await response.json();
      return data.data;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching investment summary:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    investments,
    loading,
    error,
    pagination,
    fetchInvestments,
    getInvestmentById,
    investInOpportunity,
    getUserInvestments,
    getInvestmentSummary
  };
};

export default useInvestments;
