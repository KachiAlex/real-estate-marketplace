'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const PropertyArkAI = require('../services/propertyArkAI');
const { optionalAuth } = require('../middleware/auth');
const { createLogger } = require('../config/logger');

const router = express.Router();
const logger = createLogger('AssistantRoutes');

// Per-IP limiter to avoid abuse of the AI endpoint
const assistantLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: parseInt(process.env.ASSISTANT_RATE_LIMIT || '30', 10),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV !== 'production' && req.ip?.startsWith('127.'),
  message: {
    success: false,
    error: 'Too many assistant requests. Please wait a moment and try again.'
  }
});

const maskUser = (user) => {
  if (!user) return null;
  return {
    id: user.id || user.userId || user.email,
    email: user.email,
    role: user.activeRole || user.role,
    firstName: user.firstName,
    lastName: user.lastName
  };
};

router.post('/message', assistantLimiter, optionalAuth, async (req, res) => {
  try {
    const { message, context = {} } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    const assistant = new PropertyArkAI();
    assistant.setContext({
      user: maskUser(req.user),
      currentPage: context.currentPage || null,
      lastAction: context.lastAction || null,
      conversationHistory: Array.isArray(context.conversationHistory)
        ? context.conversationHistory.slice(-10)
        : []
    });

    const response = assistant.generateResponse(message, {
      currentPage: context.currentPage || null,
      lastAction: context.lastAction || null
    });

    logger.info('Assistant response generated', {
      hasAction: Boolean(response?.action),
      userId: req.user?.id || null,
      currentPage: context.currentPage || null
    });

    return res.json({
      success: true,
      data: {
        response: response?.response || response,
        action: response?.action || null,
        entities: response?.entities || {},
        outOfScope: Boolean(response?.outOfScope),
        topics: response?.topics || null
      }
    });
  } catch (error) {
    logger.error('Assistant error', error);
    return res.status(500).json({
      success: false,
      error: 'Unable to process your request right now. Please try again later.'
    });
  }
});

module.exports = router;
