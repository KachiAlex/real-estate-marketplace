const nodemailer = require('nodemailer');
const NotificationTemplate = require('../models/NotificationTemplate');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      // Priority: SendGrid > Custom SMTP > Ethereal (development)
      
      // Check if SendGrid API key is configured
      if (process.env.SENDGRID_API_KEY) {
        // Use SendGrid SMTP
        this.transporter = nodemailer.createTransport({
          host: 'smtp.sendgrid.net',
          port: 587,
          secure: false, // true for 465, false for other ports
          auth: {
            user: 'apikey', // SendGrid requires 'apikey' as username
            pass: process.env.SENDGRID_API_KEY
          }
        });
        console.log('✅ Email service initialized with SendGrid');
      } else if (process.env.EMAIL_SERVICE && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
        // Use custom SMTP (Gmail, etc.)
        this.transporter = nodemailer.createTransport({
          service: process.env.EMAIL_SERVICE,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
          }
        });
        console.log(`✅ Email service initialized with ${process.env.EMAIL_SERVICE}`);
      } else if (process.env.NODE_ENV === 'production') {
        // Production but no email config - log warning
        console.warn('⚠️  No email service configured for production. Please set SENDGRID_API_KEY or EMAIL_SERVICE, EMAIL_USER, EMAIL_PASSWORD');
      } else {
        // Development - use ethereal email for testing
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: process.env.ETHEREAL_USER || 'ethereal.user@ethereal.email',
            pass: process.env.ETHEREAL_PASSWORD || 'ethereal.password'
          }
        });
        console.log('📧 Email service initialized with Ethereal (development/testing)');
      }
    } catch (error) {
      console.error('❌ Failed to initialize email transporter:', error);
    }
  }

  async sendEmail(to, subject, html, text, options = {}) {
    try {
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      // Format sender email with name for better deliverability
      const emailFrom = process.env.EMAIL_FROM || 'PropertyArk <noreply@realestate.com>';
      const senderName = process.env.EMAIL_FROM_NAME || 'PropertyArk';
      const senderEmail = emailFrom.includes('<') 
        ? emailFrom 
        : `${senderName} <${emailFrom}>`;

      const mailOptions = {
        from: senderEmail,
        to,
        subject,
        html,
        text,
        // Add headers for better deliverability
        headers: {
          'X-Entity-Ref-ID': Date.now().toString(),
          'X-Mailer': 'PropertyArk Platform'
        },
        ...options
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      
      return {
        success: true,
        messageId: result.messageId,
        response: result.response
      };
    } catch (error) {
      console.error('Failed to send email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendTemplateEmail(recipient, templateType, variables = {}) {
    try {
      // Get the template
      const template = await NotificationTemplate.getByType(templateType);
      if (!template || !template.channels.email.enabled) {
        throw new Error(`Email template not found or disabled for type: ${templateType}`);
      }

      // Render the template with variables
      const rendered = template.render(variables);
      
      if (!rendered.channels.email) {
        throw new Error('Email template not properly configured');
      }

      // Send the email
      const result = await this.sendEmail(
        recipient.email,
        rendered.channels.email.subject,
        rendered.channels.email.htmlTemplate,
        rendered.channels.email.textTemplate
      );

      return result;
    } catch (error) {
      console.error('Failed to send template email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendBulkEmails(recipients, templateType, variables = {}) {
    try {
      const results = [];
      
      for (const recipient of recipients) {
        const result = await this.sendTemplateEmail(recipient, templateType, variables);
        results.push({
          recipient: recipient.email,
          ...result
        });
      }

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      return {
        success: failed === 0,
        total: recipients.length,
        successful,
        failed,
        results
      };
    } catch (error) {
      console.error('Failed to send bulk emails:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendPropertyVerificationEmail(property, user, isApproved, notes = '') {
    const variables = {
      userName: `${user.firstName} ${user.lastName}`,
      propertyTitle: property.title,
      propertyLocation: property.location,
      propertyPrice: property.price?.toLocaleString(),
      isApproved: isApproved,
      notes: notes,
      verificationDate: new Date().toLocaleDateString(),
      propertyUrl: `${process.env.FRONTEND_URL}/properties/${property._id}`
    };

    return await this.sendTemplateEmail(
      user,
      isApproved ? 'property_verified' : 'property_rejected',
      variables
    );
  }

  async sendEscrowNotificationEmail(escrow, user, type) {
    const variables = {
      userName: `${user.firstName} ${user.lastName}`,
      propertyTitle: escrow.propertyId?.title || 'Property',
      escrowAmount: escrow.amount?.toLocaleString(),
      escrowId: escrow._id,
      status: escrow.status,
      createdDate: escrow.createdAt?.toLocaleDateString(),
      expectedCompletion: escrow.expectedCompletion?.toLocaleDateString(),
      escrowUrl: `${process.env.FRONTEND_URL}/escrow/${escrow._id}`
    };

    return await this.sendTemplateEmail(user, type, variables);
  }

  async sendUserStatusEmail(user, isSuspended, reason = '') {
    const variables = {
      userName: `${user.firstName} ${user.lastName}`,
      isSuspended: isSuspended,
      reason: reason,
      statusDate: new Date().toLocaleDateString(),
      supportEmail: process.env.SUPPORT_EMAIL || 'support@realestate.com'
    };

    return await this.sendTemplateEmail(
      user,
      isSuspended ? 'user_suspended' : 'user_activated',
      variables
    );
  }

  async sendInvestmentNotificationEmail(investment, user, type) {
    const variables = {
      userName: `${user.firstName} ${user.lastName}`,
      propertyTitle: investment.propertyId?.title || 'Property',
      investmentAmount: investment.amount?.toLocaleString(),
      investmentId: investment._id,
      expectedReturn: investment.expectedReturn,
      investmentUrl: `${process.env.FRONTEND_URL}/investments/${investment._id}`
    };

    return await this.sendTemplateEmail(user, type, variables);
  }

  async sendSystemMaintenanceEmail(users, maintenanceMessage, scheduledTime) {
    const variables = {
      maintenanceMessage: maintenanceMessage,
      scheduledTime: scheduledTime?.toLocaleString(),
      supportEmail: process.env.SUPPORT_EMAIL || 'support@realestate.com'
    };

    return await this.sendBulkEmails(users, 'system_maintenance', variables);
  }

  async verifyConnection() {
    try {
      if (!this.transporter) {
        return { success: false, error: 'Transporter not initialized' };
      }

      await this.transporter.verify();
      return { success: true, message: 'Email service is ready' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get preview URL for ethereal emails (development only)
  async getPreviewUrl(messageId) {
    if (process.env.NODE_ENV === 'production') {
      return null;
    }

    try {
      const previewUrl = nodemailer.getTestMessageUrl(messageId);
      return previewUrl;
    } catch (error) {
      console.error('Failed to get preview URL:', error);
      return null;
    }
  }
}

// Create and export singleton instance
const emailService = new EmailService();
module.exports = emailService;
