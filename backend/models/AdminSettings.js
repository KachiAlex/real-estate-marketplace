// Deprecated Mongoose AdminSettings model removed — use Sequelize `models/sequelize/AdminSettings.js` instead.
module.exports = null; // legacy model removed

const adminSettingsSchema = new mongoose.Schema({
  verificationFee: {
    type: Number,
    required: true,
    default: 50000,
    min: [0, 'Verification fee cannot be negative']
  },
  vendorListingFee: {
    type: Number,
    required: true,
    default: 100000,
    min: [0, 'Vendor listing fee cannot be negative']
  },
  escrowTimeoutDays: {
    type: Number,
    required: true,
    default: 7,
    min: [1, 'Escrow timeout must be at least 1 day']
  },
  platformFee: {
    type: Number,
    default: 0.025, // 2.5% default platform fee
    min: [0, 'Platform fee cannot be negative'],
    max: [1, 'Platform fee cannot exceed 100%']
  },
  maxFileSize: {
    type: Number,
    default: 10485760, // 10MB in bytes
    min: [1048576, 'Max file size must be at least 1MB'] // 1MB minimum
  },
  allowedFileTypes: {
    type: [String],
    default: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  },
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  maintenanceMessage: {
    type: String,
    maxlength: [500, 'Maintenance message cannot exceed 500 characters']
  },
  emailNotifications: {
    type: Boolean,
    default: true
  },
  smsNotifications: {
    type: Boolean,
    default: false
  },
  autoApproveProperties: {
    type: Boolean,
    default: false
  },
  autoApproveUsers: {
    type: Boolean,
    default: false
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

// Ensure only one settings document exists
adminSettingsSchema.index({}, { unique: true });

module.exports = mongoose.model('AdminSettings', adminSettingsSchema);
