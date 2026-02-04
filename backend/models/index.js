const { DataTypes } = require('sequelize');

/**
 * PostgreSQL Schema Definitions
 * Converted from Firestore collections to relational tables
 */

// User Model
const User = (sequelize) => {
  return sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      lowercase: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true // null for OAuth users
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: DataTypes.STRING,
    avatar: DataTypes.STRING,
    role: {
      type: DataTypes.ENUM('user', 'admin', 'vendor', 'mortgage_bank', 'investor'),
      defaultValue: 'user'
    },
    roles: {
      type: DataTypes.JSON,
      defaultValue: ['user']
    },
    activeRole: {
      type: DataTypes.STRING,
      defaultValue: 'user'
    },
    provider: {
      type: DataTypes.STRING,
      defaultValue: 'email' // 'email', 'google', 'facebook'
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    kycStatus: {
      type: DataTypes.STRING,
      defaultValue: 'pending' // 'pending', 'verified', 'rejected'
    },
    userCode: DataTypes.STRING,
    vendorCode: DataTypes.STRING,
    // Profile fields
    gender: DataTypes.STRING,
    occupation: DataTypes.STRING,
    company: DataTypes.STRING,
    address: DataTypes.JSON,
    bankDetails: DataTypes.JSON,
    // Vendor specific
    vendorCategory: DataTypes.STRING, // 'agent', 'property_owner'
    vendorData: DataTypes.JSON,
    // Timestamps
    lastLogin: DataTypes.DATE,
    lastSeen: DataTypes.DATE,
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: true,
    underscored: true
  });
};

// Property Model
const Property = (sequelize) => {
  return sequelize.define('Property', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: DataTypes.TEXT,
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Users', key: 'id' }
    },
    ownerEmail: DataTypes.STRING,
    // Location
    location: DataTypes.JSON,
    city: DataTypes.STRING,
    state: DataTypes.STRING,
    address: DataTypes.STRING,
    // Property details
    category: DataTypes.STRING, // 'residential', 'commercial'
    type: DataTypes.STRING, // 'apartment', 'house', 'land'
    bedrooms: DataTypes.INTEGER,
    bathrooms: DataTypes.FLOAT,
    area: DataTypes.FLOAT, // sqft
    // Financial
    price: DataTypes.BIGINT,
    currency: DataTypes.STRING,
    monthly_rent: DataTypes.BIGINT,
    annual_taxes: DataTypes.BIGINT,
    hoa_fees: DataTypes.BIGINT,
    // Images
    images: DataTypes.JSON,
    featuredImage: DataTypes.STRING,
    coverImage: DataTypes.STRING,
    // Status
    status: {
      type: DataTypes.ENUM('active', 'sold', 'rented', 'unlisted', 'pending'),
      defaultValue: 'active'
    },
    approvalStatus: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    },
    verificationStatus: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    },
    // Engagement metrics
    views: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    inquiries_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    favorites_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // Investment
    is_investment: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    investment_data: DataTypes.JSON,
    // Documents
    documents: DataTypes.JSON,
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['ownerId'] },
      { fields: ['status'] },
      { fields: ['city'] },
      { fields: ['type'] }
    ]
  });
};

// Escrow Transaction Model
const EscrowTransaction = (sequelize) => {
  return sequelize.define('EscrowTransaction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    propertyId: {
      type: DataTypes.UUID,
      references: { model: 'Properties', key: 'id' }
    },
    buyerId: {
      type: DataTypes.UUID,
      references: { model: 'Users', key: 'id' }
    },
    sellerId: {
      type: DataTypes.UUID,
      references: { model: 'Users', key: 'id' }
    },
    amount: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'NGN'
    },
    status: {
      type: DataTypes.ENUM('initiated', 'pending', 'active', 'completed', 'cancelled', 'disputed', 'refunded'),
      defaultValue: 'initiated'
    },
    type: DataTypes.STRING, // 'sale', 'rent'
    paymentMethod: DataTypes.STRING,
    // Fee details
    fees: DataTypes.JSON,
    totalFees: DataTypes.BIGINT,
    // Documents
    documents: DataTypes.JSON,
    // Timeline
    timeline: DataTypes.JSON,
    // Notifications
    buyerNotified: DataTypes.BOOLEAN,
    sellerNotified: DataTypes.BOOLEAN,
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['buyerId', 'status'] },
      { fields: ['sellerId', 'status'] },
      { fields: ['propertyId'] }
    ]
  });
};

// Investment Model
const Investment = (sequelize) => {
  return sequelize.define('Investment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    propertyId: {
      type: DataTypes.UUID,
      references: { model: 'Properties', key: 'id' }
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: DataTypes.TEXT,
    totalAmount: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    raisedAmount: {
      type: DataTypes.BIGINT,
      defaultValue: 0
    },
    minimumInvestment: DataTypes.BIGINT,
    expectedReturn: DataTypes.FLOAT,
    riskLevel: DataTypes.STRING, // 'low', 'medium', 'high'
    duration: DataTypes.INTEGER, // months
    payoutSchedule: DataTypes.STRING,
    status: {
      type: DataTypes.ENUM('fundraising', 'active', 'completed', 'cancelled'),
      defaultValue: 'fundraising'
    },
    investorCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    documents: DataTypes.JSON,
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['status'] },
      { fields: ['propertyId'] }
    ]
  });
};

