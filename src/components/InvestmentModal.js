import React, { useState, useEffect } from 'react';
import { FaTimes, FaDollarSign, FaPercent, FaCalendarAlt, FaShieldAlt, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import toast from 'react-hot-toast';

const InvestmentModal = ({ 
  isOpen, 
  onClose, 
  investment, 
  onInvest,
  user 
}) => {
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'bank_transfer',
    termsAccepted: false,
    riskAcknowledged: false
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (investment) {
      setFormData(prev => ({
        ...prev,
        amount: investment.minimumInvestment || ''
      }));
    }
  }, [investment]);

  if (!isOpen || !investment) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid investment amount';
    } else if (parseFloat(formData.amount) < investment.minimumInvestment) {
      newErrors.amount = `Minimum investment is ₦${investment.minimumInvestment.toLocaleString()}`;
    } else if (parseFloat(formData.amount) > investment.totalAmount) {
      newErrors.amount = `Maximum investment is ₦${investment.totalAmount.toLocaleString()}`;
    }
    
    if (!formData.termsAccepted) {
      newErrors.termsAccepted = 'You must accept the terms and conditions';
    }
    
    if (!formData.riskAcknowledged) {
      newErrors.riskAcknowledged = 'You must acknowledge the investment risks';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors below');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const investmentData = {
        investmentId: investment.id,
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod,
        investorId: user?.id,
        investorEmail: user?.email,
        timestamp: new Date().toISOString()
      };
      
      onInvest(investmentData);
      toast.success('Investment submitted successfully!');
      onClose();
    } catch (error) {
      toast.error('Failed to submit investment. Please try again.');
      console.error('Investment error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const calculateOwnership = (amount) => {
    return ((amount / investment.totalAmount) * 100).toFixed(2);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col relative">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-100 flex-shrink-0">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FaTimes className="text-lg" />
          </button>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invest in {investment.title}</h2>
          <p className="text-sm text-gray-600">Complete your investment in this property</p>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Investment Summary */}
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-3">Investment Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Total Amount:</span>
                <p className="font-semibold text-blue-900">{formatCurrency(investment.totalAmount)}</p>
              </div>
              <div>
                <span className="text-blue-700">Minimum Investment:</span>
                <p className="font-semibold text-blue-900">{formatCurrency(investment.minimumInvestment)}</p>
              </div>
              <div>
                <span className="text-blue-700">Expected ROI:</span>
                <p className="font-semibold text-blue-900">{investment.expectedROI}%</p>
              </div>
              <div>
                <span className="text-blue-700">Duration:</span>
                <p className="font-semibold text-blue-900">{investment.duration} months</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Investment Amount */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Investment Amount
              </label>
              <div className="relative">
                <FaDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    errors.amount ? 'border-red-300 focus:border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="Enter investment amount"
                  min={investment.minimumInvestment}
                  max={investment.totalAmount}
                />
              </div>
              {errors.amount && <p className="text-sm text-red-600 mt-1">{errors.amount}</p>}
              
              {/* Ownership calculation */}
              {formData.amount && !errors.amount && (
                <div className="mt-2 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700">
                    <FaPercent className="inline mr-1" />
                    You will own <span className="font-semibold">{calculateOwnership(formData.amount)}%</span> of this property
                  </p>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="card">Credit/Debit Card</option>
                <option value="flutterwave">Flutterwave</option>
              </select>
            </div>

            {/* Terms and Conditions */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  name="termsAccepted"
                  checked={formData.termsAccepted}
                  onChange={handleChange}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <label className="text-sm text-gray-700">
                    I agree to the <a href="#" className="text-blue-600 hover:underline">Terms and Conditions</a> and 
                    <a href="#" className="text-blue-600 hover:underline ml-1">Investment Agreement</a>
                  </label>
                  {errors.termsAccepted && <p className="text-sm text-red-600 mt-1">{errors.termsAccepted}</p>}
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  name="riskAcknowledged"
                  checked={formData.riskAcknowledged}
                  onChange={handleChange}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <label className="text-sm text-gray-700">
                    I acknowledge that real estate investments carry risks and past performance does not guarantee future results
                  </label>
                  {errors.riskAcknowledged && <p className="text-sm text-red-600 mt-1">{errors.riskAcknowledged}</p>}
                </div>
              </div>
            </div>

            {/* Risk Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <FaExclamationTriangle className="text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-800 mb-1">Investment Risk Warning</h4>
                  <p className="text-sm text-yellow-700">
                    Real estate investments are subject to market risks. Please ensure you understand the risks involved 
                    and only invest what you can afford to lose.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
        
        {/* Footer */}
        <div className="p-6 pt-4 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
          <button 
            onClick={onClose} 
            className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl hover:from-green-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <FaCheck />
                <span>Invest Now</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvestmentModal;
