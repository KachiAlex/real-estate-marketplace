import React, { useState } from 'react';
import { useMortgage } from '../contexts/MortgageContext';
import { FaHome, FaCalendar, FaMoneyBillWave, FaCheckCircle, FaExclamationTriangle, FaCreditCard } from 'react-icons/fa';
import MortgagePaymentFlow from './MortgagePaymentFlow';
import toast from 'react-hot-toast';

const MortgageDashboard = () => {
  const { getUserMortgages, getUpcomingPayments, getPaymentSummary } = useMortgage();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedMortgage, setSelectedMortgage] = useState(null);

  const mortgages = getUserMortgages();
  const upcomingPayments = getUpcomingPayments();
  const paymentSummary = getPaymentSummary();

  const handleMakePayment = (mortgage) => {
    setSelectedMortgage(mortgage);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (payment, updatedMortgage) => {
    toast.success('Payment processed successfully!');
    setShowPaymentModal(false);
    setSelectedMortgage(null);
  };

  const getPaymentStatusColor = (daysUntilPayment) => {
    if (daysUntilPayment <= 0) return 'text-red-600 bg-red-100';
    if (daysUntilPayment <= 7) return 'text-orange-600 bg-orange-100';
    if (daysUntilPayment <= 14) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getPaymentStatusText = (daysUntilPayment) => {
    if (daysUntilPayment <= 0) return 'Overdue';
    if (daysUntilPayment <= 7) return 'Due Soon';
    if (daysUntilPayment <= 14) return 'Upcoming';
    return 'Scheduled';
  };

  if (mortgages.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <FaHome className="text-gray-300 text-4xl mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Mortgages</h3>
          <p className="text-gray-600 mb-4">You don't have any active mortgage accounts.</p>
          <button
            onClick={() => window.location.href = '/mortgage'}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Apply for Mortgage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Active Mortgages</p>
              <p className="text-2xl font-bold text-gray-900">{paymentSummary.activeMortgages}</p>
            </div>
            <FaHome className="text-blue-600 text-xl" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Monthly Payments</p>
              <p className="text-2xl font-bold text-gray-900">₦{paymentSummary.totalMonthlyPayments.toLocaleString()}</p>
            </div>
            <FaMoneyBillWave className="text-green-600 text-xl" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Paid</p>
              <p className="text-2xl font-bold text-gray-900">₦{paymentSummary.totalPaid.toLocaleString()}</p>
            </div>
            <FaCheckCircle className="text-purple-600 text-xl" />
          </div>
        </div>
      </div>

      {/* Upcoming Payments */}
      {upcomingPayments.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Payments</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {upcomingPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{payment.propertyTitle}</h4>
                    <p className="text-sm text-gray-600">{payment.propertyLocation}</p>
                    <p className="text-sm text-gray-600">
                      Due: {new Date(payment.nextPaymentDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">₦{payment.paymentAmount.toLocaleString()}</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(payment.daysUntilPayment)}`}>
                        {getPaymentStatusText(payment.daysUntilPayment)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleMakePayment(payment)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <FaCreditCard />
                      <span>Pay Now</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* All Mortgages */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Your Mortgages</h3>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            {mortgages.map((mortgage) => (
              <div key={mortgage.id} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-1">{mortgage.propertyTitle}</h4>
                    <p className="text-gray-600 mb-2">{mortgage.propertyLocation}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Loan Amount: ₦{mortgage.loanAmount.toLocaleString()}</span>
                      <span>Interest Rate: {mortgage.interestRate}%</span>
                      <span>Term: {mortgage.loanTerm} years</span>
                    </div>
                  </div>
                  <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                    mortgage.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {mortgage.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <FaMoneyBillWave className="text-green-600" />
                      <span className="text-sm font-medium text-gray-600">Monthly Payment</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900">₦{mortgage.monthlyPayment.toLocaleString()}</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <FaCalendar className="text-blue-600" />
                      <span className="text-sm font-medium text-gray-600">Next Payment</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(mortgage.nextPaymentDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <FaCheckCircle className="text-purple-600" />
                      <span className="text-sm font-medium text-gray-600">Progress</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {mortgage.paymentsMade}/{mortgage.totalPayments}
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(mortgage.paymentsMade / mortgage.totalPayments) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <p>Remaining: ₦{(mortgage.paymentsRemaining * mortgage.monthlyPayment).toLocaleString()}</p>
                    <p>Total Paid: ₦{(mortgage.paymentsMade * mortgage.monthlyPayment).toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => handleMakePayment(mortgage)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <FaCreditCard />
                    <span>Make Payment</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedMortgage && (
        <MortgagePaymentFlow
          mortgageId={selectedMortgage.id}
          onPaymentSuccess={handlePaymentSuccess}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedMortgage(null);
          }}
        />
      )}
    </div>
  );
};

export default MortgageDashboard;
