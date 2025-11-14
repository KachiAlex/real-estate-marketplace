import React, { useState } from 'react';
import MemoryInput from '../components/MemoryInput';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaHome, FaMoneyBillWave, FaPercentage, FaCalendar, FaArrowRight, FaBed, FaBath, FaRuler, FaFilter, FaRedo, FaCheck, FaClock, FaTimes, FaFileAlt, FaStar, FaArrowDown, FaArrowUp } from 'react-icons/fa';
import toast from 'react-hot-toast';

const Mortgage = () => {
  const { user } = useAuth();
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
    toast.success('Pre-qualification started! You will be contacted within 24 hours.');
  };

  const handleViewProperty = (propertyId) => {
    navigate(`/property/${propertyId}`);
  };

  const [showMortgageModal, setShowMortgageModal] = useState(false);
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

  const handleConfirmMortgageApplication = () => {
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

    // Create mortgage application data
    const mortgageApplication = {
      id: `MORT-${Date.now()}`,
      propertyId: selectedProperty.id,
      propertyTitle: selectedProperty.title,
      propertyLocation: selectedProperty.location,
      propertyPrice: selectedProperty.price,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      status: 'pending_vendor_review',
      requestedAt: new Date().toISOString(),
      requestedAmount: Math.round(selectedProperty.price * 0.8), // 80% of property value
      downPayment: Math.round(selectedProperty.price * 0.2), // 20% down payment
      loanTerm: '25 years',
      interestRate: '18.5%',
      monthlyPayment: Math.round((selectedProperty.price * 0.8 * 0.185) / 12), // Rough calculation
      applicationType: 'residential_mortgage',
      employmentDetails: {
        type: employmentType,
        employerName,
        jobTitle,
        monthlyIncome: employmentType === 'employed' ? monthlyIncome : businessMonthlyIncome,
        yearsOfEmployment,
        businessName,
        businessType
      },
      bankStatements: bankStatements.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString()
      })),
      vendorResponse: null,
      documentsRequired: [
        'Proof of Income',
        'Bank Statements (6 months)',
        'Employment Letter',
        'Tax Returns',
        'Property Valuation Report',
        'Identity Documents'
      ],
      agentContact: {
        name: 'Mortgage Specialist',
        phone: '+234-800-MORTGAGE',
        email: 'mortgage@realestate.com'
      }
    };
    
    // Store in localStorage for demo
    const existingApplications = JSON.parse(localStorage.getItem('mortgageApplications') || '[]');
    existingApplications.push(mortgageApplication);
    localStorage.setItem('mortgageApplications', JSON.stringify(existingApplications));
    
    // Show success message with detailed information
    toast.success(`Mortgage application submitted for "${selectedProperty.title}"! The vendor will review your application.`);
    
    // Show additional info with mortgage details
    setTimeout(() => {
      toast.info(`Loan Amount: ₦${mortgageApplication.requestedAmount.toLocaleString()} | Monthly Payment: ₦${mortgageApplication.monthlyPayment.toLocaleString()}`);
    }, 1500);
    
    setTimeout(() => {
      toast.info(`You will be contacted within 24 hours by ${mortgageApplication.agentContact.name} (${mortgageApplication.agentContact.phone})`);
    }, 3000);
    
    // Reset modal
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
    
    console.log('Mortgage application created:', mortgageApplication);
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

  // Mock eligible properties data
  const eligibleProperties = [
    {
      id: 1,
      title: "Luxury Apartment in Ikoyi",
      location: "Ikoyi, Lagos",
      price: 38500000,
      image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop",
      bedrooms: 3,
      bathrooms: 3,
      area: 250,
      tags: ["Mortgage Ready", "Verified", "Featured"],
      monthlyPayment: 364720,
      downPaymentPercent: 20,
      loanTerm: 20,
      interestRate: 13.5
    },
    {
      id: 2,
      title: "Modern Villa in Victoria Island",
      location: "Victoria Island, Lagos",
      price: 45000000,
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop",
      bedrooms: 4,
      bathrooms: 4,
      area: 320,
      tags: ["Mortgage Ready", "Verified", "New"],
      monthlyPayment: 425000,
      downPaymentPercent: 20,
      loanTerm: 20,
      interestRate: 13.5
    },
    {
      id: 3,
      title: "Penthouse in Lekki",
      location: "Lekki, Lagos",
      price: 52000000,
      image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=300&fit=crop",
      bedrooms: 5,
      bathrooms: 5,
      area: 400,
      tags: ["Mortgage Ready", "Verified", "Featured"],
      monthlyPayment: 490000,
      downPaymentPercent: 20,
      loanTerm: 20,
      interestRate: 13.5
    }
  ];

  // Mock lender partners data
  const lenderPartners = [
    { name: "First Bank of Nigeria", rating: 4.7, rate: 13.2 },
    { name: "Access Bank", rating: 4.7, rate: 13.2 },
    { name: "UBA Mortgages", rating: 4.7, rate: 13.2 },
    { name: "Zenith Bank", rating: 4.7, rate: 13.2 }
  ];

  // Mock application status data
  const applicationStatus = [
    {
      date: "August 10, 2025",
      title: "Application Submitted",
      status: "completed",
      description: "Your mortgage application has been received and is being processed."
    },
    {
      date: "August 12, 2025",
      title: "Document Verification",
      status: "completed",
      description: "Your identification and financial documents have been verified."
    },
    {
      date: "In Progress",
      title: "Credit Assessment",
      status: "in-progress",
      description: "Your credit history is being reviewed to determine loan eligibility."
    },
    {
      date: "Pending",
      title: "Property Appraisal",
      status: "pending",
      description: "An independent appraisal will determine the property's value."
    },
    {
      date: "Pending",
      title: "Final Approval",
      status: "pending",
      description: "Final review and approval of your mortgage application."
    }
  ];

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
    <div className="p-6">
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
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Mortgage Summary - Eligible Properties</h2>
          
          {/* Tabs */}
          <div className="flex space-x-6 mb-4">
            {[
              { key: 'all', label: 'All Eligible (24)' },
              { key: 'pre-approved', label: 'Pre-Approved (0)' },
              { key: 'residential', label: 'Residential (12)' },
              { key: 'commercial', label: 'Commercial (4)' },
              { key: 'new-developments', label: 'New Developments (8)' },
              { key: 'recently-added', label: 'Recently Added (0)' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`pb-2 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-brand-blue text-brand-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
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

        <div className="p-6">
          <p className="text-gray-600 mb-6">Found 24 mortgage-eligible properties</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      {property.area} mÂ²
                    </span>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-600 mb-1">Estimated Monthly Payment</p>
                    <p className="text-xl font-bold text-gray-900">₦{property.monthlyPayment.toLocaleString()}/month</p>
                    <div className="text-xs text-gray-500 mt-1">
                      {property.downPaymentPercent}% Down Payment â€¢ {property.loanTerm} yrs Loan Term â€¢ {property.interestRate}% Interest Rate
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
            All properties are verified by Property Ark for mortgage eligibility.
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
          
          <div className="space-y-4">
            {applicationStatus.map((status, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className={`p-2 rounded-full ${getStatusColor(status.status)}`}>
                  {getStatusIcon(status.status)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="text-sm font-medium text-gray-900">{status.date}</p>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(status.status)}`}>
                      {status.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{status.title}</p>
                  <p className="text-xs text-gray-600">{status.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">Application ID: MO-2025-005872</p>
            <a href="#" className="text-sm text-brand-blue hover:underline">View Details</a>
          </div>
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {bankStatements.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">Uploaded files:</p>
                    <ul className="text-sm text-gray-500">
                      {bankStatements.map((file, index) => (
                        <li key={index}>â€¢ {file.name}</li>
                      ))}
                    </ul>
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
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Submit Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Mortgage;



