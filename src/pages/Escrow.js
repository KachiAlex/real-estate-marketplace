import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaShieldAlt, FaCreditCard, FaCheckCircle, FaClock, FaTimesCircle, FaPlus, FaEye, FaLock, FaUserCheck, FaHandshake } from 'react-icons/fa';
import toast from 'react-hot-toast';

const Escrow = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userTransactions, setUserTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [approvalLoading, setApprovalLoading] = useState(false);

  // Load user's escrow transactions from localStorage
  useEffect(() => {
    if (user) {
      // Load transactions from localStorage (for demo)
      const storedTransactions = JSON.parse(localStorage.getItem('escrowTransactions') || '[]');
      const filteredTransactions = storedTransactions.filter(t => t.buyerId === user.id);
      setUserTransactions(filteredTransactions);
      console.log('User escrow transactions:', filteredTransactions);
    }
  }, [user]);

  const handleStartNewPurchase = () => {
    navigate('/properties');
  };

  const handleViewTransaction = (transactionId) => {
    navigate(`/escrow/${transactionId}`);
  };

  const handleApproveTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setShowApprovalModal(true);
  };

  const handleConfirmApproval = async () => {
    if (!selectedTransaction) return;

    setApprovalLoading(true);
    
    try {
      // Update transaction status to completed
      const storedTransactions = JSON.parse(localStorage.getItem('escrowTransactions') || '[]');
      const updatedTransactions = storedTransactions.map(t => 
        t.id === selectedTransaction.id 
          ? { 
              ...t, 
              status: 'completed', 
              completedAt: new Date().toISOString(),
              buyerApprovalDate: new Date().toISOString(),
              fundsReleasedToVendor: true
            }
          : t
      );
      
      localStorage.setItem('escrowTransactions', JSON.stringify(updatedTransactions));
      
      // Update local state
      setUserTransactions(prev => prev.map(t => 
        t.id === selectedTransaction.id 
          ? { 
              ...t, 
              status: 'completed', 
              completedAt: new Date().toISOString(),
              buyerApprovalDate: new Date().toISOString(),
              fundsReleasedToVendor: true
            }
          : t
      ));

      setShowApprovalModal(false);
      setSelectedTransaction(null);
      
      toast.success(`Funds released to vendor! Transaction completed successfully.`);
    } catch (error) {
      console.error('Error approving transaction:', error);
      toast.error('Failed to approve transaction');
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleCancelApproval = () => {
    setShowApprovalModal(false);
    setSelectedTransaction(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'funded': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <FaClock />;
      case 'funded': return <FaLock />;
      case 'completed': return <FaCheckCircle />;
      case 'cancelled': return <FaTimesCircle />;
      default: return <FaClock />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Payment Pending';
      case 'funded': return 'Funds in Escrow';
      case 'completed': return 'Transaction Complete';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Escrow Transactions</h1>
        <p className="text-gray-600">
          Manage your secure property transactions with built-in escrow protection
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FaShieldAlt className="text-blue-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{userTransactions.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <FaClock className="text-yellow-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {userTransactions.filter(t => t.status === 'pending' || t.status === 'funded').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <FaCheckCircle className="text-green-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {userTransactions.filter(t => t.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FaLock className="text-blue-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Funds in Escrow</p>
              <p className="text-2xl font-bold text-gray-900">
                ₦{userTransactions
                  .filter(t => t.status === 'funded')
                  .reduce((sum, t) => sum + (t.totalAmount || 0), 0)
                  .toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Escrow Protection Information */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 mb-8">
        <div className="flex items-center mb-4">
          <FaShieldAlt className="text-blue-600 text-2xl mr-3" />
          <h2 className="text-xl font-bold text-gray-900">Escrow Protection Active</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center">
            <FaLock className="text-green-600 mr-2" />
            <span><strong>Funds Secured:</strong> Money held safely in escrow</span>
          </div>
          <div className="flex items-center">
            <FaUserCheck className="text-green-600 mr-2" />
            <span><strong>Buyer Control:</strong> You approve before release</span>
          </div>
          <div className="flex items-center">
            <FaHandshake className="text-green-600 mr-2" />
            <span><strong>Dispute Protection:</strong> Full refund guarantee</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Your Transactions</h2>
        <button
          onClick={handleStartNewPurchase}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <FaPlus className="mr-2" />
          Start New Purchase
        </button>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-lg shadow">
        {userTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <FaShieldAlt className="text-gray-400 text-4xl mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Escrow Transactions Yet</h3>
            <p className="text-gray-600 mb-6">
              Start your first secure property purchase with escrow protection
            </p>
            <button
              onClick={handleStartNewPurchase}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto"
            >
              <FaPlus className="mr-2" />
              Browse Properties
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {userTransactions.map((transaction) => (
              <div key={transaction.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {transaction.propertyTitle}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(transaction.status)}`}>
                        {getStatusIcon(transaction.status)}
                        <span className="ml-1">{getStatusLabel(transaction.status)}</span>
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Amount:</span> ₦{transaction.totalAmount?.toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Created:</span> {new Date(transaction.createdAt).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Type:</span> {transaction.type || 'Purchase'}
                      </div>
                    </div>
                    
                    {transaction.status === 'funded' && (
                      <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-800">
                        <FaLock className="inline mr-1" />
                        <strong>Funds Secured:</strong> ₦{transaction.amount?.toLocaleString()} held in escrow awaiting your approval
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    {transaction.status === 'funded' ? (
                      <button
                        onClick={() => handleApproveTransaction(transaction)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                      >
                        <FaUserCheck className="mr-1" />
                        Approve & Release Funds
                      </button>
                    ) : transaction.status === 'completed' ? (
                      <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg flex items-center">
                        <FaCheckCircle className="mr-1" />
                        Funds Released
                      </div>
                    ) : (
                      <button
                        onClick={() => handleViewTransaction(transaction.id)}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
                      >
                        <FaEye className="mr-1" />
                        View Details
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approval Confirmation Modal */}
      {showApprovalModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaTimesCircle className="text-red-600 text-2xl" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">⚠️ WARNING: Approve Fund Release</h3>
              <p className="text-gray-600 mb-4">
                You are about to release <strong>₦{selectedTransaction.totalAmount?.toLocaleString()}</strong> to the vendor for:
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4 text-left">
                <h4 className="font-semibold text-gray-900">{selectedTransaction.propertyTitle}</h4>
                <p className="text-sm text-gray-600">Transaction ID: {selectedTransaction.id}</p>
                <p className="text-sm text-gray-600">Amount: ₦{selectedTransaction.amount?.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Escrow Fee: ₦{selectedTransaction.escrowFee?.toLocaleString()}</p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg mb-6">
                <div className="text-sm text-red-800 space-y-2">
                  <p><strong>⚠️ IMPORTANT WARNING:</strong></p>
                  <ul className="text-left space-y-1">
                    <li>• Once approved, the money will be sent directly to the vendor</li>
                    <li>• This action is <strong>IRREVERSIBLE</strong></li>
                    <li>• You will NOT be able to get a refund after approval</li>
                    <li>• Only approve if you are completely satisfied with the property</li>
                  </ul>
                </div>
              </div>

              <div className="text-sm text-gray-600 mb-6">
                <p>Have you:</p>
                <ul className="text-left space-y-1 mt-2">
                  <li>✅ Inspected the property thoroughly?</li>
                  <li>✅ Verified all documents are correct?</li>
                  <li>✅ Confirmed the property meets your expectations?</li>
                  <li>✅ Received all necessary paperwork?</li>
                </ul>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleCancelApproval}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmApproval}
                  disabled={approvalLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {approvalLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <FaHandshake className="mr-2" />
                      Yes, Release Funds
                    </>
                  )}
                </button>
              </div>
              
              <p className="text-xs text-gray-500 mt-3">
                By clicking "Yes, Release Funds", you confirm that you are satisfied with the property and authorize the irreversible release of funds to the vendor.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Escrow;