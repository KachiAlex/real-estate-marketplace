/**
 * Reviews & Ratings Routes - Property Reviews, Ratings, and Verification
 * Endpoints for review management, rating calculations, and moderation
 */

const express = require('express');
const router = express.Router();
const ReviewService = require('../services/reviewService');
const { protect } = require('../middleware/auth');
const { errorLogger, infoLogger } = require('../config/logger');

/**
 * @route   POST /api/reviews/properties/:propertyId/reviews
 * @desc    Create a new review for a property
 * @access  Private
 * @body    rating, title, content, media
 */
router.post('/properties/:propertyId/reviews', protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { propertyId } = req.params;
    const { rating = 5, title = '', content = '', media = [] } = req.body;

    // Check if property exists (in production, verify with database)
    if (!propertyId || propertyId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Property ID is required',
      });
    }

    // Check verified purchase status
    const verifiedBadge = await ReviewService.getVerifiedPurchaseBadge(userId, propertyId);
    const verifiedPurchase = verifiedBadge.data.isVerified;

    const result = await ReviewService.createReview(propertyId, userId, {
      rating,
      title,
      content,
      verifiedPurchase,
      media,
    });

    infoLogger(`Review created for property ${propertyId} by user ${userId}`);

    res.status(201).json({
      success: true,
      data: result.data,
      message: 'Review created successfully',
    });
  } catch (error) {
    errorLogger('Create review error:', error);

    if (error.message.includes('already reviewed')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes('Rating must be')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create review',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/reviews/properties/:propertyId/reviews
 * @desc    Get all reviews for a property
 * @access  Public
 * @query   limit, offset, sortBy, rating
 */
router.get('/properties/:propertyId/reviews', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = Math.max(parseInt(req.query.offset) || 0, 0);
    const sortBy = req.query.sortBy || 'recent'; // recent, helpful, highest, lowest
    const ratingFilter = req.query.rating || null;

    const result = await ReviewService.getPropertyReviews(propertyId, {
      limit,
      offset,
      sortBy,
      ratingFilter,
    });

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    errorLogger('Get property reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/reviews/users/:userId/reviews
 * @desc    Get all reviews submitted by a user
 * @access  Public
 * @query   limit, offset
 */
router.get('/users/:userId/reviews', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const offset = Math.max(parseInt(req.query.offset) || 0, 0);

    const result = await ReviewService.getUserReviews(userId, { limit, offset });

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    errorLogger('Get user reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user reviews',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/reviews/properties/:propertyId/rating
 * @desc    Get rating summary for a property
 * @access  Public
 */
router.get('/properties/:propertyId/rating', async (req, res) => {
  try {
    const { propertyId } = req.params;

    const result = await ReviewService.getPropertyRating(propertyId);

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    errorLogger('Get property rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch property rating',
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/reviews/properties/:propertyId/reviews/:reviewId
 * @desc    Update a review
 * @access  Private (owner only)
 * @body    rating, title, content
 */
router.put('/properties/:propertyId/reviews/:reviewId', protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { propertyId, reviewId } = req.params;
    const { rating, title, content } = req.body;

    const result = await ReviewService.updateReview(propertyId, reviewId, userId, {
      rating,
      title,
      content,
    });

    infoLogger(`Review ${reviewId} updated by user ${userId}`);

    res.json({
      success: true,
      data: result.data,
      message: 'Review updated successfully',
    });
  } catch (error) {
    errorLogger('Update review error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes('only review author')) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update review',
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/reviews/properties/:propertyId/reviews/:reviewId
 * @desc    Delete a review
 * @access  Private (owner only)
 */
router.delete('/properties/:propertyId/reviews/:reviewId', protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { propertyId, reviewId } = req.params;

    const result = await ReviewService.deleteReview(propertyId, reviewId, userId);

    infoLogger(`Review ${reviewId} deleted by user ${userId}`);

    res.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    errorLogger('Delete review error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes('only review author')) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete review',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/reviews/properties/:propertyId/reviews/:reviewId/helpful
 * @desc    Mark review as helpful
 * @access  Public
 */
router.post('/properties/:propertyId/reviews/:reviewId/helpful', async (req, res) => {
  try {
    const { propertyId, reviewId } = req.params;

    const result = await ReviewService.markHelpful(propertyId, reviewId);

    res.json({
      success: true,
      data: result.data,
      message: 'Review marked as helpful',
    });
  } catch (error) {
    errorLogger('Mark helpful error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to mark review as helpful',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/reviews/properties/:propertyId/reviews/:reviewId/unhelpful
 * @desc    Mark review as unhelpful
 * @access  Public
 */
router.post('/properties/:propertyId/reviews/:reviewId/unhelpful', async (req, res) => {
  try {
    const { propertyId, reviewId } = req.params;

    const result = await ReviewService.markUnhelpful(propertyId, reviewId);

    res.json({
      success: true,
      data: result.data,
      message: 'Review marked as unhelpful',
    });
  } catch (error) {
    errorLogger('Mark unhelpful error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to mark review as unhelpful',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/reviews/properties/:propertyId/reviews/:reviewId/flag
 * @desc    Flag review as inappropriate
 * @access  Public
 * @body    reason
 */
router.post('/properties/:propertyId/reviews/:reviewId/flag', async (req, res) => {
  try {
    const { propertyId, reviewId } = req.params;
    const { reason = 'Inappropriate content' } = req.body;

    const result = await ReviewService.flagReview(propertyId, reviewId, reason);

    res.json({
      success: true,
      data: result.data,
      message: 'Review flagged successfully',
    });
  } catch (error) {
    errorLogger('Flag review error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to flag review',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/reviews/properties/:propertyId/reviews/:reviewId/reply
 * @desc    Add vendor reply to review
 * @access  Private (vendor only)
 * @body    text
 */
router.post('/properties/:propertyId/reviews/:reviewId/reply', protect, async (req, res) => {
  try {
    const vendorId = req.user.id || req.user._id;
    const { propertyId, reviewId } = req.params;
    const { text = '' } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Reply text is required',
      });
    }

    const result = await ReviewService.addReply(propertyId, reviewId, vendorId, text);

    infoLogger(`Reply added to review ${reviewId} by vendor ${vendorId}`);

    res.status(201).json({
      success: true,
      data: result.data,
      message: 'Reply added successfully',
    });
  } catch (error) {
    errorLogger('Add reply error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to add reply',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/reviews/properties/:propertyId/verified-purchase/:userId
 * @desc    Check verified purchase status
 * @access  Public
 */
router.get('/properties/:propertyId/verified-purchase/:userId', async (req, res) => {
  try {
    const { propertyId, userId } = req.params;

    const result = await ReviewService.getVerifiedPurchaseBadge(userId, propertyId);

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    errorLogger('Get verified purchase error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check verified purchase',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/reviews/verify-purchase
 * @desc    Set verified purchase status (admin/internal only)
 * @access  Private
 * @body    userId, propertyId, verified
 */
router.post('/verify-purchase', protect, async (req, res) => {
  try {
    const { userId, propertyId, verified } = req.body;

    if (!userId || !propertyId) {
      return res.status(400).json({
        success: false,
        message: 'userId and propertyId are required',
      });
    }

    const result = await ReviewService.setVerifiedPurchase(userId, propertyId, verified);

    infoLogger(`Verified purchase status set for user ${userId} on property ${propertyId}`);

    res.json({
      success: true,
      message: 'Verified purchase status updated',
    });
  } catch (error) {
    errorLogger('Set verified purchase error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update verified purchase',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/reviews/trending
 * @desc    Get trending reviews across all properties
 * @access  Public
 * @query   limit, minRating
 */
router.get('/trending', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const minRating = Math.max(parseInt(req.query.minRating) || 4, 1);

    const result = await ReviewService.getTrendingReviews({ limit, minRating });

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    errorLogger('Get trending reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending reviews',
      error: error.message,
    });
  }
});

module.exports = router;
