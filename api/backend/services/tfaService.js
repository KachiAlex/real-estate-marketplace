/**
 * Phase 3.5: Two-Factor Authentication (2FA) Service
 * Handles OTP generation, validation, backup codes, and device trust
 */

const crypto = require('crypto');
const EmailService = require('./emailService');
const { errorLogger, infoLogger } = require('../config/logger');

class TFAService {
  /**
   * Generate a 6-digit OTP
   */
  static generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generate backup codes (10 codes, 8 characters each)
   */
  static generateBackupCodes() {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Generate device trust token (used for remembering device for 30 days)
   */
  static generateDeviceToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash a device token for storage
   */
  static hashDeviceToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Hash an OTP for storage (add salt for extra security)
   */
  static hashOTP(otp, salt = crypto.randomBytes(16).toString('hex')) {
    const hash = crypto.createHash('sha256').update(otp + salt).digest('hex');
    return { hash, salt };
  }

  /**
   * Verify an OTP against stored hash
   */
  static verifyOTP(otp, storedHash, salt) {
    const { hash } = this.hashOTP(otp, salt);
    return hash === storedHash;
  }

  /**
   * Hash a backup code for storage
   */
  static hashBackupCode(code) {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  /**
   * Verify a backup code
   */
  static verifyBackupCode(code, storedHash) {
    const hash = this.hashBackupCode(code);
    return hash === storedHash;
  }

  /**
   * Send OTP via email
   */
  static async sendOTPEmail(email, otp, userName) {
    try {
      const subject = 'Your Two-Factor Authentication Code';
      const html = `
        <h2>Two-Factor Authentication</h2>
        <p>Hello ${userName},</p>
        <p>Your one-time password (OTP) for login is:</p>
        <h1 style="color: #007bff; font-family: monospace; letter-spacing: 3px;">${otp}</h1>
        <p><strong>This code expires in 10 minutes.</strong></p>
        <p>If you didn't request this code, please ignore this email.</p>
        <hr />
        <p style="font-size: 12px; color: #666;">
          For security reasons, never share this code with anyone. 
          Our support team will never ask for your OTP.
        </p>
      `;

      await EmailService.sendEmail(email, subject, html);
      infoLogger(`2FA OTP sent to ${email}`);
      return { success: true };
    } catch (error) {
      errorLogger(`Failed to send 2FA OTP email: ${error.message}`);
      throw new Error('Failed to send OTP. Please try again.');
    }
  }

  /**
   * Send 2FA enrollment confirmation email
   */
  static async sendEnrollmentConfirmationEmail(email, userName, backupCodes) {
    try {
      const subject = '2FA Enabled - Your Backup Codes';
      const codesHTML = backupCodes.map(code => `<code>${code}</code>`).join('<br />');

      const html = `
        <h2>Two-Factor Authentication Enabled</h2>
        <p>Hello ${userName},</p>
        <p>Two-factor authentication has been successfully enabled on your account.</p>
        
        <h3>Your Backup Codes</h3>
        <p><strong>Save these codes in a safe place.</strong> You can use them if you lose access to your phone.</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; font-family: monospace;">
          ${codesHTML}
        </div>
        
        <h3>Next Steps</h3>
        <ul>
          <li>Store your backup codes in a secure location</li>
          <li>You will need to enter a code from your email for future logins</li>
          <li>If you don't have access to your email, use a backup code</li>
        </ul>
        
        <hr />
        <p style="font-size: 12px; color: #666;">
          If you didn't enable 2FA, please contact support immediately.
        </p>
      `;

      await EmailService.sendEmail(email, subject, html);
      infoLogger(`2FA enrollment confirmation sent to ${email}`);
      return { success: true };
    } catch (error) {
      errorLogger(`Failed to send enrollment confirmation: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send 2FA disabled confirmation email
   */
  static async sendDisableConfirmationEmail(email, userName) {
    try {
      const subject = 'Two-Factor Authentication Disabled';
      const html = `
        <h2>2FA Disabled</h2>
        <p>Hello ${userName},</p>
        <p>Two-factor authentication has been disabled on your account.</p>
        
        <p>Your account is now less secure. We recommend enabling 2FA to protect your account.</p>
        
        <p>If you didn't disable 2FA, please contact support immediately.</p>
      `;

      await EmailService.sendEmail(email, subject, html);
      infoLogger(`2FA disable confirmation sent to ${email}`);
    } catch (error) {
      errorLogger(`Failed to send disable confirmation: ${error.message}`);
    }
  }

  /**
   * Create OTP request (temporary record)
   * @returns { otpId, expiresAt, attemptsRemaining }
   */
  static createOTPRequest(email) {
    const otp = this.generateOTP();
    const { hash, salt } = this.hashOTP(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const otpId = crypto.randomBytes(16).toString('hex');

    return {
      otpId,
      plainOTP: otp,      // Send this to user
      hash,
      salt,
      expiresAt,
      attempts: 0,
      maxAttempts: 5
    };
  }

  /**
   * Verify OTP request
   */
  static verifyOTPRequest(otp, otpRecord) {
    // Check if OTP has expired
    if (new Date() > otpRecord.expiresAt) {
      return { valid: false, reason: 'OTP expired' };
    }

    // Check attempts
    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      return { valid: false, reason: 'Too many attempts' };
    }

    // Verify OTP
    const isValid = this.verifyOTP(otp, otpRecord.hash, otpRecord.salt);
    
    if (!isValid) {
      otpRecord.attempts += 1;
      return { valid: false, reason: 'Invalid OTP', attemptsRemaining: otpRecord.maxAttempts - otpRecord.attempts };
    }

    return { valid: true };
  }

  /**
   * Check if device token is valid (not expired)
   */
  static isDeviceTokenValid(deviceTokenRecord) {
    if (!deviceTokenRecord || !deviceTokenRecord.expiresAt) {
      return false;
    }
    return new Date() <= new Date(deviceTokenRecord.expiresAt);
  }

  /**
   * Generate a new device record for 30-day trust
   */
  static createDeviceRecord(deviceName) {
    return {
      deviceId: crypto.randomBytes(8).toString('hex'),
      deviceName: deviceName || `Device ${new Date().toLocaleDateString()}`,
      token: this.generateDeviceToken(),
      tokenHash: this.hashDeviceToken(this.generateDeviceToken()),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      lastUsedAt: new Date()
    };
  }

  /**
   * Get 2FA status for user
   */
  static getUserTFAStatus(user) {
    return {
      enabled: user.tfaEnabled || false,
      method: user.tfaMethod || 'email',
      backupCodesCount: user.backupCodes ? user.backupCodes.length : 0,
      trustedDevices: user.trustedDevices ? user.trustedDevices.length : 0,
      createdAt: user.tfaCreatedAt,
      lastVerifiedAt: user.tfaLastVerifiedAt
    };
  }

  /**
   * Generate new backup codes and hash for storage
   */
  static prepareBackupCodes() {
    const plainCodes = this.generateBackupCodes();
    const hashedCodes = plainCodes.map(code => this.hashBackupCode(code));
    
    return {
      plainCodes,  // Return to user (one-time display)
      hashedCodes  // Store in database
    };
  }

  /**
   * Calculate OTP expiration time
   */
  static getOTPExpirationTime() {
    return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  }

  /**
   * Generate recovery window for backup codes
   */
  static getBackupCodesRecoveryWindow() {
    return {
      generatedAt: new Date(),
      validFor: '30 days',
      regenerateAfter: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };
  }

  /**
   * Validate 2FA setup requirements
   */
  static validateTFASetup(tfaMethod) {
    const supportedMethods = ['email', 'sms']; // SMS for future expansion
    
    if (!supportedMethods.includes(tfaMethod)) {
      throw new Error(`Invalid 2FA method. Supported: ${supportedMethods.join(', ')}`);
    }

    return true;
  }

  /**
   * Generate security summary
   */
  static generateSecuritySummary(user) {
    return {
      tfaEnabled: user.tfaEnabled || false,
      tfaMethod: user.tfaMethod || null,
      trustedDevices: user.trustedDevices ? user.trustedDevices.length : 0,
      backupCodesAvailable: user.backupCodes ? user.backupCodes.length : 0,
      passwordLastChanged: user.passwordChangedAt,
      lastLogin: user.lastLogin,
      loginAttempts: user.failedLoginAttempts || 0
    };
  }
}

module.exports = TFAService;
