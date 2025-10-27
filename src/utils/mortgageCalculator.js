/**
 * Mortgage Calculator Utilities
 * Handles all mortgage calculations including down payment, monthly payment, and payment schedules
 */

/**
 * Calculate monthly mortgage payment using standard amortization formula
 * P = L * [r(1+r)^n] / [(1+r)^n - 1]
 * Where:
 * P = Monthly payment
 * L = Loan amount (principal)
 * r = Monthly interest rate (annual rate / 12)
 * n = Total number of payments (years * 12)
 */
export const calculateMonthlyPayment = (loanAmount, annualInterestRate, loanTermYears) => {
  if (!loanAmount || loanAmount <= 0) return 0;
  if (!annualInterestRate || annualInterestRate <= 0) return 0;
  if (!loanTermYears || loanTermYears <= 0) return 0;

  const monthlyRate = annualInterestRate / 100 / 12;
  const numberOfPayments = loanTermYears * 12;

  if (monthlyRate === 0) {
    return loanAmount / numberOfPayments;
  }

  const monthlyPayment = 
    loanAmount * 
    (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

  return Math.round(monthlyPayment);
};

/**
 * Calculate down payment based on percentage
 */
export const calculateDownPayment = (homePrice, downPaymentPercent) => {
  if (!homePrice || homePrice <= 0) return 0;
  const downPayment = (homePrice * downPaymentPercent) / 100;
  return Math.round(downPayment);
};

/**
 * Calculate loan amount after down payment
 */
export const calculateLoanAmount = (homePrice, downPayment) => {
  return homePrice - downPayment;
};

/**
 * Generate complete payment schedule for the entire mortgage term
 */
export const generatePaymentSchedule = (
  loanAmount,
  annualInterestRate,
  loanTermYears,
  startDate = new Date(),
  downPayment = 0
) => {
  const schedule = [];
  const monthlyRate = annualInterestRate / 100 / 12;
  const totalPayments = loanTermYears * 12;
  
  let remainingBalance = loanAmount;
  let currentDate = new Date(startDate);

  // Add down payment as first payment if provided
  if (downPayment > 0) {
    schedule.push({
      id: `PAY-DP-${Date.now()}`,
      paymentNumber: 0,
      type: 'down-payment',
      amount: downPayment,
      dueDate: currentDate.toISOString(),
      status: 'pending',
      principal: downPayment,
      interest: 0,
      remainingBalance: loanAmount
    });
    
    // Move to next month for first regular payment
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  // Generate regular monthly payments
  const monthlyPayment = calculateMonthlyPayment(loanAmount, annualInterestRate, loanTermYears);

  for (let i = 1; i <= totalPayments; i++) {
    // Calculate interest for this payment
    const interestPayment = Math.round(remainingBalance * monthlyRate);
    // Calculate principal for this payment
    const principalPayment = monthlyPayment - interestPayment;
    
    // Update remaining balance
    remainingBalance -= principalPayment;

    schedule.push({
      id: `PAY-${i}-${Date.now()}`,
      paymentNumber: i,
      type: 'monthly',
      amount: monthlyPayment,
      dueDate: new Date(currentDate).toISOString(),
      status: 'pending',
      principal: principalPayment,
      interest: interestPayment,
      remainingBalance: Math.max(0, Math.round(remainingBalance))
    });

    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return schedule;
};

/**
 * Calculate total interest paid over the life of the loan
 */
export const calculateTotalInterest = (loanAmount, annualInterestRate, loanTermYears) => {
  const monthlyPayment = calculateMonthlyPayment(loanAmount, annualInterestRate, loanTermYears);
  const totalPayments = loanTermYears * 12;
  const totalAmountPaid = monthlyPayment * totalPayments;
  return totalAmountPaid - loanAmount;
};

/**
 * Get the next payment in the schedule
 */
export const getNextPayment = (schedule) => {
  if (!schedule || schedule.length === 0) return null;
  
  const now = new Date();
  const upcomingPayments = schedule.filter(payment => {
    const dueDate = new Date(payment.dueDate);
    return dueDate >= now && payment.status === 'pending';
  });

  return upcomingPayments.length > 0 ? upcomingPayments[0] : null;
};

/**
 * Calculate days until next payment
 */
export const getDaysUntilPayment = (dueDate) => {
  const now = new Date();
  const due = new Date(dueDate);
  const diffTime = due - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Get all pending payments within a date range
 */
export const getUpcomingPayments = (schedule, daysAhead = 30) => {
  if (!schedule || schedule.length === 0) return [];
  
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  return schedule.filter(payment => {
    const dueDate = new Date(payment.dueDate);
    return dueDate >= now && dueDate <= futureDate && payment.status === 'pending';
  });
};
