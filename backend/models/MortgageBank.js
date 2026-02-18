// Deprecated Mongoose MortgageBank model removed — use Sequelize `models/sequelize/MortgageBank.js` instead.
module.exports = null; // legacy model removed
  name: {
    type: String,
    required: [true, 'Bank name is required'],
    trim: true,
    maxlength: [200, 'Bank name cannot exceed 200 characters']
  },
  registrationNumber: {
    type: String,
    required: [true, 'Registration number is required'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
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
    country: {
      type: String,
      required: [true, 'Country is required'],
      default: 'Nigeria',
      trim: true
    },
    zipCode: {
      type: String,
      trim: true
    }
  },
  contactPerson: {
    firstName: {
      type: String,
      required: [true, 'Contact person first name is required'],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, 'Contact person last name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Contact person email is required'],
      lowercase: true
    },
    phone: {
      type: String,
      required: [true, 'Contact person phone is required'],
      trim: true
    },
    position: {
      type: String,
      required: [true, 'Contact person position is required'],
      trim: true
    }
  },
  documents: [{
    type: {
      type: String,
      enum: ['license', 'registration', 'tax_certificate', 'other'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date
  },
  verificationNotes: {
    type: String,
    maxlength: [1000, 'Verification notes cannot exceed 1000 characters']
  },
  isActive: {
    type: Boolean,
    default: false  // Only active after admin approval
  },
  userAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    unique: true,
    sparse: true  // Allow null initially, but unique when set
  },
  mortgageProducts: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    minLoanAmount: {
      type: Number,
      required: true,
      min: [0, 'Minimum loan amount cannot be negative']
    },
    maxLoanAmount: {
      type: Number,
      required: true,
      min: [0, 'Maximum loan amount cannot be negative']
    },
    minDownPaymentPercent: {
      type: Number,
      required: true,
      min: [0, 'Down payment percent cannot be negative'],
      max: [100, 'Down payment percent cannot exceed 100']
    },
    maxLoanTerm: {
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
    interestRateType: {
      type: String,
      enum: ['fixed', 'variable', 'adjustable'],
      default: 'fixed'
    },
    eligibilityCriteria: {
      minMonthlyIncome: {
        type: Number,
        min: [0, 'Minimum monthly income cannot be negative']
      },
      minCreditScore: {
        type: Number,
        min: [0, 'Credit score cannot be negative'],
        max: [1000, 'Credit score cannot exceed 1000']
      },
      employmentDuration: {
        type: Number,
        min: [0, 'Employment duration cannot be negative']
      }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  statistics: {
    totalApplications: {
      type: Number,
      default: 0
    },
    approvedApplications: {
      type: Number,
      default: 0
    },
    rejectedApplications: {
      type: Number,
      default: 0
    },
    activeMortgages: {
      type: Number,
      default: 0
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
});

// Update the updatedAt field before saving
mortgageBankSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for faster queries
mortgageBankSchema.index({ verificationStatus: 1, isActive: 1 });
mortgageBankSchema.index({ userAccount: 1 });
mortgageBankSchema.index({ email: 1 });

// Virtual for full address
mortgageBankSchema.virtual('fullAddress').get(function() {
  const parts = [
    this.address.street,
    this.address.city,
    this.address.state,
    this.address.country
  ].filter(Boolean);
  return parts.join(', ');
});

// Ensure virtual fields are serialized
mortgageBankSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('MortgageBank', mortgageBankSchema);

