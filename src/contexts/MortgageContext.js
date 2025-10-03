import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import toast from 'react-hot-toast';

// Mock mortgage data
const mockMortgages = [
  {
    id: 'MORT-001',
    userId: '3', // Onyedikachi Akoma
    propertyId: 'prop_001',
    propertyTitle: 'Beautiful Family Home in Lekki Phase 1',
    propertyLocation: 'Lekki Phase 1, Lagos',
    propertyPrice: 185000000,
    loanAmount: 148000000, // 80% of property value
    downPayment: 37000000, // 20% down payment
    interestRate: 18.5,
    loanTerm: 25, // years
    monthlyPayment: 2450000, // Monthly payment amount
    totalPayments: 300, // Total number of payments
    paymentsMade: 3,
    paymentsRemaining: 297,
    startDate: '2024-01-15T00:00:00Z',
    nextPaymentDate: '2024-05-15T00:00:00Z',
    status: 'active',
    paymentHistory: [
      {
        id: 'PAY-001',
        amount: 2450000,
        dueDate: '2024-02-15T00:00:00Z',
        paidDate: '2024-02-14T10:30:00Z',
        status: 'paid',
        paymentMethod: 'flutterwave'
      },
      {
        id: 'PAY-002',
        amount: 2450000,
        dueDate: '2024-03-15T00:00:00Z',
        paidDate: '2024-03-15T09:15:00Z',
        status: 'paid',
        paymentMethod: 'flutterwave'
      },
      {
        id: 'PAY-003',
        amount: 2450000,
        dueDate: '2024-04-15T00:00:00Z',
        paidDate: '2024-04-14T14:20:00Z',
        status: 'paid',
        paymentMethod: 'flutterwave'
      }
    ],
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-04-14T14:20:00Z'
  },
  {
    id: 'MORT-002',
    userId: '1', // John Doe
    propertyId: 'prop_002',
    propertyTitle: 'Modern Downtown Apartment in Victoria Island',
    propertyLocation: 'Victoria Island, Lagos',
    propertyPrice: 120000000,
    loanAmount: 96000000, // 80% of property value
    downPayment: 24000000, // 20% down payment
    interestRate: 16.5,
    loanTerm: 20, // years
    monthlyPayment: 1800000, // Monthly payment amount
    totalPayments: 240, // Total number of payments
    paymentsMade: 1,
    paymentsRemaining: 239,
    startDate: '2024-03-01T00:00:00Z',
    nextPaymentDate: '2024-05-01T00:00:00Z',
    status: 'active',
    paymentHistory: [
      {
        id: 'PAY-004',
        amount: 1800000,
        dueDate: '2024-04-01T00:00:00Z',
        paidDate: '2024-03-31T16:45:00Z',
        status: 'paid',
        paymentMethod: 'flutterwave'
      }
    ],
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-31T16:45:00Z'
  }
];

const MortgageContext = createContext();

export const useMortgage = () => {
  const context = useContext(MortgageContext);
  if (!context) {
    throw new Error('useMortgage must be used within a MortgageProvider');
  }
  return context;
};

export const MortgageProvider = ({ children }) => {
  const { user } = useAuth();
  const { createTestNotification } = useNotifications();
  const [mortgages, setMortgages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load mock data immediately
    if (user) {
      setMortgages(mockMortgages.filter(mortgage => mortgage.userId === user.id));
    }
  }, [user]);

  const getMortgageById = (mortgageId) => {
    return mortgages.find(mortgage => mortgage.id === mortgageId);
  };

  const getUserMortgages = () => {
    return mortgages;
  };

  const getUpcomingPayments = () => {
    const now = new Date();
    const upcomingPayments = [];
    
    mortgages.forEach(mortgage => {
      const nextPaymentDate = new Date(mortgage.nextPaymentDate);
      const daysUntilPayment = Math.ceil((nextPaymentDate - now) / (1000 * 60 * 60 * 24));
      
      if (daysUntilPayment <= 30 && daysUntilPayment >= 0) {
        upcomingPayments.push({
          ...mortgage,
          daysUntilPayment,
          paymentAmount: mortgage.monthlyPayment
        });
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

      if (paymentAmount !== mortgage.monthlyPayment) {
        toast.error(`Payment amount must be exactly ₦${mortgage.monthlyPayment.toLocaleString()}`);
        return { success: false };
      }

      setLoading(true);

      // Create new payment record
      const newPayment = {
        id: `PAY-${Date.now()}`,
        amount: paymentAmount,
        dueDate: mortgage.nextPaymentDate,
        paidDate: new Date().toISOString(),
        status: 'paid',
        paymentMethod: paymentMethod
      };

      // Update mortgage with new payment
      const updatedMortgage = {
        ...mortgage,
        paymentsMade: mortgage.paymentsMade + 1,
        paymentsRemaining: mortgage.paymentsRemaining - 1,
        nextPaymentDate: getNextPaymentDate(mortgage.nextPaymentDate),
        paymentHistory: [...mortgage.paymentHistory, newPayment],
        updatedAt: new Date().toISOString()
      };

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
      // Schedule notification for 7 days before next payment
      const nextPaymentDate = new Date(mortgage.nextPaymentDate);
      const notificationDate = new Date(nextPaymentDate);
      notificationDate.setDate(notificationDate.getDate() - 7);

      const now = new Date();
      const delay = notificationDate.getTime() - now.getTime();

      if (delay > 0) {
        // Schedule the notification
        setTimeout(async () => {
          await createTestNotification({
            type: 'mortgage_payment_reminder',
            title: 'Upcoming Mortgage Payment',
            message: `Your mortgage payment of ₦${mortgage.monthlyPayment.toLocaleString()} for ${mortgage.propertyTitle} is due in 7 days.`,
            priority: 'high',
            data: {
              mortgageId: mortgage.id,
              amount: mortgage.monthlyPayment,
              propertyTitle: mortgage.propertyTitle,
              dueDate: mortgage.nextPaymentDate,
              paymentAction: 'make_payment'
            }
          });
        }, delay);
      }

      // Also schedule a day-before notification
      const dayBeforeDate = new Date(nextPaymentDate);
      dayBeforeDate.setDate(dayBeforeDate.getDate() - 1);
      const dayBeforeDelay = dayBeforeDate.getTime() - now.getTime();

      if (dayBeforeDelay > 0) {
        setTimeout(async () => {
          await createTestNotification({
            type: 'mortgage_payment_urgent',
            title: 'Mortgage Payment Due Tomorrow',
            message: `Your mortgage payment of ₦${mortgage.monthlyPayment.toLocaleString()} for ${mortgage.propertyTitle} is due tomorrow.`,
            priority: 'urgent',
            data: {
              mortgageId: mortgage.id,
              amount: mortgage.monthlyPayment,
              propertyTitle: mortgage.propertyTitle,
              dueDate: mortgage.nextPaymentDate,
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

  const value = {
    mortgages,
    loading,
    getMortgageById,
    getUserMortgages,
    getUpcomingPayments,
    makePayment,
    getPaymentSummary
  };

  return (
    <MortgageContext.Provider value={value}>
      {children}
    </MortgageContext.Provider>
  );
};

export default MortgageContext;
