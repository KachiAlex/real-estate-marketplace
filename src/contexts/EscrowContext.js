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
    // Load escrow transactions from localStorage first, then add mock data if needed
    const storedEscrows = JSON.parse(localStorage.getItem('escrowTransactions') || '[]');
    if (storedEscrows.length > 0) {
      setEscrowTransactions(storedEscrows);
    } else {
      // Only use mock data if no stored transactions exist
      setEscrowTransactions(mockEscrowTransactions);
      localStorage.setItem('escrowTransactions', JSON.stringify(mockEscrowTransactions));
    }
  }, []);

  // Persist escrow transactions to localStorage and notify when they change
  useEffect(() => {
    if (escrowTransactions.length >= 0) {
      localStorage.setItem('escrowTransactions', JSON.stringify(escrowTransactions));
      // Dispatch event to notify dashboard and other components
      window.dispatchEvent(new CustomEvent('escrowUpdated', {
        detail: { transactions: escrowTransactions }
      }));
    }
  }, [escrowTransactions]);

  const createEscrowTransaction = async (itemId, amount, buyerId, sellerId, options = {}) => {
    try {
      if (!user) {
        toast.error('Please login to create escrow transaction');
        return { success: false };
      }

      const { type = 'property', investmentData = null } = options;
      const isInvestment = type === 'investment';
      
      const escrowFee = Math.round(amount * 0.005); // 0.5% escrow fee
      const totalAmount = amount + escrowFee;

      const transactionId = `ESC${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      
      const newTransaction = {
        id: transactionId,
        [isInvestment ? 'investmentId' : 'propertyId']: itemId,
        propertyTitle: investmentData?.title || investmentData?.investmentTitle || 'Property Transaction',
        investmentTitle: investmentData?.title || investmentData?.investmentTitle || null,
        buyerId: buyerId || user.id || user.uid,
        buyerName: user.firstName + ' ' + user.lastName,
        buyerEmail: user.email,
        sellerId: sellerId || null,
        sellerName: investmentData?.sponsor?.name || investmentData?.vendor || 'Property Owner',
        sellerEmail: investmentData?.sponsor?.email || investmentData?.vendorEmail || 'owner@example.com',
        vendorId: sellerId || investmentData?.vendorId || investmentData?.sponsorId || null,
        amount: parseInt(amount),
        currency: 'NGN',
        status: 'pending_payment',
        type: isInvestment ? 'investment' : 'sale',
        paymentMethod: 'card',
        createdAt: new Date().toISOString(),
        expectedCompletion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        documents: isInvestment ? [
          { name: 'Investment Agreement', status: 'pending' },
          { name: 'Property Deed (Collateral)', status: 'awaiting_vendor_documents' },
          { name: 'Title Documents', status: 'awaiting_vendor_documents' }
        ] : [
          { name: 'Purchase Agreement', status: 'pending' },
          { name: 'Property Inspection Report', status: 'pending' },
          { name: 'Title Search', status: 'pending' }
        ],
        milestones: isInvestment ? [
          { name: 'Investment Payment', status: 'pending', date: null, amount: parseInt(amount) },
          { name: 'Document Verification', status: 'pending', date: null, amount: 0 },
          { name: 'Fund Release', status: 'pending', date: null, amount: 0 }
        ] : [
          { name: 'Initial Payment', status: 'pending', date: null, amount: Math.round(amount * 0.1) },
          { name: 'Property Inspection', status: 'pending', date: null, amount: 0 },
          { name: 'Final Payment', status: 'pending', date: null, amount: Math.round(amount * 0.9) }
        ],
        escrowFee,
        totalAmount,
        // Investment-specific fields
        ...(isInvestment && investmentData ? {
          expectedROI: investmentData.expectedROI || investmentData.expectedReturn || 0,
          lockPeriod: investmentData.lockPeriod || investmentData.termMonths || investmentData.duration || 0,
          documentStatus: 'awaiting_vendor_documents',
          collateralProperty: investmentData.propertyLocation || 'Property collateral pending verification'
        } : {})
      };

      const updatedTransactions = [...escrowTransactions, newTransaction];
      setEscrowTransactions(updatedTransactions);
      
      // Store in localStorage for persistence
      localStorage.setItem('escrowTransactions', JSON.stringify(updatedTransactions));
      
      // Dispatch event to notify dashboard
      window.dispatchEvent(new CustomEvent('escrowUpdated', {
        detail: { transactions: updatedTransactions }
      }));
      
      toast.success('Escrow transaction created successfully!');
      return { success: true, data: newTransaction, id: transactionId };
    } catch (error) {
      console.error('Error creating escrow transaction:', error);
      toast.error('Failed to create escrow transaction');
      return { success: false, error: error.message };
    }
  };

  const getEscrowTransaction = async (id) => {
    // First check in-memory state
    let transaction = escrowTransactions.find(t => t.id === id || t.investmentId === id || t.propertyId === id);
    
    // If not found, check localStorage
    if (!transaction) {
      const storedEscrows = JSON.parse(localStorage.getItem('escrowTransactions') || '[]');
      transaction = storedEscrows.find(t => t.id === id || t.investmentId === id || t.propertyId === id);
      
      if (transaction) {
        // Add to in-memory state
        setEscrowTransactions(prev => {
          const exists = prev.find(t => t.id === transaction.id);
          return exists ? prev : [...prev, transaction];
        });
      }
    }
    
    return transaction;
  };

  const getUserEscrowTransactions = () => {
    if (!user) return [];
    return escrowTransactions.filter(t => t.buyerId === user.id || t.sellerId === user.id);
  };

  const updateEscrowStatus = async (transactionId, status, notes = '') => {
    try {
      const updatedTransactions = escrowTransactions.map(t => 
        t.id === transactionId 
          ? { ...t, status, notes, updatedAt: new Date().toISOString() }
          : t
      );
      setEscrowTransactions(updatedTransactions);
      localStorage.setItem('escrowTransactions', JSON.stringify(updatedTransactions));
      
      // Dispatch event to notify dashboard
      window.dispatchEvent(new CustomEvent('escrowUpdated', {
        detail: { transactions: updatedTransactions }
      }));
      
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
      const updatedTransactions = escrowTransactions.map(t => 
        t.id === transactionId 
          ? { ...t, status: 'completed', completedAt: new Date().toISOString() }
          : t
      );
      setEscrowTransactions(updatedTransactions);
      localStorage.setItem('escrowTransactions', JSON.stringify(updatedTransactions));
      
      // Dispatch event to notify dashboard
      window.dispatchEvent(new CustomEvent('escrowUpdated', {
        detail: { transactions: updatedTransactions }
      }));
      
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