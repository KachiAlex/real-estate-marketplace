/**
 * Notification Preferences & Alerts Routes - Phase 4.3
 * Manages user notification preferences, alerts, and smart notifications
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { errorLogger, infoLogger } = require('../config/logger');

// Mock preferences storage
const userPreferences = new Map();
const userAlerts = new Map();

// Default notification preferences
const getDefaultPreferences = () => ({
  emailNotifications: true,
  pushNotifications: true,
  smsNotifications: true,
  inAppNotifications: true,
  email: {
    enabled: true,
    frequency: 'daily', // instant, daily, weekly, never
    digest: true,
    categories: {
      propertyAlerts: true,
      priceChanges: true,
      messages: true,
      offers: true,
      escrow: true,
      marketing: false,
    },
  },
  push: {
    enabled: true,
    sound: true,
    vibration: true,
    badge: true,
    categories: {
      urgent: true,
      important: true,
      informational: true,
    },
  },
  sms: {
    enabled: false,
    frequency: 'never', // immediate, daily, never
    categories: {
      urgent: true,
      offers: true,
      escrow: true,
    },
  },
  doNotDisturb: {
    enabled: false,
    startTime: '22:00',
    endTime: '08:00',
    timezone: 'UTC',
    muteAll: false,
  },
  unsubscribeAll: false,
});

/**
 * @route   GET /api/alerts-preferences
 * @desc    Get user's notification preferences
 * @access  Private
 */
