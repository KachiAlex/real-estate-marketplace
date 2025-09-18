import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

// Mock investment opportunities data
const mockInvestmentOpportunities = [
  {
    id: '1',
    title: 'Downtown Commercial Complex',
    description: 'Prime downtown commercial property with high rental yield potential. Located in the heart of the business district.',
    type: 'commercial',
    totalAmount: 2000000000, // ₦2,000,000,000
    minimumInvestment: 20000000, // ₦20,000,000
    raisedAmount: 1280000000, // ₦1,280,000,000
    investors: 64,
    expectedReturn: 12.5,
    dividendRate: 8.5,
    duration: 36,
    location: { address: '123 Business District', city: 'Lagos', state: 'Lagos' },
    images: ['https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop'],
    status: 'fundraising',
    createdAt: '2024-01-15T10:00:00Z',
    sponsor: { name: 'Real Estate Development Corp', experience: '15+ years', rating: 4.8 }
  },
  {
    id: '2',
    title: 'Suburban Residential Portfolio',
    description: 'Diversified portfolio of suburban residential properties with stable rental income.',
    type: 'residential',
    totalAmount: 800000000, // ₦800,000,000
    minimumInvestment: 10000000, // ₦10,000,000
    raisedAmount: 720000000, // ₦720,000,000
    investors: 72,
    expectedReturn: 8.2,
    dividendRate: 6.5,
    duration: 60,
    location: { address: 'Multiple Locations', city: 'Lagos', state: 'Lagos' },
    images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop'],
    status: 'active',
    createdAt: '2024-01-10T14:30:00Z',
    sponsor: { name: 'Suburban Properties LLC', experience: '20+ years', rating: 4.9 }
  }
];

// Mock user investments
const mockUserInvestments = [
  {
    id: '1',
    userId: '3',
    investmentId: '1',
    investmentTitle: 'Downtown Commercial Complex',
    amount: 40000000, // ₦40,000,000
    shares: 2,
    investmentDate: '2024-01-20T10:00:00Z',
    status: 'active',
    totalDividendsEarned: 3400000, // ₦3,400,000
    expectedMonthlyDividend: 283333, // ₦283,333
    totalReturn: 12.5
  }
];

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
      setUserInvestments(mockUserInvestments.filter(inv => inv.userId === user.id));
      setIsInvestmentCompany(user.role === 'investment_company');
    }
  }, [user]);

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
      setUserInvestments(prev => [...prev, newInvestment]);
      
      // Update investment raised amount
      setInvestments(prev => prev.map(inv => 
        inv.id === investmentId 
          ? { ...inv, raisedAmount: inv.raisedAmount + parseInt(amount), investors: inv.investors + 1 }
          : inv
      ));

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

  const getUserInvestmentSummary = () => {
    const totalInvested = userInvestments.reduce((sum, inv) => sum + inv.amount, 0);
    const totalDividends = userInvestments.reduce((sum, inv) => sum + inv.totalDividendsEarned, 0);
    const averageReturn = userInvestments.length > 0 
      ? userInvestments.reduce((sum, inv) => sum + inv.totalReturn, 0) / userInvestments.length 
      : 0;

    return {
      totalInvested,
      totalDividends,
      averageReturn,
      activeInvestments: userInvestments.filter(inv => inv.status === 'active').length,
      totalInvestments: userInvestments.length
    };
  };

  const value = {
    investments,
    userInvestments,
    loading,
    isInvestmentCompany,
    investInOpportunity,
    getInvestmentById,
    getUserInvestmentSummary
  };

  return (
    <InvestmentContext.Provider value={value}>
      {children}
    </InvestmentContext.Provider>
  );
};