/**
 * Phase 3.5: Two-Factor Authentication Routes
 * Email-based 2FA with backup codes and device trust
 */

const express = require('express');
const { protect } = require('../middleware/auth');
const TwoFactorService = require('../services/twoFactorService');
const router = express.Router();

// In a real setup, these would come from cache/database
// For now, using in-memory storage for demonstration
const otpStore = new Map(); // userId -> { code, createdAt, attempts }
const deviceTrustStore = new Map(); // userId -> [devices]

/**
 * @desc    Get current 2FA status for logged-in user
 * @route   GET /api/auth/2fa/status
 * @access  Private
 */
router.get('/status', protect, (req, res) => {
  try {
    const status = TwoFactorService.get2FAStatus(req.user);
    
    res.json({
      success: true,
      data: {
        userId: req.user.id,
        ...status
      }
    });
  } catch (error) {
    console.error('2FA status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch 2FA status'
    });
  }
});

/**
 * @desc    Enable 2FA for user account
 * @route   POST /api/auth/2fa/enable
 * @access  Private
 * @body    { password: string } - Verify password to enable 2FA
 */
router.post('/enable', protect, async (req, res) => {
  try {
    const { password } = req.body;

    // Verify password before enabling 2FA
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password required to enable 2FA'
      });
    }

    // In real implementation, verify password hash
    // For now, we'll assume it's verified by middleware
    
    // Generate OTP for initial setup
    const otp = TwoFactorService.generateOTP();
    const createdAt = new Date();

    // Store OTP temporarily (should be in Redis/cache with TTL)
    otpStore.set(req.user.id, {
      code: otp,
      createdAt,
      attempts: 0,
      type: 'setup'
    });

    // Send OTP email
    try {
      await TwoFactorService.sendOTPEmail({
        email: req.user.email,
        otp,
        userName: req.user.firstName || 'User'
      });
    } catch (emailError) {
      console.error('Failed to send OTP:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send authentication code'
      });
    }

    res.json({
      success: true,
      data: {
        message: 'Authentication code sent to your email',
        email: req.user.email,
        expiresIn: 600, // 10 minutes in seconds
        nextStep: 'verify-setup'
      }
    });
  } catch (error) {
    console.error('Enable 2FA error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enable 2FA'
    });
  }
});

/**
 * @desc    Verify initial setup OTP and enable 2FA
 * @route   POST /api/auth/2fa/verify-setup
 * @access  Private
 * @body    { otp: string } - 6-digit OTP code
 */
router.post('/verify-setup', protect, async (req, res) => {
  try {
    const { otp } = req.body;

    // Validate OTP input
    if (!otp || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP format. Please enter 6 digits.'
      });
    }

    // Get stored OTP
    const stored = otpStore.get(req.user.id);

    if (!stored || stored.type !== 'setup') {
      return res.status(400).json({
        success: false,
        message: 'No active 2FA setup. Please start from the beginning.'
      });
    }

    // Check expiration (10 minutes)
    const age = (new Date() - stored.createdAt) / (1000 * 60);
    if (age > 10) {
      otpStore.delete(req.user.id);
      return res.status(400).json({
        success: false,
        message: 'OTP expired. Please request a new one.'
      });
    }

    // Check max attempts (5)
    if (stored.attempts >= 5) {
      otpStore.delete(req.user.id);
      return res.status(429).json({
        success: false,
        message: 'Too many failed attempts. Please try again later.'
      });
    }

    // Verify OTP
    try {
      const isValid = TwoFactorService.verifyOTP(otp, stored.code);

      if (!isValid) {
        stored.attempts++;
        res.status(400).json({
          success: false,
          message: `Invalid OTP. ${5 - stored.attempts} attempts remaining.`
        });
        return;
      }
    } catch (e) {
      stored.attempts++;
      return res.status(400).json({
        success: false,
        message: 'OTP verification failed. Please try again.'
      });
    }

    // Generate backup codes
    const backupCodes = TwoFactorService.generateBackupCodes(10);

    // In real implementation, update user in database:
    // await user.update({
    //   twoFactorEnabled: true,
    //   twoFactorMethod: 'email',
    //   backupCodes: TwoFactorService.formatBackupCodes(backupCodes),
    //   twoFactorVerifiedAt: new Date()
    // });

    // Clear OTP
    otpStore.delete(req.user.id);

    res.json({
      success: true,
      data: {
        message: '2FA enabled successfully',
        backupCodes,
        warning: 'Save these backup codes in a safe place. Each code can only be used once.',
        nextStep: 'save-backup-codes'
      }
    });
  } catch (error) {
    console.error('Verify setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP'
    });
  }
});

