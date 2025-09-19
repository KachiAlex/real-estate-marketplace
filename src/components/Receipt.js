import React from 'react';
import { FaCheckCircle, FaShieldAlt, FaCalendar, FaUser, FaHome, FaCreditCard, FaReceipt, FaClock, FaArrowRight, FaDownload } from 'react-icons/fa';

const Receipt = ({ transaction, onClose }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString()}`;
  };

  const generateReceiptNumber = (transactionId) => {
    return `RCP-${transactionId}-${Date.now().toString().slice(-6)}`;
  };

  const downloadReceipt = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${transaction.id}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Arial', sans-serif;
              line-height: 1.6;
              color: #333;
              background: white;
              padding: 20px;
            }
            .receipt-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              border: 2px solid #e5e7eb;
              border-radius: 12px;
              overflow: hidden;
            }
            .receipt-header {
              background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .company-logo {
              font-size: 2rem;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .receipt-title {
              font-size: 1.5rem;
              margin-bottom: 10px;
            }
            .receipt-number {
              font-size: 1rem;
              opacity: 0.9;
            }
            .receipt-body {
              padding: 40px;
            }
            .status-badge {
              display: inline-block;
              padding: 8px 16px;
              border-radius: 20px;
              font-weight: bold;
              text-transform: uppercase;
              font-size: 0.875rem;
              margin-bottom: 30px;
            }
            .status-completed {
              background: #dcfce7;
              color: #166534;
            }
            .status-pending {
              background: #fef3c7;
              color: #92400e;
            }
            .status-in-progress {
              background: #dbeafe;
              color: #1e40af;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              margin-bottom: 40px;
            }
            .info-section h3 {
              font-size: 1.125rem;
              font-weight: bold;
              margin-bottom: 15px;
              color: #374151;
              border-bottom: 2px solid #f3f4f6;
              padding-bottom: 8px;
            }
            .info-item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 12px;
              padding: 8px 0;
            }
            .info-label {
              color: #6b7280;
              font-weight: 500;
            }
            .info-value {
              font-weight: bold;
              color: #111827;
            }
            .amount-summary {
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 25px;
              margin: 30px 0;
            }
            .amount-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 12px;
              padding: 8px 0;
            }
            .amount-row.total {
              border-top: 2px solid #d1d5db;
              padding-top: 15px;
              margin-top: 15px;
              font-weight: bold;
              font-size: 1.25rem;
              color: #f97316;
            }
            .escrow-notice {
              background: #eff6ff;
              border: 1px solid #bfdbfe;
              border-radius: 8px;
              padding: 20px;
              margin: 25px 0;
              text-align: center;
            }
            .escrow-notice h4 {
              color: #1e40af;
              margin-bottom: 10px;
              font-weight: bold;
            }
            .receipt-footer {
              background: #f9fafb;
              border-top: 1px solid #e5e7eb;
              padding: 25px;
              text-align: center;
              color: #6b7280;
              font-size: 0.875rem;
            }
            .footer-links {
              margin-top: 15px;
            }
            .footer-links a {
              color: #f97316;
              text-decoration: none;
              margin: 0 15px;
            }
            @media print {
              body { padding: 0; }
              .receipt-container { border: none; box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="receipt-header">
              <div class="company-logo">🏠 Naija Luxury Homes</div>
              <div class="receipt-title">Payment Receipt</div>
              <div class="receipt-number">Receipt #${generateReceiptNumber(transaction.id)}</div>
            </div>
            
            <div class="receipt-body">
              <div class="status-badge status-${transaction.status}">
                ${transaction.status === 'completed' ? '✅ Completed' : 
                  transaction.status === 'pending' ? '⏳ Pending' : 
                  transaction.status === 'in-progress' ? '🔄 In Progress' : transaction.status}
              </div>
              
              <div class="info-grid">
                <div class="info-section">
                  <h3>Transaction Details</h3>
                  <div class="info-item">
                    <span class="info-label">Transaction ID:</span>
                    <span class="info-value">${transaction.id}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Date & Time:</span>
                    <span class="info-value">${formatDate(transaction.date || transaction.createdAt)}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Payment Method:</span>
                    <span class="info-value">${transaction.paymentMethod || 'Escrow'}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Transaction Type:</span>
                    <span class="info-value">${transaction.type || 'Property Purchase'}</span>
                  </div>
                </div>
                
                <div class="info-section">
                  <h3>Property Information</h3>
                  <div class="info-item">
                    <span class="info-label">Property:</span>
                    <span class="info-value">${transaction.propertyTitle || transaction.description}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Buyer:</span>
                    <span class="info-value">${transaction.buyer || 'John Doe'}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Seller:</span>
                    <span class="info-value">${transaction.seller || 'Property Owner'}</span>
                  </div>
                  ${transaction.escrowId ? `
                  <div class="info-item">
                    <span class="info-label">Escrow ID:</span>
                    <span class="info-value">${transaction.escrowId}</span>
                  </div>
                  ` : ''}
                </div>
              </div>
              
              <div class="amount-summary">
                <div class="amount-row">
                  <span>Property Amount:</span>
                  <span>${formatCurrency(transaction.amount)}</span>
                </div>
                <div class="amount-row">
                  <span>Escrow Fee (0.5%):</span>
                  <span>${formatCurrency(transaction.fees || Math.round(transaction.amount * 0.005))}</span>
                </div>
                <div class="amount-row">
                  <span>Processing Fee:</span>
                  <span>₦2,500</span>
                </div>
                <div class="amount-row total">
                  <span>Total Amount:</span>
                  <span>${formatCurrency((transaction.totalAmount || transaction.amount) + (transaction.fees || Math.round(transaction.amount * 0.005)) + 2500)}</span>
                </div>
              </div>
              
              <div class="escrow-notice">
                <h4>🔒 Escrow Protection</h4>
                <p>Your payment is secured through our escrow service. Funds are held safely until all conditions are met and you approve the release to the vendor.</p>
              </div>
            </div>
            
            <div class="receipt-footer">
              <p><strong>Naija Luxury Homes</strong> - Your Trusted Real Estate Partner</p>
              <p>123 Victoria Island, Lagos, Nigeria | +234 800 123 4567</p>
              <p>Email: support@naijaluxuryhomes.com | Website: www.naijaluxuryhomes.com</p>
              <div class="footer-links">
                <a href="#">Terms of Service</a>
                <a href="#">Privacy Policy</a>
                <a href="#">Support</a>
              </div>
              <p style="margin-top: 15px; font-size: 0.75rem;">
                This is a computer-generated receipt. No signature required.
                <br>Generated on ${new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  };

  if (!transaction) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Receipt Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <FaHome className="text-3xl mr-3" />
            <h1 className="text-3xl font-bold">Naija Luxury Homes</h1>
          </div>
          <div className="flex items-center justify-center mb-2">
            <FaReceipt className="mr-2" />
            <h2 className="text-xl font-semibold">Payment Receipt</h2>
          </div>
          <p className="text-orange-100">Receipt #{generateReceiptNumber(transaction.id)}</p>
        </div>

        {/* Receipt Body */}
        <div className="p-8">
          {/* Status Badge */}
          <div className="flex items-center justify-center mb-8">
            <span className={`inline-flex items-center px-4 py-2 rounded-full font-semibold ${
              transaction.status === 'completed' 
                ? 'bg-green-100 text-green-800' 
                : transaction.status === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-blue-100 text-blue-800'
            }`}>
              {transaction.status === 'completed' && <FaCheckCircle className="mr-2" />}
              {transaction.status === 'pending' && <FaClock className="mr-2" />}
              {transaction.status === 'in-progress' && <FaArrowRight className="mr-2" />}
              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
            </span>
          </div>

          {/* Transaction Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Left Column */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-gray-900 border-b-2 border-gray-200 pb-2">
                Transaction Details
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID:</span>
                  <span className="font-semibold">{transaction.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date & Time:</span>
                  <span className="font-semibold">{formatDate(transaction.date || transaction.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-semibold flex items-center">
                    <FaCreditCard className="mr-1" />
                    {transaction.paymentMethod || 'Escrow'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction Type:</span>
                  <span className="font-semibold">{transaction.type || 'Property Purchase'}</span>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-gray-900 border-b-2 border-gray-200 pb-2">
                Property Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Property:</span>
                  <span className="font-semibold text-right max-w-xs">
                    {transaction.propertyTitle || transaction.description}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Buyer:</span>
                  <span className="font-semibold flex items-center">
                    <FaUser className="mr-1" />
                    {transaction.buyer || 'John Doe'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Seller:</span>
                  <span className="font-semibold">{transaction.seller || 'Property Owner'}</span>
                </div>
                {transaction.escrowId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Escrow ID:</span>
                    <span className="font-semibold">{transaction.escrowId}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Amount Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-bold mb-4 text-gray-900">Payment Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Property Amount:</span>
                <span className="font-semibold">{formatCurrency(transaction.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Escrow Fee (0.5%):</span>
                <span className="font-semibold">
                  {formatCurrency(transaction.fees || Math.round(transaction.amount * 0.005))}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Processing Fee:</span>
                <span className="font-semibold">₦2,500</span>
              </div>
              <div className="border-t-2 border-gray-300 pt-3 mt-3">
                <div className="flex justify-between text-xl font-bold text-orange-600">
                  <span>Total Amount:</span>
                  <span>
                    {formatCurrency(
                      (transaction.totalAmount || transaction.amount) + 
                      (transaction.fees || Math.round(transaction.amount * 0.005)) + 
                      2500
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Escrow Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-center mb-3">
              <FaShieldAlt className="text-blue-600 mr-2" />
              <h4 className="text-lg font-bold text-blue-900">Escrow Protection</h4>
            </div>
            <p className="text-blue-800 text-center">
              Your payment is secured through our escrow service. Funds are held safely until all 
              conditions are met and you approve the release to the vendor.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={downloadReceipt}
              className="flex items-center justify-center px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <FaDownload className="mr-2" />
              Download Receipt
            </button>
            <button
              onClick={onClose}
              className="flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 border-t px-8 py-6 text-center text-sm text-gray-600">
          <p className="font-semibold mb-2">Naija Luxury Homes - Your Trusted Real Estate Partner</p>
          <p>123 Victoria Island, Lagos, Nigeria | +234 800 123 4567</p>
          <p>Email: support@naijaluxuryhomes.com | Website: www.naijaluxuryhomes.com</p>
          <p className="mt-3 text-xs">
            This is a computer-generated receipt. No signature required.
            <br />
            Generated on {new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Receipt;
