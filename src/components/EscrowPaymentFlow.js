import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProperty } from '../contexts/PropertyContext';
import { useEscrow } from '../contexts/EscrowContext';
import { useAuth } from '../contexts/AuthContext';
import { FaShoppingCart, FaLock, FaCreditCard, FaCheck, FaArrowLeft, FaCheckCircle, FaUserCheck, FaHandshake } from 'react-icons/fa';
import toast from 'react-hot-toast';

const EscrowPaymentFlow = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { fetchProperty } = useProperty();
  const { createEscrowTransaction } = useEscrow();
  
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1); // 1: Review, 2: Payment Details, 3: Confirmation
  const [paymentData, setPaymentData] = useState({
    paymentMethod: 'card',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });

  const propertyId = searchParams.get('propertyId');
  const transactionType = searchParams.get('type') || 'purchase';

  useEffect(() => {
    const loadProperty = async () => {
      if (!propertyId) {
        toast.error('No property specified');
        navigate('/properties');
        return;
      }

      if (!user) {
        toast.error('Please login to continue');
        navigate('/login');
        return;
      }

      try {
        const propertyData = await fetchProperty(propertyId);
        if (propertyData) {
          setProperty(propertyData);
        } else {
          toast.error('Property not found');
          navigate('/properties');
        }
      } catch (error) {
        console.error('Error loading property:', error);
        toast.error('Failed to load property details');
        navigate('/properties');
      } finally {
        setLoading(false);
      }
    };

    loadProperty();
  }, [propertyId, user, fetchProperty, navigate]);

  const calculateTotal = () => {
    if (!property) return 0;
    const escrowFee = Math.round(property.price * 0.005); // 0.5% escrow fee
    return property.price + escrowFee;
  };

  const handlePaymentDataChange = (field, value) => {
    setPaymentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProceedToPayment = () => {
    setStep(2);
  };

  const handleProcessPayment = async () => {
    try {
      // Validate payment data if card payment
      if (paymentData.paymentMethod === 'card') {
        if (!paymentData.cardNumber || !paymentData.expiryDate || !paymentData.cvv || !paymentData.cardholderName) {
          toast.error('Please fill in all payment details');
          return;
        }
      }

      setLoading(true);

      // Step 1: Create escrow transaction
      const escrowData = {
        propertyId: property.id,
        buyerId: user.id,
        buyerName: `${user.firstName} ${user.lastName}`,
        buyerEmail: user.email,
        sellerId: property.owner?.id || 'seller-1',
        sellerName: property.owner ? `${property.owner.firstName} ${property.owner.lastName}` : 'Property Owner',
        sellerEmail: property.owner?.email || 'owner@example.com',
        amount: property.price,
        type: transactionType,
        paymentMethod: paymentData.paymentMethod
      };

      // Create escrow transaction via API
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const escrowResponse = await fetch(`${API_URL}/escrow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(escrowData)
      });

      const escrowResult = await escrowResponse.json();

      if (!escrowResult.success) {
        throw new Error(escrowResult.message || 'Failed to create escrow transaction');
      }

      // Step 2: Initialize Flutterwave payment
      const paymentResponse = await fetch(`${API_URL}/escrow/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          escrowId: escrowResult.data.id,
          paymentMethod: paymentData.paymentMethod
        })
      });

      const paymentResult = await paymentResponse.json();

      if (paymentResult.success) {
        // For demo purposes, simulate successful payment
        // In production, redirect to Flutterwave: window.location.href = paymentResult.data.payment_url;
        
        // Simulate payment verification
        const verifyResponse = await fetch(`${API_URL}/escrow/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transaction_id: 'demo_' + Date.now(),
            tx_ref: paymentResult.data.reference,
            status: 'successful'
          })
        });

        const verifyResult = await verifyResponse.json();

        if (verifyResult.success) {
          setStep(3);
          toast.success('Payment successful! Funds are now held securely in escrow.');
        } else {
          throw new Error('Payment verification failed');
        }
      } else {
        throw new Error(paymentResult.message || 'Payment initialization failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(`Payment failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Property Not Found</h2>
          <button
            onClick={() => navigate('/properties')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Properties
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => step === 1 ? navigate(-1) : setStep(step - 1)}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <FaArrowLeft className="mr-2" />
            {step === 1 ? 'Back to Property' : 'Previous Step'}
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {step === 1 ? 'Review Purchase' : step === 2 ? 'Payment Details' : 'Payment Confirmation'}
          </h1>
          
          {/* Progress Steps */}
          <div className="flex items-center space-x-4 mt-4">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNum ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {step > stepNum ? <FaCheck /> : stepNum}
                </div>
                {stepNum < 3 && (
                  <div className={`w-16 h-1 mx-2 ${step > stepNum ? 'bg-blue-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Review Purchase */}
        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Property Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Property Details</h2>
              
              <div className="flex items-start space-x-4 mb-6">
                <img
                  src={property.image || property.images?.[0]?.url || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=200&h=150&fit=crop'}
                  alt={property.title}
                  className="w-32 h-24 object-cover rounded-lg"
                />
                <div>
                  <h3 className="font-semibold text-gray-900">{property.title}</h3>
                  <p className="text-gray-600">{property.location}</p>
                  <p className="text-sm text-gray-500 mt-1">{property.description}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{property.bedrooms || property.details?.bedrooms || 0}</div>
                  <div className="text-sm text-gray-500">Bedrooms</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{property.bathrooms || property.details?.bathrooms || 0}</div>
                  <div className="text-sm text-gray-500">Bathrooms</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{property.area || property.details?.sqft || 0}</div>
                  <div className="text-sm text-gray-500">Sq Ft</div>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Summary</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Property Price:</span>
                  <span className="font-semibold">₦{property.price?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Escrow Fee (0.5%):</span>
                  <span className="font-semibold">₦{Math.round((property.price || 0) * 0.005).toLocaleString()}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-gray-900">Total Amount:</span>
                    <span className="text-lg font-bold text-green-600">₦{calculateTotal().toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                  <FaLock className="mr-2" />
                  Escrow Protection Process
                </h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>✅ Your payment is held securely in escrow (not sent to vendor)</p>
                  <p>✅ Funds are only released after your approval</p>
                  <p>✅ You can dispute if there are any issues</p>
                  <p>✅ Full refund protection until you confirm satisfaction</p>
                </div>
              </div>
              
              <button
                onClick={handleProceedToPayment}
                className="w-full mt-6 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
              >
                <FaShoppingCart className="mr-2" />
                Proceed to Payment
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Payment Details */}
        {step === 2 && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={paymentData.paymentMethod}
                    onChange={(e) => handlePaymentDataChange('paymentMethod', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="card">Credit/Debit Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="ussd">USSD</option>
                  </select>
                </div>

                {paymentData.paymentMethod === 'card' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name</label>
                      <input
                        type="text"
                        value={paymentData.cardholderName}
                        onChange={(e) => handlePaymentDataChange('cardholderName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="John Doe"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                      <input
                        type="text"
                        value={paymentData.cardNumber}
                        onChange={(e) => handlePaymentDataChange('cardNumber', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                        <input
                          type="text"
                          value={paymentData.expiryDate}
                          onChange={(e) => handlePaymentDataChange('expiryDate', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="MM/YY"
                          maxLength={5}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                        <input
                          type="text"
                          value={paymentData.cvv}
                          onChange={(e) => handlePaymentDataChange('cvv', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="123"
                          maxLength={4}
                        />
                      </div>
                    </div>
                  </>
                )}

                {paymentData.paymentMethod === 'bank_transfer' && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Bank Transfer Details</h4>
                    <div className="text-sm text-blue-800">
                      <p><strong>Bank:</strong> GTBank</p>
                      <p><strong>Account Number:</strong> 0123456789</p>
                      <p><strong>Account Name:</strong> Naija Luxury Homes Escrow</p>
                      <p><strong>Amount:</strong> ₦{calculateTotal().toLocaleString()}</p>
                    </div>
                  </div>
                )}

                {paymentData.paymentMethod === 'ussd' && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">USSD Payment</h4>
                    <div className="text-sm text-green-800">
                      <p>Dial <strong>*737*1*{calculateTotal()}#</strong> to complete payment</p>
                      <p>You will receive a confirmation SMS after payment</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Summary */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Total to Pay:</span>
                  <span className="text-xl font-bold text-green-600">₦{calculateTotal().toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={handleProcessPayment}
                disabled={loading}
                className="w-full mt-6 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center disabled:opacity-50"
              >
                <FaCreditCard className="mr-2" />
                {loading ? 'Processing...' : `Pay ₦${calculateTotal().toLocaleString()}`}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCheck className="text-green-600 text-2xl" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
              <p className="text-gray-600 mb-6">
                Your payment of <strong>₦{calculateTotal().toLocaleString()}</strong> is now held securely in escrow.
              </p>
              
              <div className="bg-green-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-green-900 mb-3 flex items-center">
                  <FaLock className="mr-2" />
                  Escrow Protection Active
                </h3>
                <div className="text-sm text-green-800 space-y-2">
                  <div className="flex items-center">
                    <FaCheckCircle className="mr-2 text-green-600" />
                    <span><strong>Funds Secured:</strong> Your money is held in escrow (NOT sent to vendor)</span>
                  </div>
                  <div className="flex items-center">
                    <FaUserCheck className="mr-2 text-green-600" />
                    <span><strong>Your Control:</strong> Funds only released after your approval</span>
                  </div>
                  <div className="flex items-center">
                    <FaHandshake className="mr-2 text-green-600" />
                    <span><strong>Dispute Protection:</strong> Full refund if property doesn't meet expectations</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
                <ol className="text-sm text-blue-800 text-left space-y-1">
                  <li>1. Property documents will be verified by our team</li>
                  <li>2. You'll be contacted to schedule property inspection</li>
                  <li>3. <strong>You inspect and approve</strong> the property condition</li>
                  <li>4. <strong>Only after your approval</strong> - funds released to vendor</li>
                  <li>5. You receive all property ownership documents</li>
                </ol>
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={() => navigate('/escrow')}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Escrow Status
                </button>
                <button
                  onClick={handleBackToDashboard}
                  className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EscrowPaymentFlow;