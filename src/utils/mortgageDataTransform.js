/**
 * Mortgage Data Transformation Utilities
 * Transforms backend API data to frontend format
 */

import { generatePaymentSchedule } from './mortgageCalculator';

/**
 * Transform backend mortgage data to frontend format
 * @param {Object} backendMortgage - Mortgage data from backend API
 * @returns {Object} Transformed mortgage data for frontend
 */
export const transformMortgageData = (backendMortgage) => {
  if (!backendMortgage) return null;

  // Extract property details
  const property = backendMortgage.property || {};
  const propertyId = property._id || property.id || backendMortgage.property?._id || backendMortgage.propertyId;
  const propertyTitle = property.title || 'Unknown Property';
  const propertyLocation = property.location || 
    (property.city && property.state ? `${property.city}, ${property.state}` : 'Location not specified');
  const propertyPrice = property.price || 0;
  const propertyImages = property.images || [];

  // Extract buyer details
  const buyer = backendMortgage.buyer || {};
  const userId = buyer._id || buyer.id || backendMortgage.buyer?._id || backendMortgage.buyerId;

  // Extract bank details
  const mortgageBank = backendMortgage.mortgageBank || {};
  const bankName = mortgageBank.name || 'Unknown Bank';

  // Transform payment history
  const paymentHistory = (backendMortgage.paymentHistory || []).map((payment, index) => ({
    id: payment._id || payment.id || `PAY-${index}-${Date.now()}`,
    paymentNumber: payment.paymentNumber || index + 1,
    amount: payment.amount || 0,
    dueDate: payment.dueDate ? new Date(payment.dueDate).toISOString() : null,
    paidDate: payment.paidDate ? new Date(payment.paidDate).toISOString() : null,
    status: payment.status || 'pending',
    paymentMethod: payment.paymentMethod || 'manual',
    transactionId: payment.transactionId,
    notes: payment.notes
  }));

  // Generate payment schedule
  const schedule = generatePaymentSchedule(
    backendMortgage.loanAmount,
    backendMortgage.interestRate,
    backendMortgage.loanTermYears,
    backendMortgage.startDate ? new Date(backendMortgage.startDate).toISOString() : new Date().toISOString(),
    backendMortgage.downPayment
  );

  // Mark already paid payments in the schedule
  schedule.forEach(payment => {
    const paidPayment = paymentHistory.find(p => {
      // Match by payment number first
      if (payment.paymentNumber === p.paymentNumber) return true;
      
      // Match by date (same day) - comparing payment.dueDate to p.dueDate
      if (payment.dueDate && p.dueDate) {
        const scheduleDate = new Date(payment.dueDate);
        const historyDate = new Date(p.dueDate); // Fix: use p.dueDate not payment.dueDate
        // Check if same day (ignoring time)
        return scheduleDate.toDateString() === historyDate.toDateString();
      }
      
      return false;
    });
    
    if (paidPayment && paidPayment.status === 'paid') {
      payment.status = 'paid';
      payment.paidDate = paidPayment.paidDate;
      payment.paymentMethod = paidPayment.paymentMethod;
    }
  });

  // Build transformed mortgage object
  const transformedMortgage = {
    id: backendMortgage._id || backendMortgage.id,
    userId: userId,
    propertyId: propertyId,
    propertyTitle: propertyTitle,
    propertyLocation: propertyLocation,
    propertyPrice: propertyPrice,
    propertyImages: propertyImages,
    bankName: bankName,
    loanAmount: backendMortgage.loanAmount || 0,
    downPayment: backendMortgage.downPayment || 0,
    interestRate: backendMortgage.interestRate || 0,
    loanTerm: backendMortgage.loanTermYears || 0, // Frontend uses loanTerm
    monthlyPayment: backendMortgage.monthlyPayment || 0,
    totalPayments: backendMortgage.totalPayments || 0,
    paymentsMade: backendMortgage.paymentsMade || 0,
    paymentsRemaining: backendMortgage.paymentsRemaining || 0,
    startDate: backendMortgage.startDate ? new Date(backendMortgage.startDate).toISOString() : new Date().toISOString(),
    nextPaymentDate: backendMortgage.nextPaymentDate ? new Date(backendMortgage.nextPaymentDate).toISOString() : null,
    status: backendMortgage.status || 'active',
    paymentHistory: paymentHistory,
    paymentSchedule: schedule,
    remainingBalance: backendMortgage.remainingBalance || backendMortgage.loanAmount || 0,
    totalPaid: backendMortgage.totalPaid || 0,
    autoPay: backendMortgage.autoPay || false,
    autoPayEnabledDate: backendMortgage.autoPayEnabledDate ? new Date(backendMortgage.autoPayEnabledDate).toISOString() : null,
    autoPayDisabledDate: backendMortgage.autoPayDisabledDate ? new Date(backendMortgage.autoPayDisabledDate).toISOString() : null,
    documents: backendMortgage.documents || [],
    application: backendMortgage.application || null,
    createdAt: backendMortgage.createdAt ? new Date(backendMortgage.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: backendMortgage.updatedAt ? new Date(backendMortgage.updatedAt).toISOString() : new Date().toISOString()
  };

  return transformedMortgage;
};

/**
 * Transform array of backend mortgages to frontend format
 * @param {Array} backendMortgages - Array of mortgage data from backend API
 * @returns {Array} Array of transformed mortgage data
 */
export const transformMortgagesArray = (backendMortgages) => {
  if (!Array.isArray(backendMortgages)) return [];
  return backendMortgages.map(transformMortgageData).filter(Boolean);
};

