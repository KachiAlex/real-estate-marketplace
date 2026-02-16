const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  phone: {
    type: String,
    match: [/^(\+0?1\s)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/, 'Please enter a valid phone number']
  },
  avatar: {
    type: String,
    default: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg'
  },
  role: {
    type: String,
    enum: ['user', 'agent', 'admin', 'mortgage_bank', 'vendor'],
    default: 'user'
  },
  roles: [{
    type: String,
    enum: ['buyer', 'vendor', 'admin', 'mortgage_bank'],
    default: ['buyer']
  }],
  vendorProfile: {
    businessName: String,
    businessType: String,
    licenseNumber: String,
    isAgent: Boolean,
    isPropertyOwner: Boolean,
    experience: String,
    specializations: [String],
    contactInfo: {
      phone: String,
      address: String
    },
    kycStatus: {
      type: String,
      enum: ['pending', 'under_review', 'approved', 'rejected'],
      default: 'pending'
    },
    kycDocuments: [{
      type: {
        type: String, // 'nin', 'business_license', 'address_proof'
        required: true
      },
      documentNumber: String,
      fileUrl: String,
      status: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
      },
      uploadedAt: { type: Date, default: Date.now },
      verifiedAt: Date,
      verifiedBy: mongoose.Schema.Types.ObjectId,
      rejectionReason: String
    }],
    subscription: {
      isActive: { type: Boolean, default: false },
      planType: { type: String, default: 'monthly' },
      amount: { type: Number, default: 50000 }, // NGN
      lastPaid: Date,
      nextDue: Date,
      paymentHistory: [{
        amount: Number,
        paidAt: Date,
        reference: String,
        status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
        paymentMethod: String
      }],
      suspensionDate: Date,
      suspensionReason: String,
      gracePeriodEnd: Date
    },
    onboardingComplete: { type: Boolean, default: false },
    joinedDate: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  suspendedAt: {
    type: Date
  },
  suspendedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  activatedAt: {
    type: Date
  },
  activatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verificationToken: String,
  verificationExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  verificationNotes: {
    type: String,
    maxlength: [500, 'Verification notes cannot exceed 500 characters']
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true }
    },
    searchPreferences: {
      minPrice: { type: Number, default: 0 },
      maxPrice: { type: Number, default: 1000000 },
      propertyTypes: [{ type: String }],
      locations: [{ type: String }]
    }
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  }],
  mortgageBankProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MortgageBank'
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

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema); 