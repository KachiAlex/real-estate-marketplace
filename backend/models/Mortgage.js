const mongoose = require('mongoose');

/**
 * Mortgage Model
 * Represents an active mortgage loan that is currently being serviced
 * Created from an approved MortgageApplication
 */
const mortgageSchema = new mongoose.Schema({
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MortgageApplication',
    required: true,
    unique: true // One mortgage per application
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mortgageBank: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MortgageBank',
    required: true
  },
  productId: {
    type: String // refers to embedded product _id in MortgageBank.mortgageProducts
  },
  // Loan details (from approved application or bank review)
  loanAmount: {
    type: Number,
    required: true,
    min: [0, 'Loan amount cannot be negative']
  },
  downPayment: {
    type: Number,
    required: true,
    min: [0, 'Down payment cannot be negative']
  },
  loanTermYears: {
    type: Number,
    required: true,
    min: [1, 'Loan term must be at least 1 year'],
    max: [30, 'Loan term cannot exceed 30 years']
  },
  interestRate: {
    type: Number,
    required: true,
    min: [0, 'Interest rate cannot be negative']
  },
  monthlyPayment: {
    type: Number,
    required: true,
    min: [0, 'Monthly payment cannot be negative']
  },
  // Payment tracking
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  nextPaymentDate: {
    type: Date,
    required: true
  },
  totalPayments: {
    type: Number,
    required: true // Total number of payments (loanTermYears * 12)
  },
  paymentsMade: {
    type: Number,
    default: 0
  },
  paymentsRemaining: {
    type: Number,
    required: true
  },
  // Payment history
  paymentHistory: [{
    paymentNumber: {
      type: Number,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    dueDate: {
      type: Date,
      required: true
    },
    paidDate: {
      type: Date
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'late', 'missed'],
      default: 'pending'
    },
    paymentMethod: {
      type: String,
      enum: ['flutterwave', 'bank_transfer', 'manual', 'auto_pay']
    },
    transactionId: String,
    notes: String
  }],
  // Auto-pay settings
  autoPay: {
    type: Boolean,
    default: false
  },
  autoPayEnabledDate: Date,
  autoPayDisabledDate: Date,
  // Status
  status: {
    type: String,
    enum: ['active', 'paid_off', 'defaulted', 'cancelled'],
    default: 'active'
  },
  // Current balance
  remainingBalance: {
    type: Number,
    required: true
  },
  totalPaid: {
    type: Number,
    default: 0
  },
  // Documents reference
  documents: [{
    type: {
      type: String
    },
    url: String,
    name: String,
    uploadedAt: Date
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

mortgageSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Calculate payments remaining if not set
  if (this.paymentsRemaining === undefined || this.paymentsRemaining === null) {
    this.paymentsRemaining = this.totalPayments - (this.paymentsMade || 0);
  }
  
  next();
});

// Indexes
mortgageSchema.index({ buyer: 1, status: 1 });
mortgageSchema.index({ mortgageBank: 1, status: 1 });
mortgageSchema.index({ application: 1 });
mortgageSchema.index({ nextPaymentDate: 1 });

// Virtual for calculating next payment date
mortgageSchema.virtual('daysUntilNextPayment').get(function() {
  if (!this.nextPaymentDate) return null;
  const now = new Date();
  const nextDate = new Date(this.nextPaymentDate);
  const diffTime = nextDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

module.exports = mongoose.model('Mortgage', mortgageSchema);

