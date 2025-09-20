import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useInvestment } from '../contexts/InvestmentContext';
import { FaChartLine, FaFilter, FaDownload, FaBookmark, FaCheck, FaMapMarkerAlt, FaUsers, FaCalendar, FaArrowUp, FaEye, FaHeart, FaShieldAlt, FaFileContract, FaLock, FaHandshake, FaBuilding } from 'react-icons/fa';
import toast from 'react-hot-toast';

const Investment = () => {
  const navigate = useNavigate();
  const { user, setAuthRedirect } = useAuth();
  const { investments, userInvestments, investInOpportunity } = useInvestment();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedProject, setSelectedProject] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [investmentAmount, setInvestmentAmount] = useState(500000);
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState(null);

  // Calculate real investment data from context
  const calculateInvestmentData = () => {
    const totalInvested = userInvestments?.reduce((sum, inv) => sum + inv.amount, 0) || 0;
    const totalEarnings = userInvestments?.reduce((sum, inv) => sum + (inv.currentValue - inv.amount), 0) || 0;
    const activeInvestments = userInvestments?.filter(inv => inv.status === 'active').length || 0;
    const projectedReturns = userInvestments?.reduce((sum, inv) => {
      const opportunity = investments?.find(opp => opp.id === inv.investmentId);
      return sum + (inv.amount * (opportunity?.expectedReturn || 0) / 100);
    }, 0) || 0;

    return {
      totalInvested,
      totalEarnings,
      activeInvestments,
      projectedReturns,
    portfolio: {
        investedCapital: totalInvested,
        currentValue: totalInvested + totalEarnings,
        totalProjects: activeInvestments,
        availableForWithdrawal: totalEarnings * 0.1 // 10% of earnings available for withdrawal
      }
    };
  };

  const investmentData = calculateInvestmentData();

  const [projects, setProjects] = useState([
    {
      id: 1,
      name: "Azure Heights Complex",
      location: "Lekki, Lagos",
      type: "Development",
      description: "Luxury apartment complex",
      minInvestment: 100000,
      expectedROI: 18.5,
      lockPeriod: 24,
      investors: 142,
      image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop",
      status: "verified",
      progress: "Construction",
      completionDate: "Dec 2027"
    },
    {
      id: 2,
      name: "Green Valley Estate",
      location: "Abuja, FCT",
      type: "Land",
      description: "Premium land plots",
      minInvestment: 250000,
      expectedROI: 22,
      lockPeriod: 12,
      investors: 86,
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop",
      status: "verified",
      progress: "Development",
      completionDate: "Jun 2026"
    },
    {
      id: 3,
      name: "Riverside Commercial Hub",
      location: "Port Harcourt",
      type: "Development",
      description: "Mixed-use commercial complex",
      minInvestment: 500000,
      expectedROI: 20.5,
      lockPeriod: 36,
      investors: 211,
      image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=300&fit=crop",
      status: "verified",
      progress: "Construction",
      completionDate: "Mar 2028"
    },
    {
      id: 4,
      name: "Seaside Haven Plots",
      location: "Calabar",
      type: "Land",
      description: "Premium beachfront land plots",
      minInvestment: 150000,
      expectedROI: 24,
      lockPeriod: 18,
      investors: 68,
      image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&h=300&fit=crop",
      status: "verified",
      progress: "Start",
      completionDate: "Sep 2026"
    },
    {
      id: 5,
      name: "Tranquil Gardens Estate",
      location: "Ibadan",
      type: "Development",
      description: "Planned residential community",
      minInvestment: 200000,
      expectedROI: 17,
      lockPeriod: 30,
      investors: 95,
      image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop",
      status: "verified",
      progress: "Construction",
      completionDate: "Aug 2027"
    },
    {
      id: 6,
      name: "Green Harvest Farms",
      location: "Kaduna",
      type: "Land",
      description: "Agricultural land",
      minInvestment: 100000,
      expectedROI: 16,
      lockPeriod: 12,
      investors: 124,
      image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop",
      status: "verified",
      progress: "Start",
      completionDate: "Dec 2025"
    }
  ]);

  // Set default selected project
  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0]);
    }
  }, [projects, selectedProject]);

  const filteredProjects = projects.filter(project => {
    if (filterType === 'all') return true;
    if (filterType === 'land') return project.type === 'Land';
    if (filterType === 'development') return project.type === 'Development';
    if (filterType === 'highest-roi') return project.expectedROI >= 20;
    return true;
  });

  const calculateOwnership = (amount) => {
    // Mock calculation - in real app this would be based on project valuation
    return (amount / 80000000 * 100).toFixed(3);
  };

  const handleInvestNow = (project) => {
    if (!user) {
      setAuthRedirect('/investment');
      toast.error('Please login to invest');
      navigate('/login');
      return;
    }
    setSelectedProject(project);
    setShowInvestmentModal(true);
  };

  const handleConfirmInvestment = async () => {
    if (!selectedProject || !investmentAmount) {
      toast.error('Please enter a valid investment amount');
      return;
    }

    if (investmentAmount < selectedProject.minInvestment) {
      toast.error(`Minimum investment is ₦${selectedProject.minInvestment.toLocaleString()}`);
      return;
    }

    try {
      // Create investment escrow transaction
      const investmentEscrow = {
        id: `INV-${Date.now()}`,
        investmentId: selectedProject.id,
        investmentTitle: selectedProject.name,
        amount: investmentAmount,
        escrowFee: Math.round(investmentAmount * 0.005), // 0.5% escrow fee
        totalAmount: investmentAmount + Math.round(investmentAmount * 0.005),
        status: 'pending_documents',
        createdAt: new Date().toISOString(),
        investor: `${user.firstName} ${user.lastName}`,
        vendor: selectedProject.sponsor?.name || 'Investment Sponsor',
        type: 'investment',
        documentStatus: 'awaiting_vendor_documents',
        collateralProperty: selectedProject.collateralProperty || 'Property deed pending vendor submission',
        expectedROI: selectedProject.expectedROI,
        lockPeriod: selectedProject.lockPeriod
      };

      // Store in localStorage for demo
      const existingEscrows = JSON.parse(localStorage.getItem('escrowTransactions') || '[]');
      existingEscrows.push(investmentEscrow);
      localStorage.setItem('escrowTransactions', JSON.stringify(existingEscrows));

      // Call context function
      await investInOpportunity(selectedProject.id, investmentAmount);

      toast.success('Investment initiated! Funds held in escrow pending document verification.');
      setShowInvestmentModal(false);
      setSelectedProject(null);
      setInvestmentAmount(500000);
    } catch (error) {
      console.error('Investment error:', error);
      toast.error('Failed to process investment');
    }
  };

  const handleViewDocuments = (investment) => {
    setSelectedInvestment(investment);
    setShowDocumentModal(true);
  };

  const handleDownloadDocument = (docType, investment = selectedInvestment) => {
    // Generate and download investment documents
    const docContent = generateInvestmentDocument(docType, investment);
    downloadDocument(docContent, `${docType}-${investment?.id || 'investment'}.html`);
    toast.success(`${docType} document downloaded successfully!`);
  };

  const generateInvestmentDocument = (docType, investment) => {
    const templates = {
      'Investment Agreement': `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Investment Agreement - ${investment?.investmentTitle}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
            .header { text-align: center; border-bottom: 2px solid #f97316; padding-bottom: 20px; margin-bottom: 30px; }
            .section { margin-bottom: 25px; }
            .highlight { background: #fef3c7; padding: 10px; border-left: 4px solid #f59e0b; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🏠 NAIJA LUXURY HOMES</h1>
            <h2>INVESTMENT AGREEMENT</h2>
            <p>Agreement ID: ${investment?.id}</p>
          </div>
          
          <div class="section">
            <h3>1. INVESTMENT DETAILS</h3>
            <p><strong>Investment Project:</strong> ${investment?.investmentTitle}</p>
            <p><strong>Investment Amount:</strong> ₦${investment?.amount?.toLocaleString()}</p>
            <p><strong>Expected ROI:</strong> ${investment?.expectedROI}% per annum</p>
            <p><strong>Lock Period:</strong> ${investment?.lockPeriod} months</p>
            <p><strong>Investor:</strong> ${investment?.investor}</p>
            <p><strong>Vendor/Sponsor:</strong> ${investment?.vendor}</p>
          </div>

          <div class="section">
            <h3>2. ESCROW PROTECTION</h3>
            <div class="highlight">
              <p><strong>🔒 FUND SECURITY:</strong> Your investment of ₦${investment?.amount?.toLocaleString()} is held in escrow until the vendor provides original property documents and deed as collateral.</p>
            </div>
            <p><strong>Collateral Property:</strong> ${investment?.collateralProperty}</p>
            <p><strong>Document Status:</strong> ${investment?.documentStatus}</p>
          </div>

          <div class="section">
            <h3>3. VENDOR OBLIGATIONS</h3>
            <ul>
              <li>Provide original property title documents</li>
              <li>Submit property deed as investment collateral</li>
              <li>Maintain property insurance and legal compliance</li>
              <li>Provide quarterly investment reports</li>
              <li>Ensure timely dividend payments</li>
            </ul>
          </div>

          <div class="section">
            <h3>4. INVESTOR RIGHTS</h3>
            <ul>
              <li>Funds protected in escrow until document verification</li>
              <li>Legal claim on collateral property if vendor defaults</li>
              <li>Quarterly dividend payments as per agreed ROI</li>
              <li>Access to investment performance reports</li>
              <li>Right to withdraw after lock period</li>
            </ul>
          </div>

          <div class="section">
            <h3>5. TERMS & CONDITIONS</h3>
            <p>This agreement is governed by Nigerian law. Investment funds are held in escrow pending vendor document submission. Release of funds occurs only after verification of original property documents by Naija Luxury Homes legal team.</p>
          </div>

          <div class="section">
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Digital Signature:</strong> Electronically signed via Naija Luxury Homes platform</p>
          </div>
        </body>
        </html>
      `,
      'Escrow Terms': `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Escrow Terms - ${investment?.investmentTitle}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
            .header { text-align: center; border-bottom: 2px solid #f97316; padding-bottom: 20px; margin-bottom: 30px; }
            .section { margin-bottom: 25px; }
            .warning { background: #fef2f2; padding: 15px; border-left: 4px solid #ef4444; color: #991b1b; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔒 ESCROW TERMS & CONDITIONS</h1>
            <p>Investment Escrow ID: ${investment?.id}</p>
          </div>

          <div class="section">
            <h3>ESCROW FUND PROTECTION</h3>
            <p>Your investment amount of <strong>₦${investment?.amount?.toLocaleString()}</strong> is held in a secure escrow account managed by Naija Luxury Homes until all conditions are met.</p>
          </div>

          <div class="section">
            <h3>DOCUMENT VERIFICATION PROCESS</h3>
            <ol>
              <li><strong>Vendor Document Submission:</strong> Vendor must provide original property title documents</li>
              <li><strong>Legal Verification:</strong> Our legal team verifies document authenticity</li>
              <li><strong>Collateral Registration:</strong> Property deed registered as investment collateral</li>
              <li><strong>Fund Release:</strong> Investment funds released to vendor after verification</li>
            </ol>
          </div>

          <div class="warning">
            <h4>⚠️ IMPORTANT PROTECTION NOTICE</h4>
            <p>Funds will NOT be released to the vendor until:</p>
            <ul>
              <li>✅ Original property documents are submitted</li>
              <li>✅ Legal verification is completed</li>
              <li>✅ Property deed is registered as collateral</li>
              <li>✅ All terms and conditions are met</li>
            </ul>
          </div>

          <div class="section">
            <h3>INVESTOR PROTECTION</h3>
            <p>In case of vendor default or non-performance, investors have legal claim on the collateral property equal to their investment value.</p>
          </div>
        </body>
        </html>
      `,
      'Risk Disclosure': `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Investment Risk Disclosure</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
            .header { text-align: center; border-bottom: 2px solid #f97316; padding-bottom: 20px; margin-bottom: 30px; }
            .risk { background: #fef2f2; padding: 15px; border: 1px solid #fecaca; border-radius: 8px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>⚠️ INVESTMENT RISK DISCLOSURE</h1>
            <p>Please read carefully before investing</p>
          </div>

          <div class="risk">
            <h3>MARKET RISKS</h3>
            <p>Real estate investments are subject to market fluctuations, economic conditions, and property value changes.</p>
          </div>

          <div class="risk">
            <h3>LIQUIDITY RISK</h3>
            <p>Investments have lock periods. Early withdrawal may not be possible or may incur penalties.</p>
          </div>

          <div class="risk">
            <h3>VENDOR RISK</h3>
            <p>Investment performance depends on vendor execution. Collateral property provides security but does not guarantee returns.</p>
          </div>

          <div class="risk">
            <h3>REGULATORY RISK</h3>
            <p>Changes in real estate regulations or tax laws may affect investment returns.</p>
          </div>

          <div class="section">
            <h3>INVESTOR ACKNOWLEDGMENT</h3>
            <p>By investing, you acknowledge that you understand these risks and that past performance does not guarantee future results.</p>
          </div>
        </body>
        </html>
      `
    };

    return templates[docType] || '';
  };

  const downloadDocument = (content, filename) => {
    const blob = new Blob([content], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const calculateReturns = (amount, roi) => {
    return (amount * roi / 100).toFixed(0);
  };

  if (selectedProject) {
    return (
      <div className="p-6">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="text-sm">
            <span className="text-gray-500">Investment</span>
            <span className="mx-2 text-gray-400">|</span>
            <span className="text-gray-900 font-medium">{selectedProject.name}</span>
          </nav>
        </div>

        {/* Project Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                  {selectedProject.type}
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                  Verified
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedProject.name}</h1>
              <div className="flex items-center text-gray-600 mb-4">
                <FaMapMarkerAlt className="mr-2" />
                <span>{selectedProject.location}</span>
              </div>
              <p className="text-gray-700 mb-6">{selectedProject.description}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Expected ROI</p>
                  <p className="text-xl font-bold text-green-600">{selectedProject.expectedROI}% p.a</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Lock Period</p>
                  <p className="text-xl font-bold text-gray-900">{selectedProject.lockPeriod} months</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Current Investors</p>
                  <p className="text-xl font-bold text-gray-900">{selectedProject.investors}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Completion Date</p>
                  <p className="text-xl font-bold text-gray-900">{selectedProject.completionDate}</p>
                </div>
              </div>
            </div>
            <img
              src={selectedProject.image}
              alt={selectedProject.name}
              className="w-64 h-48 object-cover rounded-lg"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {['Investment Details', 'Documents', 'Project Updates', 'Developer Info', 'FAQs'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab.toLowerCase().replace(' ', ''))}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.toLowerCase().replace(' ', '')
                      ? 'border-brand-blue text-brand-blue'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'investmentdetails' && (
              <div className="space-y-8">
                {/* Investment Calculator */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Investment Calculator</h3>
                  <p className="text-gray-600 mb-4">Adjust your investment amount to see potential returns and ownership percentage</p>
                  
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="mb-6">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>₦100K</span>
                        <span>₦500K</span>
                        <span>₦1M</span>
                        <span>₦1.5M</span>
                        <span>₦2M</span>
                      </div>
                      <input
                        type="range"
                        min="100000"
                        max="2000000"
                        step="50000"
                        value={investmentAmount}
                        onChange={(e) => setInvestmentAmount(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Your investment</label>
                        <input
                          type="text"
                          value={`₦${investmentAmount.toLocaleString()}`}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Your ownership percentage</label>
                        <div className="text-2xl font-bold text-brand-blue">
                          {calculateOwnership(investmentAmount)}%
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Estimated annual returns</label>
                        <div className="text-2xl font-bold text-brand-blue">
                          ₦{calculateReturns(investmentAmount, selectedProject.expectedROI)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Projected Returns Chart */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Projected Returns</h3>
                  <p className="text-gray-600 mb-4">Based on historical performance and project timeline</p>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="h-64 flex items-end justify-between space-x-2">
                      {[
                        { quarter: 'Q1', value: 15, amount: 2.1 },
                        { quarter: 'Q2', value: 18, amount: 2.8 },
                        { quarter: 'Q3', value: 22, amount: 3.2 },
                        { quarter: 'Q4', value: 25, amount: 3.8 },
                        { quarter: 'Q5', value: 28, amount: 4.1 },
                        { quarter: 'Q6', value: 30, amount: 4.5 },
                        { quarter: 'Q7', value: 32, amount: 4.8 },
                        { quarter: 'Q8', value: 35, amount: 5.2 }
                      ].map((data, index) => (
                        <div key={index} className="flex flex-col items-center group relative">
                          <div className="absolute -top-8 bg-gray-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                            ₦{data.amount}M
                          </div>
                          <div
                            className="w-8 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t mb-2 transition-all duration-300 hover:from-orange-600 hover:to-orange-400 cursor-pointer"
                            style={{ height: `${data.value * 2}px` }}
                            title={`${data.quarter}: ₦${data.amount}M projected return`}
                          ></div>
                          <span className="text-xs text-gray-600 font-medium">{data.quarter}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex justify-between text-sm text-gray-500">
                      <span>0%</span>
                      <span className="text-center">Investment Growth Timeline</span>
                      <span>35%</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <button 
                    onClick={() => handleInvestNow(selectedProject || projects[0])}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <FaCheck />
                    <span>Invest Now</span>
                  </button>
                  <button 
                    onClick={() => {
                      if (!user) {
                        toast.error('Please login to add to wishlist');
                        navigate('/login');
                        return;
                      }
                      toast.success('Added to wishlist!');
                    }}
                    className="btn-outline flex items-center space-x-2"
                  >
                    <FaBookmark />
                    <span>Add to Wishlist</span>
                  </button>
                  <button 
                    onClick={() => {
                      const dummyInvestment = {
                        id: 'SAMPLE-001',
                        investmentTitle: selectedProject?.name || 'Sample Investment',
                        amount: 500000,
                        expectedROI: selectedProject?.expectedROI || 18,
                        lockPeriod: selectedProject?.lockPeriod || 24,
                        investor: user ? `${user.firstName} ${user.lastName}` : 'Sample Investor',
                        vendor: selectedProject?.sponsor?.name || 'Sample Vendor',
                        documentStatus: 'sample_document',
                        collateralProperty: 'Sample Property Collateral'
                      };
                      handleDownloadDocument('Investment Agreement', dummyInvestment);
                    }}
                    className="btn-outline flex items-center space-x-2"
                  >
                    <FaDownload />
                    <span>Download Prospectus</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Investment</h1>
        <p className="text-gray-600">
          Discover and invest in premium real estate projects across Nigeria
        </p>
      </div>

      {/* Investment Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FaChartLine className="text-brand-blue text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total invested</p>
              <p className="text-2xl font-bold text-gray-900">₦{investmentData.totalInvested.toLocaleString()}</p>
              <p className="text-sm text-green-600">+12.5% from last month</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <FaArrowUp className="text-green-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-900">₦{investmentData.totalEarnings.toLocaleString()}</p>
              <p className="text-sm text-green-600">+8.3% growth rate</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <FaUsers className="text-brand-orange text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active investments</p>
              <p className="text-2xl font-bold text-gray-900">{investmentData.activeInvestments}</p>
              <p className="text-sm text-green-600">+2 new this quarter</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <FaCalendar className="text-purple-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Projected Returns</p>
              <p className="text-2xl font-bold text-gray-900">₦{investmentData.projectedReturns.toLocaleString()}</p>
              <p className="text-sm text-gray-600">projected by Q3 2025</p>
            </div>
          </div>
        </div>
      </div>

      {/* Project Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-wrap gap-3">
          {['All Projects', 'Land', 'Development', '% Highest ROI', 'Price: Low to High'].map((filter) => (
            <button
              key={filter}
              onClick={() => setFilterType(filter.toLowerCase().replace(' ', '').replace(':', ''))}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === filter.toLowerCase().replace(' ', '').replace(':', '') || 
                (filter === 'All Projects' && filterType === 'all')
                  ? 'bg-brand-blue text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Project Listings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredProjects.map((project) => (
          <div key={project.id} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="relative">
              <img
                src={project.image}
                alt={project.name}
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-2 right-2">
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  Verified
                </span>
              </div>
              <div className="absolute top-2 left-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  project.type === 'Land' 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {project.type}
                </span>
              </div>
            </div>
            
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.name}</h3>
              <div className="flex items-center text-gray-600 mb-2">
                <FaMapMarkerAlt className="mr-1 text-sm" />
                <span className="text-sm">{project.location}</span>
              </div>
              <p className="text-gray-600 text-sm mb-4">{project.description}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Min Investment</p>
                  <p className="font-semibold">₦{project.minInvestment.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Expected ROI</p>
                  <p className="font-semibold text-green-600">{project.expectedROI}% p.a</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Lock Period</p>
                  <p className="font-semibold">{project.lockPeriod} months</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Investors</p>
                  <p className="font-semibold">{project.investors}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Start</span>
                  <span>Construction</span>
                  <span>Completion</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`h-2 rounded-full ${
                    project.progress === 'Start' ? 'w-1/3 bg-yellow-500' :
                    project.progress === 'Construction' ? 'w-2/3 bg-blue-500' :
                    'w-full bg-green-500'
                  }`}></div>
                </div>
              </div>
              
              <button
                onClick={() => handleInvestNow(project)}
                className="w-full btn-primary"
              >
                Invest Now
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Portfolio Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Your Investment Portfolio</h2>
        </div>
        
        <div className="p-6">
          <div className="flex space-x-8 mb-6">
            {['Overview', 'Active investments', 'Returns History', 'Available for Liquidation'].map((tab) => (
              <button
                key={tab}
                className={`pb-2 border-b-2 font-medium text-sm ${
                  tab === 'Overview'
                    ? 'border-brand-blue text-brand-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Your invested Capital</p>
              <p className="text-2xl font-bold text-gray-900">₦{investmentData.portfolio.investedCapital.toLocaleString()}</p>
              <p className="text-sm text-green-600">+₦350,000 this quarter</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Current Portfolio Value</p>
              <p className="text-2xl font-bold text-gray-900">₦{investmentData.portfolio.currentValue.toLocaleString()}</p>
              <p className="text-sm text-green-600">20.8% growth</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Total Projects</p>
              <p className="text-2xl font-bold text-gray-900">{investmentData.portfolio.totalProjects} Active</p>
              <p className="text-sm text-gray-600">2 completed projects</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Available for Withdrawal</p>
              <p className="text-2xl font-bold text-gray-900">₦{investmentData.portfolio.availableForWithdrawal.toLocaleString()}</p>
              <p className="text-sm text-gray-600">₦320,000 unlocking in 30 days</p>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <button className="btn-primary">
              View Detailed ROI Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Investment Modal */}
      {showInvestmentModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Invest in {selectedProject.name}</h3>
            
            {/* Investment Summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Project</p>
                  <p className="font-semibold">{selectedProject.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-semibold">{selectedProject.location}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Expected ROI</p>
                  <p className="font-semibold text-green-600">{selectedProject.expectedROI}% per annum</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Lock Period</p>
                  <p className="font-semibold">{selectedProject.lockPeriod} months</p>
                </div>
              </div>
            </div>

            {/* Investment Amount */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Investment Amount (₦)
              </label>
              <input
                type="number"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(parseInt(e.target.value))}
                min={selectedProject.minInvestment}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder={`Minimum: ₦${selectedProject.minInvestment.toLocaleString()}`}
              />
              <p className="text-sm text-gray-600 mt-1">
                Minimum investment: ₦{selectedProject.minInvestment.toLocaleString()}
              </p>
            </div>

            {/* Investment Calculation */}
            {investmentAmount >= selectedProject.minInvestment && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-blue-900 mb-3">Investment Projection</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Your Investment</p>
                    <p className="font-bold text-lg">₦{investmentAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Projected Annual Return</p>
                    <p className="font-bold text-lg text-green-600">₦{calculateReturns(investmentAmount, selectedProject.expectedROI)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Ownership Percentage</p>
                    <p className="font-bold">{calculateOwnership(investmentAmount)}%</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Escrow Fee (0.5%)</p>
                    <p className="font-bold">₦{Math.round(investmentAmount * 0.005).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Escrow Protection Notice */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <FaShieldAlt className="text-orange-600 mt-1" />
                <div>
                  <h4 className="font-semibold text-orange-900 mb-2">🔒 Escrow Protection</h4>
                  <div className="text-sm text-orange-800 space-y-1">
                    <p>• Your investment is held in secure escrow until vendor provides property documents</p>
                    <p>• Vendor must submit original property deed as collateral equal to investment value</p>
                    <p>• Funds released only after legal verification of documents</p>
                    <p>• You have legal claim on collateral property if vendor defaults</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Requirements */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <FaFileContract className="mr-2" />
                Required Vendor Documents
              </h4>
              <div className="text-sm text-gray-700 space-y-1">
                <p>✅ Original Certificate of Occupancy (C of O)</p>
                <p>✅ Property deed and title documents</p>
                <p>✅ Survey plan and property valuation</p>
                <p>✅ Property insurance documentation</p>
                <p>✅ Vendor identification and business registration</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => setShowInvestmentModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmInvestment}
                disabled={!investmentAmount || investmentAmount < selectedProject.minInvestment}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Confirm Investment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Modal */}
      {showDocumentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Investment Documents</h3>
            
            <div className="space-y-3">
              <button
                onClick={() => handleDownloadDocument('Investment Agreement')}
                className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <FaFileContract className="text-orange-600 mr-3" />
                  <span>Investment Agreement</span>
                </div>
                <FaDownload className="text-gray-400" />
              </button>

              <button
                onClick={() => handleDownloadDocument('Escrow Terms')}
                className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <FaLock className="text-blue-600 mr-3" />
                  <span>Escrow Terms & Conditions</span>
                </div>
                <FaDownload className="text-gray-400" />
              </button>

              <button
                onClick={() => handleDownloadDocument('Risk Disclosure')}
                className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <FaShieldAlt className="text-red-600 mr-3" />
                  <span>Risk Disclosure Statement</span>
                </div>
                <FaDownload className="text-gray-400" />
              </button>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setShowDocumentModal(false)}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Investment;