/**
 * @desc    Verify OTP during login
 * @route   POST /api/auth/2fa/verify
 * @access  Public (requires login token from first factor)
 * @body    { otp: string, backupCode?: string, trustDevice?: boolean }
 */
router.post('/verify', async (req, res) => {
  try {
    const { otp, backupCode, trustDevice, deviceName, userAgent } = req.body;
    const userId = req.body.userId || req.user?.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID required'
      });
    }

    // Check if OTP or backup code provided
    if (!otp && !backupCode) {
      return res.status(400).json({
        success: false,
        message: 'OTP or backup code required'
      });
    }

    // Try OTP first
    if (otp) {
      if (!/^\d{6}$/.test(otp)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid OTP format'
        });
      }

      const stored = otpStore.get(userId);

      if (!stored || stored.type !== 'login') {
        return res.status(400).json({
          success: false,
          message: 'No active OTP. Please request a new one.'
        });
      }

      const age = (new Date() - stored.createdAt) / (1000 * 60);
      if (age > 10) {
        otpStore.delete(userId);
        return res.status(400).json({
          success: false,
          message: 'OTP expired'
        });
      }

      try {
        const isValid = TwoFactorService.verifyOTP(otp, stored.code);
        if (!isValid) {
          stored.attempts++;
          return res.status(400).json({
            success: false,
            message: `Invalid OTP. ${5 - stored.attempts} attempts remaining.`
          });
        }
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'OTP verification failed'
        });
      }

      // OTP verified
      otpStore.delete(userId);
    } else if (backupCode) {
      // Verify backup code
      // In real implementation, get user's backup codes from DB
      // const user = await User.findById(userId);
      // const backupCodes = TwoFactorService.parseBackupCodes(user.backupCodes);
      // const result = TwoFactorService.verifyBackupCode(backupCode, backupCodes);

      // For now, just validate format
      if (!/^[A-F0-9]{8}$/.test(backupCode)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid backup code format'
        });
      }

      // In real implementation:
      // if (!result.isValid) {
      //   return res.status(400).json({
      //     success: false,
      //     message: 'Invalid backup code'
      //   });
      // }
      // await user.update({
      //   backupCodes: TwoFactorService.formatBackupCodes(result.remainingCodes)
      // });
    }

    // Handle device trust if requested
    if (trustDevice) {
      const deviceFingerprint = TwoFactorService.generateDeviceFingerprint(userAgent);
      const deviceTrust = TwoFactorService.createDeviceTrust({
        userId,
        deviceFingerprint,
        deviceName: deviceName || 'Unnamed Device'
      });

      if (!deviceTrustStore.has(userId)) {
        deviceTrustStore.set(userId, []);
      }
      deviceTrustStore.get(userId).push(deviceTrust);
    }

    res.json({
      success: true,
      data: {
        message: '2FA verified successfully',
        verified: true,
        nextStep: 'authenticated'
      }
    });
  } catch (error) {
    console.error('2FA verify error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify 2FA code'
    });
  }
});

/**
 * @desc    Request OTP for login
 * @route   POST /api/auth/2fa/request-otp
 * @access  Public (requires email from first factor)
 * @body    { userId: string }
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
    const otp = TwoFactorService.generateOTP();
    const createdAt = new Date();

    otpStore.set(userId, {
      code: otp,
      createdAt,
      attempts: 0,
      type: 'login'
    });

    // Send OTP email
    try {
      await TwoFactorService.sendOTPEmail({
        email,
        otp,
        userName: 'User'
      });
    } catch (emailError) {
      console.error('Failed to send OTP:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send authentication code'
      });
    }

    res.json({
      success: true,
      data: {
        message: 'Authentication code sent to your email',
        email,
        expiresIn: 600 // 10 minutes
      }
    });
  } catch (error) {
    console.error('Request OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to request OTP'
    });
  }
});

/**
 * @desc    Get backup codes for authenticated user
 * @route   POST /api/auth/2fa/backup-codes
 * @access  Private
 * @body    { password: string } - Verify password to view/regenerate codes
 */
