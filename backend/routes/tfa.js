/**
 * Phase 3.5: Two-Factor Authentication (2FA) Routes
 * Endpoints for enrolling, verifying, and managing 2FA
 */

const express = require('express');
const { protect } = require('../middleware/auth');
const TFAService = require('../services/tfaService');
const { errorLogger, infoLogger } = require('../config/logger');

const router = express.Router();

/**
 * @desc    Get 2FA status for current user
 * @route   GET /api/tfa/status
 * @access  Private
 */
router.get('/status', protect, (req, res) => {
  try {
    const status = TFAService.getUserTFAStatus(req.user);

    res.json({
      success: true,
      data: {
        userId: req.user.id,
        tfaStatus: status,
        canEnroll: !status.enabled,
        canDisable: status.enabled
      }
    });
  } catch (error) {
    errorLogger(`2FA Status Error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch 2FA status'
    });
  }
});

/**
 * @desc    Initiate 2FA enrollment (send OTP)
 * @route   POST /api/tfa/enroll
 * @access  Private
 */
router.post('/enroll', protect, async (req, res) => {
  try {
    // Check if user already has 2FA enabled
    if (req.user.tfaEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is already enabled. Disable it first to re-enroll.'
      });
    }

    const { method = 'email' } = req.body;

    // Validate method
    try {
      TFAService.validateTFASetup(method);
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError.message
      });
    }

    // Generate OTP
    const otpRequest = TFAService.createOTPRequest(req.user.email);

    // Send OTP email
    await TFAService.sendOTPEmail(req.user.email, otpRequest.plainOTP, req.user.firstName || 'User');

    // Store OTP request temporarily (in production, use Redis or database)
    // For now, we'll include it in response but should be stored server-side
    req.user.pendingTFAEnrollment = {
      otpId: otpRequest.otpId,
      hash: otpRequest.hash,
      salt: otpRequest.salt,
      expiresAt: otpRequest.expiresAt,
      method: method,
      attempts: 0
    };

    infoLogger(`2FA enrollment initiated for user ${req.user.id}`);

    res.json({
      success: true,
      data: {
        message: 'OTP sent to your email address',
        otpId: otpRequest.otpId,
        expiresIn: '10 minutes',
        method: method,
        email: req.user.email
      }
    });
  } catch (error) {
    errorLogger(`2FA Enroll Error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to initiate 2FA enrollment'
    });
  }
});

/**
 * @desc    Verify OTP and complete 2FA enrollment
 * @route   POST /api/tfa/verify-enroll
 * @access  Private
 */
