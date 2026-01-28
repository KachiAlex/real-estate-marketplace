import React, { createContext, useContext, useMemo } from 'react';
import toast from 'react-hot-toast';

const MortgageContext = createContext();

export const useMortgage = () => {
  const context = useContext(MortgageContext);
  if (!context) {
    throw new Error('useMortgage must be used within a MortgageProvider');
  }
  return context;
};

export const MortgageProvider = ({ children }) => {
  const disabledValue = useMemo(() => {
    const notifyDisabled = () => toast('Mortgage flow is currently disabled.', { icon: 'ℹ️' });

    const disabledSummary = {
      totalMortgages: 0,
      activeMortgages: 0,
      totalMonthlyPayments: 0,
      totalPaid: 0
    };

    const noOpAsync = async () => undefined;

    return {
      mortgages: [],
      applications: [],
      loading: false,
      applicationsLoading: false,
      error: null,
      getMortgageById: () => null,
      getUserMortgages: () => [],
      getUpcomingPayments: () => [],
      makePayment: async () => {
        notifyDisabled();
        return { success: false, disabled: true };
      },
      getPaymentSummary: () => disabledSummary,
      enableAutoPay: async () => {
        notifyDisabled();
        return { success: false, disabled: true };
      },
      disableAutoPay: async () => {
        notifyDisabled();
        return { success: false, disabled: true };
      },
      refreshMortgages: noOpAsync,
      getUserApplications: () => [],
      getApplicationById: () => null,
      getApplicationsByStatus: () => [],
      refreshApplications: noOpAsync
    };
  }, []);

  return (
    <MortgageContext.Provider value={disabledValue}>
      {children}
    </MortgageContext.Provider>
  );
};