// User Investment Model
const UserInvestment = (sequelize) => {
  return sequelize.define('UserInvestment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Users', key: 'id' }
    },
    investmentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Investments', key: 'id' }
    },
    amount: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    shares: DataTypes.FLOAT,
    status: {
      type: DataTypes.ENUM('pending', 'active', 'completed', 'cancelled'),
      defaultValue: 'active'
    },
    investmentDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['investmentId'] }
    ]
  });
};

// Mortgage Application Model
const MortgageApplication = (sequelize) => {
  return sequelize.define('MortgageApplication', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    propertyId: {
      type: DataTypes.UUID,
      references: { model: 'Properties', key: 'id' }
    },
    userId: {
      type: DataTypes.UUID,
      references: { model: 'Users', key: 'id' }
    },
    mortgageBankId: {
      type: DataTypes.UUID,
      references: { model: 'MortgageBanks', key: 'id' }
    },
    loanAmount: DataTypes.BIGINT,
    downPayment: DataTypes.BIGINT,
    interestRate: DataTypes.FLOAT,
    loanTermYears: DataTypes.INTEGER,
    status: {
      type: DataTypes.ENUM('pending', 'under_review', 'approved', 'rejected', 'active', 'completed'),
      defaultValue: 'pending'
    },
    bankReview: DataTypes.JSON,
    documents: DataTypes.JSON,
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['mortgageBankId'] },
      { fields: ['status'] }
    ]
  });
};

// Mortgage Model
const Mortgage = (sequelize) => {
  return sequelize.define('Mortgage', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    applicationId: {
      type: DataTypes.UUID,
      references: { model: 'MortgageApplications', key: 'id' }
    },
    userId: {
      type: DataTypes.UUID,
      references: { model: 'Users', key: 'id' }
    },
    propertyId: {
      type: DataTypes.UUID,
      references: { model: 'Properties', key: 'id' }
    },
    loanAmount: DataTypes.BIGINT,
    interestRate: DataTypes.FLOAT,
    loanTermYears: DataTypes.INTEGER,
    monthlyPayment: DataTypes.BIGINT,
    startDate: DataTypes.DATE,
    nextPaymentDate: DataTypes.DATE,
    status: {
      type: DataTypes.ENUM('active', 'completed', 'defaulted'),
      defaultValue: 'active'
    },
    totalPayments: DataTypes.INTEGER,
    paymentsMade: DataTypes.INTEGER,
    remainingBalance: DataTypes.BIGINT,
    paymentHistory: DataTypes.JSON,
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['propertyId'] }
    ]
  });
};

// Mortgage Bank Model
const MortgageBank = (sequelize) => {
  return sequelize.define('MortgageBank', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      references: { model: 'Users', key: 'id' }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    phone: DataTypes.STRING,
    contactPerson: DataTypes.STRING,
    registrationNumber: DataTypes.STRING,
    verificationStatus: {
      type: DataTypes.ENUM('pending', 'verified', 'rejected'),
      defaultValue: 'pending'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    mortgageProducts: DataTypes.JSON,
    stats: DataTypes.JSON,
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: true,
    underscored: true
  });
};

// Blog Model
const Blog = (sequelize) => {
  return sequelize.define('Blog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING,
      unique: true
    },
    content: DataTypes.TEXT,
    excerpt: DataTypes.STRING,
    authorId: {
      type: DataTypes.UUID,
      references: { model: 'Users', key: 'id' }
    },
    featuredImage: DataTypes.STRING,
    category: DataTypes.STRING,
    tags: DataTypes.JSON,
    status: {
      type: DataTypes.ENUM('draft', 'published', 'archived'),
      defaultValue: 'draft'
    },
    viewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    likes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    comments: DataTypes.JSON,
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['authorId'] },
      { fields: ['status'] },
      { fields: ['slug'] }
    ]
  });
};

// Support Inquiry Model
const SupportInquiry = (sequelize) => {
  return sequelize.define('SupportInquiry', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      references: { model: 'Users', key: 'id' }
    },
    email: DataTypes.STRING,
    subject: DataTypes.STRING,
    message: DataTypes.TEXT,
    category: DataTypes.STRING,
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium'
    },
    status: {
      type: DataTypes.ENUM('open', 'in_progress', 'resolved', 'closed'),
      defaultValue: 'open'
    },
    attachments: DataTypes.JSON,
    responses: DataTypes.JSON,
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['status'] }
    ]
  });
};

