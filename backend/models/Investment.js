const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Investment title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Investment description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  type: {
    type: String,
    required: [true, 'Investment type is required'],
    enum: ['commercial', 'residential', 'retail', 'industrial', 'land', 'reit'],
    default: 'residential'
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total investment amount is required'],
    min: [1000000, 'Minimum investment amount is ₦1,000,000']
  },
  minimumInvestment: {
    type: Number,
    required: [true, 'Minimum investment amount is required'],
    min: [100000, 'Minimum investment amount is ₦100,000']
  },
  raisedAmount: {
    type: Number,
    default: 0,
    min: [0, 'Raised amount cannot be negative']
  },
  investors: {
    type: Number,
    default: 0,
    min: [0, 'Investor count cannot be negative']
  },
  expectedReturn: {
    type: Number,
    required: [true, 'Expected return percentage is required'],
    min: [0, 'Expected return cannot be negative'],
    max: [100, 'Expected return cannot exceed 100%']
  },
  dividendRate: {
    type: Number,
    required: [true, 'Dividend rate is required'],
    min: [0, 'Dividend rate cannot be negative'],
    max: [50, 'Dividend rate cannot exceed 50%']
  },
  duration: {
    type: Number,
    required: [true, 'Investment duration is required'],
    min: [1, 'Duration must be at least 1 month'],
    max: [120, 'Duration cannot exceed 120 months']
  },
  location: {
    address: {
      type: String,
      required: [true, 'Property address is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    },
    coordinates: {
      latitude: {
        type: Number,
        required: [true, 'Latitude is required']
      },
      longitude: {
        type: Number,
        required: [true, 'Longitude is required']
      }
    }
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    caption: {
      type: String,
      trim: true
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  status: {
    type: String,
    enum: ['draft', 'fundraising', 'active', 'completed', 'cancelled', 'paused'],
    default: 'draft'
  },
  sponsor: {
    name: {
      type: String,
      required: [true, 'Sponsor name is required'],
      trim: true
    },
    experience: {
      type: String,
      required: [true, 'Sponsor experience is required'],
      trim: true
    },
    rating: {
      type: Number,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5'],
      default: 0
    },
    description: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      trim: true
    }
  },
  sponsorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sponsor ID is required']
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
      enum: ['prospectus', 'financial_statement', 'legal_document', 'other'],
      default: 'other'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  milestones: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    targetDate: {
      type: Date,
      required: true
    },
    completedDate: {
      type: Date
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'delayed'],
      default: 'pending'
    },
    percentage: {
      type: Number,
      min: [0, 'Percentage cannot be negative'],
      max: [100, 'Percentage cannot exceed 100%'],
      default: 0
    }
  }],
  financials: {
    projectedRevenue: {
      type: Number,
      min: [0, 'Projected revenue cannot be negative']
    },
    operatingExpenses: {
      type: Number,
      min: [0, 'Operating expenses cannot be negative']
    },
    netIncome: {
      type: Number
    },
    cashFlow: {
      type: Number
    }
  },
  risks: [{
    type: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    mitigation: {
      type: String,
      trim: true
    },
    probability: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: {
    type: Date
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  featured: {
    type: Boolean,
    default: false
  },
  featuredUntil: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for progress percentage
investmentSchema.virtual('progressPercentage').get(function() {
  if (this.totalAmount === 0) return 0;
  return Math.round((this.raisedAmount / this.totalAmount) * 100);
});

// Virtual for remaining amount
investmentSchema.virtual('remainingAmount').get(function() {
  return Math.max(0, this.totalAmount - this.raisedAmount);
});

// Virtual for days remaining (if fundraising)
investmentSchema.virtual('daysRemaining').get(function() {
  if (this.status !== 'fundraising') return null;
  const now = new Date();
  const created = new Date(this.createdAt);
  const duration = this.duration * 30; // Convert months to days
  const endDate = new Date(created.getTime() + (duration * 24 * 60 * 60 * 1000));
  const diffTime = endDate - now;
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
});

// Indexes for better performance
investmentSchema.index({ status: 1, isActive: 1 });
investmentSchema.index({ type: 1, status: 1 });
investmentSchema.index({ sponsorId: 1 });
investmentSchema.index({ 'location.city': 1, 'location.state': 1 });
investmentSchema.index({ createdAt: -1 });
investmentSchema.index({ featured: 1, status: 1 });

// Pre-save middleware
investmentSchema.pre('save', function(next) {
  // Ensure raised amount doesn't exceed total amount
  if (this.raisedAmount > this.totalAmount) {
    this.raisedAmount = this.totalAmount;
  }
  
  // Calculate net income if not provided
  if (this.financials && this.financials.projectedRevenue && this.financials.operatingExpenses) {
    this.financials.netIncome = this.financials.projectedRevenue - this.financials.operatingExpenses;
  }
  
  next();
});

// Static methods
investmentSchema.statics.getActiveInvestments = function() {
  return this.find({ 
    status: { $in: ['fundraising', 'active'] },
    isActive: true 
  }).sort({ createdAt: -1 });
};

investmentSchema.statics.getFeaturedInvestments = function() {
  return this.find({ 
    featured: true,
    status: { $in: ['fundraising', 'active'] },
    isActive: true,
    featuredUntil: { $gt: new Date() }
  }).sort({ createdAt: -1 });
};

investmentSchema.statics.getByType = function(type) {
  return this.find({ 
    type,
    status: { $in: ['fundraising', 'active'] },
    isActive: true 
  }).sort({ createdAt: -1 });
};

investmentSchema.statics.getByLocation = function(city, state) {
  const query = { 
    status: { $in: ['fundraising', 'active'] },
    isActive: true 
  };
  
  if (city) query['location.city'] = new RegExp(city, 'i');
  if (state) query['location.state'] = new RegExp(state, 'i');
  
  return this.find(query).sort({ createdAt: -1 });
};

// Instance methods
investmentSchema.methods.canInvest = function(amount) {
  if (this.status !== 'fundraising') return false;
  if (amount < this.minimumInvestment) return false;
  if (this.raisedAmount + amount > this.totalAmount) return false;
  return true;
};

investmentSchema.methods.updateRaisedAmount = function(amount) {
  this.raisedAmount += amount;
  this.investors += 1;
  
  // Check if fully funded
  if (this.raisedAmount >= this.totalAmount) {
    this.status = 'active';
  }
  
  return this.save();
};

module.exports = mongoose.model('Investment', investmentSchema);
