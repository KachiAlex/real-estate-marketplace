import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

// Mock investment opportunities data - All new investments
const mockInvestmentOpportunities = [
  {
    id: 'inv_001',
    title: 'Premium Beachfront Resort Development',
    description: 'Luxury beachfront resort with private beach access, infinity pools, and world-class amenities. Ideal for high-end tourism and events.',
    type: 'hospitality',
    totalAmount: 5000000000, // ₦5,000,000,000
    minimumInvestment: 50000000, // ₦50,000,000
    raisedAmount: 2500000000, // ₦2,500,000,000
    investors: 50,
    expectedReturn: 22.5,
    dividendRate: 15.0,
    duration: 72,
    location: { address: 'Lekki Beachfront', city: 'Lagos', state: 'Lagos' },
    images: ['https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&h=400&fit=crop'],
    status: 'fundraising',
    createdAt: '2024-02-15T10:00:00Z',
    sponsor: { name: 'Ocean View Resorts Ltd', experience: '30+ years', rating: 4.9 },
    sponsorId: '2' // Admin User
  },
  {
    id: 'inv_002',
    title: 'Mixed-Use Development Complex',
    description: 'Modern mixed-use development featuring residential apartments, retail spaces, and office facilities in one integrated community.',
    type: 'mixed-use',
    totalAmount: 3500000000, // ₦3,500,000,000
    minimumInvestment: 30000000, // ₦30,000,000
    raisedAmount: 2100000000, // ₦2,100,000,000
    investors: 70,
    expectedReturn: 16.8,
    dividendRate: 11.5,
    duration: 60,
    location: { address: 'Central Business District', city: 'Abuja', state: 'FCT' },
    images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop'],
    status: 'fundraising',
    createdAt: '2024-02-12T14:30:00Z',
    sponsor: { name: 'Metro Developers Group', experience: '25+ years', rating: 4.8 },
    sponsorId: '1' // John Doe
  },
  {
    id: 'inv_003',
    title: 'Industrial Warehouse Complex',
    description: 'State-of-the-art warehouse and logistics facility with 24/7 security, loading docks, and proximity to major ports.',
    type: 'industrial',
    totalAmount: 2800000000, // ₦2,800,000,000
    minimumInvestment: 40000000, // ₦40,000,000
    raisedAmount: 1960000000, // ₦1,960,000,000
    investors: 49,
    expectedReturn: 14.5,
    dividendRate: 9.8,
    duration: 54,
    location: { address: 'Apapa Industrial Zone', city: 'Lagos', state: 'Lagos' },
    images: ['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&h=400&fit=crop'],
    status: 'fundraising',
    createdAt: '2024-02-08T09:15:00Z',
    sponsor: { name: 'Logistics Properties Inc', experience: '20+ years', rating: 4.7 },
    sponsorId: '3' // Onyedikachi Akoma
  },
  {
    id: 'inv_004',
    title: 'Elite Residential Estate',
    description: 'Ultra-luxurious gated community with smart homes, community center, sports facilities, and round-the-clock security.',
    type: 'residential',
    totalAmount: 4200000000, // ₦4,200,000,000
    minimumInvestment: 60000000, // ₦60,000,000
    raisedAmount: 2520000000, // ₦2,520,000,000
    investors: 42,
    expectedReturn: 19.2,
    dividendRate: 13.5,
    duration: 66,
    location: { address: 'Victoria Island', city: 'Lagos', state: 'Lagos' },
    images: ['https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=600&h=400&fit=crop'],
    status: 'fundraising',
    createdAt: '2024-02-18T11:00:00Z',
    sponsor: { name: 'Elite Communities Ltd', experience: '28+ years', rating: 4.9 },
    sponsorId: '2' // Admin User
  },
  {
    id: 'inv_005',
    title: 'Medical Center & Health Facility',
    description: 'Modern medical center with specialized departments, diagnostic equipment, and outpatient services.',
    type: 'healthcare',
    totalAmount: 2200000000, // ₦2,200,000,000
    minimumInvestment: 35000000, // ₦35,000,000
    raisedAmount: 1540000000, // ₦1,540,000,000
    investors: 44,
    expectedReturn: 13.8,
    dividendRate: 9.2,
    duration: 48,
    location: { address: 'Garki District', city: 'Abuja', state: 'FCT' },
    images: ['https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=600&h=400&fit=crop'],
    status: 'fundraising',
    createdAt: '2024-02-10T13:45:00Z',
    sponsor: { name: 'Healthcare Real Estate Group', experience: '15+ years', rating: 4.6 },
    sponsorId: '1' // John Doe
  },
  {
    id: 'inv_006',
    title: 'Educational Campus Development',
    description: 'Premium educational facility with modern classrooms, laboratories, library, and sports facilities for quality education.',
    type: 'education',
    totalAmount: 1800000000, // ₦1,800,000,000
    minimumInvestment: 25000000, // ₦25,000,000
    raisedAmount: 1260000000, // ₦1,260,000,000
    investors: 50,
    expectedReturn: 12.5,
    dividendRate: 8.5,
    duration: 42,
    location: { address: 'Ikeja GRA', city: 'Lagos', state: 'Lagos' },
    images: ['https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&h=400&fit=crop'],
    status: 'fundraising',
    createdAt: '2024-02-05T10:20:00Z',
    sponsor: { name: 'Education Real Estate Corp', experience: '22+ years', rating: 4.8 },
    sponsorId: '3' // Onyedikachi Akoma
  },
  {
    id: 'inv_007',
    title: 'Luxury Boutique Hotel',
    description: 'Intimate boutique hotel with unique design, fine dining restaurant, spa facilities, and personalized guest services.',
    type: 'hospitality',
    totalAmount: 1500000000, // ₦1,500,000,000
    minimumInvestment: 20000000, // ₦20,000,000
    raisedAmount: 1050000000, // ₦1,050,000,000
    investors: 52,
    expectedReturn: 18.5,
    dividendRate: 12.0,
    duration: 60,
    location: { address: 'Ikoyi District', city: 'Lagos', state: 'Lagos' },
    images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop'],
    status: 'active',
    createdAt: '2024-01-25T15:00:00Z',
    sponsor: { name: 'Boutique Hotels Group', experience: '18+ years', rating: 4.7 },
    sponsorId: '2' // Admin User
  },
  {
    id: 'inv_008',
    title: 'Agricultural Farm & Processing Plant',
    description: 'Large-scale agricultural farm with modern processing facilities for food production and export.',
    type: 'agricultural',
    totalAmount: 3200000000, // ₦3,200,000,000
    minimumInvestment: 45000000, // ₦45,000,000
    raisedAmount: 1920000000, // ₦1,920,000,000
    investors: 42,
    expectedReturn: 15.5,
    dividendRate: 10.5,
    duration: 72,
    location: { address: 'Ogun State', city: 'Abeokuta', state: 'Ogun' },
    images: ['https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&h=400&fit=crop'],
    status: 'fundraising',
    createdAt: '2024-02-20T08:30:00Z',
    sponsor: { name: 'AgriTech Farms Ltd', experience: '12+ years', rating: 4.6 },
    sponsorId: '1' // John Doe
  }
];

