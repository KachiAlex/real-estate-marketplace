const SubscriptionService = require('../services/subscriptionService');
const { response } = require('express');

// Middleware to check if vendor has active subscription
const requireActiveSubscription = (req, res, next) => {
  return async (req, res, next) => {
    try {
      // Skip check for non-vendors
      if (!req.user || (!req.user.roles.includes('vendor') && req.user.role !== 'vendor')) {
        return next();
      }

      const subscriptionStatus = await SubscriptionService.getSubscriptionStatus(req.user.id);
      
      // Allow access if subscription is active or in trial
      if (subscriptionStatus.canAccess) {
        req.subscriptionStatus = subscriptionStatus;
        return next();
      }

      // Block access if subscription is expired or suspended
      return res.status(403).json({
        success: false,
        message: 'Access denied. Your subscription is not active.',
        data: {
          status: subscriptionStatus.status,
          needsPayment: subscriptionStatus.needsPayment,
          message: subscriptionStatus.message
        }
      });
    } catch (error) {
      console.error('Subscription middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking subscription status'
      });
    }
  };
};

// Middleware to check subscription status and add to request
const checkSubscriptionStatus = async (req, res, next) => {
  try {
    // Skip check for non-vendors
    if (!req.user || (!req.user.roles.includes('vendor') && req.user.role !== 'vendor')) {
      return next();
    }

    const subscriptionStatus = await SubscriptionService.getSubscriptionStatus(req.user.id);
    req.subscriptionStatus = subscriptionStatus;
    
    next();
  } catch (error) {
    console.error('Subscription status check error:', error);
    next(); // Continue even if check fails
  }
};

// Middleware to warn vendors about expiring trials
const warnExpiringTrial = (req, res, next) => {
  return async (req, res, next) => {
    try {
      // Skip check for non-vendors
      if (!req.user || (!req.user.roles.includes('vendor') && req.user.role !== 'vendor')) {
        return next();
      }

      const subscriptionStatus = await SubscriptionService.getSubscriptionStatus(req.user.id);
      
      // Add warning to response headers if trial is expiring soon
      if (subscriptionStatus.status === 'trial' && subscriptionStatus.trialDaysRemaining <= 7) {
        res.set('X-Subscription-Warning', subscriptionStatus.message);
        res.set('X-Trial-Days-Remaining', subscriptionStatus.trialDaysRemaining.toString());
      }
      
      req.subscriptionStatus = subscriptionStatus;
      next();
    } catch (error) {
      console.error('Trial warning middleware error:', error);
      next();
    }
  };
};

// Middleware to limit actions based on subscription tier
const requireSubscriptionTier = (requiredFeatures = []) => {
  return async (req, res, next) => {
    try {
      // Skip check for non-vendors
      if (!req.user || (!req.user.roles.includes('vendor') && req.user.role !== 'vendor')) {
        return next();
      }

      const subscription = await SubscriptionService.getVendorSubscription(req.user.id);
      
      if (!subscription) {
        return res.status(403).json({
          success: false,
          message: 'No subscription found'
        });
      }

      // Check if subscription has required features
      const plan = subscription.planDetails;
      if (!plan) {
        return res.status(403).json({
          success: false,
          message: 'Subscription plan not found'
        });
      }

      const hasRequiredFeatures = requiredFeatures.every(feature => {
        return plan.features && plan.features[feature] === true;
      });

      if (!hasRequiredFeatures) {
        return res.status(403).json({
          success: false,
          message: 'Your subscription plan does not support this feature',
          data: {
            requiredFeatures,
            availableFeatures: plan.features || {}
          }
        });
      }

      req.subscription = subscription;
      next();
    } catch (error) {
      console.error('Subscription tier check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking subscription tier'
      });
    }
  };
};

// Middleware to check if vendor can add properties
const canAddProperty = async (req, res, next) => {
  try {
    // Skip check for non-vendors
    if (!req.user || (!req.user.roles.includes('vendor') && req.user.role !== 'vendor')) {
      return next();
    }

    const subscriptionStatus = await SubscriptionService.getSubscriptionStatus(req.user.id);
    
    // Check if vendor can access the platform
    if (!subscriptionStatus.canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Cannot add properties. Your subscription is not active.',
        data: {
          status: subscriptionStatus.status,
          needsPayment: subscriptionStatus.needsPayment,
          message: subscriptionStatus.message
        }
      });
    }

    // Check property limits (if applicable)
    const subscription = await SubscriptionService.getVendorSubscription(req.user.id);
    if (subscription && subscription.planDetails) {
      const features = subscription.planDetails.features;
      
      // If there's a limit on properties
      if (features.max_properties && features.max_properties > 0) {
        const currentPropertyCount = await require('../config/sequelizeDb').Property.count({
          where: { ownerId: req.user.id }
        });

        if (currentPropertyCount >= features.max_properties) {
          return res.status(403).json({
            success: false,
            message: `Property limit reached. Your plan allows ${features.max_properties} properties.`,
            data: {
              currentCount: currentPropertyCount,
              maxAllowed: features.max_properties
            }
          });
        }
      }
    }

    next();
  } catch (error) {
    console.error('Property addition check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking property permissions'
    });
  }
};

module.exports = {
  requireActiveSubscription,
  checkSubscriptionStatus,
  warnExpiringTrial,
  requireSubscriptionTier,
  canAddProperty
};