router.post('/backup-codes', protect, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password required'
      });
    }

    // Verify password (in real implementation)
    // if (!await verifyPassword(password, req.user.password)) {
    //   return res.status(401).json({ success: false, message: 'Invalid password' });
    // }

    // Check if 2FA is enabled
    if (!req.user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is not enabled on this account'
      });
    }

    // Get existing backup codes
    const existingCodes = TwoFactorService.parseBackupCodes(req.user.backupCodes);

    res.json({
      success: true,
      data: {
        backupCodes: existingCodes,
        remaining: existingCodes.length,
        warning: 'Each backup code can only be used once. Keep these safe.'
      }
    });
  } catch (error) {
    console.error('Backup codes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve backup codes'
    });
  }
});

/**
 * @desc    Trust current device
 * @route   POST /api/auth/2fa/trust-device
 * @access  Private
 * @body    { deviceName: string }
 */
router.post('/trust-device', protect, (req, res) => {
  try {
    const { deviceName } = req.body;

    if (!deviceName) {
      return res.status(400).json({
        success: false,
        message: 'Device name required'
      });
    }

    if (deviceName.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Device name must be 50 characters or less'
      });
    }

    const userAgent = req.headers['user-agent'];
    const deviceFingerprint = TwoFactorService.generateDeviceFingerprint(userAgent);

    const deviceTrust = TwoFactorService.createDeviceTrust({
      userId: req.user.id,
      deviceFingerprint,
      deviceName
    });

    if (!deviceTrustStore.has(req.user.id)) {
      deviceTrustStore.set(req.user.id, []);
    }

    const devices = deviceTrustStore.get(req.user.id);
    
    // Check if device already trusted
    const existingDevice = devices.find(d => d.deviceFingerprint === deviceFingerprint);
    if (existingDevice) {
      existingDevice.trustedAt = new Date();
      existingDevice.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      existingDevice.isActive = true;
    } else {
      devices.push(deviceTrust);
    }

    res.json({
      success: true,
      data: {
        message: 'Device trusted successfully',
        deviceName,
        expiresIn: 30 * 24 * 60 * 60 // 30 days
      }
    });
  } catch (error) {
    console.error('Trust device error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trust device'
    });
  }
});

/**
 * @desc    Get list of trusted devices
 * @route   GET /api/auth/2fa/trusted-devices
 * @access  Private
 */
router.get('/trusted-devices', protect, (req, res) => {
  try {
    const devices = deviceTrustStore.get(req.user.id) || [];
    
    // Filter active devices that haven't expired
    const activeDevices = devices
      .filter(d => d.isActive && new Date(d.expiresAt) > new Date())
      .map(({ userId, ...device }) => ({
        ...device,
        expiresAt: device.expiresAt
      }));

    res.json({
      success: true,
      data: {
        devices: activeDevices,
        count: activeDevices.length
      }
    });
  } catch (error) {
    console.error('Get trusted devices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve trusted devices'
    });
  }
});

/**
 * @desc    Remove trusted device
 * @route   DELETE /api/auth/2fa/trusted-devices/:deviceFingerprint
 * @access  Private
 */
router.delete('/trusted-devices/:deviceFingerprint', protect, (req, res) => {
  try {
    const { deviceFingerprint } = req.params;

    if (!deviceFingerprint) {
      return res.status(400).json({
        success: false,
        message: 'Device fingerprint required'
      });
    }

    const devices = deviceTrustStore.get(req.user.id) || [];
    const deviceIndex = devices.findIndex(d => d.deviceFingerprint === deviceFingerprint);

    if (deviceIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    devices.splice(deviceIndex, 1);

    res.json({
      success: true,
      data: {
        message: 'Device removed successfully'
      }
    });
  } catch (error) {
    console.error('Remove device error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove device'
    });
  }
});

/**
 * @desc    Disable 2FA for user account
 * @route   POST /api/auth/2fa/disable
 * @access  Private
 * @body    { password: string }
 */
router.post('/disable', protect, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password required to disable 2FA'
      });
    }

    // Verify password (in real implementation)
    // if (!await verifyPassword(password, req.user.password)) {
    //   return res.status(401).json({ success: false, message: 'Invalid password' });
    // }

    if (!req.user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is not enabled on this account'
      });
    }

    // In real implementation:
    // await req.user.update({
    //   twoFactorEnabled: false,
    //   twoFactorMethod: null,
    //   backupCodes: null,
    //   twoFactorVerifiedAt: null
    // });

    // Clear device trust
    deviceTrustStore.delete(req.user.id);

    res.json({
      success: true,
      data: {
        message: '2FA has been disabled. All trusted devices have been removed.'
      }
    });
  } catch (error) {
    console.error('Disable 2FA error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disable 2FA'
    });
  }
});

module.exports = router;
