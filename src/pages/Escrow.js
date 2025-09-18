import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEscrow } from '../contexts/EscrowContext';
import { useAuth } from '../contexts/AuthContext';
import { useProperty } from '../contexts/PropertyContext';
import { FaShieldAlt, FaCreditCard, FaCheckCircle, FaClock, FaTimesCircle, FaPlus, FaEye, FaLock, FaUserCheck, FaHandshake } from 'react-icons/fa';
import toast from 'react-hot-toast';

const Escrow = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { properties } = useProperty();
  const { 
    escrowTransactions, 
    loading, 
    paymentLoading,
    createEscrowTransaction, 
    initiatePayment, 
    verifyPayment,
    cancelEscrowTransaction,
    getEscrowTransactionsByUser
  } = useEscrow();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [formData, setFormData] = useState({
    buyerName: '',
    buyerEmail: '',
    sellerName: '',
    sellerEmail: '',
    amount: '',
    type: 'sale',
    paymentMethod: 'card'
  });

  // Check for payment verification on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const transactionId = urlParams.get('transaction_id');
    const txRef = urlParams.get('tx_ref');
    const status = urlParams.get('status');

    if (transactionId && txRef && status) {
      verifyPayment(transactionId, txRef, status);
    }
  }, [location.search, verifyPayment]);

  // Load user's escrow transactions
  useEffect(() => {
    if (user) {
      getEscrowTransactionsByUser(user.id);
    }
  }, [user, getEscrowTransactionsByUser]);

  const handleCreateEscrow = async (e) => {
    e.preventDefault();
    
    if (!selectedProperty) {
      alert('Please select a property');
      return;
    }

    const property = properties.find(p => p.id === selectedProperty);
    if (!property) {
      alert('Property not found');
      return;
    }

    const escrowData = {
      propertyId: selectedProperty,
      buyerId: user.id,
      buyerName: formData.buyerName,
      buyerEmail: formData.buyerEmail,
      sellerId: property.owner.id,
      sellerName: formData.sellerName,
      sellerEmail: formData.sellerEmail,
      amount: parseInt(formData.amount),
      type: formData.type,
      paymentMethod: formData.paymentMethod
    };

    const result = await createEscrowTransaction(escrowData);
    if (result) {
      setShowCreateForm(false);
      setFormData({
        buyerName: '',
        buyerEmail: '',
        sellerName: '',
        sellerEmail: '',
        amount: '',
        type: 'sale',
        paymentMethod: 'card'
      });
      setSelectedProperty('');
    }
  };

  const handlePayment = async (escrowId) => {
    await initiatePayment(escrowId, 'card');
  };

  const handleCancelTransaction = async (transactionId, reason) => {
    await cancelEscrowTransaction(transactionId, reason);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'funded': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'disputed': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <FaClock className="text-yellow-600" />;
      case 'funded': return <FaCreditCard className="text-blue-600" />;
      case 'completed': return <FaCheckCircle className="text-green-600" />;
      case 'cancelled': return <FaTimesCircle className="text-red-600" />;
      case 'disputed': return <FaShieldAlt className="text-orange-600" />;
      default: return <FaClock className="text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <FaShieldAlt className="text-white text-3xl" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Escrow Services</h1>
          <p className="text-xl text-gray-600">Secure property transactions with Flutterwave payment gateway</p>
        </div>

        {/* Create New Escrow Button */}
        <div className="mb-8 text-center">
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl hover:from-green-700 hover:to-blue-700 transition-all duration-300 transform hover:-translate-y-1 shadow-lg font-semibold flex items-center mx-auto"
          >
            <FaPlus className="mr-3" />
            Create New Escrow Transaction
          </button>
        </div>

        {/* Create Escrow Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Create Escrow Transaction</h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimesCircle className="text-2xl" />
                </button>
              </div>

              <form onSubmit={handleCreateEscrow} className="space-y-6">
                {/* Property Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Select Property</label>
                  <select
                    value={selectedProperty}
                    onChange={(e) => setSelectedProperty(e.target.value)}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                    required
                  >
                    <option value="">Choose a property</option>
                    {properties.map(property => (
                      <option key={property.id} value={property.id}>
                        {property.title} - ${property.price.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Transaction Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Buyer Name</label>
                    <input
                      type="text"
                      value={formData.buyerName}
                      onChange={(e) => setFormData({...formData, buyerName: e.target.value})}
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                      placeholder="Buyer's full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Buyer Email</label>
                    <input
                      type="email"
                      value={formData.buyerEmail}
                      onChange={(e) => setFormData({...formData, buyerEmail: e.target.value})}
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                      placeholder="buyer@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Seller Name</label>
                    <input
                      type="text"
                      value={formData.sellerName}
                      onChange={(e) => setFormData({...formData, sellerName: e.target.value})}
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                      placeholder="Seller's full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Seller Email</label>
                    <input
                      type="email"
                      value={formData.sellerEmail}
                      onChange={(e) => setFormData({...formData, sellerEmail: e.target.value})}
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                      placeholder="seller@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Transaction Amount (NGN)</label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                      placeholder="450000"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Transaction Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                    >
                      <option value="sale">Sale</option>
                      <option value="rent">Rent</option>
                      <option value="lease">Lease</option>
                    </select>
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Payment Method</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                  >
                    <option value="card">Credit/Debit Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="ussd">USSD</option>
                    <option value="mobile_money">Mobile Money</option>
                  </select>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold"
                  >
                    {loading ? 'Creating...' : 'Create Escrow'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Escrow Transactions List */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Escrow Transactions</h2>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading escrow transactions...</p>
            </div>
          ) : escrowTransactions.length === 0 ? (
            <div className="text-center py-12">
              <FaShieldAlt className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Escrow Transactions</h3>
              <p className="text-gray-600">You haven't created any escrow transactions yet.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {escrowTransactions.map((transaction) => (
                <div key={transaction.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{transaction.propertyTitle}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Transaction ID: {transaction.id}</span>
                        <span>Type: {transaction.type}</span>
                        <span>Amount: ₦{transaction.amount.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(transaction.status)}`}>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(transaction.status)}
                        <span>{transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Transaction Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Buyer Information</h4>
                      <p className="text-sm text-gray-600">Name: {transaction.buyerName}</p>
                      <p className="text-sm text-gray-600">Email: {transaction.buyerEmail}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Seller Information</h4>
                      <p className="text-sm text-gray-600">Name: {transaction.sellerName}</p>
                      <p className="text-sm text-gray-600">Email: {transaction.sellerEmail}</p>
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Payment Details</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Amount</p>
                        <p className="font-semibold">₦{transaction.amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Escrow Fee</p>
                        <p className="font-semibold">₦{transaction.escrowFee.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total Amount</p>
                        <p className="font-semibold">₦{transaction.totalAmount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Currency</p>
                        <p className="font-semibold">{transaction.currency}</p>
                      </div>
                    </div>
                  </div>

                  {/* Milestones */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Transaction Milestones</h4>
                    <div className="space-y-3">
                      {transaction.milestones.map((milestone, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                              milestone.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                            }`}>
                              {milestone.status === 'completed' ? (
                                <FaCheckCircle className="text-white text-sm" />
                              ) : (
                                <span className="text-white text-xs">{index + 1}</span>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{milestone.name}</p>
                              <p className="text-sm text-gray-600">₦{milestone.amount.toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-medium ${
                              milestone.status === 'completed' ? 'text-green-600' : 'text-gray-600'
                            }`}>
                              {milestone.status.charAt(0).toUpperCase() + milestone.status.slice(1)}
                            </p>
                            {milestone.date && (
                              <p className="text-xs text-gray-500">{new Date(milestone.date).toLocaleDateString()}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    {transaction.status === 'pending' && (
                      <button
                        onClick={() => handlePayment(transaction.id)}
                        disabled={paymentLoading}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold flex items-center"
                      >
                        <FaCreditCard className="mr-2" />
                        {paymentLoading ? 'Processing...' : 'Make Payment'}
                      </button>
                    )}
                    
                    <button
                      onClick={() => navigate(`/escrow/${transaction.id}`)}
                      className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-300 font-semibold flex items-center"
                    >
                      <FaEye className="mr-2" />
                      View Details
                    </button>

                    {transaction.status === 'pending' && (
                      <button
                        onClick={() => handleCancelTransaction(transaction.id, 'Cancelled by user')}
                        className="px-6 py-3 border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-all duration-300 font-semibold flex items-center"
                      >
                        <FaTimesCircle className="mr-2" />
                        Cancel Transaction
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Escrow;