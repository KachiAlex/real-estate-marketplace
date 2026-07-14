// Deprecated Mongoose EscrowTransaction model removed — use Sequelize `models/sequelize/EscrowTransaction.js` instead.
module.exports = null; // legacy model removed
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount cannot be negative']
  },
  currency: {
    type: String,
    default: 'NGN',
    enum: ['NGN', 'USD', 'EUR', 'GBP']
  },
  status: {
    type: String,
    enum: ['initiated', 'pending', 'active', 'completed', 'cancelled', 'disputed', 'refunded'],
    default: 'initiated'
  },
  paymentMethod: {
    type: String,
    enum: ['flutterwave', 'paystack', 'bank_transfer', 'cash'],
    required: true
  },
  paymentReference: {
    type: String,
    unique: true
  },
  transactionId: {
    type: String,
    unique: true
  },
  expectedCompletion: {
    type: Date,
    required: true
  },
  actualCompletion: {
    type: Date
  },
  dispute: {
    reason: {
      type: String,
      enum: ['property_condition', 'title_issues', 'seller_non_compliance', 'buyer_non_compliance', 'payment_issues', 'other']
    },
    description: {
      type: String,
      maxlength: [1000, 'Dispute description cannot exceed 1000 characters']
    },
    evidence: [{
      url: String,
      name: String,
      type: String,
      size: Number
    }],
    filedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    filedAt: Date,
    resolvedAt: Date,
    resolution: {
      type: String,
      enum: ['buyer_favor', 'seller_favor', 'partial_refund', 'full_refund']
    },
    adminNotes: {
      type: String,
      maxlength: [1000, 'Admin notes cannot exceed 1000 characters']
    }
  },
  mediation: {
    required: {
      type: Boolean,
      default: false
    },
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    initiatedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date,
    decision: {
      type: String,
      enum: ['buyer_favor', 'seller_favor', 'partial_refund', 'full_refund']
    },
    reason: {
      type: String,
      maxlength: [1000, 'Mediation reason cannot exceed 1000 characters']
    }
  },
  fees: {
    platformFee: {
      type: Number,
      default: 0
    },
    processingFee: {
      type: Number,
      default: 0
    },
    totalFees: {
      type: Number,
      default: 0
    }
  },
  documents: [{
    type: {
      type: String,
      enum: ['contract', 'inspection_report', 'title_deed', 'receipt', 'other']
    },
    url: String,
    name: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  timeline: [{
    action: {
      type: String,
      required: true
    },
    description: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: mongoose.Schema.Types.Mixed
  }],
  notifications: {
    buyerNotified: {
      type: Boolean,
      default: false
    },
    sellerNotified: {
      type: Boolean,
      default: false
    },
    adminNotified: {
      type: Boolean,
      default: false
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

// Indexes for better query performance
escrowTransactionSchema.index({ buyerId: 1, status: 1 });
escrowTransactionSchema.index({ sellerId: 1, status: 1 });
escrowTransactionSchema.index({ propertyId: 1 });
escrowTransactionSchema.index({ status: 1 });
escrowTransactionSchema.index({ createdAt: -1 });

// Virtual for formatted amount
escrowTransactionSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: this.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(this.amount);
});

// Virtual for days remaining
escrowTransactionSchema.virtual('daysRemaining').get(function() {
  if (!this.expectedCompletion) return null;
  const now = new Date();
  const completion = new Date(this.expectedCompletion);
  const diffTime = completion - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
});

// Ensure virtual fields are serialized
escrowTransactionSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('EscrowTransaction', escrowTransactionSchema);
