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

  // Mock escrow transactions for demo
  const mockEscrowTransactions = [
    {
      id: '1',
      propertyId: '1',
      propertyTitle: 'Modern Downtown Apartment',
      buyerId: '1',
      buyerName: 'John Doe',
      sellerId: '2',
      sellerName: 'John Smith',
      amount: 450000,
      status: 'pending', // pending, funded, completed, cancelled
      type: 'sale', // sale, rent, lease
      createdAt: '2024-01-20T10:00:00Z',
      expectedCompletion: '2024-02-20T10:00:00Z',
      documents: [
        { name: 'Purchase Agreement', status: 'uploaded' },
        { name: 'Property Inspection Report', status: 'pending' },
        { name: 'Title Search', status: 'completed' }
      ],
      milestones: [
        { name: 'Initial Payment', status: 'completed', date: '2024-01-21T10:00:00Z' },
        { name: 'Property Inspection', status: 'pending', date: null },
        { name: 'Final Payment', status: 'pending', date: null }
      ]
    },
    {
      id: '2',
      propertyId: '2',
      propertyTitle: 'Luxury Family Home',
      buyerId: '3',
      buyerName: 'Alice Johnson',
      sellerId: '2',
      sellerName: 'Sarah Johnson',
      amount: 850000,
      status: 'funded',
      type: 'sale',
      createdAt: '2024-01-15T14:30:00Z',
      expectedCompletion: '2024-02-15T14:30:00Z',
      documents: [
        { name: 'Purchase Agreement', status: 'uploaded' },
        { name: 'Property Inspection Report', status: 'uploaded' },
        { name: 'Title Search', status: 'completed' }
      ],
      milestones: [
        { name: 'Initial Payment', status: 'completed', date: '2024-01-16T14:30:00Z' },
        { name: 'Property Inspection', status: 'completed', date: '2024-01-18T14:30:00Z' },
        { name: 'Final Payment', status: 'pending', date: null }
      ]
    }
  ];

  useEffect(() => {
    setEscrowTransactions(mockEscrowTransactions);
  }, []);

  const createEscrowTransaction = async (transactionData) => {
    try {
      setLoading(true);
      // Simulate API call
      const response = await fetch('/api/escrow', {
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

      const newTransaction = await response.json();
      setEscrowTransactions(prev => [newTransaction, ...prev]);
      toast.success('Escrow transaction created successfully!');
      return newTransaction;
    } catch (error) {
      console.error('Error creating escrow transaction:', error);
      toast.error('Failed to create escrow transaction');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getEscrowTransaction = async (id) => {
    try {
      setLoading(true);
      // Simulate API call
      const response = await fetch(`/api/escrow/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch escrow transaction');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching escrow transaction:', error);
      toast.error('Failed to load escrow transaction');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateEscrowStatus = async (id, status) => {
    try {
      setLoading(true);
      // Simulate API call
      const response = await fetch(`/api/escrow/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update escrow status');
      }

      const updatedTransaction = await response.json();
      setEscrowTransactions(prev => 
        prev.map(transaction => 
          transaction.id === id ? updatedTransaction : transaction
        )
      );
      toast.success('Escrow status updated successfully!');
      return updatedTransaction;
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
      // Simulate API call
      const response = await fetch(`/api/escrow/${transactionId}/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: documentData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload document');
      }

      const updatedTransaction = await response.json();
      setEscrowTransactions(prev => 
        prev.map(transaction => 
          transaction.id === transactionId ? updatedTransaction : transaction
        )
      );
      toast.success('Document uploaded successfully!');
      return updatedTransaction;
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
      // Simulate API call
      const response = await fetch(`/api/escrow/${transactionId}/milestones`, {
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

      const updatedTransaction = await response.json();
      setEscrowTransactions(prev => 
        prev.map(transaction => 
          transaction.id === transactionId ? updatedTransaction : transaction
        )
      );
      toast.success('Milestone completed successfully!');
      return updatedTransaction;
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
      // Simulate API call
      const response = await fetch(`/api/escrow/${id}/cancel`, {
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

      const updatedTransaction = await response.json();
      setEscrowTransactions(prev => 
        prev.map(transaction => 
          transaction.id === id ? updatedTransaction : transaction
        )
      );
      toast.success('Escrow transaction cancelled successfully!');
      return updatedTransaction;
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
      // Simulate API call
      const response = await fetch(`/api/escrow/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user escrow transactions');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching user escrow transactions:', error);
      toast.error('Failed to load escrow transactions');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const value = {
    escrowTransactions,
    loading,
    createEscrowTransaction,
    getEscrowTransaction,
    updateEscrowStatus,
    uploadDocument,
    completeMilestone,
    cancelEscrowTransaction,
    getEscrowTransactionsByUser,
  };

  return (
    <EscrowContext.Provider value={value}>
      {children}
    </EscrowContext.Provider>
  );
}; 