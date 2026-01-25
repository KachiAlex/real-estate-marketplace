import React, { useState, useMemo, useEffect } from 'react';
import MemoryInput from '../components/MemoryInput';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProperty } from '../contexts/PropertyContext';
import { useMortgage } from '../contexts/MortgageContext';
import { FaHome, FaMoneyBillWave, FaPercentage, FaCalendar, FaArrowRight, FaBed, FaBath, FaRuler, FaFilter, FaRedo, FaCheck, FaClock, FaTimes, FaFileAlt, FaStar, FaArrowDown, FaArrowUp, FaCheckCircle, FaTimesCircle, FaInfoCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import axios from 'axios';
import { uploadMortgageDocuments } from '../utils/mortgageDocumentUpload';
import { getApiUrl } from '../utils/apiConfig';

const Mortgage = () => {
  const { user } = useAuth();
  const { properties, loading: propertiesLoading } = useProperty();
  const { getUserApplications, getApplicationsByStatus, refreshApplications } = useMortgage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState('any');
  const [selectedPropertyType, setSelectedPropertyType] = useState('all');
  const [selectedEligibility, setSelectedEligibility] = useState('all');
  
  // Mortgage calculator state
  const [homePrice, setHomePrice] = useState(35000000);
  const [downPayment, setDownPayment] = useState(7000000);
  const [loanTerm, setLoanTerm] = useState(15);
  const [interestRate, setInterestRate] = useState(13.5);

  // Button handlers
  const handlePreQualification = () => {
    if (!user) {
      toast.error('Please login to start pre-qualification');
      navigate('/login');
      return;
    }
    // Reset form state
    setEmploymentType('employed');
    setEmployerName('');
    setJobTitle('');
    setMonthlyIncome('');
    setYearsOfEmployment('');
    setBusinessName('');
    setBusinessType('');
    setBusinessMonthlyIncome('');
    setBankStatements([]);
    setAcceptTerms(false);
    setSelectedBankId('');
    setShowPrequalificationModal(true);
  };

  const handleViewProperty = (propertyId) => {
    navigate(`/property/${propertyId}`);
  };

  const [showMortgageModal, setShowMortgageModal] = useState(false);
  const [showPrequalificationModal, setShowPrequalificationModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [employmentType, setEmploymentType] = useState('employed');
  const [employerName, setEmployerName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [yearsOfEmployment, setYearsOfEmployment] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [businessMonthlyIncome, setBusinessMonthlyIncome] = useState('');
  const [bankStatements, setBankStatements] = useState([]);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [banks, setBanks] = useState([]);
  const [selectedBankId, setSelectedBankId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Load approved mortgage banks
  useEffect(() => {
    const loadBanks = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await axios.get(getApiUrl('/mortgage-banks'), {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          setBanks(response.data.data || []);
        }
      } catch (error) {
        console.error('Error loading mortgage banks:', error);
      }
    };

    if (user) {
      loadBanks();
    }
  }, [user]);

  const handleApplyMortgage = (property) => {
    console.log('Apply for Mortgage clicked, property:', property, 'user:', user);
    
    if (!user) {
      toast.error('Please login to apply for mortgage');
      navigate('/login');
      return;
    }
    
    setSelectedProperty(property);
    setShowMortgageModal(true);
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    setBankStatements(files);
  };

  const handlePrequalificationSubmission = async () => {
    // Validation
    if (!acceptTerms) {
      toast.error('Please accept the terms and conditions');
      return;
    }

    if (employmentType === 'employed' && (!employerName || !jobTitle || !monthlyIncome || !yearsOfEmployment)) {
      toast.error('Please fill in all employment details');
      return;
    }

    if (employmentType === 'self-employed' && (!businessName || !businessType || !businessMonthlyIncome)) {
      toast.error('Please fill in all business details');
      return;
    }

    if (!selectedBankId) {
      toast.error('Please select a mortgage bank');
      return;
    }

    const selectedBank = banks.find(b => b._id === selectedBankId || b.id === selectedBankId);
    if (!selectedBank) {
      toast.error('Selected bank not found');
      return;
    }

    // Prepare employment details
    const employmentDetails = {
      type: employmentType,
      employerName: employmentType === 'employed' ? employerName : undefined,
      jobTitle: employmentType === 'employed' ? jobTitle : undefined,
      monthlyIncome: parseFloat(employmentType === 'employed' ? monthlyIncome : businessMonthlyIncome) || 0,
      yearsOfEmployment: parseFloat(yearsOfEmployment) || 0,
      businessName: employmentType === 'self-employed' ? businessName : undefined,
      businessType: employmentType === 'self-employed' ? businessType : undefined
    };

    setIsSubmitting(true);
    setUploadProgress(0);
    setIsUploading(false);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }

      // Upload documents first if any files are provided
      let documents = [];
      if (bankStatements && bankStatements.length > 0) {
        setIsUploading(true);
        setUploadProgress(0);
        
        const uploadResult = await uploadMortgageDocuments(
          bankStatements,
          null, // applicationId - not created yet
          (progress) => {
            setUploadProgress(progress);
          }
        );

        setIsUploading(false);

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Failed to upload documents');
        }

        documents = uploadResult.data || [];
        toast.success(`Successfully uploaded ${documents.length} document(s)`);
      }

      // Submit prequalification request to backend
      const response = await axios.post(
        getApiUrl('/mortgages/prequalify'),
        {
          mortgageBankId: selectedBankId,
          employmentDetails: employmentDetails,
          documents: documents
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.success) {
        const { data } = response.data;
        
        // Display prequalification results
        toast.success('Pre-qualification request submitted successfully!', {
          duration: 5000
        });
        
        // Show results in a detailed toast
        setTimeout(() => {
          toast(
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2">Prequalification Estimates</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Estimated Max Loan:</strong> ₦{data.estimatedMaxLoan?.toLocaleString() || '0'}</p>
                <p><strong>Estimated Property Value:</strong> ₦{data.estimatedPropertyValue?.toLocaleString() || '0'}</p>
                <p><strong>Estimated Down Payment:</strong> ₦{data.estimatedDownPayment?.toLocaleString() || '0'}</p>
                <p className="mt-2 text-gray-600">You will be contacted within 24 hours with your pre-qualification results.</p>
              </div>
            </div>,
            {
              duration: 10000,
              icon: '✅'
            }
          );
        }, 1500);
        
        // Refresh applications to show the new prequalification
        setTimeout(() => {
          if (refreshApplications) {
            refreshApplications();
          }
        }, 2000);
        
        // Reset form
        setShowPrequalificationModal(false);
        setEmploymentType('employed');
        setEmployerName('');
        setJobTitle('');
        setMonthlyIncome('');
        setYearsOfEmployment('');
        setBusinessName('');
        setBusinessType('');
        setBusinessMonthlyIncome('');
        setBankStatements([]);
        setAcceptTerms(false);
        setSelectedBankId('');
      } else {
        throw new Error(response.data?.message || 'Failed to submit pre-qualification request');
      }
    } catch (error) {
      console.error('Prequalification submission error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit pre-qualification request. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleConfirmMortgageApplication = async () => {
    // Validation
    if (!acceptTerms) {
      toast.error('Please accept the terms and conditions');
      return;
    }

    if (employmentType === 'employed' && (!employerName || !jobTitle || !monthlyIncome || !yearsOfEmployment)) {
      toast.error('Please fill in all employment details');
      return;
    }

    if (employmentType === 'self-employed' && (!businessName || !businessType || !businessMonthlyIncome)) {
      toast.error('Please fill in all business details');
      return;
    }

    if (!selectedBankId) {
      toast.error('Please select a mortgage bank');
      return;
    }

    if (!selectedProperty) {
      toast.error('No property selected');
      return;
    }

    const selectedBank = banks.find(b => b._id === selectedBankId || b.id === selectedBankId);
    if (!selectedBank) {
      toast.error('Selected bank not found');
      return;
    }

    // Get property ID - handle both id and _id formats
    const propertyId = selectedProperty.id || selectedProperty._id || selectedProperty.propertyId;
    if (!propertyId) {
      toast.error('Invalid property ID');
      return;
    }

    // Calculate loan terms
    const propertyPrice = typeof selectedProperty.price === 'number' ? selectedProperty.price : parseFloat(selectedProperty.price) || 0;
    const downPaymentPercent = selectedProperty.category === 'commercial' ? 25 : 20;
    const loanTermYears = selectedProperty.category === 'commercial' ? 15 : 25;
    const defaultInterestRate = 18.5; // Default rate, could be from bank products later
    
    const downPayment = Math.round(propertyPrice * (downPaymentPercent / 100));
    const requestedAmount = propertyPrice - downPayment;

    // Prepare employment details
    const employmentDetails = {
      type: employmentType,
      employerName: employmentType === 'employed' ? employerName : undefined,
      jobTitle: employmentType === 'employed' ? jobTitle : undefined,
      monthlyIncome: parseFloat(employmentType === 'employed' ? monthlyIncome : businessMonthlyIncome) || 0,
      yearsOfEmployment: parseFloat(yearsOfEmployment) || 0,
      businessName: employmentType === 'self-employed' ? businessName : undefined,
      businessType: employmentType === 'self-employed' ? businessType : undefined
    };

    setIsSubmitting(true);
    setUploadProgress(0);
    setIsUploading(false);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }

      // Upload documents first if any files are provided
      let documents = [];
      if (bankStatements && bankStatements.length > 0) {
        setIsUploading(true);
        setUploadProgress(0);
        
        const uploadResult = await uploadMortgageDocuments(
          bankStatements,
          null, // applicationId - not created yet
          (progress) => {
            setUploadProgress(progress);
          }
        );

        setIsUploading(false);

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Failed to upload documents');
        }

        documents = uploadResult.data || [];
        toast.success(`Successfully uploaded ${documents.length} document(s)`);
      }

      // Submit to backend API only (no localStorage)
      const response = await axios.post(
        getApiUrl('/mortgages/apply'),
        {
          propertyId: propertyId, // Proper ID format (id or _id)
          mortgageBankId: selectedBankId,
          requestedAmount: requestedAmount,
          downPayment: downPayment,
          loanTermYears: loanTermYears,
          interestRate: defaultInterestRate,
          employmentDetails: employmentDetails,
          documents: documents // Now contains Cloudinary URLs
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.success) {
        // Success - reset form and show success message
        toast.success(`Mortgage application submitted successfully for "${selectedProperty.title}"!`);
        
        // Show application details
        setTimeout(() => {
          toast.info(
            `Loan Amount: ₦${requestedAmount.toLocaleString()} | ` +
            `Down Payment: ₦${downPayment.toLocaleString()} | ` +
            `Term: ${loanTermYears} years`
          );
        }, 1500);

        // Reset form
        setShowMortgageModal(false);
        setSelectedProperty(null);
        setSelectedBankId('');
        setEmploymentType('employed');
        setEmployerName('');
        setJobTitle('');
        setMonthlyIncome('');
        setYearsOfEmployment('');
        setBusinessName('');
        setBusinessType('');
        setBusinessMonthlyIncome('');
        setBankStatements([]);
        setAcceptTerms(false);

        // Refresh applications to show the new one
        setTimeout(() => {
          if (refreshApplications) {
            refreshApplications();
          }
        }, 1000);

        // Navigate to applications page
        setTimeout(() => {
          navigate('/mortgages/applications');
        }, 3000);
      } else {
        throw new Error(response.data?.message || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error submitting mortgage application:', error);
      
      // Handle different error types
      let errorMessage = 'Failed to submit mortgage application. Please try again.';
      
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 401) {
          errorMessage = 'Authentication failed. Please login again.';
          setTimeout(() => navigate('/login'), 2000);
        } else if (status === 400) {
          errorMessage = data?.message || data?.errors?.[0]?.msg || 'Invalid application data. Please check all fields.';
        } else if (status === 404) {
          errorMessage = 'Property or bank not found. Please refresh and try again.';
        } else if (status === 500) {
          errorMessage = 'Server error. Please try again later or contact support.';
        } else {
          errorMessage = data?.message || `Error: ${status}. Please try again.`;
        }
      } else if (error.request) {
        // Request made but no response
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFilterResults = () => {
    // Apply filters based on current selections
    const filters = {
      location: selectedLocation,
      priceRange: selectedPriceRange,
      propertyType: selectedPropertyType,
      eligibility: selectedEligibility
    };
    toast.success('Filters applied successfully!');
    console.log('Applied filters:', filters);
  };

  const handleResetFilters = () => {
    setSelectedLocation('all');
    setSelectedPriceRange('any');
    setSelectedPropertyType('all');
    setSelectedEligibility('all');
    toast.success('Filters reset successfully!');
  };

  const handlePagination = (pageNumber) => {
    toast.success(`Navigating to page ${pageNumber}`);
  };

  // Mock mortgage rates data
  const mortgageRates = [
    { type: '30-Year Fixed', rate: 13.5, change: -0.25, trend: 'down' },
    { type: '15-Year Fixed', rate: 12.8, change: -0.15, trend: 'down' },
    { type: '10-Year Fixed', rate: 12.2, change: -0.75, trend: 'down' },
    { type: '5/1 ARM', rate: 11.9, change: 0.05, trend: 'up' }
  ];

  // Helper function to calculate monthly mortgage payment
  const calculateMonthlyPayment = (principal, annualRate, years) => {
    const monthlyRate = annualRate / 100 / 12;
    const numberOfPayments = years * 12;
    if (monthlyRate === 0) {
      return principal / numberOfPayments;
    }
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
           (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
  };

  // Transform real properties for mortgage page (any property can be financed via mortgage)
  const allEligibleProperties = useMemo(() => {
    if (!properties || properties.length === 0) {
      return [];
    }

    const defaultInterestRate = 13.5;
    const defaultLoanTerm = 20;
    const defaultDownPaymentPercent = 20;

    return properties
      .filter(prop => prop.price && prop.price > 0) // Only properties with valid prices
      .map((prop) => {
        const propertyId = prop.id || prop._id || prop.propertyId;
        const price = typeof prop.price === 'number' ? prop.price : parseFloat(prop.price) || 0;
        const downPaymentPercent = prop.typeSlug === 'office' || prop.typeSlug === 'retail' || prop.typeSlug === 'warehouse' ? 25 : defaultDownPaymentPercent;
        const loanTerm = prop.typeSlug === 'office' || prop.typeSlug === 'retail' || prop.typeSlug === 'warehouse' ? 15 : defaultLoanTerm;
        const downPayment = price * (downPaymentPercent / 100);
        const loanAmount = price - downPayment;
        const monthlyPayment = calculateMonthlyPayment(loanAmount, defaultInterestRate, loanTerm);

        // Determine category
        const residentialTypes = ['apartment', 'house', 'villa', 'penthouse', 'townhouse', 'bungalow', 'studio'];
        const category = residentialTypes.includes(prop.typeSlug) ? 'residential' : 'commercial';

        // Build tags
        const tags = ['Mortgage Ready'];
        if (prop.isVerified) tags.push('Verified');
        // Add more tags based on property features
        if (prop.yearBuilt && new Date().getFullYear() - prop.yearBuilt <= 5) {
          tags.push('New');
        }

        // Determine location string
        let locationStr = '';
        if (prop.location) {
          locationStr = typeof prop.location === 'string' ? prop.location : 
            `${prop.city || ''}, ${prop.state || ''}`.trim();
        } else if (prop.city || prop.state) {
          locationStr = `${prop.city || ''}, ${prop.state || ''}`.trim();
        } else {
          locationStr = 'Location not specified';
        }

        return {
          id: propertyId,
          _id: propertyId, // For MongoDB compatibility
          title: prop.title || 'Untitled Property',
          location: locationStr,
          price: price,
          image: prop.image || prop.images?.[0] || '/placeholder.jpg',
          bedrooms: prop.bedrooms || 0,
          bathrooms: prop.bathrooms || 0,
          area: prop.area || prop.sqft || 0,
          tags: tags,
          monthlyPayment: Math.round(monthlyPayment),
          downPaymentPercent: downPaymentPercent,
          loanTerm: loanTerm,
          interestRate: defaultInterestRate,
          category: category,
          isPreApproved: false, // Could be enhanced with actual pre-approval data
          isNewDevelopment: prop.yearBuilt && new Date().getFullYear() - prop.yearBuilt <= 2,
          isRecentlyAdded: prop.createdAt && new Date(prop.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          // Keep original property data for reference
          originalProperty: prop
        };
      })
      .filter(prop => prop.price > 0); // Ensure valid price
  }, [properties]);

  // Filter properties based on active tab
  const eligibleProperties = useMemo(() => {
    switch (activeTab) {
      case 'pre-approved':
        return allEligibleProperties.filter(p => p.isPreApproved);
      case 'residential':
        return allEligibleProperties.filter(p => p.category === 'residential');
      case 'commercial':
        return allEligibleProperties.filter(p => p.category === 'commercial');
      case 'new-developments':
        return allEligibleProperties.filter(p => p.isNewDevelopment);
      case 'recently-added':
        return allEligibleProperties.filter(p => p.isRecentlyAdded);
      case 'all':
      default:
        return allEligibleProperties;
    }
  }, [activeTab, allEligibleProperties]);

  // Mock lender partners data
  const lenderPartners = [
    { name: "First Bank of Nigeria", rating: 4.7, rate: 13.2 },
    { name: "Access Bank", rating: 4.7, rate: 13.2 },
    { name: "UBA Mortgages", rating: 4.7, rate: 13.2 },
    { name: "Zenith Bank", rating: 4.7, rate: 13.2 }
  ];

  // Get real application status data from context
  const userApplications = getUserApplications();
  const pendingApplications = getApplicationsByStatus('pending');
  const underReviewApplications = getApplicationsByStatus('under_review');
  const approvedApplications = getApplicationsByStatus('approved');
  
  // Get recent applications for status display
  const recentApplications = userApplications
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  // Mock educational resources
  const educationalResources = [
    "Understanding Mortgage Types in Nigeria",
    "How to Improve Your Mortgage Approval Chances",
    "First-Time Homebuyer's Guide",
    "Nigerian Mortgage Glossary"
  ];

  // Calculate mortgage details
  const loanAmount = homePrice - downPayment;
  const monthlyRate = interestRate / 100 / 12;
  const numberOfPayments = loanTerm * 12;
  const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
  const totalInterest = (monthlyPayment * numberOfPayments) - loanAmount;
  const totalPayment = monthlyPayment * numberOfPayments;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FaCheck className="text-green-600" />;
      case 'in-progress':
        return <FaClock className="text-yellow-600" />;
      case 'pending':
        return <FaTimes className="text-gray-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-4 sm:p-6 pb-8 sm:pb-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mortgage</h1>
        <p className="text-gray-600">
          Find the perfect mortgage solution for your dream home
        </p>
      </div>

      {/* Top Section - Mortgage Summary and Rates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Mortgage Summary */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Mortgage Summary</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <div className="p-3 bg-blue-100 rounded-lg w-fit mx-auto mb-2">
                <FaHome className="text-brand-blue text-xl" />
              </div>
              <p className="text-sm text-gray-600">Estimated Price Range</p>
              <p className="text-lg font-bold text-gray-900">₦25-45M</p>
            </div>
            <div className="text-center">
              <div className="p-3 bg-green-100 rounded-lg w-fit mx-auto mb-2">
                <FaMoneyBillWave className="text-green-600 text-xl" />
              </div>
              <p className="text-sm text-gray-600">Recommended Down Payment</p>
              <p className="text-lg font-bold text-gray-900">₦8.5M</p>
            </div>
            <div className="text-center">
              <div className="p-3 bg-orange-100 rounded-lg w-fit mx-auto mb-2">
                <FaPercentage className="text-brand-orange text-xl" />
              </div>
              <p className="text-sm text-gray-600">Current Avg. Interest Rate</p>
              <p className="text-lg font-bold text-gray-900">13.5%</p>
            </div>
            <div className="text-center">
              <div className="p-3 bg-purple-100 rounded-lg w-fit mx-auto mb-2">
                <FaCalendar className="text-purple-600 text-xl" />
              </div>
              <p className="text-sm text-gray-600">Typical Loan Term</p>
              <p className="text-lg font-bold text-gray-900">15-25 yrs</p>
            </div>
          </div>

          <div className="bg-brand-blue rounded-lg p-4 text-white">
            <h3 className="font-semibold mb-2">Get Pre-qualified Today</h3>
            <p className="text-sm mb-3">Get a personalized estimate of how much you can borrow before you start house hunting. No impact on your credit score.</p>
            <button 
              onClick={handlePreQualification}
              className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
              title="Start mortgage pre-qualification process"
            >
              <span>Start Pre-qualification</span>
              <FaArrowRight />
            </button>
          </div>
        </div>

        {/* Current Mortgage Rates */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Mortgage Rates</h2>
          
          <div className="space-y-3 mb-6">
            {mortgageRates.map((rate, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <p className="font-medium text-gray-900">{rate.type}</p>
                  <p className="text-sm text-gray-600">
                    {rate.trend === 'down' ? (
                      <span className="text-green-600 flex items-center">
                        <FaArrowDown className="mr-1" />
                        {Math.abs(rate.change)}% from last week
                      </span>
                    ) : (
                      <span className="text-red-600 flex items-center">
                        <FaArrowUp className="mr-1" />
                        +{rate.change}% from last week
                      </span>
                    )}
                  </p>
                </div>
                <p className="text-xl font-bold text-gray-900">{rate.rate}%</p>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-gray-900 mb-2">Rate Trends</h3>
            <div className="h-32 bg-white rounded border flex items-end justify-between px-2">
              {[13.2, 13.8, 14.1, 13.9, 13.5, 13.5].map((height, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div
                    className="w-6 bg-brand-blue rounded-t mb-1"
                    style={{ height: `${(height - 12) * 20}%` }}
                  ></div>
                  <span className="text-xs text-gray-600">{['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'][index]}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-gray-500 mb-2">Last updated: June 15, 2023 | Source: AfricaEstate Partners</p>
          <p className="text-xs text-gray-500 mb-2">Rates are subject to change</p>
          <a href="#" className="text-sm text-brand-blue hover:underline">View Detailed Trends</a>
        </div>
      </div>

      {/* Eligible Properties Section */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Mortgage Summary - Eligible Properties</h2>
          
          {/* Tabs */}
          <div className="flex space-x-4 sm:space-x-6 mb-4 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
            {(() => {
              // Calculate counts for each tab
              const tabCounts = {
                'all': allEligibleProperties.length,
                'pre-approved': allEligibleProperties.filter(p => p.isPreApproved).length,
                'residential': allEligibleProperties.filter(p => p.category === 'residential').length,
                'commercial': allEligibleProperties.filter(p => p.category === 'commercial').length,
                'new-developments': allEligibleProperties.filter(p => p.isNewDevelopment).length,
                'recently-added': allEligibleProperties.filter(p => p.isRecentlyAdded).length
              };
              
              return [
                { key: 'all', label: 'All Eligible' },
                { key: 'pre-approved', label: 'Pre-Approved' },
                { key: 'residential', label: 'Residential' },
                { key: 'commercial', label: 'Commercial' },
                { key: 'new-developments', label: 'New Developments' },
                { key: 'recently-added', label: 'Recently Added' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`pb-2 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0 px-1 ${
                    activeTab === tab.key
                      ? 'border-brand-blue text-brand-blue'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                  <span className="ml-1">({tabCounts[tab.key]})</span>
                </button>
              ));
            })()}
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap gap-4 items-center">
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">Location (All locations)</option>
              <option value="lagos">Lagos</option>
              <option value="abuja">Abuja</option>
              <option value="port-harcourt">Port Harcourt</option>
            </select>
            
            <select
              value={selectedPriceRange}
              onChange={(e) => setSelectedPriceRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="any">Price Range (Any price)</option>
              <option value="20-30m">₦20M - ₦30M</option>
              <option value="30-40m">₦30M - ₦40M</option>
              <option value="40-50m">₦40M - ₦50M</option>
            </select>
            
            <select
              value={selectedPropertyType}
              onChange={(e) => setSelectedPropertyType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">Property Type (All types)</option>
              <option value="apartment">Apartment</option>
              <option value="villa">Villa</option>
              <option value="penthouse">Penthouse</option>
            </select>
            
            <select
              value={selectedEligibility}
              onChange={(e) => setSelectedEligibility(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">Mortgage Eligibility (All eligibility)</option>
              <option value="ready">Mortgage Ready</option>
              <option value="pre-approved">Pre-Approved</option>
            </select>
            
            <button 
              onClick={handleFilterResults}
              className="btn-primary flex items-center space-x-2"
              title="Apply current filter selections"
            >
              <FaFilter />
              <span>Filter Results</span>
            </button>
            
            <button 
              onClick={handleResetFilters}
              className="p-2 text-gray-500 hover:text-gray-700"
              title="Reset all filters to default"
            >
              <FaRedo />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 pb-8">
          <p className="text-gray-600 mb-6">Found {eligibleProperties.length} mortgage-eligible {activeTab === 'all' ? 'properties' : activeTab.replace('-', ' ')}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {eligibleProperties.map((property) => (
              <div key={property.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="relative">
                  <img
                    src={property.image}
                    alt={property.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 right-2 flex flex-col space-y-1">
                    {property.tags.map((tag, index) => (
                      <span
                        key={index}
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          tag === 'Mortgage Ready' ? 'bg-green-100 text-green-800' :
                          tag === 'Verified' ? 'bg-blue-100 text-blue-800' :
                          tag === 'Featured' ? 'bg-purple-100 text-purple-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{property.title}</h3>
                  <p className="text-gray-600 mb-3">{property.location}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                    <span className="flex items-center">
                      <FaBed className="mr-1" />
                      {property.bedrooms} beds
                    </span>
                    <span className="flex items-center">
                      <FaBath className="mr-1" />
                      {property.bathrooms} baths
                    </span>
                    <span className="flex items-center">
                      <FaRuler className="mr-1" />
                      {property.area} m²
                    </span>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-600 mb-1">Estimated Monthly Payment</p>
                    <p className="text-xl font-bold text-gray-900">₦{property.monthlyPayment.toLocaleString()}/month</p>
                    <div className="text-xs text-gray-500 mt-1">
                      {property.downPaymentPercent}% Down Payment • {property.loanTerm} yrs Loan Term • {property.interestRate}% Interest Rate
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleViewProperty(property.id)}
                      className="flex-1 btn-outline text-sm"
                      title="View property details"
                    >
                      View Property
                    </button>
                    <button 
                      onClick={() => handleApplyMortgage(property)}
                      className="flex-1 btn-primary text-sm"
                      title="Apply for mortgage on this property"
                    >
                      Apply for Mortgage
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 flex justify-center">
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((page) => (
                <button
                  key={page}
                  onClick={() => handlePagination(page)}
                  className={`px-3 py-2 rounded-lg text-sm ${
                    page === 1
                      ? 'bg-brand-blue text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title={`Go to page ${page}`}
                >
                  {page}
                </button>
              ))}
              <span className="px-3 py-2 text-gray-500">...</span>
              <button 
                onClick={() => handlePagination(25)}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                title="Go to page 25"
              >
                25
              </button>
            </div>
          </div>
          
          <p className="text-xs text-gray-500 mt-4 text-center">
            All properties are verified by PropertyArk for mortgage eligibility.
          </p>
        </div>
      </div>

      {/* Bottom Section - Calculator, Lenders, Application Status, Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Quick Mortgage Calculator */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Mortgage Calculator</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Home Price</label>
              <MemoryInput
                type="number"
                fieldKey="mortgage.calculator.homePrice"
                value={homePrice}
                onChange={(val) => setHomePrice(parseInt(val || 0))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Down Payment</label>
              <MemoryInput
                type="number"
                fieldKey="mortgage.calculator.downPayment"
                value={downPayment}
                onChange={(val) => setDownPayment(parseInt(val || 0))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loan Term (Years): {loanTerm} Years
              </label>
              <input
                type="range"
                min="5"
                max="30"
                value={loanTerm}
                onChange={(e) => setLoanTerm(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>5 yrs</span>
                <span>30 yrs</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interest Rate (%): {interestRate}%
              </label>
              <input
                type="range"
                min="8"
                max="18"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>8%</span>
                <span>18%</span>
              </div>
            </div>
          </div>
          
          <div className="mt-6 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Loan Amount:</span>
              <span className="font-medium">₦{loanAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Interest:</span>
              <span className="font-medium">₦{totalInterest.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Payment:</span>
              <span className="font-medium">₦{totalPayment.toLocaleString()}</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-900">Monthly Payment:</span>
                <span className="text-lg font-bold text-brand-blue">₦{Math.round(monthlyPayment).toLocaleString()} / month</span>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-gray-500 mt-4">This is an estimate only</p>
          <a href="#" className="text-sm text-brand-blue hover:underline">Detailed Calculator</a>
        </div>

        {/* Approved Lender Partners */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Approved Lender Partners</h3>
          
          <div className="space-y-3">
            {lenderPartners.map((lender, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{lender.name}</p>
                  <div className="flex items-center space-x-1">
                    <FaStar className="text-yellow-500 text-sm" />
                    <span className="text-sm text-gray-600">{lender.rating}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{lender.rate}%</p>
                  <FaArrowRight className="text-gray-400" />
                </div>
              </div>
            ))}
          </div>
          
          <p className="text-sm text-gray-600 mt-4">7 lenders available in your area</p>
          <a href="#" className="text-sm text-brand-blue hover:underline">Compare All</a>
        </div>

        {/* Application Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Status</h3>
          
          {recentApplications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No applications yet</p>
              <button
                onClick={() => navigate('/mortgage')}
                className="text-sm text-blue-600 hover:underline"
              >
                Apply for Mortgage
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentApplications.map((application) => (
                <div key={application._id || application.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                  <div className={`p-2 rounded-full ${
                    application.status === 'approved' ? 'bg-green-100' :
                    application.status === 'rejected' ? 'bg-red-100' :
                    application.status === 'under_review' ? 'bg-blue-100' :
                    'bg-yellow-100'
                  }`}>
                    {application.status === 'approved' ? <FaCheckCircle className="text-green-600" /> :
                     application.status === 'rejected' ? <FaTimesCircle className="text-red-600" /> :
                     application.status === 'under_review' ? <FaInfoCircle className="text-blue-600" /> :
                     <FaClock className="text-yellow-600" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(application.createdAt).toLocaleDateString()}
                      </p>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        application.status === 'approved' ? 'bg-green-100 text-green-800' :
                        application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        application.status === 'under_review' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {application.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {application.property?.title || 'Prequalification Request'}
                    </p>
                    <p className="text-xs text-gray-600">
                      Amount: ₦{application.requestedAmount?.toLocaleString() || '0'} | 
                      Bank: {application.mortgageBank?.name || 'N/A'}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/mortgages/applications/${application._id || application.id}`)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {userApplications.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => navigate('/mortgages/applications')}
                className="text-sm text-blue-600 hover:underline w-full text-center"
              >
                View All Applications
              </button>
            </div>
          )}
        </div>

        {/* Educational Resources */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Educational Resources</h3>
          
          <div className="space-y-3">
            {educationalResources.map((resource, index) => (
              <div key={index} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg">
                <FaFileAlt className="text-gray-400" />
                <span className="text-sm text-gray-700">{resource}</span>
              </div>
            ))}
          </div>
          
          <p className="text-sm text-gray-600 mt-4">75 Resources available</p>
          <a href="#" className="text-sm text-brand-blue hover:underline">Compare All</a>
        </div>
      </div>

      {/* Mortgage Application Modal */}
      {showMortgageModal && selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Apply for Mortgage</h3>
            <p className="text-gray-600 mb-6">{selectedProperty.title}</p>
            
            {/* Property Summary */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h4 className="font-semibold text-gray-900 mb-2">Property Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Property Price:</strong> ₦{selectedProperty.price.toLocaleString()}</p>
                  <p><strong>Loan Amount:</strong> ₦{Math.round(selectedProperty.price * 0.8).toLocaleString()}</p>
                </div>
                <div>
                  <p><strong>Down Payment:</strong> ₦{Math.round(selectedProperty.price * 0.2).toLocaleString()}</p>
                  <p><strong>Monthly Payment:</strong> ₦{Math.round((selectedProperty.price * 0.8 * 0.185) / 12).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Bank Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Mortgage Bank <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedBankId}
                  onChange={(e) => setSelectedBankId(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300"
                >
                  <option value="">Choose a mortgage bank</option>
                  {banks.map((bank) => (
                    <option key={bank._id} value={bank._id}>
                      {bank.name}
                    </option>
                  ))}
                </select>
                {banks.length === 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    No mortgage banks are currently available. Please try again later.
                  </p>
                )}

                {/* Display Bank Products with Rates */}
                {selectedBankId && (() => {
                  const selectedBank = banks.find(b => b._id === selectedBankId || b.id === selectedBankId);
                  const activeProducts = selectedBank?.mortgageProducts?.filter(p => p.isActive) || [];
                  
                  if (activeProducts.length > 0) {
                    return (
                      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">
                          {selectedBank?.name} - Available Products & Rates
                        </h4>
                        <div className="space-y-3">
                          {activeProducts.map((product, index) => (
                            <div 
                              key={index} 
                              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h5 className="font-semibold text-gray-900 text-sm">{product.name}</h5>
                                  {product.description && (
                                    <p className="text-xs text-gray-600 mt-1">{product.description}</p>
                                  )}
                                </div>
                                <div className="ml-4 text-right">
                                  <div className="text-lg font-bold text-blue-600">
                                    {product.interestRate}%
                                  </div>
                                  <div className="text-xs text-gray-500 capitalize">
                                    {product.interestRateType}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t border-gray-100">
                                <div>
                                  <p className="text-xs text-gray-500">Loan Range</p>
                                  <p className="text-xs font-medium text-gray-900 mt-1">
                                    ₦{product.minLoanAmount?.toLocaleString()} - ₦{product.maxLoanAmount?.toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Down Payment</p>
                                  <p className="text-xs font-medium text-gray-900 mt-1">
                                    {product.minDownPaymentPercent}% min
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Max Term</p>
                                  <p className="text-xs font-medium text-gray-900 mt-1">
                                    {product.maxLoanTerm} years
                                  </p>
                                </div>
                                {product.eligibilityCriteria && (
                                  <div>
                                    <p className="text-xs text-gray-500">Requirements</p>
                                    <div className="text-xs text-gray-900 mt-1 space-y-0.5">
                                      {product.eligibilityCriteria.minMonthlyIncome > 0 && (
                                        <p>Income: ₦{product.eligibilityCriteria.minMonthlyIncome.toLocaleString()}/mo</p>
                                      )}
                                      {product.eligibilityCriteria.minCreditScore > 0 && (
                                        <p>Credit: {product.eligibilityCriteria.minCreditScore}+</p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-600 mt-3 italic">
                          * Rates and terms shown are indicative. Final terms subject to bank review and approval.
                        </p>
                      </div>
                    );
                  } else if (selectedBank && (!selectedBank.mortgageProducts || selectedBank.mortgageProducts.length === 0)) {
                    return (
                      <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-800">
                          <FaMoneyBillWave className="inline mr-2" />
                          {selectedBank.name} has no active mortgage products available at this time.
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
              {/* Employment Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="employed"
                      checked={employmentType === 'employed'}
                      onChange={(e) => setEmploymentType(e.target.value)}
                      className="mr-2"
                    />
                    Employed
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="self-employed"
                      checked={employmentType === 'self-employed'}
                      onChange={(e) => setEmploymentType(e.target.value)}
                      className="mr-2"
                    />
                    Self-Employed
                  </label>
                </div>
              </div>

              {/* Employment Details */}
              {employmentType === 'employed' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Employer Name</label>
                    <MemoryInput
                      fieldKey="mortgage.app.employerName"
                      value={employerName}
                      onChange={(val) => setEmployerName(val)}
                      placeholder="Company Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                    <MemoryInput
                      fieldKey="mortgage.app.jobTitle"
                      value={jobTitle}
                      onChange={(val) => setJobTitle(val)}
                      placeholder="Your Position"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Income (₦)</label>
                    <MemoryInput
                      type="number"
                      fieldKey="mortgage.app.monthlyIncome"
                      value={monthlyIncome}
                      onChange={(val) => setMonthlyIncome(val)}
                      placeholder="500000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Years of Employment</label>
                    <MemoryInput
                      type="number"
                      fieldKey="mortgage.app.yearsOfEmployment"
                      value={yearsOfEmployment}
                      onChange={(val) => setYearsOfEmployment(val)}
                      placeholder="5"
                    />
                  </div>
                </div>
              )}

              {/* Business Details */}
              {employmentType === 'self-employed' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                    <MemoryInput
                      fieldKey="mortgage.app.businessName"
                      value={businessName}
                      onChange={(val) => setBusinessName(val)}
                      placeholder="Business Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Type</label>
                    <MemoryInput
                      fieldKey="mortgage.app.businessType"
                      value={businessType}
                      onChange={(val) => setBusinessType(val)}
                      placeholder="e.g., Consulting, Trading"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Business Income (₦)</label>
                    <MemoryInput
                      type="number"
                      fieldKey="mortgage.app.businessMonthlyIncome"
                      value={businessMonthlyIncome}
                      onChange={(val) => setBusinessMonthlyIncome(val)}
                      placeholder="750000"
                    />
                  </div>
                </div>
              )}

              {/* Bank Statements Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Statements (Last 6 months)</label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  disabled={isUploading || isSubmitting}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {bankStatements.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">Selected files:</p>
                    <ul className="text-sm text-gray-500">
                      {bankStatements.map((file, index) => (
                        <li key={index}>• {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>
                      ))}
                    </ul>
                  </div>
                )}
                {isUploading && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                      <span>Uploading documents...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Terms and Conditions */}
              <div>
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mr-2 mt-1"
                  />
                  <span className="text-sm text-gray-700">
                    I accept the mortgage terms and conditions and agree to provide additional documents as required by the vendor.
                  </span>
                </label>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowMortgageModal(false);
                  setSelectedProperty(null);
                  setEmploymentType('employed');
                  setEmployerName('');
                  setJobTitle('');
                  setMonthlyIncome('');
                  setYearsOfEmployment('');
                  setBusinessName('');
                  setBusinessType('');
                  setBusinessMonthlyIncome('');
                  setBankStatements([]);
                  setAcceptTerms(false);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmMortgageApplication}
                disabled={isSubmitting || isUploading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isUploading ? (
                  <>
                    <FaClock className="animate-spin" />
                    <span>Uploading Documents ({uploadProgress}%)...</span>
                  </>
                ) : isSubmitting ? (
                  <>
                    <FaClock className="animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <span>Submit Application</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prequalification Modal */}
      {showPrequalificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Get Pre-qualified for a Mortgage</h3>
            <p className="text-gray-600 mb-6">Fill out this form to get pre-qualified and see how much you can borrow. No impact on your credit score.</p>
            
            <div className="space-y-6">
              {/* Bank Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Mortgage Bank <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedBankId}
                  onChange={(e) => setSelectedBankId(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300"
                >
                  <option value="">Choose a mortgage bank</option>
                  {banks.map((bank) => (
                    <option key={bank._id} value={bank._id}>
                      {bank.name}
                    </option>
                  ))}
                </select>
                {banks.length === 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    No mortgage banks are currently available. Please try again later.
                  </p>
                )}
              </div>

              {/* Employment Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="employed"
                      checked={employmentType === 'employed'}
                      onChange={(e) => setEmploymentType(e.target.value)}
                      className="mr-2"
                    />
                    Employed
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="self-employed"
                      checked={employmentType === 'self-employed'}
                      onChange={(e) => setEmploymentType(e.target.value)}
                      className="mr-2"
                    />
                    Self-Employed
                  </label>
                </div>
              </div>

              {/* Employment Details */}
              {employmentType === 'employed' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Employer Name</label>
                    <MemoryInput
                      fieldKey="mortgage.prequal.employerName"
                      value={employerName}
                      onChange={(val) => setEmployerName(val)}
                      placeholder="Company Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                    <MemoryInput
                      fieldKey="mortgage.prequal.jobTitle"
                      value={jobTitle}
                      onChange={(val) => setJobTitle(val)}
                      placeholder="Your Position"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Income (₦)</label>
                    <MemoryInput
                      type="number"
                      fieldKey="mortgage.prequal.monthlyIncome"
                      value={monthlyIncome}
                      onChange={(val) => setMonthlyIncome(val)}
                      placeholder="500000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Years of Employment</label>
                    <MemoryInput
                      type="number"
                      fieldKey="mortgage.prequal.yearsOfEmployment"
                      value={yearsOfEmployment}
                      onChange={(val) => setYearsOfEmployment(val)}
                      placeholder="5"
                    />
                  </div>
                </div>
              )}

              {/* Business Details */}
              {employmentType === 'self-employed' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                    <MemoryInput
                      fieldKey="mortgage.prequal.businessName"
                      value={businessName}
                      onChange={(val) => setBusinessName(val)}
                      placeholder="Business Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Type</label>
                    <MemoryInput
                      fieldKey="mortgage.prequal.businessType"
                      value={businessType}
                      onChange={(val) => setBusinessType(val)}
                      placeholder="e.g., Consulting, Trading"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Business Income (₦)</label>
                    <MemoryInput
                      type="number"
                      fieldKey="mortgage.prequal.businessMonthlyIncome"
                      value={businessMonthlyIncome}
                      onChange={(val) => setBusinessMonthlyIncome(val)}
                      placeholder="750000"
                    />
                  </div>
                </div>
              )}

              {/* Bank Statements Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Statements (Last 6 months) - Optional</label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  disabled={isUploading || isSubmitting}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {bankStatements.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">Selected files:</p>
                    <ul className="text-sm text-gray-500">
                      {bankStatements.map((file, index) => (
                        <li key={index}>• {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>
                      ))}
                    </ul>
                  </div>
                )}
                {isUploading && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                      <span>Uploading documents...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Terms and Conditions */}
              <div>
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mr-2 mt-1"
                  />
                  <span className="text-sm text-gray-700">
                    I accept the mortgage pre-qualification terms and conditions and agree to provide additional documents as required.
                  </span>
                </label>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowPrequalificationModal(false);
                  setEmploymentType('employed');
                  setEmployerName('');
                  setJobTitle('');
                  setMonthlyIncome('');
                  setYearsOfEmployment('');
                  setBusinessName('');
                  setBusinessType('');
                  setBusinessMonthlyIncome('');
                  setBankStatements([]);
                  setAcceptTerms(false);
                  setSelectedBankId('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePrequalificationSubmission}
                disabled={isSubmitting || isUploading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isUploading ? (
                  <>
                    <FaClock className="animate-spin" />
                    <span>Uploading Documents ({uploadProgress}%)...</span>
                  </>
                ) : isSubmitting ? (
                  <>
                    <FaClock className="animate-spin" />
                    <span>Submitting Request...</span>
                  </>
                ) : (
                  <span>Submit Pre-qualification</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Mortgage;



