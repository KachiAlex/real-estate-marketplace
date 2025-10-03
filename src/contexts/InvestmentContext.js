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
    sponsor: { name: 'Real Estate Development Corp', experience: '15+ years', rating: 4.8 },
    sponsorId: '2' // Admin User
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
    sponsor: { name: 'Suburban Properties LLC', experience: '20+ years', rating: 4.9 },
    sponsorId: '3' // Onyedikachi Akoma
  },
  {
    id: '3',
    title: 'Luxury Waterfront Apartments',
    description: 'Premium waterfront residential development with stunning lagoon views and world-class amenities.',
    type: 'residential',
    totalAmount: 1500000000, // ₦1,500,000,000
    minimumInvestment: 15000000, // ₦15,000,000
    raisedAmount: 900000000, // ₦900,000,000
    investors: 60,
    expectedReturn: 15.2,
    dividendRate: 10.5,
    duration: 48,
    location: { address: '456 Waterfront Drive', city: 'Lagos', state: 'Lagos' },
    images: ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop'],
    status: 'fundraising',
    createdAt: '2024-02-01T09:00:00Z',
    sponsor: { name: 'Waterfront Developments Ltd', experience: '25+ years', rating: 4.7 },
    sponsorId: '2' // Admin User
  },
  {
    id: '4',
    title: 'Tech Hub Office Complex',
    description: 'Modern office complex designed for tech companies with flexible workspaces and high-speed connectivity.',
    type: 'commercial',
    totalAmount: 3000000000, // ₦3,000,000,000
    minimumInvestment: 50000000, // ₦50,000,000
    raisedAmount: 1800000000, // ₦1,800,000,000
    investors: 36,
    expectedReturn: 18.5,
    dividendRate: 12.0,
    duration: 60,
    location: { address: '789 Tech District', city: 'Lagos', state: 'Lagos' },
    images: ['https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop'],
    status: 'active',
    createdAt: '2024-01-20T11:30:00Z',
    sponsor: { name: 'Tech Real Estate Group', experience: '12+ years', rating: 4.9 },
    sponsorId: '1' // John Doe
  },
  {
    id: '5',
    title: 'Retail Shopping Center',
    description: 'Prime retail shopping center in high-traffic area with anchor tenants and strong footfall.',
    type: 'retail',
    totalAmount: 1200000000, // ₦1,200,000,000
    minimumInvestment: 25000000, // ₦25,000,000
    raisedAmount: 960000000, // ₦960,000,000
    investors: 38,
    expectedReturn: 14.8,
    dividendRate: 9.5,
    duration: 42,
    location: { address: '321 Shopping District', city: 'Lagos', state: 'Lagos' },
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop'],
    status: 'fundraising',
    createdAt: '2024-02-10T14:00:00Z',
    sponsor: { name: 'Retail Properties Inc', experience: '18+ years', rating: 4.6 },
    sponsorId: '3' // Onyedikachi Akoma
  }
];

// Mock user investments
const mockUserInvestments = [
  {
    id: '1',
    userId: '3', // Onyedikachi Akoma
    investmentId: '1',
    investmentTitle: 'Downtown Commercial Complex',
    amount: 40000000, // ₦40,000,000
    shares: 2,
    investmentDate: '2024-01-20T10:00:00Z',
    status: 'active',
    totalDividendsEarned: 3400000, // ₦3,400,000
    expectedMonthlyDividend: 283333, // ₦283,333
    totalReturn: 12.5,
    sponsorId: '2' // Admin User
  },
  {
    id: '2',
    userId: '3', // Onyedikachi Akoma
    investmentId: '4',
    investmentTitle: 'Tech Hub Office Complex',
    amount: 75000000, // ₦75,000,000
    shares: 1.5,
    investmentDate: '2024-01-25T14:30:00Z',
    status: 'active',
    totalDividendsEarned: 2250000, // ₦2,250,000
    expectedMonthlyDividend: 750000, // ₦750,000
    totalReturn: 18.5,
    sponsorId: '1' // John Doe
  },
  {
    id: '3',
    userId: '1', // John Doe
    investmentId: '2',
    investmentTitle: 'Suburban Residential Portfolio',
    amount: 20000000, // ₦20,000,000
    shares: 2,
    investmentDate: '2024-01-15T09:15:00Z',
    status: 'active',
    totalDividendsEarned: 1300000, // ₦1,300,000
    expectedMonthlyDividend: 108333, // ₦108,333
    totalReturn: 8.2,
    sponsorId: '3' // Onyedikachi Akoma
  },
  {
    id: '4',
    userId: '1', // John Doe
    investmentId: '3',
    investmentTitle: 'Luxury Waterfront Apartments',
    amount: 30000000, // ₦30,000,000
    shares: 2,
    investmentDate: '2024-02-05T11:45:00Z',
    status: 'pending_approval',
    totalDividendsEarned: 0,
    expectedMonthlyDividend: 262500, // ₦262,500
    totalReturn: 15.2,
    sponsorId: '2' // Admin User
  },
  {
    id: '5',
    userId: '2', // Admin User
    investmentId: '5',
    investmentTitle: 'Retail Shopping Center',
    amount: 50000000, // ₦50,000,000
    shares: 2,
    investmentDate: '2024-02-12T16:20:00Z',
    status: 'active',
    totalDividendsEarned: 950000, // ₦950,000
    expectedMonthlyDividend: 395833, // ₦395,833
    totalReturn: 14.8,
    sponsorId: '3' // Onyedikachi Akoma
  },
  {
    id: '6',
    userId: '2', // Admin User
    investmentId: '1',
    investmentTitle: 'Downtown Commercial Complex',
    amount: 100000000, // ₦100,000,000
    shares: 5,
    investmentDate: '2024-01-18T08:30:00Z',
    status: 'completed',
    totalDividendsEarned: 8500000, // ₦8,500,000
    expectedMonthlyDividend: 708333, // ₦708,333
    totalReturn: 12.5,
    sponsorId: '2' // Admin User (self-investment)
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

  const getUserInvestmentsByUserId = (userId) => {
    return userInvestments.filter(inv => inv.userId === userId);
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
    getUserInvestmentsByUserId,
    getUserInvestmentSummary
  };

  return (
    <InvestmentContext.Provider value={value}>
      {children}
    </InvestmentContext.Provider>
  );
};