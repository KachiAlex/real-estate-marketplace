import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProperty } from '../contexts/PropertyContext';
import { useEscrow } from '../contexts/EscrowContext';
import { useAuth } from '../contexts/AuthContext';
import { useInvestment } from '../contexts/InvestmentContext';
import { FaShoppingCart, FaLock, FaCreditCard, FaCheck, FaArrowLeft, FaCheckCircle, FaUserCheck, FaHandshake, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { getApiUrl } from '../utils/apiConfig';

const ESCROW_PAYMENT_STORAGE_KEY = 'escrowPayments';

const readEscrowPaymentEntries = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(ESCROW_PAYMENT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.warn('EscrowPaymentFlow: unable to read escrow payments from storage', error);
    return [];
  }
};

const saveEscrowPaymentEntry = (entry) => {
  if (typeof window === 'undefined') return;
  try {
    const existing = readEscrowPaymentEntries();
    const updated = existing.filter(item => item.paymentId !== entry.paymentId && item.txRef !== entry.txRef);
    updated.push(entry);
    window.localStorage.setItem(ESCROW_PAYMENT_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.warn('EscrowPaymentFlow: unable to save escrow payment entry', error);
  }
};

const getStoredToken = () => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem('token');
  } catch {
    return null;
  }
};

const buildAuthHeaders = (user) => {
  const token = user?.token || getStoredToken();
  const fallbackEmail = user?.email;

  if (!token && !fallbackEmail) {
    return null;
  }

  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else if (fallbackEmail) {
    headers['X-Mock-User-Email'] = fallbackEmail;
  }

  return headers;
};

const updateEscrowPaymentEntry = (paymentId, updates) => {
  if (typeof window === 'undefined') return null;
  try {
    const entries = readEscrowPaymentEntries();
    const updatedEntries = entries.map((item) => (
      item.paymentId === paymentId ? { ...item, ...updates } : item
    ));
    window.localStorage.setItem(ESCROW_PAYMENT_STORAGE_KEY, JSON.stringify(updatedEntries));
    return updatedEntries.find((item) => item.paymentId === paymentId) || null;
  } catch (error) {
    console.warn('EscrowPaymentFlow: unable to update escrow payment entry', error);
    return null;
  }
};

const removeEscrowPaymentEntry = (paymentId) => {
  if (typeof window === 'undefined') return;
  try {
    const entries = readEscrowPaymentEntries();
    const filtered = entries.filter((item) => item.paymentId !== paymentId);
    window.localStorage.setItem(ESCROW_PAYMENT_STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.warn('EscrowPaymentFlow: unable to remove escrow payment entry', error);
  }
};

const markEscrowTransactionFunded = (escrowId, reference, method = 'flutterwave') => {
  if (!escrowId || typeof window === 'undefined') return;
  try {
    const existingTransactions = JSON.parse(localStorage.getItem('escrowTransactions') || '[]');
    const updatedTransactions = existingTransactions.map((transaction) => 
      transaction.id === escrowId
        ? {
            ...transaction,
            status: 'payment_received',
            payment: {
              ...(transaction.payment || {}),
              method,
              reference: reference || transaction.payment?.reference,
              paidAt: new Date().toISOString()
            },
            fundedAt: new Date().toISOString()
          }
        : transaction
    );
    localStorage.setItem('escrowTransactions', JSON.stringify(updatedTransactions));
  } catch (error) {
    console.warn('EscrowPaymentFlow: unable to mark escrow transaction funded', error);
  }
};

const formatCurrency = (value = 0) => {
  const amount = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0
  }).format(amount);
};

const buildPaymentDescription = (itemTitle, transactionType) => {
  if (transactionType === 'investment') {
    return `Escrow funding for investment opportunity: ${itemTitle}`;
  }
  return `Escrow payment for property purchase: ${itemTitle}`;
};

