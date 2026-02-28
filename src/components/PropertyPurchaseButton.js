import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaShoppingCart, FaShieldAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import EscrowPaymentFlow from './EscrowPaymentFlow';

const PropertyPurchaseButton = ({ property, className = '' }) => {
  const { user, setAuthRedirect } = useAuth();
  const navigate = useNavigate();
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
    const propertyId = property?.id || property?._id || property?.slug || null;
    const target = propertyId
      ? `/escrow/payment-flow?propertyId=${encodeURIComponent(propertyId)}&type=purchase`
      : '/escrow/payment-flow?type=purchase';

    if (!user) {
      console.log('PropertyPurchaseButton: no user, redirecting to auth before escrow flow');
      // Remember where to return after sign up/login
      try {
        setAuthRedirect(target);
      } catch (e) {
        // ignore
      }
      navigate('/auth/login');
      window.scrollTo(0, 0);
      return;
    }

    // If signed in, open the in-page Escrow payment modal (default to Paystack)
    console.log('PropertyPurchaseButton: user signed-in — opening escrow modal for propertyId=', propertyId);
    setShowPaymentFlow(true);
  };

  return (
    <>
      <button
        data-testid="buy-with-escrow-btn"
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
          defaultPaymentMethod="paystack"
          autoStartPayment={true}
          onClose={() => setShowPaymentFlow(false)}
          isModal={true}
        />
      )}
    </>
  );
};

export default PropertyPurchaseButton;
