const defaultNotificationTemplates = [
  {
    name: 'Property Verified',
    type: 'property_verified',
    isActive: true,
    channels: {
      email: {
        enabled: true,
        subject: 'Property Approved - {{propertyTitle}}',
        htmlTemplate: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2d3748;">🎉 Great News!</h2>
            <p>Dear {{userName}},</p>
            <p>Your property "<strong>{{propertyTitle}}</strong>" has been approved and is now live on our marketplace!</p>
            <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Property Details:</h3>
              <p><strong>Location:</strong> {{propertyLocation}}</p>
              <p><strong>Price:</strong> ₦{{propertyPrice}}</p>
              <p><strong>Approved on:</strong> {{verificationDate}}</p>
            </div>
            <p>Your property is now visible to potential buyers and renters. You can manage your listing from your dashboard.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{propertyUrl}}" style="background: #4299e1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Property</a>
            </div>
            <p>Best regards,<br>The Real Estate Team</p>
          </div>
        `,
        textTemplate: 'Great News! Your property "{{propertyTitle}}" has been approved and is now live on our marketplace! Location: {{propertyLocation}}, Price: ₦{{propertyPrice}}. View your property: {{propertyUrl}}'
      },
      inApp: {
        enabled: true,
        title: 'Property Approved',
        message: 'Your property "{{propertyTitle}}" has been approved and is now live!'
      },
      push: {
        enabled: true,
        title: 'Property Approved',
        body: 'Your property "{{propertyTitle}}" is now live on the marketplace!'
      },
      sms: {
        enabled: false
      }
    },
    variables: [
      { name: 'userName', description: "User's full name", required: true },
      { name: 'propertyTitle', description: 'Property title', required: true },
      { name: 'propertyLocation', description: 'Property location', required: true },
      { name: 'propertyPrice', description: 'Property price', required: true },
      { name: 'verificationDate', description: 'Verification date', required: true },
      { name: 'propertyUrl', description: 'Property URL', required: true }
    ]
  },
  {
    name: 'Property Rejected',
    type: 'property_rejected',
    isActive: true,
    channels: {
      email: {
        enabled: true,
        subject: 'Property Review Update - {{propertyTitle}}',
        htmlTemplate: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #e53e3e;">Property Review Update</h2>
            <p>Dear {{userName}},</p>
            <p>We've reviewed your property "<strong>{{propertyTitle}}</strong>" and unfortunately, we cannot approve it at this time.</p>
            <div style="background: #fed7d7; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Review Notes:</h3>
              <p>{{notes}}</p>
              <p><strong>Reviewed on:</strong> {{verificationDate}}</p>
            </div>
            <p>Please address the issues mentioned above and resubmit your property for review. We're here to help you succeed!</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{propertyUrl}}" style="background: #4299e1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Edit Property</a>
            </div>
            <p>Best regards,<br>The Real Estate Team</p>
          </div>
        `,
        textTemplate: 'Property Review Update: Your property "{{propertyTitle}}" needs revisions. Notes: {{notes}}. Please edit and resubmit: {{propertyUrl}}'
      },
      inApp: {
        enabled: true,
        title: 'Property Needs Revision',
        message: 'Your property "{{propertyTitle}}" needs some revisions before approval.'
      },
      push: {
        enabled: true,
        title: 'Property Review Update',
        body: 'Your property "{{propertyTitle}}" needs revisions. Check your dashboard for details.'
      },
      sms: {
        enabled: false
      }
    },
    variables: [
      { name: 'userName', description: "User's full name", required: true },
      { name: 'propertyTitle', description: 'Property title', required: true },
      { name: 'notes', description: 'Rejection notes', required: false },
      { name: 'verificationDate', description: 'Verification date', required: true },
      { name: 'propertyUrl', description: 'Property URL', required: true }
    ]
  },
  {
    name: 'Escrow Created',
    type: 'escrow_created',
    isActive: true,
    channels: {
      email: {
        enabled: true,
        subject: 'New Escrow Transaction - {{propertyTitle}}',
        htmlTemplate: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2d3748;">New Escrow Transaction</h2>
            <p>Dear {{userName}},</p>
            <p>A new escrow transaction has been created for the property "<strong>{{propertyTitle}}</strong>".</p>
            <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Transaction Details:</h3>
              <p><strong>Amount:</strong> ₦{{escrowAmount}}</p>
              <p><strong>Transaction ID:</strong> {{escrowId}}</p>
              <p><strong>Created:</strong> {{createdDate}}</p>
              <p><strong>Expected Completion:</strong> {{expectedCompletion}}</p>
            </div>
            <p>You can track the progress of this transaction in your escrow dashboard.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{escrowUrl}}" style="background: #4299e1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Escrow</a>
            </div>
            <p>Best regards,<br>The Real Estate Team</p>
          </div>
        `,
        textTemplate: 'New Escrow Transaction: Property "{{propertyTitle}}" - Amount: ₦{{escrowAmount}}, Expected completion: {{expectedCompletion}}. View: {{escrowUrl}}'
      },
      inApp: {
        enabled: true,
        title: 'New Escrow Transaction',
        message: 'A new escrow transaction has been created for {{propertyTitle}}'
      },
      push: {
        enabled: true,
        title: 'New Escrow Transaction',
        body: 'New escrow transaction created for {{propertyTitle}} - ₦{{escrowAmount}}'
      },
      sms: {
        enabled: false
      }
    },
    variables: [
      { name: 'userName', description: "User's full name", required: true },
      { name: 'propertyTitle', description: 'Property title', required: true },
      { name: 'escrowAmount', description: 'Escrow amount', required: true },
      { name: 'escrowId', description: 'Escrow transaction ID', required: true },
      { name: 'createdDate', description: 'Creation date', required: true },
      { name: 'expectedCompletion', description: 'Expected completion date', required: true },
      { name: 'escrowUrl', description: 'Escrow URL', required: true }
    ]
  },
  {
    name: 'Escrow Disputed',
    type: 'escrow_disputed',
    isActive: true,
    channels: {
      email: {
        enabled: true,
        subject: 'Escrow Dispute - {{propertyTitle}}',
        htmlTemplate: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #e53e3e;">Escrow Dispute Alert</h2>
            <p>Dear {{userName}},</p>
            <p>An escrow dispute has been filed for the transaction involving "<strong>{{propertyTitle}}</strong>".</p>
            <div style="background: #fed7d7; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Dispute Details:</h3>
              <p><strong>Transaction ID:</strong> {{escrowId}}</p>
              <p><strong>Amount:</strong> ₦{{escrowAmount}}</p>
              <p><strong>Status:</strong> {{status}}</p>
            </div>
            <p>Our admin team will review this dispute and provide a resolution within 24-48 hours.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{escrowUrl}}" style="background: #4299e1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Dispute</a>
            </div>
            <p>Best regards,<br>The Real Estate Team</p>
          </div>
        `,
        textTemplate: 'Escrow Dispute Alert: Transaction {{escrowId}} for {{propertyTitle}} has been disputed. Amount: ₦{{escrowAmount}}. View: {{escrowUrl}}'
      },
      inApp: {
        enabled: true,
        title: 'Escrow Dispute',
        message: 'An escrow dispute has been filed for {{propertyTitle}}'
      },
      push: {
        enabled: true,
        title: 'Escrow Dispute Alert',
        body: 'Dispute filed for {{propertyTitle}} escrow transaction'
      },
      sms: {
        enabled: true,
        message: 'Escrow dispute filed for {{propertyTitle}}. Please review immediately.'
      }
    },
    variables: [
      { name: 'userName', description: "User's full name", required: true },
      { name: 'propertyTitle', description: 'Property title', required: true },
      { name: 'escrowId', description: 'Escrow transaction ID', required: true },
      { name: 'escrowAmount', description: 'Escrow amount', required: true },
      { name: 'status', description: 'Escrow status', required: true },
      { name: 'escrowUrl', description: 'Escrow URL', required: true }
    ]
  },
  {
    name: 'Escrow Resolved',
    type: 'escrow_resolved',
    isActive: true,
    channels: {
      email: {
        enabled: true,
        subject: 'Escrow Dispute Resolved - {{propertyTitle}}',
        htmlTemplate: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #38a169;">Escrow Dispute Resolved</h2>
            <p>Dear {{userName}},</p>
            <p>The escrow dispute for "<strong>{{propertyTitle}}</strong>" has been resolved by our admin team.</p>
            <div style="background: #c6f6d5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Resolution Details:</h3>
              <p><strong>Transaction ID:</strong> {{escrowId}}</p>
              <p><strong>Amount:</strong> ₦{{escrowAmount}}</p>
              <p><strong>Status:</strong> {{status}}</p>
            </div>
            <p>You can view the full resolution details and next steps in your escrow dashboard.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{escrowUrl}}" style="background: #4299e1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Resolution</a>
            </div>
            <p>Best regards,<br>The Real Estate Team</p>
          </div>
        `,
        textTemplate: 'Escrow Dispute Resolved: Transaction {{escrowId}} for {{propertyTitle}} has been resolved. Status: {{status}}. View: {{escrowUrl}}'
      },
      inApp: {
        enabled: true,
        title: 'Escrow Resolved',
        message: 'The escrow dispute for {{propertyTitle}} has been resolved'
      },
      push: {
        enabled: true,
        title: 'Escrow Resolved',
        body: 'Dispute resolved for {{propertyTitle}} escrow transaction'
      },
      sms: {
        enabled: false
      }
    },
    variables: [
      { name: 'userName', description: "User's full name", required: true },
      { name: 'propertyTitle', description: 'Property title', required: true },
      { name: 'escrowId', description: 'Escrow transaction ID', required: true },
      { name: 'escrowAmount', description: 'Escrow amount', required: true },
      { name: 'status', description: 'Escrow status', required: true },
      { name: 'escrowUrl', description: 'Escrow URL', required: true }
    ]
  },
  {
    name: 'User Suspended',
    type: 'user_suspended',
    isActive: true,
    channels: {
      email: {
        enabled: true,
        subject: 'Account Suspension Notice',
        htmlTemplate: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #e53e3e;">Account Suspension Notice</h2>
            <p>Dear {{userName}},</p>
            <p>Your account has been suspended due to a violation of our terms of service.</p>
            <div style="background: #fed7d7; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Suspension Details:</h3>
              <p><strong>Reason:</strong> {{reason}}</p>
              <p><strong>Suspended on:</strong> {{statusDate}}</p>
            </div>
            <p>If you believe this suspension is in error, please contact our support team for assistance.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="mailto:{{supportEmail}}" style="background: #4299e1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Contact Support</a>
            </div>
            <p>Best regards,<br>The Real Estate Team</p>
          </div>
        `,
        textTemplate: 'Account Suspension Notice: Your account has been suspended. Reason: {{reason}}. Contact support: {{supportEmail}}'
      },
      inApp: {
        enabled: true,
        title: 'Account Suspended',
        message: 'Your account has been suspended. Please contact support for assistance.'
      },
      push: {
        enabled: true,
        title: 'Account Suspended',
        body: 'Your account has been suspended. Contact support for assistance.'
      },
      sms: {
        enabled: true,
        message: 'Your PropertyArk account has been suspended. Contact support for assistance.'
      }
    },
    variables: [
      { name: 'userName', description: "User's full name", required: true },
      { name: 'reason', description: 'Suspension reason', required: false },
      { name: 'statusDate', description: 'Suspension date', required: true },
      { name: 'supportEmail', description: 'Support email', required: true }
    ]
  },
  {
    name: 'User Activated',
    type: 'user_activated',
    isActive: true,
    channels: {
      email: {
        enabled: true,
        subject: 'Account Reactivated',
        htmlTemplate: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #38a169;">Account Reactivated</h2>
            <p>Dear {{userName}},</p>
            <p>Great news! Your account has been reactivated and you can now access all features of our platform.</p>
            <div style="background: #c6f6d5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Reactivated on:</strong> {{statusDate}}</p>
            </div>
            <p>Welcome back! You can now continue using our real estate marketplace.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{dashboardUrl}}" style="background: #4299e1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Access Dashboard</a>
            </div>
            <p>Best regards,<br>The Real Estate Team</p>
          </div>
        `,
        textTemplate: 'Account Reactivated: Your account has been reactivated on {{statusDate}}. Welcome back!'
      },
      inApp: {
        enabled: true,
        title: 'Account Reactivated',
        message: 'Your account has been reactivated. Welcome back!'
      },
      push: {
        enabled: true,
        title: 'Account Reactivated',
        body: 'Your account is active again. Welcome back!'
      },
      sms: {
        enabled: false
      }
    },
    variables: [
      { name: 'userName', description: "User's full name", required: true },
      { name: 'statusDate', description: 'Reactivation date', required: true },
      { name: 'dashboardUrl', description: 'Dashboard URL', required: false }
    ]
  }
];

module.exports = defaultNotificationTemplates;
