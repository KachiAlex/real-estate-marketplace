const mongoose = require('mongoose');

const mortgageApplicationSchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected', 'needs_more_info', 'withdrawn'],
    default: 'pending'
  },
  requestedAmount: {
    type: Number,
    required: true,
    min: [0, 'Requested amount cannot be negative']
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
  estimatedMonthlyPayment: {
    type: Number
  },
  employmentDetails: {
    type: {
      type: String,
      enum: ['employed', 'self-employed', 'other'],
      default: 'employed'
    },
    employerName: String,
    jobTitle: String,
    monthlyIncome: Number,
    yearsOfEmployment: Number,
    businessName: String,
    businessType: String
  },
  documents: [{
    type: {
      type: String
    },
    url: String,
    name: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  bankReview: {
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    decision: {
      type: String,
      enum: ['approved', 'rejected', 'needs_more_info']
    },
    notes: String,
    conditions: [String],
    loanTerms: {
      approvedAmount: Number,
      interestRate: Number,
      loanTermYears: Number,
      monthlyPayment: Number
    }
  },
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

mortgageApplicationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

mortgageApplicationSchema.index({ buyer: 1, createdAt: -1 });
mortgageApplicationSchema.index({ mortgageBank: 1, status: 1 });

module.exports = mongoose.model('MortgageApplication', mortgageApplicationSchema);