router.get('/preferences', protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const preferences = userPreferences.get(userId) || getDefaultPreferences();

    infoLogger(`Fetched preferences for user ${userId}`);

    res.json({
      success: true,
      data: {
        userId,
        preferences,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    errorLogger('Failed to fetch preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification preferences',
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/alerts-preferences
 * @desc    Update user's notification preferences
 * @access  Private
 */
router.put('/preferences', protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const currentPrefs = userPreferences.get(userId) || getDefaultPreferences();
    const updatedPrefs = { ...currentPrefs, ...req.body };

    // Validate preferences
    if (updatedPrefs.email && updatedPrefs.email.frequency) {
      const validFrequencies = ['instant', 'daily', 'weekly', 'never'];
      if (!validFrequencies.includes(updatedPrefs.email.frequency)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email frequency',
        });
      }
    }

    // Validate do-not-disturb times
    if (updatedPrefs.doNotDisturb && updatedPrefs.doNotDisturb.enabled) {
      const timeRegex = /^\d{2}:\d{2}$/;
      if (!timeRegex.test(updatedPrefs.doNotDisturb.startTime) ||
          !timeRegex.test(updatedPrefs.doNotDisturb.endTime)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid time format. Use HH:MM',
        });
      }
    }

    userPreferences.set(userId, updatedPrefs);

    infoLogger(`Updated notification preferences for user ${userId}`);

    res.json({
      success: true,
      data: {
        userId,
        preferences: updatedPrefs,
        message: 'Notification preferences updated successfully',
      },
    });
  } catch (error) {
    errorLogger('Failed to update preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/alerts-preferences/alerts
 * @desc    Get user's active alerts
 * @access  Private
 */
router.get('/alerts', protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const alerts = userAlerts.get(userId) || {
      priceAlerts: [],
      propertyAlerts: [],
      keywordAlerts: [],
    };

    const activeAlerts = {
      priceAlerts: alerts.priceAlerts.filter(a => a.enabled),
      propertyAlerts: alerts.propertyAlerts.filter(a => a.enabled),
      keywordAlerts: alerts.keywordAlerts.filter(a => a.enabled),
    };

    res.json({
      success: true,
      data: {
        userId,
        alerts: activeAlerts,
        totalAlerts: activeAlerts.priceAlerts.length + activeAlerts.propertyAlerts.length + activeAlerts.keywordAlerts.length,
      },
    });
  } catch (error) {
    errorLogger('Failed to fetch alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alerts',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/alerts-preferences/alerts/price
 * @desc    Create a price change alert
 * @access  Private
 * @body    propertyId, threshold (percentage), notificationChannels
 */
router.post('/alerts/price', protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { propertyId, threshold = 5, notificationChannels = ['email', 'push'] } = req.body;

    if (!propertyId) {
      return res.status(400).json({
        success: false,
        message: 'Property ID is required',
      });
    }

    if (threshold < 1 || threshold > 100) {
      return res.status(400).json({
        success: false,
        message: 'Threshold must be between 1 and 100',
      });
    }

    const alerts = userAlerts.get(userId) || {
      priceAlerts: [],
      propertyAlerts: [],
      keywordAlerts: [],
    };

    const alertId = `price_${propertyId}_${Date.now()}`;

    const priceAlert = {
      alertId,
      propertyId,
      threshold,
      notificationChannels,
      enabled: true,
      createdAt: new Date(),
      triggeredCount: 0,
      lastTriggered: null,
    };

    alerts.priceAlerts.push(priceAlert);
    userAlerts.set(userId, alerts);

    infoLogger(`Price alert created for property ${propertyId} (${threshold}% threshold)`);

    res.json({
      success: true,
      data: {
        alertId,
        propertyId,
        threshold,
        message: 'Price alert created successfully',
      },
    });
  } catch (error) {
    errorLogger('Failed to create price alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create price alert',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/alerts-preferences/alerts/property
 * @desc    Create a property search alert (new listings matching criteria)
 * @access  Private
 * @body    criteria (location, type, minPrice, maxPrice, etc), alertName
 */
router.post('/alerts/property', protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { criteria, alertName = null } = req.body;

    if (!criteria || Object.keys(criteria).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search criteria is required',
      });
    }

    const alerts = userAlerts.get(userId) || {
      priceAlerts: [],
      propertyAlerts: [],
      keywordAlerts: [],
    };

    const alertId = `property_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const propertyAlert = {
      alertId,
      name: alertName || `Alert for ${criteria.location || 'properties'}`,
      criteria,
      enabled: true,
      createdAt: new Date(),
      matchesFound: 0,
      lastMatch: null,
      frequency: 'daily', // daily, weekly, instant
    };

    alerts.propertyAlerts.push(propertyAlert);
    userAlerts.set(userId, alerts);

    infoLogger(`Property alert created: ${propertyAlert.name}`);

    res.json({
      success: true,
      data: {
        alertId,
        alertName: propertyAlert.name,
        criteria,
        frequency: propertyAlert.frequency,
        message: 'Property alert created successfully',
      },
    });
  } catch (error) {
    errorLogger('Failed to create property alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create property alert',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/alerts-preferences/alerts/keyword
 * @desc    Create a keyword-based alert
 * @access  Private
 * @body    keywords (array), frequency
 */
router.post('/alerts/keyword', protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { keywords = [], frequency = 'daily' } = req.body;

    if (!Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one keyword is required',
      });
    }

    const validFrequencies = ['instant', 'daily', 'weekly'];
    if (!validFrequencies.includes(frequency)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid frequency. Use: instant, daily, or weekly',
      });
    }

    const alerts = userAlerts.get(userId) || {
      priceAlerts: [],
      propertyAlerts: [],
      keywordAlerts: [],
    };

    const alertId = `keyword_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const keywordAlert = {
      alertId,
      keywords,
      frequency,
      enabled: true,
      createdAt: new Date(),
      matchesFound: 0,
      lastMatch: null,
    };

    alerts.keywordAlerts.push(keywordAlert);
    userAlerts.set(userId, alerts);

    infoLogger(`Keyword alert created: ${keywords.join(', ')}`);

    res.json({
      success: true,
      data: {
        alertId,
        keywords,
        frequency,
        message: 'Keyword alert created successfully',
      },
    });
  } catch (error) {
    errorLogger('Failed to create keyword alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create keyword alert',
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/alerts-preferences/alerts/:alertId
 * @desc    Delete an alert
 * @access  Private
 */
router.delete('/alerts/:alertId', protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { alertId } = req.params;

    const alerts = userAlerts.get(userId);
    if (!alerts) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }

    const allAlerts = [
      ...alerts.priceAlerts,
      ...alerts.propertyAlerts,
      ...alerts.keywordAlerts,
    ];

    const alertExists = allAlerts.some(a => a.alertId === alertId);
    if (!alertExists) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }

    alerts.priceAlerts = alerts.priceAlerts.filter(a => a.alertId !== alertId);
    alerts.propertyAlerts = alerts.propertyAlerts.filter(a => a.alertId !== alertId);
    alerts.keywordAlerts = alerts.keywordAlerts.filter(a => a.alertId !== alertId);

    userAlerts.set(userId, alerts);

    infoLogger(`Alert ${alertId} deleted for user ${userId}`);

    res.json({
      success: true,
      message: 'Alert deleted successfully',
    });
  } catch (error) {
    errorLogger('Failed to delete alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete alert',
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/alerts-preferences/alerts/:alertId/toggle
 * @desc    Enable/disable an alert
 * @access  Private
 */
router.put('/alerts/:alertId/toggle', protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { alertId } = req.params;

    const alerts = userAlerts.get(userId);
    if (!alerts) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }

    let foundAlert = null;
    let alertType = null;

    for (const alert of alerts.priceAlerts) {
      if (alert.alertId === alertId) {
        alert.enabled = !alert.enabled;
        foundAlert = alert;
        alertType = 'price';
        break;
      }
    }

    if (!foundAlert) {
      for (const alert of alerts.propertyAlerts) {
        if (alert.alertId === alertId) {
          alert.enabled = !alert.enabled;
          foundAlert = alert;
          alertType = 'property';
          break;
        }
      }
    }

    if (!foundAlert) {
      for (const alert of alerts.keywordAlerts) {
        if (alert.alertId === alertId) {
          alert.enabled = !alert.enabled;
          foundAlert = alert;
          alertType = 'keyword';
          break;
        }
      }
    }

    if (!foundAlert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }

    userAlerts.set(userId, alerts);

    infoLogger(`Alert ${alertId} toggled (enabled: ${foundAlert.enabled})`);

    res.json({
      success: true,
      data: {
        alertId,
        alertType,
        enabled: foundAlert.enabled,
        message: `Alert ${foundAlert.enabled ? 'enabled' : 'disabled'} successfully`,
      },
    });
  } catch (error) {
    errorLogger('Failed to toggle alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle alert',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/alerts-preferences/notification-channels
 * @desc    Get available notification channels and usage
 * @access  Private
 */
router.get('/notification-channels', protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const preferences = userPreferences.get(userId) || getDefaultPreferences();

    const channels = {
      email: {
        enabled: preferences.email.enabled,
        frequency: preferences.email.frequency,
        categories: preferences.email.categories,
      },
      push: {
        enabled: preferences.push.enabled,
        categories: preferences.push.categories,
        devicesRegistered: Math.floor(Math.random() * 3), // Mock value
      },
      sms: {
        enabled: preferences.sms.enabled,
        frequency: preferences.sms.frequency,
        categories: preferences.sms.categories,
      },
      inApp: {
        enabled: preferences.inAppNotifications,
      },
    };

    res.json({
      success: true,
      data: {
        userId,
        channels,
      },
    });
  } catch (error) {
    errorLogger('Failed to fetch notification channels:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification channels',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/alerts-preferences/test-notification
 * @desc    Send a test notification to user
 * @access  Private
 * @body    channel (email, push, sms)
 */
router.post('/test-notification', protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { channel = 'email' } = req.body;

    const validChannels = ['email', 'push', 'sms'];
    if (!validChannels.includes(channel)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid channel. Use: email, push, or sms',
      });
    }

    const preferences = userPreferences.get(userId) || getDefaultPreferences();

    // Check if channel is enabled
    const enabledKey = channel === 'sms' ? 'smsNotifications' : 
                       channel === 'push' ? 'pushNotifications' : 'emailNotifications';

    if (!preferences[enabledKey]) {
      return res.status(400).json({
        success: false,
        message: `${channel} notifications are disabled for your account`,
      });
    }

    infoLogger(`Test notification sent via ${channel} for user ${userId}`);

    const notificationId = `test_${channel}_${Date.now()}`;

    res.json({
      success: true,
      data: {
        notificationId,
        channel,
        message: `Test ${channel} notification sent successfully`,
        details: {
          type: 'test',
          timestamp: new Date().toISOString(),
          channel,
        },
      },
    });
  } catch (error) {
    errorLogger('Failed to send test notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification',
      error: error.message,
    });
  }
});

module.exports = router;
