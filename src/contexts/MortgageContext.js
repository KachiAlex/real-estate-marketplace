import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import toast from 'react-hot-toast';
import { 
  calculateMonthlyPayment, 
  generatePaymentSchedule, 
  getNextPayment, 
  getDaysUntilPayment,
  getUpcomingPayments as getUpcomingPaymentsUtil 
} from '../utils/mortgageCalculator';

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
    // Load mock data immediately and generate payment schedules
    if (user) {
      const userMortgages = mockMortgages.filter(mortgage => mortgage.userId === user.id);
      
      // Generate payment schedules for each mortgage
      const mortgagesWithSchedules = userMortgages.map(mortgage => {
        // Check if schedule hasn't been generated yet
        if (!mortgage.paymentSchedule || mortgage.paymentSchedule.length === 0) {
          const schedule = generatePaymentSchedule(
            mortgage.loanAmount,
            mortgage.interestRate,
            mortgage.loanTerm,
            mortgage.startDate,
            mortgage.downPayment
          );
          
          // Mark already paid payments in the schedule
          schedule.forEach(payment => {
            const paidPayment = mortgage.paymentHistory.find(p => 
              payment.dueDate === p.dueDate || 
              (payment.paymentNumber && p.paymentNumber === payment.paymentNumber)
            );
            if (paidPayment) {
              payment.status = 'paid';
              payment.paidDate = paidPayment.paidDate;
              payment.paymentMethod = paidPayment.paymentMethod;
            }
          });
          
          return {
            ...mortgage,
            paymentSchedule: schedule
          };
        }
        return mortgage;
      });
      
      setMortgages(mortgagesWithSchedules);
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
    loading,
    getMortgageById,
    getUserMortgages,
    getUpcomingPayments,
    makePayment,
    getPaymentSummary,
    enableAutoPay,
    disableAutoPay
  };

  return (
    <MortgageContext.Provider value={value}>
      {children}
    </MortgageContext.Provider>
  );
};

export default MortgageContext;