// Property Verification Application Model
const VerificationApplication = (sequelize) => {
  return sequelize.define('VerificationApplication', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    propertyId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Properties', key: 'id' }
    },
    vendorId: {
      type: DataTypes.UUID,
      references: { model: 'Users', key: 'id' }
    },
    badgeType: DataTypes.STRING,
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'completed', 'failed'),
      defaultValue: 'pending'
    },
    verificationStatus: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    },
    documents: DataTypes.JSON,
    notes: DataTypes.TEXT,
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['propertyId'] },
      { fields: ['vendorId'] },
      { fields: ['verificationStatus'] }
    ]
  });
};

// Message Model
const Message = (sequelize) => {
  return sequelize.define('Message', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    senderId: {
      type: DataTypes.UUID,
      references: { model: 'Users', key: 'id' }
    },
    recipientId: {
      type: DataTypes.UUID,
      references: { model: 'Users', key: 'id' }
    },
    propertyId: {
      type: DataTypes.UUID,
      references: { model: 'Properties', key: 'id' }
    },
    message: DataTypes.TEXT,
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    readAt: DataTypes.DATE,
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['senderId'] },
      { fields: ['recipientId'] },
      { fields: ['isRead'] }
    ]
  });
};

// Notification Model
const Notification = (sequelize) => {
  return sequelize.define('Notification', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Users', key: 'id' }
    },
    type: DataTypes.STRING, // 'message', 'property', 'payment', etc.
    title: DataTypes.STRING,
    message: DataTypes.TEXT,
    data: DataTypes.JSON,
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    readAt: DataTypes.DATE,
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: false,
    underscored: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['isRead'] }
    ]
  });
};

// Saved Property Model (Favorites)
const SavedProperty = (sequelize) => {
  return sequelize.define('SavedProperty', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Users', key: 'id' }
    },
    propertyId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Properties', key: 'id' }
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['userId', 'propertyId'], unique: true }
    ]
  });
};

// Property Inquiry Model
const PropertyInquiry = (sequelize) => {
  return sequelize.define('PropertyInquiry', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    propertyId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Properties', key: 'id' }
    },
    buyerId: {
      type: DataTypes.UUID,
      references: { model: 'Users', key: 'id' }
    },
    buyerEmail: DataTypes.STRING,
    buyerPhone: DataTypes.STRING,
    message: DataTypes.TEXT,
    status: {
      type: DataTypes.ENUM('new', 'contacted', 'viewed', 'closed'),
      defaultValue: 'new'
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['propertyId'] },
      { fields: ['buyerId'] },
      { fields: ['status'] }
    ]
  });
};

// Property Alert Model
const PropertyAlert = (sequelize) => {
  return sequelize.define('PropertyAlert', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Users', key: 'id' }
    },
    alertName: DataTypes.STRING,
    criteria: DataTypes.JSON, // {city, type, minPrice, maxPrice, etc}
    frequency: {
      type: DataTypes.ENUM('daily', 'weekly', 'monthly'),
      defaultValue: 'daily'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    lastNotified: DataTypes.DATE,
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['userId'] }
    ]
  });
};

// Dispute Resolution Model
const DisputeResolution = (sequelize) => {
  return sequelize.define('DisputeResolution', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    escrowId: {
      type: DataTypes.UUID,
      references: { model: 'EscrowTransactions', key: 'id' }
    },
    initiatedBy: {
      type: DataTypes.UUID,
      references: { model: 'Users', key: 'id' }
    },
    reason: DataTypes.TEXT,
    status: {
      type: DataTypes.ENUM('open', 'in_review', 'resolved', 'escalated'),
      defaultValue: 'open'
    },
    resolution: DataTypes.TEXT,
    documents: DataTypes.JSON,
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['escrowId'] },
      { fields: ['status'] }
    ]
  });
};

// Inspection Request Model
const InspectionRequest = (sequelize) => {
  return sequelize.define('InspectionRequest', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    propertyId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Properties', key: 'id' }
    },
    requesterId: {
      type: DataTypes.UUID,
      references: { model: 'Users', key: 'id' }
    },
    inspectorId: {
      type: DataTypes.UUID,
      references: { model: 'Users', key: 'id' }
    },
    requestDate: DataTypes.DATE,
    inspectionDate: DataTypes.DATE,
    status: {
      type: DataTypes.ENUM('requested', 'scheduled', 'completed', 'cancelled'),
      defaultValue: 'requested'
    },
    notes: DataTypes.TEXT,
    report: DataTypes.JSON,
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['propertyId'] },
      { fields: ['requesterId'] },
      { fields: ['status'] }
    ]
  });
};

module.exports = {
  User,
  Property,
  EscrowTransaction,
  Investment,
  UserInvestment,
  MortgageApplication,
  Mortgage,
  MortgageBank,
  Blog,
  SupportInquiry,
  VerificationApplication,
  Message,
  Notification,
  SavedProperty,
  PropertyInquiry,
  PropertyAlert,
  DisputeResolution,
  InspectionRequest
};
