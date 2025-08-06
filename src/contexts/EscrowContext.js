import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const EscrowContext = createContext();

export const useEscrow = () => {
  const context = useContext(EscrowContext);
  if (!context) {
    throw new Error('useEscrow must be used within an EscrowProvider');
  }
  return context;
};

export const EscrowProvider = ({ children }) => {
  const [escrowTransactions, setEscrowTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://real-estate-marketplace-1-k8jp.onrender.com';

  // Mock escrow transactions for demo
  const mockEscrowTransactions = [
    {
      id: '1',
      propertyId: '1',
      propertyTitle: 'Modern Downtown Apartment',
      buyerId: '1',
      buyerName: 'John Doe',
      buyerEmail: 'john@example.com',
      sellerId: '2',
      sellerName: 'John Smith',
      sellerEmail: 'john.smith@example.com',
      amount: 450000,
      currency: 'NGN',
      status: 'pending', // pending, funded, completed, cancelled, disputed
      type: 'sale', // sale, rent, lease
      paymentMethod: 'card', // card, bank_transfer, ussd, etc.
      flutterwaveTransactionId: null,
      flutterwaveReference: null,
      createdAt: '2024-01-20T10:00:00Z',
      expectedCompletion: '2024-02-20T10:00:00Z',
      documents: [
        { name: 'Purchase Agreement', status: 'uploaded' },
        { name: 'Property Inspection Report', status: 'pending' },
        { name: 'Title Search', status: 'completed' }
      ],
      milestones: [
        { name: 'Initial Payment', status: 'pending', date: null, amount: 45000 },
        { name: 'Property Inspection', status: 'pending', date: null, amount: 0 },
        { name: 'Final Payment', status: 'pending', date: null, amount: 405000 }
      ],
      escrowFee: 2250, // 0.5% of transaction amount
      totalAmount: 452250
    }
  ];

  useEffect(() => {
    setEscrowTransactions(mockEscrowTransactions);
  }, []);

  const createEscrowTransaction = async (transactionData) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/escrow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(transactionData),
      });

      if (!response.ok) {
        throw new Error('Failed to create escrow transaction');
      }

      const data = await response.json();
      if (data.success) {
        setEscrowTransactions(prev => [data.data, ...prev]);
        toast.success('Escrow transaction created successfully!');
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to create escrow transaction');
      }
    } catch (error) {
      console.error('Error creating escrow transaction:', error);
      toast.error('Failed to create escrow transaction');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const initiatePayment = async (escrowId, paymentMethod = 'card') => {
    try {
      setPaymentLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/escrow/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ escrowId, paymentMethod }),
      });

      if (!response.ok) {
        throw new Error('Failed to initiate payment');
      }

      const data = await response.json();
      if (data.success) {
        // Redirect to Flutterwave payment page
        window.location.href = data.data.payment_url;
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to initiate payment');
      }
    } catch (error) {
      console.error('Error initiating payment:', error);
      toast.error('Failed to initiate payment');
      return null;
    } finally {
      setPaymentLoading(false);
    }
  };

  const verifyPayment = async (transactionId, txRef, status) => {
    try {
      setPaymentLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/escrow/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transaction_id: transactionId, tx_ref: txRef, status }),
      });

      if (!response.ok) {
        throw new Error('Failed to verify payment');
      }

      const data = await response.json();
      if (data.success) {
        // Update local escrow transactions
        setEscrowTransactions(prev => 
          prev.map(transaction => 
            transaction.id === data.data.escrow_id 
              ? { ...transaction, status: data.data.status }
              : transaction
          )
        );
        toast.success('Payment verified successfully!');
        return data.data;
      } else {
        throw new Error(data.message || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.error('Failed to verify payment');
      return null;
    } finally {
      setPaymentLoading(false);
    }
  };

  const getEscrowTransaction = async (id) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/escrow/${id}`);
      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to fetch escrow transaction');
      }
    } catch (error) {
      console.error('Error fetching escrow transaction:', error);
      toast.error('Failed to load escrow transaction details');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateEscrowStatus = async (id, status, notes = '') => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/escrow/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status, notes }),
      });

      if (!response.ok) {
        throw new Error('Failed to update escrow status');
      }

      const data = await response.json();
      if (data.success) {
        setEscrowTransactions(prev => 
          prev.map(transaction => 
            transaction.id === id 
              ? { ...transaction, status, notes }
              : transaction
          )
        );
        toast.success('Escrow status updated successfully!');
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to update escrow status');
      }
    } catch (error) {
      console.error('Error updating escrow status:', error);
      toast.error('Failed to update escrow status');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (transactionId, documentData) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/escrow/${transactionId}/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: documentData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload document');
      }

      const data = await response.json();
      if (data.success) {
        setEscrowTransactions(prev => 
          prev.map(transaction => 
            transaction.id === transactionId 
              ? data.data
              : transaction
          )
        );
        toast.success('Document uploaded successfully!');
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const completeMilestone = async (transactionId, milestoneName) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/escrow/${transactionId}/milestones`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ milestoneName }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete milestone');
      }

      const data = await response.json();
      if (data.success) {
        setEscrowTransactions(prev => 
          prev.map(transaction => 
            transaction.id === transactionId 
              ? data.data
              : transaction
          )
        );
        toast.success('Milestone completed successfully!');
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to complete milestone');
      }
    } catch (error) {
      console.error('Error completing milestone:', error);
      toast.error('Failed to complete milestone');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const cancelEscrowTransaction = async (id, reason) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/escrow/${id}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel escrow transaction');
      }

      const data = await response.json();
      if (data.success) {
        setEscrowTransactions(prev => 
          prev.map(transaction => 
            transaction.id === id 
              ? { ...transaction, status: 'cancelled', cancellationReason: reason }
              : transaction
          )
        );
        toast.success('Escrow transaction cancelled successfully!');
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to cancel escrow transaction');
      }
    } catch (error) {
      console.error('Error cancelling escrow transaction:', error);
      toast.error('Failed to cancel escrow transaction');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getEscrowTransactionsByUser = async (userId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/escrow?userId=${userId}`);
      const data = await response.json();

      if (data.success) {
        setEscrowTransactions(data.data);
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to fetch escrow transactions');
      }
    } catch (error) {
      console.error('Error fetching escrow transactions:', error);
      toast.error('Failed to load escrow transactions');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getEscrowTransactions = async (filters = {}) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams(filters);
      const response = await fetch(`${API_BASE_URL}/api/escrow?${queryParams}`);
      const data = await response.json();

      if (data.success) {
        setEscrowTransactions(data.data);
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to fetch escrow transactions');
      }
    } catch (error) {
      console.error('Error fetching escrow transactions:', error);
      toast.error('Failed to load escrow transactions');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const value = {
    escrowTransactions,
    loading,
    paymentLoading,
    createEscrowTransaction,
    initiatePayment,
    verifyPayment,
    getEscrowTransaction,
    updateEscrowStatus,
    uploadDocument,
    completeMilestone,
    cancelEscrowTransaction,
    getEscrowTransactionsByUser,
    getEscrowTransactions,
  };

  return (
    <EscrowContext.Provider value={value}>
      {children}
    </EscrowContext.Provider>
  );
}; 