const EscrowPaymentFlow = ({
  property: providedProperty = null,
  investment: providedInvestment = null,
  transactionType: providedTransactionType = 'purchase',
  onClose
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, clearAuthRedirect } = useAuth();
  const { fetchProperty } = useProperty();
  const { createEscrowTransaction } = useEscrow();
  const { investments, getInvestmentById } = useInvestment();
  
  const propertyIdFromParams = searchParams.get('propertyId');
  const investmentIdFromParams = searchParams.get('investmentId');
  const [property, setProperty] = useState(providedProperty);
  const [investment, setInvestment] = useState(providedInvestment);
  const [loading, setLoading] = useState(!(providedProperty || providedInvestment));
  const [step, setStep] = useState(1); // 1: Review, 2: Payment Details, 3: Confirmation
  const [paymentData, setPaymentData] = useState({
    paymentMethod: 'card',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });
  const [pendingPayment, setPendingPayment] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('idle');
  const [paymentError, setPaymentError] = useState('');
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [isPaymentVerifying, setIsPaymentVerifying] = useState(false);
  const [activeEscrowId, setActiveEscrowId] = useState(null);
  const [isInitializingPayment, setIsInitializingPayment] = useState(false);

  const propertyId = providedProperty?.id || providedProperty?.propertyId || propertyIdFromParams;
  const investmentId = providedInvestment?.id || investmentIdFromParams;
  const typeFromParams = searchParams.get('type') || 'purchase';
  const transactionType = (providedProperty || providedInvestment)
    ? providedTransactionType
    : typeFromParams;
  const isModal = Boolean(onClose);

  const hydratePendingPayment = useCallback(() => {
    if (typeof window === 'undefined') return;
    const entries = readEscrowPaymentEntries();
    if (!entries || entries.length === 0) return;

    const match = entries.find((entry) => {
      if (activeEscrowId && entry.escrowId === activeEscrowId) return true;
      if (property?.id && entry.propertyId === property.id) return true;
      if (investment?.id && entry.investmentId === investment.id) return true;
      return false;
    });

    if (match) {
      setPendingPayment(match);
      setPaymentStatus(match.status || 'processing');
      setCheckoutUrl(match.checkoutUrl || '');
      if (match.escrowId) {
        setActiveEscrowId(match.escrowId);
      }
      setStep((prev) => (prev < 2 ? 2 : prev));
    }
  }, [property?.id, investment?.id, activeEscrowId]);

  useEffect(() => {
    if (providedProperty || providedInvestment) {
      // Already have the context we need
      setLoading(false);
      return;
    }

    const loadItem = async () => {
      if (!propertyId && !investmentId) {
        toast.error('No property or investment specified');
        navigate('/properties');
        return;
      }

      if (!user) {
        const currentUrl = propertyId 
          ? `/escrow/create?propertyId=${propertyId}&type=${transactionType}`
          : `/escrow/create?investmentId=${investmentId}&type=${transactionType}`;
        localStorage.setItem('authRedirectUrl', currentUrl);
        toast.error('Please login to continue');
        navigate('/login');
        return;
      }

      clearAuthRedirect();

      try {
        if (propertyId) {
          const propertyData = await fetchProperty(propertyId);
          if (propertyData) {
            setProperty(propertyData);
          } else {
            toast.error('Property not found');
            navigate('/properties');
          }
        } else if (investmentId) {
          let investmentData = getInvestmentById(investmentId);
          
          if (!investmentData) {
            try {
              const storedProject = localStorage.getItem('pendingInvestmentProject');
              if (storedProject) {
                const project = JSON.parse(storedProject);
                if (project.id.toString() === investmentId.toString()) {
                  investmentData = {
                    id: project.id,
                    investmentTitle: project.name,
                    title: project.name,
                    description: project.description,
                    location: project.location,
                    minInvestment: project.minInvestment,
                    expectedROI: project.expectedROI,
                    lockPeriod: project.lockPeriod,
                    image: project.image,
                    status: project.status || 'active',
                    type: project.type
                  };
                }
              }
            } catch (error) {
              console.error('Error parsing stored project:', error);
            }
          }
          
          if (investmentData) {
            setInvestment(investmentData);
          } else {
            toast.error('Investment not found');
            navigate('/investment');
          }
        }
      } catch (error) {
        console.error('Error loading item:', error);
        toast.error('Failed to load item details');
        navigate('/properties');
      } finally {
        setLoading(false);
      }
    };

    loadItem();

    return () => {
      if (!providedInvestment && investmentIdFromParams) {
        localStorage.removeItem('pendingInvestmentProject');
      }
    };
  }, [propertyId, investmentId, user, fetchProperty, getInvestmentById, navigate, transactionType, clearAuthRedirect, providedProperty, providedInvestment, investmentIdFromParams]);

  useEffect(() => {
    hydratePendingPayment();
  }, [hydratePendingPayment]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handleEscrowPaymentMessage = (event) => {
      const { type, payload } = event.data || {};
      if (type !== 'ESCROW_PAYMENT_STATUS' || !payload) return;
      if (payload.escrowId && activeEscrowId && payload.escrowId !== activeEscrowId) return;

      if (payload.status === 'success') {
        setPaymentStatus('completed');
        setPaymentError('');
        removeEscrowPaymentEntry(payload.paymentId);
        markEscrowTransactionFunded(payload.escrowId || activeEscrowId, payload.reference || payload.txRef, 'flutterwave');
        setActiveEscrowId(payload.escrowId || activeEscrowId);
        setPendingPayment(null);
        setCheckoutUrl('');
        toast.success('Payment verified! Funds are now held securely in escrow.');
      } else if (payload.status === 'error') {
        setPaymentStatus('failed');
        const errorMessage = payload.message || 'Payment verification failed. Please try again.';
        setPaymentError(errorMessage);
        toast.error(errorMessage);
      }
    };

    window.addEventListener('message', handleEscrowPaymentMessage);
    return () => window.removeEventListener('message', handleEscrowPaymentMessage);
  }, [activeEscrowId, toast]);

  useEffect(() => {
    if (paymentStatus === 'completed') {
      setStep(3);
    }
  }, [paymentStatus]);

  useEffect(() => {
    if (providedProperty) {
      setProperty(providedProperty);
    }
  }, [providedProperty]);

  useEffect(() => {
    if (providedInvestment) {
      setInvestment(providedInvestment);
    }
  }, [providedInvestment]);

  // Get the current item (property or investment)
  const item = property || investment;
  const itemPrice = property ? property.price : (investment?.minInvestment || investment?.minimumInvestment || 0);
  const escrowFee = Math.round((itemPrice || 0) * 0.005);
  const totalDue = (itemPrice || 0) + escrowFee;
  const itemTitle = property ? property.title : (investment?.investmentTitle || investment?.title || 'Investment Purchase');
  
  const calculateTotal = () => {
    if (!item) return 0;
    return totalDue;
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

  const handleBackButton = () => {
    if (step === 1) {
      if (isModal && onClose) {
        onClose();
      } else {
        navigate(-1);
      }
      return;
    }
    setStep((prev) => Math.max(1, prev - 1));
  };

  const openCheckoutWindow = (url) => {
    if (!url || typeof window === 'undefined') {
      toast.error('Checkout link unavailable. Please re-initialize payment.');
      return;
    }
    const popup = window.open(url, '_blank', 'noopener,noreferrer');
    if (!popup) {
      toast.error('Popup blocked. Please allow popups or use the launch button again.');
    }
  };

  const handleOpenCheckout = () => {
    openCheckoutWindow(checkoutUrl);
  };

  const handleVerifyPendingPayment = async () => {
    if (!pendingPayment?.id) {
      toast.error('No payment to verify. Please initialize checkout first.');
      return;
    }

    const headers = buildAuthHeaders(user);
    if (!headers) {
      toast.error('Please login again to verify payment.');
      return;
    }

    setIsPaymentVerifying(true);
    setPaymentError('');

    try {
      const response = await fetch(getApiUrl(`/payments/${pendingPayment.id}/verify`), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          providerReference: pendingPayment.txRef || pendingPayment.metadata?.flutterwave?.txRef || pendingPayment.reference,
          txRef: pendingPayment.txRef || pendingPayment.reference,
          status: paymentStatus
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Payment verification failed');
      }

      const providerStatus = (data.data?.status || '').toLowerCase();
      if (providerStatus === 'completed' || providerStatus === 'success' || providerStatus === 'successful') {
        setPaymentStatus('completed');
        markEscrowTransactionFunded(activeEscrowId, pendingPayment.reference || pendingPayment.txRef, 'flutterwave');
        removeEscrowPaymentEntry(pendingPayment.id);
        setPendingPayment(null);
        setCheckoutUrl('');
        toast.success('Payment verified successfully!');
      } else if (providerStatus === 'processing' || providerStatus === 'pending') {
        setPaymentStatus('processing');
        toast('Flutterwave is still processing this payment. Please try again shortly.');
      } else {
        setPaymentStatus('failed');
        throw new Error('Payment could not be verified. Please try another attempt.');
      }
    } catch (error) {
      console.error('EscrowPaymentFlow: manual verification error', error);
      setPaymentError(error.message || 'Unable to verify payment right now.');
      toast.error(error.message || 'Failed to verify payment');
    } finally {
      setIsPaymentVerifying(false);
    }
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
      setPaymentError('');

      // Step 1: Create escrow transaction using EscrowContext
      const currentItem = property || investment;
      const itemPriceValue = currentItem ? (property ? property.price : (investment?.minInvestment || investment?.minimumInvestment || 0)) : 0;
      const itemTitleValue = property ? property.title : (investment?.investmentTitle || investment?.title || 'Investment');
      const itemId = property ? property.id : investment?.id;

      if (!itemId || !itemPriceValue || itemPriceValue <= 0) {
        toast.error('Invalid item or price');
        setLoading(false);
        return;
      }

      const sellerId = property?.owner?.id || property?.ownerId || investment?.vendorId || investment?.sponsorId || null;
      
      // Create escrow transaction using the context function
      const escrowResult = await createEscrowTransaction(
        itemId,
        itemPriceValue,
        user.uid || user.id,
        sellerId,
        {
          type: transactionType === 'investment' ? 'investment' : 'property',
          investmentData: investment ? {
            ...investment,
            title: investment.title || investment.investmentTitle,
            investmentTitle: investment.investmentTitle || investment.title,
            expectedROI: investment.expectedROI || investment.expectedReturn || 0,
            expectedReturn: investment.expectedReturn || investment.expectedROI || 0,
            lockPeriod: investment.lockPeriod || investment.termMonths || investment.duration || 0,
            termMonths: investment.termMonths || investment.duration || investment.lockPeriod || 0,
            duration: investment.duration || investment.termMonths || investment.lockPeriod || 0,
            vendorId: investment.vendorId || investment.sponsorId,
            sponsorId: investment.sponsorId || investment.vendorId,
            sponsor: investment.sponsor || investment.vendor,
            vendor: investment.vendor || investment.sponsor,
            propertyLocation: investment.propertyLocation || (investment.location?.address ? `${investment.location.address}, ${investment.location.city}` : 'N/A')
          } : null
        }
      );

      if (!escrowResult.success) {
        toast.error(escrowResult.error || 'Failed to create escrow transaction');
        setLoading(false);
        return;
      }

      const escrowId = escrowResult.id || escrowResult.data?.id;
      if (!escrowId) {
        toast.error('Failed to get escrow transaction ID');
        setLoading(false);
        return;
      }

      const headers = buildAuthHeaders(user);
      if (!headers) {
        toast.error('Unable to determine authentication headers. Please login again.');
        setLoading(false);
        return;
      }

      setActiveEscrowId(escrowId);

      try {
        setIsInitializingPayment(true);

        const response = await fetch(getApiUrl('/payments/initialize'), {
          method: 'POST',
          headers,
          body: JSON.stringify({
            amount: itemPriceValue,
            paymentMethod: 'flutterwave',
            paymentType: 'escrow',
            relatedEntity: {
              type: transactionType === 'investment' ? 'investment' : 'property',
              id: escrowId,
              metadata: {
                escrowId,
                propertyId: property?.id || null,
                investmentId: investment?.id || null
              }
            },
            description: buildPaymentDescription(itemTitleValue, transactionType),
            currency: 'NGN'
          })
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Failed to initialize payment');
        }

        const providerData = data.data?.providerData || {};
        const paymentRecord = data.data?.payment || data.data;
        const authorizationUrl = providerData.authorizationUrl || providerData.link;
        const providerReference = providerData.txRef || providerData.tx_ref || paymentRecord?.reference;

        if (!authorizationUrl) {
          throw new Error('Payment authorization link missing from response');
        }

        const entryToSave = {
          escrowId,
          paymentId: paymentRecord?.id,
          reference: paymentRecord?.reference,
          txRef: providerReference,
          propertyId: property?.id,
          investmentId: investment?.id,
          status: 'processing',
          checkoutUrl: authorizationUrl,
          storedAt: Date.now()
        };

        saveEscrowPaymentEntry(entryToSave);
        setPendingPayment(entryToSave);
        setCheckoutUrl(authorizationUrl);
        setPaymentStatus('processing');
        setStep(2);

        openCheckoutWindow(authorizationUrl);
        toast.success('Flutterwave checkout launched. Complete payment to proceed.');

        if (investmentId) {
          localStorage.setItem('pendingInvestmentProject', JSON.stringify(investment));
        }
      } catch (initError) {
        console.error('EscrowPaymentFlow: payment initialization error', initError);
        setPaymentError(initError.message || 'Unable to initialize payment.');
        toast.error(initError.message || 'Failed to initialize payment');
      } finally {
        setIsInitializingPayment(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(`Payment failed: ${error.message || 'An error occurred'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  if (loading) {
    const spinner = (
      <div className="flex items-center justify-center w-full py-16">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );

    return isModal ? (
      <div className="bg-white rounded-2xl shadow-2xl p-6">{spinner}</div>
    ) : (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!property && !investment) {
    const emptyState = (
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {propertyId ? 'Property Not Found' : 'Investment Not Found'}
        </h2>
        <button
          onClick={() => {
            if (isModal && onClose) {
              onClose();
              return;
            }
            propertyId ? navigate('/properties') : navigate('/investment');
          }}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {propertyId ? 'Back to Properties' : 'Back to Investments'}
        </button>
      </div>
    );

    return isModal ? (
      <div className="bg-white rounded-2xl shadow-2xl p-6">{emptyState}</div>
    ) : (
      <div className="min-h-screen flex items-center justify-center">{emptyState}</div>
    );
  }

  const content = (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={handleBackButton}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
        >
          <FaArrowLeft className="mr-2" />
          {step === 1 ? (property ? 'Back to Property' : 'Back to Investment') : 'Previous Step'}
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {step === 1 ? (property ? 'Review Purchase' : 'Review Investment') : step === 2 ? 'Payment Details' : 'Payment Confirmation'}
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

      {/* Step 1: Review Purchase/Investment */}
      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Property/Investment Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {property ? 'Property Details' : 'Investment Details'}
            </h2>

            <div className="flex items-start space-x-4 mb-6">
              <img
                src={item?.image || item?.images?.[0]?.url || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=200&h=150&fit=crop'}
                alt={item?.title || item?.investmentTitle || item?.name}
                className="w-32 h-24 object-cover rounded-lg"
              />
              <div>
                <h3 className="font-semibold text-gray-900">
                  {item?.title || item?.investmentTitle || item?.name}
                </h3>
                <p className="text-gray-600">{item?.location || 'Location pending'}</p>
                <p className="text-sm text-gray-500 mt-1 line-clamp-3">{item?.description || 'Property description will be shared by the vendor.'}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Property Price</span>
                <span className="font-semibold text-gray-900">{formatCurrency(itemPrice)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Escrow Protection Fee (0.5%)</span>
                <span className="font-semibold text-gray-900">{formatCurrency(escrowFee)}</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900">Total Due Today</span>
                <span className="text-2xl font-bold text-blue-600">{formatCurrency(totalDue)}</span>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Escrow Protection Benefits</h2>
            <div className="space-y-4">
              {[{
                title: 'Secure Payment Holding',
                description: 'Your funds stay in escrow until every milestone you approve is met.'
              }, {
                title: 'Document Verification',
                description: 'The team verifies title, inspection reports, and contract documents.'
              }, {
                title: 'Dispute Resolution',
                description: 'Dedicated mediation support with guaranteed refund safeguards.'
              }].map((benefit) => (
                <div key={benefit.title} className="flex items-start space-x-3">
                  <FaLock className="text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{benefit.title}</h3>
                    <p className="text-gray-600 text-sm">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={handleProceedToPayment}
              className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <FaShoppingCart />
              <span>Continue to Payment</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Payment Details */}
      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Flutterwave Checkout</h2>
              <span className="text-sm text-gray-500">Secure • Encrypted • Instant</span>
            </div>

            <button
              type="button"
              onClick={handleProcessPayment}
              disabled={loading || isInitializingPayment}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 disabled:opacity-70"
            >
              {isInitializingPayment ? (
                <>
                  <FaCreditCard className="animate-spin" />
                  <span>Initializing Flutterwave...</span>
                </>
              ) : (
                <>
                  <FaCreditCard />
                  <span>Re-launch Flutterwave Checkout</span>
                </>
              )}
            </button>

            {checkoutUrl && (
              <button
                type="button"
                onClick={handleOpenCheckout}
                className="w-full border border-blue-600 text-blue-600 py-3 rounded-lg font-semibold"
              >
                Open Checkout Window
              </button>
            )}

            {pendingPayment && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="font-semibold text-blue-900">Payment in progress</p>
                <p className="text-sm text-blue-800 mt-1">
                  Reference: {pendingPayment.txRef || pendingPayment.reference}
                </p>
                <p className="text-xs text-blue-700 mt-2">Please complete the Flutterwave checkout or click verify once done.</p>

                <div className="mt-4 flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={handleVerifyPendingPayment}
                    disabled={isPaymentVerifying}
                    className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold flex items-center justify-center space-x-2 disabled:opacity-70"
                  >
                    {isPaymentVerifying ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <FaCheck />
                        <span>Verify Payment</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenCheckout}
                    className="w-full border border-blue-600 text-blue-600 py-2 rounded-lg font-semibold"
                  >
                    Resume Payment
                  </button>
                </div>
              </div>
            )}

            {paymentError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                {paymentError}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Payment Summary</h2>
            <div className="flex justify-between text-gray-600">
              <span>Escrow for</span>
              <span className="font-medium text-gray-900">{itemTitle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amount</span>
              <span className="font-semibold text-gray-900">{formatCurrency(itemPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Escrow Fee</span>
              <span className="font-semibold text-gray-900">{formatCurrency(escrowFee)}</span>
            </div>
            <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-blue-600">{formatCurrency(totalDue)}</span>
            </div>
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
              Your payment of <strong>{formatCurrency(totalDue)}</strong> is now held securely in escrow.
            </p>

            <div className="bg-green-50 p-4 rounded-lg mb-6 text-left">
              <h3 className="font-semibold text-green-900 mb-3 flex items-center">
                <FaLock className="mr-2" />
                Escrow Protection Active
              </h3>
              <div className="text-sm text-green-800 space-y-2">
                <div className="flex items-center">
                  <FaCheckCircle className="mr-2 text-green-600" />
                  <span><strong>Funds Secured:</strong> Held until you approve release.</span>
                </div>
                <div className="flex items-center">
                  <FaUserCheck className="mr-2 text-green-600" />
                  <span><strong>Your Control:</strong> Nothing moves without your authorization.</span>
                </div>
                <div className="flex items-center">
                  <FaHandshake className="mr-2 text-green-600" />
                  <span><strong>Dispute Resolution:</strong> Mediation + refund guarantees.</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg mb-6 text-left">
              <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Property documents verification begins immediately.</li>
                <li>Our escrow officer reaches out to schedule inspection.</li>
                <li>You approve the property condition and paperwork.</li>
                <li>Funds release only after your final approval.</li>
              </ol>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:space-x-4">
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
  );

  if (isModal) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl p-4 md:p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          aria-label="Close payment flow"
        >
          &times;
        </button>
        <div className="max-h-[80vh] overflow-y-auto pr-2">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {content}
    </div>
  );
};

export default EscrowPaymentFlow;


