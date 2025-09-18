import React, { useState } from 'react';
import { 
  FaFileContract, 
  FaDownload, 
  FaEye, 
  FaEdit, 
  FaTrash, 
  FaSearch,
  FaFilter,
  FaCalendarAlt,
  FaUser,
  FaCheck,
  FaTimes,
  FaClock
} from 'react-icons/fa';

const VendorContracts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedContract, setSelectedContract] = useState(null);
  const [showContractModal, setShowContractModal] = useState(false);

  // Contract action handlers
  const handleViewContract = (contract) => {
    setSelectedContract(contract);
    setShowContractModal(true);
  };

  const handleEditContract = (contract) => {
    // Navigate to edit contract page or open edit modal
    console.log('Edit contract:', contract.id);
    // You can implement navigation or modal here
  };

  const handleDownloadContract = (contract) => {
    // Generate and download contract PDF
    console.log('Download contract:', contract.id);
    // You can implement PDF generation here
  };

  const handleDeleteContract = (contract) => {
    if (window.confirm('Are you sure you want to delete this contract?')) {
      console.log('Delete contract:', contract.id);
      // You can implement contract deletion here
    }
  };

  const handleAcceptContract = (contract) => {
    console.log('Accept contract:', contract.id);
    // You can implement contract acceptance here
  };

  const handleRejectContract = (contract) => {
    if (window.confirm('Are you sure you want to reject this contract?')) {
      console.log('Reject contract:', contract.id);
      // You can implement contract rejection here
    }
  };

  // Mock contracts data
  const contracts = [
    {
      id: 1,
      property: 'Luxury Villa in Ikoyi',
      client: 'John Smith',
      type: 'Sales Agreement',
      status: 'Active',
      startDate: '2024-01-15',
      endDate: '2024-04-15',
      value: 15000000,
      commission: 150000,
      signedDate: '2024-01-10',
      lastModified: '2024-01-15'
    },
    {
      id: 2,
      property: 'Modern Apartment in Victoria Island',
      client: 'Sarah Johnson',
      type: 'Exclusive Listing',
      status: 'Pending',
      startDate: '2024-02-01',
      endDate: '2024-05-01',
      value: 8500000,
      commission: 85000,
      signedDate: null,
      lastModified: '2024-01-20'
    },
    {
      id: 3,
      property: 'Penthouse in Lekki',
      client: 'Michael Brown',
      type: 'Sales Agreement',
      status: 'Completed',
      startDate: '2023-11-01',
      endDate: '2024-01-01',
      value: 25000000,
      commission: 250000,
      signedDate: '2023-10-25',
      lastModified: '2024-01-01'
    },
    {
      id: 4,
      property: 'Commercial Space in Lagos Island',
      client: 'Emily Davis',
      type: 'Lease Agreement',
      status: 'Active',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      value: 5000000,
      commission: 50000,
      signedDate: '2023-12-20',
      lastModified: '2024-01-01'
    }
  ];

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || contract.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Completed': return 'bg-blue-100 text-blue-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Active': return <FaCheck className="h-4 w-4" />;
      case 'Pending': return <FaClock className="h-4 w-4" />;
      case 'Completed': return <FaCheck className="h-4 w-4" />;
      case 'Cancelled': return <FaTimes className="h-4 w-4" />;
      default: return <FaClock className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Contract Management</h1>
            <p className="text-gray-600">Manage your property contracts and agreements</p>
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-blue-700 transition-colors">
            <FaFileContract className="h-4 w-4" />
            <span>New Contract</span>
          </button>
        </div>
      </div>

      {/* Contract Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Contracts</p>
              <p className="text-2xl font-bold text-blue-600">{contracts.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaFileContract className="text-blue-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Contracts</p>
              <p className="text-2xl font-bold text-green-600">{contracts.filter(c => c.status === 'Active').length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FaCheck className="text-green-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Contracts</p>
              <p className="text-2xl font-bold text-yellow-600">{contracts.filter(c => c.status === 'Pending').length}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <FaClock className="text-yellow-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-purple-600">₦{contracts.reduce((sum, c) => sum + c.value, 0).toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FaUser className="text-purple-600 text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search contracts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <FaFilter className="text-gray-400 h-4 w-4" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredContracts.map((contract) => (
                <tr key={contract.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{contract.property}</div>
                    <div className="text-sm text-gray-500">{contract.startDate} - {contract.endDate}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{contract.client}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{contract.type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(contract.status)}`}>
                      {getStatusIcon(contract.status)}
                      <span className="ml-1">{contract.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">₦{contract.value.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-green-600">₦{contract.commission.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleViewContract(contract)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        title="View Contract"
                      >
                        <FaEye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleEditContract(contract)}
                        className="text-gray-600 hover:text-gray-900 transition-colors"
                        title="Edit Contract"
                      >
                        <FaEdit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDownloadContract(contract)}
                        className="text-green-600 hover:text-green-900 transition-colors"
                        title="Download Contract"
                      >
                        <FaDownload className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteContract(contract)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        title="Delete Contract"
                      >
                        <FaTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contract Details Modal */}
      {selectedContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Contract Details</h2>
              <button 
                onClick={() => setSelectedContract(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Property</label>
                  <p className="text-sm text-gray-900">{selectedContract.property}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Client</label>
                  <p className="text-sm text-gray-900">{selectedContract.client}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contract Type</label>
                  <p className="text-sm text-gray-900">{selectedContract.type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedContract.status)}`}>
                    {getStatusIcon(selectedContract.status)}
                    <span className="ml-1">{selectedContract.status}</span>
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <p className="text-sm text-gray-900">{selectedContract.startDate}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <p className="text-sm text-gray-900">{selectedContract.endDate}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contract Value</label>
                  <p className="text-sm text-gray-900">₦{selectedContract.value.toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Commission</label>
                  <p className="text-sm font-medium text-green-600">₦{selectedContract.commission.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Signed Date</label>
                  <p className="text-sm text-gray-900">{selectedContract.signedDate || 'Not signed'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Modified</label>
                  <p className="text-sm text-gray-900">{selectedContract.lastModified}</p>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 pt-6">
              <button 
                onClick={() => handleEditContract(selectedContract)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Edit Contract
              </button>
              <button 
                onClick={() => handleDownloadContract(selectedContract)}
                className="flex-1 px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorContracts;
