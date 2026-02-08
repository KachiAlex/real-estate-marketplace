import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FaShoppingCart, FaShieldAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import EscrowPaymentFlow from './EscrowPaymentFlow';

const PropertyPurchaseButton = ({ property, className = '' }) => {
  const { user } = useAuth();
  const [showPaymentFlow, setShowPaymentFlow] = useState(false);

  useEffect(() => {
    if (showPaymentFlow) {
      const { style } = document.body;
      const previousOverflow = style.overflow;
      style.overflow = 'hidden';
      return () => {
        style.overflow = previousOverflow;
      };
    }
    return undefined;
  }, [showPaymentFlow]);

  const handlePurchaseClick = () => {
    if (!user) {
      toast.error('Login is temporarily unavailable while we rebuild the auth experience.');
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
          isModal={true}
        />
      )}
    </>
  );
};

export default PropertyPurchaseButton;
