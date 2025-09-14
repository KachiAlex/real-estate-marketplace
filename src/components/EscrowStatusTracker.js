import React, { useState, useEffect } from 'react';
import { useEscrow } from '../contexts/EscrowContext';
import { 
  FaCheck, 
  FaClock, 
  FaExclamationTriangle,
  FaShieldAlt,
  FaDollarSign,
  FaHome,
  FaUser,
  FaCalendarAlt,
  FaFileContract,
  FaGavel,
  FaTimes,
  FaSpinner
} from 'react-icons/fa';

const EscrowStatusTracker = ({ escrowTransaction }) => {
  const { getEscrowTimer } = useEscrow();
  const [timer, setTimer] = useState(null);

  useEffect(() => {
    if (escrowTransaction.confirmationDeadline) {
      setTimer(getEscrowTimer(escrowTransaction.confirmationDeadline));
      
      // Update timer every minute
      const interval = setInterval(() => {
        setTimer(getEscrowTimer(escrowTransaction.confirmationDeadline));
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [escrowTransaction.confirmationDeadline, getEscrowTimer]);

  const getStatusSteps = () => {
    const steps = [
      {
        id: 'payment',
        title: 'Payment Made',
        description: 'Funds transferred to escrow',
        icon: FaDollarSign,
        completed: ['funded', 'in_escrow', 'buyer_confirmed', 'auto_released', 'completed', 'disputed', 'cancelled'].includes(escrowTransaction.status)
      },
      {
        id: 'escrow',
        title: 'In Escrow',
        description: 'Funds held securely',
        icon: FaShieldAlt,
        completed: ['in_escrow', 'buyer_confirmed', 'auto_released', 'completed', 'disputed', 'cancelled'].includes(escrowTransaction.status)
      },
      {
        id: 'confirmation',
        title: 'Property Confirmation',
        description: 'Buyer confirms possession',
        icon: FaHome,
        completed: ['buyer_confirmed', 'auto_released', 'completed', 'disputed', 'cancelled'].includes(escrowTransaction.status),
        current: escrowTransaction.status === 'in_escrow' || escrowTransaction.status === 'funded'
      },
      {
        id: 'release',
        title: 'Funds Released',
        description: 'Transaction completed',
        icon: FaCheck,
        completed: ['completed', 'auto_released'].includes(escrowTransaction.status)
      }
    ];

    // Add dispute step if disputed
    if (escrowTransaction.status === 'disputed') {
      steps.push({
        id: 'dispute',
        title: 'Dispute Resolution',
        description: 'Admin reviewing case',
        icon: FaGavel,
        completed: false,
        current: true
      });
    }

    return steps;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'funded': return 'text-blue-600 bg-blue-100';
      case 'in_escrow': return 'text-purple-600 bg-purple-100';
      case 'buyer_confirmed': return 'text-green-600 bg-green-100';
      case 'auto_released': return 'text-orange-600 bg-orange-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'disputed': return 'text-red-600 bg-red-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <FaClock className="h-4 w-4" />;
      case 'funded': return <FaDollarSign className="h-4 w-4" />;
      case 'in_escrow': return <FaShieldAlt className="h-4 w-4" />;
      case 'buyer_confirmed': return <FaCheck className="h-4 w-4" />;
      case 'auto_released': return <FaCheck className="h-4 w-4" />;
      case 'completed': return <FaCheck className="h-4 w-4" />;
      case 'disputed': return <FaExclamationTriangle className="h-4 w-4" />;
      case 'cancelled': return <FaTimes className="h-4 w-4" />;
      default: return <FaClock className="h-4 w-4" />;
    }
  };

  const steps = getStatusSteps();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Transaction Status</h3>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(escrowTransaction.status)}`}>
            {getStatusIcon(escrowTransaction.status)}
            <span className="ml-2 capitalize">{escrowTransaction.status.replace('_', ' ')}</span>
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <FaHome className="text-gray-400 h-4 w-4" />
            <span className="text-gray-600">Property:</span>
            <span className="font-medium text-gray-900">{escrowTransaction.propertyTitle}</span>
          </div>
          <div className="flex items-center space-x-2">
            <FaDollarSign className="text-gray-400 h-4 w-4" />
            <span className="text-gray-600">Amount:</span>
            <span className="font-medium text-gray-900">₦{escrowTransaction.amount.toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <FaCalendarAlt className="text-gray-400 h-4 w-4" />
            <span className="text-gray-600">Created:</span>
            <span className="font-medium text-gray-900">
              {new Date(escrowTransaction.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Timer Alert */}
      {timer && !timer.expired && (escrowTransaction.status === 'in_escrow' || escrowTransaction.status === 'funded') && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <FaClock className="text-yellow-600 h-5 w-5" />
            <div>
              <p className="text-sm font-medium text-yellow-900">Confirmation Deadline</p>
              <p className="text-sm text-yellow-800">
                {timer.days} days, {timer.hours} hours, {timer.minutes} minutes remaining
              </p>
            </div>
          </div>
        </div>
      )}

      {timer && timer.expired && (escrowTransaction.status === 'in_escrow' || escrowTransaction.status === 'funded') && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <FaExclamationTriangle className="text-red-600 h-5 w-5" />
            <div>
              <p className="text-sm font-medium text-red-900">Deadline Expired</p>
              <p className="text-sm text-red-800">
                The confirmation deadline has passed. Funds will be automatically released to the vendor.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isLast = index === steps.length - 1;
          
          return (
            <div key={step.id} className="flex items-start space-x-4">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                step.completed 
                  ? 'bg-green-100 text-green-600' 
                  : step.current 
                    ? 'bg-brand-blue text-white' 
                    : 'bg-gray-100 text-gray-400'
              }`}>
                {step.completed ? (
                  <FaCheck className="h-5 w-5" />
                ) : step.current ? (
                  <FaSpinner className="h-5 w-5 animate-spin" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className={`text-sm font-medium ${
                    step.completed || step.current ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </h4>
                  {step.current && (
                    <span className="bg-brand-blue text-white text-xs font-medium px-2 py-1 rounded-full">
                      Current
                    </span>
                  )}
                </div>
                <p className={`text-sm ${
                  step.completed || step.current ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  {step.description}
                </p>
                
                {/* Step-specific information */}
                {step.id === 'payment' && escrowTransaction.paymentDate && (
                  <p className="text-xs text-gray-500 mt-1">
                    Paid on {new Date(escrowTransaction.paymentDate).toLocaleDateString()}
                  </p>
                )}
                
                {step.id === 'confirmation' && timer && !timer.expired && (
                  <p className="text-xs text-orange-600 mt-1">
                    {timer.days}d {timer.hours}h {timer.minutes}m remaining
                  </p>
                )}
                
                {step.id === 'dispute' && escrowTransaction.disputeReason && (
                  <p className="text-xs text-red-600 mt-1">
                    Reason: {escrowTransaction.disputeReason.replace('_', ' ')}
                  </p>
                )}
              </div>
              
              {!isLast && (
                <div className={`w-px h-8 ml-5 ${
                  step.completed ? 'bg-green-200' : 'bg-gray-200'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Transaction Details */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Transaction Details</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Transaction ID</p>
            <p className="font-medium text-gray-900">{escrowTransaction.id}</p>
          </div>
          <div>
            <p className="text-gray-500">Escrow Fee</p>
            <p className="font-medium text-gray-900">₦{escrowTransaction.escrowFee?.toLocaleString() || '0'}</p>
          </div>
          <div>
            <p className="text-gray-500">Payment Method</p>
            <p className="font-medium text-gray-900 capitalize">
              {escrowTransaction.paymentMethod?.replace('_', ' ') || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Flutterwave Reference</p>
            <p className="font-medium text-gray-900 text-xs">
              {escrowTransaction.flutterwaveReference || 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EscrowStatusTracker;