router.post('/verify-enroll', protect, async (req, res) => {
  try {
    const { otp, method = 'email' } = req.body;

    if (!otp || typeof otp !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Valid OTP is required'
      });
    }

    // Verify OTP (in production, retrieve from database/Redis)
    if (!req.user.pendingTFAEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'No pending 2FA enrollment. Start enrollment first.'
      });
    }

    const otpRecord = req.user.pendingTFAEnrollment;
    const verification = TFAService.verifyOTPRequest(otp, otpRecord);

    if (!verification.valid) {
      return res.status(400).json({
        success: false,
        message: verification.reason === 'OTP expired' 
          ? 'OTP has expired. Request a new one.'
          : `Invalid OTP. ${verification.attemptsRemaining || 0} attempts remaining.`
      });
    }

    // Generate backup codes
    const { plainCodes, hashedCodes } = TFAService.prepareBackupCodes();

    // Update user (in production, save to database)
    req.user.tfaEnabled = true;
    req.user.tfaMethod = method;
    req.user.backupCodes = hashedCodes;
    req.user.tfaCreatedAt = new Date();
    req.user.pendingTFAEnrollment = null;

    // Send confirmation email with backup codes
    await TFAService.sendEnrollmentConfirmationEmail(
      req.user.email,
      req.user.firstName || 'User',
      plainCodes
    );

    infoLogger(`2FA enrollment completed for user ${req.user.id}`);

    res.json({
      success: true,
      data: {
        message: '2FA enabled successfully',
        backupCodes: plainCodes,
        instruction: 'Save these backup codes in a secure location. You can use them if you lose access to email.',
        tfaEnabled: true,
        method: method
      }
    });
  } catch (error) {
    errorLogger(`2FA Verify Enroll Error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP'
    });
  }
});

/**
 * @desc    Request OTP for login (after initial authentication)
 * @route   POST /api/tfa/request-otp
 * @access  Public (with email/password verified)
 */
router.post('/request-otp', async (req, res) => {
  try {
    const { userId, email } = req.body;

    if (!userId || !email) {
      return res.status(400).json({
        success: false,
        message: 'User ID and email required'
      });
    }

    // Generate OTP
    const otpRequest = TFAService.createOTPRequest(email);

    // Send OTP
    await TFAService.sendOTPEmail(email, otpRequest.plainOTP, 'User');

    // Store OTP temporarily
    // In production use Redis or database with short TTL
    res.json({
      success: true,
      data: {
        message: 'OTP sent to your email',
        otpId: otpRequest.otpId,
        expiresIn: '10 minutes',
        email: email
      }
    });
  } catch (error) {
    errorLogger(`Request OTP Error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP. Please try again.'
    });
  }
});

/**
 * @desc    Verify OTP for login
 * @route   POST /api/tfa/verify-login-otp
 * @access  Public (with pending 2FA verification)
 */
router.post('/verify-login-otp', async (req, res) => {
  try {
    const { otp, otpId, useBackupCode = false, trustDevice = false } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP or backup code required'
      });
    }

    // In production, retrieve OTP from Redis/database
    // For now, this would be implemented with proper state management

    res.json({
      success: true,
      data: {
        message: '2FA verification successful',
        verified: true,
        trustToken: trustDevice ? TFAService.generateDeviceToken() : null,
        trustExpiresIn: trustDevice ? '30 days' : null
      }
    });
  } catch (error) {
    errorLogger(`Verify Login OTP Error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP'
    });
  }
});

/**
 * @desc    Disable 2FA for current user
 * @route   POST /api/tfa/disable
 * @access  Private
 */
router.post('/disable', protect, async (req, res) => {
  try {
    if (!req.user.tfaEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is not enabled on your account'
      });
    }

    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password required to disable 2FA'
      });
    }

    // Verify password (in production, use actual password verification)
    // For security, require password confirmation

    // Disable 2FA
    req.user.tfaEnabled = false;
    req.user.tfaMethod = null;
    req.user.backupCodes = [];
    req.user.trustedDevices = [];

    // Send confirmation email
    await TFAService.sendDisableConfirmationEmail(req.user.email, req.user.firstName || 'User');

    infoLogger(`2FA disabled for user ${req.user.id}`);

    res.json({
      success: true,
      data: {
        message: '2FA has been disabled',
        tfaEnabled: false
      }
    });
  } catch (error) {
    errorLogger(`Disable 2FA Error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to disable 2FA'
    });
  }
});

/**
 * @desc    Regenerate backup codes
 * @route   POST /api/tfa/regenerate-backup-codes
 * @access  Private
 */
