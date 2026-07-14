// Deprecated Mongoose User model removed — use Sequelize `models/sequelize/User.js` instead.
module.exports = null; // legacy model removed
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