export default MortgageContext;

  const mockMortgageData = [
    buildMockMortgage({
      id: 'mock-mg-001',
      propertyTitle: 'Palmview Estates, Lekki',
      propertyLocation: 'Lekki Phase 1, Lagos',
      loanAmount: 65000000,
      monthlyPayment: 410000,
      paymentsMade: 32,
      paymentsRemaining: 168
    }),
    buildMockMortgage({
      id: 'mock-mg-002',
      propertyTitle: 'Emerald Heights Duplex',
      propertyLocation: 'Gwarinpa, Abuja',
      loanAmount: 52000000,
      monthlyPayment: 360000,
      paymentsMade: 14,
      paymentsRemaining: 226
    })
  ];

  const mockApplicationsData = [
    {
      id: 'mock-app-001',
      applicantName: 'Admin User',
      property: 'Palmview Estates, Lekki',
      status: 'pending',
      loanAmount: 68000000,
      createdAt: new Date().toISOString()
    }
  ];

  const handleMortgageApiError = (err, fallbackSetter) => {
    const status = err?.response?.status;
    if (status === 404 || status === 501) {
      console.warn('MortgageContext: API route unavailable, using mock data');
      fallbackSetter();
      return true;
    }
    return false;
  };

  // Fetch mortgages from backend API
  const fetchMortgages = useCallback(async () => {
    if (!MORTGAGE_FLOW_ENABLED || !user) {
      setMortgages([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        // User not authenticated - this is expected for unauthenticated users
        setMortgages([]);
        return;
      }

      const response = await axios.get(getApiUrl('/mortgages/active'), {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          status: 'active' // Only fetch active mortgages for dashboard
        }
      });

      if (response.data && response.data.success) {
        // Transform backend data to frontend format
        const transformedMortgages = transformMortgagesArray(response.data.data || []);
        setMortgages(transformedMortgages);
      } else {
        setMortgages([]);
      }
    } catch (err) {
      console.error('Error fetching mortgages:', err);
      const handled = handleMortgageApiError(err, () => setMortgages(transformMortgagesArray(mockMortgageData)));
      if (!handled) {
        setError(err.response?.data?.message || 'Failed to load mortgages');
        if (err.response?.status !== 401 && err.response?.status !== 403) {
          toast.error('Failed to load mortgages. Please try again later.');
        }
        setMortgages([]);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch mortgage applications from backend API
  const fetchApplications = useCallback(async () => {
    try {
      if (!MORTGAGE_FLOW_ENABLED) {
        toast('Auto-pay is currently disabled.', { icon: 'ℹ️' });
        return { success: false, disabled: true };
      }
      setApplicationsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setApplications([]);
        return;
      }

      const response = await axios.get(getApiUrl('/mortgages'), {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          // Fetch all applications for the user
        }
      });

      if (response.data && response.data.success) {
        setApplications(response.data.data || []);
      } else {
        setApplications([]);
      }
    } catch (err) {
      console.error('Error fetching mortgage applications:', err);
      const handled = handleMortgageApiError(err, () => setApplications(mockApplicationsData));
      if (!handled) {
        setError(err.response?.data?.message || 'Failed to load applications');
        if (err.response?.status !== 401 && err.response?.status !== 403) {
          toast.error('Failed to load mortgage applications. Please try again later.');
        }
        setApplications([]);
      }
    } finally {
      setApplicationsLoading(false);
    }
  }, [user]);

  // Load mortgages and applications when user changes
  useEffect(() => {
    if (MORTGAGE_FLOW_ENABLED) {
      fetchMortgages();
      fetchApplications();
    } else {
      setMortgages([]);
      setApplications([]);
    }
  }, [fetchMortgages, fetchApplications]);

  const getMortgageById = useCallback((mortgageId) => {
    return mortgages.find(mortgage => 
      mortgage.id === mortgageId || 
      mortgage._id === mortgageId ||
      mortgage.id?.toString() === mortgageId?.toString()
    );
  }, [mortgages]);

  const getApplicationById = useCallback((applicationId) => {
    return applications.find(app => 
      app.id === applicationId || 
      app._id === applicationId ||
      app.id?.toString() === applicationId?.toString()
    );
  }, [applications]);

  const getUserApplications = useCallback(() => {
    return applications;
  }, [applications]);

  const getApplicationsByStatus = useCallback((status) => {
    return applications.filter(app => app.status === status);
  }, [applications]);

  // Refresh applications from backend
  const refreshApplications = useCallback(async () => {
    await fetchApplications();
  }, [fetchApplications]);

  const getUserMortgages = useCallback(() => {
    return mortgages;
  }, [mortgages]);

  // Refresh mortgages from backend
  const refreshMortgages = useCallback(async () => {
    await fetchMortgages();
  }, [fetchMortgages]);

  const getUpcomingPayments = () => {
    const now = new Date();
    const upcomingPayments = [];
    
    mortgages.forEach(mortgage => {
      // Use payment schedule if available, otherwise fall back to nextPaymentDate
      if (mortgage.paymentSchedule && mortgage.paymentSchedule.length > 0) {
        const nextPayment = getNextPayment(mortgage.paymentSchedule);
        if (nextPayment) {
          const daysUntilPayment = getDaysUntilPayment(nextPayment.dueDate);
          if (daysUntilPayment <= 30 && daysUntilPayment >= 0) {
            upcomingPayments.push({
              mortgageId: mortgage.id,
              mortgageTitle: mortgage.propertyTitle,
              mortgageLocation: mortgage.propertyLocation,
              payment: nextPayment,
              daysUntilPayment,
              paymentAmount: nextPayment.amount,
              dueDate: nextPayment.dueDate,
              remainingBalance: nextPayment.remainingBalance
            });
          }
        }
      } else {
        // Fallback to old method
        const nextPaymentDate = new Date(mortgage.nextPaymentDate);
        const daysUntilPayment = getDaysUntilPayment(mortgage.nextPaymentDate);
        
        if (daysUntilPayment <= 30 && daysUntilPayment >= 0) {
          upcomingPayments.push({
            mortgageId: mortgage.id,
            mortgageTitle: mortgage.propertyTitle,
            mortgageLocation: mortgage.propertyLocation,
            daysUntilPayment,
            paymentAmount: mortgage.monthlyPayment,
            dueDate: mortgage.nextPaymentDate
          });
        }
      }
    });
    
    return upcomingPayments.sort((a, b) => a.daysUntilPayment - b.daysUntilPayment);
  };

  const makePayment = async (mortgageId, paymentAmount, paymentMethod = 'flutterwave') => {
    try {
      if (!user) {
        toast.error('Please login to make payments');
        return { success: false };
      }

      const mortgage = getMortgageById(mortgageId);
      if (!mortgage) {
        toast.error('Mortgage not found');
        return { success: false };
      }

      // Get the next payment from the schedule if available
      let nextPayment = null;
      let paymentNumber = mortgage.paymentsMade + 1;
      
      if (mortgage.paymentSchedule && mortgage.paymentSchedule.length > 0) {
        nextPayment = getNextPayment(mortgage.paymentSchedule);
        if (nextPayment) {
          paymentAmount = nextPayment.amount;
          paymentNumber = nextPayment.paymentNumber;
        }
      } else if (paymentAmount !== mortgage.monthlyPayment) {
        toast.error(`Payment amount must be exactly ₦${mortgage.monthlyPayment.toLocaleString()}`);
        return { success: false };
      }

      setLoading(true);

      // Create new payment record
      const newPayment = {
        id: `PAY-${Date.now()}`,
        paymentNumber: paymentNumber,
        amount: paymentAmount,
        dueDate: nextPayment ? nextPayment.dueDate : mortgage.nextPaymentDate,
        paidDate: new Date().toISOString(),
        status: 'paid',
        paymentMethod: paymentMethod,
        type: nextPayment?.type || 'monthly'
      };

      // Update mortgage with new payment
      const updatedMortgage = {
        ...mortgage,
        paymentsMade: mortgage.paymentsMade + 1,
        paymentsRemaining: mortgage.paymentsRemaining - 1,
        nextPaymentDate: nextPayment ? nextPayment.dueDate : getNextPaymentDate(mortgage.nextPaymentDate),
        paymentHistory: [...mortgage.paymentHistory, newPayment],
        updatedAt: new Date().toISOString()
      };

      // Update payment schedule if it exists
      if (updatedMortgage.paymentSchedule && updatedMortgage.paymentSchedule.length > 0) {
        updatedMortgage.paymentSchedule = updatedMortgage.paymentSchedule.map(payment => {
          if (payment.paymentNumber === paymentNumber) {
            return {
              ...payment,
              status: 'paid',
              paidDate: newPayment.paidDate,
              paymentMethod: paymentMethod
            };
          }
          return payment;
        });
      }

      // Update mortgages array
      setMortgages(prev => 
        prev.map(m => m.id === mortgageId ? updatedMortgage : m)
      );

      // Create success notification
      await createTestNotification({
        type: 'mortgage_payment_success',
        title: 'Mortgage Payment Successful',
        message: `Your payment of ₦${paymentAmount.toLocaleString()} for ${mortgage.propertyTitle} has been processed successfully.`,
        priority: 'medium',
        data: {
          mortgageId: mortgage.id,
          paymentId: newPayment.id,
          amount: paymentAmount,
          propertyTitle: mortgage.propertyTitle,
          nextPaymentDate: updatedMortgage.nextPaymentDate
        }
      });

      // Schedule next payment notification
      await scheduleNextPaymentNotification(updatedMortgage);

      toast.success('Payment processed successfully!');
      return { success: true, payment: newPayment, mortgage: updatedMortgage };
    } catch (error) {
      console.error('Error making payment:', error);
      toast.error('Failed to process payment');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const getNextPaymentDate = (currentDate) => {
    const date = new Date(currentDate);
    date.setMonth(date.getMonth() + 1);
    return date.toISOString();
  };

  const scheduleNextPaymentNotification = async (mortgage) => {
    try {
      // Get the next payment from schedule
      let nextPayment = null;
      let paymentAmount = mortgage.monthlyPayment;
      let nextPaymentDate = mortgage.nextPaymentDate;
      
      if (mortgage.paymentSchedule && mortgage.paymentSchedule.length > 0) {
        nextPayment = getNextPayment(mortgage.paymentSchedule);
        if (nextPayment) {
          paymentAmount = nextPayment.amount;
          nextPaymentDate = nextPayment.dueDate;
        }
      }
      
      // Schedule notification for 7 days before next payment
      const nextPaymentDateObj = new Date(nextPaymentDate);
      const notificationDate = new Date(nextPaymentDateObj);
      notificationDate.setDate(notificationDate.getDate() - 7);

      const now = new Date();
      const delay = notificationDate.getTime() - now.getTime();

      if (delay > 0) {
        // Schedule the notification
        setTimeout(async () => {
          await createTestNotification({
            type: 'mortgage_payment_reminder',
            title: 'Upcoming Mortgage Payment',
            message: `Your mortgage payment of ₦${paymentAmount.toLocaleString()} for ${mortgage.propertyTitle} is due in 7 days.`,
            priority: 'high',
            data: {
              mortgageId: mortgage.id,
              amount: paymentAmount,
              propertyTitle: mortgage.propertyTitle,
              dueDate: nextPaymentDate,
              paymentAction: 'make_payment'
            }
          });
        }, delay);
      }

      // Also schedule a day-before notification
      const dayBeforeDate = new Date(nextPaymentDateObj);
      dayBeforeDate.setDate(dayBeforeDate.getDate() - 1);
      const dayBeforeDelay = dayBeforeDate.getTime() - now.getTime();

      if (dayBeforeDelay > 0) {
        setTimeout(async () => {
          await createTestNotification({
            type: 'mortgage_payment_urgent',
            title: 'Mortgage Payment Due Tomorrow',
            message: `Your mortgage payment of ₦${paymentAmount.toLocaleString()} for ${mortgage.propertyTitle} is due tomorrow.`,
            priority: 'urgent',
            data: {
              mortgageId: mortgage.id,
              amount: paymentAmount,
              propertyTitle: mortgage.propertyTitle,
              dueDate: nextPaymentDate,
              paymentAction: 'make_payment'
            }
          });
        }, dayBeforeDelay);
      }
    } catch (error) {
      console.error('Error scheduling payment notification:', error);
    }
  };

  const getPaymentSummary = () => {
    const totalMortgages = mortgages.length;
    const activeMortgages = mortgages.filter(m => m.status === 'active').length;
    const totalMonthlyPayments = mortgages.reduce((sum, m) => sum + m.monthlyPayment, 0);
    const totalPaid = mortgages.reduce((sum, m) => 
      sum + m.paymentHistory.reduce((paymentSum, p) => paymentSum + p.amount, 0), 0
    );

    return {
      totalMortgages,
      activeMortgages,
      totalMonthlyPayments,
      totalPaid
    };
  };

  const enableAutoPay = async (mortgageId) => {
    try {
      const mortgage = getMortgageById(mortgageId);
      if (!mortgage) {
        toast.error('Mortgage not found');
        return { success: false };
      }

      const updatedMortgage = {
        ...mortgage,
        autoPay: true,
        autoPayEnabledDate: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setMortgages(prev => 
        prev.map(m => m.id === mortgageId ? updatedMortgage : m)
      );

      toast.success('Auto-pay enabled successfully! Payments will be processed automatically on the due date.');
      return { success: true, mortgage: updatedMortgage };
    } catch (error) {
      console.error('Error enabling auto-pay:', error);
      toast.error('Failed to enable auto-pay');
      return { success: false, error: error.message };
    }
  };

  const disableAutoPay = async (mortgageId) => {
    try {
      const mortgage = getMortgageById(mortgageId);
      if (!mortgage) {
        toast.error('Mortgage not found');
        return { success: false };
      }

      const updatedMortgage = {
        ...mortgage,
        autoPay: false,
        autoPayDisabledDate: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setMortgages(prev => 
        prev.map(m => m.id === mortgageId ? updatedMortgage : m)
      );

      toast.success('Auto-pay disabled successfully!');
      return { success: true, mortgage: updatedMortgage };
    } catch (error) {
      console.error('Error disabling auto-pay:', error);
      toast.error('Failed to disable auto-pay');
      return { success: false, error: error.message };
    }
  };

  const value = {
    mortgages,
    applications,
    loading,
    applicationsLoading,
    error,
    getMortgageById,
    getUserMortgages,
    getUpcomingPayments,
    makePayment,
    getPaymentSummary,
    enableAutoPay,
    disableAutoPay,
    refreshMortgages,
    // Application functions
    getUserApplications,
    getApplicationById,
    getApplicationsByStatus,
    refreshApplications
  };

  return (
    <MortgageContext.Provider value={value}>
      {children}
    </MortgageContext.Provider>
  );
};

export default MortgageContext;