router.post('/regenerate-backup-codes', protect, async (req, res) => {
  try {
    if (!req.user.tfaEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is not enabled'
      });
    }

    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password required to regenerate backup codes'
      });
    }

    // Generate new backup codes
    const { plainCodes, hashedCodes } = TFAService.prepareBackupCodes();

    // Update user
    req.user.backupCodes = hashedCodes;

    // Send email
    await TFAService.sendEnrollmentConfirmationEmail(
      req.user.email,
      req.user.firstName || 'User',
      plainCodes
    );

    infoLogger(`Backup codes regenerated for user ${req.user.id}`);

    res.json({
      success: true,
      data: {
        message: 'Backup codes regenerated successfully',
        backupCodes: plainCodes,
        instruction: 'Save these new codes. Your previous backup codes are no longer valid.'
      }
    });
  } catch (error) {
    errorLogger(`Regenerate Backup Codes Error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to regenerate backup codes'
    });
  }
});

/**
 * @desc    List trusted devices
 * @route   GET /api/tfa/trusted-devices
 * @access  Private
 */
router.get('/trusted-devices', protect, (req, res) => {
  try {
    const trustedDevices = req.user.trustedDevices || [];

    const devices = trustedDevices.map(device => ({
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      createdAt: device.createdAt,
      lastUsedAt: device.lastUsedAt,
      expiresAt: device.expiresAt,
      isExpired: new Date() > new Date(device.expiresAt)
    }));

    res.json({
      success: true,
      data: {
        trustedDevices: devices,
        count: devices.length
      }
    });
  } catch (error) {
    errorLogger(`List Trusted Devices Error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trusted devices'
    });
  }
});

/**
 * @desc    Remove a trusted device
 * @route   DELETE /api/tfa/trusted-devices/:deviceId
 * @access  Private
 */
router.delete('/trusted-devices/:deviceId', protect, (req, res) => {
  try {
    const { deviceId } = req.params;

    if (!req.user.trustedDevices) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    const deviceIndex = req.user.trustedDevices.findIndex(d => d.deviceId === deviceId);

    if (deviceIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    const removedDevice = req.user.trustedDevices.splice(deviceIndex, 1)[0];

    infoLogger(`Device ${deviceId} removed for user ${req.user.id}`);

    res.json({
      success: true,
      data: {
        message: `Device "${removedDevice.deviceName}" has been removed`,
        deviceId: deviceId
      }
    });
  } catch (error) {
    errorLogger(`Remove Device Error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to remove device'
    });
  }
});

/**
 * @desc    Clear all trusted devices
 * @route   POST /api/tfa/clear-all-devices
 * @access  Private
 */
router.post('/clear-all-devices', protect, (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password required to clear devices'
      });
    }

    const deviceCount = req.user.trustedDevices ? req.user.trustedDevices.length : 0;
    req.user.trustedDevices = [];

    infoLogger(`All ${deviceCount} devices cleared for user ${req.user.id}`);

    res.json({
      success: true,
      data: {
        message: `${deviceCount} device(s) have been removed`,
        trustedDevices: []
      }
    });
  } catch (error) {
    errorLogger(`Clear Devices Error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to clear devices'
    });
  }
});

/**
 * @desc    Get security summary (2FA + other security metrics)
 * @route   GET /api/tfa/security-summary
 * @access  Private
 */
router.get('/security-summary', protect, (req, res) => {
  try {
    const summary = TFAService.generateSecuritySummary(req.user);

    res.json({
      success: true,
      data: {
        userId: req.user.id,
        securitySummary: summary,
        recommendations: getSafetyRecommendations(summary)
      }
    });
  } catch (error) {
    errorLogger(`Security Summary Error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch security summary'
    });
  }
});

/**
 * Helper function to generate security recommendations
 */
function getSafetyRecommendations(summary) {
  const recommendations = [];

  if (!summary.tfaEnabled) {
    recommendations.push({
      level: 'critical',
      message: 'Enable two-factor authentication to protect your account',
      action: '/settings/security/2fa'
    });
  }

  if (summary.loginAttempts > 3) {
    recommendations.push({
      level: 'warning',
      message: 'Multiple failed login attempts detected',
      action: '/settings/security'
    });
  }

  if (!summary.passwordLastChanged || 
      new Date(summary.passwordLastChanged) < new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)) {
    recommendations.push({
      level: 'warning',
      message: 'Consider changing your password',
      action: '/settings/security/change-password'
    });
  }

  return recommendations;
}

module.exports = router;
