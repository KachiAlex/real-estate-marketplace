/**
 * Sequelize Models Index
 * Exports all PostgreSQL models
 */

module.exports = {
  User: require('./User'),
  Property: require('./Property'),
  EscrowTransaction: require('./EscrowTransaction'),
  Investment: require('./Investment'),
  UserInvestment: require('./UserInvestment'),
  MortgageApplication: require('./MortgageApplication'),
  Mortgage: require('./Mortgage'),
  MortgageBank: require('./MortgageBank'),
  Blog: require('./Blog'),
  SupportInquiry: require('./SupportInquiry'),
  VerificationApplication: require('./VerificationApplication'),
  Message: require('./Message'),
  Notification: require('./Notification'),
  SavedProperty: require('./SavedProperty'),
  PropertyInquiry: require('./PropertyInquiry'),
  PropertyAlert: require('./PropertyAlert'),
  DisputeResolution: require('./DisputeResolution'),
  InspectionRequest: require('./InspectionRequest'),
  AdminSettings: require('./AdminSettings'),
  Payment: require('./Payment'),
  Subscription: require('./Subscription'),
  SubscriptionPlan: require('./SubscriptionPlan'),
  SubscriptionPayment: require('./SubscriptionPayment')
};
