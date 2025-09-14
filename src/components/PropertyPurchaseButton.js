import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FaShoppingCart, FaShieldAlt, FaCreditCard } from 'react-icons/fa';
import EscrowPaymentFlow from './EscrowPaymentFlow';

const PropertyPurchaseButton = ({ property, className = '' }) => {
  const { user } = useAuth();
  const [showPaymentFlow, setShowPaymentFlow] = useState(false);

  const handlePurchaseClick = () => {
    if (!user) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
      return;
    }
    setShowPaymentFlow(true);
  };

  return (
    <>
      <button
        onClick={handlePurchaseClick}
        className={`w-full bg-brand-blue hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2 ${className}`}
      >
        <FaShoppingCart className="h-5 w-5" />
        <span>Buy with Escrow Protection</span>
        <FaShieldAlt className="h-4 w-4" />
      </button>

      {showPaymentFlow && (
        <EscrowPaymentFlow
          property={property}
          onClose={() => setShowPaymentFlow(false)}
        />
      )}
    </>
  );
};

export default PropertyPurchaseButton;
