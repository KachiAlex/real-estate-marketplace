import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaPhone, FaCopy, FaCheck } from 'react-icons/fa';

const PhoneDialerModal = ({ isOpen, onClose, phoneNumber, vendorName = 'Vendor' }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [copied, setCopied] = useState(false);

  // Detect if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isOpen) return null;

  // Validate phone number
  const hasValidPhone = phoneNumber && phoneNumber.trim().length > 0;

  const handleCall = () => {
    if (!hasValidPhone) {
      toast.error('Phone number not available');
      return;
    }

    try {
      const phoneNumber_formatted = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      const telLink = `tel:${phoneNumber_formatted}`;
      
      // Create an anchor element and click it
      const a = document.createElement('a');
      a.href = telLink;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast.success('Opening phone dialer...');
      onClose();
    } catch (err) {
      console.error('Error initiating call:', err);
      toast.error('Failed to open phone dialer');
    }
  };

  const handleCopyNumber = async () => {
    if (!hasValidPhone) {
      toast.error('Phone number not available');
      return;
    }

    try {
      await navigator.clipboard.writeText(phoneNumber);
      setCopied(true);
      toast.success('Phone number copied to clipboard!');
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
      toast.error('Failed to copy phone number');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-lg">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Call {vendorName}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        {!hasValidPhone ? (
          <div className="text-center py-8">
            <div className="mb-4">
              <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Phone Number Not Available</h4>
            <p className="text-gray-600 text-sm mb-6">
              The vendor's phone number is not available at this time. Please use the "Contact Vendor" option to send a message instead.
            </p>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Phone Number Display */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6 text-center">
              <p className="text-sm text-gray-600 mb-2">Vendor Phone Number</p>
              <p className="text-3xl font-bold text-gray-900 font-mono break-all">{phoneNumber}</p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {isMobile ? (
                <>
                  <button
                    onClick={handleCall}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
                  >
                    <FaPhone size={18} />
                    Call Now
                  </button>
                  <button
                    onClick={handleCopyNumber}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium"
                  >
                    {copied ? (
                      <>
                        <FaCheck size={16} className="text-green-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <FaCopy size={16} />
                        Copy Number
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleCopyNumber}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                  >
                    {copied ? (
                      <>
                        <FaCheck size={18} className="text-white" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <FaCopy size={18} />
                        Copy Number
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-500 text-center">
                    Copy the number and use your phone or VoIP service to call
                  </p>
                </>
              )}

              <button
                onClick={onClose}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PhoneDialerModal;
