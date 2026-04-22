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

