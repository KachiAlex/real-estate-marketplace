const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Property title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Property description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Property price is required'],
    min: [0, 'Price cannot be negative']
  },
  type: {
    type: String,
    required: [true, 'Property type is required'],
    enum: ['house', 'apartment', 'condo', 'townhouse', 'land', 'commercial']
  },
  status: {
    type: String,
    enum: ['for-sale', 'for-rent', 'sold', 'rented'],
    default: 'for-sale'
  },
  location: {
    address: {
      type: String,
      required: [true, 'Address is required']
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: {
      type: String,
      required: [true, 'State is required']
    },
    zipCode: {
      type: String,
      required: [true, 'ZIP code is required']
    },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  details: {
    bedrooms: {
      type: Number,
      required: [true, 'Number of bedrooms is required'],
      min: [0, 'Bedrooms cannot be negative']
    },
    bathrooms: {
      type: Number,
      required: [true, 'Number of bathrooms is required'],
      min: [0, 'Bathrooms cannot be negative']
    },
    sqft: {
      type: Number,
      required: [true, 'Square footage is required'],
      min: [0, 'Square footage cannot be negative']
    },
    lotSize: Number,
    yearBuilt: Number,
    parking: {
      type: String,
      enum: ['none', 'street', 'garage', 'covered']
    }
  },
  amenities: [{
    type: String,
    enum: [
      'Parking', 'Garden', 'Balcony', 'Pool', 'Gym', 'Security', 
      'Air Conditioning', 'Heating', 'Fireplace', 'Dishwasher', 
      'Washer/Dryer', 'Hardwood Floors', 'Walk-in Closet', 'Patio'
    ]
  }],
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: String,
    caption: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  features: {
    isFeatured: {
      type: Boolean,
      default: false
    },
    isNew: {
      type: Boolean,
      default: true
    },
    isInvestment: {
      type: Boolean,
      default: false
    }
  },
  investment: {
    title: String,
    roiPercent: Number,
    durationUnit: { type: String, enum: ['monthly', 'annually'] },
    durationValue: Number,
    minAmount: Number,
    payoutSchedule: { type: String, enum: ['monthly', 'quarterly', 'annually', 'end-of-term'] },
    riskLevel: { type: String, enum: ['low', 'medium', 'high'] },
    redemptionTerms: String,
    startDate: Date,
    maturityDate: Date,
    summary: String
  },
  investmentDocuments: [{
    url: String,
    name: String,
    type: String,
    size: Number
  }],
  financial: {
    monthlyRent: Number,
    annualTaxes: Number,
    hoaFees: Number,
    estimatedMortgage: Number
  },
  views: {
    type: Number,
    default: 0
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
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
  inquiries: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    contactInfo: {
      email: String,
      phone: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
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

// Index for search functionality
propertySchema.index({
  title: 'text',
  description: 'text',
  'location.city': 'text',
  'location.state': 'text'
});

// Virtual for formatted price
propertySchema.virtual('formattedPrice').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(this.price);
});

// Virtual for property status
propertySchema.virtual('isAvailable').get(function() {
  return this.status === 'for-sale' || this.status === 'for-rent';
});

// Ensure virtual fields are serialized
propertySchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Property', propertySchema); 