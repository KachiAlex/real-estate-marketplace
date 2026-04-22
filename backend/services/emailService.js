const nodemailer = require('nodemailer');
const notificationTemplateService = require('./notificationTemplateService');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isDisabled = String(process.env.DISABLE_EMAIL).toLowerCase() === 'true';
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      if (this.isDisabled) {
        console.log('📪 Email service disabled via DISABLE_EMAIL flag. All emails will be skipped.');
        return;
      }
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
        // Development/testing fallback - use in-memory transport to avoid network calls
        this.transporter = nodemailer.createTransport({
          jsonTransport: true
        });
        console.log('📧 Email service initialized with JSON transport (development/testing mock).');
      }
    } catch (error) {
      console.error('❌ Failed to initialize email transporter:', error);
    }
  }

  async sendEmail(to, subject, html, text, options = {}) {
    try {
      if (this.isDisabled) {
        console.log(`[Email disabled] Would send to ${to}: ${subject}`);
        return {
          success: true,
          messageId: 'disabled',
          response: 'Email sending disabled'
        };
      }
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
      const template = await notificationTemplateService.getTemplateByType(templateType);
      if (!template || !template.channels?.email?.enabled) {
        throw new Error(`Email template not found or disabled for type: ${templateType}`);
      }

      const rendered = notificationTemplateService.renderTemplate(template, variables);

      if (!rendered.channels.email) {
        throw new Error('Email template not properly configured');
      }

      return await this.sendEmail(
        recipient.email,
        rendered.channels.email.subject,
        rendered.channels.email.htmlTemplate,
        rendered.channels.email.textTemplate
      );
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

  /**
   * Send email notification for new mortgage application (to bank)
   * @param {Object} application - MortgageApplication object
   * @param {Object} bankUser - User object for the mortgage bank
   * @param {Object} property - Property object
   * @param {Object} buyer - User object for the buyer
   */
  async sendNewMortgageApplicationEmail(application, bankUser, property, buyer) {
    try {
      // Format currency values
      const requestedAmount = application.requestedAmount?.toLocaleString('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0
      }) || '₦0';

      const downPayment = application.downPayment?.toLocaleString('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0
      }) || '₦0';

      const monthlyPayment = application.estimatedMonthlyPayment?.toLocaleString('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0
      }) || '₦0';

      // Create email content
      const subject = `New Mortgage Application - ${property.title || 'Property'}`;
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Mortgage Application</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">New Mortgage Application</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Hello ${bankUser.firstName || 'Bank Representative'},</p>
            
            <p>A new mortgage application has been submitted to your bank. Please review the details below:</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h2 style="margin-top: 0; color: #667eea;">Application Details</h2>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; width: 40%;">Application ID:</td>
                  <td style="padding: 8px 0;">${application._id}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Property:</td>
                  <td style="padding: 8px 0;">${property.title || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Location:</td>
                  <td style="padding: 8px 0;">${property.location || property.city && property.state ? `${property.city}, ${property.state}` : 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Property Price:</td>
                  <td style="padding: 8px 0;">${property.price?.toLocaleString('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }) || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Loan Amount:</td>
                  <td style="padding: 8px 0;">${requestedAmount}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Down Payment:</td>
                  <td style="padding: 8px 0;">${downPayment}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Loan Term:</td>
                  <td style="padding: 8px 0;">${application.loanTermYears || 0} years</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Interest Rate:</td>
                  <td style="padding: 8px 0;">${application.interestRate || 0}%</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Estimated Monthly Payment:</td>
                  <td style="padding: 8px 0;">${monthlyPayment}</td>
                </tr>
              </table>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h2 style="margin-top: 0; color: #667eea;">Applicant Information</h2>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; width: 40%;">Name:</td>
                  <td style="padding: 8px 0;">${buyer.firstName || ''} ${buyer.lastName || ''}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Email:</td>
                  <td style="padding: 8px 0;">${buyer.email || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Employment Type:</td>
                  <td style="padding: 8px 0;">${application.employmentDetails?.type || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Monthly Income:</td>
                  <td style="padding: 8px 0;">${application.employmentDetails?.monthlyIncome?.toLocaleString('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }) || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Documents:</td>
                  <td style="padding: 8px 0;">${application.documents?.length || 0} document(s) uploaded</td>
                </tr>
              </table>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/mortgage-bank-dashboard?applicationId=${application._id}" 
                 style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Review Application
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              This is an automated notification. Please log in to your dashboard to review and process this application.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              PropertyArk Platform<br>
              ${process.env.SUPPORT_EMAIL || 'support@realestate.com'}
            </p>
          </div>
        </body>
        </html>
      `;

      const text = `
New Mortgage Application

Hello ${bankUser.firstName || 'Bank Representative'},

A new mortgage application has been submitted to your bank.

Application Details:
- Application ID: ${application._id}
- Property: ${property.title || 'N/A'}
- Location: ${property.location || property.city && property.state ? `${property.city}, ${property.state}` : 'N/A'}
- Property Price: ${property.price?.toLocaleString('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }) || 'N/A'}
- Loan Amount: ${requestedAmount}
- Down Payment: ${downPayment}
- Loan Term: ${application.loanTermYears || 0} years
- Interest Rate: ${application.interestRate || 0}%
- Estimated Monthly Payment: ${monthlyPayment}

Applicant Information:
- Name: ${buyer.firstName || ''} ${buyer.lastName || ''}
- Email: ${buyer.email || 'N/A'}
- Employment Type: ${application.employmentDetails?.type || 'N/A'}
- Monthly Income: ${application.employmentDetails?.monthlyIncome?.toLocaleString('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }) || 'N/A'}
- Documents: ${application.documents?.length || 0} document(s) uploaded

Review the application: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/mortgage-bank-dashboard?applicationId=${application._id}

PropertyArk Platform
      `;

      // Send email to bank user account
      return await this.sendEmail(
        bankUser.email,
        subject,
        html,
        text
      );
    } catch (error) {
      console.error('Error sending mortgage application email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send email notification for mortgage application status change (to buyer)
   * @param {Object} application - MortgageApplication object
   * @param {Object} buyer - User object for the buyer
   * @param {Object} property - Property object
   * @param {String} status - New status ('approved', 'rejected', 'needs_more_info')
   * @param {String} notes - Optional notes from bank
   */
  async sendMortgageApplicationStatusEmail(application, buyer, property, status, notes = '') {
    try {
      const statusMessages = {
        'approved': 'Congratulations! Your mortgage application has been approved.',
        'rejected': 'Your mortgage application has been reviewed.',
        'needs_more_info': 'Additional information required for your mortgage application.'
      };

      const statusTitles = {
        'approved': 'Mortgage Application Approved',
        'rejected': 'Mortgage Application Update',
        'needs_more_info': 'Additional Information Required'
      };

      const statusColors = {
        'approved': '#10b981',
        'rejected': '#ef4444',
        'needs_more_info': '#f59e0b'
      };

      const subject = statusTitles[status] || 'Mortgage Application Update';

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">${subject}</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Hello ${buyer.firstName || 'Valued Customer'},</p>
            
            <p style="font-size: 16px; color: ${statusColors[status] || '#333'}; font-weight: bold;">
              ${statusMessages[status] || 'Your mortgage application status has been updated.'}
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusColors[status] || '#667eea'};">
              <h2 style="margin-top: 0; color: ${statusColors[status] || '#667eea'};">Application Details</h2>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; width: 40%;">Property:</td>
                  <td style="padding: 8px 0;">${property.title || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Location:</td>
                  <td style="padding: 8px 0;">${property.location || property.city && property.state ? `${property.city}, ${property.state}` : 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Loan Amount:</td>
                  <td style="padding: 8px 0;">₦${application.requestedAmount?.toLocaleString() || '0'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Status:</td>
                  <td style="padding: 8px 0; text-transform: capitalize; color: ${statusColors[status] || '#333'}; font-weight: bold;">
                    ${status.replace('_', ' ')}
                  </td>
                </tr>
              </table>
            </div>
            
            ${notes ? `
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <h3 style="margin-top: 0; color: #856404;">Bank Notes:</h3>
              <p style="color: #856404; margin: 0;">${notes}</p>
            </div>
            ` : ''}
            
            ${status === 'approved' ? `
            <div style="background: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <p style="color: #065f46; margin: 0;">
                <strong>Next Steps:</strong> Your mortgage has been approved! You can now proceed with the property purchase. 
                Please contact the mortgage bank to complete the final documentation process.
              </p>
            </div>
            ` : ''}
            
            ${status === 'needs_more_info' ? `
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <p style="color: #92400e; margin: 0;">
                <strong>Action Required:</strong> Please log in to your account and provide the additional information requested by the bank.
              </p>
            </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/mortgages" 
                 style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                View Application
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              If you have any questions, please contact the mortgage bank directly or our support team.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              PropertyArk Platform<br>
              ${process.env.SUPPORT_EMAIL || 'support@realestate.com'}
            </p>
          </div>
        </body>
        </html>
      `;

      const text = `
${subject}

Hello ${buyer.firstName || 'Valued Customer'},

${statusMessages[status] || 'Your mortgage application status has been updated.'}

Application Details:
- Property: ${property.title || 'N/A'}
- Location: ${property.location || property.city && property.state ? `${property.city}, ${property.state}` : 'N/A'}
- Loan Amount: ₦${application.requestedAmount?.toLocaleString() || '0'}
- Status: ${status.replace('_', ' ')}

${notes ? `Bank Notes:\n${notes}\n\n` : ''}

View your application: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/mortgages

PropertyArk Platform
      `;

      return await this.sendEmail(
        buyer.email,
        subject,
        html,
        text
      );
    } catch (error) {
      console.error('Error sending mortgage status email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async verifyConnection() {
    try {
      if (this.isDisabled) {
        return { success: true, message: 'Email service disabled intentionally' };
      }
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

  /**
   * Send admin notification for new chat conversation
   */
  async sendNewChatNotificationEmail(adminEmail, contactInfo, conversationId, category, priority, propertyInfo = null) {
    try {
      const subject = `[${priority.toUpperCase()}] New ${category.replace(/_/g, ' ')} from ${contactInfo.name}`;
      
      const dashboardLink = `${process.env.FRONTEND_URL || 'https://propertyark.com'}/admin/chat/${conversationId}`;
      
      const html = `
        <h2>New Support Chat Request</h2>
        <p>You have received a new chat from:</p>
        <ul>
          <li><strong>Name:</strong> ${contactInfo.name}</li>
          <li><strong>Email:</strong> ${contactInfo.email}</li>
          <li><strong>Category:</strong> ${category.replace(/_/g, ' ')}</li>
          <li><strong>Priority:</strong> <span style="color: ${priority === 'urgent' ? 'red' : priority === 'high' ? 'orange' : 'green'}; font-weight: bold;">${priority.toUpperCase()}</span></li>
          ${contactInfo.phone ? `<li><strong>Phone:</strong> ${contactInfo.phone}</li>` : ''}
          ${propertyInfo ? `<li><strong>Property:</strong> ${propertyInfo.title}</li>` : ''}
        </ul>
        <p><a href="${dashboardLink}" style="background-color: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Chat</a></p>
        <p>Please respond as soon as possible.</p>
      `;

      const text = `New support chat from ${contactInfo.name} (${contactInfo.email}). Category: ${category}. Priority: ${priority}. Visit ${dashboardLink} to respond.`;

      return await this.sendEmail(adminEmail, subject, html, text);
    } catch (error) {
      console.error('Error sending new chat notification email:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create and export singleton instance
const emailService = new EmailService();
module.exports = emailService;
