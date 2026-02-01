const mongoose = require('mongoose');

const userInvestmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  investmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Investment',
    required: [true, 'Investment ID is required']
  },
  investmentTitle: {
    type: String,
    required: [true, 'Investment title is required'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Investment amount is required'],
    min: [100000, 'Minimum investment amount is ₦100,000']
  },
  shares: {
    type: Number,
    required: [true, 'Number of shares is required'],
    min: [0.1, 'Minimum shares is 0.1']
  },
  investmentDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending_approval', 'active', 'completed', 'cancelled', 'refunded'],
    default: 'pending_approval'
  },
  approvedAt: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelledAt: {
    type: Date
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancellationReason: {
    type: String,
    trim: true
  },
  totalDividendsEarned: {
    type: Number,
    default: 0,
    min: [0, 'Dividends cannot be negative']
  },
  expectedMonthlyDividend: {
    type: Number,
    required: [true, 'Expected monthly dividend is required'],
    min: [0, 'Expected dividend cannot be negative']
  },
  totalReturn: {
    type: Number,
    default: 0,
    min: [0, 'Total return cannot be negative']
  },
  sponsorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sponsor ID is required']
  },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'card', 'escrow', 'crypto'],
    default: 'bank_transfer'
  },
  paymentReference: {
    type: String,
    trim: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentDate: {
    type: Date
  },
  documents: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['investment_agreement', 'payment_receipt', 'dividend_statement', 'other'],
      default: 'other'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  dividends: [{
    amount: {
      type: Number,
      required: true,
      min: [0, 'Dividend amount cannot be negative']
    },
    paymentDate: {
      type: Date,
      required: true
    },
    period: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending'
    },
    paymentReference: {
      type: String,
      trim: true
    }
  }],
  notes: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for investment duration
userInvestmentSchema.virtual('investmentDuration').get(function() {
  if (!this.investmentDate) return 0;
  const now = new Date();
  const diffTime = now - this.investmentDate;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24)); // days
});

// Virtual for total dividends paid
userInvestmentSchema.virtual('totalDividendsPaid').get(function() {
  return this.dividends
    .filter(dividend => dividend.status === 'paid')
    .reduce((total, dividend) => total + dividend.amount, 0);
});

// Virtual for pending dividends
userInvestmentSchema.virtual('pendingDividends').get(function() {
  return this.dividends
    .filter(dividend => dividend.status === 'pending')
    .reduce((total, dividend) => total + dividend.amount, 0);
});

// Indexes for better performance
userInvestmentSchema.index({ userId: 1, status: 1 });
userInvestmentSchema.index({ investmentId: 1 });
userInvestmentSchema.index({ sponsorId: 1 });
userInvestmentSchema.index({ status: 1, investmentDate: -1 });
userInvestmentSchema.index({ paymentStatus: 1 });

// Compound index for user investments
userInvestmentSchema.index({ userId: 1, investmentId: 1 }, { unique: true });

// Pre-save middleware
userInvestmentSchema.pre('save', function(next) {
  // Update total dividends earned
  this.totalDividendsEarned = this.totalDividendsPaid;
  
  // Calculate total return percentage
  if (this.amount > 0) {
    this.totalReturn = ((this.totalDividendsEarned / this.amount) * 100);
  }
  
  next();
});

// Static methods
userInvestmentSchema.statics.getUserInvestments = function(userId, options = {}) {
  const query = { userId, isActive: true };
  
  if (options.status) {
    query.status = options.status;
  }
  
  return this.find(query)
    .populate('investmentId', 'title type status totalAmount expectedReturn')
    .populate('sponsorId', 'firstName lastName email')
    .sort({ investmentDate: -1 });
};

userInvestmentSchema.statics.getInvestmentInvestors = function(investmentId) {
  return this.find({ 
    investmentId, 
    status: { $in: ['active', 'completed'] },
    isActive: true 
  })
    .populate('userId', 'firstName lastName email phone')
    .sort({ investmentDate: -1 });
};

userInvestmentSchema.statics.getUserInvestmentSummary = function(userId) {
  return this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId), isActive: true } },
    {
      $group: {
        _id: null,
        totalInvested: { $sum: '$amount' },
        totalDividends: { $sum: '$totalDividendsEarned' },
        activeInvestments: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        totalInvestments: { $sum: 1 },
        averageReturn: { $avg: '$totalReturn' }
      }
    }
  ]);
};

userInvestmentSchema.statics.getSponsorInvestments = function(sponsorId, options = {}) {
  const query = { sponsorId, isActive: true };
  
  if (options.status) {
    query.status = options.status;
  }
  
  return this.find(query)
    .populate('userId', 'firstName lastName email phone')
    .populate('investmentId', 'title type status')
    .sort({ investmentDate: -1 });
};

// Instance methods
userInvestmentSchema.methods.approve = function(approvedBy) {
  this.status = 'active';
  this.approvedAt = new Date();
  this.approvedBy = approvedBy;
  return this.save();
};

userInvestmentSchema.methods.cancel = function(cancelledBy, reason) {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.cancelledBy = cancelledBy;
  this.cancellationReason = reason;
  return this.save();
};

userInvestmentSchema.methods.addDividend = function(amount, period, paymentDate) {
  this.dividends.push({
    amount,
    period,
    paymentDate,
    status: 'pending'
  });
  return this.save();
};

userInvestmentSchema.methods.markDividendPaid = function(dividendId, paymentReference) {
  const dividend = this.dividends.id(dividendId);
  if (dividend) {
    dividend.status = 'paid';
    dividend.paymentReference = paymentReference;
    return this.save();
  }
  throw new Error('Dividend not found');
};

module.exports = mongoose.model('UserInvestment', userInvestmentSchema);
