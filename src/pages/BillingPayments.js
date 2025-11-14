import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEscrow } from '../contexts/EscrowContext';
import EscrowDashboard from '../components/EscrowDashboard';
import Receipt from '../components/Receipt';
import { FaCreditCard, FaShieldAlt, FaClock, FaCheck, FaTimes, FaDownload, FaEye, FaPlus, FaFilter, FaSearch, FaFileInvoice, FaMoneyBillWave, FaLock, FaUnlock, FaExclamationTriangle, FaInfoCircle, FaArrowRight, FaHistory, FaReceipt } from 'react-icons/fa';
import toast from 'react-hot-toast';

const BillingPayments = () => {
  const { user } = useAuth();
  const { escrowTransactions, createEscrowTransaction, releaseEscrowFunds } = useEscrow();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [filterStatus, setFilterStatus] = useState('all');
  const [allTransactions, setAllTransactions] = useState([]);
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    type: 'card',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    bankName: ''
  });

  // Mock payment methods
  const paymentMethods = [
    {
      id: 'card',
      type: 'Credit/Debit Card',
      icon: FaCreditCard,
      last4: '4242',
      expiry: '12/25',
      isDefault: true,
      provider: 'Visa'
    },
    {
      id: 'bank',
      type: 'Bank Transfer',
      icon: FaMoneyBillWave,
      last4: '1234',
      expiry: null,
      isDefault: false,
      provider: 'First Bank'
    }
  ];

  // Calculate real billing summary from transactions
  const getBillingSummary = () => {
    const completed = allTransactions.filter(t => t.status === 'completed');
    const pending = allTransactions.filter(t => t.status === 'pending' || t.status === 'in-progress');
    
    const totalSpent = completed.reduce((sum, t) => sum + (t.totalAmount || t.amount), 0);
    const pendingPayments = pending.reduce((sum, t) => sum + (t.totalAmount || t.amount), 0);
    const escrowBalance = pending.reduce((sum, t) => sum + (t.totalAmount || t.amount), 0);
    
    // Calculate monthly spend (current month)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyTransactions = completed.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
    });
    const monthlySpend = monthlyTransactions.reduce((sum, t) => sum + (t.totalAmount || t.amount), 0);
    
    // Get last payment date
    const lastPayment = completed.length > 0 
      ? completed.sort((a, b) => new Date(b.date) - new Date(a.date))[0].date
      : null;

    return {
      totalSpent,
      pendingPayments,
      completedTransactions: completed.length,
      escrowBalance,
      monthlySpend,
      lastPayment
    };
  };

  const billingSummary = getBillingSummary();

  // Mock transaction history
  const transactionHistory = [
    {
      id: 'TXN-001',
      type: 'Property Purchase',
      amount: 15000000,
      status: 'completed',
      date: '2024-01-15',
      description: 'Luxury Apartment in Ikoyi',
      paymentMethod: 'Card',
      escrowId: 'ESC-001',
      fees: 37500
    },
    {
      id: 'TXN-002',
      type: 'Investment',
      amount: 500000,
      status: 'pending',
      date: '2024-01-20',
      description: 'Azure Heights Complex Investment',
      paymentMethod: 'Bank Transfer',
      escrowId: 'ESC-002',
      fees: 5000
    },
    {
      id: 'TXN-003',
      type: 'Escrow Release',
      amount: 15000000,
      status: 'completed',
      date: '2024-01-10',
      description: 'Property Transfer Completed',
      paymentMethod: 'Escrow',
      escrowId: 'ESC-001',
      fees: 0
    }
  ];

  // Mock escrow transactions
  const mockEscrowTransactions = [
    {
      id: 'ESC-001',
      propertyTitle: 'Luxury Apartment in Ikoyi',
      buyer: 'John Doe',
      seller: 'Lagos Properties Ltd',
      amount: 15000000,
      status: 'completed',
      createdAt: '2024-01-01',
      completedAt: '2024-01-10',
      fees: 75000,
      description: 'Property purchase with full verification'
    },
    {
      id: 'ESC-002',
      propertyTitle: 'Azure Heights Complex Investment',
      buyer: 'John Doe',
      seller: 'Azure Development Co.',
      amount: 500000,
      status: 'pending',
      createdAt: '2024-01-20',
      completedAt: null,
      fees: 2500,
      description: 'Investment in development project'
    },
    {
      id: 'ESC-003',
      propertyTitle: 'Villa in Victoria Island',
      buyer: 'John Doe',
      seller: 'Premium Estates',
      amount: 25000000,
      status: 'in-progress',
      createdAt: '2024-01-25',
      completedAt: null,
      fees: 125000,
      description: 'Property purchase under verification'
    }
  ];

  // Load all transactions (escrow + mock) on component mount
  useEffect(() => {
    const loadAllTransactions = () => {
      try {
        // Load real escrow transactions from localStorage
        const storedEscrowTransactions = JSON.parse(localStorage.getItem('escrowTransactions') || '[]');
        
        // Convert escrow transactions to billing format
        const escrowBillingTransactions = storedEscrowTransactions.map(escrow => ({
          id: `TXN-${escrow.id}`,
          type: 'Property Purchase',
          amount: escrow.amount,
          totalAmount: escrow.totalAmount,
          status: escrow.status === 'funded' ? 'completed' : escrow.status,
          date: escrow.createdAt,
          description: escrow.propertyTitle,
          propertyTitle: escrow.propertyTitle,
          buyer: user?.firstName + ' ' + user?.lastName || 'Current User',
          seller: 'Property Owner',
          paymentMethod: 'Flutterwave',
          escrowId: escrow.id,
          fees: escrow.escrowFee,
          completedAt: escrow.completedAt,
          paymentReference: escrow.paymentReference
        }));

        // Combine with existing mock transactions
        const combinedTransactions = [
          ...escrowBillingTransactions,
          ...transactionHistory.filter(mock => 
            !escrowBillingTransactions.find(escrow => escrow.escrowId === mock.escrowId)
          )
        ];

        // Sort by date (newest first)
        combinedTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        setAllTransactions(combinedTransactions);
      } catch (error) {
        console.error('Error loading transactions:', error);
        setAllTransactions(transactionHistory);
      }
    };

    loadAllTransactions();
    
    // Reload when user changes or component mounts
  }, [user, transactionHistory]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FaCheck className="text-green-600" />;
      case 'pending':
        return <FaClock className="text-yellow-600" />;
      case 'in-progress':
        return <FaArrowRight className="text-blue-600" />;
      case 'failed':
        return <FaTimes className="text-red-600" />;
      default:
        return <FaInfoCircle className="text-gray-600" />;
    }
  };

  const handlePayment = async (transactionId, amount) => {
    setShowPaymentModal(true);
    // In a real app, this would integrate with Flutterwave
    console.log('Processing payment:', { transactionId, amount, paymentMethod });
  };

  const handleViewReceipt = (transaction) => {
    setSelectedTransaction(transaction);
    setShowReceiptModal(true);
  };

  const handleDownloadReceipt = (transaction) => {
    // Create a temporary receipt component for download
    setSelectedTransaction(transaction);
    setShowReceiptModal(true);
    toast.success('Opening receipt for download...');
  };

  const closeReceiptModal = () => {
    setShowReceiptModal(false);
    setSelectedTransaction(null);
  };

  const handleAddPaymentMethod = () => {
    setShowAddPaymentModal(true);
  };

  const handleSavePaymentMethod = () => {
    // In a real app, this would save to the backend
    toast.success('Payment method added successfully!');
    setShowAddPaymentModal(false);
    setNewPaymentMethod({
      type: 'card',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: '',
      bankName: ''
    });
  };

  const closeAddPaymentModal = () => {
    setShowAddPaymentModal(false);
    setNewPaymentMethod({
      type: 'card',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: '',
      bankName: ''
    });
  };

  const handleFlutterwavePayment = async (amount, description) => {
    // Mock Flutterwave integration
    const paymentData = {
      tx_ref: `TXN-${Date.now()}`,
      amount: amount,
      currency: 'NGN',
      redirect_url: window.location.origin + '/payment-success',
      customer: {
        email: user?.email,
        name: user?.name,
        phone_number: user?.phone
      },
      customizations: {
        title: 'Property Ark',
        description: description,
        logo: 'https://propertyark.com/logo.png'
      }
    };

    // In a real implementation, you would use Flutterwave's SDK
    console.log('Flutterwave payment data:', paymentData);
    alert('Redirecting to Flutterwave payment gateway...');
  };

  const handleViewTransaction = (transaction) => {
    console.log('View transaction:', transaction.id);
    // You can implement transaction details modal or navigation
  };


  const filteredTransactions = mockEscrowTransactions.filter(transaction => {
    if (filterStatus === 'all') return true;
    return transaction.status === filterStatus;
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing & Payments</h1>
        <p className="text-gray-600">
          Manage your payments, escrow transactions, and billing information
        </p>
      </div>

      {/* Billing Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <FaMoneyBillWave className="text-green-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">₦{billingSummary.totalSpent.toLocaleString()}</p>
              <p className="text-sm text-green-600">+12.5% this month</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <FaClock className="text-yellow-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Payments</p>
              <p className="text-2xl font-bold text-gray-900">₦{billingSummary.pendingPayments.toLocaleString()}</p>
              <p className="text-sm text-yellow-600">2 transactions</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FaShieldAlt className="text-blue-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Escrow Balance</p>
              <p className="text-2xl font-bold text-gray-900">₦{billingSummary.escrowBalance.toLocaleString()}</p>
              <p className="text-sm text-blue-600">3 active escrows</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <FaReceipt className="text-purple-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{billingSummary.completedTransactions}</p>
              <p className="text-sm text-purple-600">transactions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'payments', label: 'Payment Methods' },
              { key: 'history', label: 'Transaction History' },
              { key: 'invoices', label: 'Invoices & Receipts' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-brand-blue text-brand-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Payment Overview</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Recent Transactions</h4>
                  <div className="space-y-3">
                    {allTransactions.slice(0, 3).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{transaction.description || transaction.propertyTitle}</p>
                          <p className="text-sm text-gray-600">{new Date(transaction.date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">₦{(transaction.totalAmount || transaction.amount).toLocaleString()}</p>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </span>
                        </div>
                      </div>
                    ))}
                    {allTransactions.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <p>No recent transactions found.</p>
                        <p className="text-sm">Complete a property purchase to see transactions here.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Escrow Status</h4>
                  <div className="space-y-3">
                    {allTransactions.filter(t => t.escrowId && (t.status === 'pending' || t.status === 'in-progress')).slice(0, 2).map((escrow) => (
                      <div key={escrow.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{escrow.propertyTitle || escrow.description}</p>
                          <p className="text-sm text-gray-600">ID: {escrow.escrowId || escrow.id}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">₦{(escrow.totalAmount || escrow.amount).toLocaleString()}</p>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(escrow.status)}`}>
                            {escrow.status}
                          </span>
                        </div>
                      </div>
                    ))}
                    {allTransactions.filter(t => t.escrowId && (t.status === 'pending' || t.status === 'in-progress')).length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <p>No active escrow transactions.</p>
                        <p className="text-sm">Your completed escrow transactions will appear in transaction history.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Payment Methods</h3>
                <button 
                  onClick={handleAddPaymentMethod}
                  className="btn-primary flex items-center space-x-2"
                >
                  <FaPlus />
                  <span>Add Payment Method</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-gray-100 rounded-lg">
                          <method.icon className="text-gray-600 text-xl" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{method.type}</h4>
                          <p className="text-sm text-gray-600">{method.provider}</p>
                        </div>
                      </div>
                      {method.isDefault && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Card Number</span>
                        <span className="font-medium">**** **** **** {method.last4}</span>
                      </div>
                      {method.expiry && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Expires</span>
                          <span className="font-medium">{method.expiry}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <button className="btn-outline text-sm flex-1">Edit</button>
                      {!method.isDefault && (
                        <button className="btn-outline text-sm flex-1">Remove</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <FaShieldAlt className="text-blue-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-blue-900">Secure Payment Processing</h4>
                    <p className="text-blue-700 text-sm mt-1">
                      All payments are processed securely through Flutterwave with bank-level encryption. 
                      Your payment information is never stored on our servers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
                <div className="flex space-x-3">
                  <button className="btn-outline flex items-center space-x-2">
                    <FaDownload />
                    <span>Export</span>
                  </button>
                  <button className="btn-outline flex items-center space-x-2">
                    <FaFilter />
                    <span>Filter</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transaction
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allTransactions.filter(transaction => 
                      filterStatus === 'all' || transaction.status === filterStatus
                    ).map((transaction) => (
                      <tr key={transaction.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{transaction.description}</div>
                            <div className="text-sm text-gray-500">ID: {transaction.id}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">₦{transaction.amount.toLocaleString()}</div>
                          {transaction.fees > 0 && (
                            <div className="text-sm text-gray-500">Fees: ₦{transaction.fees.toLocaleString()}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={() => handleViewTransaction(transaction)}
                            className="text-brand-blue hover:text-brand-orange mr-3"
                            title="View Transaction"
                          >
                            <FaEye />
                          </button>
                          <button 
                            onClick={() => handleDownloadReceipt(transaction)}
                            className="text-brand-blue hover:text-brand-orange"
                            title="Download Receipt"
                          >
                            <FaDownload />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Invoices & Receipts</h3>
                <button className="btn-outline flex items-center space-x-2">
                  <FaDownload />
                  <span>Download All</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allTransactions.filter(transaction => 
                  filterStatus === 'all' || transaction.status === filterStatus
                ).map((transaction) => (
                  <div key={transaction.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-gray-100 rounded-lg">
                        <FaFileInvoice className="text-gray-600 text-xl" />
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </div>
                    
                    <h4 className="font-semibold text-gray-900 mb-2">{transaction.description}</h4>
                    <p className="text-sm text-gray-600 mb-2">Invoice #{transaction.id}</p>
                    <p className="text-lg font-bold text-gray-900 mb-4">₦{transaction.amount.toLocaleString()}</p>
                    
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleViewReceipt(transaction)}
                        className="btn-outline text-sm flex-1 flex items-center justify-center"
                      >
                        <FaEye className="mr-1" />
                        View
                      </button>
                      <button 
                        onClick={() => handleDownloadReceipt(transaction)}
                        className="btn-outline text-sm flex-1 flex items-center justify-center"
                      >
                        <FaDownload className="mr-1" />
                        Receipt
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Complete Payment</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                >
                  <option value="card">Credit/Debit Card</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="flutterwave">Flutterwave</option>
                </select>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Amount to Pay</span>
                  <span className="text-lg font-bold text-gray-900">₦450,000</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-600">Processing Fee</span>
                  <span className="text-gray-900">₦11,250</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">Total</span>
                    <span className="text-lg font-bold text-brand-blue">₦461,250</span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleFlutterwavePayment(461250, 'Property Investment Payment')}
                  className="btn-primary flex-1"
                >
                  Pay Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && selectedTransaction && (
        <Receipt 
          transaction={selectedTransaction} 
          onClose={closeReceiptModal}
        />
      )}

      {/* Add Payment Method Modal */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Add Payment Method</h3>
              <button
                onClick={closeAddPaymentModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-4">
              {/* Payment Method Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method Type
                </label>
                <select
                  value={newPaymentMethod.type}
                  onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="card">Credit/Debit Card</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>

              {newPaymentMethod.type === 'card' ? (
                <>
                  {/* Card Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Card Number
                    </label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={newPaymentMethod.cardNumber}
                      onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, cardNumber: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Expiry Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={newPaymentMethod.expiryDate}
                        onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, expiryDate: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    {/* CVV */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CVV
                      </label>
                      <input
                        type="text"
                        placeholder="123"
                        value={newPaymentMethod.cvv}
                        onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, cvv: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  {/* Cardholder Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={newPaymentMethod.cardholderName}
                      onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, cardholderName: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </>
              ) : (
                /* Bank Transfer Fields */
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank Name
                  </label>
                  <select
                    value={newPaymentMethod.bankName}
                    onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, bankName: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select Bank</option>
                    <option value="First Bank">First Bank of Nigeria</option>
                    <option value="GTBank">Guaranty Trust Bank</option>
                    <option value="Access Bank">Access Bank</option>
                    <option value="Zenith Bank">Zenith Bank</option>
                    <option value="UBA">United Bank for Africa</option>
                    <option value="Fidelity Bank">Fidelity Bank</option>
                  </select>
                </div>
              )}

              {/* Security Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <FaShieldAlt className="text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-800">
                      Your payment information is encrypted and secure. We use Flutterwave's 
                      secure payment processing and never store your card details.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={closeAddPaymentModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePaymentMethod}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Add Payment Method
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingPayments;



