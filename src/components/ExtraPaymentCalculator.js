import React, { useState } from 'react';
import { FaCalculator, FaDollarSign, FaChartLine, FaLightbulb } from 'react-icons/fa';

const ExtraPaymentCalculator = ({ mortgage, onClose }) => {
  const [extraPaymentAmount, setExtraPaymentAmount] = useState('');
  const [results, setResults] = useState(null);

  const calculateSavings = () => {
    if (!extraPaymentAmount || parseFloat(extraPaymentAmount) <= 0) {
      setResults(null);
      return;
    }

    const extra = parseFloat(extraPaymentAmount);
    const monthlyRate = mortgage.interestRate / 100 / 12;
    const remainingPayments = mortgage.paymentsRemaining;
    const currentMonthlyPayment = mortgage.monthlyPayment;

    // Calculate remaining balance
    let remainingBalance = 0;
    if (mortgage.paymentSchedule && mortgage.paymentSchedule.length > 0) {
      const unpaidPayments = mortgage.paymentSchedule.filter(p => p.status === 'pending');
      if (unpaidPayments.length > 0) {
        remainingBalance = unpaidPayments[unpaidPayments.length - 1].remainingBalance;
      }
    } else {
      remainingBalance = remainingPayments * currentMonthlyPayment;
    }

    // Apply extra payment to principal
    const newBalance = remainingBalance - extra;
    
    if (newBalance <= 0) {
      // Loan will be paid off
      setResults({
        payoffTimeMonths: 0,
        payoffTimeYears: 0,
        interestSaved: 0,
        newMonthlyPayment: 0,
        newRemainingPayments: 0
      });
      return;
    }

    // Calculate new number of payments
    let newPayments = 0;
    if (monthlyRate > 0) {
      newPayments = Math.ceil(
        -Math.log(1 - (newBalance * monthlyRate) / currentMonthlyPayment) / Math.log(1 + monthlyRate)
      );
    } else {
      newPayments = Math.ceil(newBalance / currentMonthlyPayment);
    }

    // Calculate interest saved
    const originalTotalPayments = remainingPayments;
    const originalTotalInterest = originalTotalPayments * currentMonthlyPayment - remainingBalance;
    const newTotalInterest = newPayments * currentMonthlyPayment - newBalance;
    const interestSaved = originalTotalInterest - newTotalInterest;

    setResults({
      payoffTimeMonths: Math.max(0, remainingPayments - newPayments),
      payoffTimeYears: ((remainingPayments - newPayments) / 12).toFixed(1),
      interestSaved: Math.max(0, interestSaved),
      newMonthlyPayment: currentMonthlyPayment,
      newRemainingPayments: Math.max(0, newPayments)
    });
  };

  const handleChange = (value) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    setExtraPaymentAmount(numericValue);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <FaCalculator className="mr-2 text-blue-600" />
            Extra Payment Calculator
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Calculate how much you can save by making extra payments toward your principal.
          </p>

          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Current Mortgage Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Remaining Balance:</span>
                <p className="font-semibold text-gray-900">
                  ₦{(mortgage.paymentsRemaining * mortgage.monthlyPayment).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Monthly Payment:</span>
                <p className="font-semibold text-gray-900">
                  ₦{mortgage.monthlyPayment.toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Remaining Payments:</span>
                <p className="font-semibold text-gray-900">{mortgage.paymentsRemaining} months</p>
              </div>
              <div>
                <span className="text-gray-600">Interest Rate:</span>
                <p className="font-semibold text-gray-900">{mortgage.interestRate}%</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Extra Payment Amount (₦)
            </label>
            <div className="relative">
              <input
                type="text"
                value={extraPaymentAmount}
                onChange={(e) => {
                  handleChange(e.target.value);
                  setTimeout(calculateSavings, 100);
                }}
                placeholder="Enter amount"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 pl-10 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <FaDollarSign className="absolute left-3 top-4 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Enter a one-time extra payment amount
            </p>
          </div>
        </div>

        {results && (
          <div className="space-y-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-start">
                <FaLightbulb className="text-green-600 mr-2 mt-1" />
                <div>
                  <h3 className="font-semibold text-green-900 mb-2">Your Savings</h3>
                  <p className="text-sm text-green-700">
                    By paying an extra ₦{parseFloat(extraPaymentAmount).toLocaleString()} today, you can:
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <FaChartLine className="text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-gray-600">Time Saved</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {results.payoffTimeMonths} months
                </p>
                <p className="text-sm text-gray-500">
                  ({results.payoffTimeYears} years faster)
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <FaDollarSign className="text-green-600 mr-2" />
                  <span className="text-sm font-medium text-gray-600">Interest Saved</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  ₦{results.interestSaved.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
                <p className="text-sm text-gray-500">Total interest reduction</p>
              </div>
            </div>

            {results.payoffTimeMonths > 0 && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">New Payoff Timeline</h4>
                <div className="text-sm text-blue-700">
                  <p>New remaining payments: <span className="font-semibold">{results.newRemainingPayments} months</span></p>
                  <p className="mt-1">
                    You'll pay off your mortgage {results.payoffTimeMonths} months earlier!
                  </p>
                </div>
              </div>
            )}

            {results.payoffTimeMonths === 0 && (
              <div className="bg-yellow-50 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-2">Mortgage Paid Off!</h4>
                <p className="text-sm text-yellow-700">
                  This extra payment would pay off your entire mortgage balance.
                  You would save ₦{results.interestSaved.toLocaleString()} in interest!
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Close
          </button>
          {results && (
            <button
              onClick={() => {
                // Here you could add functionality to make the extra payment
                console.log('Making extra payment:', extraPaymentAmount);
                onClose();
              }}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Apply Extra Payment
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExtraPaymentCalculator;
