const mongoose = require('mongoose');

const notificationTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  type: {
    type: String,
    enum: [
      'property_verified',
      'property_rejected',
      'escrow_created',
      'escrow_payment_received',
      'escrow_disputed',
      'escrow_resolved',
      'escrow_completed',
      'escrow_timeout',
      'user_suspended',
      'user_activated',
      'inspection_requested',
      'inspection_scheduled',
      'inspection_completed',
      'investment_opportunity',
      'investment_completed',
      'payment_received',
      'payment_failed',
      'system_maintenance',
      'general'
    ],
    required: true
  },
  channels: {
    email: {
      enabled: {
        type: Boolean,
        default: true
      },
      subject: {
        type: String,
        required: false,
        trim: true
      },
      htmlTemplate: {
        type: String,
        required: false
      },
      textTemplate: {
        type: String,
        required: false
      }
    },
    inApp: {
      enabled: {
        type: Boolean,
        default: true
      },
      title: {
        type: String,
        required: true,
        trim: true
      },
      message: {
        type: String,
        required: true,
        trim: true
      }
    },
    sms: {
      enabled: {
        type: Boolean,
        default: false
      },
      message: {
        type: String,
        required: false,
        trim: true
      }
    },
    push: {
      enabled: {
        type: Boolean,
        default: true
      },
      title: {
        type: String,
        required: false,
        trim: true
      },
      body: {
        type: String,
        required: false,
        trim: true
      }
    }
  },
  variables: [{
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: false
    },
    required: {
      type: Boolean,
      default: false
    }
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  expiresAfter: {
    type: Number, // in hours
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
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

// Pre-save middleware to update the updatedAt field
notificationTemplateSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to get template by type
notificationTemplateSchema.statics.getByType = function(type) {
  return this.findOne({ type, isActive: true });
};

// Instance method to render template with variables
notificationTemplateSchema.methods.render = function(variables = {}) {
  const result = {
    channels: {}
  };

  // Render email template
  if (this.channels.email.enabled) {
    result.channels.email = {
      subject: this.renderString(this.channels.email.subject, variables),
      htmlTemplate: this.renderString(this.channels.email.htmlTemplate, variables),
      textTemplate: this.renderString(this.channels.email.textTemplate, variables)
    };
  }

  // Render in-app template
  if (this.channels.inApp.enabled) {
    result.channels.inApp = {
      title: this.renderString(this.channels.inApp.title, variables),
      message: this.renderString(this.channels.inApp.message, variables)
    };
  }

  // Render SMS template
  if (this.channels.sms.enabled) {
    result.channels.sms = {
      message: this.renderString(this.channels.sms.message, variables)
    };
  }

  // Render push notification template
  if (this.channels.push.enabled) {
    result.channels.push = {
      title: this.renderString(this.channels.push.title, variables),
      body: this.renderString(this.channels.push.body, variables)
    };
  }

  return result;
};

// Helper method to render string with variables
notificationTemplateSchema.methods.renderString = function(template, variables) {
  if (!template) return '';
  
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] || match;
  });
};

module.exports = mongoose.model('NotificationTemplate', notificationTemplateSchema);
