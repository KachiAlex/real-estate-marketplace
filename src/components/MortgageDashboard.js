import React, { useState } from 'react';
import { useMortgage } from '../contexts/MortgageContext';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaCalendar, FaMoneyBillWave, FaCheckCircle, FaExclamationTriangle, FaCreditCard, FaEye, FaChartLine, FaHistory, FaFileDownload, FaInfoCircle, FaToggleOn, FaToggleOff, FaCalculator } from 'react-icons/fa';
import { getDaysUntilPayment } from '../utils/mortgageCalculator';
import MortgagePaymentFlow from './MortgagePaymentFlow';
import ExtraPaymentCalculator from './ExtraPaymentCalculator';
import toast from 'react-hot-toast';

const MortgageDashboard = () => {
  const { getUserMortgages, getUpcomingPayments, getPaymentSummary, enableAutoPay, disableAutoPay } = useMortgage();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedMortgage, setSelectedMortgage] = useState(null);
  const [showPaymentHistory, setShowPaymentHistory] = useState({});
  const [showExtraPaymentCalc, setShowExtraPaymentCalc] = useState(false);
  const navigate = useNavigate();

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

  const togglePaymentHistory = (mortgageId) => {
    setShowPaymentHistory(prev => ({
      ...prev,
      [mortgageId]: !prev[mortgageId]
    }));
  };

  const handleToggleAutoPay = async (mortgage, enabled) => {
    if (enabled) {
      await disableAutoPay(mortgage.id);
    } else {
      await enableAutoPay(mortgage.id);
    }
  };

  const handleExportPaymentHistory = (mortgage) => {
    if (!mortgage.paymentHistory || mortgage.paymentHistory.length === 0) {
      toast.error('No payment history to export');
      return;
    }

    const csvContent = [
      ['Payment ID', 'Date', 'Amount', 'Due Date', 'Status', 'Method'].join(','),
      ...mortgage.paymentHistory.map(p => [
        p.id,
        new Date(p.paidDate).toLocaleDateString(),
        `₦${p.amount.toLocaleString()}`,
        new Date(p.dueDate).toLocaleDateString(),
        p.status,
        p.paymentMethod
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mortgage-payments-${mortgage.id}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('Payment history exported successfully!');
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

  // Calculate financial insights
  const calculateMortgageInsights = (mortgage) => {
    const totalInterest = mortgage.totalPayments * mortgage.monthlyPayment - mortgage.loanAmount;
    const totalPaid = mortgage.paymentsMade * mortgage.monthlyPayment;
    const remainingPayments = mortgage.totalPayments - mortgage.paymentsMade;
    const remainingBalance = remainingPayments * mortgage.monthlyPayment;
    const interestPaid = mortgage.paymentHistory.reduce((sum, p) => {
      const schedulePayment = mortgage.paymentSchedule?.find(sp => sp.paymentNumber === p.paymentNumber);
      return sum + (schedulePayment?.interest || 0);
    }, 0);
    const principalPaid = totalPaid - interestPaid;

    return {
      totalInterest,
      totalPaid,
      remainingBalance,
      interestPaid,
      principalPaid,
      percentagePaid: ((mortgage.paymentsMade / mortgage.totalPayments) * 100).toFixed(1)
    };
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
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FaCalendar className="mr-2 text-blue-600" />
              Upcoming Payments
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {upcomingPayments.map((payment) => (
                <div key={payment.mortgageId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{payment.mortgageTitle || payment.propertyTitle}</h4>
                    <p className="text-sm text-gray-600">{payment.mortgageLocation || payment.propertyLocation}</p>
                    <p className="text-sm text-gray-600">
                      Due: {new Date(payment.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">₦{payment.paymentAmount.toLocaleString()}</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(payment.daysUntilPayment)}`}>
                        {getPaymentStatusText(payment.daysUntilPayment)}
                      </span>
                      {payment.payment && (
                        <p className="text-xs text-gray-500 mt-1">
                          {payment.daysUntilPayment} days away
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        const mortgage = mortgages.find(m => m.id === payment.mortgageId);
                        if (mortgage) handleMakePayment(mortgage);
                      }}
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
            {mortgages.map((mortgage) => {
              const insights = calculateMortgageInsights(mortgage);
              return (
                <div key={mortgage.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 mb-1">{mortgage.propertyTitle}</h4>
                      <p className="text-gray-600 mb-2">{mortgage.propertyLocation}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Loan: ₦{mortgage.loanAmount.toLocaleString()}</span>
                        <span>Rate: {mortgage.interestRate}%</span>
                        <span>Term: {mortgage.loanTerm} years</span>
                      </div>
                    </div>
                    <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                      mortgage.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {mortgage.status}
                    </span>
                  </div>

                  {/* Financial Insights */}
                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <div className="flex items-start">
                      <FaInfoCircle className="text-blue-600 mt-1 mr-2" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900 mb-2">Financial Overview</p>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-blue-700">Principal Paid:</span>
                            <p className="font-semibold text-blue-900">₦{insights.principalPaid.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-blue-700">Interest Paid:</span>
                            <p className="font-semibold text-blue-900">₦{insights.interestPaid.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-blue-700">Remaining Balance:</span>
                            <p className="font-semibold text-blue-900">₦{insights.remainingBalance.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-blue-700">Completion:</span>
                            <p className="font-semibold text-blue-900">{insights.percentagePaid}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <FaMoneyBillWave className="text-green-600" />
                        <span className="text-sm font-medium text-gray-600">Monthly Payment</span>
                      </div>
                      <p className="text-xl font-bold text-gray-900">₦{mortgage.monthlyPayment.toLocaleString()}</p>
                      {mortgage.paymentSchedule && mortgage.paymentSchedule.length > 0 && (
                        <button
                          onClick={() => togglePaymentHistory(mortgage.id)}
                          className="text-xs text-blue-600 hover:underline mt-2 flex items-center"
                        >
                          <FaHistory className="mr-1" />
                          View Schedule
                        </button>
                      )}
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <FaCalendar className="text-blue-600" />
                        <span className="text-sm font-medium text-gray-600">Next Payment</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">
                        {new Date(mortgage.nextPaymentDate).toLocaleDateString()}
                      </p>
                      {mortgage.paymentSchedule && mortgage.paymentSchedule.length > 0 && (
                        mortgage.paymentSchedule.find(p => p.status === 'pending') && (
                          <p className="text-xs text-gray-500 mt-1">
                            {getDaysUntilPayment(mortgage.paymentSchedule.find(p => p.status === 'pending').dueDate)} days away
                          </p>
                        )
                      )}
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <FaChartLine className="text-purple-600" />
                        <span className="text-sm font-medium text-gray-600">Progress</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">
                        {mortgage.paymentsMade}/{mortgage.totalPayments}
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all" 
                          style={{ width: `${insights.percentagePaid}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Payment History */}
                  {showPaymentHistory[mortgage.id] && mortgage.paymentSchedule && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-semibold text-gray-900 flex items-center">
                          <FaHistory className="mr-2" />
                          Payment Schedule
                        </h5>
                        <button
                          onClick={() => togglePaymentHistory(mortgage.id)}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Hide
                        </button>
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {mortgage.paymentSchedule.slice(0, 12).map((payment) => (
                          <div key={payment.id} className="flex items-center justify-between py-2 px-3 bg-white rounded border">
                            <div>
                              <span className="font-medium text-sm">
                                {payment.type === 'down-payment' ? 'Down Payment' : `Payment #${payment.paymentNumber}`}
                              </span>
                              <p className="text-xs text-gray-500">
                                Due: {new Date(payment.dueDate).toLocaleDateString()}
                                {payment.principal && payment.interest && (
                                  <span className="ml-2">
                                    (₦{payment.principal.toLocaleString()} principal, ₦{payment.interest.toLocaleString()} interest)
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-sm">₦{payment.amount.toLocaleString()}</p>
                              <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                                payment.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {payment.status}
                              </span>
                            </div>
                          </div>
                        ))}
                        {mortgage.paymentSchedule.length > 12 && (
                          <p className="text-sm text-gray-500 text-center py-2">
                            + {mortgage.paymentSchedule.length - 12} more payments
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-600">
                      <p>Remaining: ₦{insights.remainingBalance.toLocaleString()}</p>
                      <p>Total Paid: ₦{insights.totalPaid.toLocaleString()}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/property/${mortgage.propertyId}`)}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                      >
                        <FaEye />
                        <span>View Property</span>
                      </button>
                      <button
                        onClick={() => handleMakePayment(mortgage)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                      >
                        <FaCreditCard />
                        <span>Make Payment</span>
                      </button>
                    </div>
                  </div>

                  {/* Auto-Pay Toggle and Additional Actions */}
                  <div className="border-t border-gray-200 mt-4 pt-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <button
                        onClick={() => handleToggleAutoPay(mortgage, mortgage.autoPay)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                          mortgage.autoPay
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {mortgage.autoPay ? (
                          <>
                            <FaToggleOn className="text-xl" />
                            <span className="text-sm font-medium">Auto-Pay On</span>
                          </>
                        ) : (
                          <>
                            <FaToggleOff className="text-xl" />
                            <span className="text-sm font-medium">Auto-Pay Off</span>
                          </>
                        )}
                      </button>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => setShowExtraPaymentCalc(mortgage)}
                          className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-200 transition-colors flex items-center space-x-2"
                        >
                          <FaCalculator />
                          <span className="text-sm">Extra Payment</span>
                        </button>
                        <button
                          onClick={() => handleExportPaymentHistory(mortgage)}
                          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                        >
                          <FaFileDownload />
                          <span className="text-sm">Export History</span>
                        </button>
                      </div>
                    </div>
                    {mortgage.autoPay && (
                      <p className="text-xs text-green-600 mt-2">
                        ✓ Payments will be automatically processed on the due date
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
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
