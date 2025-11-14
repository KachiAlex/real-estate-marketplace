const nodemailer = require('nodemailer');
const NotificationTemplate = require('../models/NotificationTemplate');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      // Create transporter based on environment
      if (process.env.NODE_ENV === 'production') {
        // Production email service (e.g., SendGrid, AWS SES)
        this.transporter = nodemailer.createTransport({
          service: process.env.EMAIL_SERVICE || 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
          }
        });
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
      }
    } catch (error) {
      console.error('Failed to initialize email transporter:', error);
    }
  }

  async sendEmail(to, subject, html, text, options = {}) {
    try {
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@realestate.com',
        to,
        subject,
        html,
        text,
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
