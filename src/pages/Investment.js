import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useInvestment } from '../contexts/InvestmentContext';
import { FaChartLine, FaFilter, FaDownload, FaBookmark, FaCheck, FaMapMarkerAlt, FaUsers, FaCalendar, FaArrowUp, FaEye, FaHeart, FaShieldAlt, FaFileContract, FaLock, FaHandshake, FaBuilding, FaExclamationTriangle, FaClock, FaPhone, FaEnvelope, FaGlobe, FaChevronDown, FaQuestionCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import InvestmentChart from '../components/InvestmentChart';

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
  // Payment flow state (modal-based)
  const [paymentMethod, setPaymentMethod] = useState('flutterwave');
  const [acceptInvestmentTerms, setAcceptInvestmentTerms] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');
  const [createdEscrow, setCreatedEscrow] = useState(null);

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
    console.log('Invest Now clicked, project:', project, 'user:', user);
    
    if (!user) {
      setAuthRedirect('/investment');
      toast.error('Please login to invest');
      navigate('/login');
      return;
    }
    
    // Ensure we have a project to work with
    const projectToUse = project || projects[0];
    if (!projectToUse) {
      toast.error('No investment project available');
      return;
    }
    
    console.log('Setting selected project:', projectToUse);
    setSelectedProject(projectToUse);
    setShowInvestmentModal(true);
    console.log('Investment modal should now be visible');
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

    if (!acceptInvestmentTerms) {
      toast.error('Please accept the investment terms to proceed');
      return;
    }

    try {
      setIsProcessingPayment(true);

      // Create investment escrow transaction
      const reference = `FLW-${Math.floor(100000 + Math.random()*900000)}`;
      const investmentEscrow = {
        id: `INV-${Date.now()}`,
        investmentId: selectedProject.id,
        investmentTitle: selectedProject.name,
        amount: investmentAmount,
        escrowFee: Math.round(investmentAmount * 0.005), // 0.5% escrow fee
        totalAmount: investmentAmount + Math.round(investmentAmount * 0.005),
        status: 'paid_held_in_escrow',
        createdAt: new Date().toISOString(),
        investor: `${user.firstName} ${user.lastName}`,
        vendor: selectedProject.sponsor?.name || 'Investment Sponsor',
        type: 'investment',
        documentStatus: 'awaiting_vendor_documents',
        payment: {
          method: paymentMethod,
          reference,
          paidAt: new Date().toISOString()
        },
        collateralProperty: selectedProject.collateralProperty || 'Property deed pending vendor submission',
        expectedROI: selectedProject.expectedROI,
        lockPeriod: selectedProject.lockPeriod
      };

      // Store in localStorage for demo
      const existingEscrows = JSON.parse(localStorage.getItem('escrowTransactions') || '[]');
      existingEscrows.push(investmentEscrow);
      localStorage.setItem('escrowTransactions', JSON.stringify(existingEscrows));

      // Record user investment in context (mock)
      await investInOpportunity(selectedProject.id, investmentAmount);

      setPaymentReference(reference);
      setCreatedEscrow(investmentEscrow);
      setPaymentSuccess(true);
      toast.success('Payment successful! Funds held in escrow pending vendor document submission.');
      setSelectedProject(null);
      setInvestmentAmount(500000);
      setAcceptInvestmentTerms(false);
      setPaymentMethod('flutterwave');
    } catch (error) {
      console.error('Investment error:', error);
      toast.error('Failed to process investment');
    } finally {
      setIsProcessingPayment(false);
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
                <InvestmentChart 
                  title="Projected Returns"
                  data={[
                    { quarter: 'Q1 2024', value: 15, amount: 2.1 },
                    { quarter: 'Q2 2024', value: 18, amount: 2.8 },
                    { quarter: 'Q3 2024', value: 22, amount: 3.2 },
                    { quarter: 'Q4 2024', value: 25, amount: 3.8 },
                    { quarter: 'Q1 2025', value: 28, amount: 4.1 },
                    { quarter: 'Q2 2025', value: 30, amount: 4.5 },
                    { quarter: 'Q3 2025', value: 32, amount: 4.8 },
                    { quarter: 'Q4 2025', value: 35, amount: 5.2 }
                  ]}
                />

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <button 
                    onClick={() => handleInvestNow(selectedProject || projects[0])}
                    className="btn-primary flex items-center space-x-2"
                    disabled={!projects.length}
                  >
                    <FaCheck />
                    <span>Invest Now</span>
                  </button>
                  <button 
                    onClick={() => {
                      console.log('Add to Wishlist clicked, user:', user);
                      if (!user) {
                        toast.error('Please login to add to wishlist');
                        navigate('/login');
                        return;
                      }
                      const projectToUse = selectedProject || projects[0];
                      if (projectToUse) {
                        toast.success(`Added "${projectToUse.name}" to your wishlist!`);
                        // In a real app, this would save to user's wishlist
                        console.log('Added to wishlist:', projectToUse.name);
                      } else {
                        toast.success('Added to wishlist!');
                      }
                    }}
                    className="btn-outline flex items-center space-x-2"
                    title="Add this investment to your wishlist"
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

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <FaFileContract className="mx-auto text-4xl text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Investment Documents</h3>
                  <p className="text-gray-600 mb-6">Access all legal documents and agreements for your investments</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <FaFileContract className="text-orange-600 mr-3" />
                        <h4 className="font-semibold">Investment Agreement</h4>
                      </div>
                      <button
                        onClick={() => handleDownloadDocument('Investment Agreement')}
                        className="text-orange-600 hover:text-orange-700"
                      >
                        <FaDownload />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Complete investment terms and conditions</p>
                    <div className="flex items-center text-xs text-gray-500">
                      <span>PDF • 2.3 MB</span>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <FaShieldAlt className="text-green-600 mr-3" />
                        <h4 className="font-semibold">Escrow Terms</h4>
                      </div>
                      <button
                        onClick={() => handleDownloadDocument('Escrow Terms')}
                        className="text-green-600 hover:text-green-700"
                      >
                        <FaDownload />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Fund protection and release conditions</p>
                    <div className="flex items-center text-xs text-gray-500">
                      <span>PDF • 1.8 MB</span>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <FaExclamationTriangle className="text-red-600 mr-3" />
                        <h4 className="font-semibold">Risk Disclosure</h4>
                      </div>
                      <button
                        onClick={() => handleDownloadDocument('Risk Disclosure')}
                        className="text-red-600 hover:text-red-700"
                      >
                        <FaDownload />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Investment risks and considerations</p>
                    <div className="flex items-center text-xs text-gray-500">
                      <span>PDF • 1.2 MB</span>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <FaBuilding className="text-blue-600 mr-3" />
                        <h4 className="font-semibold">Property Documents</h4>
                      </div>
                      <button
                        onClick={() => toast.info('Property documents will be available after vendor submission')}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <FaEye />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">C of O, deed, and survey plans</p>
                    <div className="flex items-center text-xs text-yellow-600">
                      <FaClock className="mr-1" />
                      <span>Pending vendor submission</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Project Updates Tab */}
            {activeTab === 'projectupdates' && (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <FaChartLine className="mx-auto text-4xl text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Project Updates</h3>
                  <p className="text-gray-600 mb-6">Stay informed about your investment progress</p>
                </div>

                <div className="space-y-6">
                  <div className="border-l-4 border-green-500 bg-green-50 p-6 rounded-r-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-green-900 mb-2">Phase 1 Construction Complete</h4>
                        <p className="text-green-800 mb-3">Foundation and structural work completed ahead of schedule. Quality inspections passed with excellent ratings.</p>
                        <div className="flex items-center text-sm text-green-700">
                          <FaCalendar className="mr-2" />
                          <span>December 15, 2024</span>
                        </div>
                      </div>
                      <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs">Completed</span>
                    </div>
                  </div>

                  <div className="border-l-4 border-blue-500 bg-blue-50 p-6 rounded-r-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-blue-900 mb-2">Phase 2 Development Started</h4>
                        <p className="text-blue-800 mb-3">Interior work and finishing has begun. Expected completion: Q2 2025. Progress: 35% complete.</p>
                        <div className="flex items-center text-sm text-blue-700 mb-3">
                          <FaCalendar className="mr-2" />
                          <span>January 8, 2025</span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{width: '35%'}}></div>
                        </div>
                      </div>
                      <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs">In Progress</span>
                    </div>
                  </div>

                  <div className="border-l-4 border-orange-500 bg-orange-50 p-6 rounded-r-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-orange-900 mb-2">Market Valuation Update</h4>
                        <p className="text-orange-800 mb-3">Independent property valuation shows 18% appreciation since investment. Current market value: ₦95M (up from ₦80M).</p>
                        <div className="flex items-center text-sm text-orange-700">
                          <FaCalendar className="mr-2" />
                          <span>January 3, 2025</span>
                        </div>
                      </div>
                      <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs">Update</span>
                    </div>
                  </div>

                  <div className="border-l-4 border-purple-500 bg-purple-50 p-6 rounded-r-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-purple-900 mb-2">Regulatory Approval Received</h4>
                        <p className="text-purple-800 mb-3">All necessary permits and approvals have been obtained. Project is fully compliant with local regulations.</p>
                        <div className="flex items-center text-sm text-purple-700">
                          <FaCalendar className="mr-2" />
                          <span>December 22, 2024</span>
                        </div>
                      </div>
                      <span className="bg-purple-500 text-white px-2 py-1 rounded-full text-xs">Approved</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Developer Info Tab */}
            {activeTab === 'developerinfo' && (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <FaBuilding className="mx-auto text-4xl text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Developer Information</h3>
                  <p className="text-gray-600 mb-6">Learn about the project developer and their track record</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="font-semibold text-gray-900 mb-4">Company Overview</h4>
                      <div className="space-y-3">
                        <div>
                          <span className="font-medium text-gray-700">Company Name:</span>
                          <span className="ml-2 text-gray-900">Luxury Developments Nigeria Ltd.</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Established:</span>
                          <span className="ml-2 text-gray-900">2018</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Experience:</span>
                          <span className="ml-2 text-gray-900">7+ years in real estate development</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Projects Completed:</span>
                          <span className="ml-2 text-gray-900">12 luxury developments</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Total Value Delivered:</span>
                          <span className="ml-2 text-gray-900">₦2.5B+ in property value</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="font-semibold text-gray-900 mb-4">Contact Information</h4>
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <FaMapMarkerAlt className="text-gray-400 mr-3" />
                          <span>123 Victoria Island, Lagos, Nigeria</span>
                        </div>
                        <div className="flex items-center">
                          <FaPhone className="text-gray-400 mr-3" />
                          <span>+234-XXX-XXXX</span>
                        </div>
                        <div className="flex items-center">
                          <FaEnvelope className="text-gray-400 mr-3" />
                          <span>info@luxurydevelopments.ng</span>
                        </div>
                        <div className="flex items-center">
                          <FaGlobe className="text-gray-400 mr-3" />
                          <span>www.luxurydevelopments.ng</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="font-semibold text-gray-900 mb-4">Track Record</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700">Project Delivery Rate</span>
                          <span className="font-semibold text-green-600">100%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700">On-Time Delivery</span>
                          <span className="font-semibold text-green-600">92%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700">Average ROI Delivered</span>
                          <span className="font-semibold text-green-600">22%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700">Investor Satisfaction</span>
                          <span className="font-semibold text-green-600">4.8/5</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="font-semibold text-gray-900 mb-4">Recent Projects</h4>
                      <div className="space-y-3">
                        <div className="border-b border-gray-100 pb-2">
                          <div className="font-medium text-gray-900">Lagos Luxury Towers</div>
                          <div className="text-sm text-gray-600">Completed 2023 • ₦450M project</div>
                        </div>
                        <div className="border-b border-gray-100 pb-2">
                          <div className="font-medium text-gray-900">Victoria Gardens</div>
                          <div className="text-sm text-gray-600">Completed 2022 • ₦320M project</div>
                        </div>
                        <div className="border-b border-gray-100 pb-2">
                          <div className="font-medium text-gray-900">Ikoyi Heights</div>
                          <div className="text-sm text-gray-600">Completed 2021 • ₦280M project</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="font-semibold text-gray-900 mb-4">Certifications</h4>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <FaCheck className="text-green-600 mr-2" />
                          <span className="text-sm">Nigerian Real Estate Developers Association</span>
                        </div>
                        <div className="flex items-center">
                          <FaCheck className="text-green-600 mr-2" />
                          <span className="text-sm">Lagos State Property Development Authority</span>
                        </div>
                        <div className="flex items-center">
                          <FaCheck className="text-green-600 mr-2" />
                          <span className="text-sm">ISO 9001:2015 Quality Management</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FAQs Tab */}
            {activeTab === 'faqs' && (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <FaQuestionCircle className="mx-auto text-4xl text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Frequently Asked Questions</h3>
                  <p className="text-gray-600 mb-6">Find answers to common investment questions</p>
                </div>

                <div className="space-y-4">
                  <div className="bg-white border border-gray-200 rounded-lg">
                    <button className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50">
                      <span className="font-medium text-gray-900">How does the escrow protection work?</span>
                      <FaChevronDown className="text-gray-400" />
                    </button>
                    <div className="px-6 pb-4">
                      <p className="text-gray-600">Your investment funds are held in a secure escrow account until the vendor provides all required property documents (C of O, deed, survey plan). Once verified by our legal team, the documents serve as collateral equal to your investment value. Funds are only released after this verification process is complete.</p>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg">
                    <button className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50">
                      <span className="font-medium text-gray-900">What is the minimum investment amount?</span>
                      <FaChevronDown className="text-gray-400" />
                    </button>
                    <div className="px-6 pb-4">
                      <p className="text-gray-600">The minimum investment varies by project, typically ranging from ₦100,000 to ₦500,000. Each project listing clearly shows the minimum investment requirement. This ensures that property investments are accessible to a wide range of investors while maintaining project viability.</p>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg">
                    <button className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50">
                      <span className="font-medium text-gray-900">How are returns calculated and paid?</span>
                      <FaChevronDown className="text-gray-400" />
                    </button>
                    <div className="px-6 pb-4">
                      <p className="text-gray-600">Returns are calculated based on the project's performance and market appreciation. Returns are typically paid quarterly or annually, depending on the project structure. All returns are distributed proportionally based on your ownership percentage in the project.</p>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg">
                    <button className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50">
                      <span className="font-medium text-gray-900">What happens if the project is delayed?</span>
                      <FaChevronDown className="text-gray-400" />
                    </button>
                    <div className="px-6 pb-4">
                      <p className="text-gray-600">Project delays are handled according to the terms in your investment agreement. Typically, the lock period may be extended, and investors are notified of any significant delays. Our escrow protection ensures your funds remain secure during any project timeline adjustments.</p>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg">
                    <button className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50">
                      <span className="font-medium text-gray-900">Can I withdraw my investment early?</span>
                      <FaChevronDown className="text-gray-400" />
                    </button>
                    <div className="px-6 pb-4">
                      <p className="text-gray-600">Investments are subject to the lock period specified in your agreement, typically 12-36 months. Early withdrawal may be possible under certain circumstances but may incur penalties or reduced returns. We recommend reviewing the specific terms of your investment agreement.</p>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg">
                    <button className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50">
                      <span className="font-medium text-gray-900">How do I track my investment performance?</span>
                      <FaChevronDown className="text-gray-400" />
                    </button>
                    <div className="px-6 pb-4">
                      <p className="text-gray-600">You can track your investment performance through your investor dashboard, which shows real-time updates on project progress, returns, and market valuations. You'll also receive regular email updates and can access detailed reports through the platform.</p>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg">
                    <button className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50">
                      <span className="font-medium text-gray-900">What are the tax implications of my investment?</span>
                      <FaChevronDown className="text-gray-400" />
                    </button>
                    <div className="px-6 pb-4">
                      <p className="text-gray-600">Investment returns may be subject to capital gains tax and other applicable taxes in Nigeria. We provide annual tax statements for your investments, but we recommend consulting with a tax professional for specific advice on your individual tax situation.</p>
                    </div>
                  </div>
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

            {/* Payment & Terms */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="flutterwave">Flutterwave (Card/Bank/USSD)</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
                <div className="flex items-start mt-1">
                  <label className="flex items-start text-sm text-gray-700">
                    <input
                      type="checkbox"
                      className="mr-2 mt-1"
                      checked={acceptInvestmentTerms}
                      onChange={(e) => setAcceptInvestmentTerms(e.target.checked)}
                    />
                    I accept the escrow terms and investment risk disclosure.
                  </label>
                </div>
              </div>
            </div>

            {/* Success State */}
            {paymentSuccess && createdEscrow ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-green-900 mb-2">Payment Successful</h4>
                <p className="text-green-800 text-sm">Your funds are now held in escrow pending vendor document submission and verification.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-3">
                  <div>
                    <p><strong>Reference:</strong> {paymentReference}</p>
                    <p><strong>Amount:</strong> ₦{createdEscrow.amount.toLocaleString()}</p>
                    <p><strong>Escrow Fee:</strong> ₦{createdEscrow.escrowFee.toLocaleString()}</p>
                  </div>
                  <div>
                    <p><strong>Project:</strong> {createdEscrow.investmentTitle}</p>
                    <p><strong>Status:</strong> {createdEscrow.status.replaceAll('_',' ')}</p>
                    <p><strong>Vendor:</strong> {createdEscrow.vendor}</p>
                  </div>
                </div>
                <div className="flex space-x-3 mt-4">
                  <button
                    onClick={() => {
                      // Download simple receipt
                      const receiptHtml = `<!DOCTYPE html><html><body><h2>Investment Receipt</h2><p>Ref: ${paymentReference}</p><p>Project: ${createdEscrow.investmentTitle}</p><p>Amount: ₦${createdEscrow.amount.toLocaleString()}</p><p>Escrow Fee: ₦${createdEscrow.escrowFee.toLocaleString()}</p><p>Total: ₦${createdEscrow.totalAmount.toLocaleString()}</p><p>Status: ${createdEscrow.status.replaceAll('_',' ')}</p><p>Date: ${new Date(createdEscrow.createdAt).toLocaleString()}</p></body></html>`;
                      const blob = new Blob([receiptHtml], { type: 'text/html' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `receipt-${paymentReference}.html`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      window.URL.revokeObjectURL(url);
                    }}
                    className="flex-1 px-4 py-2 bg-white text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Download Receipt
                  </button>
                  <button
                    onClick={() => {
                      setPaymentSuccess(false);
                      setShowInvestmentModal(false);
                    }}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Done
                  </button>
                  <button
                    onClick={() => window.location.assign('/escrow')}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Go to Escrow
                  </button>
                </div>
              </div>
            ) : null}

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
                disabled={isProcessingPayment || !investmentAmount || investmentAmount < selectedProject.minInvestment || !acceptInvestmentTerms}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessingPayment ? 'Processing...' : 'Pay Now (via Escrow)'}
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
