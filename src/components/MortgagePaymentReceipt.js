import React from 'react';
import { FaFileDownload, FaPrint, FaCheckCircle, FaCalendar, FaMoneyBillWave } from 'react-icons/fa';

const MortgagePaymentReceipt = ({ payment, mortgage, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create a text file with receipt details
    const receiptText = `
MORTGAGE PAYMENT RECEIPT
========================

Payment ID: ${payment.id}
Transaction Date: ${new Date(payment.paidDate).toLocaleString()}
Property: ${mortgage.propertyTitle}
Location: ${mortgage.propertyLocation}

PAYMENT DETAILS
---------------
Amount Paid: ₦${payment.amount.toLocaleString()}
Payment Method: ${payment.paymentMethod || 'Unknown'}
Status: ${payment.status}

MORTGAGE INFORMATION
--------------------
Loan Amount: ₦${mortgage.loanAmount.toLocaleString()}
Interest Rate: ${mortgage.interestRate}%
Loan Term: ${mortgage.loanTerm} years
Monthly Payment: ₦${mortgage.monthlyPayment.toLocaleString()}

PAYMENT HISTORY
---------------
Payments Made: ${mortgage.paymentsMade}/${mortgage.totalPayments}
Payments Remaining: ${mortgage.paymentsRemaining}

Next Payment Date: ${new Date(mortgage.nextPaymentDate).toLocaleDateString()}

Thank you for your payment!

Generated: ${new Date().toLocaleString()}
`;

    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mortgage-receipt-${payment.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 print:p-4 print:shadow-none">
        {/* Header */}
        <div className="border-b border-gray-200 pb-4 mb-6 print:pb-2 print:mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-gray-900">Payment Receipt</h2>
            <div className="flex space-x-2 print:hidden">
              <button
                onClick={handlePrint}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Print Receipt"
              >
                <FaPrint />
              </button>
              <button
                onClick={handleDownload}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Download Receipt"
              >
                <FaFileDownload />
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          </div>
          <p className="text-gray-600 text-sm">
            Payment ID: <span className="font-medium">{payment.id}</span>
          </p>
        </div>

        {/* Status Badge */}
        <div className="mb-6 print:mb-4">
          <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full">
            <FaCheckCircle className="mr-2" />
            <span className="font-semibold">Payment Successful</span>
          </div>
        </div>

        {/* Payment Details */}
        <div className="grid grid-cols-2 gap-6 mb-6 print:mb-4">
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Property Information</h3>
            <p className="font-semibold text-gray-900">{mortgage.propertyTitle}</p>
            <p className="text-sm text-gray-600">{mortgage.propertyLocation}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Payment Date</h3>
            <p className="font-semibold text-gray-900">{new Date(payment.paidDate).toLocaleDateString()}</p>
            <p className="text-sm text-gray-600">{new Date(payment.paidDate).toLocaleTimeString()}</p>
          </div>
        </div>

        {/* Amount */}
        <div className="bg-blue-50 rounded-lg p-6 mb-6 print:mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700 mb-1">Amount Paid</p>
              <p className="text-4xl font-bold text-blue-900">₦{payment.amount.toLocaleString()}</p>
            </div>
            <FaMoneyBillWave className="text-4xl text-blue-600" />
          </div>
        </div>

        {/* Transaction Details */}
        <div className="space-y-4 mb-6 print:mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Transaction Details</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Payment Method</p>
              <p className="font-semibold text-gray-900 capitalize">{payment.paymentMethod}</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Due Date</p>
              <p className="font-semibold text-gray-900">{new Date(payment.dueDate).toLocaleDateString()}</p>
            </div>
          </div>

          {payment.type && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Payment Type</p>
              <p className="font-semibold text-gray-900 capitalize">{payment.type.replace('-', ' ')}</p>
            </div>
          )}
        </div>

        {/* Mortgage Progress */}
        <div className="border-t border-gray-200 pt-4 mb-6 print:mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Mortgage Progress</h3>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{mortgage.paymentsMade}</p>
              <p className="text-sm text-gray-600">Payments Made</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{mortgage.paymentsRemaining}</p>
              <p className="text-sm text-gray-600">Remaining</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{mortgage.totalPayments}</p>
              <p className="text-sm text-gray-600">Total Payments</p>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all"
              style={{ width: `${(mortgage.paymentsMade / mortgage.totalPayments) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Next Payment */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 print:mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Next Payment Date</p>
              <p className="font-semibold text-gray-900">
                <FaCalendar className="inline mr-2" />
                {new Date(mortgage.nextPaymentDate).toLocaleDateString()}
              </p>
            </div>
            <p className="text-sm text-gray-600">
              Amount: <span className="font-semibold text-gray-900">₦{mortgage.monthlyPayment.toLocaleString()}</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-4">
          <p className="text-xs text-gray-500 text-center">
            This is an electronic receipt for your records. Keep this receipt for your records.
          </p>
          <p className="text-xs text-gray-500 text-center mt-1">
            Generated: {new Date().toLocaleString()}
          </p>
        </div>

        {/* Close Button */}
        <div className="mt-6 flex justify-end print:hidden">
          <button
            onClick={onClose}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MortgagePaymentReceipt;
