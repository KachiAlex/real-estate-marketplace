import { 
  calculateMonthlyPayment, 
  calculateTotalInterest, 
  generatePaymentSchedule,
  calculateDownPayment,
  calculateLoanAmount,
  getNextPayment,
  getDaysUntilPayment,
  getUpcomingPayments
} from '../mortgageCalculator';

describe('mortgageCalculator', () => {
  describe('calculateMonthlyPayment', () => {
    it('should calculate monthly payment correctly', () => {
      const principal = 10000000; // 10M Naira
      const annualRate = 12; // 12% annual (as percentage)
      const years = 20;
      
      const payment = calculateMonthlyPayment(principal, annualRate, years);
      
      expect(payment).toBeGreaterThan(0);
      expect(typeof payment).toBe('number');
      // Should be approximately 110,108 for these inputs
      expect(payment).toBeCloseTo(110109, 0);
    });

    it('should handle zero principal', () => {
      const payment = calculateMonthlyPayment(0, 12, 20);
      expect(payment).toBe(0);
    });

    it('should handle zero interest rate', () => {
      const principal = 10000000;
      const payment = calculateMonthlyPayment(principal, 0, 20);
      // When interest rate is 0 or invalid, function returns 0
      expect(payment).toBe(0);
    });

    it('should handle different loan terms', () => {
      const principal = 10000000;
      const rate = 12;
      
      const payment15 = calculateMonthlyPayment(principal, rate, 15);
      const payment30 = calculateMonthlyPayment(principal, rate, 30);
      
      expect(payment15).toBeGreaterThan(payment30);
    });

    it('should handle invalid inputs', () => {
      expect(calculateMonthlyPayment(-1000, 12, 20)).toBe(0);
      expect(calculateMonthlyPayment(1000, -12, 20)).toBe(0);
      expect(calculateMonthlyPayment(1000, 12, -20)).toBe(0);
    });
  });

  describe('calculateDownPayment', () => {
    it('should calculate down payment correctly', () => {
      const homePrice = 10000000;
      const downPaymentPercent = 20;
      
      const downPayment = calculateDownPayment(homePrice, downPaymentPercent);
      
      expect(downPayment).toBe(2000000);
    });

    it('should handle zero home price', () => {
      expect(calculateDownPayment(0, 20)).toBe(0);
    });
  });

  describe('calculateLoanAmount', () => {
    it('should calculate loan amount after down payment', () => {
      const homePrice = 10000000;
      const downPayment = 2000000;
      
      const loanAmount = calculateLoanAmount(homePrice, downPayment);
      
      expect(loanAmount).toBe(8000000);
    });
  });

  describe('calculateTotalInterest', () => {
    it('should calculate total interest correctly', () => {
      const principal = 10000000;
      const annualRate = 12;
      const years = 20;
      
      const totalInterest = calculateTotalInterest(principal, annualRate, years);
      
      expect(totalInterest).toBeGreaterThan(0);
      expect(totalInterest).toBeLessThan(principal * 2); // Interest shouldn't exceed 2x principal
    });
  });

  describe('generatePaymentSchedule', () => {
    it('should generate payment schedule', () => {
      const principal = 1000000; // 1M for faster test
      const annualRate = 12;
      const years = 5;
      
      const schedule = generatePaymentSchedule(principal, annualRate, years);
      
      expect(Array.isArray(schedule)).toBe(true);
      expect(schedule.length).toBe(years * 12);
      expect(schedule[0]).toHaveProperty('paymentNumber');
      expect(schedule[0]).toHaveProperty('principal');
      expect(schedule[0]).toHaveProperty('interest');
      expect(schedule[0]).toHaveProperty('remainingBalance');
    });

    it('should have decreasing balance over time', () => {
      const principal = 1000000;
      const annualRate = 12;
      const years = 5;
      
      const schedule = generatePaymentSchedule(principal, annualRate, years);
      
      expect(schedule[0].remainingBalance).toBeGreaterThan(schedule[schedule.length - 1].remainingBalance);
      expect(schedule[schedule.length - 1].remainingBalance).toBeCloseTo(0, -3);
    });

    it('should include down payment if provided', () => {
      const principal = 1000000;
      const annualRate = 12;
      const years = 5;
      const downPayment = 200000;
      
      const schedule = generatePaymentSchedule(principal, annualRate, years, new Date(), downPayment);
      
      expect(schedule[0].type).toBe('down-payment');
      expect(schedule[0].amount).toBe(downPayment);
    });
  });

  describe('getNextPayment', () => {
    it('should return next pending payment', () => {
      const schedule = [
        { dueDate: new Date(Date.now() - 86400000).toISOString(), status: 'paid' },
        { dueDate: new Date(Date.now() + 86400000).toISOString(), status: 'pending' },
        { dueDate: new Date(Date.now() + 172800000).toISOString(), status: 'pending' },
      ];
      
      const nextPayment = getNextPayment(schedule);
      
      expect(nextPayment).toBeTruthy();
      expect(nextPayment.status).toBe('pending');
    });

    it('should return null if no pending payments', () => {
      const schedule = [
        { dueDate: new Date(Date.now() - 86400000).toISOString(), status: 'paid' },
      ];
      
      expect(getNextPayment(schedule)).toBeNull();
    });
  });

  describe('getDaysUntilPayment', () => {
    it('should calculate days until payment', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);
      
      const days = getDaysUntilPayment(futureDate.toISOString());
      
      expect(days).toBe(15);
    });
  });

  describe('getUpcomingPayments', () => {
    it('should return upcoming payments within date range', () => {
      const schedule = [
        { dueDate: new Date(Date.now() + 86400000).toISOString(), status: 'pending' },
        { dueDate: new Date(Date.now() + 172800000).toISOString(), status: 'pending' },
        { dueDate: new Date(Date.now() + 259200000).toISOString(), status: 'pending' },
      ];
      
      const upcoming = getUpcomingPayments(schedule, 30);
      
      expect(upcoming.length).toBeGreaterThan(0);
      expect(upcoming.every(p => p.status === 'pending')).toBe(true);
    });
  });
});

