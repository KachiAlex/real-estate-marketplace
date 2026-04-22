/**
 * Two-Factor Authentication Service
 * Email-based OTP verification with backup codes and device trust
 */

const crypto = require('crypto');
const emailService = require('./emailService');

class TwoFactorService {
  /**
   * Generate a random 6-digit OTP code
   * @returns {string} 6-digit OTP code
   */
  static generateOTP() {
    const otp = crypto.randomInt(100000, 999999).toString();
    return otp;
  }

  /**
   * Generate backup codes for account recovery
   * @param {number} count - Number of codes to generate (default: 10)
   * @returns {Array<string>} Array of backup codes
   */
  static generateBackupCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Format backup codes for storage
   * @param {Array<string>} codes - Array of backup codes
   * @returns {string} JSON stringified codes
   */
  static formatBackupCodes(codes) {
    return JSON.stringify(codes);
  }

  /**
   * Parse backup codes from storage
   * @param {string} codesString - JSON stringified codes
   * @returns {Array<string>} Array of backup codes
   */
  static parseBackupCodes(codesString) {
    try {
      return JSON.parse(codesString || '[]');
    } catch (e) {
      return [];
    }
  }

  /**
   * Send OTP email to user
   * @param {Object} params - Configuration object
   * @param {string} params.email - User's email address
   * @param {string} params.otp - 6-digit OTP code
   * @param {string} params.userName - User's name for email
   * @returns {Promise<boolean>} Success indicator
   */
  static async sendOTPEmail({ email, otp, userName = 'User' }) {
    try {
      const subject = 'Your Real Estate Marketplace 2FA Code';
      const html = `
        <h2>Two-Factor Authentication</h2>
        <p>Hello ${userName},</p>
        <p>Your authentication code is:</p>
        <h1 style="letter-spacing: 5px; font-size: 32px; color: #007bff;">
          ${otp.split('').join(' ')}
        </h1>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
        <p>Never share this code with anyone, including support staff.</p>
        <hr />
        <p><small>Real Estate Marketplace | Security Authentication</small></p>
      `;

      const text = `Your 2FA code is: ${otp}. This code will expire in 10 minutes. Do not share this code.`;

      return await emailService.sendEmail({
        to: email,
        subject,
        html,
        text
      });
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      throw new Error('Failed to send OTP email');
    }
  }

  /**
   * Generate device fingerprint for device trust
   * @param {Object} userAgent - Request user agent object
   * @returns {string} Device fingerprint hash
   */
  static generateDeviceFingerprint(userAgent) {
    const agent = userAgent || 'unknown';
    const fingerprint = crypto
      .createHash('sha256')
      .update(agent)
      .digest('hex');
    return fingerprint;
  }

  /**
   * Create a device trust token
   * @param {Object} params - Configuration object
   * @param {string} params.userId - User ID
   * @param {string} params.deviceFingerprint - Device fingerprint
   * @param {string} params.deviceName - Human-readable device name
   * @returns {Object} Device trust object
   */
  static createDeviceTrust({ userId, deviceFingerprint, deviceName = 'Unknown Device' }) {
    return {
      userId,
      deviceFingerprint,
      deviceName,
      trustedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      isActive: true
    };
  }

  /**
   * Verify OTP code
   * @param {string} providedOTP - OTP provided by user
   * @param {string} storedOTP - OTP stored in database/cache
   * @returns {boolean} Verification result
   */
  static verifyOTP(providedOTP, storedOTP) {
    if (!providedOTP || !storedOTP) {
      return false;
    }
    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(providedOTP.toString()),
      Buffer.from(storedOTP.toString())
    );
  }

  /**
   * Verify backup code and remove it
   * @param {string} providedCode - Backup code provided by user
   * @param {Array<string>} storedCodes - Backup codes stored
   * @returns {Object} { isValid: boolean, remainingCodes: Array }
   */
  static verifyBackupCode(providedCode, storedCodes) {
    const codes = TwoFactorService.parseBackupCodes(
      typeof storedCodes === 'string' ? storedCodes : JSON.stringify(storedCodes)
    );

    const codeIndex = codes.findIndex(
      code => code === providedCode.toUpperCase()
    );

    if (codeIndex === -1) {
      return {
        isValid: false,
        remainingCodes: codes
      };
    }

    // Remove the used code
    codes.splice(codeIndex, 1);

    return {
      isValid: true,
      remainingCodes: codes
    };
  }

  /**
   * Check if device is trusted
   * @param {string} userId - User ID
   * @param {string} deviceFingerprint - Device fingerprint to check
   * @param {Array} trustedDevices - Array of trusted devices
   * @returns {boolean} Is device trusted
   */
  static isDeviceTrusted(userId, deviceFingerprint, trustedDevices = []) {
    return trustedDevices.some(device => 
      device.userId === userId &&
      device.deviceFingerprint === deviceFingerprint &&
      device.isActive &&
      new Date(device.expiresAt) > new Date()
    );
  }

  /**
   * Format OTP for API responses (masked)
   * Shows last 2 digits only
   * @param {string} otp - Original OTP
   * @returns {string} Masked OTP like "****34"
   */
  static maskOTP(otp) {
    if (!otp || otp.length < 2) return '****';
    return '*'.repeat(otp.length - 2) + otp.slice(-2);
  }

  /**
   * Get 2FA status for user
   * @param {Object} user - User object from database
   * @returns {Object} 2FA status details
   */
  static get2FAStatus(user) {
    return {
      isEnabled: user?.twoFactorEnabled === true,
      method: user?.twoFactorMethod || 'email',
      verifiedAt: user?.twoFactorVerifiedAt || null,
      hasBackupCodes: user?.backupCodes ? 
        TwoFactorService.parseBackupCodes(user.backupCodes).length > 0 : false,
      backupCodeCount: user?.backupCodes ? 
        TwoFactorService.parseBackupCodes(user.backupCodes).length : 0
    };
  }

  /**
   * Validate OTP configuration
   * @param {string} otp - OTP to validate
   * @param {number} maxAge - Max age in minutes
   * @param {Date} createdAt - When OTP was created
   * @returns {Object} { isValid: boolean, reason: string }
   */
  static validateOTPConfig(otp, maxAge = 10, createdAt = null) {
    // Check OTP exists
    if (!otp) {
      return { isValid: false, reason: 'No OTP found' };
    }

    // Check OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return { isValid: false, reason: 'Invalid OTP format' };
    }

    // Check expiration if createdAt provided
    if (createdAt) {
      const now = new Date();
      const age = (now - new Date(createdAt)) / (1000 * 60); // minutes
      
      if (age > maxAge) {
        return { isValid: false, reason: `OTP expired (${Math.floor(age)} minutes old)` };
      }
    }

    return { isValid: true, reason: 'Valid' };
  }

  /**
   * Generate 2FA setup token for one-time setup link
   * @returns {string} Setup token
   */
  static generateSetupToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash setup token
   * @param {string} token - Setup token
   * @returns {string} Hashed token
   */
  static hashSetupToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

module.exports = TwoFactorService;
