import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

// Mock investment opportunities data - REMOVED to prevent users from seeing mock data
const mockInvestmentOpportunities = [];

// Mock user investments - REMOVED to prevent users from seeing mock data
const mockUserInvestments = [];

const InvestmentContext = createContext();

export const useInvestment = () => {
  const context = useContext(InvestmentContext);
  if (!context) {
    throw new Error('useInvestment must be used within an InvestmentProvider');
  }
  return context;
};

export const InvestmentProvider = ({ children }) => {
  const { user } = useAuth();
  const [investments, setInvestments] = useState([]);
  const [userInvestments, setUserInvestments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isInvestmentCompany, setIsInvestmentCompany] = useState(false);

  useEffect(() => {
    // Load mock data immediately
    setInvestments(mockInvestmentOpportunities);
    if (user) {
      // Load user investments from localStorage first, then fallback to mock data
      const storageKey = `userInvestments_${user?.id}`;
      const storedInvestments = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      if (storedInvestments.length > 0) {
        setUserInvestments(storedInvestments);
      } else {
        // Use mock data filtered by user ID
        const mockUserData = mockUserInvestments.filter(inv => inv.userId === user.id);
        setUserInvestments(mockUserData);
        // Save to localStorage for persistence
        if (mockUserData.length > 0) {
          localStorage.setItem(storageKey, JSON.stringify(mockUserData));
        }
      }
      
      setIsInvestmentCompany(user.role === 'investment_company');
    } else {
      setUserInvestments([]);
    }
  }, [user]);

  // Persist userInvestments to localStorage whenever they change
  useEffect(() => {
    if (user && userInvestments.length >= 0) {
      const storageKey = `userInvestments_${user?.id}`;
      localStorage.setItem(storageKey, JSON.stringify(userInvestments));
      // Dispatch event to notify dashboard and other components
      window.dispatchEvent(new CustomEvent('investmentsUpdated', {
        detail: { userId: user.id, investments: userInvestments }
      }));
    }
  }, [user, userInvestments]);

  const investInOpportunity = async (investmentId, amount) => {
    try {
      if (!user) {
        toast.error('Please login to invest');
        return { success: false };
      }

      const investment = investments.find(inv => inv.id === investmentId);
      if (!investment) {
        toast.error('Investment opportunity not found');
        return { success: false };
      }

      if (amount < investment.minimumInvestment) {
        toast.error(`Minimum investment is ₦${investment.minimumInvestment.toLocaleString()}`);
        return { success: false };
      }

      // Create new user investment
      const newInvestment = {
        id: Date.now().toString(),
        userId: user.id,
        investmentId,
        investmentTitle: investment.title,
        amount: parseInt(amount),
        shares: Math.floor(amount / investment.minimumInvestment),
        investmentDate: new Date().toISOString(),
        status: 'active',
        totalDividendsEarned: 0,
        expectedMonthlyDividend: (amount * investment.dividendRate / 100) / 12,
        totalReturn: 0
      };

      // Update local state
      const updatedInvestments = [...userInvestments, newInvestment];
      setUserInvestments(updatedInvestments);
      
      // Persist to localStorage
      if (user) {
        const storageKey = `userInvestments_${user?.id}`;
        localStorage.setItem(storageKey, JSON.stringify(updatedInvestments));
      }
      
      // Update investment raised amount
      setInvestments(prev => prev.map(inv => 
        inv.id === investmentId 
          ? { ...inv, raisedAmount: inv.raisedAmount + parseInt(amount), investors: inv.investors + 1 }
          : inv
      ));

      // Dispatch event to notify dashboard
      window.dispatchEvent(new CustomEvent('investmentsUpdated', {
        detail: { userId: user.id, investments: updatedInvestments }
      }));

      toast.success('Investment successful!');
      return { success: true, data: newInvestment };
    } catch (error) {
      console.error('Error investing:', error);
      toast.error('Investment failed');
      return { success: false, error: error.message };
    }
  };

  const getInvestmentById = (id) => {
    return investments.find(inv => inv.id === id);
  };

  const getUserInvestmentsByUserId = (userId) => {
    return userInvestments.filter(inv => inv.userId === userId);
  };

  const getUserInvestmentSummary = () => {
    const totalInvested = userInvestments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const totalDividends = userInvestments.reduce((sum, inv) => sum + (inv.totalDividendsEarned || 0), 0);
    const averageReturn = userInvestments.length > 0 
      ? userInvestments.reduce((sum, inv) => sum + (inv.totalReturn || 0), 0) / userInvestments.length 
      : 0;

    return {
      totalInvested: totalInvested || 0,
      totalDividends: totalDividends || 0,
      averageReturn: averageReturn || 0,
      activeInvestments: userInvestments.filter(inv => inv.status === 'active').length,
      totalInvestments: userInvestments.length
    };
  };

  // Enhanced search and filter methods
  const searchInvestments = (query, filters = {}) => {
    let filtered = [...investments];

    // Text search
    if (query && query.trim()) {
      const searchTerm = query.toLowerCase();
      filtered = filtered.filter(investment => 
        investment.title?.toLowerCase().includes(searchTerm) ||
        investment.description?.toLowerCase().includes(searchTerm) ||
        investment.location?.city?.toLowerCase().includes(searchTerm) ||
        investment.location?.address?.toLowerCase().includes(searchTerm) ||
        investment.sponsor?.name?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply filters
    if (filters.type) {
      filtered = filtered.filter(investment => investment.type === filters.type);
    }

    if (filters.status) {
      filtered = filtered.filter(investment => investment.status === filters.status);
    }

    if (filters.minAmount) {
      filtered = filtered.filter(investment => investment.minimumInvestment >= parseFloat(filters.minAmount));
    }

    if (filters.maxAmount) {
      filtered = filtered.filter(investment => investment.minimumInvestment <= parseFloat(filters.maxAmount));
    }

    if (filters.minROI) {
      filtered = filtered.filter(investment => investment.expectedReturn >= parseFloat(filters.minROI));
    }

    if (filters.maxROI) {
      filtered = filtered.filter(investment => investment.expectedReturn <= parseFloat(filters.maxROI));
    }

    if (filters.duration) {
      filtered = filtered.filter(investment => investment.duration <= parseInt(filters.duration));
    }

    if (filters.location) {
      filtered = filtered.filter(investment => 
        investment.location?.city?.toLowerCase().includes(filters.location.toLowerCase()) ||
        investment.location?.state?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.riskLevel) {
      // Map risk levels to expected return ranges
      const riskRanges = {
        'low': { min: 0, max: 10 },
        'medium': { min: 10, max: 15 },
        'high': { min: 15, max: 25 }
      };
      const range = riskRanges[filters.riskLevel];
      if (range) {
        filtered = filtered.filter(investment => 
          investment.expectedReturn >= range.min && investment.expectedReturn <= range.max
        );
      }
    }

    if (filters.featured) {
      filtered = filtered.filter(investment => investment.isFeatured === true);
    }

    return filtered;
  };

  const sortInvestments = (investments, sortBy = 'createdAt', sortOrder = 'desc') => {
    return [...investments].sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'expectedReturn':
          aValue = parseFloat(a.expectedReturn) || 0;
          bValue = parseFloat(b.expectedReturn) || 0;
          break;
        case 'minimumInvestment':
          aValue = parseFloat(a.minimumInvestment) || 0;
          bValue = parseFloat(b.minimumInvestment) || 0;
          break;
        case 'duration':
          aValue = parseInt(a.duration) || 0;
          bValue = parseInt(b.duration) || 0;
          break;
        case 'progressPercentage':
          const totalA = parseFloat(a.totalAmount) || 1;
          const totalB = parseFloat(b.totalAmount) || 1;
          aValue = ((parseFloat(a.raisedAmount) || 0) / totalA) * 100;
          bValue = ((parseFloat(b.raisedAmount) || 0) / totalB) * 100;
          break;
        case 'investors':
          aValue = parseInt(a.investors) || 0;
          bValue = parseInt(b.investors) || 0;
          break;
        case 'createdAt':
        default:
          const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
          const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
          aValue = isNaN(dateA.getTime()) ? 0 : dateA.getTime();
          bValue = isNaN(dateB.getTime()) ? 0 : dateB.getTime();
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  };

  const getFeaturedInvestments = () => {
    return investments.filter(investment => investment.isFeatured === true);
  };

  const getInvestmentsByType = (type) => {
    return investments.filter(investment => investment.type === type);
  };

  const getInvestmentsByStatus = (status) => {
    return investments.filter(investment => investment.status === status);
  };

  const getInvestmentsByLocation = (city) => {
    return investments.filter(investment => 
      investment.location?.city?.toLowerCase() === city.toLowerCase()
    );
  };

  const value = {
    investments,
    userInvestments,
    loading,
    isInvestmentCompany,
    investInOpportunity,
    getInvestmentById,
    getUserInvestmentsByUserId,
    getUserInvestmentSummary,
    searchInvestments,
    sortInvestments,
    getFeaturedInvestments,
    getInvestmentsByType,
    getInvestmentsByStatus,
    getInvestmentsByLocation
  };

  return (
    <InvestmentContext.Provider value={value}>
      {children}
    </InvestmentContext.Provider>
  );
};