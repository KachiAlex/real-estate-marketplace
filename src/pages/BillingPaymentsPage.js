import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCreditCard, FaDownload, FaPlus, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/currency';
import Modal from '../components/Modal';

/**
 * BillingPaymentsPage Component
 * Displays payment history, saved payment methods, and billing information
 */
const BillingPaymentsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('history');
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: ''
  });

  // Fetch data on mount
  useEffect(() => {
    if (user) {
      try {
        const history = localStorage.getItem('paymentHistory');
        const methods = localStorage.getItem('paymentMethods');
        setPaymentHistory(history ? JSON.parse(history) : []);
        setPaymentMethods(methods ? JSON.parse(methods) : []);
      } catch (error) {
        console.error('Error loading billing data:', error);
        toast.error('Failed to load billing data');
      } finally {
        setLoading(false);
      }
    } else {
      navigate('/auth/login');
    }
  }, [user, navigate]);

  const handleAddPaymentMethod = () => {
    if (!newPaymentMethod.cardNumber || !newPaymentMethod.cardHolder || !newPaymentMethod.expiryDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    const method = {
      id: `pm_${Date.now()}`,
      cardNumber: `****${newPaymentMethod.cardNumber.slice(-4)}`,
      cardHolder: newPaymentMethod.cardHolder,
      expiryDate: newPaymentMethod.expiryDate,
      createdAt: new Date().toISOString()
    };

    const updated = [...paymentMethods, method];
    setPaymentMethods(updated);
    localStorage.setItem('paymentMethods', JSON.stringify(updated));
    setNewPaymentMethod({ cardNumber: '', cardHolder: '', expiryDate: '', cvv: '' });
    setShowAddPaymentModal(false);
    toast.success('Payment method added successfully');
  };

  const handleDeletePaymentMethod = (methodId) => {
    if (window.confirm('Are you sure you want to delete this payment method?')) {
      const updated = paymentMethods.filter(m => m.id !== methodId);
      setPaymentMethods(updated);
      localStorage.setItem('paymentMethods', JSON.stringify(updated));
      toast.success('Payment method deleted');
    }
  };

  const handleDownloadInvoice = (invoiceId) => {
    toast.success('Invoice download started');
  };

  const totalInvested = paymentHistory.reduce((sum, payment) => sum + (payment.amount || 0), 0);
  const totalPaid = paymentHistory.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.amount || 0), 0);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please login to view your billing information</p>
          <button
            onClick={() => navigate('/auth/login')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing & Payments</h1>
          <p className="text-gray-600">Manage your payment methods and view billing history</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm mb-2">Total Invested</p>
            <p className="text-3xl font-bold text-blue-600">
              {formatCurrency(totalInvested)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm mb-2">Total Paid</p>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(totalPaid)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm mb-2">Saved Payment Methods</p>
            <p className="text-3xl font-bold text-gray-900">
              {paymentMethods.length}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'history'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Payment History
            </button>
            <button
              onClick={() => setActiveTab('methods')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'methods'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Payment Methods
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : activeTab === 'history' ? (
              // Payment History
              <div>
                {paymentHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <FaCreditCard className="text-4xl text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No payment history yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Invoice</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentHistory.map((payment) => (
                          <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {new Date(payment.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900">
                              {payment.description || 'Investment Payment'}
                            </td>
                            <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                              {formatCurrency(payment.amount)}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {payment.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm">
                              <button
                                onClick={() => handleDownloadInvoice(payment.id)}
                                className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                              >
                                <FaDownload className="text-xs" />
                                Download
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              // Payment Methods
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Saved Payment Methods</h3>
                  <button
                    onClick={() => setShowAddPaymentModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FaPlus /> Add Payment Method
                  </button>
                </div>

                {paymentMethods.length === 0 ? (
                  <div className="text-center py-12">
                    <FaCreditCard className="text-4xl text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No payment methods saved</p>
                    <button
                      onClick={() => setShowAddPaymentModal(true)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Add Payment Method
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {paymentMethods.map((method) => (
                      <div key={method.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <FaCreditCard className="text-2xl text-blue-600" />
                            <div>
                              <p className="font-semibold text-gray-900">{method.cardHolder}</p>
                              <p className="text-sm text-gray-600">{method.cardNumber}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeletePaymentMethod(method.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <FaTrash />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500">
                          Expires: {method.expiryDate}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Payment Method Modal */}
      {showAddPaymentModal && (
        <Modal onClose={() => setShowAddPaymentModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Payment Method</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Card Holder Name
                </label>
                <input
                  type="text"
                  value={newPaymentMethod.cardHolder}
                  onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, cardHolder: e.target.value })}
                  placeholder="John Doe"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Card Number
                </label>
                <input
                  type="text"
                  value={newPaymentMethod.cardNumber}
                  onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, cardNumber: e.target.value.replace(/\s/g, '') })}
                  placeholder="1234 5678 9012 3456"
                  maxLength="16"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    value={newPaymentMethod.expiryDate}
                    onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, expiryDate: e.target.value })}
                    placeholder="MM/YY"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CVV
                  </label>
                  <input
                    type="text"
                    value={newPaymentMethod.cvv}
                    onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, cvv: e.target.value })}
                    placeholder="123"
                    maxLength="3"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddPaymentModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPaymentMethod}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Add Method
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default BillingPaymentsPage;
