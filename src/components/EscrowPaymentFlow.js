import React, { useState, useEffect } from 'react';
import { useEscrow } from '../contexts/EscrowContext';
import { 
  FaCreditCard, 
  FaClock, 
  FaCheck, 
  FaTimes, 
  FaExclamationTriangle,
  FaShieldAlt,
  FaUser,
  FaHome,
  FaDollarSign,
  FaCalendarAlt,
  FaFileContract,
  FaBell,
  FaQuestionCircle
} from 'react-icons/fa';

const EscrowPaymentFlow = ({ property, onClose }) => {
  const { 
    createEscrowTransaction, 
    initiatePayment, 
    paymentLoading,
    getEscrowTimer 
  } = useEscrow();
  
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [escrowData, setEscrowData] = useState(null);
  const [loading, setLoading] = useState(false);

  const escrowFee = property.price * 0.005; // 0.5% escrow fee
  const totalAmount = property.price + escrowFee;

  const handleCreateEscrow = async () => {
    setLoading(true);
    try {
      const transactionData = {
        propertyId: property.id,
        propertyTitle: property.title,
        amount: property.price,
        currency: 'NGN',
        type: 'sale',
        paymentMethod,
        escrowFee,
        totalAmount
      };

      const result = await createEscrowTransaction(transactionData);
      if (result) {
        setEscrowData(result);
        setStep(2);
      }
    } catch (error) {
      console.error('Error creating escrow:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInitiatePayment = async () => {
    if (!escrowData) return;
    
    try {
      const result = await initiatePayment(escrowData.id, paymentMethod);
      if (result) {
        setStep(3);
      }
    } catch (error) {
      console.error('Error initiating payment:', error);
    }
  };

  const steps = [
    { id: 1, title: 'Create Escrow', description: 'Set up secure escrow transaction' },
    { id: 2, title: 'Make Payment', description: 'Pay through Flutterwave' },
    { id: 3, title: 'Confirmation', description: 'Confirm property possession' },
    { id: 4, title: 'Release Funds', description: 'Funds released to vendor' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Secure Escrow Payment</h2>
              <p className="text-gray-600 mt-1">Your payment is protected with our escrow system</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FaTimes className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {steps.map((stepItem, index) => (
              <div key={stepItem.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  step >= stepItem.id 
                    ? 'bg-brand-blue border-brand-blue text-white' 
                    : 'border-gray-300 text-gray-400'
                }`}>
                  {step > stepItem.id ? (
                    <FaCheck className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{stepItem.id}</span>
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    step >= stepItem.id ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {stepItem.title}
                  </p>
                  <p className="text-xs text-gray-500">{stepItem.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    step > stepItem.id ? 'bg-brand-blue' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-6">
              {/* Property Summary */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <FaHome className="text-gray-400 h-5 w-5" />
                      <div>
                        <p className="text-sm text-gray-500">Property</p>
                        <p className="font-medium text-gray-900">{property.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <FaUser className="text-gray-400 h-5 w-5" />
                      <div>
                        <p className="text-sm text-gray-500">Vendor</p>
                        <p className="font-medium text-gray-900">{property.vendor}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <FaDollarSign className="text-gray-400 h-5 w-5" />
                      <div>
                        <p className="text-sm text-gray-500">Property Price</p>
                        <p className="font-medium text-gray-900">₦{property.price.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <FaShieldAlt className="text-gray-400 h-5 w-5" />
                      <div>
                        <p className="text-sm text-gray-500">Escrow Fee (0.5%)</p>
                        <p className="font-medium text-gray-900">₦{escrowFee.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { id: 'card', name: 'Credit/Debit Card', icon: FaCreditCard },
                    { id: 'bank_transfer', name: 'Bank Transfer', icon: FaDollarSign },
                    { id: 'ussd', name: 'USSD', icon: FaCreditCard }
                  ].map((method) => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        className={`p-4 border-2 rounded-lg text-left transition-colors ${
                          paymentMethod === method.id
                            ? 'border-brand-blue bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="h-6 w-6 text-gray-600 mb-2" />
                        <p className="font-medium text-gray-900">{method.name}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Escrow Protection Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <FaShieldAlt className="text-blue-600 h-6 w-6 mt-1" />
                  <div>
                    <h4 className="text-lg font-semibold text-blue-900 mb-2">Escrow Protection</h4>
                    <ul className="space-y-2 text-sm text-blue-800">
                      <li className="flex items-center space-x-2">
                        <FaCheck className="h-4 w-4" />
                        <span>Your payment is held securely until you confirm property possession</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <FaCheck className="h-4 w-4" />
                        <span>7-day confirmation period after payment</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <FaCheck className="h-4 w-4" />
                        <span>Automatic release if no action taken</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <FaCheck className="h-4 w-4" />
                        <span>Dispute resolution available</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Total Amount */}
              <div className="bg-gray-900 text-white rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-300">Total Amount to Pay</p>
                    <p className="text-3xl font-bold">₦{totalAmount.toLocaleString()}</p>
                  </div>
                  <button
                    onClick={handleCreateEscrow}
                    disabled={loading}
                    className="bg-brand-orange hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Creating Escrow...' : 'Create Escrow & Pay'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && escrowData && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaCheck className="text-green-600 text-2xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Escrow Created Successfully!</h3>
                <p className="text-gray-600">Your escrow transaction has been created. Proceed to make payment.</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Transaction Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Escrow ID</p>
                    <p className="font-medium text-gray-900">{escrowData.id}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Amount</p>
                    <p className="font-medium text-gray-900">₦{escrowData.totalAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Payment Method</p>
                    <p className="font-medium text-gray-900 capitalize">{paymentMethod.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Status</p>
                    <p className="font-medium text-gray-900 capitalize">{escrowData.status}</p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={handleInitiatePayment}
                  disabled={paymentLoading}
                  className="bg-brand-blue hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  {paymentLoading ? 'Processing...' : 'Proceed to Payment'}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaCreditCard className="text-blue-600 text-2xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Redirecting to Payment</h3>
                <p className="text-gray-600">You will be redirected to Flutterwave to complete your payment securely.</p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <FaBell className="text-yellow-600 h-6 w-6 mt-1" />
                  <div>
                    <h4 className="text-lg font-semibold text-yellow-900 mb-2">Important Reminder</h4>
                    <p className="text-sm text-yellow-800">
                      After successful payment, you will have 7 days to confirm property possession. 
                      If no action is taken, funds will automatically be released to the vendor.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EscrowPaymentFlow;
