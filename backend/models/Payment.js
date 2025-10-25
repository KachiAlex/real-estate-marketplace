const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  transactionId: {
    type: String,
    required: [true, 'Transaction ID is required'],
    unique: true
  },
  reference: {
    type: String,
    required: [true, 'Payment reference is required'],
    unique: true
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [100, 'Minimum payment amount is ₦100']
  },
  currency: {
    type: String,
    default: 'NGN',
    enum: ['NGN', 'USD', 'EUR', 'GBP']
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: ['flutterwave', 'paystack', 'stripe', 'bank_transfer', 'cash']
  },
  paymentProvider: {
    type: String,
    required: [true, 'Payment provider is required'],
    enum: ['flutterwave', 'paystack', 'stripe', 'manual']
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentType: {
    type: String,
    required: [true, 'Payment type is required'],
    enum: ['property_purchase', 'investment', 'escrow', 'subscription', 'commission', 'refund']
  },
  relatedEntity: {
    type: {
      type: String,
      enum: ['property', 'investment', 'escrow', 'subscription'],
      required: [true, 'Related entity type is required']
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Related entity ID is required']
    }
  },
  description: {
    type: String,
    required: [true, 'Payment description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  metadata: {
    // Flutterwave specific fields
    flutterwave: {
      transactionId: String,
      flwRef: String,
      txRef: String,
      orderRef: String,
      paymentType: String,
      customer: {
        email: String,
        phone: String,
        name: String
      }
    },
    // Paystack specific fields
    paystack: {
      reference: String,
      accessCode: String,
      authorizationUrl: String,
      customer: {
        email: String,
        phone: String,
        name: String
      }
    },
    // Stripe specific fields
    stripe: {
      paymentIntentId: String,
      clientSecret: String,
      customerId: String,
      chargeId: String
    },
    // Bank transfer fields
    bankTransfer: {
      bankName: String,
      accountNumber: String,
      accountName: String,
      reference: String,
      proofOfPayment: String
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
  timeline: [{
    status: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: mongoose.Schema.Types.Mixed
  }],
  refund: {
    amount: {
      type: Number,
      min: [0, 'Refund amount cannot be negative']
    },
    reason: {
      type: String,
      trim: true
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    processedAt: {
      type: Date
    },
    refundReference: {
      type: String
    }
  },
  webhookData: {
    type: mongoose.Schema.Types.Mixed
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

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: this.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(this.amount);
});

// Virtual for net amount (after fees)
paymentSchema.virtual('netAmount').get(function() {
  return this.amount - this.fees.totalFees;
});

// Indexes for better performance
paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ reference: 1 });
paymentSchema.index({ paymentType: 1, status: 1 });
paymentSchema.index({ 'relatedEntity.type': 1, 'relatedEntity.id': 1 });
paymentSchema.index({ createdAt: -1 });

// Pre-save middleware
paymentSchema.pre('save', function(next) {
  // Calculate total fees
  this.fees.totalFees = this.fees.platformFee + this.fees.processingFee;
  
  // Add to timeline if status changed
  if (this.isModified('status') && !this.isNew) {
    this.timeline.push({
      status: this.status,
      description: `Payment status changed to ${this.status}`,
      metadata: {
        previousStatus: this.get('status', null, { getters: false })
      }
    });
  }
  
  next();
});

// Static methods
paymentSchema.statics.getUserPayments = function(userId, options = {}) {
  const query = { userId, isActive: true };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.paymentType) {
    query.paymentType = options.paymentType;
  }
  
  return this.find(query)
    .populate('relatedEntity.id')
    .sort({ createdAt: -1 });
};

paymentSchema.statics.getPaymentsByEntity = function(entityType, entityId) {
  return this.find({
    'relatedEntity.type': entityType,
    'relatedEntity.id': entityId,
    isActive: true
  }).sort({ createdAt: -1 });
};

paymentSchema.statics.getPaymentStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalPayments: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        totalFees: { $sum: '$fees.totalFees' },
        completedPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        failedPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        pendingPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        }
      }
    }
  ]);
};

// Instance methods
paymentSchema.methods.addTimelineEvent = function(status, description, metadata = {}) {
  this.timeline.push({
    status,
    description,
    metadata
  });
  return this.save();
};

paymentSchema.methods.processRefund = function(amount, reason, processedBy) {
  this.status = 'refunded';
  this.refund = {
    amount,
    reason,
    processedBy,
    processedAt: new Date(),
    refundReference: `REF${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`
  };
  
  this.addTimelineEvent('refunded', `Payment refunded: ${reason}`, {
    refundAmount: amount,
    reason
  });
  
  return this.save();
};

module.exports = mongoose.model('Payment', paymentSchema);