// Mock user investments - linked to new investments
const mockUserInvestments = [
  {
    id: 'usr_inv_001',
    userId: '3', // Onyedikachi Akoma
    investmentId: 'inv_001',
    investmentTitle: 'Premium Beachfront Resort Development',
    propertyId: 'prop_005',
    amount: 100000000, // ₦100,000,000
    shares: 2,
    investmentDate: '2024-02-16T10:00:00Z',
    status: 'active',
    totalDividendsEarned: 7500000, // ₦7,500,000
    expectedMonthlyDividend: 1250000, // ₦1,250,000
    totalReturn: 22.5,
    sponsorId: '2' // Admin User
  },
  {
    id: 'usr_inv_002',
    userId: '3', // Onyedikachi Akoma
    investmentId: 'inv_007',
    investmentTitle: 'Luxury Boutique Hotel',
    propertyId: 'prop_010',
    amount: 40000000, // ₦40,000,000
    shares: 2,
    investmentDate: '2024-01-28T14:30:00Z',
    status: 'active',
    totalDividendsEarned: 2400000, // ₦2,400,000
    expectedMonthlyDividend: 400000, // ₦400,000
    totalReturn: 18.5,
    sponsorId: '2' // Admin User
  },
  {
    id: 'usr_inv_003',
    userId: '1', // John Doe
    investmentId: 'inv_002',
    investmentTitle: 'Mixed-Use Development Complex',
    propertyId: 'prop_003',
    amount: 90000000, // ₦90,000,000
    shares: 3,
    investmentDate: '2024-02-14T09:15:00Z',
    status: 'active',
    totalDividendsEarned: 5175000, // ₦5,175,000
    expectedMonthlyDividend: 862500, // ₦862,500
    totalReturn: 16.8,
    sponsorId: '1' // John Doe
  },
  {
    id: 'usr_inv_004',
    userId: '1', // John Doe
    investmentId: 'inv_004',
    investmentTitle: 'Elite Residential Estate',
    propertyId: 'prop_004',
    amount: 120000000, // ₦120,000,000
    shares: 2,
    investmentDate: '2024-02-20T11:20:00Z',
    status: 'active',
    totalDividendsEarned: 8100000, // ₦8,100,000
    expectedMonthlyDividend: 1350000, // ₦1,350,000
    totalReturn: 19.2,
    sponsorId: '2' // Admin User
  },
  {
    id: 'usr_inv_005',
    userId: '2', // Admin User
    investmentId: 'inv_005',
    investmentTitle: 'Medical Center & Health Facility',
    propertyId: 'prop_007',
    amount: 70000000, // ₦70,000,000
    shares: 2,
    investmentDate: '2024-02-12T13:00:00Z',
    status: 'active',
    totalDividendsEarned: 3220000, // ₦3,220,000
    expectedMonthlyDividend: 536667, // ₦536,667
    totalReturn: 13.8,
    sponsorId: '1' // John Doe
  },
  {
    id: 'usr_inv_006',
    userId: '3', // Onyedikachi Akoma
    investmentId: 'inv_006',
    investmentTitle: 'Educational Campus Development',
    propertyId: 'prop_005',
    amount: 50000000, // ₦50,000,000
    shares: 2,
    investmentDate: '2024-02-08T10:30:00Z',
    status: 'active',
    totalDividendsEarned: 2125000, // ₦2,125,000
    expectedMonthlyDividend: 354167, // ₦354,167
    totalReturn: 12.5,
    sponsorId: '3' // Onyedikachi Akoma
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
          aValue = a.expectedReturn;
          bValue = b.expectedReturn;
          break;
        case 'minimumInvestment':
          aValue = a.minimumInvestment;
          bValue = b.minimumInvestment;
          break;
        case 'duration':
          aValue = a.duration;
          bValue = b.duration;
          break;
        case 'progressPercentage':
          aValue = (a.raisedAmount / a.totalAmount) * 100;
          bValue = (b.raisedAmount / b.totalAmount) * 100;
          break;
        case 'investors':
          aValue = a.investors;
          bValue = b.investors;
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
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