import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const InvestmentContext = createContext();

export const useInvestment = () => {
  const context = useContext(InvestmentContext);
  if (!context) {
    throw new Error('useInvestment must be used within an InvestmentProvider');
  }
  return context;
};

export const InvestmentProvider = ({ children }) => {
  const [investments, setInvestments] = useState([]);
  const [mortgages, setMortgages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Mock investment data for demo
  const mockInvestments = [
    {
      id: '1',
      title: 'Downtown Land Development',
      description: 'Prime downtown land parcel ready for mixed-use development. Zoned for commercial and residential use.',
      type: 'land', // land, reit, crowdfunding
      totalAmount: 5000000,
      minimumInvestment: 50000,
      raisedAmount: 3200000,
      investors: 64,
      expectedReturn: 12.5,
      duration: 36, // months
      location: {
        address: 'Downtown Business District',
        city: 'New York',
        state: 'NY',
        coordinates: { lat: 40.7128, lng: -74.0060 }
      },
      images: [
        'https://via.placeholder.com/600x400/3b82f6/ffffff?text=Land+1',
        'https://via.placeholder.com/600x400/10b981/ffffff?text=Land+2'
      ],
      documents: [
        { name: 'Land Survey', status: 'available' },
        { name: 'Zoning Report', status: 'available' },
        { name: 'Environmental Assessment', status: 'available' }
      ],
      status: 'fundraising', // fundraising, funded, in_progress, completed
      createdAt: '2024-01-15T10:00:00Z',
      expectedCompletion: '2027-01-15T10:00:00Z',
      sponsor: {
        id: '1',
        name: 'Real Estate Development Corp',
        experience: '15+ years',
        completedProjects: 25,
        rating: 4.8
      }
    },
    {
      id: '2',
      title: 'Suburban Residential REIT',
      description: 'Diversified portfolio of suburban residential properties with stable rental income.',
      type: 'reit',
      totalAmount: 2000000,
      minimumInvestment: 25000,
      raisedAmount: 1800000,
      investors: 72,
      expectedReturn: 8.2,
      duration: 60,
      location: {
        address: 'Multiple Suburban Locations',
        city: 'Los Angeles',
        state: 'CA',
        coordinates: { lat: 34.0522, lng: -118.2437 }
      },
      images: [
        'https://via.placeholder.com/600x400/ef4444/ffffff?text=REIT+1',
        'https://via.placeholder.com/600x400/8b5cf6/ffffff?text=REIT+2'
      ],
      documents: [
        { name: 'Property Portfolio', status: 'available' },
        { name: 'Financial Statements', status: 'available' },
        { name: 'Management Agreement', status: 'available' }
      ],
      status: 'funded',
      createdAt: '2024-01-10T14:30:00Z',
      expectedCompletion: '2029-01-10T14:30:00Z',
      sponsor: {
        id: '2',
        name: 'Suburban Properties LLC',
        experience: '20+ years',
        completedProjects: 40,
        rating: 4.9
      }
    }
  ];

  // Mock mortgage data for demo
  const mockMortgages = [
    {
      id: '1',
      propertyId: '1',
      propertyTitle: 'Modern Downtown Apartment',
      type: 'purchase', // purchase, refinance, home_equity
      amount: 360000,
      interestRate: 4.25,
      term: 30, // years
      monthlyPayment: 1772,
      downPayment: 90000,
      creditScore: 750,
      income: 85000,
      status: 'approved', // pending, approved, funded, closed
      lender: {
        id: '1',
        name: 'Prime Mortgage Bank',
        rating: 4.7,
        processingTime: '15-20 days'
      },
      createdAt: '2024-01-20T10:00:00Z',
      expectedClosing: '2024-02-20T10:00:00Z',
      documents: [
        { name: 'Income Verification', status: 'uploaded' },
        { name: 'Bank Statements', status: 'uploaded' },
        { name: 'Credit Report', status: 'pending' }
      ]
    },
    {
      id: '2',
      propertyId: '2',
      propertyTitle: 'Luxury Family Home',
      type: 'refinance',
      amount: 680000,
      interestRate: 3.75,
      term: 30,
      monthlyPayment: 3148,
      downPayment: 0,
      creditScore: 780,
      income: 120000,
      status: 'pending',
      lender: {
        id: '2',
        name: 'Elite Lending Group',
        rating: 4.8,
        processingTime: '10-15 days'
      },
      createdAt: '2024-01-18T14:30:00Z',
      expectedClosing: '2024-02-18T14:30:00Z',
      documents: [
        { name: 'Income Verification', status: 'pending' },
        { name: 'Bank Statements', status: 'uploaded' },
        { name: 'Credit Report', status: 'uploaded' }
      ]
    }
  ];

  useEffect(() => {
    setInvestments(mockInvestments);
    setMortgages(mockMortgages);
  }, []);

  // Investment functions
  const getInvestments = async (filters = {}) => {
    try {
      setLoading(true);
      // Simulate API call
      const response = await fetch('/api/investments?' + new URLSearchParams(filters));
      
      if (!response.ok) {
        throw new Error('Failed to fetch investments');
      }

      const data = await response.json();
      setInvestments(data);
    } catch (error) {
      console.error('Error fetching investments:', error);
      toast.error('Failed to load investments');
    } finally {
      setLoading(false);
    }
  };

  const getInvestmentById = async (id) => {
    try {
      setLoading(true);
      // Simulate API call
      const response = await fetch(`/api/investments/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch investment');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching investment:', error);
      toast.error('Failed to load investment details');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const investInProperty = async (investmentId, amount) => {
    try {
      setLoading(true);
      // Simulate API call
      const response = await fetch(`/api/investments/${investmentId}/invest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        throw new Error('Failed to invest in property');
      }

      const updatedInvestment = await response.json();
      setInvestments(prev => 
        prev.map(investment => 
          investment.id === investmentId ? updatedInvestment : investment
        )
      );
      toast.success('Investment successful!');
      return updatedInvestment;
    } catch (error) {
      console.error('Error investing in property:', error);
      toast.error('Failed to invest in property');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Mortgage functions
  const getMortgages = async (filters = {}) => {
    try {
      setLoading(true);
      // Simulate API call
      const response = await fetch('/api/mortgages?' + new URLSearchParams(filters));
      
      if (!response.ok) {
        throw new Error('Failed to fetch mortgages');
      }

      const data = await response.json();
      setMortgages(data);
    } catch (error) {
      console.error('Error fetching mortgages:', error);
      toast.error('Failed to load mortgages');
    } finally {
      setLoading(false);
    }
  };

  const getMortgageById = async (id) => {
    try {
      setLoading(true);
      // Simulate API call
      const response = await fetch(`/api/mortgages/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch mortgage');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching mortgage:', error);
      toast.error('Failed to load mortgage details');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const applyForMortgage = async (mortgageData) => {
    try {
      setLoading(true);
      // Simulate API call
      const response = await fetch('/api/mortgages/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(mortgageData),
      });

      if (!response.ok) {
        throw new Error('Failed to apply for mortgage');
      }

      const newMortgage = await response.json();
      setMortgages(prev => [newMortgage, ...prev]);
      toast.success('Mortgage application submitted successfully!');
      return newMortgage;
    } catch (error) {
      console.error('Error applying for mortgage:', error);
      toast.error('Failed to apply for mortgage');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateMortgageStatus = async (id, status) => {
    try {
      setLoading(true);
      // Simulate API call
      const response = await fetch(`/api/mortgages/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update mortgage status');
      }

      const updatedMortgage = await response.json();
      setMortgages(prev => 
        prev.map(mortgage => 
          mortgage.id === id ? updatedMortgage : mortgage
        )
      );
      toast.success('Mortgage status updated successfully!');
      return updatedMortgage;
    } catch (error) {
      console.error('Error updating mortgage status:', error);
      toast.error('Failed to update mortgage status');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const uploadMortgageDocument = async (mortgageId, documentData) => {
    try {
      setLoading(true);
      // Simulate API call
      const response = await fetch(`/api/mortgages/${mortgageId}/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: documentData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload document');
      }

      const updatedMortgage = await response.json();
      setMortgages(prev => 
        prev.map(mortgage => 
          mortgage.id === mortgageId ? updatedMortgage : mortgage
        )
      );
      toast.success('Document uploaded successfully!');
      return updatedMortgage;
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    investments,
    mortgages,
    loading,
    getInvestments,
    getInvestmentById,
    investInProperty,
    getMortgages,
    getMortgageById,
    applyForMortgage,
    updateMortgageStatus,
    uploadMortgageDocument,
  };

  return (
    <InvestmentContext.Provider value={value}>
      {children}
    </InvestmentContext.Provider>
  );
}; 