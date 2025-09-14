import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FaChartLine, FaFilter, FaDownload, FaBookmark, FaCheck, FaMapMarkerAlt, FaUsers, FaCalendar, FaArrowUp, FaEye, FaHeart } from 'react-icons/fa';

const Investment = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedProject, setSelectedProject] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [investmentAmount, setInvestmentAmount] = useState(500000);

  // Mock investment data
  const [investmentData, setInvestmentData] = useState({
    totalInvested: 1850000,
    totalEarnings: 248600,
    activeInvestments: 5,
    projectedReturns: 425000,
    portfolio: {
      investedCapital: 1850000,
      currentValue: 2235500,
      totalProjects: 5,
      availableForWithdrawal: 185000
    }
  });

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
                    <div className="h-64 flex items-end justify-between">
                      {[15, 18, 22, 25, 28, 30, 32, 35].map((height, index) => (
                        <div key={index} className="flex flex-col items-center">
                          <div
                            className="w-8 bg-brand-blue rounded-t mb-2"
                            style={{ height: `${height}%` }}
                          ></div>
                          <span className="text-xs text-gray-600">Q{index + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <button className="btn-primary flex items-center space-x-2">
                    <FaCheck />
                    <span>Invest Now</span>
                  </button>
                  <button className="btn-outline flex items-center space-x-2">
                    <FaBookmark />
                    <span>Add to Wishlist</span>
                  </button>
                  <button className="btn-outline flex items-center space-x-2">
                    <FaDownload />
                    <span>Download Project Prospectus</span>
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
                onClick={() => setSelectedProject(project)}
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
    </div>
  );
};

export default Investment;
