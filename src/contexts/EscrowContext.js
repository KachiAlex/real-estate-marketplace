import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

// Mock escrow transactions
const mockEscrowTransactions = [
  {
    id: '1',
    propertyId: '1',
    propertyTitle: 'Beautiful Family Home',
    buyerId: '1',
    buyerName: 'John Doe',
    buyerEmail: 'john@example.com',
    sellerId: '2',
    sellerName: 'John Smith',
    sellerEmail: 'john.smith@example.com',
    amount: 185000000, // ₦185,000,000
    currency: 'NGN',
    status: 'pending',
    type: 'sale',
    paymentMethod: 'card',
    createdAt: '2024-01-20T10:00:00Z',
    expectedCompletion: '2024-02-20T10:00:00Z',
    documents: [
      { name: 'Purchase Agreement', status: 'uploaded' },
      { name: 'Property Inspection Report', status: 'pending' },
      { name: 'Title Search', status: 'completed' }
    ],
    milestones: [
      { name: 'Initial Payment', status: 'pending', date: null, amount: 18500000 },
      { name: 'Property Inspection', status: 'pending', date: null, amount: 0 },
      { name: 'Final Payment', status: 'pending', date: null, amount: 166500000 }
    ],
    escrowFee: 925000, // 0.5% of transaction amount
    totalAmount: 185925000
  }
];

const EscrowContext = createContext();

export const useEscrow = () => {
  const context = useContext(EscrowContext);
  if (!context) {
    throw new Error('useEscrow must be used within an EscrowProvider');
  }
  return context;
};

export const EscrowProvider = ({ children }) => {
  const { user } = useAuth();
  const [escrowTransactions, setEscrowTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load mock data
    setEscrowTransactions(mockEscrowTransactions);
  }, []);

  const createEscrowTransaction = async (propertyId, amount, buyerId, sellerId) => {
    try {
      if (!user) {
        toast.error('Please login to create escrow transaction');
        return { success: false };
      }

      const escrowFee = Math.round(amount * 0.005); // 0.5% escrow fee
      const totalAmount = amount + escrowFee;

      const newTransaction = {
        id: Date.now().toString(),
        propertyId,
        propertyTitle: 'Property Transaction',
        buyerId,
        buyerName: user.firstName + ' ' + user.lastName,
        buyerEmail: user.email,
        sellerId,
        sellerName: 'Property Owner',
        sellerEmail: 'owner@example.com',
        amount: parseInt(amount),
        currency: 'NGN',
        status: 'pending',
        type: 'sale',
        paymentMethod: 'card',
        createdAt: new Date().toISOString(),
        expectedCompletion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        documents: [
          { name: 'Purchase Agreement', status: 'pending' },
          { name: 'Property Inspection Report', status: 'pending' },
          { name: 'Title Search', status: 'pending' }
        ],
        milestones: [
          { name: 'Initial Payment', status: 'pending', date: null, amount: Math.round(amount * 0.1) },
          { name: 'Property Inspection', status: 'pending', date: null, amount: 0 },
          { name: 'Final Payment', status: 'pending', date: null, amount: Math.round(amount * 0.9) }
        ],
        escrowFee,
        totalAmount
      };

      setEscrowTransactions(prev => [...prev, newTransaction]);
      toast.success('Escrow transaction created successfully!');
      return { success: true, data: newTransaction };
    } catch (error) {
      console.error('Error creating escrow transaction:', error);
      toast.error('Failed to create escrow transaction');
      return { success: false, error: error.message };
    }
  };

  const getEscrowTransaction = (id) => {
    return escrowTransactions.find(t => t.id === id);
  };

  const getUserEscrowTransactions = () => {
    if (!user) return [];
    return escrowTransactions.filter(t => t.buyerId === user.id || t.sellerId === user.id);
  };

  const updateEscrowStatus = async (transactionId, status, notes = '') => {
    try {
      setEscrowTransactions(prev => prev.map(t => 
        t.id === transactionId 
          ? { ...t, status, notes, updatedAt: new Date().toISOString() }
          : t
      ));
      toast.success('Escrow status updated successfully!');
      return { success: true };
    } catch (error) {
      console.error('Error updating escrow status:', error);
      toast.error('Failed to update escrow status');
      return { success: false, error: error.message };
    }
  };

  const releaseEscrowFunds = async (transactionId) => {
    try {
      setEscrowTransactions(prev => prev.map(t => 
        t.id === transactionId 
          ? { ...t, status: 'completed', completedAt: new Date().toISOString() }
          : t
      ));
      toast.success('Escrow funds released successfully!');
      return { success: true };
    } catch (error) {
      console.error('Error releasing escrow funds:', error);
      toast.error('Failed to release escrow funds');
      return { success: false, error: error.message };
    }
  };

  const value = {
    escrowTransactions,
    loading,
    error,
    createEscrowTransaction,
    getEscrowTransaction,
    getUserEscrowTransactions,
    updateEscrowStatus,
    releaseEscrowFunds
  };

  return (
    <EscrowContext.Provider value={value}>
      {children}
    </EscrowContext.Provider>
  );
};